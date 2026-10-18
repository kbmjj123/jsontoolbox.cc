// https://nuxt.com/docs/api/configuration/nuxt-config
import { fileURLToPath } from 'url'

export default defineNuxtConfig({
  ssr: true,
  nitro: {
    preset: "static",
    static: true,
    prerender: {
      // A silently skipped route is worse than a failed build: with `false`, a
      // broken `/` made the crawler find no links, the site shipped with only
      // 12 prerendered routes and Cloudflare still reported "Success".
      failOnError: true,
      autoSubfolderIndex: false,
      // Crawler entry points. `/` alone is not enough: when the home page
      // fails to render (it did once — unstorage 1.17.6 rejected `/` as a
      // cache key), the crawler finds no links and the whole site collapses to
      // the 12 routes prerendered from the initial list. These extra entries
      // keep the crawl alive even if one entry breaks.
      routes: [
        '/',
        '/zh',
        '/tools',
        '/blog',
        '/llms.txt',
        '/llms-full.txt'
      ]
    },
  },
	devtools: { enabled: true },
	components: [
    {
      path: '~/components',
      pathPrefix: false,
    },
  ],
  experimental: {
    defaults: {
      nuxtLink: {
        prefetch: false,
        prefetchOn: {
          visibility: false,
          interaction: false
        }
      }
    }
  },
  feed: {
    sources: [
      {
        path: '/feed.xml',
        type: 'rss2',
        cacheTime: 60 * 15
      }
    ]
  },
  content: {
    experimental: {
      nativeSqlite: true
    },
    build: {
      markdown: {
        highlight: false
      }
    }
  },
  compatibilityDate: '2026-01-01',
  // seo config
  site: {
    enabled: true,
    url: process.env.NUXT_PUBLIC_SITE_URL || 'https://jsontoolbox.cc',
    defaultLocale: 'en',
    trailingSlash: false,
  },
  app: {
    head: {
      titleTemplate: '%s | JSON Toolbox',
    },
  },
  features: {
    inlineStyles: true
  },
  // Sitemap 配置
  sitemap: {
    autoLastmod: true,
    discoverImages: false,
    exclude: ['/404'],
    sources: [
      '/api/sitemap-urls',
      '/api/sitemap-blog'
    ],
  },
  // Robots 配置
  robots: {
    groups: [
      {
        userAgent: '*',
        allow: '*',
      }
    ]
  },
  ogImage: {
    enabled: true,
		fonts: [
			'Noto+Sans+SC:400',
			'Noto+Sans+SC:700',
		]
  },
  schemaOrg: {
    identity: 'Person'
  },
  runtimeConfig: {
    public: {
      baseUrl: process.env.NUXT_PUBLIC_SITE_URL,
      umamiAnalyticsId: '',
      siteVerification: {
        google: '',
        bing: '',
        baidu: '',
        yandex: '',
      },
    }
  },
  modules: [
    '@nuxtjs/i18n',
    '@nuxt/content',
    '@nuxtjs/seo',
    '@nuxt/eslint',
    '@nuxt/icon',
    '@nuxt/scripts',
    '@nuxt/test-utils',
    '@nuxtjs/tailwindcss',
    '@vueuse/nuxt',
    '@nuxtjs/color-mode',
    'nuxt-open-fetch',
    'nuxt-module-feed'
  ],
  linkChecker: {
    skipInspections: ['no-non-ascii-chars', 'no-uppercase-chars'],
  },
  i18n: {
    baseUrl: process.env.NUXT_PUBLIC_SITE_URL,
    locales: [
      { code: 'en', name: 'English', file: 'en.json', language: 'en-US', flag: 'circle-flags:us' },
      { code: 'zh', name: '简体中文', file: 'zh-CN.json', language: 'zh-CN', flag: 'circle-flags:cn' },
    ],
    defaultLocale: 'en',
    strategy: 'prefix_except_default',
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'i18n_redirected',
      redirectOn: 'root'
    },
    compilation: { strictMessage: false, escapeHtml: false }
  },
  icon: {
    // serverBundle: {
    //   collections: ['lucide']
    // },
    customCollections: [
      {
        prefix: 'icons',
        dir: './app/assets/icons',
      },
    ],
  },
  colorMode: {
    classSuffix: '',
    preference: 'system',
    fallback: 'light',
    storageKey: 'nuxt-color-mode'
  },
  build: {
    transpile: ['@kbmjj123/json-editor'],
  },
  css: [
    '~/assets/css/tailwind.css',
    '@kbmjj123/json-editor/style.css',
    'photoswipe/dist/photoswipe.css',
  ],
  tailwindcss: {
    viewer: { endpoint: '/_tailwind', exportViewer: true },
    config: {
      darkMode: 'class',
    }
  },
  alias: {
    '@nuxt/content/server': fileURLToPath(new URL('./adapter-content.ts', import.meta.url)),
    '@nuxt/content/dist/module.mjs': fileURLToPath(new URL('./adapter-content.ts', import.meta.url))
  },
  vite: {
    optimizeDeps: {
      include: [
        '@codemirror/lang-json',
        '@codemirror/language',
        '@codemirror/state',
        '@codemirror/view',
        '@lezer/highlight',
        'ajv', // CJS
        'dompurify',
        'fflate',
        'js-yaml',
        'jsonrepair',
        'marked',
        'photoswipe',
      ]
    },
    server: {
      hmr: {
        timeout: 30000
      }
    },
    build: {
      cssCodeSplit: false,
      assetsInlineLimit: 4096
    },
  },
})
