<template>
  <div v-if="post" class="min-h-screen pt-2 pb-20 transition-colors duration-300">
    <section class="mx-auto max-w-[1200px] flex flex-col xl:flex-row items-stretch xl:items-start gap-0 xl:gap-12">
      <article class="max-w-[900px] px-5 sm:px-6">

        <!-- Breadcrumb -->
        <nav class="mb-10 flex items-center flex-wrap gap-2 text-sm font-medium text-surface-500 dark:text-surface-400" aria-label="Breadcrumb">
          <NuxtLink
            :to="localePath('/')"
            :title="$t('app.nav.home')"
            class="flex items-center gap-1.5 transition-colors hover:text-primary-600 dark:hover:text-primary-400"
          >
            <Icon name="lucide:home" class="h-4 w-4" />
            <span>{{ $t('app.nav.home') }}</span>
          </NuxtLink>

          <Icon name="lucide:chevron-right" class="h-4 w-4 text-surface-300 dark:text-surface-600" />

          <NuxtLink
            :to="localePath('/blog')"
            :title="$t('blog.title')"
            class="transition-colors hover:text-primary-600 dark:hover:text-primary-400"
          >
            {{ $t('blog.title') }}
          </NuxtLink>

          <Icon name="lucide:chevron-right" class="h-4 w-4 text-surface-300 dark:text-surface-600" />

          <span class="truncate max-w-[200px] md:max-w-md font-bold">
            {{ post.title }}
          </span>
        </nav>

        <!-- Header -->
        <header class="mb-12 text-center">
          <h1 class="mb-8 text-xl md:text-4xl font-extrabold tracking-tight text-surface-900 dark:text-surface-100 sm:text-3xl lg:text-4xl text-balance">
            {{ post.h1 || post.title }}
          </h1>

          <div class="flex flex-wrap items-center justify-center gap-4">
            <!-- Author -->
            <div class="flex items-center gap-2 rounded-full border border-surface-200 bg-white/60 px-4 py-1.5 text-sm font-medium text-surface-700 backdrop-blur-sm dark:border-surface-700/50 dark:bg-surface-900/40 dark:text-surface-300">
              <div class="flex h-5 w-5 items-center justify-center rounded-full bg-primary-100 text-primary-600 dark:bg-primary-900 dark:text-primary-400">
                <Icon name="lucide:user" class="h-3 w-3" />
              </div>
              <span>{{ post.author || 'JSON Toolbox Team' }}</span>
            </div>

            <!-- Date -->
            <div class="flex items-center gap-2 rounded-full border border-surface-200 bg-white/60 px-4 py-1.5 text-sm font-medium text-surface-700 backdrop-blur-sm dark:border-surface-700/50 dark:bg-surface-900/40 dark:text-surface-300">
              <Icon :name="post.lastmod ? 'lucide:calendar-sync' : 'lucide:calendar'" class="h-4 w-4 text-surface-400" />
              <time :datetime="post.lastmod || post.date">
                {{ formatDate(post.lastmod || post.date) }}
              </time>
            </div>
          </div>

          <!-- Promo CTA -->
          <div v-if="cta" class="mt-10 overflow-hidden rounded-2xl border border-primary-100 bg-primary-50/50 p-6 text-left dark:border-primary-900/30 dark:bg-primary-900/10 backdrop-blur-sm">
            <div class="flex flex-col sm:flex-row items-center justify-between gap-6">
              <div class="flex items-start gap-4">
                <div class="hidden sm:flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-primary-600 shadow-sm dark:bg-surface-900 dark:text-primary-400">
                  <Icon name="lucide:zap" class="h-6 w-6" />
                </div>
                <div>
                  <strong class="font-bold text-primary-900 dark:text-primary-100 text-lg">{{ $t('blog.pro_tip') }}</strong>
                  <p class="text-primary-800/80 dark:text-primary-200/80 text-sm sm:text-base">{{ cta.text }}</p>
                </div>
              </div>
              <NuxtLinkLocale
                :to="cta.link"
                class="shrink-0 rounded-xl bg-primary-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-primary-500/30 transition-all hover:bg-primary-700 hover:scale-105 active:scale-95 whitespace-nowrap"
              >
                {{ cta.btn }} →
              </NuxtLinkLocale>
            </div>
          </div>
        </header>

        <!-- Content Body -->
        <div class="relative overflow-hidden rounded-3xl border border-surface-200 bg-white/90 p-6 shadow-xl backdrop-blur-md dark:border-surface-700/50 dark:bg-surface-900/60 sm:p-10 md:p-12">
          <div class="rich-text prose prose-base md:prose-lg max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-surface-900 dark:prose-headings:text-surface-100 prose-p:text-surface-700 dark:prose-p:text-surface-300 prose-p:leading-relaxed prose-ul:text-surface-700 dark:prose-ul:text-surface-200 prose-li:text-surface-700 dark:prose-li:text-surface-200 prose-li:marker:text-primary-500 dark:prose-li:marker:text-primary-400 prose-a:text-primary-600 prose-a:no-underline hover:prose-a:underline dark:prose-a:text-primary-400 prose-strong:text-surface-900 dark:prose-strong:text-surface-100 prose-img:rounded-2xl prose-img:shadow-lg prose-img:border prose-img:border-surface-200 dark:prose-img:border-surface-700 prose-code:text-primary-600 dark:prose-code:text-primary-400 prose-code:bg-surface-100/50 dark:prose-code:bg-surface-800/50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:before:content-none prose-code:after:content-none prose-th:text-surface-900 dark:prose-th:text-surface-100 prose-td:text-surface-700 dark:prose-td:text-surface-200 prose-tr:border-surface-200 dark:prose-tr:border-surface-700">
            <ContentRenderer :value="post" />
          </div>

          <!-- Tags -->
          <div v-if="post.tags" class="mt-12 flex flex-wrap gap-2 border-t border-surface-200/50 pt-8 dark:border-surface-700/50">
            <span
              v-for="tag in post.tags"
              :key="tag"
              class="inline-flex items-center rounded-md bg-surface-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-surface-600 dark:bg-surface-900 dark:text-surface-400 hover:bg-primary-50 hover:text-primary-600 transition-colors cursor-default"
            >
              #{{ tag }}
            </span>
          </div>
        </div>

        <!-- Prev / Next Navigation -->
        <nav v-if="prev || next" class="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2" aria-label="Blog navigation">
          <NuxtLink
            v-if="prev"
            :to="getCleanPath(prev.path)"
            :title="prev.title"
            class="group relative flex flex-col rounded-2xl border border-surface-200 bg-white/60 p-6 shadow-sm backdrop-blur-sm transition-all hover:-translate-y-1 hover:border-primary-300 hover:bg-white hover:shadow-lg dark:border-surface-700/50 dark:bg-surface-900/40 dark:hover:border-primary-700 dark:hover:bg-surface-800"
          >
            <div class="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-surface-400">
              <Icon name="lucide:arrow-left" class="h-3 w-3 transition-transform group-hover:-translate-x-1" />
              {{ $t('blog.prev') }}
            </div>
            <span class="text-lg font-bold text-surface-900 transition-colors group-hover:text-primary-600 dark:text-surface-100 dark:group-hover:text-primary-400">
              {{ prev.title }}
            </span>
          </NuxtLink>
          <div v-else class="hidden sm:block"></div>

          <NuxtLink
            v-if="next"
            :to="getCleanPath(next.path)"
            :title="next.title"
            class="group relative flex flex-col items-end text-right rounded-2xl border border-surface-200 bg-white/60 p-6 shadow-sm backdrop-blur-sm transition-all hover:-translate-y-1 hover:border-primary-300 hover:bg-white hover:shadow-lg dark:border-surface-700/50 dark:bg-surface-900/40 dark:hover:border-primary-700 dark:hover:bg-surface-800"
          >
            <div class="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-surface-400">
              {{ $t('blog.next') }}
              <Icon name="lucide:arrow-right" class="h-3 w-3 transition-transform group-hover:translate-x-1" />
            </div>
            <span class="text-lg font-bold text-surface-900 transition-colors group-hover:text-primary-600 dark:text-surface-100 dark:group-hover:text-primary-400">
              {{ next.title }}
            </span>
          </NuxtLink>
        </nav>

        <!-- Contact Feedback -->
        <div class="mt-20 text-center">
          <p class="text-surface-500 dark:text-surface-400">
            {{ $t('blog.question_or_feedback') }}
            <NuxtLink
              :to="localePath('/contact')"
              :title="$t('blog.contact_us')"
              class="font-bold text-primary-600 hover:underline dark:text-primary-400"
            >
              {{ $t('blog.contact_us') }}
            </NuxtLink>
          </p>
        </div>

      </article>

      <!-- Table of Contents -->
      <BlogPostToc :links="tocLinks" />
    </section>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const { t, locale } = useI18n()
