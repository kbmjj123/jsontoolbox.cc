<template>
  <div class="py-12">
    <div class="mx-auto max-w-[1200px] px-5">
      <h1 class="text-3xl font-bold text-surface-900 dark:text-surface-100 mb-8">
        Blog
      </h1>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div v-for="post in posts" :key="post._path" class="rounded-xl border border-surface-200 bg-white p-5 dark:border-surface-700 dark:bg-surface-900">
          <h2 class="font-bold text-surface-900 dark:text-surface-100">
            <NuxtLinkLocale :to="post._path" class="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
              {{ post.title }}
            </NuxtLinkLocale>
          </h2>
          <p class="mt-2 text-sm text-surface-500 dark:text-surface-400 line-clamp-2">
            {{ post.description }}
          </p>
          <div class="mt-4 flex items-center gap-2 text-xs text-surface-400">
            <Icon name="lucide:calendar" class="h-3 w-3" />
            <span>{{ new Date(post.date).toLocaleDateString() }}</span>
          </div>
        </div>
      </div>

      <div v-if="!posts?.length" class="text-center py-20">
        <p class="text-surface-500 dark:text-surface-400">No blog posts yet. Check back soon!</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n()
const { getBlogList } = useBlog()

const { data: posts } = await getBlogList()

useSeoMeta({
  title: 'JSON Blog — Tutorials & Guides',
  description: 'Articles and tutorials about JSON, data processing, and developer tools.',
})
</script>
