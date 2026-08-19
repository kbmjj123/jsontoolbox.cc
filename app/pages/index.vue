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

          <!-- CTA Buttons -->
          <div class="mt-10 flex items-center justify-center gap-4">
            <NuxtLinkLocale
              to="/tools"
              class="btn-primary px-6 py-3 text-sm"
            >
              {{ $t('home.hero.cta_primary') }}
            </NuxtLinkLocale>
            <NuxtLinkLocale
              to="/tools/format/json-formatter"
              class="flex items-center gap-2 rounded-xl border border-surface-200 bg-white px-6 py-3 text-sm font-bold text-surface-700 transition-colors hover:bg-surface-50 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-300 dark:hover:bg-surface-700"
            >
              {{ $t('home.hero.cta_secondary') }}
              <Icon name="lucide:arrow-right" class="h-4 w-4" />
            </NuxtLinkLocale>
          </div>
        </div>

        <!-- JSON Formatter embedded -->
        <div class="mt-16 rounded-2xl border border-surface-200 bg-white p-6 shadow-lg dark:border-surface-700 dark:bg-surface-900">
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <!-- Input -->
            <div>
              <div class="flex items-center justify-between mb-2">
                <label class="text-sm font-bold text-surface-700 dark:text-surface-300">Input JSON</label>
                <div class="flex gap-2">
                  <button @click="pasteFromClipboard" class="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400">
                    {{ $t('system.paste') }}
                  </button>
                  <button @click="clearInput" class="text-xs text-surface-500 hover:text-surface-700 dark:text-surface-400">
                    {{ $t('system.clear') }}
                  </button>
                </div>
              </div>
              <textarea
                v-model="inputJson"
                class="w-full h-64 rounded-xl border border-surface-200 bg-surface-50 p-4 font-mono text-sm text-surface-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-100 resize-none"
                placeholder='{"name": "JSON Toolbox", "version": "1.0"}'
              ></textarea>
            </div>

            <!-- Output -->
            <div>
              <div class="flex items-center justify-between mb-2">
                <label class="text-sm font-bold text-surface-700 dark:text-surface-300">Formatted Output</label>
                <div class="flex gap-2">
                  <button @click="copyOutput" class="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400">
                    {{ $t('system.copy') }}
                  </button>
                  <button @click="downloadOutput" class="text-xs text-surface-500 hover:text-surface-700 dark:text-surface-400">
                    {{ $t('system.download') }}
                  </button>
                </div>
              </div>
              <div class="relative">
                <pre class="w-full h-64 rounded-xl border border-surface-200 bg-surface-50 p-4 font-mono text-sm text-surface-900 overflow-auto dark:border-surface-700 dark:bg-surface-800 dark:text-surface-100">{{ formattedJson }}</pre>
                <div v-if="jsonError" class="absolute bottom-2 left-2 right-2 rounded-lg bg-red-50 border border-red-200 p-2 text-xs text-red-700 dark:bg-red-900/30 dark:border-red-800 dark:text-red-400">
                  {{ jsonError }}
                </div>
              </div>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="mt-4 flex flex-wrap gap-2">
            <button @click="formatJson" class="btn-primary px-4 py-2 text-xs">
              {{ $t('system.format') }}
            </button>
            <button @click="minifyJson" class="rounded-xl border border-surface-200 bg-white px-4 py-2 text-xs font-bold text-surface-700 hover:bg-surface-50 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-300 dark:hover:bg-surface-700">
              {{ $t('system.minify') }}
            </button>
            <button @click="validateJson" class="rounded-xl border border-surface-200 bg-white px-4 py-2 text-xs font-bold text-surface-700 hover:bg-surface-50 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-300 dark:hover:bg-surface-700">
              {{ $t('system.validate') }}
            </button>
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
              {{ $t('home.blog.items[0].link_text') }}
              <Icon name="lucide:arrow-right" class="w-3 h-3" />
            </span>
          </NuxtLinkLocale>
        </div>
      </div>
    </section>

    <!-- Static blog suggestions (shown when no blog posts exist yet) -->
    <section v-else class="py-16 bg-surface-50 dark:bg-surface-950">
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
            v-for="(article, index) in blogItems"
            :key="index"
            :to="article.to"
            class="group rounded-xl border border-surface-200 bg-white p-6 transition-all hover:border-primary-200 hover:shadow-md dark:border-surface-700 dark:bg-surface-900 dark:hover:border-primary-800"
          >
            <h3 class="font-bold text-surface-900 dark:text-surface-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
              {{ article.title }}
            </h3>
            <p class="mt-2 text-sm text-surface-500 dark:text-surface-400">
              {{ article.description }}
            </p>
            <span class="mt-4 inline-flex items-center gap-1 text-xs font-bold text-primary-600 dark:text-primary-400">
              {{ article.linkText }}
              <Icon name="lucide:arrow-right" class="w-3 h-3" />
            </span>
          </NuxtLinkLocale>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
const { featuredTools } = useTools()
const { t, locale } = useI18n()

// FAQ items from i18n (use tm() for raw message access, avoids SSR returnObjects issues)
const { tm } = useI18n()
const faqItems = computed(() => {
  const items = tm('home.faq.items')
  return Array.isArray(items) ? items : []
})

// Blog posts from content collection
const { data: blogPosts } = await useAsyncData('home-blog-posts', () =>
  queryCollection('blog')
    .where('locales', 'contains', locale.value)
    .order('date', 'DESC')
    .limit(3)
    .all()
)

// Blog article links (point to tools for now until blog system is ready)
const blogItems = computed(() => {
  const items = t('home.blog.items', { returnObjects: true })
  const links = [
    { to: '/tools/format/json-formatter' },
    { to: '/tools/convert/json-to-yaml' },
    { to: '/tools/validate/json-validator' },
  ]
  return (Array.isArray(items) ? items : []).map((item: any, i: number) => ({
    ...item,
    to: links[i]?.to || '/tools',
  }))
})

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

// JSON Formatter state
const inputJson = ref('')
const formattedJson = ref('')
const jsonError = ref('')

const formatJson = () => {
  try {
    const parsed = JSON.parse(inputJson.value)
    formattedJson.value = JSON.stringify(parsed, null, 2)
    jsonError.value = ''
  } catch (e) {
    jsonError.value = (e as Error).message
  }
}

const minifyJson = () => {
  try {
    const parsed = JSON.parse(inputJson.value)
    formattedJson.value = JSON.stringify(parsed)
    jsonError.value = ''
  } catch (e) {
    jsonError.value = (e as Error).message
  }
}

const validateJson = () => {
  try {
    JSON.parse(inputJson.value)
    formattedJson.value = '✅ Valid JSON'
    jsonError.value = ''
  } catch (e) {
    jsonError.value = (e as Error).message
    formattedJson.value = ''
  }
}

const pasteFromClipboard = async () => {
  try {
    const text = await navigator.clipboard.readText()
    inputJson.value = text
  } catch (e) {
    console.error('Failed to read clipboard:', e)
  }
}

const clearInput = () => {
  inputJson.value = ''
  formattedJson.value = ''
  jsonError.value = ''
}

const copyOutput = async () => {
  try {
    await navigator.clipboard.writeText(formattedJson.value)
  } catch (e) {
    console.error('Failed to copy:', e)
  }
}

const downloadOutput = () => {
  const blob = new Blob([formattedJson.value], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'formatted.json'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// SEO
useSeoMeta({
  titleTemplate: false as any,
  title: t('app.title'),
  description: t('app.description'),
  keywords: t('app.keywords'),
})
</script>
