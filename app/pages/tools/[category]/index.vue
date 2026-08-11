<template>
  <div class="py-12">
    <div class="mx-auto max-w-[1200px] px-5">
      <div v-if="categoryData">
        <!-- Category Header -->
        <div class="mb-10">
          <h1 class="text-3xl font-bold text-surface-900 dark:text-surface-100">
            {{ categoryData.h2 || categoryData.title }}
          </h1>
          <p class="mt-3 text-surface-600 dark:text-surface-400">
            {{ categoryData.pdesc || categoryData.description }}
          </p>
        </div>

        <!-- Tools Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <NuxtLinkLocale
            v-for="tool in categoryTools"
            :key="tool.slug"
            :to="tool.path"
            class="group rounded-xl border border-surface-200 bg-white p-4 transition-all hover:border-primary-200 hover:shadow-md dark:border-surface-700 dark:bg-surface-900 dark:hover:border-primary-800"
          >
            <div class="flex items-start gap-3">
              <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-100 text-surface-600 dark:bg-surface-800 dark:text-surface-400">
                <Icon :name="tool.icon" class="h-4 w-4" />
              </div>
              <div>
                <h3 class="font-bold text-sm text-surface-900 dark:text-surface-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                  {{ tool.name }}
                </h3>
                <p class="mt-1 text-xs text-surface-500 dark:text-surface-400">
                  {{ tool.description }}
                </p>
              </div>
            </div>
          </NuxtLinkLocale>
        </div>
      </div>

      <!-- 404 -->
      <div v-else class="text-center py-20">
        <h1 class="text-2xl font-bold text-surface-900 dark:text-surface-100">Category Not Found</h1>
        <p class="mt-4 text-surface-600 dark:text-surface-400">The category you are looking for does not exist.</p>
        <NuxtLinkLocale to="/tools" class="mt-6 inline-block text-primary-600 hover:text-primary-700">
          View All Tools
        </NuxtLinkLocale>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const { getCategoryBySlug, getToolsByCategory } = useTools()
const { t, locale } = useI18n()

const categorySlug = computed(() => route.params.category as string)
const categoryData = computed(() => getCategoryBySlug(categorySlug.value))
const categoryTools = computed(() => getToolsByCategory(categorySlug.value).value)

// 获取当前语言的分类数据
const categoryLangData = computed(() => {
  if (!categoryData.value) return null
  return categoryData.value[locale.value] || categoryData.value['en'] || {}
})

useSeoMeta({
  title: () => {
    const langData = categoryLangData.value
    return langData?.title || categoryData.value?.title || t('tools.page_title')
  },
  description: () => {
    const langData = categoryLangData.value
    return langData?.description || categoryData.value?.description || t('tools.page_description')
  },
  keywords: () => {
    const langData = categoryLangData.value
    return langData?.keywords?.join(', ') || ''
  },
})
</script>
