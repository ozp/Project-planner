// Lista coding tasks com progresso por folha (painel admin).
export default defineEventHandler(async (event) => {
  await requireAdmin(event, { allowWithoutMfa: true })
  const sql = useDb()
  const tasks = await sql`
    SELECT t.id::text AS id, t.titulo, t.doc_escopo, t.modo, t.status, t.created_at::text AS created_at,
           (SELECT count(*)::int FROM coding_items i WHERE i.task_id = t.id) AS itens,
           (SELECT count(*)::int FROM coding_sheets s WHERE s.task_id = t.id AND s.papel IN ('cega1','cega2') AND s.finalizada IS NOT NULL) AS cegas_fechadas,
           (SELECT count(*)::int FROM coding_sheets s WHERE s.task_id = t.id AND s.papel = 'consenso' AND s.finalizada IS NOT NULL) AS consenso_fechado
    FROM coding_tasks t ORDER BY t.created_at DESC LIMIT 100`
  return { tasks }
})
