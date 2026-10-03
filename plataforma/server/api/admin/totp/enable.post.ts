// Ativa o MFA: grava o secret CIFRADO (AES-256-GCM) após código válido.
export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event, { allowWithoutMfa: true })
  const body = await readValidatedBody(event, b =>
    typeof b === 'object' && b !== null
    && typeof (b as Record<string, unknown>).code === 'string'
    && typeof (b as Record<string, unknown>).secret === 'string')
  const { code, secret } = body as { code: string, secret: string }
  if (!/^[A-Z2-7]+=*$/.test(secret)) throw createError({ statusCode: 422, statusMessage: 'secret base32 inválido' })
  if (!verifyTotp(secret, code)) throw createError({ statusCode: 422, statusMessage: 'código TOTP inválido' })
  const enc = encryptSecret(secret, useRuntimeConfig().uploadTokenSecret ?? 'dev-only-secret')
  await useDb()`UPDATE user_accounts SET totp_secret_enc = ${enc} WHERE id::text = ${admin.id}`
  await useDb()`
    INSERT INTO admin_actions (admin_id, action_type)
    VALUES (${admin.id}::uuid, 'admin.totp.enabled')`
  return { ok: true }
})
