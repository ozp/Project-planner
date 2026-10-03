// Submissão de experimento (Story 1.6, AD-4/AD-9): multipart com
// `document` (JSON) + um arquivo por ref de estímulo.
// Válido → docVersion imutável (UUIDv7 do banco) + assets content-addressed
// (sha1). Mesmo conteúdo reenviado = mesmo docVersion (idempotente).
import { createHash } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { validateExperimentDocument, collectExperimentRefs } from '@core/schema'
import type { ExperimentDocument } from '@core/schema'

const EXT_MIME: Record<string, string> = {
  svg: 'image/svg+xml', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp',
  wav: 'audio/wav', mp3: 'audio/mpeg', ogg: 'audio/ogg',
}

export default defineEventHandler(async (event) => {
  // AC 2.1/2.6: pesquisador pendente não publica experimento — exige
  // researcher aprovado ou admin
  const user = await requireUser(event)
  if (!((user.role === 'researcher' && user.status === 'active') || user.role === 'admin')) {
    throw createError({ statusCode: 403, statusMessage: 'requer pesquisador aprovado (ou admin)' })
  }

  const form = await readMultipartFormData(event)
  if (!form) throw createError({ statusCode: 422, statusMessage: 'envie multipart/form-data com o campo `document` e os arquivos de estímulo' })

  const docPart = form.find(p => p.name === 'document' || p.filename?.endsWith('.json'))
  if (!docPart?.data) throw createError({ statusCode: 422, statusMessage: 'campo `document` (JSON) ausente' })

  let doc: ExperimentDocument
  try {
    doc = JSON.parse(docPart.data.toString('utf8')) as ExperimentDocument
  } catch (e) {
    throw createError({ statusCode: 422, statusMessage: `document não é JSON válido: ${String(e)}` })
  }

  // Na submissão o autor ainda não conhece o docVersion (o banco atribui).
  // Placeholder apenas para o contrato; o valor real entra na gravação e o
  // hash de idempotência normaliza docVersion='' de qualquer forma.
  if (!doc.docVersion) doc = { ...doc, docVersion: 'submission' }

  // AC: erro acionável apontando o campo
  const v = validateExperimentDocument(doc)
  if (!v.ok) throw createError({ statusCode: 422, statusMessage: `documento inválido — ${v.errors.join(' | ')}` })

  const refs = collectExperimentRefs(doc)
  const files = new Map<string, { data: Buffer, filename: string }>()
  for (const part of form) {
    if (part.name === 'document' || !part.filename) continue
    files.set(part.filename, { data: Buffer.from(part.data), filename: part.filename })
  }
  const missing = refs.filter(r => !files.has(r))
  if (missing.length > 0) {
    throw createError({ statusCode: 422, statusMessage: `arquivos ausentes para as refs: ${missing.join(', ')}` })
  }
  const extra = [...files.keys()].filter(f => !refs.includes(f))
  if (extra.length > 0) {
    throw createError({ statusCode: 422, statusMessage: `arquivos não referenciados pelo documento: ${extra.join(', ')}` })
  }

  // assets content-addressed (AD-9): sha1 no nome, dedup natural
  const assetsDir = process.env.ASSETS_DIR ?? join(process.cwd(), 'data', 'assets')
  await mkdir(assetsDir, { recursive: true })
  const refToSha1 = new Map<string, string>()
  for (const [ref, { data }] of files) {
    const sha1 = createHash('sha1').update(data).digest('hex')
    await writeFile(join(assetsDir, sha1), data)
    refToSha1.set(ref, sha1)
  }

  // documento idempotente por conteúdo (mesmo JSON+assets = mesmo docVersion)
  const docForHash = { ...doc, docVersion: '' } // docVersion não assina o conteúdo
  const contentSha1 = createHash('sha1')
    .update(JSON.stringify(docForHash))
    .update([...refToSha1.keys()].sort().map(r => `${r}:${refToSha1.get(r)}`).join('\n'))
    .digest('hex')

  const sql = useDb()
  const result = await sql.begin(async tx => {
    const existing = await tx`SELECT doc_version FROM experiment_docs WHERE content_sha1 = ${contentSha1}`
    if (existing.length > 0) {
      return { docVersion: existing[0]!.doc_version as string, status: 'unchanged' as const }
    }
    // UUIDv7 gerado pelo banco (convenção do spine) para o documento carregar
    // o próprio docVersion — gravado imutável desde o primeiro byte
    const [{ id: newVersion }] = await tx`SELECT uuidv7()::text AS id`
    const finalDoc = { ...doc, docVersion: newVersion as string }
    await tx`
      INSERT INTO experiment_docs (doc_version, document, content_sha1)
      VALUES (${newVersion}::uuid, ${sql.json(finalDoc)}, ${contentSha1})`
    for (const [ref, sha1] of refToSha1) {
      const ext = ref.split('.').pop()!.toLowerCase()
      const mime = EXT_MIME[ext]
      if (!mime) throw createError({ statusCode: 422, statusMessage: `extensão não suportada: .${ext} (${ref})` })
      const f = files.get(ref)!
      await tx`
        INSERT INTO stimulus_assets (sha1, content_type, size_bytes)
        VALUES (${sha1}, ${mime}, ${f.data.byteLength})
        ON CONFLICT (sha1) DO NOTHING`
      await tx`
        INSERT INTO experiment_assets (doc_version, ref, sha1)
        VALUES (${newVersion}::uuid, ${ref}, ${sha1})
        ON CONFLICT DO NOTHING`
    }
    return { docVersion: newVersion as string, status: 'created' as const }
  })

  setResponseStatus(event, result.status === 'created' ? 201 : 200)
  return result
})
