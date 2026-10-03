// Logout: revoga a sessão server-side e limpa o cookie.
export default defineEventHandler(async (event) => {
  const token = getCookie(event, SESSION_COOKIE)
  if (token) {
    await useDb()`UPDATE user_sessions SET revoked_at = now() WHERE token_hash = ${hashSessionToken(token)}`
  }
  clearSessionCookie(event)
  return { ok: true }
})
