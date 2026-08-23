<template>
  <div class="min-h-screen pt-8 md:pt-16 pb-20 transition-colors duration-300">
    <div class="mx-auto max-w-[1200px] px-5">

      <!-- Header -->
      <div class="text-center mb-10 md:mb-20 max-w-3xl mx-auto">
        <h1 class="text-4xl font-extrabold tracking-tight text-surface-900 dark:text-surface-100 sm:text-5xl mb-6">
          {{ $t('blog.title') }}
        </h1>
        <p class="text-lg text-surface-600 dark:text-surface-400 text-balance leading-relaxed">
          {{ $t('blog.subtitle') }}
        </p>
      </div>

      <!-- Category Filter -->
      <div v-if="false" class="flex flex-wrap justify-center gap-2 mb-10">
        <button
          v-for="item in categoryList"
          :key="item.key"
          @click="activeCategory = item.key"
          :class="[
            'px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200',
            activeCategory === item.key
              ? 'bg-primary-600 text-white shadow-md shadow-primary-500/30'
              : 'bg-surface-100 text-surface-600 hover:bg-surface-200 dark:bg-surface-800 dark:text-surface-300 dark:hover:bg-surface-700'
          ]"
        >
          {{ item.label }}
        </button>
      </div>

      <!-- Post Grid -->
      <div v-if="filteredPosts?.length" class="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        <article
          v-for="(post, index) in filteredPosts"
          :key="post.path"
          class="group flex flex-col h-full overflow-hidden rounded-3xl border transition-all duration-300 bg-white/60 backdrop-blur-md border-surface-200 dark:bg-surface-900/40 dark:border-surface-700/50 hover:-translate-y-2 hover:shadow-2xl hover:border-primary-500/50 hover:bg-white/80 dark:hover:bg-surface-800/60"
        >
          <NuxtLinkLocale :to="getCleanPath(post.path)" class="flex flex-1 flex-col">

            <!-- Cover Image -->
            <div class="relative aspect-[16/10] w-full overflow-hidden bg-surface-100 dark:bg-surface-900 border-b border-surface-100 dark:border-surface-700/50">
              <img
                v-if="post.image"
                :src="post.image"
                :alt="post.title"
                :loading="index < 6 ? 'eager' : 'lazy'"
                decoding="async"
                class="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div v-else class="flex h-full w-full items-center justify-center text-surface-300 dark:text-surface-600">
                <Icon name="lucide:file-text" class="h-12 w-12" />
              </div>

              <!-- Date Badge -->
              <div class="absolute top-4 left-4 inline-flex items-center rounded-lg bg-white/90 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-surface-900 backdrop-blur-sm shadow-sm border border-surface-200 dark:bg-surface-900/80 dark:text-surface-100 dark:border-surface-700/50">
                {{ formatDate(post.date) }}
              </div>
            </div>

            <!-- Content -->
            <div class="flex flex-1 flex-col p-6 sm:p-8">

              <!-- Tags -->
              <div v-if="post.tags" class="mb-4 flex flex-wrap gap-2">
                <span
                  v-for="tag in post.tags.slice(0, 3)"
                  :key="tag"
                  class="inline-flex items-center rounded-md bg-surface-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-surface-600 transition-colors group-hover:bg-primary-50 group-hover:text-primary-600 dark:bg-surface-900 dark:text-surface-400 dark:group-hover:bg-primary-900/30 dark:group-hover:text-primary-400"
                >
                  {{ tag }}
                </span>
              </div>

              <!-- Title -->
              <h2 class="mb-3 text-xl md:text-2xl font-bold leading-tight text-surface-900 transition-colors group-hover:text-primary-600 dark:text-surface-100 dark:group-hover:text-primary-400 line-clamp-2">
                {{ post.title }}
              </h2>

              <!-- Description -->
              <p class="mb-6 flex-1 text-sm leading-relaxed text-surface-600 dark:text-surface-400 line-clamp-3">
                {{ post.description }}
              </p>

              <!-- Footer -->
              <div class="mt-auto flex items-center justify-between border-t border-surface-200/50 pt-5 dark:border-surface-700/50">
                <div class="flex items-center gap-2 text-xs font-medium text-surface-400">
                  <Icon name="lucide:clock" class="h-3.5 w-3.5" />
                  <span>Article</span>
                </div>
                <span class="flex items-center gap-2 text-sm font-bold text-surface-900 transition-all group-hover:gap-3 group-hover:text-primary-600 dark:text-surface-100 dark:group-hover:text-primary-400">
                  {{ $t('blog.view_more') }}
                  <Icon name="lucide:arrow-right" class="h-4 w-4" />
                </span>
              </div>
            </div>

          </NuxtLinkLocale>
        </article>
      </div>

      <!-- Empty State -->
      <div v-else class="flex flex-col items-center justify-center py-32 text-center">
        <div class="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-surface-100/50 border border-surface-200 backdrop-blur dark:bg-surface-900 dark:border-surface-700/50">
          <Icon name="lucide:coffee" class="h-10 w-10 text-surface-400" />
        </div>
        <h3 class="text-xl font-bold text-surface-900 dark:text-surface-100 mb-2">
          {{ $t('blog.no_posts') }}
        </h3>
        <p class="text-surface-500 dark:text-surface-400">
          {{ $t('blog.no_posts_desc') }}
        </p>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import categoryI18n from '~/assets/config/blog-category.json'

const { getBlogList } = useBlog()
const { t, locale } = useI18n()
const localePath = useLocalePath()

// Category filter state
const activeCategory = ref('all')

// Category map for current locale
const categoryMap = computed(() => {
  return categoryI18n[locale.value as keyof typeof categoryI18n]
    ?? categoryI18n['en']
})

// Generate category list (includes 'all')
const categoryList = computed(() => {
  return Object.entries(categoryMap.value).map(([key, label]) => ({ key, label }))
})

// Fetch blog posts
const { data: posts } = await getBlogList()

// Filtered posts by category
const filteredPosts = computed(() => {
  if (!posts.value) return []
  if (activeCategory.value === 'all') return posts.value
  return posts.value.filter((p: any) => p.category === activeCategory.value)
})

// Clean locale prefix from path for routing
const getCleanPath = (postPath: string) => {
  if (!postPath) return '/'
  return postPath.replace(/^\/(en|zh|zh-HK|zh-TW|ja)/, '') || '/'
}

// Format date (hydration-safe)
const formatDate = (dateStr: string) => {
  if (!dateStr) return ''
  try {
    return new Date(dateStr).toLocaleDateString(locale.value, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  } catch {
    return dateStr
  }
}

// SEO
useSeoMeta({
  title: () => t('blog.seo.title'),
  description: () => t('blog.seo.description'),
  keywords: () => t('blog.seo.keywords'),
  ogTitle: () => t('blog.seo.title'),
  ogDescription: () => t('blog.seo.description'),
  ogType: 'website',
})

// Schema.org
useSchemaOrg([
  defineWebPage({
    '@type': 'CollectionPage',
    name: () => t('blog.seo.title'),
    description: () => t('blog.seo.description'),
    inLanguage: () => locale.value as string
  }),
  defineBreadcrumb({
    itemListElement: [
      { name: () => t('app.nav.home'), item: '/' },
      { name: () => t('blog.title'), item: localePath('/blog') }
    ]
  })
])
</script>
