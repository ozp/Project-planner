// Login (AC 2.1): cookie httpOnly de sessão opaca; admin com MFA ativado
// só entra apresentando o código TOTP (AD-12). Rate limit agressivo.
export default defineEventHandler(async (event) => {
  const rl = rateLimit(`login:${clientIp(event)}`, 10, 10 * 60 * 1000)
  if (!rl.ok) throw createError({ statusCode: 429, statusMessage: `muitas tentativas — tente em ${rl.retryAfterSec}s` })

  const body = await readValidatedBody(event, b =>
    typeof b === 'object' && b !== null
    && typeof (b as Record<string, unknown>).email === 'string'
    && typeof (b as Record<string, unknown>).password === 'string')
  const { email, password } = body as { email: string, password: string }
  const totpCode = (body as Record<string, unknown>).totp

  const sql = useDb()
  const rows = await sql`SELECT id, email, password_hash, role, status, totp_secret_enc FROM user_accounts WHERE email = ${email}`
  if (rows.length === 0) {
    await verifyPassword('$argon2id$v=19$m=65536,t=2,p=1$decoy$decoy', password) // timing constante
    throw createError({ statusCode: 401, statusMessage: 'credenciais inválidas' })
  }
  const u = rows[0]!

  if (!(await verifyPassword(u.password_hash as string, password))) {
    throw createError({ statusCode: 401, statusMessage: 'credenciais inválidas' })
  }
  if (u.status === 'suspended') {
    throw createError({ statusCode: 403, statusMessage: 'conta suspensa' })
  }

  // MFA (AD-12): admin com TOTP ativado exige código válido
  if (u.totp_secret_enc) {
    if (typeof totp !== 'string' || !/^\d{6}$/.test(totpCode as string)) {
      throw createError({ statusCode: 401, statusMessage: 'código MFA (TOTP) necessário' })
    }
    const secret = useRuntimeConfig().uploadTokenSecret ?? 'dev-only-secret'
    if (!verifyTotp(decryptSecret(u.totp_secret_enc as Buffer, secret), totpCode as string)) {
      throw createError({ statusCode: 401, statusMessage: 'código MFA inválido' })
    }
  }

  const { token, tokenHash } = newSessionToken()
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 3600 * 1000)
  await sql`INSERT INTO user_sessions (token_hash, user_id, expires_at) VALUES (${tokenHash}, ${u.id}, ${expiresAt})`
  setSessionCookie(event, token, expiresAt)
  return { id: u.id, email: u.email, role: u.role, status: u.status }
})
