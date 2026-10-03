import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      '@core': fileURLToPath(new URL('./core', import.meta.url)),
    },
  },
  test: {
    include: ['test/**/*.test.ts', 'core/**/*.test.ts', 'server/**/*.test.ts'],
    environment: 'node',
  },
})
