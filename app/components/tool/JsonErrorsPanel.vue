<script setup lang="ts">
import type { ParseError, FieldError } from '~/types/jsonErrors'

const { t } = useI18n()

const props = withDefaults(defineProps<{
  parseErrors?: ParseError[]
  fieldErrors?: FieldError[]
}>(), {
  parseErrors: () => [],
  fieldErrors: () => [],
})

const emit = defineEmits<{
  locateParseError: [error: ParseError]
  locateFieldError: [error: FieldError]
}>()

const totalErrors = computed(() => props.parseErrors.length + props.fieldErrors.length)
const hasErrors = computed(() => totalErrors.value > 0)

// Auto-expand when errors exist, collapsed by default
const expanded = ref(false)
watch(hasErrors, (val) => {
  if (val) expanded.value = true
}, { immediate: true })

const toggle = () => { expanded.value = !expanded.value }

const copiedIdx = ref<number | null>(null)

/** Get friendly localized message for a parse error */
const getFriendlyMessage = (err: ParseError): string => {
  if (!err.errorKey) return err.message
  return t(`errors.messages.${err.errorKey}`, {
    line: err.line,
    col: err.column,
  }, { default: err.message })
}

const copyErrorInfo = async (err: ParseError, idx: number) => {
  const text = `${t('errors.lineCol', { line: err.line, col: err.column })}: ${getFriendlyMessage(err)}`
  await copyToClipboard(text)
  copiedIdx.value = idx
  setTimeout(() => { copiedIdx.value = null }, 2000)
}

const copyAllErrors = async () => {
  const lines = props.parseErrors.map(err =>
    `${t('errors.lineCol', { line: err.line, col: err.column })}: ${getFriendlyMessage(err)}`
  )
  const fieldLines = props.fieldErrors.map(err =>
    `${err.instancePath || '/'}: ${err.message}`
  )
  await copyToClipboard([...lines, ...fieldLines].join('\n'))
}
</script>

<template>
  <div v-if="hasErrors" class="mt-2 border border-red-200 dark:border-red-800 rounded-lg overflow-hidden">
    <!-- Header -->
    <div class="flex items-center gap-2 px-3 py-2 bg-red-50 dark:bg-red-900/20">
      <button class="flex items-center gap-2 flex-1 text-left text-sm" @click="toggle">
        <span class="i-lucide-chevron-right text-red-500 transition-transform" :class="{ 'rotate-90': expanded }" />
        <span class="i-lucide-alert-circle text-red-500" />
        <span class="text-red-700 dark:text-red-400 font-medium">
          {{ t('errors.panelTitle') }}
        </span>
        <span class="text-red-500 dark:text-red-500 text-xs">
          ({{ totalErrors }})
        </span>
      </button>
      <div class="flex gap-1.5 shrink-0">
        <button
          @click.stop="copyAllErrors"
          class="rounded px-2 py-0.5 text-[10px] font-medium text-red-600 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/30 transition-colors"
        >
          {{ t('errorBar.copyAll') }}
        </button>
      </div>
    </div>

    <!-- Error List -->
    <div v-if="expanded" class="border-t border-red-200 dark:border-red-800">
      <!-- Parse Errors -->
      <div
        v-for="(err, idx) in parseErrors"
        :key="'parse-' + idx"
        class="group flex items-start gap-2 px-3 py-1.5 text-xs font-mono border-b border-red-100 dark:border-red-800/50 last:border-b-0"
      >
        <button
          class="flex items-start gap-2 flex-1 cursor-pointer hover:bg-red-100/50 dark:hover:bg-red-900/30 -mx-1 px-1 py-0 rounded"
          @click="emit('locateParseError', err)"
        >
          <span class="i-lucide-x-circle text-red-500 mt-0.5 shrink-0" />
          <span class="text-red-600 dark:text-red-400">
            {{ t('errors.lineCol', { line: err.line, col: err.column }) }}
          </span>
          <span class="text-red-700 dark:text-red-300">—</span>
          <span class="text-red-800 dark:text-red-200 break-all">{{ getFriendlyMessage(err) }}</span>
        </button>
        <button
          @click.stop="copyErrorInfo(err, idx)"
          class="shrink-0 rounded px-1.5 py-0.5 text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
          :class="copiedIdx === idx
            ? 'text-green-600 dark:text-green-400'
            : 'text-surface-400 hover:text-surface-600 dark:hover:text-surface-300'"
        >
          {{ copiedIdx === idx ? '✓' : t('errorBar.copyError') }}
        </button>
      </div>

      <!-- Field Errors -->
      <div
        v-for="(err, idx) in fieldErrors"
        :key="'field-' + idx"
        class="group flex items-start gap-2 px-3 py-1.5 text-xs font-mono cursor-pointer hover:bg-amber-100/50 dark:hover:bg-amber-900/30 border-b border-amber-100 dark:border-amber-800/50 last:border-b-0"
        @click="emit('locateFieldError', err)"
      >
        <span class="i-lucide-alert-triangle text-amber-500 mt-0.5 shrink-0" />
        <span class="text-amber-600 dark:text-amber-400">
          {{ err.instancePath || '/' }}
        </span>
        <span class="text-amber-700 dark:text-amber-300">—</span>
        <span class="text-amber-800 dark:text-amber-200 break-all">{{ err.message }}</span>
      </div>
    </div>
  </div>
</template>
