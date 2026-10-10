// Serve o asset de um documento pela REF LÓGICA (AD-10: resolução só via
// registro do documento — nunca caminho direto do cliente).
import { createReadStream } from 'node:fs'
import { mkdir, stat, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

export default defineEventHandler(async (event) => {
  const ref = getRouterParam(event, 'ref')!
  if (!/^[a-z0-9][a-z0-9._-]*$/.test(ref)) {
    throw createError({ statusCode: 400, statusMessage: 'ref inválida' })
  }
  const docVersion = getQuery(event).doc as string | undefined
  const sql = useDb()
  const rows = docVersion
    ? await sql`SELECT a.sha1, s.content_type FROM experiment_assets a
        JOIN stimulus_assets s ON s.sha1 = a.sha1
        WHERE a.ref = ${ref} AND a.doc_version::text = ${docVersion}`
    : await sql`SELECT a.sha1, MAX(s.content_type) AS content_type,
               MAX(CASE WHEN s.bytes IS NOT NULL THEN 1 ELSE 0 END) AS tem_bytes
        FROM experiment_assets a
        JOIN stimulus_assets s ON s.sha1 = a.sha1
        WHERE a.ref = ${ref}
        GROUP BY a.sha1
        ORDER BY tem_bytes DESC, count(*) DESC
        LIMIT 1`
  if (rows.length === 0) throw createError({ statusCode: 404, statusMessage: `asset não encontrado: ${ref}` })

  const { sha1, content_type: contentType } = rows[0]!
  const assetsDir = process.env.ASSETS_DIR ?? join(process.cwd(), 'data', 'assets')
  const path = join(assetsDir, sha1 as string)
  // content-type explícito: sendStream não o infere (3º arg é status), e SVG
  // sem image/svg+xml é recusado como <img> pelo navegador (quebra o preload)
  setResponseHeader(event, 'content-type', contentType as string)
  try {
    await stat(path)
    return sendStream(event, createReadStream(path))
  } catch {
    // disco volátil (deploy recria o container): reconstrói o arquivo a partir
    // do banco e responde pelo mesmo sendStream — resposta byte-idêntica ao
    // caminho original (elementos <audio>/<img> do jsPsych exigem) e o disco
    // vira cache autorrepovoador a cada deploy
    const [row] = await useDb()`SELECT bytes FROM stimulus_assets WHERE sha1 = ${sha1}`
    if (!row?.bytes) {
      throw createError({ statusCode: 500, statusMessage: 'binário do asset ausente no storage' })
    }
    await mkdir(assetsDir, { recursive: true }) // container novo: data/assets pode não existir
    const buf = Buffer.from(row.bytes as Uint8Array)
    await writeFile(path, buf)
    // length explícito: resposta chunked empaca o preload de <audio> do jsPsych
    setResponseHeader(event, 'content-length', String(buf.byteLength))
    return sendStream(event, createReadStream(path))
  }
})
