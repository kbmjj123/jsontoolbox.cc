<template>
  <ResizablePanel v-model:fullscreen="fullscreen" :initial-ratio="0.5" responsive>
    <template #first>
      <div class="h-full pr-3 flex flex-col">
        <JsonInputEditor
          ref="inputEditorRef"
          v-model="inputText"
          :label="ui.label_input"
          :placeholder="ui.placeholder_input"
          accept=".jsonc,.json,.txt"
          show-upload
          example-slug="jsonc-to-json"
          class="flex-1 min-h-0"
          @clear="clearAll"
        />

        <div class="mt-3 flex shrink-0 flex-col gap-2">
          <div class="flex flex-wrap items-center gap-3">
            <span class="stat-chip">
              <Icon name="lucide:message-square-off" class="h-3 w-3" />
              {{ ui.label_comments_removed }} {{ stats.commentsRemoved }}
            </span>
            <span class="stat-chip">
              <Icon name="lucide:brackets" class="h-3 w-3" />
              {{ ui.label_trailing_commas_removed }} {{ stats.trailingCommasRemoved }}
            </span>
          </div>

          <div
            v-if="stats.commentsRemoved > 0 && !error"
            class="rounded-lg bg-amber-50 px-3 py-1.5 text-xs text-amber-700 dark:bg-amber-900/20 dark:text-amber-400"
          >
            <span class="font-bold">{{ ui.label_warnings }}</span> {{ ui.warning_comment_removed }}
          </div>
        </div>
      </div>
    </template>

    <template #second>
      <div class="h-full pl-3 flex flex-col">
        <JsonOutputPanel
          v-model:view-mode="outputViewMode"
          :label="ui.label_output"
          :content="outputJson"
          :parsed-data="parsedOutputData"
          :error="error"
          :enable-tree-search="false"
          :highlight="'json'"
          :empty-text="ui.placeholder_output"
          download-filename="converted.json"
        />
      </div>
    </template>

    <template #toolbar-left>
      <button @click="convert" class="btn-primary px-5 py-2 text-xs">
        <Icon name="lucide:arrow-right" class="h-4 w-4 mr-1.5" />
        {{ ui.btn_convert }}
      </button>

      <label class="flex items-center gap-1.5 cursor-pointer select-none">
        <input type="checkbox" v-model="removeLineComments" class="w-3.5 h-3.5 rounded border-surface-300 text-primary-600 focus:ring-primary-500" />
        <span class="text-xs text-surface-600 dark:text-surface-400">{{ ui.option_remove_line_comments }}</span>
      </label>

      <label class="flex items-center gap-1.5 cursor-pointer select-none">
        <input type="checkbox" v-model="removeBlockComments" class="w-3.5 h-3.5 rounded border-surface-300 text-primary-600 focus:ring-primary-500" />
        <span class="text-xs text-surface-600 dark:text-surface-400">{{ ui.option_remove_block_comments }}</span>
      </label>

      <label class="flex items-center gap-1.5 cursor-pointer select-none">
        <input type="checkbox" v-model="removeTrailingCommas" class="w-3.5 h-3.5 rounded border-surface-300 text-primary-600 focus:ring-primary-500" />
        <span class="text-xs text-surface-600 dark:text-surface-400">{{ ui.option_remove_trailing_commas }}</span>
      </label>

      <div class="flex items-center gap-2">
        <label class="text-xs text-surface-600 dark:text-surface-400">{{ ui.option_indent }}</label>
        <select v-model.number="indent" class="rounded-lg border border-surface-200 bg-white px-2 py-1 text-xs dark:border-surface-700 dark:bg-surface-800">
          <option :value="2">{{ ui.option_indent_2 }}</option>
          <option :value="4">{{ ui.option_indent_4 }}</option>
          <option :value="0">{{ ui.option_indent_minified }}</option>
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

interface StripError { key: string; index: number }
interface StripStats {
  text: string
  commentsRemoved: number
  trailingCommasRemoved: number
  /** JSONC syntax that was found but left in place because its option is off. */
  skipped: number
  error: StripError | null
}

const EMPTY_STATS: StripStats = {
  text: '', commentsRemoved: 0, trailingCommasRemoved: 0, skipped: 0, error: null,
}

function isWhitespace(ch: string): boolean {
  return ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r'
}

/**
 * Next character that is neither whitespace nor a comment, without consuming
 * it. Used to decide whether a comma is trailing.
 */
function nextSignificantChar(text: string, from: number): string | null {
  let j = from
  while (j < text.length) {
    const ch = text[j]
    if (isWhitespace(ch)) { j++; continue }
    if (ch === '/' && text[j + 1] === '/') {
      j += 2
      while (j < text.length && text[j] !== '\n' && text[j] !== '\r') j++
      continue
    }
    if (ch === '/' && text[j + 1] === '*') {
      const end = text.indexOf('*/', j + 2)
      if (end === -1) return null
      j = end + 2
      continue
    }
    return ch
  }
  return null
}

/**
 * Remove JSONC extensions with a single-pass scanner instead of a regular
 * expression. Comment markers inside quoted strings are string content and are
 * copied untouched, so values such as "https://example.com/a//b" survive.
 */
