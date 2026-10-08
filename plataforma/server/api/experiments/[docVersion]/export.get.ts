// Exportação (AC 3.4): longo/tidy, íntegro, ZERO PII (só pseudônimo) e
// RBAC server-side — só o dono do experimento (ou admin) exporta.
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const docVersion = getRouterParam(event, 'docVersion')!
  const format = String(getQuery(event).format ?? 'csv')
  if (format !== 'csv' && format !== 'json') {
    throw createError({ statusCode: 422, statusMessage: 'format deve ser csv ou json' })
  }
  // CAP-4 mínimo (F5.1): filtro por classe de respondente (human|synthetic)
  const respondentClass = String(getQuery(event).respondent_class ?? '')
  if (respondentClass && respondentClass !== 'human' && respondentClass !== 'synthetic') {
    throw createError({ statusCode: 422, statusMessage: 'respondent_class deve ser human, synthetic ou vazio' })
  }

  const sql = useDb()
  const [doc] = await sql`SELECT owner_user_id::text AS owner FROM experiment_docs WHERE doc_version::text = ${docVersion}`
  if (!doc) throw createError({ statusCode: 404, statusMessage: 'documento não encontrado' })
  if (doc.owner !== user.id && user.role !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: 'só o dono (ou admin) exporta' })
  }

  const sessions = await sql`
    SELECT id::text, pseudonym, doc_version::text AS doc_version, seed, status, created_at
    FROM sessions WHERE doc_version::text = ${docVersion}
      ${respondentClass ? sql`AND respondent = ${respondentClass}` : sql``}
    ORDER BY created_at`
  const bySession = new Map(sessions.map(s => [s.id, s]))
  const results = await sql`
    SELECT r.session_id::text AS session_id, r.trial_seq, r.payload, r.ingested_at
    FROM trial_results r JOIN sessions s ON s.id = r.session_id
    WHERE s.doc_version::text = ${docVersion}
    ORDER BY s.created_at, r.trial_seq`

  const rows = results.map(r => buildExportRow(
    {
      sessionId: r.session_id,
      pseudonym: bySession.get(r.session_id)!.pseudonym as string,
      docVersion,
      seed: bySession.get(r.session_id)!.seed as number,
      status: bySession.get(r.session_id)!.status as string,
      createdAt: String(bySession.get(r.session_id)!.created_at),
    },
    r.payload as import('@core/schema').TrialResult,
    String(r.ingested_at),
  ))

  setHeader(event, 'content-disposition', `attachment; filename="export-${docVersion}.${format}"`)
  if (format === 'json') {
    setHeader(event, 'content-type', 'application/json')
    return rows
  }
  setHeader(event, 'content-type', 'text/csv; charset=utf-8')
  return rowsToCsv(rows)
})
