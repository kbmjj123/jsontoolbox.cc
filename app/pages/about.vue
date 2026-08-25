<template>
  <div v-if="page" class="py-12">
    <div class="mx-auto max-w-[800px] px-5">
      <!-- Header -->
      <!-- Content Body -->
      <div class="rich-text prose prose-base md:prose-lg max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-surface-900 dark:prose-headings:text-surface-100 prose-p:text-surface-700 dark:prose-p:text-surface-300 prose-p:leading-relaxed prose-ul:text-surface-700 dark:prose-ul:text-surface-200 prose-li:text-surface-700 dark:prose-li:text-surface-200 prose-li:marker:text-primary-500 dark:prose-li:marker:text-primary-400 prose-a:text-primary-600 prose-a:no-underline hover:prose-a:underline dark:prose-a:text-primary-400 prose-strong:text-surface-900 dark:prose-strong:text-surface-100">
        <ContentRenderer :value="page" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { getGeneralPage } = useGeneralContent()

const { data: page } = await getGeneralPage('about')

// SEO
useSeoMeta({
  title: () => page.value?.title || 'About — Free Online JSON Tools',
  description: () => page.value?.description || 'Learn about JSON Toolbox — a free, open-source collection of JSON tools for developers.',
})
</script>
