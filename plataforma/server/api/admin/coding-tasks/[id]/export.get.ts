// Export admin da coding task: par cego por item + consenso + re-ligação
// científica (session_id/trial_seq/segment_tag). Insumo do κ/ICC (C2).
export default defineEventHandler(async (event) => {
  await requireAdmin(event, { allowWithoutMfa: true })
  const id = getRouterParam(event, 'id')!
  const rows = await exportarTask(useDb(), id)
  if (rows.length === 0) throw createError({ statusCode: 404, statusMessage: 'task não encontrada' })
  return { taskId: id, n: rows.length, rows }
})
