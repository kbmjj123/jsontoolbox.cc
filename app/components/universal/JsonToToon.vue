<template>
  <ResizablePanel v-model:fullscreen="fullscreen" :initial-ratio="0.5" responsive>
    <template #first>
      <div class="h-full pr-3 flex flex-col">
        <JsonInputEditor
          ref="inputEditorRef"
          v-model="inputText"
          :label="mode === 'jsonToToon' ? ui.label_json_input : ui.label_toon_input"
          :placeholder="mode === 'jsonToToon' ? ui.placeholder_json : ui.placeholder_toon"
          accept=".json,.toon,.txt"
          show-upload
          example-slug="json-to-toon"
          class="flex-1 min-h-0"
          @clear="clearAll"
        />

        <!-- Measured comparison: minified JSON vs TOON -->
        <div v-if="comparison" class="mt-3 shrink-0 rounded-xl border border-surface-200 bg-white p-3 text-xs dark:border-surface-700 dark:bg-surface-900 dark:text-surface-200">
          <div class="mb-2 flex items-center gap-2 font-bold text-surface-700 dark:text-surface-300">
            <Icon name="lucide:bar-chart-3" class="h-3.5 w-3.5 text-surface-400" />
            {{ ui.label_compare }}
          </div>

          <div class="grid grid-cols-3 gap-2">
            <span />
            <span class="font-medium text-surface-600 dark:text-surface-400">{{ ui.label_minified_json }}</span>
            <span class="font-medium text-surface-600 dark:text-surface-400">{{ ui.label_toon }}</span>

            <span class="text-surface-500 dark:text-surface-400">{{ ui.label_characters }}</span>
            <span>{{ comparison.json.characters }}</span>
            <span>{{ comparison.toon.characters }}</span>

            <span class="text-surface-500 dark:text-surface-400">{{ ui.label_bytes }}</span>
            <span>{{ comparison.json.bytes }}</span>
            <span>{{ comparison.toon.bytes }}</span>

            <span class="text-surface-500 dark:text-surface-400">{{ ui.label_tokens }}</span>
            <span>{{ comparison.json.tokens }}</span>
            <span>{{ comparison.toon.tokens }}</span>
          </div>

          <div class="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-surface-600 dark:text-surface-400">
            <span>{{ ui.label_difference }} {{ tokenDifference }}</span>
            <span>{{ ui.label_change }} {{ tokenChange }}</span>
          </div>

          <div class="mt-2 space-y-1">
            <div class="text-surface-500 dark:text-surface-400">
              <span class="font-bold">{{ ui.label_warning }}</span> {{ ui.warning_estimated_tokens }}
            </div>
            <div v-if="comparison.toon.bytes > comparison.json.bytes" class="text-amber-700 dark:text-amber-400">
              <span class="font-bold">{{ ui.label_warning }}</span> {{ ui.warning_toon_larger }}
            </div>
            <div v-if="hintText" class="text-surface-500 dark:text-surface-400">
              <span class="font-bold">{{ ui.label_warning }}</span> {{ hintText }}
            </div>
          </div>
        </div>
      </div>
    </template>

    <template #second>
      <div class="h-full pl-3 flex flex-col">
        <JsonOutputPanel
          :label="mode === 'jsonToToon' ? ui.label_toon_output : ui.label_json_output"
          :content="outputText"
          :parsed-data="mode === 'toonToJson' ? parsedOutputData : null"
          :error="error"
          :view-mode="mode === 'toonToJson' ? 'rich' : 'text'"
          :show-view-toggle="mode === 'toonToJson'"
          :enable-tree-search="false"
          :highlight="mode === 'toonToJson' ? 'json' : ''"
          :empty-text="ui.placeholder_toon"
          :download-filename="mode === 'toonToJson' ? 'converted.json' : 'converted.txt'"
        />
      </div>
    </template>

    <template #toolbar-left>
      <button @click="convert" class="btn-primary px-5 py-2 text-xs">
        <Icon name="lucide:arrow-right" class="h-4 w-4 mr-1.5" />
        {{ ui.btn_convert }}
      </button>

      <button
        v-if="outputText"
        @click="swap"
        class="flex items-center gap-1 rounded-lg border border-surface-200 bg-white px-2.5 py-1 text-xs text-surface-600 hover:bg-surface-50 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-300"
      >
        <Icon name="lucide:arrow-left-right" class="h-3.5 w-3.5" />
        {{ ui.btn_swap }}
      </button>

      <div class="flex items-center gap-2">
        <label class="text-xs text-surface-600 dark:text-surface-400">{{ ui.label_mode }}</label>
        <select v-model="mode" class="rounded-lg border border-surface-200 bg-white px-2 py-1 text-xs dark:border-surface-700 dark:bg-surface-800">
          <option value="jsonToToon">{{ ui.option_json_to_toon }}</option>
          <option value="toonToJson">{{ ui.option_toon_to_json }}</option>
        </select>
      </div>

      <div class="flex items-center gap-2">
        <label class="text-xs text-surface-600 dark:text-surface-400">{{ ui.option_delimiter }}</label>
        <select v-model="delimiter" class="rounded-lg border border-surface-200 bg-white px-2 py-1 text-xs dark:border-surface-700 dark:bg-surface-800">
          <option value=",">{{ ui.option_comma }}</option>
          <option :value="'\t'">{{ ui.option_tab }}</option>
          <option value="|">{{ ui.option_pipe }}</option>
        </select>
      </div>

      <div v-if="mode === 'toonToJson'" class="flex items-center gap-2">
        <label class="text-xs text-surface-600 dark:text-surface-400">{{ ui.option_indent }}</label>
        <select v-model.number="indent" class="rounded-lg border border-surface-200 bg-white px-2 py-1 text-xs dark:border-surface-700 dark:bg-surface-800">
          <option :value="2">{{ ui.option_indent_2 }}</option>
          <option :value="4">{{ ui.option_indent_4 }}</option>
          <option :value="0">{{ ui.option_minified }}</option>
        </select>
      </div>
    </template>
  </ResizablePanel>
