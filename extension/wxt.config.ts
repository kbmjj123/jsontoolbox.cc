import { defineConfig } from 'wxt'

export default defineConfig({
  modules: ['@wxt-dev/module-vue'],

  manifest: ({ browser, manifestVersion }) => ({
    name: '__MSG_extName__',
    short_name: 'JSON Toolbox',
    description: '__MSG_extDescription__',
    default_locale: 'en',

    // Minimal. `content_scripts.matches: ['<all_urls>']` (generated from
    // entrypoints/content.ts) ALONE triggers Chrome's "Read and change all your
    // data on all websites" install warning — intentional and accepted. Explicit
    // `host_permissions` are NOT required for content-script injection and are
    // deliberately not declared. `storage` is only for saving popup config.
    permissions: ['storage'],

    icons: {
      16: '/icon-16.png',
      32: '/icon-32.png',
      48: '/icon-48.png',
      128: '/icon-128.png',
    },

    ...(manifestVersion === 3 ? { minimum_chrome_version: '116' } : {}),
    // Firefox scaffold only — v1 builds `-b chrome` exclusively.
    ...(browser === 'firefox'
      ? { browser_specific_settings: { gecko: { id: 'jsontoolbox@jsontoolbox.cc' } } }
      : {}),
  }),

  vite: () => ({
    resolve: {
      // /wc bundles Vue via createApp; a second Vue instance would silently
      // break provide/inject and reactivity.
      dedupe: ['vue'],
    },
  }),
})
