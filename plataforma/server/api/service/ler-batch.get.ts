// Tool ler_batch (Fase C, OZP-414): TrialResults canônicos pseudonimizados
// de uma sessão (AD-6 — reutiliza as linhas do export 3.4).
export default defineEventHandler(async (event) => {
  requireServiceToken(event)
  const q = getQuery(event) as { experimento?: string, batch?: string }
  if (!q.experimento || !q.batch) {
    throw createError({ statusCode: 422, statusMessage: 'parâmetros obrigatórios: experimento (título ou docVersion) e batch (id da sessão)' })
  }
  return await readBatch(useDb(), q.experimento, q.batch)
})
