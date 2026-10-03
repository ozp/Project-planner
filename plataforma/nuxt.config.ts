// Plataforma de Experimentos Psicológicos — monorepo Nuxt 4 (spine AD-1)
// app/ (portal) · server/ (Nitro API) · core/ (núcleo puro) · db/ · deploy/
export default defineNuxtConfig({
  compatibilityDate: '2026-10-03',
  modules: ['@nuxt/eslint'],
  // AD-1: dependências apontam da borda para o centro — @core é importável
  // por app/ e server/, mas core/ não importa nada daqui.
  alias: {
    '@core': new URL('./core', import.meta.url).pathname,
  },
  runtimeConfig: {
    databaseUrl: '', // postgres://... definido via env (AD-15)
  },
  app: {
    head: {
      htmlAttrs: { lang: 'pt-BR' },
      title: 'Plataforma de Experimentos',
    },
  },
})
