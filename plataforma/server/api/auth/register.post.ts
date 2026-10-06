// Registro (AC 2.1 + AC 3.1): participante ativo direto SOMENTE por convite
// válido (piloto fechado — link único por experimento); pesquisador nasce
// pending (aprovação do admin — Story 2.4). Rate limited.
export default defineEventHandler(async (event) => {
  const rl = rateLimit(`register:${clientIp(event)}`, 10, 60 * 60 * 1000)
  if (!rl.ok) throw createError({ statusCode: 429, statusMessage: `muitas tentativas — tente em ${rl.retryAfterSec}s` })

  const body = await readValidatedBody(event, b =>
    typeof b === 'object' && b !== null
    && typeof (b as Record<string, unknown>).email === 'string'
    && typeof (b as Record<string, unknown>).password === 'string')

  const { email, password } = body as { email: string, password: string }
  const asResearcher = Boolean((body as Record<string, unknown>).asResearcher)
  const invite = typeof (body as Record<string, unknown>).invite === 'string'
    ? (body as Record<string, unknown>).invite as string : ''
  // página de origem (opcional): garante que o convite é DO experimento aberto
  const claimedDoc = typeof (body as Record<string, unknown>).docVersion === 'string'
    ? (body as Record<string, unknown>).docVersion as string : null
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    throw createError({ statusCode: 422, statusMessage: 'e-mail inválido' })
  }
  if (password.length < 10) {
    throw createError({ statusCode: 422, statusMessage: 'senha deve ter ao menos 10 caracteres' })
  }

  const sql = useDb()

  // convite (AC 3.1): consumir é atômico — o UPDATE só vence se válido
  // (existe, não expirou, não esgotou e, quando informado, é do documento certo)
  let invitedDoc: string | null = null
  if (!asResearcher) {
    if (!invite) {
      throw createError({ statusCode: 403, statusMessage: 'registro por convite — use o link enviado pelo pesquisador' })
    }
    const claimed = await sql`
      UPDATE experiment_invites SET uses = uses + 1
      WHERE token = ${invite}
        AND (expires_at IS NULL OR expires_at > now())
        AND (max_uses IS NULL OR uses < max_uses)
        AND (${claimedDoc}::text IS NULL OR doc_version::text = ${claimedDoc})
      RETURNING doc_version::text`
    if (claimed.length === 0) {
      throw createError({ statusCode: 403, statusMessage: 'convite inválido, expirado ou esgotado' })
    }
    invitedDoc = claimed[0]!.doc_version
  }

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
  return { id: u.id, email: u.email, role: u.role, status: u.status, invitedDocVersion: invitedDoc }
})
