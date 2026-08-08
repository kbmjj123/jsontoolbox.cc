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

          <!-- Privacy Badge -->
          <div class="inline-flex items-center gap-2 rounded-full border border-accent-200 bg-accent-50 px-3 py-1 text-xs font-medium text-accent-700 dark:border-accent-800 dark:bg-accent-900/30 dark:text-accent-400">
            <Icon name="lucide:shield-check" class="h-3 w-3" />
            100% Client-Side Processing
          </div>
        </div>

        <!-- Tool Component -->
        <div class="rounded-2xl border border-surface-200 bg-white p-6 dark:border-surface-700 dark:bg-surface-900">
          <component :is="toolComponent" v-if="toolComponent" :tool="tool" />
          <div v-else class="text-center py-12">
            <p class="text-surface-500 dark:text-surface-400">Tool component not found.</p>
          </div>
        </div>
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

const category = computed(() => route.params.category as string)
const slug = computed(() => route.params.slug as string)
const tool = computed(() => getToolDetail(category.value, slug.value))

// 动态加载工具组件
const toolComponent = computed(() => {
  if (!tool.value?.component) return null

  // 尝试从 universal 目录加载组件
  const componentName = tool.value.component
  try {
    return defineAsyncComponent(() =>
      import(`~/components/universal/${componentName}.vue`)
    )
  } catch {
    return null
  }
})

useSeoMeta({
  title: () => tool.value ? `${tool.value.name} | ${t('app.name')}` : t('tools.page_title'),
  description: () => tool.value?.description || t('tools.page_description'),
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
})</script>
