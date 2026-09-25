<template>
  <div>
    <!-- Hero Section: value prop (left) + JSON data flow visual (right) -->
    <section class="relative overflow-hidden">
      <div
        class="pointer-events-none absolute inset-x-0 top-0 -z-10 h-80 bg-gradient-to-b from-primary-500/[0.06] to-transparent dark:from-primary-500/[0.10]">
      </div>
      <div class="mx-auto max-w-[1280px] px-5 py-20 lg:py-28">
        <div class="grid items-center gap-12 lg:gap-16 lg:grid-cols-[minmax(0,0.95fr)_minmax(420px,1.05fr)]">

          <!-- Left: value proposition + CTAs -->
          <div class="text-left">
            <span
              class="inline-flex items-center gap-2 rounded-full border border-primary-200/70 bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700 dark:border-primary-800/60 dark:bg-primary-900/20 dark:text-primary-300">
              {{ $t('home.hero.badge') }}
            </span>

            <h1 class="mt-6 text-4xl font-black tracking-tight text-surface-900 dark:text-surface-100 sm:text-5xl lg:text-6xl">
              <span class="block">{{ $t('home.hero.title_line1') }}</span>
              <span class="block text-primary-600 dark:text-primary-400">{{ $t('home.hero.title_line2') }}</span>
            </h1>

            <p class="mt-6 max-w-xl text-lg leading-relaxed text-surface-600 dark:text-surface-400">
              {{ $t('home.hero.subtitle') }}
            </p>

            <div class="mt-8 flex flex-wrap items-center gap-3">
              <NuxtLinkLocale to="/tools"
                class="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-primary-700 hover:shadow-md dark:bg-primary-500 dark:hover:bg-primary-400">
                {{ $t('home.hero.cta_primary') }}
                <Icon name="lucide:arrow-right" class="h-4 w-4" />
              </NuxtLinkLocale>
              <NuxtLinkLocale to="/tools/format/json-editor"
                class="inline-flex items-center gap-2 rounded-xl border border-surface-200 bg-white px-5 py-3 text-sm font-bold text-surface-700 transition hover:border-primary-200 hover:text-primary-600 dark:border-surface-700 dark:bg-surface-900 dark:text-surface-200 dark:hover:border-primary-800 dark:hover:text-primary-400">
                <Icon name="lucide:edit-3" class="h-4 w-4" />
                {{ $t('home.hero.cta_secondary') }}
              </NuxtLinkLocale>
            </div>

            <ul class="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-medium text-surface-500 dark:text-surface-400">
              <li class="inline-flex items-center gap-1.5">
                <Icon name="lucide:image" class="h-3.5 w-3.5 text-primary-500" />
                {{ $t('home.hero.capability_1') }}
              </li>
              <li class="inline-flex items-center gap-1.5">
                <Icon name="lucide:database" class="h-3.5 w-3.5 text-primary-500" />
                {{ $t('home.hero.capability_2') }}
              </li>
              <li class="inline-flex items-center gap-1.5">
                <Icon name="lucide:shuffle" class="h-3.5 w-3.5 text-primary-500" />
                {{ $t('home.hero.capability_3') }}
              </li>
            </ul>
          </div>

          <!-- Right: live JSON data flow visual -->
          <div class="relative">
            <JsonHeroSvg />
          </div>

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
          <!-- Preview everything inside JSON -->
          <div class="rounded-xl border border-surface-200 bg-white p-6 text-center dark:border-surface-700 dark:bg-surface-900">
            <div class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
              <Icon name="lucide:image" class="h-6 w-6" />
            </div>
            <h3 class="font-bold text-surface-900 dark:text-surface-100">
              {{ $t('home.about.features.preview.title') }}
            </h3>
            <p class="mt-2 text-sm text-surface-500 dark:text-surface-400">
              {{ $t('home.about.features.preview.description') }}
            </p>
          </div>

          <!-- Built for huge files -->
          <div class="rounded-xl border border-surface-200 bg-white p-6 text-center dark:border-surface-700 dark:bg-surface-900">
            <div class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400">
              <Icon name="lucide:database" class="h-6 w-6" />
            </div>
            <h3 class="font-bold text-surface-900 dark:text-surface-100">
              {{ $t('home.about.features.large_file.title') }}
            </h3>
            <p class="mt-2 text-sm text-surface-500 dark:text-surface-400">
              {{ $t('home.about.features.large_file.description') }}
            </p>
          </div>

          <!-- One toolbox, many formats -->
          <div class="rounded-xl border border-surface-200 bg-white p-6 text-center dark:border-surface-700 dark:bg-surface-900">
            <div class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
              <Icon name="lucide:shuffle" class="h-6 w-6" />
            </div>
            <h3 class="font-bold text-surface-900 dark:text-surface-100">
              {{ $t('home.about.features.formats.title') }}
            </h3>
            <p class="mt-2 text-sm text-surface-500 dark:text-surface-400">
              {{ $t('home.about.features.formats.description') }}
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

    <!-- Global tool-picker modal (hero upload/paste entry) -->
    <ToolPickerModal />

  </div>
</template>

<script setup lang="ts">
const { featuredTools } = useTools()
const { t } = useI18n()
const { openPicker } = useToolPicker()
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

// SEO
useSeoMeta({
  titleTemplate: false as any,
  title: t('app.title'),
  description: t('app.description'),
  keywords: t('app.keywords'),
})
</script>
