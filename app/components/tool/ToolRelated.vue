<template>
  <div v-if="relatedTools.length > 0">
    <h3 class="mb-3 text-xs font-semibold uppercase tracking-wider text-surface-400 dark:text-surface-500">
      {{ $t('tool.related_title') }}
    </h3>
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <NuxtLinkLocale
        v-for="item in relatedTools"
        :key="item.slug"
        :to="item.path"
        class="flex items-center gap-3 rounded-xl border border-surface-200 bg-white px-4 py-3 transition-colors hover:border-primary-200 hover:bg-primary-50/50 dark:border-surface-700 dark:bg-surface-900 dark:hover:border-primary-800 dark:hover:bg-primary-900/20"
      >
        <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
          <Icon :name="item.icon" class="h-4 w-4" />
        </div>
        <div class="min-w-0">
          <div class="text-sm font-medium text-surface-800 dark:text-surface-200 truncate">
            {{ item.name }}
          </div>
          <div class="text-xs text-surface-400 dark:text-surface-500 truncate">
            {{ item.description }}
          </div>
        </div>
      </NuxtLinkLocale>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  nextSteps?: string[]
  recommends?: string[]
  currentSlug: string
}>()

const { getToolBySingleSlug } = useTools()

const relatedTools = computed(() => {
  const all = [
    ...(props.nextSteps || []),
    ...(props.recommends || []),
  ]
  const seen = new Set<string>()
  return all
    .filter(s => {
      if (s === props.currentSlug || seen.has(s)) return false
      seen.add(s)
      return true
    })
    .map(s => getToolBySingleSlug(s))
    .filter(t => t && t.icon) as ProcessedTool[]
})
</script>
