import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import dts from 'vite-plugin-dts'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  root,
  plugins: [
    vue(),
    dts({ include: ['src'], rollupTypes: false, insertTypesEntry: false }),
  ],
  build: {
    lib: {
      entry: {
        index: 'src/index.ts',
        core: 'src/core/index.ts',
        vue: 'src/vue/index.ts',
        wc: 'src/wc/index.ts',
      },
      formats: ['es', 'cjs'],
      fileName: (format, name) => `${name}.${format === 'es' ? 'mjs' : 'cjs'}`,
    },
    cssCodeSplit: false,
    // Disable minification for the library build. The host app minifies the
    // final bundle; keeping names unmangled avoids collisions between the
    // inlined CSS string and Vue's `h` import in downstream Vite/Rollup.
    minify: false,
    emptyOutDir: true,
    rollupOptions: {
      // Vue and CodeMirror stay external so the host app keeps a single
      // instance of each. The IIFE build (vite.config.iife.ts) bundles them.
      external: ['vue', /^@codemirror\//, /^@lezer\//, 'codemirror'],
      output: {
        assetFileNames: 'style.css',
        exports: 'named',
        globals: { vue: 'Vue' },
      },
    },
  },
})
