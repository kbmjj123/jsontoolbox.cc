<template>
  <div v-if="page" class="py-12">
    <div class="mx-auto max-w-[800px] px-5">
      <!-- Header -->
      <!-- <header class="mb-10">
        <h1 class="text-3xl font-bold text-surface-900 dark:text-surface-100 mb-4">
          {{ page.title }}
        </h1>
        <p v-if="page.updatedAt" class="text-lg text-surface-600 dark:text-surface-400">
          <strong>{{ $t('app.footer.last_updated') }}:</strong> {{ formatDate(page.updatedAt) }}
        </p>
      </header> -->

      <!-- Content Body -->
      <div class="rich-text prose prose-base md:prose-lg max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-surface-900 dark:prose-headings:text-surface-100 prose-p:text-surface-700 dark:prose-p:text-surface-300 prose-p:leading-relaxed prose-ul:text-surface-700 dark:prose-ul:text-surface-200 prose-li:text-surface-700 dark:prose-li:text-surface-200 prose-li:marker:text-primary-500 dark:prose-li:marker:text-primary-400 prose-a:text-primary-600 prose-a:no-underline hover:prose-a:underline dark:prose-a:text-primary-400 prose-strong:text-surface-900 dark:prose-strong:text-surface-100">
        <ContentRenderer :value="page" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { locale } = useI18n()
const { getGeneralPage } = useGeneralContent()

const { data: page } = await getGeneralPage('terms-of-service')

// Format date
const formatDate = (dateStr: string) => {
  if (!dateStr) return ''
  try {
    return new Date(dateStr).toLocaleDateString(locale.value, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }
  catch {
    return dateStr
  }
}

// SEO
useSeoMeta({
  title: () => page.value?.title || 'Terms of Service',
  description: () => page.value?.description || 'JSON Toolbox terms of service.',
})
</script>
