<template>
  <div class="flex flex-wrap items-center gap-x-4 gap-y-1.5 rounded-lg border border-surface-200 bg-surface-50 px-3 py-2 text-xs dark:border-surface-700 dark:bg-surface-900">
    <span class="font-medium text-surface-700 dark:text-surface-300">{{ t('largeViewer.structure') }}</span>

    <span class="flex items-center gap-1">
      <span class="text-surface-400 dark:text-surface-500">{{ t('largeViewer.structRoot') }}</span>
      <span class="rounded bg-primary-100 px-1.5 py-0.5 font-medium text-primary-700 dark:bg-primary-900/40 dark:text-primary-300">
        {{ rootLabel }}
      </span>
    </span>

    <span class="flex items-center gap-1">
      <span class="text-surface-400 dark:text-surface-500">{{ t('largeViewer.structMaxDepth') }}</span>
      <span class="font-medium text-surface-700 dark:text-surface-300">{{ scan.maxDepth }}</span>
    </span>

    <span class="flex flex-wrap items-center gap-1">
      <span class="text-surface-400 dark:text-surface-500">{{ t('largeViewer.structTypes') }}</span>
      <span
        v-for="t in typeEntries"
        :key="t.key"
        class="lf-chip font-mono"
        :class="t.count ? '' : 'opacity-50'"
      >{{ t.label }}: {{ t.count }}</span>
    </span>

    <span class="flex items-center gap-1">
      <span class="text-surface-400 dark:text-surface-500">{{ t('largeViewer.structComplete') }}</span>
      <span :class="complete ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'">
        {{ complete ? t('largeViewer.structCompleteYes') : t('largeViewer.structCompleteNo') }}
      </span>
    </span>

    <span class="flex items-center gap-1">
      <span class="text-surface-400 dark:text-surface-500">{{ t('largeViewer.structIllegal') }}</span>
      <span :class="illegal ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'">
        {{ illegal ? t('largeViewer.structIllegalYes') : t('largeViewer.structIllegalNo') }}
      </span>
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ScanResult } from '~/workers/recordStream.worker'
import { useI18n } from '#imports'

const props = defineProps<{ scan: ScanResult }>()
const { t } = useI18n()

const rootLabel = computed(() =>
  props.scan.rootType === 'array' ? t('largeViewer.typeArray') : t('largeViewer.typeObject'),
)

// The overview only renders for a successful scan, so these are always the
// "good" values — but derive them so the panel stays correct if reused.
const complete = computed(() => props.scan.ok)
const illegal = computed(() => !props.scan.ok)

const typeEntries = computed(() => {
  const c = props.scan.typeCounts
  return [
    { key: 'object', label: t('largeViewer.typeObject'), count: c.object },
    { key: 'array', label: t('largeViewer.typeArray'), count: c.array },
    { key: 'string', label: t('largeViewer.typeString'), count: c.string },
    { key: 'number', label: t('largeViewer.typeNumber'), count: c.number },
    { key: 'boolean', label: t('largeViewer.typeBoolean'), count: c.boolean },
    { key: 'null', label: t('largeViewer.typeNull'), count: c.null },
  ]
})
</script>
