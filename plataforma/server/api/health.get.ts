// AD-15: health check espelha prod — mesma imagem, mesma rota
export default defineEventHandler(() => {
  return {
    status: 'ok',
    service: 'plataforma-experimentos',
    time: new Date().toISOString(),
  }
})
