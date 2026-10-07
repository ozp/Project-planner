// Tool criar_experimento (Fase C, OZP-414): clone publicado do template do
// protocolo. Auth de serviço (SERVICE_TOKEN no ambiente, nunca no repo).
export default defineEventHandler(async (event) => {
  requireServiceToken(event)
  const body = await readBody(event) as { nome?: string, protocolo_display?: string, descricao?: string }
  const r = await createExperimentFromTemplate(useDb(), {
    ownerId: await serviceOwnerId(useDb()),
    nome: body.nome ?? '',
    protocolo: body.protocolo_display ?? '',
    descricao: body.descricao,
  })
  setResponseStatus(event, r.status === 'created' ? 201 : 200)
  return { ...r, url: `/run/${r.docVersion}` }
})
