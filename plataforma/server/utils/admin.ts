// Guard de admin com MFA obrigatório (AD-12): sem TOTP ativado, apenas
// setup/enable funcionam — o resto exige segundo fator na conta.
import type { H3Event } from 'h3'
import type { PublicUser } from './auth'

export async function requireAdmin(event: H3Event, opts?: { allowWithoutMfa?: boolean }): Promise<PublicUser> {
  const user = await requireUser(event, { role: 'admin' })
  const [row] = await useDb()`SELECT totp_secret_enc FROM user_accounts WHERE id::text = ${user.id}`
  const hasMfa = Boolean(row?.totp_secret_enc)
  if (!hasMfa && !opts?.allowWithoutMfa) {
    throw createError({ statusCode: 403, statusMessage: 'MFA obrigatório para admin — ative em POST /api/admin/totp/setup' })
  }
  return user
}