</template>

<script setup lang="ts">
import { useDebounceFn } from '@vueuse/core'
import { jsonToToon, toonToJson } from '~/utils/toon'
import type { ToonDelimiter } from '~/utils/toon'

const props = defineProps<{ tool: any }>()
const { t } = useI18n()
const toast = useToast()

// Every visible string comes from the page's ui block. No English fallbacks:
// a missing key renders as an empty label instead of leaking English into zh.
const ui = computed<Record<string, string>>(() => props.tool?.ui ?? {})

type Direction = 'jsonToToon' | 'toonToJson'

const inputText = ref('')
const inboxApplied = ref(false)
const mode = ref<Direction>('jsonToToon')
const delimiter = ref<ToonDelimiter>(',')
const indent = ref(2)
const outputText = ref('')
const parsedOutputData = ref<unknown>(null)
const error = ref('')
const fullscreen = ref(false)
const inputEditorRef = ref()

interface Measure { characters: number; bytes: number; tokens: number }
interface Comparison { json: Measure; toon: Measure }

const comparison = ref<Comparison | null>(null)

function measure(text: string): Measure {
  const characters = text.length
  const bytes = new TextEncoder().encode(text).length
  // Disclosed heuristic: one token per four characters. It is not a
  // model-specific tokenizer count, and both sides use the same formula.
  const tokens = Math.ceil(characters / 4)
  return { characters, bytes, tokens }
}

const tokenDifference = computed(() => {
  if (!comparison.value) return 0
  return comparison.value.toon.tokens - comparison.value.json.tokens
})

