// Tool F5 (OZP-415): abrir sessão sintética — o manager local recebe o plano
// de tentativas (sem a resposta correta) e devolve respostas tentativa a
// tentativa; a plataforma pontua (o LLM nunca se autoavalia).
export default defineEventHandler(async (event) => {
  requireServiceToken(event)
  const body = await readBody(event) as {
    experimento?: string, model_ref?: string, temperature?: number, seed?: number
  }
  if (!body.experimento || !body.model_ref) {
    throw createError({ statusCode: 422, statusMessage: 'parâmetros obrigatórios: experimento (título ou docVersion) e model_ref' })
  }
  const seed = Number(body.seed ?? 42)
  if (!Number.isInteger(seed)) {
    throw createError({ statusCode: 422, statusMessage: 'seed deve ser inteiro' })
  }
  try {
    const exp = await resolveExperiment(useDb(), body.experimento)
    const r = await openSyntheticSession(useDb(), {
      docVersion: exp.v, modelRef: body.model_ref, temperature: body.temperature, seed,
    })
    return { sessionId: r.sessionId, docVersion: exp.v, runMeta: { modelRef: body.model_ref, temperature: body.temperature ?? null, seed }, plan: r.plan }
  } catch (e) { throw asServiceError(e) }
})
