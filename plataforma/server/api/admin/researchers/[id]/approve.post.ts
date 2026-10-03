// Aprova pesquisador pendente → active (AC 2.4), com trilha de auditoria.
export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)
  const targetId = getRouterParam(event, 'id')!
  const sql = useDb()
  const rows = await sql`
    UPDATE user_accounts SET status = 'active'
    WHERE id::text = ${targetId} AND role = 'researcher' AND status = 'pending_researcher'
    RETURNING id, email`
  if (rows.length === 0) {
    throw createError({ statusCode: 404, statusMessage: 'pesquisador pendente não encontrado' })
  }
  await sql`
    INSERT INTO admin_actions (admin_id, action_type, target_user_id)
    VALUES (${admin.id}::uuid, 'researcher.approve', ${targetId}::uuid)`
  return { approved: rows[0]!.email }
})
