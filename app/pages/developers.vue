<template>
  <div v-if="page" class="py-12">
    <div class="mx-auto max-w-[900px] px-5">
      <!-- Hero / live demo -->
      <section class="mb-12">
        <h1
          class="text-3xl md:text-4xl font-bold tracking-tight text-surface-900 dark:text-surface-100 mb-4"
        >
          {{ page.h1 || page.title }}
        </h1>
        <p class="text-lg text-surface-600 dark:text-surface-300 mb-8">
          {{ page.description }}
        </p>

        <ClientOnly>
          <div
            class="rounded-2xl border border-surface-200 dark:border-surface-700 shadow-card overflow-hidden"
          >
            <PackageJsonEditor
              v-model="demoValue"
              v-model:view="demoView"
              :attribution="true"
              height="420px"
            />
          </div>
          <template #fallback>
            <div
              class="h-[420px] rounded-2xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 flex items-center justify-center"
            >
              <span class="text-surface-500 dark:text-surface-400">
                {{ $t('system.loading') }}
              </span>
            </div>
          </template>
        </ClientOnly>
      </section>

      <!-- Browser extension -->
      <section class="mb-12">
        <NuxtLinkLocale
          to="/extension"
          class="group flex flex-col sm:flex-row sm:items-center gap-4 rounded-2xl border border-primary-200 dark:border-primary-800/60 bg-primary-50/60 dark:bg-primary-900/10 p-5 hover:border-primary-400 dark:hover:border-primary-600 transition-colors"
        >
          <span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300">
            <Icon name="lucide:puzzle" class="w-5 h-5" />
          </span>
          <span class="min-w-0 flex-1">
            <span class="block font-semibold text-surface-900 dark:text-surface-100">
              {{ $t('developers.extensionBanner.title') }}
            </span>
            <span class="mt-1 block text-sm text-surface-600 dark:text-surface-300">
              {{ $t('developers.extensionBanner.text') }}
            </span>
          </span>
          <span class="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-primary-700 dark:text-primary-300">
            {{ $t('developers.extensionBanner.link') }}
            <Icon name="lucide:arrow-right" class="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </span>
        </NuxtLinkLocale>
      </section>

      <!-- Documentation body -->
      <div
        class="rich-text prose prose-base md:prose-lg max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-surface-900 dark:prose-headings:text-surface-100 prose-p:text-surface-700 dark:prose-p:text-surface-300 prose-p:leading-relaxed prose-ul:text-surface-700 dark:prose-ul:text-surface-200 prose-li:text-surface-700 dark:prose-li:text-surface-200 prose-li:marker:text-primary-500 dark:prose-li:marker:text-primary-400 prose-a:text-primary-600 prose-a:no-underline hover:prose-a:underline dark:prose-a:text-primary-400 prose-strong:text-surface-900 dark:prose-strong:text-surface-100"
      >
        <ContentRenderer :value="page" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { getGeneralPage } = useGeneralContent()
const { t } = useI18n()

const { data: page } = await getGeneralPage('developers')

const demoValue = ref(
  JSON.stringify(
    {
      name: '@kbmjj123/json-editor',
      version: '0.1.0',
      features: ['editor', 'tree', 'validation', 'format', 'minify'],
      clientSide: true,
    },
    null,
    2
  )
)
const demoView = ref<'editor' | 'tree' | 'both'>('both')

// SEO
useSeoMeta({
  title: () => page.value?.title || t('developers.seo.title'),
  description: () => page.value?.description || t('developers.seo.description'),
})
</script>
