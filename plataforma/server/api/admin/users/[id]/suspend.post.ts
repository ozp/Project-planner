// Suspensão de conta (AC 2.4): bloqueia novas sessões imediatamente
// (currentUser recusa suspenso) e revoga sessões ativas.
export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)
  const targetId = getRouterParam(event, 'id')!
  const sql = useDb()
  const rows = await sql`
    UPDATE user_accounts SET status = 'suspended'
    WHERE id::text = ${targetId} AND id::text <> ${admin.id}
    RETURNING id, email`
  if (rows.length === 0) {
    throw createError({ statusCode: 404, statusMessage: 'usuário não encontrado (ou é você mesmo)' })
  }
  await sql`UPDATE user_sessions SET revoked_at = now() WHERE user_id::text = ${targetId} AND revoked_at IS NULL`
  await sql`
    INSERT INTO admin_actions (admin_id, action_type, target_user_id)
    VALUES (${admin.id}::uuid, 'user.suspend', ${targetId}::uuid)`
  return { suspended: rows[0]!.email }
})
