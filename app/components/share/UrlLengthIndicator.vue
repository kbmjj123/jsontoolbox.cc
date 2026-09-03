<template>
  <div class="space-y-1.5">
    <div class="flex items-center justify-between text-[11px]">
      <span class="text-surface-400 dark:text-surface-500">
        {{ $t('share.urlLength') }}
      </span>
      <span :class="statusColor">
        {{ length.toLocaleString() }} / {{ max.toLocaleString() }}
      </span>
    </div>
    <div class="h-1.5 rounded-full bg-surface-100 dark:bg-surface-800 overflow-hidden">
      <div
        class="h-full rounded-full transition-all duration-300"
        :class="barColor"
        :style="{ width: `${percentage}%` }"
      ></div>
    </div>
    <p v-if="status === 'warning'" class="text-[11px] text-amber-500 dark:text-amber-400">
      {{ $t('share.urlLengthWarning') }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { RECOMMENDED_MAX, WARNING_MAX, HARD_MAX, checkUrlLength } from '~/utils/share'

const props = defineProps<{
  length: number
}>()

const { t } = useI18n()

const status = computed(() => checkUrlLength(props.length))

const max = computed(() => {
  if (props.length <= RECOMMENDED_MAX) return RECOMMENDED_MAX
  if (props.length <= WARNING_MAX) return WARNING_MAX
  return HARD_MAX
})

const percentage = computed(() => {
  return Math.min(100, (props.length / max.value) * 100)
})

const statusColor = computed(() => {
  switch (status.value) {
    case 'ok': return 'text-green-600 dark:text-green-400'
    case 'warning': return 'text-amber-600 dark:text-amber-400'
    case 'too_large': return 'text-red-600 dark:text-red-400'
  }
})

const barColor = computed(() => {
  switch (status.value) {
    case 'ok': return 'bg-green-500'
    case 'warning': return 'bg-amber-500'
    case 'too_large': return 'bg-red-500'
  }
})
</script>
