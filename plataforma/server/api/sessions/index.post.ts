// Criação de sessão (AC 2.2/2.3): exige usuário ativo + aceite do TERMO
// VIGENTE do documento (AD-9) — a constraint do banco rejeita sessão humana
// sem termo. Emite pseudônimo por experimento (AD-6) e token de upload (AD-11).
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const body = await readValidatedBody(event, b =>
    typeof b === 'object' && b !== null && typeof (b as Record<string, unknown>).docVersion === 'string')
  const { docVersion } = body as { docVersion: string }
  const seed = Number((body as Record<string, unknown>).seed ?? 42)
  if (!Number.isInteger(seed)) {
    throw createError({ statusCode: 422, statusMessage: 'seed deve ser inteiro' })
  }

  const sql = useDb()

  // gate de consentimento: termo vigente + aceite registrado por ESTE usuário
  const [term] = await sql`
    SELECT t.id, t.version, (
      SELECT 1 FROM consent_acceptances a WHERE a.term_id = t.id AND a.user_id::text = ${user.id}
    ) AS accepted
    FROM consent_terms t
    WHERE t.doc_version::text = ${docVersion}
    ORDER BY t.version DESC LIMIT 1`
  if (!term) {
    throw createError({ statusCode: 403, statusMessage: 'experimento sem termo de consentimento publicado' })
  }
  if (!term.accepted) {
    throw createError({ statusCode: 403, statusMessage: `consentimento requerido — aceite a versão ${term.version} do termo antes de iniciar` })
  }

  // pseudônimo por experimento (AD-6): mapping segregado, criado uma vez
  const secret = useRuntimeConfig().uploadTokenSecret ?? 'dev-only-secret'
  const pseudonym = derivePseudonym(user.id, docVersion, secret)
  await sql`
    INSERT INTO anonymized_ids (user_id, doc_version, pseudonym)
    VALUES (${user.id}::uuid, ${docVersion}::uuid, ${pseudonym})
    ON CONFLICT DO NOTHING`

  const rows = await sql`
    INSERT INTO sessions (doc_version, seed, respondent, user_id, consent_term_id, pseudonym)
    VALUES (${docVersion}, ${seed}, 'human', ${user.id}::uuid, ${term.id}::uuid, ${pseudonym})
    RETURNING id`
  const sessionId = rows[0]!.id as string

  const { token, expiresAt } = issueUploadToken(sessionId, secret, 6 * 3600)
  return { sessionId, uploadToken: token, expiresAt: new Date(expiresAt).toISOString() }
})
