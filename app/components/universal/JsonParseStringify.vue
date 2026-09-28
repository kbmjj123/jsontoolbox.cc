<template>
  <ResizablePanel v-model:fullscreen="fullscreen" :initial-ratio="0.5" responsive>
    <template #first>
      <div class="h-full pr-3 flex flex-col">
        <JsonInputEditor
          ref="inputEditorRef"
          v-model="inputText"
          :label="ui.label_input"
          :placeholder="ui.placeholder_input"
          accept=".json,.txt,.log"
          show-upload
          example-slug="json-parse-stringify"
          class="flex-1 min-h-0"
          @clear="clearAll"
        />

        <div class="mt-3 flex shrink-0 flex-wrap items-center gap-3">
          <span v-if="mode === 'parse' && resultType" class="stat-chip">
            <Icon name="lucide:braces" class="h-3 w-3" />
            {{ ui.label_result_type }} {{ resultTypeText }}
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
          :parsed-data="mode === 'parse' ? parsedValue : null"
          :error="error"
          :view-mode="mode === 'parse' ? 'rich' : 'text'"
          :show-view-toggle="mode === 'parse'"
          :enable-tree-search="false"
          :highlight="mode === 'parse' ? 'json' : ''"
          :empty-text="ui.placeholder_output"
          :download-filename="mode === 'parse' ? 'parsed.json' : 'stringified.txt'"
        />
      </div>
    </template>

    <template #toolbar-left>
      <button @click="convert" class="btn-primary px-5 py-2 text-xs">
        <Icon name="lucide:arrow-right" class="h-4 w-4 mr-1.5" />
        {{ mode === 'parse' ? ui.btn_parse : ui.btn_stringify }}
      </button>

      <div class="flex items-center gap-2">
        <label class="text-xs text-surface-600 dark:text-surface-400">{{ ui.label_mode }}</label>
        <select v-model="mode" class="rounded-lg border border-surface-200 bg-white px-2 py-1 text-xs dark:border-surface-700 dark:bg-surface-800">
          <option value="parse">{{ ui.option_parse }}</option>
          <option value="stringify">{{ ui.option_stringify }}</option>
        </select>
      </div>

      <div v-if="mode === 'parse'" class="flex items-center gap-2">
        <label class="text-xs text-surface-600 dark:text-surface-400">{{ ui.label_input_type }}</label>
        <select v-model="inputType" class="rounded-lg border border-surface-200 bg-white px-2 py-1 text-xs dark:border-surface-700 dark:bg-surface-800">
          <option value="auto">{{ ui.option_auto_detect }}</option>
          <option value="document">{{ ui.option_json_document }}</option>
          <option value="string">{{ ui.option_json_string }}</option>
        </select>
      </div>

      <label v-if="mode === 'stringify'" class="flex items-center gap-1.5 cursor-pointer select-none">
        <input type="checkbox" v-model="includeQuotes" class="w-3.5 h-3.5 rounded border-surface-300 text-primary-600 focus:ring-primary-500" />
        <span class="text-xs text-surface-600 dark:text-surface-400">{{ ui.option_include_quotes }}</span>
      </label>

      <div class="flex items-center gap-2">
        <label class="text-xs text-surface-600 dark:text-surface-400">{{ ui.label_indent }}</label>
        <select v-model.number="indent" class="rounded-lg border border-surface-200 bg-white px-2 py-1 text-xs dark:border-surface-700 dark:bg-surface-800">
          <option :value="0">{{ ui.option_compact }}</option>
          <option :value="2">{{ ui.option_indent_2 }}</option>
          <option :value="4">{{ ui.option_indent_4 }}</option>
        </select>
      </div>
    </template>
  </ResizablePanel>
</template>

<script setup lang="ts">
import { useDebounceFn } from '@vueuse/core'

const props = defineProps<{ tool: any }>()
const { t } = useI18n()
const toast = useToast()
const { getErrorLocation } = useJsonParser()

// Every visible string comes from the page's ui block. No English fallbacks:
// a missing key renders as an empty label instead of leaking English into zh.
const ui = computed<Record<string, string>>(() => props.tool?.ui ?? {})

type Operation = 'parse' | 'stringify'
type InputType = 'auto' | 'document' | 'string'

const inputText = ref('')
const inboxApplied = ref(false)
const mode = ref<Operation>('parse')
const inputType = ref<InputType>('auto')
const includeQuotes = ref(false)
const indent = ref(2)
const outputText = ref('')
const parsedValue = ref<unknown>(null)
const resultType = ref('')
const error = ref('')
const fullscreen = ref(false)
const inputEditorRef = ref()

const charCount = computed(() => outputText.value.length)

const TYPE_KEYS: Record<string, string> = {
  object: 'type_object',
  array: 'type_array',
  string: 'type_string',
  number: 'type_number',
  boolean: 'type_boolean',
  null: 'type_null',
}

const resultTypeText = computed(() => {
  const key = TYPE_KEYS[resultType.value]
  return key ? (ui.value[key] ?? '') : ''
})

function describeType(value: unknown): string {
  if (value === null) return 'null'
  if (Array.isArray(value)) return 'array'
  return typeof value
}

/** Fill `{key}` placeholders from the page copy. */
const fill = (template: string | undefined, values: Record<string, number>): string => {
  if (!template) return ''
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ''))
}

function withPosition(message: string, rawMessage: string, text: string): string {
  const at = getErrorLocation(text, rawMessage)
  const where = at ? fill(ui.value.error_position, at) : ''
  return where ? `${message} ${where}` : message
}

const convert = (silent = false) => {
  error.value = ''
  outputText.value = ''
  parsedValue.value = null
  resultType.value = ''

  if (!inputText.value.trim()) {
    error.value = ui.value.error_empty_input
    if (!silent) toast.error(error.value)
    return
  }

  let value: unknown
  try {
    value = JSON.parse(inputText.value)
  } catch (e) {
    error.value = withPosition(ui.value.error_invalid_json, (e as Error).message, inputText.value)
    if (!silent) toast.error(error.value)
    return
  }

  if (mode.value === 'parse') {
    let final = value

    if (inputType.value === 'string') {
      if (typeof value !== 'string') {
        error.value = ui.value.error_invalid_string
        if (!silent) toast.error(error.value)
        return
      }
      try {
        final = JSON.parse(value)
      } catch {
        error.value = ui.value.error_parse_failed
        if (!silent) toast.error(error.value)
        return
      }
    } else if (inputType.value === 'auto' && typeof value === 'string') {
      // Unwrap a single serialization layer, but only when the inner text is
      // itself JSON. Otherwise the string is the intended value.
      const trimmed = value.trim()
      if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
        try {
          final = JSON.parse(value)
        } catch {
          final = value
        }
      }
    }

    parsedValue.value = final
    resultType.value = describeType(final)
    outputText.value = indent.value === 0
      ? JSON.stringify(final)
      : JSON.stringify(final, null, indent.value)
  } else {
    const text = indent.value === 0
      ? JSON.stringify(value)
      : JSON.stringify(value, null, indent.value)
    outputText.value = includeQuotes.value ? JSON.stringify(text) : text
  }

  if (!silent) toast.success(t('toast.converted'))
}

const clearAll = () => {
  outputText.value = ''
  parsedValue.value = null
  resultType.value = ''
  error.value = ''
}

const debouncedConvert = useDebounceFn(() => convert(true), 300)
watch(inputText, () => debouncedConvert())
watch([mode, inputType, includeQuotes, indent], () => {
  if (inputText.value.trim()) convert(true)
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
