// Setup TOTP (2 etapas): gera secret e devolve otpauth:// — NÃO ativa ainda.
// Ativação em POST /api/admin/totp/enable com código válido do app.
export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event, { allowWithoutMfa: true }) // chicken-egg do primeiro acesso
  const { secret, otpauthUrl } = newTotp(admin.email)
  return { secret, otpauthUrl, hint: 'adicione ao seu app autenticador e confirme em POST /api/admin/totp/enable {code}' }
})
