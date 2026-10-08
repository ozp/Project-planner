// Tool F5 (OZP-415): resposta de uma tentativa sintética — pontuação
// server-side e gravação canônica (append-only). O retorno {correct} é o
// feedback que o manager aplica ao modelo (o manipulando do probe nº 1).
export default defineEventHandler(async (event) => {
  requireServiceToken(event)
  const body = await readBody(event) as {
    session_id?: string, trial_seq?: number, selected_ref?: string,
    inference?: { modelRef: string, provider: string, route: 'byok' | 'platform' | 'local', latencyMs: number, costUsd?: number },
  }
  if (!body.session_id || !Number.isInteger(body.trial_seq) || !body.selected_ref || !body.inference) {
    throw createError({ statusCode: 422, statusMessage: 'parâmetros obrigatórios: session_id, trial_seq, selected_ref e inference {modelRef, provider, route, latencyMs}' })
  }
  if (!['byok', 'platform', 'local'].includes(body.inference.route)) {
    throw createError({ statusCode: 422, statusMessage: 'inference.route deve ser byok, platform ou local' })
  }
  try {
    return await respondTrial(useDb(), {
      sessionId: body.session_id, trialSeq: body.trial_seq, selectedRef: body.selected_ref, inference: body.inference,
    })
  } catch (e) { throw asServiceError(e) }
})
