// Demografia da sessão (AD-6: classe protegida — fica em sessions, fora de
// export/análise). Autenticada pelo mesmo token de upload da sessão (AD-11).
export default defineEventHandler(async (event) => {
  const sessionId = getRouterParam(event, 'id')!
  const auth = getHeader(event, 'authorization') ?? ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : String(getQuery(event).token ?? '')
  const secret = useRuntimeConfig().uploadTokenSecret ?? 'dev-only-secret'
  const check = verifyUploadToken(token, sessionId, secret)
  if (!check.ok) {
    throw createError({ statusCode: 401, statusMessage: `token de upload inválido (${check.reason})` })
  }

  const body = await readValidatedBody(event, b => typeof b === 'object' && b !== null)
  const allowed = ['faixa_idade', 'escolaridade', 'genero']
  const clean: Record<string, string> = {}
  for (const [k, v] of Object.entries(body as Record<string, unknown>)) {
    if (allowed.includes(k) && (typeof v === 'string') && v.length <= 100) clean[k] = v
  }
  const rows = await useDb()`
    UPDATE sessions SET demographics = ${useDb().json(clean)}
    WHERE id::text = ${sessionId} AND status = 'open'
    RETURNING id`
  if (rows.length === 0) {
    throw createError({ statusCode: 404, statusMessage: 'sessão aberta não encontrada' })
  }
  return { ok: true }
})