const localePath = useLocalePath()
const { getBlogPost, getSurroundingPosts } = useBlog()
const { getToolBySingleSlug } = useTools()

// Extract slug from catch-all route
const slug = (route.params.slug as string[]).join('/')

// Fetch blog post
const { data: post } = await getBlogPost(slug)

// TOC links from body
const tocLinks = computed(() => post.value?.body?.toc?.links || [])

// Promo CTA
const cta = computed(() => {
  const promo = post.value?.promo
  if (!promo?.slug) return null
  const toolInfo = getToolBySingleSlug(promo.slug)
  return toolInfo ? {
    text: promo.text,
    btn: promo.btn,
    link: toolInfo.path
  } : null
})

// Prev / Next posts
const { data: surroundingPosts } = await getSurroundingPosts(post.value?.path || '')
const prev = computed(() => surroundingPosts.value?.[0] ?? null)
const next = computed(() => surroundingPosts.value?.[1] ?? null)

// Clean locale prefix from path for routing
const getCleanPath = (postPath: string) => {
  if (!postPath) return '/'
  return postPath.replace(/^\/(en|zh|zh-HK|zh-TW|ja)/, '') || '/'
}

// Format date
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

// 404 handling
if (!post.value) {
  defineOgImage(false)
  useSeoMeta({ robots: 'noindex, nofollow' })
  if (!import.meta.prerender) {
    await navigateTo(localePath('/blog'), { replace: true })
  }
}

