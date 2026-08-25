<template>
  <div>
    <!-- Hero Section -->
    <section class="relative overflow-hidden py-16 sm:py-24">
      <div class="mx-auto max-w-[1200px] px-5">
        <div class="text-center">

          <!-- Title -->
          <h1 class="text-4xl font-black tracking-tight text-surface-900 dark:text-surface-100 sm:text-5xl lg:text-6xl">
            <span class="block">{{ $t('home.hero.title_line1') }}</span>
            <span class="block text-primary-600 dark:text-primary-400">{{ $t('home.hero.title_line2') }}</span>
          </h1>

          <!-- Subtitle -->
          <p class="mx-auto mt-6 max-w-2xl text-lg text-surface-600 dark:text-surface-400">
            {{ $t('home.hero.subtitle') }}
          </p>

        </div>

        <!-- JSON Editor embedded -->
        <div class="mt-16">
          <JsonEditor v-if="editorTool" :tool="editorTool" show-view-toggle default-view-mode="rich" />
        </div>
      </div>
    </section>

    <!-- Tools Grid Section -->
    <section class="py-16 bg-surface-50 dark:bg-surface-950">
      <div class="mx-auto max-w-[1200px] px-5">
        <div class="text-center mb-12">
          <h2 class="text-2xl font-bold text-surface-900 dark:text-surface-100 sm:text-3xl">
            {{ $t('home.tools_section.title') }}
          </h2>
          <p class="mt-4 text-surface-600 dark:text-surface-400">
            {{ $t('home.tools_section.subtitle') }}
          </p>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <NuxtLinkLocale
            v-for="tool in featuredTools"
            :key="tool.slug"
            :to="tool.path"
            class="group rounded-xl border border-surface-200 bg-white p-5 transition-all hover:border-primary-200 hover:shadow-md dark:border-surface-700 dark:bg-surface-900 dark:hover:border-primary-800"
          >
            <div class="flex items-start gap-3">
              <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
                <Icon :name="tool.icon" class="h-5 w-5" />
              </div>
              <div>
                <h3 class="font-bold text-surface-900 dark:text-surface-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                  {{ tool.name }}
                </h3>
                <p class="mt-1 text-sm text-surface-500 dark:text-surface-400">
                  {{ tool.description }}
                </p>
              </div>
            </div>
          </NuxtLinkLocale>
        </div>

        <div class="mt-8 text-center">
          <NuxtLinkLocale
            to="/tools"
            class="inline-flex items-center gap-2 text-sm font-bold text-primary-600 hover:text-primary-700 dark:text-primary-400"
          >
            {{ $t('home.tools_section.view_all') }}
            <Icon name="lucide:arrow-right" class="w-4 h-4" />
          </NuxtLinkLocale>
        </div>
      </div>
    </section>

    <!-- About Section -->
    <section class="py-16">
      <div class="mx-auto max-w-[1200px] px-5">
        <div class="text-center mb-12">
          <h2 class="text-2xl font-bold text-surface-900 dark:text-surface-100 sm:text-3xl">
            {{ $t('home.about.title') }}
          </h2>
          <p class="mt-4 mx-auto max-w-3xl text-surface-600 dark:text-surface-400">
            {{ $t('home.about.description') }}
          </p>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <!-- Client-Side -->
          <div class="rounded-xl border border-surface-200 bg-white p-6 text-center dark:border-surface-700 dark:bg-surface-900">
            <div class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400">
              <Icon name="lucide:shield-check" class="h-6 w-6" />
            </div>
            <h3 class="font-bold text-surface-900 dark:text-surface-100">
              {{ $t('home.about.features.client_side.title') }}
            </h3>
            <p class="mt-2 text-sm text-surface-500 dark:text-surface-400">
              {{ $t('home.about.features.client_side.description') }}
            </p>
          </div>

          <!-- Fast & Free -->
          <div class="rounded-xl border border-surface-200 bg-white p-6 text-center dark:border-surface-700 dark:bg-surface-900">
            <div class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
              <Icon name="lucide:zap" class="h-6 w-6" />
            </div>
            <h3 class="font-bold text-surface-900 dark:text-surface-100">
              {{ $t('home.about.features.free.title') }}
            </h3>
            <p class="mt-2 text-sm text-surface-500 dark:text-surface-400">
              {{ $t('home.about.features.free.description') }}
            </p>
          </div>

          <!-- Multi-Language -->
          <div class="rounded-xl border border-surface-200 bg-white p-6 text-center dark:border-surface-700 dark:bg-surface-900">
            <div class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
              <Icon name="lucide:globe" class="h-6 w-6" />
            </div>
            <h3 class="font-bold text-surface-900 dark:text-surface-100">
              {{ $t('home.about.features.multi_lang.title') }}
            </h3>
            <p class="mt-2 text-sm text-surface-500 dark:text-surface-400">
              {{ $t('home.about.features.multi_lang.description') }}
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Privacy Section -->
    <section class="py-16 bg-surface-50 dark:bg-surface-950">
      <div class="mx-auto max-w-[1200px] px-5">
        <div class="mx-auto max-w-3xl text-center">
          <div class="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
            <Icon name="lucide:lock" class="h-7 w-7" />
          </div>
          <h2 class="text-2xl font-bold text-surface-900 dark:text-surface-100 sm:text-3xl">
            {{ $t('home.privacy.title') }}
          </h2>
          <p class="mt-4 text-surface-600 dark:text-surface-400">
            {{ $t('home.privacy.description') }}
          </p>
          <NuxtLinkLocale
            to="/privacy"
            class="mt-6 inline-flex items-center gap-2 text-sm font-bold text-primary-600 hover:text-primary-700 dark:text-primary-400"
          >
            {{ $t('home.privacy.link_text') }}
            <Icon name="lucide:arrow-right" class="w-4 h-4" />
          </NuxtLinkLocale>
        </div>
      </div>
    </section>

    <!-- Blog / Learn More Section (only shown when blog posts exist) -->
    <section v-if="blogPosts && blogPosts.length" class="py-16 bg-surface-50 dark:bg-surface-950">
      <div class="mx-auto max-w-[1200px] px-5">
        <div class="text-center mb-12">
          <h2 class="text-2xl font-bold text-surface-900 dark:text-surface-100 sm:text-3xl">
            {{ $t('home.blog.title') }}
          </h2>
          <p class="mt-4 text-surface-600 dark:text-surface-400">
            {{ $t('home.blog.description') }}
          </p>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <NuxtLinkLocale
            v-for="post in blogPosts"
            :key="post.path"
            :to="post.path"
            class="group rounded-xl border border-surface-200 bg-white p-6 transition-all hover:border-primary-200 hover:shadow-md dark:border-surface-700 dark:bg-surface-900 dark:hover:border-primary-800"
          >
            <h3 class="font-bold text-surface-900 dark:text-surface-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
              {{ post.title }}
            </h3>
            <p class="mt-2 text-sm text-surface-500 dark:text-surface-400 line-clamp-2">
              {{ post.description }}
            </p>
            <span class="mt-4 inline-flex items-center gap-1 text-xs font-bold text-primary-600 dark:text-primary-400">
              {{ $t('home.blog.items.what_is_json.link_text') }}
              <Icon name="lucide:arrow-right" class="w-3 h-3" />
            </span>
          </NuxtLinkLocale>
        </div>
      </div>
    </section>

		<!-- FAQ Section -->
    <section class="py-16">
      <div class="mx-auto max-w-[1200px] px-5">
        <div class="text-center mb-12">
          <h2 class="text-2xl font-bold text-surface-900 dark:text-surface-100 sm:text-3xl">
            {{ $t('home.faq.title') }}
          </h2>
        </div>

        <div class="mx-auto max-w-3xl">
          <ToolFaq :faq="faqItems" />
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
const { featuredTools, getToolDetail } = useTools()
const { t } = useI18n()
const { getBlogList } = useBlog()

// FAQ items from i18n (逐个取值，避免 returnObjects 返回消息 AST)
const faqItems = computed(() => {
  const count = 5
  return Array.from({ length: count }, (_, i) => ({
    question: t(`home.faq.items.${i}.question`),
    answer: t(`home.faq.items.${i}.answer`),
  }))
})

// Blog posts via useBlog composable
const { data: blogPosts } = await getBlogList(3)

// FAQPage Schema.org JSON-LD
useSchemaOrg(
  faqItems.value.map(item =>
    defineQuestion({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })
  )
)

// Embedded JSON Editor tool data
const editorTool = computed(() => getToolDetail('format', 'json-editor'))

// SEO
useSeoMeta({
  titleTemplate: false as any,
  title: t('app.title'),
  description: t('app.description'),
  keywords: t('app.keywords'),
})
</script>
