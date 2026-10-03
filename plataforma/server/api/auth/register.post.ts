// Registro (AC 2.1): participante ativo direto; pesquisador nasce pending
// (sem acesso à área de pesquisa até aprovação — Story 2.4). Rate limited.
export default defineEventHandler(async (event) => {
  const rl = rateLimit(`register:${clientIp(event)}`, 10, 60 * 60 * 1000)
  if (!rl.ok) throw createError({ statusCode: 429, statusMessage: `muitas tentativas — tente em ${rl.retryAfterSec}s` })

  const body = await readValidatedBody(event, b =>
    typeof b === 'object' && b !== null
    && typeof (b as Record<string, unknown>).email === 'string'
    && typeof (b as Record<string, unknown>).password === 'string')

  const { email, password } = body as { email: string, password: string }
  const asResearcher = Boolean((body as Record<string, unknown>).asResearcher)
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    throw createError({ statusCode: 422, statusMessage: 'e-mail inválido' })
  }
  if (password.length < 10) {
    throw createError({ statusCode: 422, statusMessage: 'senha deve ter ao menos 10 caracteres' })
  }

  const sql = useDb()
  const existing = await sql`SELECT 1 FROM user_accounts WHERE email = ${email}`
  if (existing.length > 0) {
    throw createError({ statusCode: 409, statusMessage: 'e-mail já registrado' })
  }

  const passwordHash = await hashPassword(password)
  const rows = await sql`
    INSERT INTO user_accounts (email, password_hash, role, status)
    VALUES (${email}, ${passwordHash}, ${asResearcher ? 'researcher' : 'participant'}, ${asResearcher ? 'pending_researcher' : 'active'})
    RETURNING id, email, role, status`
  const u = rows[0]!
  return { id: u.id, email: u.email, role: u.role, status: u.status }
})
