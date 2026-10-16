import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('.', import.meta.url))

// Single-file IIFE bundle for CDN use (jsDelivr / unpkg / cdnjs).
// Vue and CodeMirror are bundled in: CDN consumers have no build step.
export default defineConfig({
  root,
  plugins: [vue()],
  define: {
    // Browser IIFE consumers have no `process`; replace all accesses with a
    // small shim so bundled dependencies (Vue, CodeMirror) do not crash.
    'process.env': JSON.stringify({ NODE_ENV: 'production', LOG: false }),
  },
  build: {
    emptyOutDir: false,
    lib: {
      entry: 'src/wc/register.ts',
      name: 'JsonEditor',
      formats: ['iife'],
      fileName: () => 'json-editor.iife.js',
    },
    cssCodeSplit: false,
    minify: 'esbuild',
    rollupOptions: {
      output: {
        assetFileNames: 'json-editor.iife.css',
      },
    },
  },
})
