import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('.', import.meta.url))

// Local playground: SFC usage, imperative API, and the custom element.
export default defineConfig({
  root: fileURLToPath(new URL('demo', import.meta.url)),
  plugins: [
    vue({
      template: {
        compilerOptions: {
          // Let the demo render <json-editor> as a real custom element instead
          // of resolving it to the imported Vue component.
          isCustomElement: (tag) => tag === 'json-editor',
        },
      },
    }),
  ],
  resolve: {
    alias: {
      '@kbmjj123/json-editor/wc': fileURLToPath(new URL('src/wc/index.ts', import.meta.url)),
      '@kbmjj123/json-editor/style.css': fileURLToPath(new URL('src/styles/index.css', import.meta.url)),
      '@kbmjj123/json-editor': fileURLToPath(new URL('src/index.ts', import.meta.url)),
    },
  },
  server: { port: 5188, open: false },
})
