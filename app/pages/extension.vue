<script setup lang="ts">
import extension from '~/config/extension.json'

const { t, locale } = useI18n()
const localePath = useLocalePath()

// Single source of truth — all metadata and all visible copy come from this file.
const m = extension
const c = computed<any>(() => (extension as any)[locale.value] || (extension as any).en)

const isPlaceholder = (v: unknown): boolean =>
  typeof v === 'string' && (!v.trim() || v === '__REPLACE_ME__')
const hasUrl = (v: string | undefined): boolean => !!v && !isPlaceholder(v)
const display = (v: string | undefined): string =>
  v == null || isPlaceholder(v) ? c.value.ui.tba : v
const r2Url = (path: string): string => `${m.r2Base}/${path}`
const fileName = (path: string): string => path.split('/').pop() || path

const { copied, copyToClipboard } = useClipboard()
const copyFailed = ref(false)
const copySha = async () => {
  const ok = await copyToClipboard(m.sha256)
  copyFailed.value = !ok
  if (!ok) window.setTimeout(() => { copyFailed.value = false }, 2500)
}
const copyLabel = computed(() =>
  copied.value ? c.value.ui.btnCopied
    : copyFailed.value ? c.value.ui.btnCopyFailed
      : c.value.ui.btnCopySha
)

const permissions = computed(() =>
  m.permissions.map((p: string) => ({
    value: p,
    reason: c.value.privacy.permissionExplanations[p] || c.value.ui.tba,
  }))
)

const downloadFiles = computed(() => [
  { label: c.value.ui.fileExtension, path: m.downloads.latest.extensionZip },
  { label: c.value.ui.fileFirefoxExtension, path: m.downloads.latest.firefoxZip },
  { label: c.value.ui.fileSource, path: m.downloads.latest.sourceZip },
  { label: c.value.ui.fileSha, path: m.downloads.latest.sha256Sums },
  { label: c.value.ui.fileChangelog, path: m.downloads.latest.changelog },
  { label: c.value.ui.fileInstall, path: m.downloads.latest.install },
].filter(f => hasUrl(f.path)))

// ── SEO ──────────────────────────────────────────────────────
useSeoMeta({
  title: () => c.value.seo?.title || t('extension.seo.title'),
  description: () => c.value.seo?.description || t('extension.seo.description'),
  robots: 'index, follow',
})

useSchemaOrg([
  defineBreadcrumb({
    itemListElement: [
      { name: () => t('app.nav.home'), item: '/' },
      { name: () => t('app.nav.extension'), item: localePath('/extension') },
    ],
  }),
  {
    '@type': 'SoftwareApplication',
    name: m.product,
    applicationCategory: 'BrowserApplication',
    ...(m.supportedBrowsers.length ? { operatingSystem: m.supportedBrowsers.join(', ') } : {}),
    ...(!isPlaceholder(m.version) ? { softwareVersion: m.version } : {}),
    url: 'https://jsontoolbox.cc/extension',
    ...(hasUrl(m.downloads.latest.extensionZip)
      ? { downloadUrl: r2Url(m.downloads.latest.extensionZip) }
      : {}),
    offers: { '@type': 'Offer', price: '0' },
  },
  // The primary WebPage must declare FAQPage, otherwise questions are emitted
  // but never attached to mainEntity (see tools/[category]/[slug].vue:181-184).
  defineWebPage({ '@type': ['WebPage', 'FAQPage'] }),
  ...c.value.faq.map((item: { question: string; answer: string }) =>
    defineQuestion({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })
  ),
])
</script>

