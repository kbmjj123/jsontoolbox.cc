<template>
  <ResizablePanel v-model:fullscreen="fullscreen" :initial-ratio="0.5" responsive>
    <template #first>
      <div class="h-full pr-3 flex flex-col">
        <JsonInputEditor
          ref="inputEditorRef"
          v-model="inputJson"
          :label="ui.label_input"
          :placeholder="ui.placeholder_input"
          accept=".json,.txt,.jsonl,.ndjson"
          show-upload
          example-slug="json-to-text"
          class="flex-1 min-h-0"
          @clear="clearAll"
        />

        <div class="mt-3 flex shrink-0 flex-wrap items-center gap-3">
          <span class="stat-chip">
            <Icon name="lucide:list" class="h-3 w-3" />
            {{ ui.label_lines }} {{ lineCount }}
          </span>
          <span class="stat-chip">
            <Icon name="lucide:type" class="h-3 w-3" />
            {{ ui.label_characters }} {{ charCount }}
          </span>
        </div>
      </div>
    </template>

    <template #second>
      <div class="h-full pl-3 flex flex-col">
        <JsonOutputPanel
          :label="ui.label_output"
          :content="outputText"
          :error="error"
          view-mode="text"
          :show-view-toggle="false"
          :empty-text="ui.placeholder_output"
          download-filename="converted.txt"
        />
      </div>
    </template>

    <template #toolbar-left>
      <button @click="convert" class="btn-primary px-5 py-2 text-xs">
        <Icon name="lucide:arrow-right" class="h-4 w-4 mr-1.5" />
        {{ ui.btn_convert }}
      </button>

      <div class="flex items-center gap-2">
        <label class="text-xs text-surface-600 dark:text-surface-400">{{ ui.label_mode }}</label>
        <select v-model="mode" class="rounded-lg border border-surface-200 bg-white px-2 py-1 text-xs dark:border-surface-700 dark:bg-surface-800">
          <option value="flatten">{{ ui.option_flatten }}</option>
          <option value="keyvalue">{{ ui.option_key_value }}</option>
          <option value="values">{{ ui.option_values }}</option>
          <option value="keys">{{ ui.option_keys }}</option>
          <option value="jsonl">{{ ui.option_jsonl }}</option>
        </select>
      </div>

      <template v-if="mode === 'flatten' || mode === 'keyvalue'">
        <div class="flex items-center gap-2">
          <label class="text-xs text-surface-600 dark:text-surface-400">{{ ui.option_separator }}</label>
          <select v-model="separator" class="rounded-lg border border-surface-200 bg-white px-2 py-1 text-xs dark:border-surface-700 dark:bg-surface-800">
            <option value=":">{{ ui.option_separator_colon }}</option>
            <option value="=">{{ ui.option_separator_equals }}</option>
          </select>
        </div>
      </template>

      <label v-if="mode === 'keyvalue'" class="flex items-center gap-1.5 cursor-pointer select-none">
        <input type="checkbox" v-model="includePaths" class="w-3.5 h-3.5 rounded border-surface-300 text-primary-600 focus:ring-primary-500" />
        <span class="text-xs text-surface-600 dark:text-surface-400">{{ ui.option_include_paths }}</span>
      </label>

      <template v-if="mode !== 'jsonl'">
        <div class="flex items-center gap-2">
          <label class="text-xs text-surface-600 dark:text-surface-400">{{ ui.option_array_mode }}</label>
          <select v-model="arrayMode" class="rounded-lg border border-surface-200 bg-white px-2 py-1 text-xs dark:border-surface-700 dark:bg-surface-800">
            <option value="index">{{ ui.option_array_each_line }}</option>
            <option value="inline">{{ ui.option_array_inline }}</option>
          </select>
        </div>

        <label class="flex items-center gap-1.5 cursor-pointer select-none">
          <input type="checkbox" v-model="includeEmpty" class="w-3.5 h-3.5 rounded border-surface-300 text-primary-600 focus:ring-primary-500" />
          <span class="text-xs text-surface-600 dark:text-surface-400">{{ ui.option_include_empty }}</span>
        </label>
      </template>
    </template>
  </ResizablePanel>
</template>

<script setup lang="ts">
import { useDebounceFn } from '@vueuse/core'

const props = defineProps<{ tool: any }>()
const { t } = useI18n()
const toast = useToast()

// Every visible string comes from the page's ui block. No English fallbacks:
// a missing key renders as an empty label instead of leaking English into zh.
const ui = computed<Record<string, string>>(() => props.tool?.ui ?? {})

