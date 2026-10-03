// Criação de sessão F0 (sem auth/consentimento ainda — Epic 2 os acrescenta).
// Retorna o token de upload efêmero (AD-11) que autentica o batch final.
export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, b =>
    typeof b === 'object' && b !== null && typeof (b as Record<string, unknown>).docVersion === 'string')

  const { docVersion } = body as { docVersion: string }
  const seed = Number((body as Record<string, unknown>).seed ?? 42)
  if (!Number.isInteger(seed)) {
    throw createError({ statusCode: 422, statusMessage: 'seed deve ser inteiro' })
  }

  const config = useRuntimeConfig()
  const secret = config.uploadTokenSecret ?? 'dev-only-secret'

  const rows = await useDb()`
    INSERT INTO sessions (doc_version, seed, respondent)
    VALUES (${docVersion}, ${seed}, 'human')
    RETURNING id`
  const sessionId = rows[0]!.id as string

  const { token, expiresAt } = issueUploadToken(sessionId, secret, 6 * 3600)
  return { sessionId, uploadToken: token, expiresAt: new Date(expiresAt).toISOString() }
})
