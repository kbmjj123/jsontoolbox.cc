import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

const root = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  root,
  plugins: [vue()],
  test: {
    include: ['test/**/*.test.ts'],
    // Component tests need a DOM. `useCodeMirror` is never exercised here —
    // CodeMirror 6 needs layout APIs jsdom does not implement.
    environment: 'jsdom',
  },
})
