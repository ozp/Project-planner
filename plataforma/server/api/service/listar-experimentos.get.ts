// Tool listar_experimentos (Fase C, OZP-414): catálogo publicado com protocolo.
export default defineEventHandler(async (event) => {
  requireServiceToken(event)
  const q = getQuery(event) as { filtro?: string }
  const experiments = await listExperimentsForService(useDb(), q.filtro)
  return { total: experiments.length, experiments }
})