function stripJsonc(text: string, opts: {
  removeLineComments: boolean
  removeBlockComments: boolean
  removeTrailingCommas: boolean
}): StripStats {
  let out = ''
  let commentsRemoved = 0
  let trailingCommasRemoved = 0
  let skipped = 0
  let lastSignificant = ''
  let i = 0

  while (i < text.length) {
    const ch = text[i]

    // A quoted string is copied verbatim, escapes included.
    if (ch === '"') {
      out += ch
      i++
      while (i < text.length) {
        const c = text[i]
        if (c === '\\') { out += c + (text[i + 1] ?? ''); i += 2; continue }
        out += c
        i++
        if (c === '"') break
      }
      lastSignificant = '"'
      continue
    }

    if (ch === '/' && text[i + 1] === '/') {
      if (!opts.removeLineComments) { out += '//'; i += 2; skipped++; lastSignificant = '/'; continue }
      commentsRemoved++
      i += 2
      while (i < text.length && text[i] !== '\n' && text[i] !== '\r') i++
      continue
    }

    if (ch === '/' && text[i + 1] === '*') {
      if (!opts.removeBlockComments) { out += '/*'; i += 2; skipped++; lastSignificant = '*'; continue }
      const end = text.indexOf('*/', i + 2)
      if (end === -1) {
        return { ...EMPTY_STATS, error: { key: 'error_unclosed_comment', index: i } }
      }
      commentsRemoved++
      i = end + 2
      continue
    }

    if (ch === ',') {
      // A comma with no value before it is not a trailing comma, it is invalid.
      if (lastSignificant === '' || lastSignificant === ',' || lastSignificant === '{' || lastSignificant === '[') {
        return { ...EMPTY_STATS, error: { key: 'error_invalid_trailing_comma', index: i } }
      }
      const next = nextSignificantChar(text, i + 1)
      if (next === '}' || next === ']') {
        if (opts.removeTrailingCommas) { trailingCommasRemoved++; i++; continue }
        skipped++
      }
      out += ch
      i++
      lastSignificant = ','
      continue
    }

    if (!isWhitespace(ch)) lastSignificant = ch
    out += ch
    i++
  }

  return { text: out, commentsRemoved, trailingCommasRemoved, skipped, error: null }
}

/** 1-based line and column for a character index. */
function lineColumn(text: string, index: number): { line: number; column: number } {
  const before = text.slice(0, index).split('\n')
  return { line: before.length, column: before[before.length - 1].length + 1 }
}

const inputText = ref('')
const inboxApplied = ref(false)
const removeLineComments = ref(true)
const removeBlockComments = ref(true)
const removeTrailingCommas = ref(true)
const indent = ref(2)
const outputJson = ref('')
const parsedOutputData = ref<unknown>(null)
const error = ref('')
const stats = ref<StripStats>(EMPTY_STATS)
const fullscreen = ref(false)
const outputViewMode = ref<'text' | 'rich' | 'table'>('rich')
const inputEditorRef = ref()

/** Fill `{key}` placeholders from the page copy. */
const fill = (template: string | undefined, values: Record<string, number>): string => {
  if (!template) return ''
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ''))
}

const convert = (silent = false) => {
  error.value = ''
  outputJson.value = ''
  parsedOutputData.value = null
  stats.value = EMPTY_STATS

  if (!inputText.value.trim()) {
    error.value = ui.value.error_empty_input
    if (!silent) toast.error(error.value)
    return
  }

  const stripped = stripJsonc(inputText.value, {
    removeLineComments: removeLineComments.value,
    removeBlockComments: removeBlockComments.value,
    removeTrailingCommas: removeTrailingCommas.value,
  })

  if (stripped.error) {
    const at = lineColumn(inputText.value, stripped.error.index)
    const where = fill(ui.value.error_position, at)
    error.value = where ? `${ui.value[stripped.error.key]} ${where}` : ui.value[stripped.error.key]
    if (!silent) toast.error(error.value)
    return
  }

  let data: unknown
  try {
    data = JSON.parse(stripped.text)
  } catch (e) {
    // Syntax that was found but deliberately left in place is the likely cause;
    // otherwise the source itself is not valid JSONC.
    const key = stripped.skipped > 0 ? 'error_invalid_json' : 'error_invalid_jsonc'
    const at = getErrorLocation(stripped.text, (e as Error).message)
    const where = at ? fill(ui.value.error_position, at) : ''
    error.value = where ? `${ui.value[key]} ${where}` : ui.value[key]
    if (!silent) toast.error(error.value)
    return
  }

  stats.value = stripped
  parsedOutputData.value = data
  outputJson.value = indent.value === 0
    ? JSON.stringify(data)
    : JSON.stringify(data, null, indent.value)
  if (!silent) toast.success(t('toast.converted'))
}

const clearAll = () => {
  outputJson.value = ''
  parsedOutputData.value = null
  error.value = ''
  stats.value = EMPTY_STATS
}

const debouncedConvert = useDebounceFn(() => convert(true), 300)
watch(inputText, () => debouncedConvert())
watch([removeLineComments, removeBlockComments, removeTrailingCommas], () => {
  if (inputText.value.trim()) convert(true)
})
// Indent only affects formatting, so re-render an existing result.
watch(indent, () => {
  if (parsedOutputData.value !== null) {
    outputJson.value = indent.value === 0
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
