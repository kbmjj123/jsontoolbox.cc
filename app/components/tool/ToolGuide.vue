<template>
  <div class="space-y-4">
    <div
      v-for="(step, index) in guide"
      :key="index"
      class="flex gap-4"
    >
      <div class="flex flex-col items-center">
        <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-100 text-sm font-bold text-primary-700 dark:bg-primary-900/40 dark:text-primary-300">
          {{ index + 1 }}
        </div>
        <div
          v-if="index < guide.length - 1"
          class="mt-2 w-px flex-1 bg-surface-200 dark:bg-surface-700"
        />
      </div>
      <div class="pb-4">
        <h3 class="mb-1 text-sm font-semibold text-surface-900 dark:text-surface-100">
          {{ step.title }}
        </h3>
        <p class="text-xs leading-relaxed text-surface-500 dark:text-surface-400">
          {{ step.description }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  guide: Array<{ title: string; description: string }>
}>()
</script>
