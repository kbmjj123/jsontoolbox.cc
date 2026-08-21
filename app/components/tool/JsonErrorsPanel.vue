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
</script>

<template>
  <div v-if="hasErrors" class="mt-2 border border-red-200 dark:border-red-800 rounded-lg overflow-hidden">
    <!-- Header -->
    <button
      class="w-full flex items-center gap-2 px-3 py-2 bg-red-50 dark:bg-red-900/20 text-left text-sm"
      @click="toggle"
    >
      <span class="i-lucide-chevron-right text-red-500 transition-transform" :class="{ 'rotate-90': expanded }" />
      <span class="i-lucide-alert-circle text-red-500" />
      <span class="text-red-700 dark:text-red-400 font-medium">
        {{ t('errors.panelTitle') }}
      </span>
      <span class="text-red-500 dark:text-red-500 text-xs">
        ({{ totalErrors }})
      </span>
    </button>

    <!-- Error List -->
    <div v-if="expanded" class="border-t border-red-200 dark:border-red-800">
      <!-- Parse Errors -->
      <div
        v-for="(err, idx) in parseErrors"
        :key="'parse-' + idx"
        class="flex items-start gap-2 px-3 py-1.5 text-xs font-mono cursor-pointer hover:bg-red-100/50 dark:hover:bg-red-900/30 border-b border-red-100 dark:border-red-800/50 last:border-b-0"
        @click="emit('locateParseError', err)"
      >
        <span class="i-lucide-x-circle text-red-500 mt-0.5 shrink-0" />
        <span class="text-red-600 dark:text-red-400">
          {{ t('errors.lineCol', { line: err.line, col: err.column }) }}
        </span>
        <span class="text-red-700 dark:text-red-300">—</span>
        <span class="text-red-800 dark:text-red-200 break-all">{{ err.message }}</span>
      </div>

      <!-- Field Errors -->
      <div
        v-for="(err, idx) in fieldErrors"
        :key="'field-' + idx"
        class="flex items-start gap-2 px-3 py-1.5 text-xs font-mono cursor-pointer hover:bg-amber-100/50 dark:hover:bg-amber-900/30 border-b border-amber-100 dark:border-amber-800/50 last:border-b-0"
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
