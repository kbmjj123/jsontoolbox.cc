<script setup lang="ts">
import { computed, defineAsyncComponent, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useTools } from '~/composables/useTools'

definePageMeta({ layout: 'embed' })

const route = useRoute()
const { t, locale, setLocale } = useI18n()
const { getToolBySingleSlug } = useTools()

// Apply locale from query param
const queryLocale = route.query.lang as string
if (queryLocale && ['en', 'zh'].includes(queryLocale)) {
  setLocale(queryLocale)
}

// ── Tool resolution ──────────────────────────────────────────
// slug is globally unique (see useTools.getToolBySingleSlug), so a single
// query param selects any of the 31 universal tools without a category.
const slug = computed(() => (route.query.tool as string) || '')
const tool = computed(() => (slug.value ? getToolBySingleSlug(slug.value) : null) as any)

// Same glob-based resolution the tool pages use, so adding a universal
// component automatically makes it embeddable — no per-tool wiring.
const componentFiles = import.meta.glob('~/components/universal/*.vue')
const resolvedComponent = computed(() => {
  const component = tool.value?.component
  if (!component) return null
  const expectedFileName = component.toLowerCase().replace(/^universal/, '')
  for (const [path, loader] of Object.entries(componentFiles)) {
    const actualFileName = path.split('/').pop()?.replace(/\.\w+$/, '').toLowerCase()
    const dirName = path.split('/')[path.split('/').length - 2]?.toLowerCase()
    if (dirName === 'universal' && actualFileName === expectedFileName) {
      return defineAsyncComponent(loader as any)
    }
  }
  return null
})

// ── Embed params (shared shell chrome only) ──────────────────
// mode / toolbar / readonly / indent belong to the legacy /embed/json shell;
// generic tools render their own UI, so only theme/height/branding/lang apply.
const theme = computed(() => {
  const th = route.query.theme as string
  return th === 'light' || th === 'dark' ? th : 'auto'
})
const minHeight = computed(() => {
  const h = Number(route.query.height)
  return h > 0 ? h : 480
})
const showBranding = computed(() => route.query.branding !== '0')

const resolvedTheme = ref<'light' | 'dark'>('light')
function applyTheme() {
  if (import.meta.server) return
  const html = document.documentElement
  if (theme.value === 'auto') {
    resolvedTheme.value = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  } else {
    resolvedTheme.value = theme.value
  }
  html.classList.toggle('dark', resolvedTheme.value === 'dark')
}
onMounted(() => {
  applyTheme()
  if (theme.value === 'auto') {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyTheme)
  }
})

const fullEditorUrl = computed(() => {
  if (!tool.value?.path) return 'https://jsontoolbox.cc/tools'
  return import.meta.client
    ? `${window.location.origin}${tool.value.path}`
    : `https://jsontoolbox.cc${tool.value.path}`
})

useSeoMeta({
  title: () => (tool.value?.name ? `${tool.value.name} — Embed` : 'Embed JSON Tool'),
  description: () => tool.value?.description || 'Embeddable browser-based JSON tool.',
})
</script>

<template>
  <div class="flex flex-col h-full">
    <!-- Top bar -->
    <div class="flex items-center justify-between px-4 py-2 border-b border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 shrink-0">
      <span class="text-sm font-semibold text-surface-700 dark:text-surface-300">
        {{ tool?.name || 'JsonToolBox' }}
      </span>
      <a
        v-if="tool"
        :href="fullEditorUrl"
        target="_blank"
        rel="noopener"
        class="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
      >
        {{ $t('embed.openFullEditor') || 'Open full tool ↗' }}
      </a>
    </div>

    <!-- Tool component -->
    <div class="flex-1 flex flex-col overflow-hidden px-4 pb-4" :style="{ minHeight: minHeight + 'px' }">
      <component :is="resolvedComponent" v-if="resolvedComponent && tool" :tool="tool" />
      <div v-else class="text-center py-12 text-surface-500 dark:text-surface-400">
        {{ $t('embed.toolNotFound') || 'Tool not found.' }}
      </div>
    </div>

    <!-- Bottom branding -->
    <div
      v-if="showBranding"
      class="flex items-center justify-center gap-1.5 px-4 py-1.5 border-t border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900 shrink-0"
    >
      <span class="text-[11px] text-surface-400 dark:text-surface-500">
        {{ $t('embed.brandingText') || 'Runs locally in your browser ·' }}
      </span>
      <a
        href="https://jsontoolbox.cc"
        target="_blank"
        rel="noopener"
        class="text-[11px] text-primary-500 hover:text-primary-600 dark:text-primary-400"
      >
        JsonToolBox
      </a>
    </div>
  </div>
</template>
