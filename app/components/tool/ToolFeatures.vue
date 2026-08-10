<template>
  <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
    <div
      v-for="(feature, index) in features"
      :key="index"
      class="rounded-2xl border border-surface-200 bg-white p-5 dark:border-surface-700 dark:bg-surface-900"
    >
      <div class="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
        <Icon :name="feature.icon" class="h-4.5 w-4.5" />
      </div>
      <h3 class="mb-1 text-sm font-semibold text-surface-900 dark:text-surface-100">
        {{ feature.title }}
      </h3>
      <p class="text-xs leading-relaxed text-surface-500 dark:text-surface-400">
        {{ feature.description }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  features: Array<{ icon: string; title: string; description: string }>
}>()
</script>
