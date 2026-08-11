<template>
  <div class="py-12">
    <div class="mx-auto max-w-[1200px] px-5">
      <div v-if="tool">
        <!-- Tool Header -->
        <div class="mb-8">
          <div class="flex items-center gap-3 mb-4">
            <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
              <Icon :name="tool.icon" class="h-5 w-5" />
            </div>
            <div>
              <h1 class="text-2xl font-bold text-surface-900 dark:text-surface-100">
                {{ tool.name }}
              </h1>
              <p class="text-sm text-surface-500 dark:text-surface-400">
                {{ tool.description }}
              </p>
            </div>
          </div>
        </div>

        <!-- Tool Component -->
        <div class="rounded-2xl border border-surface-200 bg-white p-6 dark:border-surface-700 dark:bg-surface-900">
          <component :is="toolComponent" v-if="toolComponent" :tool="tool" />
          <div v-else class="text-center py-12">
            <p class="text-surface-500 dark:text-surface-400">Tool component not found.</p>
          </div>
        </div>

        <!-- Example Section -->
        <div v-if="tool.example" class="mt-8 rounded-2xl border border-surface-200 bg-white p-6 dark:border-surface-700 dark:bg-surface-900">
          <h2 class="mb-6 text-xl font-bold text-surface-900 dark:text-surface-100">
            {{ t('tools.example.title') }}
          </h2>

          <div class="space-y-6">
            <!-- Single Input (most tools) -->
            <div v-if="tool.example.input">
              <div class="mb-2 flex items-center justify-between">
                <h3 class="text-sm font-semibold text-surface-700 dark:text-surface-300">
                  {{ t('tools.example.input') }}
                </h3>
                <button
                  @click="copyExample(tool.example.input)"
                  class="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-surface-500 hover:bg-surface-100 hover:text-surface-700 dark:text-surface-400 dark:hover:bg-surface-700 dark:hover:text-surface-300"
                >
                  <Icon :name="copied ? 'lucide:check' : 'lucide:copy'" class="h-3.5 w-3.5" />
                  {{ copied ? t('system.copied') : t('system.copy') }}
                </button>
              </div>
              <pre class="overflow-x-auto rounded-lg bg-surface-50 p-4 text-sm text-surface-800 dark:bg-surface-800 dark:text-surface-200"><code>{{ formatExampleText(tool.example.input) }}</code></pre>
            </div>

            <!-- Dual Input (JSON Compare) -->
            <div v-if="tool.example.inputLeft && tool.example.inputRight" class="grid gap-4 md:grid-cols-2">
              <div>
                <div class="mb-2 flex items-center justify-between">
                  <h3 class="text-sm font-semibold text-surface-700 dark:text-surface-300">
                    {{ t('tools.example.inputLeft') }}
                  </h3>
                  <button
                    @click="copyExample(tool.example.inputLeft)"
                    class="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-surface-500 hover:bg-surface-100 hover:text-surface-700 dark:text-surface-400 dark:hover:bg-surface-700 dark:hover:text-surface-300"
                  >
                    <Icon :name="copied ? 'lucide:check' : 'lucide:copy'" class="h-3.5 w-3.5" />
                    {{ copied ? t('system.copied') : t('system.copy') }}
                  </button>
                </div>
                <pre class="overflow-x-auto rounded-lg bg-surface-50 p-4 text-sm text-surface-800 dark:bg-surface-800 dark:text-surface-200"><code>{{ formatExampleText(tool.example.inputLeft) }}</code></pre>
              </div>
              <div>
                <div class="mb-2 flex items-center justify-between">
                  <h3 class="text-sm font-semibold text-surface-700 dark:text-surface-300">
                    {{ t('tools.example.inputRight') }}
                  </h3>
                  <button
                    @click="copyExample(tool.example.inputRight)"
                    class="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-surface-500 hover:bg-surface-100 hover:text-surface-700 dark:text-surface-400 dark:hover:bg-surface-700 dark:hover:text-surface-300"
                  >
                    <Icon :name="copied ? 'lucide:check' : 'lucide:copy'" class="h-3.5 w-3.5" />
                    {{ copied ? t('system.copied') : t('system.copy') }}
                  </button>
                </div>
                <pre class="overflow-x-auto rounded-lg bg-surface-50 p-4 text-sm text-surface-800 dark:bg-surface-800 dark:text-surface-200"><code>{{ formatExampleText(tool.example.inputRight) }}</code></pre>
              </div>
            </div>

            <!-- Schema (JSON Schema Validator) -->
            <div v-if="tool.example.schema">
              <div class="mb-2 flex items-center justify-between">
                <h3 class="text-sm font-semibold text-surface-700 dark:text-surface-300">
                  {{ t('tools.example.schema') }}
                </h3>
                <button
                  @click="copyExample(tool.example.schema)"
                  class="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-surface-500 hover:bg-surface-100 hover:text-surface-700 dark:text-surface-400 dark:hover:bg-surface-700 dark:hover:text-surface-300"
                >
                  <Icon :name="copied ? 'lucide:check' : 'lucide:copy'" class="h-3.5 w-3.5" />
                  {{ copied ? t('system.copied') : t('system.copy') }}
                </button>
              </div>
              <pre class="overflow-x-auto rounded-lg bg-surface-50 p-4 text-sm text-surface-800 dark:bg-surface-800 dark:text-surface-200"><code>{{ formatExampleText(tool.example.schema) }}</code></pre>
            </div>

            <!-- Expression (JSONPath Tester) -->
            <div v-if="tool.example.expression">
              <div class="mb-2 flex items-center justify-between">
                <h3 class="text-sm font-semibold text-surface-700 dark:text-surface-300">
                  {{ t('tools.example.expression') }}
                </h3>
                <button
                  @click="copyExample(tool.example.expression)"
                  class="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-surface-500 hover:bg-surface-100 hover:text-surface-700 dark:text-surface-400 dark:hover:bg-surface-700 dark:hover:text-surface-300"
                >
                  <Icon :name="copied ? 'lucide:check' : 'lucide:copy'" class="h-3.5 w-3.5" />
                  {{ copied ? t('system.copied') : t('system.copy') }}
                </button>
              </div>
              <pre class="overflow-x-auto rounded-lg bg-surface-50 p-4 text-sm text-surface-800 dark:bg-surface-800 dark:text-surface-200"><code>{{ formatExampleText(tool.example.expression) }}</code></pre>
            </div>

            <!-- Output -->
            <div v-if="tool.example.output">
              <div class="mb-2 flex items-center justify-between">
                <h3 class="text-sm font-semibold text-surface-700 dark:text-surface-300">
                  {{ t('tools.example.output') }}
                </h3>
                <button
                  @click="copyExample(tool.example.output)"
                  class="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-surface-500 hover:bg-surface-100 hover:text-surface-700 dark:text-surface-400 dark:hover:bg-surface-700 dark:hover:text-surface-300"
                >
                  <Icon :name="copied ? 'lucide:check' : 'lucide:copy'" class="h-3.5 w-3.5" />
                  {{ copied ? t('system.copied') : t('system.copy') }}
                </button>
              </div>
              <pre class="overflow-x-auto rounded-lg bg-surface-50 p-4 text-sm text-surface-800 dark:bg-surface-800 dark:text-surface-200"><code>{{ formatExampleText(tool.example.output) }}</code></pre>
            </div>

            <!-- Use Case -->
            <div v-if="tool.example.useCase" class="rounded-lg bg-primary-50 p-4 dark:bg-primary-900/20">
              <div class="flex items-start gap-3">
                <Icon name="lucide:lightbulb" class="mt-0.5 h-5 w-5 text-primary-600 dark:text-primary-400" />
                <div>
                  <h3 class="mb-1 text-sm font-semibold text-primary-700 dark:text-primary-300">
                    {{ t('tools.example.useCase') }}
                  </h3>
                  <p class="text-sm text-primary-600 dark:text-primary-400">
                    {{ tool.example.useCase }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- SEO Content Sections -->
        <ToolSeoContent :tool="tool" class="mt-12" />
      </div>

      <!-- 404 -->
      <div v-else class="text-center py-20">
        <h1 class="text-2xl font-bold text-surface-900 dark:text-surface-100">Tool Not Found</h1>
        <p class="mt-4 text-surface-600 dark:text-surface-400">The tool you are looking for does not exist.</p>
        <NuxtLinkLocale to="/tools" class="mt-6 inline-block text-primary-600 hover:text-primary-700">
          View All Tools
        </NuxtLinkLocale>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const { getToolDetail } = useTools()
const { t } = useI18n()
const { copy, copied } = useClipboard()

// 处理示例文本，将 \n 转换为真正的换行
const formatExampleText = (text: string | undefined): string => {
  if (!text) return ''
  return text.replace(/\\n/g, '\n')
}

// 复制示例文本
const copyExample = (text: string | undefined) => {
  if (!text) return
  copy(formatExampleText(text))
}

const category = computed(() => route.params.category as string)
const slug = computed(() => route.params.slug as string)
const tool = computed(() => getToolDetail(category.value, slug.value))

// 动态加载工具组件
const componentModules = import.meta.glob('~/components/universal/*.vue')

const toolComponent = computed(() => {
  if (!tool.value?.component) return null
  const path = `/components/universal/${tool.value.component}.vue`
  const moduleLoader = componentModules[path]
  if (!moduleLoader) return null
  return defineAsyncComponent(moduleLoader as () => Promise<any>)
})

useSeoMeta({
  title: () => tool.value?.meta?.title || tool.value?.name || t('tools.page_title'),
  description: () => tool.value?.meta?.description || tool.value?.description || t('tools.page_description'),
})

// 根据工具分类动态生成 OG Image
const ogVariant = computed(() => {
  if (!tool.value) return 'tool'
  switch (tool.value.category) {
    case 'convert': return 'convert'
    default: return 'tool'
  }
})

const ogAccent = computed(() => {
  if (!tool.value) return 'blue'
  switch (tool.value.category) {
    case 'format': return 'blue'
    case 'validate': return 'green'
    case 'convert': return 'orange'
    case 'view': return 'purple'
    default: return 'blue'
  }
})

const ogIcon = computed(() => {
  if (!tool.value) return 'json'
  switch (tool.value.category) {
    case 'format': return 'formatter'
    case 'validate': return 'validator'
    case 'convert': return 'convert'
    case 'view': return 'tree'
    default: return 'json'
  }
})

defineOgImage({
  component: 'OgTemplate',
  props: {
    title: tool.value?.name || 'JSON Toolbox',
    description: tool.value?.description || 'Free online JSON tools.',
    icon: ogIcon.value,
    variant: ogVariant.value,
    accent: ogAccent.value,
  },
})

// JSON-LD Schema
const config = useRuntimeConfig()
const siteUrl = config.public.baseUrl || 'https://jsontoolbox.cc'

if (tool.value) {
  useSchemaOrg([
    // SoftwareApplication Schema
    defineSoftwareApp({
      name: tool.value.name,
      description: tool.value.description,
      url: `${siteUrl}${tool.value.path}`,
      applicationCategory: 'DeveloperApplication',
      operatingSystem: 'Web Browser',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      },
    }),

    // Breadcrumb Schema
    defineBreadcrumb({
      itemListElement: [
        { name: 'Home', item: siteUrl },
        { name: 'Tools', item: `${siteUrl}/tools` },
        { name: tool.value.name },
      ],
    }),

    // HowTo Schema (from guide)
    ...(tool.value.guide?.length
      ? [
          defineHowTo({
            name: `How to use ${tool.value.name}`,
            step: tool.value.guide.map((step: any, index: number) => ({
              '@type': 'HowToStep',
              name: step.title,
              text: step.description,
              position: index + 1,
            })),
          }),
        ]
      : []),

    // FAQ Schema
    ...(tool.value.faq?.length
      ? tool.value.faq.map((item: any) =>
          defineQuestion({
            name: item.question,
            acceptedAnswer: {
              '@type': 'Answer',
              text: item.answer,
            },
          })
        )
      : []),
  ])
}
</script>
