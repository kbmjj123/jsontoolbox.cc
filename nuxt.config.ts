// https://nuxt.com/docs/api/configuration/nuxt-config
import { fileURLToPath } from 'url'

// Self-hosted (Docker) build: NUXT_PUBLIC_SELF_HOSTED=1.
// When unset, every value below resolves EXACTLY as before — the hosted site
// must not change by a single byte.
const selfHosted = process.env.NUXT_PUBLIC_SELF_HOSTED === '1'
const envSiteUrl = process.env.NUXT_PUBLIC_SITE_URL
const envSiteName = process.env.NUXT_PUBLIC_SITE_NAME || 'JSON Toolbox'
// A self-hosted instance has no public URL at build time; use a neutral
// placeholder the runtime config can override (JT_BASE_URL / window.origin).
const selfHostedSiteUrl = envSiteUrl || 'http://localhost:8080'
const resolveSiteUrl = selfHosted ? selfHostedSiteUrl : envSiteUrl || 'https://jsontoolbox.cc'

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
    url: resolveSiteUrl,
    defaultLocale: 'en',
    trailingSlash: false,
  },
  app: {
    head: {
      titleTemplate: `%s | ${envSiteName}`,
    },
  },
  features: {
    inlineStyles: true
  },
  // Sitemap 配置
  sitemap: selfHosted
    ? { enabled: false }
    : {
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
      selfHosted
        ? { userAgent: '*', disallow: ['/'] }
        : { userAgent: '*', allow: '*' },
    ]
  },
  ogImage: selfHosted
    ? { enabled: false }
    : {
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
      selfHosted,
      siteName: envSiteName,
      baseUrl: selfHosted ? selfHostedSiteUrl : envSiteUrl,
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
    baseUrl: selfHosted ? selfHostedSiteUrl : envSiteUrl,
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
    // Self-hosted instances may run without internet. Default Nuxt Icon falls
    // back to https://api.iconify.design at runtime (there is no /api/_nuxt_icon
    // in a static build). Bundle the icons at build time instead.
    ...(selfHosted
      ? { clientBundle: { scan: true, includeCustomCollections: true, sizeLimitKb: 1024 } }
      : {}),
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
