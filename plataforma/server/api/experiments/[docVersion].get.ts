// Carga de um experimento submetido (AD-7): documento pinado + manifest
// com URLs do servidor — uma única request antes de executar.
import type { ExperimentDocument } from '@core/schema'

export default defineEventHandler(async (event) => {
  const docVersion = getRouterParam(event, 'docVersion')!
  const sql = useDb()
  const rows = await sql`
    SELECT d.document, (
      SELECT jsonb_agg(jsonb_build_object('ref', a.ref, 'url', '/api/assets/' || a.ref))
      FROM experiment_assets a WHERE a.doc_version = d.doc_version
    ) AS assets
    FROM experiment_docs d
    WHERE d.doc_version::text = ${docVersion}`
  if (rows.length === 0) {
    throw createError({ statusCode: 404, statusMessage: `documento ${docVersion} não encontrado` })
  }
  const document = rows[0]!.document as ExperimentDocument
  return {
    document,
    manifest: (rows[0]!.assets as { ref: string, url: string }[] | null)?.map(a => a.url) ?? [],
    assets: rows[0]!.assets ?? [],
  }
})
