// Aceite do termo (AD-9): prova LGPD (participante, termo, timestamp). Idempotente.
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const body = await readValidatedBody(event, b => typeof b === 'object' && b !== null && typeof (b as Record<string, unknown>).termId === 'string')
  const { termId } = body as { termId: string }
  const sql = useDb()
  const exists = await sql`SELECT 1 FROM consent_terms WHERE id::text = ${termId}`
  if (exists.length === 0) throw createError({ statusCode: 404, statusMessage: 'termo não encontrado' })
  await sql`
    INSERT INTO consent_acceptances (term_id, user_id)
    VALUES (${termId}::uuid, ${user.id}::uuid)
    ON CONFLICT DO NOTHING`
  return { ok: true }
})
