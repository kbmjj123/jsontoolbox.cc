<script lang="ts" setup>
  const { t, locale } = useI18n()
  const i18nHead = useLocaleHead()
  const route = useRoute()
  const config = useRuntimeConfig()
  const siteConfig = useSiteConfig()
  const { verificationMeta, customScripts } = useSiteSeo()
  const colorMode = useColorMode()
  const flags = useDeployFlags()

  // 官方分支：baseUrl 为空字符串 → 仍用 siteConfig.url，输出逐字不变。
  // 自托管分支：运行期 JT_BASE_URL 优先；否则回落到构建期 site.url。
  const canonicalBase = computed(() => {
    return flags.value.baseUrl || (flags.value.selfHosted ? '' : siteConfig.url)
  })

  // 动态生成 Canonical URL
  const canonicalUrl = computed(() => {
    const normalizedPath = route.path
      .replace(/^\/zh-hk(\/|$)/i, '/zh-HK$1')
      .replace(/^\/zh-tw(\/|$)/i, '/zh-TW$1')
    const base = canonicalBase.value || siteConfig.url
    return `${base}${normalizedPath}`.replace(/\/$/, '')
  })

  // 动态 theme-color：跟随深色模式切换
  const themeColor = computed(() => colorMode.value === 'dark' ? '#0f172a' : '#0052D4')

  // 全局 Head 配置
  useHead(computed(() => ({
    htmlAttrs: {
      lang: i18nHead.value.htmlAttrs?.lang,
    },
    link: [
      ...(route.meta.customHreflang ? [] : i18nHead.value.link || []),
      { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
      { rel: 'icon', type: 'image/png', sizes: '96x96', href: '/favicon-96x96.png' },
      { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
      { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
      { rel: 'manifest', href: '/site.webmanifest' },
      { rel: 'canonical', href: canonicalUrl.value },
    ],
    meta: [
      ...verificationMeta.value,
      ...(i18nHead.value.meta || []),
      { name: 'theme-color', content: themeColor.value },
      { name: 'referrer', content: 'no-referrer-when-downgrade' },
      ...(flags.value.selfHosted ? [{ name: 'robots', content: 'noindex, nofollow' }] : []),
      { name: 'directree-verify', content: 'directree-verify=61085737a812f3b1dd2a245d41727c05' }
    ],
    script: [...customScripts.value],
  })))

  useSeoMeta({
    titleTemplate: (titleChunk) => {
      return titleChunk
        ? `${titleChunk} | ${t('app.name')}`
        : `${t('app.title')}`
    },
    description: () => t('app.description'),
    ogSiteName: () => t('app.name'),
    ogType: 'website',
    ogUrl: () => canonicalUrl.value,
    twitterCard: 'summary_large_image',
    twitterDescription: () => t('app.description'),
    twitterSite: config.public.baseUrl,
    twitterTitle: () => t('app.title'),
  })

  // 全局默认 OG Image（首页品牌型）
  defineOgImage({
    component: 'OgTemplate',
    props: {
      title: t('app.name'),
      description: t('app.og_title'),
      icon: 'json',
      variant: 'home',
      accent: 'blue',
    },
  })

  // Schema.org
  useSchemaOrg([
    defineWebSite({
      '@id': `${config.public.baseUrl}/#person`,
      name: t('app.name'),
      description: t('app.description'),
      url: config.public.baseUrl,
      inLanguage: locale.value,
      potentialAction: [
        defineSearchAction({
          target: `${config.public.baseUrl}/search?q={search_term_string}`,
          'query-input': {
            valueName: 'search_term_string',
            valueRequired: true,
          },
        }),
      ],
    }),
  ])

  // Global quick tool search (Ctrl+K)
  const { isOpen, contextualFiles, open, close } = useQuickToolSearch()

  onMounted(() => {
    const handler = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement
      const tag = el?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || el?.isContentEditable) return

      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        open()
      }
    }
    window.addEventListener('keydown', handler)
    onUnmounted(() => window.removeEventListener('keydown', handler))
  })

  // Service worker: offline-capable PWA. Registered only in production builds
  // so the dev server is never shadowed by a stale cache.
  onMounted(() => {
    if (import.meta.dev || !('serviceWorker' in navigator)) return
    const register = () => navigator.serviceWorker.register('/sw.js').catch(() => {})
    if (document.readyState === 'complete') register()
    else window.addEventListener('load', register)
  })
</script>

<template>
  <NuxtLayout>
    <NuxtPage />

    <!-- Global quick tool search modal -->
    <ToolSelectorModal :is-open="isOpen" :files="contextualFiles" @close="close" />

    <!-- Global toast notifications -->
    <ToastContainer />
  </NuxtLayout>
</template>
