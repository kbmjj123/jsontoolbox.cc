<template>
  <div class="py-12">
    <div class="mx-auto max-w-[1200px] px-5">
      <div v-if="tool">
        <!-- Tool Header -->
        <div class="mb-8">
          <div class="flex items-center gap-3 mb-4">
            <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
              <Icon :name="tool.icon || 'lucide:command'" class="h-5 w-5" />
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
          <component :is="resolvedComponent" v-if="resolvedComponent" :tool="tool" />
          <div v-else class="text-center py-12">
            <p class="text-surface-500 dark:text-surface-400">Tool component not found.</p>
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
import { computed, defineAsyncComponent } from 'vue'
const { getToolDetail, getCategoryBySlug } = useTools()
const { t } = useI18n()
const localePath = useLocalePath()

const category = computed(() => route.params.category as string)
const slug = computed(() => route.params.slug as string)
const tool = computed(() => getToolDetail(category.value, slug.value))

// 1. 扫描组件 (使用 eager: false 进行懒加载)
const componentFiles = import.meta.glob('~/components/universal/*.vue')

// 2. 动态组件解析 (带调试日志)
const resolvedComponent = computed(() => {
	const component = tool.value && tool.value.component
	if (!component) return null

	// 1. 预处理目标名称
	// JSON配置: "UniversalGifCompressor" -> 转小写: "universalgifcompressor"
	const targetName = component.toLowerCase()
	// 2. 剥离 "universal" 前缀，得到预期的文件名
	// "universalgifcompressor" -> "gifcompressor"
	// 这一步非常关键，它让我们从“组件名”还原回了“文件名”
	const expectedFileName = targetName.replace(/^universal/, '')

	// 3. 遍历文件列表寻找匹配
	for (const [path, loader] of Object.entries(componentFiles)) {
		// path 示例: "/components/universal/GifCompressor.vue"

		// 获取实际文件名 (转小写): "GifCompressor.vue" -> "gifcompressor"
		const actualFileName = path.split('/').pop()?.replace(/\.\w+$/, '').toLowerCase()

		// 获取所在目录名 (转小写): "universal"
		const parts = path.split('/')
		const dirName = parts[parts.length - 2]?.toLowerCase()

		// 🕵️ 精准匹配逻辑 (必须同时满足两个条件):
		// 1. 文件必须在 'universal' 目录下 (防止匹配到其他目录的同名文件)
		// 2. 文件名必须等于剥离前缀后的名称 (全等匹配，杜绝包含关系错误)
		if (dirName === 'universal' && actualFileName === expectedFileName) {
			return defineAsyncComponent(loader as any)
		}
	}

	// 备用逻辑：兼容没有 Universal 前缀的旧配置 (可选)
	// 如果 JSON 里直接写了 "GifCompressor"，也尝试去 universal 目录找
	for (const [path, loader] of Object.entries(componentFiles)) {
		const actualFileName = path.split('/').pop()?.replace(/\.\w+$/, '').toLowerCase()
		const dirName = path.split('/')[path.split('/').length - 2]?.toLowerCase()

		if (dirName === 'universal' && actualFileName === targetName) {
			return defineAsyncComponent(loader as any)
		}
	}

	console.warn(`[Loader] 404: Cannot find ${component} in /components/universal/`)
	return null
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

// Schema.org Breadcrumb
const categoryInfo = computed(() => tool.value ? getCategoryBySlug(tool.value.category) : null)
const categoryName = computed(() => {
  if (!categoryInfo.value) return category.value
  const langData = categoryInfo.value[t.locale] || categoryInfo.value['en'] || {}
  return langData.h2 || langData.title || category.value
})

useSchemaOrg([
  defineBreadcrumb({
    itemListElement: [
      { name: () => t('app.nav.home'), item: '/' },
      { name: () => t('app.nav.tools'), item: localePath('/tools') },
      { name: () => categoryName.value, item: localePath(`/tools/${category.value}`) },
      { name: () => tool.value?.name || slug.value, item: localePath(route.path) }
    ]
  })
])
</script>
