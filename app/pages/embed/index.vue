<script setup lang="ts">
useSeoMeta({
  title: 'Embeddable JSON Tools for Docs & Teams | JsonToolBox',
  description: 'Add a private, browser-based JSON editor or viewer to your documentation. No account, upload, or server-side storage required.',
})

const { t } = useI18n()

// ── Config state ─────────────────────────────────────────────
const config = reactive({
  mode: 'editor' as 'editor' | 'viewer',
  theme: 'auto' as 'auto' | 'light' | 'dark',
  height: 520,
  toolbar: true,
  readonly: false,
  indent: 2 as number | string,
  branding: true,
})

// ── Generated iframe URL ─────────────────────────────────────
const embedUrl = computed(() => {
  const base = 'https://jsontoolbox.cc/embed/json'
  const params = new URLSearchParams()
  params.set('mode', config.mode)
  params.set('theme', config.theme)
  params.set('height', String(config.height))
  if (!config.toolbar) params.set('toolbar', '0')
  if (config.readonly) params.set('readonly', '1')
  if (config.indent !== 2) params.set('indent', String(config.indent))
  if (!config.branding) params.set('branding', '0')
  return `${base}?${params.toString()}`
})

// ── Attribution link ─────────────────────────────────────────
const attributionUrl = computed(() => {
  return 'https://jsontoolbox.cc/tools/format/json-editor'
})

const attributionText = computed(() => {
  return config.mode === 'editor'
    ? 'JSON Editor by JsonToolBox'
    : 'JSON Viewer by JsonToolBox'
})

// ── Generated code ───────────────────────────────────────────
const generatedCode = computed(() => {
  const iframe = `<iframe
  src="${embedUrl.value}"
  width="100%"
  height="${config.height}"
  loading="lazy"
  title="${attributionText.value}">
</iframe>`

  if (!config.branding) return iframe

  return `${iframe}

<p>
  <a href="${attributionUrl.value}">
    ${attributionText.value}
  </a>
  — format, validate, and inspect JSON locally in your browser.
</p>`
})

// ── Copy code ────────────────────────────────────────────────
const copied = ref(false)

const copyCode = async () => {
  await copyToClipboard(generatedCode.value)
  copied.value = true
  setTimeout(() => { copied.value = false }, 2000)
}

// ── Preview iframe src ───────────────────────────────────────
const previewSrc = computed(() => {
  // Use relative URL for dev, absolute for production
  if (import.meta.dev) {
    const params = new URLSearchParams()
    params.set('mode', config.mode)
    params.set('theme', config.theme)
    params.set('height', String(config.height))
    if (!config.toolbar) params.set('toolbar', '0')
    if (config.readonly) params.set('readonly', '1')
    if (config.indent !== 2) params.set('indent', String(config.indent))
    if (!config.branding) params.set('branding', '0')
    return `/embed/json?${params.toString()}`
  }
  return embedUrl.value
})
</script>

