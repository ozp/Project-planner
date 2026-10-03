// Publicação (dono ou admin): torna o experimento visível/participável.
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const docVersion = getRouterParam(event, 'docVersion')!
  const sql = useDb()
  const [doc] = await sql`SELECT owner_user_id::text AS owner FROM experiment_docs WHERE doc_version::text = ${docVersion}`
  if (!doc) throw createError({ statusCode: 404, statusMessage: 'documento não encontrado' })
  const isOwner = doc.owner === user.id
  if (!isOwner && user.role !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: 'só o dono (ou admin) publica' })
  }
  // sem termo não há consentimento possível (AD-9) — publicar exige termo
  const [term] = await sql`SELECT 1 FROM consent_terms WHERE doc_version::text = ${docVersion}`
  if (!term) throw createError({ statusCode: 422, statusMessage: 'publique um termo de consentimento antes' })
  await sql`UPDATE experiment_docs SET published = true, published_at = now() WHERE doc_version::text = ${docVersion}`
  return { published: true }
})