<template>
  <div class="py-12">
    <div class="mx-auto max-w-[1000px] px-5">
      <!-- Hero -->
      <section class="mb-12 text-center">
        <span
          class="inline-block mb-4 rounded-full bg-primary-50 dark:bg-primary-900/30 px-3 py-1 text-xs font-medium text-primary-700 dark:text-primary-300"
        >
          {{ c.hero.kicker }}
        </span>
        <h1
          class="text-3xl md:text-4xl font-bold tracking-tight text-surface-900 dark:text-surface-100 mb-4"
        >
          {{ c.hero.title }}
        </h1>
        <p class="text-lg text-surface-600 dark:text-surface-300 max-w-2xl mx-auto mb-8">
          {{ c.hero.subtitle }}
        </p>

        <div class="flex flex-wrap items-center justify-center gap-3">
          <a
            v-if="hasUrl(m.storeUrl)"
            :href="m.storeUrl"
            target="_blank"
            rel="noopener"
            class="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-5 py-3 text-sm font-semibold text-white shadow-brand hover:bg-primary-700 transition-colors"
          >
            <Icon name="lucide:puzzle" class="w-4 h-4" />
            {{ c.ui.ctaStore }}
          </a>
          <span
            v-else
            class="inline-flex items-center rounded-xl border border-surface-200 dark:border-surface-700 px-5 py-3 text-sm font-medium text-surface-500 dark:text-surface-400"
          >
            {{ c.ui.storeComingSoon }}
          </span>

          <a
            v-if="hasUrl(m.firefoxStoreUrl)"
            :href="m.firefoxStoreUrl"
            target="_blank"
            rel="noopener"
            class="inline-flex items-center gap-2 rounded-xl border border-primary-300 dark:border-primary-700 px-5 py-3 text-sm font-semibold text-primary-700 dark:text-primary-300 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
          >
            <Icon name="lucide:puzzle" class="w-4 h-4" />
            {{ c.ui.ctaFirefoxStore }}
          </a>

          <a
            v-if="hasUrl(m.downloads.latest.extensionZip)"
            :href="r2Url(m.downloads.latest.extensionZip)"
            :download="fileName(m.downloads.latest.extensionZip)"
            class="inline-flex items-center gap-2 rounded-xl border border-surface-300 dark:border-surface-600 px-5 py-3 text-sm font-semibold text-surface-800 dark:text-surface-100 hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors"
          >
            <Icon name="lucide:download" class="w-4 h-4" />
            {{ c.ui.ctaDownload }}
          </a>
          <a
            v-if="hasUrl(m.downloads.latest.firefoxZip)"
            :href="r2Url(m.downloads.latest.firefoxZip)"
            :download="fileName(m.downloads.latest.firefoxZip)"
            class="inline-flex items-center gap-2 rounded-xl border border-surface-300 dark:border-surface-600 px-5 py-3 text-sm font-semibold text-surface-800 dark:text-surface-100 hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors"
          >
            <Icon name="lucide:download" class="w-4 h-4" />
            {{ c.ui.ctaDownloadFirefox }}
          </a>
          <span
            v-else-if="!hasUrl(m.downloads.latest.extensionZip)"
            class="inline-flex items-center rounded-xl border border-surface-200 dark:border-surface-700 px-5 py-3 text-sm font-medium text-surface-400 dark:text-surface-500 cursor-not-allowed"
          >
            {{ c.ui.downloadUnavailable }}
          </span>

          <a
            :href="m.githubUrl"
            target="_blank"
            rel="noopener"
            class="inline-flex items-center gap-2 px-3 py-3 text-sm font-medium text-surface-600 dark:text-surface-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
          >
            <Icon name="lucide:github" class="w-4 h-4" />
            {{ c.ui.ctaSource }}
          </a>
        </div>

        <div
          class="mt-8 rounded-xl border border-amber-200 dark:border-amber-800/60 bg-amber-50 dark:bg-amber-900/20 p-4 text-left"
        >
          <p class="text-sm font-semibold text-amber-900 dark:text-amber-200 mb-1">
            {{ c.ui.warningTitle }}
          </p>
          <p class="text-sm text-amber-800 dark:text-amber-300/90">
            {{ c.ui.warningText }}
          </p>
        </div>
      </section>

      <!-- Metadata strip -->
      <section class="mb-12">
        <div
          class="grid grid-cols-2 md:grid-cols-4 gap-3 rounded-2xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 p-4 shadow-card"
        >
          <div>
            <p class="text-xs text-surface-500 dark:text-surface-400 mb-1">{{ c.ui.badgeVersion }}</p>
            <p class="font-semibold text-surface-900 dark:text-surface-100">{{ display(m.version) }}</p>
          </div>
          <div>
            <p class="text-xs text-surface-500 dark:text-surface-400 mb-1">{{ c.ui.badgeReleased }}</p>
            <p class="font-semibold text-surface-900 dark:text-surface-100">{{ display(m.releaseDate) }}</p>
          </div>
          <div>
            <p class="text-xs text-surface-500 dark:text-surface-400 mb-1">{{ c.ui.badgeSize }}</p>
            <p class="font-semibold text-surface-900 dark:text-surface-100">{{ display(m.fileSize) }}</p>
          </div>
          <div>
            <p class="text-xs text-surface-500 dark:text-surface-400 mb-1">{{ c.ui.badgeBrowsers }}</p>
            <p class="font-semibold text-surface-900 dark:text-surface-100">
              {{ m.supportedBrowsers.length ? m.supportedBrowsers.join(', ') : c.ui.tba }}
            </p>
          </div>
        </div>

        <div
          class="mt-3 flex flex-wrap items-center gap-3 rounded-2xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 p-4 shadow-card"
        >
          <div class="min-w-0 flex-1">
            <p class="text-xs text-surface-500 dark:text-surface-400 mb-1">{{ c.ui.labelSha256 }}</p>
            <p class="font-mono text-xs md:text-sm text-surface-800 dark:text-surface-100 break-all">
              {{ display(m.sha256) }}
            </p>
          </div>
          <button
            v-if="!isPlaceholder(m.sha256)"
            type="button"
            class="shrink-0 rounded-lg border border-surface-300 dark:border-surface-600 px-3 py-2 text-sm font-medium text-surface-700 dark:text-surface-200 hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors"
            @click="copySha"
          >
            {{ copyLabel }}
          </button>
        </div>
      </section>

      <!-- Features -->
      <section class="mb-12">
        <h2 class="text-2xl font-bold text-surface-900 dark:text-surface-100 mb-6">
          {{ c.ui.sectionFeatures }}
        </h2>
        <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div
            v-for="(f, i) in c.features"
            :key="i"
            class="rounded-2xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 p-5 shadow-card"
          >
            <Icon :name="f.icon" class="w-6 h-6 text-primary-600 dark:text-primary-400 mb-3" />
            <h3 class="font-semibold text-surface-900 dark:text-surface-100 mb-2">{{ f.title }}</h3>
            <p class="text-sm text-surface-600 dark:text-surface-300">{{ f.description }}</p>
          </div>
        </div>
      </section>

      <!-- Screenshots -->
      <section class="mb-12">
        <h2 class="text-2xl font-bold text-surface-900 dark:text-surface-100 mb-6">
          {{ c.ui.sectionScreenshots }}
        </h2>
        <div class="grid md:grid-cols-2 gap-4">
          <figure
            v-for="(s, i) in c.screenshots"
            :key="i"
            class="rounded-2xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 p-3 shadow-card"
          >
            <a v-if="s.src" :href="s.src" target="_blank" rel="noopener" class="block">
              <img
                :src="s.src"
                :alt="s.caption"
                loading="lazy"
                class="aspect-video w-full rounded-xl object-cover hover:opacity-90 transition-opacity"
              />
            </a>
            <div
              v-else
              class="aspect-video w-full rounded-xl border-2 border-dashed border-surface-300 dark:border-surface-600 flex items-center justify-center text-center px-6"
            >
              <span class="text-sm text-surface-500 dark:text-surface-400">
                {{ c.ui.screenshotPlaceholder }}
              </span>
            </div>
            <figcaption class="mt-3 text-sm text-surface-600 dark:text-surface-300 text-center">
              {{ s.caption }}
            </figcaption>
          </figure>
        </div>
      </section>

      <!-- Use cases -->
      <section class="mb-12">
        <h2 class="text-2xl font-bold text-surface-900 dark:text-surface-100 mb-6">
          {{ c.ui.sectionUseCases }}
        </h2>
        <div class="grid sm:grid-cols-2 gap-4">
          <div
            v-for="(u, i) in c.useCases"
            :key="i"
            class="rounded-2xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 p-5 shadow-card"
          >
            <h3 class="font-semibold text-surface-900 dark:text-surface-100 mb-2">{{ u.title }}</h3>
            <p class="text-sm text-surface-600 dark:text-surface-300">{{ u.description }}</p>
          </div>
        </div>
      </section>

      <!-- Manual installation -->
      <section class="mb-12">
        <details class="group rounded-2xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 shadow-card">
          <summary
            class="cursor-pointer list-none px-5 py-4 font-semibold text-surface-900 dark:text-surface-100 flex items-center justify-between"
          >
            {{ c.ui.sectionManual }}
            <Icon name="lucide:chevron-down" class="w-5 h-5 text-surface-500 transition-transform group-open:rotate-180" />
          </summary>
          <div class="px-5 pb-5 border-t border-surface-100 dark:border-surface-700 pt-4">
            <ol class="list-decimal list-inside space-y-2 text-sm text-surface-700 dark:text-surface-200">
              <li v-for="(step, i) in c.manualInstall.steps" :key="i">{{ step }}</li>
            </ol>
            <p class="mt-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 p-3 text-sm text-amber-800 dark:text-amber-200">
              {{ c.ui.manualNote }}
            </p>
            <a
              v-if="hasUrl(m.downloads.latest.install)"
              :href="r2Url(m.downloads.latest.install)"
              :download="fileName(m.downloads.latest.install)"
              class="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary-600 dark:text-primary-400 hover:underline"
            >
              <Icon name="lucide:file-text" class="w-4 h-4" />
              {{ c.ui.manualInstallFile }}
            </a>
          </div>
        </details>
        <details class="group mt-3 rounded-2xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 shadow-card">
          <summary
            class="cursor-pointer list-none px-5 py-4 font-semibold text-surface-900 dark:text-surface-100 flex items-center justify-between"
          >
            {{ c.ui.sectionManualFirefox }}
            <Icon name="lucide:chevron-down" class="w-5 h-5 text-surface-500 transition-transform group-open:rotate-180" />
          </summary>
          <div class="px-5 pb-5 border-t border-surface-100 dark:border-surface-700 pt-4">
            <ol class="list-decimal list-inside space-y-2 text-sm text-surface-700 dark:text-surface-200">
              <li v-for="(step, i) in c.manualInstallFirefox.steps" :key="i">{{ step }}</li>
            </ol>
            <p class="mt-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 p-3 text-sm text-amber-800 dark:text-amber-200">
              {{ c.ui.manualFirefoxNote }}
            </p>
          </div>
        </details>
      </section>

      <!-- Privacy & permissions -->
      <section class="mb-12">
        <h2 class="text-2xl font-bold text-surface-900 dark:text-surface-100 mb-6">
          {{ c.ui.sectionPrivacy }}
        </h2>
        <div class="rounded-2xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 p-5 shadow-card">
          <p class="text-sm text-surface-700 dark:text-surface-200">{{ c.privacy.statement }}</p>

          <div v-if="m.permissions.length" class="mt-5 overflow-x-auto">
            <table class="w-full text-sm text-left">
              <thead>
                <tr class="border-b border-surface-200 dark:border-surface-700">
                  <th class="py-2 pr-4 font-semibold text-surface-900 dark:text-surface-100">{{ c.ui.permissionCol }}</th>
                  <th class="py-2 font-semibold text-surface-900 dark:text-surface-100">{{ c.ui.reasonCol }}</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="p in permissions"
                  :key="p.value"
                  class="border-b border-surface-100 dark:border-surface-700/60 last:border-0"
                >
                  <td class="py-3 pr-4 font-mono text-xs text-surface-800 dark:text-surface-200">{{ p.value }}</td>
                  <td class="py-3 text-surface-600 dark:text-surface-300">{{ p.reason }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p v-else class="mt-4 text-sm text-surface-500 dark:text-surface-400">
            {{ c.ui.permissionsTba }}
          </p>
        </div>
      </section>

      <!-- Download files -->
      <section class="mb-12">
        <h2 class="text-2xl font-bold text-surface-900 dark:text-surface-100 mb-6">
          {{ c.ui.sectionDownloads }}
        </h2>
        <div class="rounded-2xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 p-5 shadow-card overflow-x-auto">
          <table class="w-full text-sm text-left">
            <thead>
              <tr class="border-b border-surface-200 dark:border-surface-700">
                <th class="py-2 pr-4 font-semibold text-surface-900 dark:text-surface-100">{{ c.ui.fileCol }}</th>
                <th class="py-2 font-semibold text-surface-900 dark:text-surface-100">{{ c.ui.downloadCol }}</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="f in downloadFiles"
                :key="f.label"
                class="border-b border-surface-100 dark:border-surface-700/60 last:border-0"
              >
                <td class="py-3 pr-4 text-surface-800 dark:text-surface-200">{{ f.label }}</td>
                <td class="py-3">
                  <a
                    v-if="hasUrl(f.path)"
                    :href="r2Url(f.path)"
                    :download="fileName(f.path)"
                    class="inline-flex items-center gap-1.5 font-medium text-primary-600 dark:text-primary-400 hover:underline"
                  >
                    <Icon name="lucide:download" class="w-4 h-4" />
                    {{ fileName(f.path) }}
                  </a>
                  <span v-else class="text-surface-400 dark:text-surface-500">{{ c.ui.downloadUnavailable }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="mt-4 rounded-2xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800/60 p-5">
          <h3 class="font-semibold text-surface-900 dark:text-surface-100 mb-3">{{ c.ui.verifyTitle }}</h3>
          <ol class="list-decimal list-inside space-y-2 text-sm text-surface-700 dark:text-surface-200">
            <li v-for="(step, i) in c.ui.verifySteps" :key="i">{{ step }}</li>
          </ol>
        </div>
      </section>

      <!-- Version history -->
      <section class="mb-12">
        <h2 class="text-2xl font-bold text-surface-900 dark:text-surface-100 mb-6">
          {{ c.ui.sectionVersions }}
        </h2>
        <div class="rounded-2xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 p-5 shadow-card">
          <div class="flex flex-wrap items-center gap-3 pb-4 border-b border-surface-100 dark:border-surface-700/60">
            <span class="rounded-full bg-primary-50 dark:bg-primary-900/30 px-2.5 py-1 text-xs font-medium text-primary-700 dark:text-primary-300">
              {{ c.ui.latest }}
            </span>
            <span class="font-semibold text-surface-900 dark:text-surface-100">{{ display(m.version) }}</span>
            <span class="text-sm text-surface-500 dark:text-surface-400">{{ display(m.releaseDate) }}</span>
            <a
              v-if="hasUrl(m.downloads.latest.extensionZip)"
              :href="r2Url(m.downloads.latest.extensionZip)"
              :download="fileName(m.downloads.latest.extensionZip)"
              class="ml-auto text-sm font-medium text-primary-600 dark:text-primary-400 hover:underline"
            >
              {{ c.ui.ctaDownload }}
            </a>
            <a
              v-if="hasUrl(m.downloads.latest.firefoxZip)"
              :href="r2Url(m.downloads.latest.firefoxZip)"
              :download="fileName(m.downloads.latest.firefoxZip)"
              class="text-sm font-medium text-primary-600 dark:text-primary-400 hover:underline"
            >
              {{ c.ui.ctaDownloadFirefox }}
            </a>
          </div>
          <div
            v-for="(v, i) in m.downloads.previous"
            :key="i"
            class="flex flex-wrap items-center gap-3 py-4 border-b border-surface-100 dark:border-surface-700/60 last:border-0 last:pb-0"
          >
            <span class="font-semibold text-surface-900 dark:text-surface-100">{{ v.version }}</span>
            <span class="text-sm text-surface-500 dark:text-surface-400">{{ v.releaseDate }}</span>
            <a
              v-if="hasUrl(v.extensionZip)"
              :href="r2Url(v.extensionZip)"
              :download="fileName(v.extensionZip)"
              class="ml-auto text-sm font-medium text-primary-600 dark:text-primary-400 hover:underline"
            >
              {{ c.ui.downloadCol }}
            </a>
          </div>
          <p v-if="!m.downloads.previous.length" class="pt-4 text-sm text-surface-500 dark:text-surface-400">
            {{ c.ui.previous }} — {{ c.ui.downloadUnavailable }}
          </p>
        </div>
      </section>

      

      <!-- GitHub / Feedback -->
      <section class="mb-4">
        <h2 class="text-2xl font-bold text-surface-900 dark:text-surface-100 mb-6">
          {{ c.ui.sectionGithub }}
        </h2>
        <div class="rounded-2xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 p-5 shadow-card">
          <p class="text-sm text-surface-700 dark:text-surface-200 mb-4">{{ c.github.text }}</p>
          <div class="flex flex-wrap gap-4">
            <a :href="m.githubUrl" target="_blank" rel="noopener" class="inline-flex items-center gap-2 text-sm font-medium text-primary-600 dark:text-primary-400 hover:underline">
              <Icon name="lucide:github" class="w-4 h-4" />
              GitHub
            </a>
            <a :href="m.feedbackUrl" target="_blank" rel="noopener" class="inline-flex items-center gap-2 text-sm font-medium text-primary-600 dark:text-primary-400 hover:underline">
              <Icon name="lucide:message-square" class="w-4 h-4" />
              {{ c.ui.feedbackLabel }}
            </a>
          </div>
        </div>
      </section>

      <!-- FAQ -->
      <section class="mb-12">
        <h2 class="text-2xl font-bold text-surface-900 dark:text-surface-100 mb-6">
          {{ c.ui.sectionFaq }}
        </h2>
        <ToolFaq :faq="c.faq" />
      </section>
    </div>
  </div>
</template>
