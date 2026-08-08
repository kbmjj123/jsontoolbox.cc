<template>
  <div class="py-12">
    <div class="mx-auto max-w-[800px] px-5">
      <article v-if="post">
        <h1 class="text-3xl font-bold text-surface-900 dark:text-surface-100 mb-4">
          {{ post.title }}
        </h1>

        <div class="flex items-center gap-4 text-sm text-surface-500 dark:text-surface-400 mb-8">
          <div class="flex items-center gap-1">
            <Icon name="lucide:calendar" class="h-4 w-4" />
            <span>{{ new Date(post.date).toLocaleDateString() }}</span>
          </div>
          <div v-if="post.author" class="flex items-center gap-1">
            <Icon name="lucide:user" class="h-4 w-4" />
            <span>{{ post.author }}</span>
          </div>
        </div>

        <div class="prose prose-surface dark:prose-invert max-w-none">
          <ContentRenderer :value="post" />
        </div>
      </article>

      <div v-else class="text-center py-20">
        <h1 class="text-2xl font-bold text-surface-900 dark:text-surface-100">Post Not Found</h1>
        <p class="mt-4 text-surface-600 dark:text-surface-400">The blog post you are looking for does not exist.</p>
        <NuxtLink to="/blog" class="mt-6 inline-block text-primary-600 hover:text-primary-700">
          View All Posts
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const { t } = useI18n()

const { data: post } = await useAsyncData(`blog-${route.path}`, () =>
  queryCollection('blog')
    .where('_path', '=', route.path)
    .first()
)

useSeoMeta({
  title: () => post.value ? `${post.value.title} | ${t('app.name')}` : `Blog | ${t('app.name')}`,
  description: () => post.value?.description || '',
})
</script>
