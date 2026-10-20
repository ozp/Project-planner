// Folha de codificação (gate = token na URL, sem login; padrão invite).
// Cegueira por desenho: a resposta só traz modo, status e itens
// {itemIndex, stem, responseText, d1..d3, flag, nota} — nunca tag/sessão.
export default defineEventHandler(async (event) => {
  const token = getRouterParam(event, 'token')!
  const folha = await getFolha(useDb(), token)
  if (!folha) throw createError({ statusCode: 404, statusMessage: 'folha não encontrada ou expirada' })
  return folha
})
