<template>
  <div class="py-12">
    <div class="mx-auto max-w-[1200px] px-5">
      <!-- Page Header -->
      <div class="mb-10">
        <h1 class="text-3xl font-bold text-surface-900 dark:text-surface-100">
          {{ $t('tools.page_title') }}
        </h1>
        <p class="mt-3 text-surface-600 dark:text-surface-400">
          {{ $t('tools.page_description') }}
        </p>
      </div>

      <!-- Search -->
      <div class="mb-8">
        <div class="relative max-w-md">
          <Icon name="lucide:search" class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-400" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search tools..."
            class="w-full rounded-xl border border-surface-200 bg-white py-2.5 pl-10 pr-4 text-sm text-surface-900 placeholder-surface-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-100"
          />
        </div>
      </div>

      <!-- Categories -->
      <div v-for="category in categories" :key="category.slug" class="mb-12">
        <div class="flex items-center gap-3 mb-6">
          <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
            <Icon :name="category.icon" class="h-4 w-4" />
          </div>
          <h2 class="text-xl font-bold text-surface-900 dark:text-surface-100">
            {{ category.h2 || category.title }}
          </h2>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <NuxtLinkLocale
            v-for="tool in category.tools"
            :key="tool.slug"
            :to="tool.path"
            class="group rounded-xl border border-surface-200 bg-white p-4 transition-all hover:border-primary-200 hover:shadow-md dark:border-surface-700 dark:bg-surface-900 dark:hover:border-primary-800"
          >
            <div class="flex items-start gap-3">
              <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-100 text-surface-600 dark:bg-surface-800 dark:text-surface-400">
                <Icon :name="tool.icon" class="h-5 w-5" />
              </div>
              <div>
                <h3 class="font-bold text-sm text-surface-900 dark:text-surface-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                  {{ tool.name }}
                </h3>
                <p class="mt-1 text-xs text-surface-500 dark:text-surface-400 line-clamp-2">
                  {{ tool.description }}
                </p>
              </div>
            </div>
          </NuxtLinkLocale>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { categories, searchQuery } = useTools()
const { t } = useI18n()

useSeoMeta({
  title: t('tools.page_title'),
  description: t('tools.page_description'),
})
</script>
