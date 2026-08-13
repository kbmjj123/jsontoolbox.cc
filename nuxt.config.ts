// https://nuxt.com/docs/api/configuration/nuxt-config
import { fileURLToPath } from 'url'
import { readdirSync, existsSync } from 'fs'
import { resolve } from 'path'

// 动态生成 sub 工具页面的预渲染路由
function getSubToolRoutes(): string[] {
  const dataDir = resolve(process.cwd(), 'app/assets/data')
  const routes: string[] = []
  if (!existsSync(dataDir)) return routes
  const entries = readdirSync(dataDir, { withFileTypes: true })
  for (const entry of entries) {
    if (!entry.isDirectory()) continue
    const subDir = resolve(dataDir, entry.name, 'sub')
    if (!existsSync(subDir)) continue
    const files = readdirSync(subDir).filter((f: string) => f.endsWith('.json'))
    for (const file of files) {
      const slug = file.replace(/\.json$/, '')
      routes.push(`/tools/${entry.name}/${slug}/`)
    }
  }
  return routes
}

export default defineNuxtConfig({
  ssr: true,
  nitro: {
    preset: "static",
    static: true,
    prerender: {
      failOnError: false,
      autoSubfolderIndex: false,
      routes: [
        '/llms.txt',
        '/llms-full.txt',
        ...getSubToolRoutes()
      ]
    },
  },
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
    url: process.env.NUXT_PUBLIC_SITE_URL,
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
    zeroRuntime: true,
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
  // OG Image 配置
  ogImage: {
    enabled: true,
    // SSG 模式下使用静态预渲染
    defaults: {
      component: 'OgTemplate',
    },
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
    '@nuxt/image',
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
      { code: 'en', name: 'English', file: 'en.json', iso: 'en-US', flag: 'circle-flags:us' },
      { code: 'zh', name: '简体中文', file: 'zh-CN.json', iso: 'zh-CN', flag: 'circle-flags:cn' },
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
  css: ['~/assets/css/tailwind.css'],
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
    server: {
      hmr: {
        timeout: 30000
      }
    },
    build: {
      cssCodeSplit: false,
      assetsInlineLimit: 100000
    },
  },
  hooks: {
    'pages:extend': pages => {
      if (process.env.NODE_ENV === 'production') {
        console.log('🔒 Production build detected: Removing Admin routes...')
        const routesToRemove = pages.filter(page => page.path.startsWith('/admin'))
        routesToRemove.forEach(route => {
          const index = pages.indexOf(route)
          if (index > -1) {
            pages.splice(index, 1)
            console.log(`   - Removed: ${route.path}`)
          }
        })
      }
    },
  },
})
