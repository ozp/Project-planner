// Painel do pesquisador (AC 3.3 — acompanhamento básico): meus
// experimentos com contagem de sessões por status.
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  if (!(user.role === 'researcher' || user.role === 'admin')) {
    throw createError({ statusCode: 403, statusMessage: 'área do pesquisador' })
  }
  const sql = useDb()
  const mine = user.role === 'admin' ? null : user.id
  const rows = await sql`
    SELECT d.doc_version::text AS doc_version,
           d.document->>'title' AS title,
           d.published,
           (SELECT count(*)::int FROM sessions s WHERE s.doc_version = d.doc_version::text) AS sessions_total,
           (SELECT count(*)::int FROM sessions s WHERE s.doc_version = d.doc_version::text AND s.status = 'closed') AS sessions_closed,
           (SELECT count(*)::int FROM trial_results r JOIN sessions s ON s.id = r.session_id
             WHERE s.doc_version = d.doc_version::text) AS trials,
           (SELECT max(version) FROM consent_terms t WHERE t.doc_version = d.doc_version) AS term_version
    FROM experiment_docs d
    WHERE ${mine}::text IS NULL OR d.owner_user_id::text = ${mine}
    ORDER BY d.created_at DESC`
  return { experiments: rows }
})
