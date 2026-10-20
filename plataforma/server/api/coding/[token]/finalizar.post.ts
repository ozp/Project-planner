// Finalizar folha (irreversível → somente leitura). As 2 cegas fechadas
// liberam o consenso; consenso finalizado trava a task.
export default defineEventHandler(async (event) => {
  const token = getRouterParam(event, 'token')!
  const r = await finalizarFolha(useDb(), token)
  return r
})
