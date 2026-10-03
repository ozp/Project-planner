import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      '@core': fileURLToPath(new URL('./core', import.meta.url)),
    },
  },
  test: {
    fileParallelism: false, // testes de integração compartilham o Postgres do compose
    include: ['test/**/*.test.ts', 'core/**/*.test.ts', 'server/**/*.test.ts'],
    environment: 'node',
  },
})