type OutputMode = 'flatten' | 'keyvalue' | 'values' | 'keys' | 'jsonl'

const inputJson = ref('')
const inboxApplied = ref(false)
const mode = ref<OutputMode>('flatten')
const separator = ref(':')
const includePaths = ref(false)
const arrayMode = ref<'index' | 'inline'>('index')
const includeEmpty = ref(false)
const outputText = ref('')
const error = ref('')
const fullscreen = ref(false)
const inputEditorRef = ref()

const lineCount = computed(() => (outputText.value ? outputText.value.split('\n').length : 0))
const charCount = computed(() => outputText.value.length)

/** A parsed value is a leaf when it is not a container we have to walk into. */
function isLeaf(value: unknown): boolean {
  return value === null || typeof value !== 'object'
}

function isEmptyContainer(value: unknown): boolean {
  if (Array.isArray(value)) return value.length === 0
  if (value !== null && typeof value === 'object') return Object.keys(value).length === 0
  return false
}

/** Render a leaf for text output: strings lose their JSON quoting. */
function formatLeaf(value: unknown): string {
  if (value === null) return 'null'
  if (typeof value === 'string') return value
  if (Array.isArray(value)) return '[]'
  if (typeof value === 'object') return '{}'
  return String(value)
}

/**
 * Collect one line per leaf (or per empty container when requested), in document
 * order. Array items use bracket indexes such as `roles[0]`; keys are used as-is,
 * so a key that already contains a dot stays ambiguous by definition.
 */
function collect(value: unknown, path: string, out: { path: string; value: unknown }[]): void {
  // The root document is always walked, so inline mode only collapses arrays
  // that appear inside it.
  const inlineArray = arrayMode.value === 'inline' && path !== ''
    && Array.isArray(value) && value.length > 0
  if (isLeaf(value) || inlineArray) {
    out.push({ path, value: inlineArray ? JSON.stringify(value) : value })
    return
  }

  if (isEmptyContainer(value)) {
    if (includeEmpty.value) out.push({ path, value })
    return
  }

  if (Array.isArray(value)) {
    value.forEach((item, i) => collect(item, `${path}[${i}]`, out))
    return
  }

  for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
    collect(item, path === '' ? key : `${path}.${key}`, out)
  }
}

/** Last path segment, used when key-value mode prints the leaf key only. */
function leafKey(path: string): string {
  const parts = path.split('.')
  return parts[parts.length - 1] || path
}

function buildLines(data: unknown): string[] {
  if (mode.value === 'jsonl') {
    const items = Array.isArray(data) ? data : [data]
    return items.map(item => JSON.stringify(item))
  }

  const entries: { path: string; value: unknown }[] = []
  collect(data, '', entries)

  if (mode.value === 'values') return entries.map(e => formatLeaf(e.value))
  if (mode.value === 'keys') return entries.map(e => e.path)

  const sep = separator.value === '=' ? ' = ' : ': '
  return entries.map(e => {
    const key = mode.value === 'flatten' || includePaths.value ? e.path : leafKey(e.path)
    return `${key}${sep}${formatLeaf(e.value)}`
  })
}

const convert = (silent = false) => {
  error.value = ''
  outputText.value = ''

  if (!inputJson.value.trim()) {
    error.value = ui.value.error_empty_input
    if (!silent) toast.error(error.value)
    return
  }

  let data: unknown
  try {
    data = JSON.parse(inputJson.value)
  } catch {
    error.value = ui.value.error_invalid_json
    if (!silent) toast.error(error.value)
    return
  }

  const lines = buildLines(data)
  if (lines.length === 0) {
    error.value = ui.value.error_no_output
    if (!silent) toast.error(error.value)
    return
  }

  outputText.value = lines.join('\n')
  if (!silent) toast.success(t('toast.converted'))
}

const clearAll = () => {
  outputText.value = ''
  error.value = ''
}

const debouncedConvert = useDebounceFn(() => convert(true), 300)
watch(inputJson, () => debouncedConvert())
watch([mode, separator, includePaths, arrayMode, includeEmpty], () => {
  if (inputJson.value.trim()) convert(true)
})

onMounted(() => {
  const text = useJsonInbox().consumeInbox()
  if (text != null) {
    inputJson.value = text
    inboxApplied.value = true
  }
})
onMounted(() => {
  if (inboxApplied.value) return
  inputEditorRef.value?.loadDefaultExample()
})
</script>
