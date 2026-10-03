// Termos de consentimento versionados por experimento (AD-9).
// Nova versão = apenas novas sessões exigem o novo aceite (as antigas
// preservam o termo pinado na criação).
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  if (!((user.role === 'researcher' && user.status === 'active') || user.role === 'admin')) {
    throw createError({ statusCode: 403, statusMessage: 'requer pesquisador aprovado (ou admin)' })
  }
  const docVersion = getRouterParam(event, 'docVersion')!
  const body = await readValidatedBody(event, b => typeof b === 'object' && b !== null && typeof (b as Record<string, unknown>).body === 'string')
  const termBody = (body as { body: string }).body
  if (termBody.trim().length < 20) {
    throw createError({ statusCode: 422, statusMessage: 'termo muito curto' })
  }
  const sql = useDb()
  const exists = await sql`SELECT 1 FROM experiment_docs WHERE doc_version::text = ${docVersion}`
  if (exists.length === 0) throw createError({ statusCode: 404, statusMessage: 'documento não encontrado' })
  const rows = await sql`
    INSERT INTO consent_terms (doc_version, version, body)
    VALUES (${docVersion}::uuid, (SELECT COALESCE(MAX(version), 0) + 1 FROM consent_terms WHERE doc_version::text = ${docVersion}), ${termBody})
    RETURNING id, version`
  setResponseStatus(event, 201)
  return { id: rows[0]!.id, version: rows[0]!.version }
})
