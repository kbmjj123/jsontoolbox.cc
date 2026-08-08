<template>
  <nav v-if="breadcrumbs.length > 1" class="mx-auto max-w-[1200px] w-full px-5 py-3" aria-label="Breadcrumb">
    <ol class="flex items-center gap-1.5 text-xs text-surface-500 dark:text-surface-400">
      <li v-for="(item, index) in breadcrumbs" :key="item.path" class="flex items-center gap-1.5">
        <Icon v-if="index > 0" name="lucide:chevron-right" class="w-3 h-3 text-surface-300 dark:text-surface-600" />
        <NuxtLinkLocale
          v-if="index < breadcrumbs.length - 1"
          :to="item.path"
          class="hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
        >
          {{ item.name }}
        </NuxtLinkLocale>
        <span v-else class="text-surface-700 dark:text-surface-300 font-medium">
          {{ item.name }}
        </span>
      </li>
    </ol>
  </nav>
</template>

<script setup lang="ts">
const { breadcrumbs } = useBreadcrumbs()
</script>
