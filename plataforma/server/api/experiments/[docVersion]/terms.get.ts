// Termo vigente (maior versão) do experimento — a página o exibe antes de rodar.
export default defineEventHandler(async (event) => {
  const docVersion = getRouterParam(event, 'docVersion')!
  const sql = useDb()
  const rows = await sql`
    SELECT id, version, body FROM consent_terms
    WHERE doc_version::text = ${docVersion}
    ORDER BY version DESC LIMIT 1`
  if (rows.length === 0) throw createError({ statusCode: 404, statusMessage: 'sem termo publicado para este experimento' })
  return rows[0]
})
