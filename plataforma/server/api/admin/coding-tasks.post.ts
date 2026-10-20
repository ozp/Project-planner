// Cria coding task (gabarito C2): amostra importada + modo de apresentação.
// Paridade com invites: liberar ENTRADA de codificador (não lê/altera dados
// existentes) → allowWithoutMfa, auditado em admin_actions.
import type { NovaTask } from '../../utils/coding-task'

export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event, { allowWithoutMfa: true })
  const body = await readValidatedBody(event, b => typeof b === 'object' && b !== null && typeof (b as Record<string, unknown>).titulo === 'string' && Array.isArray((b as Record<string, unknown>).itens))
  const input = body as unknown as NovaTask
  const { taskId, sheets } = await criarCodingTask(useDb(), input)
  const sql = useDb()
  await sql`
    INSERT INTO admin_actions (admin_id, action_type, detail)
    VALUES (${admin.id}::uuid, 'codingtask.create', ${sql.json({ taskId, titulo: input.titulo, modo: input.modo ?? 'foco', itens: input.itens.length })})`
  return {
    taskId,
    modo: input.modo ?? 'foco',
    links: sheets.map(s => ({ papel: s.papel, url: `/codificacao/${s.token}` })),
  }
})
