<template>
  <!-- The whole block including its heading is guarded here: a tool may list
       only posts that are still drafts or untranslated, and rendering the
       heading from the caller would leave an empty heading behind. -->
  <section v-if="posts.length > 0">
    <h2 class="mb-4 text-lg font-bold text-surface-900 dark:text-surface-100">
      {{ $t('blog.related_title') }}
    </h2>
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <NuxtLinkLocale
        v-for="post in posts"
        :key="post.path"
        :to="getCleanPath(post.path)"
        class="flex items-center gap-3 rounded-xl border border-surface-200 bg-white px-4 py-3 transition-colors hover:border-primary-200 hover:bg-primary-50/50 dark:border-surface-700 dark:bg-surface-900 dark:hover:border-primary-800 dark:hover:bg-primary-900/20"
      >
        <div class="hidden shrink-0 h-14 w-14 overflow-hidden rounded-lg bg-surface-100 sm:block dark:bg-surface-800">
          <img
            v-if="post.image"
            :src="post.image"
            :alt="post.title"
            loading="lazy"
            decoding="async"
            class="h-full w-full object-cover"
          />
          <div v-else class="flex h-full w-full items-center justify-center text-surface-400 dark:text-surface-500">
            <Icon name="lucide:file-text" class="h-5 w-5" />
          </div>
        </div>
        <div class="min-w-0">
          <div class="text-sm font-medium text-surface-800 line-clamp-2 dark:text-surface-200">
            {{ post.title }}
          </div>
          <div class="mt-0.5 text-xs text-surface-400 line-clamp-2 dark:text-surface-500">
            {{ post.description }}
          </div>
          <div class="mt-1 text-[11px] text-surface-400 dark:text-surface-500">
            {{ formatDate(post.date) }}
          </div>
        </div>
      </NuxtLinkLocale>
    </div>
  </section>
</template>

<script setup lang="ts">
const props = defineProps<{
  slugs?: string[]
}>()

const { locale } = useI18n()
const { getPostsBySlugs, getCleanPath } = useBlog()

const { data } = await getPostsBySlugs(props.slugs || [])

// getPostsBySlugs already drops drafts and posts unavailable in the current
// locale; re-sorting restores the curated order declared in the tool JSON.
const posts = computed(() => {
  const order = props.slugs || []
  return [...(data.value || [])].sort((a: any, b: any) => {
    return order.indexOf(slugOf(a)) - order.indexOf(slugOf(b))
  })
})

const slugOf = (post: any) => (post.path || '').split('/').pop() || ''

// Locale-dependent date formatting — same try/catch guard the blog pages use
// so a hydration mismatch never throws.
const formatDate = (dateStr: string) => {
  if (!dateStr) return ''
  try {
    return new Date(dateStr).toLocaleDateString(locale.value, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return dateStr
  }
}
</script>
