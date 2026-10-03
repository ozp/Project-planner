// Catálogo (AC 3.3): experimentos publicados visíveis a qualquer usuário
// logado; pesquisador/admin vê também os próprios não publicados (flag).
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const sql = useDb()
  const isStaff = user.role === 'researcher' || user.role === 'admin'
  const rows = await sql`
    SELECT d.doc_version::text AS doc_version,
           d.document->>'title' AS title,
           d.document->>'description' AS description,
           d.published,
           d.published_at,
           (SELECT count(*)::int FROM sessions s WHERE s.doc_version = d.doc_version::text) AS session_count,
           (SELECT max(version) FROM consent_terms t WHERE t.doc_version = d.doc_version) AS term_version
    FROM experiment_docs d
    WHERE d.published OR (${isStaff} AND (d.owner_user_id::text = ${user.id} OR ${user.role === 'admin'}))
    ORDER BY d.published DESC, d.created_at DESC`
  return { experiments: rows }
})
