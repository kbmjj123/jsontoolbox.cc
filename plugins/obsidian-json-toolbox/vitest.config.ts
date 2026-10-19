import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  resolve: {
    alias: {
      // `obsidian` is a types-only package; map it to a runtime stub for tests.
      obsidian: fileURLToPath(new URL('./src/__mocks__/obsidian.ts', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.ts'],
  },
})
