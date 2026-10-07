// Persistência idempotente do documento do experimento (extraída da
// submissão Story 1.6 para a Fase C reutilizar): mesmo conteúdo (JSON +
// mapa ref→sha1) = mesmo docVersion. O docVersion real (UUIDv7 do banco) é
// gravado dentro do documento desde o primeiro byte (AD-4: imutável).
import { createHash } from 'node:crypto'
import type postgres from 'postgres'
import type { ExperimentDocument } from '@core/schema'

type Db = ReturnType<typeof postgres>

export function contentHashOf(doc: ExperimentDocument, refToSha1: Map<string, string>): string {
  const docForHash = { ...doc, docVersion: '' } // docVersion não assina o conteúdo
  return createHash('sha1')
    .update(JSON.stringify(docForHash))
    .update([...refToSha1.keys()].sort().map(r => `${r}:${refToSha1.get(r)}`).join('\n'))
    .digest('hex')
}

export async function persistExperimentDoc(
  sql: Db,
  input: { doc: ExperimentDocument; refToSha1: Map<string, string>; ownerId: string },
): Promise<{ docVersion: string; status: 'created' | 'unchanged' }> {
  const contentSha1 = contentHashOf(input.doc, input.refToSha1)
  return sql.begin(async (tx) => {
    const existing = await tx`SELECT doc_version::text AS v FROM experiment_docs WHERE content_sha1 = ${contentSha1}`
    if (existing.length > 0) {
      return { docVersion: existing[0]!.v, status: 'unchanged' as const }
    }
    const [{ id: newVersion }] = await tx`SELECT uuidv7()::text AS id`
    const finalDoc = { ...input.doc, docVersion: newVersion }
    await tx`
      INSERT INTO experiment_docs (doc_version, document, content_sha1, owner_user_id)
      VALUES (${newVersion}::uuid, ${sql.json(finalDoc)}, ${contentSha1}, ${input.ownerId}::uuid)`
    for (const [ref, sha1] of input.refToSha1) {
      await tx`
        INSERT INTO experiment_assets (doc_version, ref, sha1)
        VALUES (${newVersion}::uuid, ${ref}, ${sha1})
        ON CONFLICT DO NOTHING`
    }
    return { docVersion: newVersion, status: 'created' as const }
  })
}