const tokenChange = computed(() => {
  if (!comparison.value) return '0%'
  const base = comparison.value.json.tokens
  if (base === 0) return '0%'
  const pct = ((comparison.value.toon.tokens - base) / base) * 100
  // Numbers only, so it stays language-neutral.
  return `${pct > 0 ? '+' : ''}${pct.toFixed(1)}%`
})

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** True when the document holds an array that TOON can emit in tabular form. */
function containsTabularArray(value: unknown): boolean {
  if (Array.isArray(value)) {
    const objects = value.filter(isPlainObject)
    if (objects.length === value.length && objects.length > 0
      && objects.every(o => Object.keys(o).length > 0)) {
      const keys = Object.keys(objects[0]).sort()
      const sameKeys = objects.every(o => {
        const own = Object.keys(o).sort()
        return own.length === keys.length && own.every((k, i) => k === keys[i])
      })
      const primitiveColumns = keys.every(k =>
        objects.every(o => o[k] === null || typeof o[k] !== 'object'))
      if (sameKeys && primitiveColumns) return true
    }
    return value.some(containsTabularArray)
  }
  if (isPlainObject(value)) return Object.values(value).some(containsTabularArray)
  return false
}

function maxDepth(value: unknown, depth = 1): number {
  if (Array.isArray(value)) {
    if (value.length === 0) return depth
    return Math.max(...value.map(v => maxDepth(v, depth + 1)))
  }
  if (isPlainObject(value)) {
    const values = Object.values(value)
    if (values.length === 0) return depth
    return Math.max(...values.map(v => maxDepth(v, depth + 1)))
  }
  return depth
}

const hintText = computed(() => {
  const value = parsedOutputData.value
  if (value === null || value === undefined) return ''
  if (containsTabularArray(value)) return ui.value.hint_uniform
  if (maxDepth(value) >= 3) return ui.value.hint_nested
  return ui.value.hint_mixed
})

const convert = (silent = false) => {
  error.value = ''
  outputText.value = ''
  parsedOutputData.value = null
  comparison.value = null

  if (!inputText.value.trim()) {
    error.value = ui.value.error_empty_input
    if (!silent) toast.error(error.value)
    return
  }

  let value: unknown
  if (mode.value === 'jsonToToon') {
    try {
      value = JSON.parse(inputText.value)
    } catch {
      error.value = ui.value.error_invalid_json
      if (!silent) toast.error(error.value)
      return
    }
    outputText.value = jsonToToon(value, { delimiter: delimiter.value })
    parsedOutputData.value = value
  } else {
    try {
      value = toonToJson(inputText.value)
    } catch {
      error.value = ui.value.error_invalid_toon
      if (!silent) toast.error(error.value)
      return
    }
    parsedOutputData.value = value
    outputText.value = indent.value === 0
      ? JSON.stringify(value)
      : JSON.stringify(value, null, indent.value)
  }

  comparison.value = {
    json: measure(JSON.stringify(value)),
    toon: measure(jsonToToon(value, { delimiter: delimiter.value })),
  }

  if (!silent) toast.success(t('toast.converted'))
}

const clearAll = () => {
  outputText.value = ''
  parsedOutputData.value = null
  error.value = ''
  comparison.value = null
}

/** Feed the current output back in and flip the direction (round-trip check). */
const swap = () => {
  if (!outputText.value) return
  inputText.value = outputText.value
  mode.value = mode.value === 'jsonToToon' ? 'toonToJson' : 'jsonToToon'
  convert()
}

const debouncedConvert = useDebounceFn(() => convert(true), 300)
watch(inputText, () => debouncedConvert())
watch([mode, delimiter], () => {
  if (inputText.value.trim()) convert(true)
})
// Indent only affects formatting, so re-render an existing result.
watch(indent, () => {
  if (parsedOutputData.value !== null && mode.value === 'toonToJson') {
    outputText.value = indent.value === 0
      ? JSON.stringify(parsedOutputData.value)
      : JSON.stringify(parsedOutputData.value, null, indent.value)
  }
})

onMounted(() => {
  const text = useJsonInbox().consumeInbox()
  if (text != null) {
    inputText.value = text
    inboxApplied.value = true
  }
})
onMounted(() => {
  if (inboxApplied.value) return
  inputEditorRef.value?.loadDefaultExample()
})
</script>
