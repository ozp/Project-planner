// Autosave da folha: PATCH parcial por item (merge — campo ausente preserva).
import type { PatchItem } from '../../utils/coding-task'

export default defineEventHandler(async (event) => {
  const token = getRouterParam(event, 'token')!
  const body = await readValidatedBody(event, b => typeof b === 'object' && b !== null && Array.isArray((b as Record<string, unknown>).respostas))
  const respostas = (body as { respostas: PatchItem[] }).respostas
  const n = await salvarRespostas(useDb(), token, respostas)
  return { salvos: n }
})