<template>
  <div class="max-w-6xl mx-auto px-4 py-12">
    <!-- Hero -->
    <div class="text-center mb-12">
      <h1 class="text-3xl font-bold text-surface-900 dark:text-surface-100 mb-4">
        {{ $t('embed.heroTitle') || 'Embeddable JSON Tools for Docs & Teams' }}
      </h1>
      <p class="text-lg text-surface-600 dark:text-surface-400 max-w-2xl mx-auto">
        {{ $t('embed.heroSubtitle') || 'Add a private, browser-based JSON editor or viewer to your documentation. No account, upload, or server-side storage required.' }}
      </p>
    </div>

    <div class="grid lg:grid-cols-2 gap-8 mb-16">
      <!-- Config panel -->
      <div class="space-y-6">
        <div class="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-6">
          <h2 class="text-lg font-semibold text-surface-900 dark:text-surface-100 mb-4">
            {{ $t('embed.configTitle') || 'Configuration' }}
          </h2>

          <!-- Mode -->
          <div class="mb-4">
            <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
              {{ $t('embed.mode') || 'Mode' }}
            </label>
            <div class="flex rounded-lg border border-surface-200 dark:border-surface-700 overflow-hidden">
              <button
                @click="config.mode = 'editor'"
                :class="config.mode === 'editor'
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-surface-600 hover:bg-surface-50 dark:bg-surface-800 dark:text-surface-400'"
                class="flex-1 px-4 py-2 text-sm font-medium transition-colors"
              >
                {{ $t('embed.modeEditor') || 'Editor' }}
              </button>
              <button
                @click="config.mode = 'viewer'"
                :class="config.mode === 'viewer'
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-surface-600 hover:bg-surface-50 dark:bg-surface-800 dark:text-surface-400'"
                class="flex-1 px-4 py-2 text-sm font-medium transition-colors"
              >
                {{ $t('embed.modeViewer') || 'Viewer' }}
              </button>
            </div>
          </div>

          <!-- Theme -->
          <div class="mb-4">
            <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
              {{ $t('embed.theme') || 'Theme' }}
            </label>
            <div class="flex rounded-lg border border-surface-200 dark:border-surface-700 overflow-hidden">
              <button
                v-for="opt in (['auto', 'light', 'dark'] as const)"
                :key="opt"
                @click="config.theme = opt"
                :class="config.theme === opt
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-surface-600 hover:bg-surface-50 dark:bg-surface-800 dark:text-surface-400'"
                class="flex-1 px-3 py-2 text-sm font-medium transition-colors capitalize"
              >
                {{ opt }}
              </button>
            </div>
          </div>

          <!-- Height -->
          <div class="mb-4">
            <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
              {{ $t('embed.height') || 'Height (px)' }}
            </label>
            <div class="flex rounded-lg border border-surface-200 dark:border-surface-700 overflow-hidden">
              <button
                v-for="h in [360, 480, 520, 640]"
                :key="h"
                @click="config.height = h"
                :class="config.height === h
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-surface-600 hover:bg-surface-50 dark:bg-surface-800 dark:text-surface-400'"
                class="flex-1 px-3 py-2 text-sm font-medium transition-colors"
              >
                {{ h }}
              </button>
            </div>
          </div>

          <!-- Indent -->
          <div class="mb-4">
            <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
              {{ $t('embed.indent') || 'Indent' }}
            </label>
            <select v-model="config.indent" class="w-full rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm dark:border-surface-700 dark:bg-surface-800">
              <option :value="2">2 {{ $t('embed.spaces') || 'spaces' }}</option>
              <option :value="4">4 {{ $t('embed.spaces') || 'spaces' }}</option>
              <option value="tab">{{ $t('formatter.tab') || 'Tab' }}</option>
            </select>
          </div>

          <!-- Toggles -->
          <div class="space-y-3">
            <label class="flex items-center gap-3 cursor-pointer">
              <button
                @click="config.toolbar = !config.toolbar"
                :class="config.toolbar ? 'bg-primary-600' : 'bg-surface-300 dark:bg-surface-600'"
                class="relative inline-flex h-5 w-9 items-center rounded-full transition-colors shrink-0"
                role="switch"
                :aria-checked="config.toolbar"
              >
                <span
                  :class="config.toolbar ? 'translate-x-4' : 'translate-x-0.5'"
                  class="inline-block h-4 w-4 rounded-full bg-white transition-transform"
                />
              </button>
              <span class="text-sm text-surface-700 dark:text-surface-300">{{ $t('embed.showToolbar') || 'Show toolbar' }}</span>
            </label>

            <label class="flex items-center gap-3 cursor-pointer">
              <button
                @click="config.readonly = !config.readonly"
                :class="config.readonly ? 'bg-primary-600' : 'bg-surface-300 dark:bg-surface-600'"
                class="relative inline-flex h-5 w-9 items-center rounded-full transition-colors shrink-0"
                role="switch"
                :aria-checked="config.readonly"
              >
                <span
                  :class="config.readonly ? 'translate-x-4' : 'translate-x-0.5'"
                  class="inline-block h-4 w-4 rounded-full bg-white transition-transform"
                />
              </button>
              <span class="text-sm text-surface-700 dark:text-surface-300">{{ $t('embed.readonly') || 'Read-only' }}</span>
            </label>

            <label class="flex items-center gap-3 cursor-pointer">
              <button
                @click="config.branding = !config.branding"
                :class="config.branding ? 'bg-primary-600' : 'bg-surface-300 dark:bg-surface-600'"
                class="relative inline-flex h-5 w-9 items-center rounded-full transition-colors shrink-0"
                role="switch"
                :aria-checked="config.branding"
              >
                <span
                  :class="config.branding ? 'translate-x-4' : 'translate-x-0.5'"
                  class="inline-block h-4 w-4 rounded-full bg-white transition-transform"
                />
              </button>
              <span class="text-sm text-surface-700 dark:text-surface-300">{{ $t('embed.showBranding') || 'Show attribution' }}</span>
            </label>
          </div>
        </div>

        <!-- Generated code -->
        <div class="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-6">
          <div class="flex items-center justify-between mb-3">
            <h2 class="text-lg font-semibold text-surface-900 dark:text-surface-100">
              {{ $t('embed.codeTitle') || 'Embed Code' }}
            </h2>
            <button
              @click="copyCode"
              class="text-xs px-3 py-1.5 rounded-lg font-medium transition-colors"
              :class="copied
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                : 'bg-primary-600 text-white hover:bg-primary-700'"
            >
              {{ copied ? '✓ Copied!' : ($t('embed.copyCode') || 'Copy code') }}
            </button>
          </div>

          <p v-if="config.branding" class="text-xs text-surface-500 dark:text-surface-400 mb-3">
            {{ $t('embed.attributionNote') || 'Attribution is included by default. You may remove or edit it when appropriate for your documentation.' }}
          </p>

          <pre class="bg-surface-50 dark:bg-surface-900 rounded-lg p-4 text-xs text-surface-800 dark:text-surface-200 overflow-x-auto whitespace-pre-wrap break-all">{{ generatedCode }}</pre>
        </div>
      </div>

      <!-- Preview -->
      <div>
        <div class="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-6 sticky top-24">
          <h2 class="text-lg font-semibold text-surface-900 dark:text-surface-100 mb-4">
            {{ $t('embed.previewTitle') || 'Preview' }}
          </h2>
          <div class="rounded-lg overflow-hidden border border-surface-200 dark:border-surface-700">
            <iframe
              :src="previewSrc"
              width="100%"
              :height="config.height"
              loading="lazy"
              class="w-full bg-surface-50 dark:bg-surface-950"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Info sections -->
    <div class="grid md:grid-cols-3 gap-8 mb-16">
      <!-- When to use -->
      <div class="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-6">
        <h3 class="text-base font-semibold text-surface-900 dark:text-surface-100 mb-3">
          {{ $t('embed.whenToUseTitle') || 'When to use' }}
        </h3>
        <ul class="space-y-2 text-sm text-surface-600 dark:text-surface-400">
          <li class="flex items-start gap-2">
            <span class="text-primary-500 mt-0.5">•</span>
            <span>{{ $t('embed.useCase1') || 'Interactive JSON examples in API documentation' }}</span>
          </li>
          <li class="flex items-start gap-2">
            <span class="text-primary-500 mt-0.5">•</span>
            <span>{{ $t('embed.useCase2') || 'JSON demos in tutorials and blog posts' }}</span>
          </li>
          <li class="flex items-start gap-2">
            <span class="text-primary-500 mt-0.5">•</span>
            <span>{{ $t('embed.useCase3') || 'Temporary JSON editor in internal wikis' }}</span>
          </li>
          <li class="flex items-start gap-2">
            <span class="text-primary-500 mt-0.5">•</span>
            <span>{{ $t('embed.useCase4') || 'Read-only JSON viewer for data previews' }}</span>
          </li>
        </ul>
      </div>

      <!-- Privacy -->
      <div class="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-6">
        <h3 class="text-base font-semibold text-surface-900 dark:text-surface-100 mb-3">
          {{ $t('embed.privacyTitle') || 'Privacy & Security' }}
        </h3>
        <ul class="space-y-2 text-sm text-surface-600 dark:text-surface-400">
          <li class="flex items-start gap-2">
            <span class="text-emerald-500 mt-0.5">✓</span>
            <span>{{ $t('embed.privacy1') || 'All JSON processing runs locally in the browser' }}</span>
          </li>
          <li class="flex items-start gap-2">
            <span class="text-emerald-500 mt-0.5">✓</span>
            <span>{{ $t('embed.privacy2') || 'No data is uploaded to any server' }}</span>
          </li>
          <li class="flex items-start gap-2">
            <span class="text-emerald-500 mt-0.5">✓</span>
            <span>{{ $t('embed.privacy3') || 'No account or API key required' }}</span>
          </li>
          <li class="flex items-start gap-2">
            <span class="text-amber-500 mt-0.5">⚠</span>
            <span>{{ $t('embed.privacy4') || 'The host page may have its own scripts — avoid pasting sensitive data on untrusted sites' }}</span>
          </li>
        </ul>
      </div>

      <!-- Limitations -->
      <div class="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-6">
        <h3 class="text-base font-semibold text-surface-900 dark:text-surface-100 mb-3">
          {{ $t('embed.limitationsTitle') || 'Limitations' }}
        </h3>
        <ul class="space-y-2 text-sm text-surface-600 dark:text-surface-400">
          <li class="flex items-start gap-2">
            <span class="text-surface-400 mt-0.5">•</span>
            <span>{{ $t('embed.limitation1') || 'Very large JSON files (>10MB) may slow down the browser' }}</span>
          </li>
          <li class="flex items-start gap-2">
            <span class="text-surface-400 mt-0.5">•</span>
            <span>{{ $t('embed.limitation2') || 'Some features require a modern browser (Chrome, Firefox, Safari, Edge)' }}</span>
          </li>
          <li class="flex items-start gap-2">
            <span class="text-surface-400 mt-0.5">•</span>
            <span>{{ $t('embed.limitation3') || 'The iframe cannot access the parent page\'s DOM' }}</span>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>
