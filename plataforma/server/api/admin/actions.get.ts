// Trilha de auditoria do admin (AC 2.4) — mais recente primeiro.
export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const rows = await useDb()`
    SELECT a.id, a.action_type, a.target_user_id, a.created_at, t.email AS target_email
    FROM admin_actions a LEFT JOIN user_accounts t ON t.id = a.target_user_id
    ORDER BY a.created_at DESC LIMIT 100`
  return { actions: rows }
})
