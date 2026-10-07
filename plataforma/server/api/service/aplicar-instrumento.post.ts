// Tool aplicar_instrumento (Fase C, OZP-414): re-emite o experimento com
// janela de resposta sobrescrita (gng|nback); instrumento validado contra o
// protocolo real (echo-back). Sem janela → no-op idempotente do próprio doc.
export default defineEventHandler(async (event) => {
  requireServiceToken(event)
  const body = await readBody(event) as { experimento?: string, instrumento?: string, janela_ms?: number }
  if (!body.experimento || !body.instrumento) {
    throw createError({ statusCode: 422, statusMessage: 'parâmetros obrigatórios: experimento (título ou docVersion) e instrumento (mts|stroop|gng|nback)' })
  }
  const r = await applyInstrument(useDb(), {
    ownerId: await serviceOwnerId(useDb()),
    experimento: body.experimento,
    instrumento: body.instrumento,
    janelaMs: body.janela_ms,
  })
  setResponseStatus(event, r.status === 'created' ? 201 : 200)
  return { ...r, url: `/run/${r.docVersion}` }
})
