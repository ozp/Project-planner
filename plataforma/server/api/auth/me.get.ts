// Quem sou eu — usado pela página para decidir a etapa da jornada.
export default defineEventHandler(async (event) => {
  const user = await currentUser(event)
  return { user }
})
