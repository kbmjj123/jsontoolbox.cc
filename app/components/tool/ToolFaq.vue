<template>
  <div class="space-y-2 max-w-3xl">
    <details
      v-for="(item, index) in faq"
      :key="index"
      class="group rounded-xl border border-surface-200 bg-white dark:border-surface-700 dark:bg-surface-900"
    >
      <summary class="flex cursor-pointer items-center justify-between gap-3 px-5 py-4 text-sm font-medium text-surface-800 dark:text-surface-200">
        <span>{{ item.question }}</span>
        <Icon
          name="lucide:chevron-down"
          class="h-4 w-4 shrink-0 text-surface-400 transition-transform duration-200 group-open:rotate-180"
        />
      </summary>
      <div class="border-t border-surface-100 px-5 py-4 text-xs leading-relaxed text-surface-600 dark:border-surface-800 dark:text-surface-400">
        {{ item.answer }}
      </div>
    </details>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  faq: Array<{ question: string; answer: string }>
}>()
</script>