// SEO & Schema.org (only when post exists)
if (post.value) {
  // FAQ extraction from body AST
  const extractFaq = (ast: any[]) => {
    const faqData: { question: string; answer: string }[] = []
    let inFaqSection = false
    let currentQuestion: { question: string; answerRaw: string[] } | null = null

    const extractText = (node: any): string => {
      if (typeof node === 'string') return node
      if (Array.isArray(node) && node.length > 0) {
        return node.slice(2).map((child: any) => extractText(child)).join('')
      }
      return ''
    }

    for (const node of ast) {
      if (!Array.isArray(node) || node.length === 0) continue
      const tagName = node[0]

      if (tagName === 'h2') {
        const text = extractText(node).toLowerCase()
        if (text.includes('faq') || text.includes('frequently asked') || text.includes('常见问题') || text.includes('よくある質問')) {
          inFaqSection = true
          continue
        } else if (inFaqSection) {
          inFaqSection = false
          if (currentQuestion) {
            faqData.push({ question: currentQuestion.question, answer: currentQuestion.answerRaw.join(' ') })
            currentQuestion = null
          }
          break
        }
      }

      if (!inFaqSection) continue

      if (tagName === 'h3') {
        if (currentQuestion) {
          faqData.push({ question: currentQuestion.question, answer: currentQuestion.answerRaw.join(' ') })
        }
        currentQuestion = { question: extractText(node), answerRaw: [] }
        continue
      }

      if (currentQuestion) {
        const text = extractText(node).trim()
        if (text) currentQuestion.answerRaw.push(text)
      }
    }

    if (currentQuestion) {
      faqData.push({ question: currentQuestion.question, answer: currentQuestion.answerRaw.join(' ') })
    }

    return faqData
  }

  const faqList = extractFaq(post.value.body?.value || [])
  if (faqList.length > 0) {
    useSchemaOrg([
      defineWebPage({
        '@type': 'FAQPage',
        mainEntity: faqList.map(item => defineQuestion({
          name: item.question,
          acceptedAnswer: item.answer
        }))
      })
    ])
  }

  useSeoMeta({
    title: () => post.value!.title,
    description: () => post.value!.description,
    keywords: () => post.value!.tags?.join(', ') || t('blog.seo.keywords'),
    author: post.value!.author || 'JSON Toolbox Team',
    ogType: 'article',
    ogTitle: () => post.value!.title,
    ogDescription: () => post.value!.description,
    ogImage: () => post.value!.image || undefined,
    articlePublishedTime: () => post.value!.date,
    articleTag: () => post.value!.tags,
  })

  useSchemaOrg([
    defineArticle({
      '@type': 'BlogPosting',
      headline: () => post.value!.title,
      description: () => post.value!.description,
      image: () => post.value!.image || undefined,
      datePublished: () => post.value!.date,
      dateModified: () => post.value!.lastmod || post.value!.date,
      inLanguage: () => locale.value as string,
      author: [{
        name: post.value!.author || 'JSON Toolbox Team',
        url: 'https://jsontoolbox.cc',
      }],
    }),
    defineBreadcrumb({
      itemListElement: [
        { name: () => t('app.nav.home'), item: '/' },
        { name: () => t('blog.title'), item: localePath('/blog') },
        { name: () => post.value!.title, item: route.path },
      ],
    }),
  ])

  // Auto OG image if post has no cover
  if (!post.value.image) {
    defineOgImage({
      component: 'OgTemplate',
      props: {
        title: () => post.value!.title,
        description: () => post.value!.description,
        icon: 'lucide:file-text',
      },
    })
  }
}

definePageMeta({
  customHreflang: true
})
</script>
