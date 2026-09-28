<template>
  <ResizablePanel v-model:fullscreen="fullscreen" :initial-ratio="0.5" responsive>
    <template #first>
      <div class="h-full pr-3 flex flex-col">
        <JsonInputEditor
          ref="inputEditorRef"
          v-model="inputText"
          :label="ui.label_input"
          :placeholder="ui.placeholder_input"
          accept=".txt,.csv,.tsv,.text,.log"
          show-upload
          example-slug="txt-to-json"
          class="flex-1 min-h-0"
          @clear="clearAll"
          @example-loaded="onExampleLoaded"
        />

        <!-- Parsed preview: live, independent from Convert -->
        <div class="mt-3 flex max-h-52 shrink-0 flex-col overflow-hidden rounded-xl border border-surface-200 bg-white text-xs dark:border-surface-700 dark:bg-surface-900 dark:text-surface-200">
          <div class="flex shrink-0 items-center gap-2 border-b border-surface-200 px-3 py-1.5 dark:border-surface-700">
            <Icon name="lucide:scan-search" class="h-3.5 w-3.5 text-surface-400" />
            <span class="font-bold text-surface-700 dark:text-surface-300">{{ ui.preview_title }}</span>
            <span v-if="hasPreview" class="ml-auto flex items-center gap-3 text-surface-500 dark:text-surface-400">
              <span v-if="mode === 'lines'">{{ ui.preview_lines }} {{ linesResult.values.length }}</span>
              <span v-if="mode === 'keyvalue'">{{ ui.preview_keys }} {{ keyValueResult.entries.length }}</span>
              <template v-if="mode === 'delimited'">
                <span>{{ ui.preview_rows }} {{ delimitedResult.totalRows }}</span>
                <span>{{ ui.preview_columns }} {{ delimitedResult.headers.length }}</span>
                <span>{{ ui.option_delimiter }} {{ delimiterLabel }}</span>
              </template>
            </span>
          </div>

          <div
            v-for="(w, wi) in warningTexts"
            :key="`w-${wi}`"
            class="shrink-0 bg-amber-50 px-3 py-1 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400"
          >
            {{ w }}
          </div>

          <div v-if="hasPreview" class="min-h-0 flex-1 overflow-auto">
            <!-- Lines mode -->
            <ol v-if="mode === 'lines'" class="p-2">
              <li
                v-for="(v, i) in linesResult.values.slice(0, PREVIEW_ROW_LIMIT)"
                :key="`l-${i}`"
                class="flex gap-2 px-1 py-0.5"
              >
                <span class="w-8 shrink-0 text-right text-surface-400 dark:text-surface-500">{{ i + 1 }}</span>
                <span class="truncate text-surface-700 dark:text-surface-300">{{ displayCell(v) }}</span>
              </li>
            </ol>

            <!-- Key-value mode -->
            <table v-else-if="mode === 'keyvalue'" class="w-full border-collapse text-left">
              <thead class="sticky top-0 bg-surface-50 dark:bg-surface-800">
                <tr>
                  <th class="w-10 border-r border-surface-200 px-2 py-1 text-center font-medium text-surface-400 dark:border-surface-700 dark:text-surface-500">#</th>
                  <th class="border-r border-surface-200 px-2 py-1 font-bold text-surface-700 dark:border-surface-700 dark:text-surface-300">{{ ui.preview_key }}</th>
                  <th class="px-2 py-1 font-bold text-surface-700 dark:text-surface-300">{{ ui.preview_value }}</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(entry, ri) in keyValueResult.entries.slice(0, PREVIEW_ROW_LIMIT)"
                  :key="`kv-${ri}`"
                >
                  <td class="border-r border-surface-200 px-2 py-1 text-center text-surface-400 dark:border-surface-700 dark:text-surface-500">{{ ri + 1 }}</td>
                  <td class="max-w-[160px] truncate whitespace-nowrap border-r border-surface-200 px-2 py-1 font-medium text-surface-700 dark:border-surface-700 dark:text-surface-300">{{ entry.key }}</td>
                  <td class="max-w-[200px] truncate whitespace-nowrap px-2 py-1 text-surface-700 dark:text-surface-300">{{ displayValue(entry.value) }}</td>
                </tr>
              </tbody>
            </table>

            <!-- Delimited mode -->
            <table v-else class="w-full border-collapse text-left">
              <thead class="sticky top-0 bg-surface-50 dark:bg-surface-800">
                <tr>
                  <th class="w-10 border-r border-surface-200 px-2 py-1 text-center font-medium text-surface-400 dark:border-surface-700 dark:text-surface-500">#</th>
                  <th
                    v-for="(h, i) in delimitedResult.headers"
                    :key="`h-${i}`"
                    class="whitespace-nowrap border-r border-surface-200 px-2 py-1 font-bold text-surface-700 dark:border-surface-700 dark:text-surface-300"
                  >{{ h }}</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(row, ri) in delimitedResult.rows"
                  :key="`r-${ri}`"
                  :class="delimitedResult.raggedRows.includes(ri) ? 'bg-amber-50 dark:bg-amber-900/20' : ''"
                >
                  <td class="border-r border-surface-200 px-2 py-1 text-center text-surface-400 dark:border-surface-700 dark:text-surface-500">{{ ri + 1 }}</td>
                  <td
                    v-for="(cell, ci) in row"
                    :key="`c-${ri}-${ci}`"
                    class="max-w-[200px] truncate whitespace-nowrap border-r border-surface-200 px-2 py-1 text-surface-700 dark:border-surface-700 dark:text-surface-300"
                  >{{ displayCell(cell) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-else class="px-3 py-4 text-center text-surface-400 dark:text-surface-500">
            {{ ui.preview_empty }}
          </div>

          <div
            v-if="previewTotal > previewShown"
            class="shrink-0 border-t border-surface-200 px-3 py-1 text-surface-500 dark:border-surface-700 dark:text-surface-400"
          >
            {{ showingLabel }}
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

      <div class="flex items-center gap-2">
        <label class="text-xs text-surface-600 dark:text-surface-400">{{ ui.label_mode }}</label>
        <select v-model="mode" class="rounded-lg border border-surface-200 bg-white px-2 py-1 text-xs dark:border-surface-700 dark:bg-surface-800">
          <option value="lines">{{ ui.option_lines_array }}</option>
          <option value="keyvalue">{{ ui.option_key_value }}</option>
          <option value="delimited">{{ ui.option_delimited_rows }}</option>
        </select>
      </div>

      <template v-if="mode === 'delimited'">
        <div class="flex items-center gap-2">
          <label class="text-xs text-surface-600 dark:text-surface-400">{{ ui.option_delimiter }}</label>
          <select v-model="delimiter" class="rounded-lg border border-surface-200 bg-white px-2 py-1 text-xs dark:border-surface-700 dark:bg-surface-800">
            <option value="auto">{{ ui.option_auto_delimiter }}</option>
            <option value=",">{{ ui.option_delimiter_comma }}</option>
            <option value=";">{{ ui.option_delimiter_semicolon }}</option>
            <option :value="'\t'">{{ ui.option_delimiter_tab }}</option>
            <option value="|">{{ ui.option_delimiter_pipe }}</option>
          </select>
        </div>

        <label class="flex items-center gap-1.5 cursor-pointer select-none">
          <input type="checkbox" v-model="hasHeader" class="w-3.5 h-3.5 rounded border-surface-300 text-primary-600 focus:ring-primary-500" />
          <span class="text-xs text-surface-600 dark:text-surface-400">{{ ui.option_has_header }}</span>
        </label>
      </template>

      <template v-if="mode === 'keyvalue'">
        <div class="flex items-center gap-2">
          <label class="text-xs text-surface-600 dark:text-surface-400">{{ ui.option_key_separator }}</label>
          <select v-model="kvSeparator" class="rounded-lg border border-surface-200 bg-white px-2 py-1 text-xs dark:border-surface-700 dark:bg-surface-800">
            <option value=":">{{ ui.option_separator_colon }}</option>
            <option value="=">{{ ui.option_separator_equals }}</option>
          </select>
        </div>
      </template>

      <label class="flex items-center gap-1.5 cursor-pointer select-none">
        <input type="checkbox" v-model="typeInference" class="w-3.5 h-3.5 rounded border-surface-300 text-primary-600 focus:ring-primary-500" />
        <span class="text-xs text-surface-600 dark:text-surface-400">{{ ui.option_infer_types }}</span>
      </label>

      <label class="flex items-center gap-1.5 cursor-pointer select-none">
        <input type="checkbox" v-model="emptyAsNull" class="w-3.5 h-3.5 rounded border-surface-300 text-primary-600 focus:ring-primary-500" />
        <span class="text-xs text-surface-600 dark:text-surface-400">{{ ui.option_empty_as_null }}</span>
      </label>

      <label class="flex items-center gap-1.5 cursor-pointer select-none">
        <input type="checkbox" v-model="trimValues" class="w-3.5 h-3.5 rounded border-surface-300 text-primary-600 focus:ring-primary-500" />
        <span class="text-xs text-surface-600 dark:text-surface-400">{{ ui.option_trim_values }}</span>
      </label>

      <label v-if="mode !== 'delimited'" class="flex items-center gap-1.5 cursor-pointer select-none">
        <input type="checkbox" v-model="skipEmpty" class="w-3.5 h-3.5 rounded border-surface-300 text-primary-600 focus:ring-primary-500" />
        <span class="text-xs text-surface-600 dark:text-surface-400">{{ ui.option_skip_empty }}</span>
      </label>

      <label v-if="mode === 'lines'" class="flex items-center gap-1.5 cursor-pointer select-none">
        <input type="checkbox" v-model="unique" class="w-3.5 h-3.5 rounded border-surface-300 text-primary-600 focus:ring-primary-500" />
        <span class="text-xs text-surface-600 dark:text-surface-400">{{ ui.option_unique }}</span>
      </label>

      <div class="flex items-center gap-2">
        <label class="text-xs text-surface-600 dark:text-surface-400">{{ ui.option_indent }}</label>
        <select v-model.number="indent" class="rounded-lg border border-surface-200 bg-white px-2 py-1 text-xs dark:border-surface-700 dark:bg-surface-800">
          <option :value="2">{{ ui.option_indent_2 }}</option>
          <option :value="4">{{ ui.option_indent_4 }}</option>
        </select>
      </div>
    </template>
  </ResizablePanel>
</template>

<script setup lang="ts">
import { useDebounceFn } from '@vueuse/core'
import { convertValue, detectDelimiter, parseCsv, splitHeaderRow } from '~/utils/csv'
import type { ValueConvertOptions } from '~/utils/csv'

/**
 * Number of parsed items rendered in the preview (stated in the page copy).
 * Copy and download always use every parsed item.
 */
const PREVIEW_ROW_LIMIT = 10

const props = defineProps<{ tool: any }>()
const { t } = useI18n()
const toast = useToast()

// Every visible string comes from the page's ui block. No English fallbacks:
// a missing key renders as an empty label instead of leaking English into zh.
const ui = computed<Record<string, string>>(() => props.tool?.ui ?? {})

type ParseMode = 'lines' | 'keyvalue' | 'delimited'
interface Warning { key: string; count?: number }

interface LinesResult {
  mode: 'lines'
  /** Kept input values in input order, after empty-line and duplicate handling. */
  values: string[]
  data: unknown[]
  warnings: Warning[]
}
interface KeyValueResult {
  mode: 'keyvalue'
  /** Final object entries: duplicate keys keep the position of first appearance. */
  entries: { key: string; value: unknown }[]
  data: Record<string, unknown>
  warnings: Warning[]
}
interface DelimitedResult {
  mode: 'delimited'
  headers: string[]
  allRows: string[][]
  /** First PREVIEW_ROW_LIMIT data rows. */
  rows: string[][]
  totalRows: number
  raggedRows: number[]
  usableHeaders: number
  data: Record<string, unknown>[]
  warnings: Warning[]
}
type ParseResult = LinesResult | KeyValueResult | DelimitedResult

const EMPTY_LINES: LinesResult = { mode: 'lines', values: [], data: [], warnings: [] }
const EMPTY_KEY_VALUE: KeyValueResult = { mode: 'keyvalue', entries: [], data: {}, warnings: [] }
const EMPTY_DELIMITED: DelimitedResult = {
  mode: 'delimited', headers: [], allRows: [], rows: [], totalRows: 0,
  raggedRows: [], usableHeaders: 0, data: [], warnings: [],
}

const inputText = ref('')
const inboxApplied = ref(false)
const mode = ref<ParseMode>('lines')
const delimiter = ref('auto')
const hasHeader = ref(true)
const kvSeparator = ref(':')
const typeInference = ref(false)
const emptyAsNull = ref(false)
const trimValues = ref(true)
const skipEmpty = ref(true)
const unique = ref(false)
const indent = ref(2)
const outputJson = ref('')
const parsedOutputData = ref<unknown>(null)
const error = ref('')
const fullscreen = ref(false)
const outputViewMode = ref<'text' | 'rich' | 'table'>('rich')
const inputEditorRef = ref()

const valueOptions = computed<ValueConvertOptions>(() => ({
  trimValues: trimValues.value,
  typeInference: typeInference.value,
  emptyAsNull: emptyAsNull.value,
}))

const resolvedDelimiter = computed(() =>
  delimiter.value === 'auto' ? detectDelimiter(inputText.value) : delimiter.value
)
const delimiterLabel = computed(() => (resolvedDelimiter.value === '\t' ? '\\t' : resolvedDelimiter.value))

function parseLines(text: string): LinesResult {
  const kept: string[] = []
  for (const line of text.split(/\r?\n/)) {
    const value = trimValues.value ? line.trim() : line
    if (value === '' && skipEmpty.value) continue
    kept.push(value)
  }

  // Stable dedupe: the first occurrence keeps its position, later ones are dropped.
  let values = kept
  if (unique.value) {
    const seen = new Set<string>()
    values = []
    for (const v of kept) {
      if (seen.has(v)) continue
      seen.add(v)
      values.push(v)
    }
  }

  return {
    mode: 'lines',
    values,
    data: values.map(v => convertValue(v, valueOptions.value)),
    warnings: [],
  }
}

function parseKeyValue(text: string): KeyValueResult {
  const warnings: Warning[] = []
  const record: Record<string, unknown> = {}
  const seen = new Set<string>()
  let skippedNoSeparator = 0
  let skippedEmptyKey = 0
  let duplicateCount = 0

  for (const line of text.split(/\r?\n/)) {
    const raw = trimValues.value ? line.trim() : line
    if (raw === '' && skipEmpty.value) continue

    // Split at the first separator only, so `url: https://example.com/a:b`
    // keeps the full URL as its value.
    const at = raw.indexOf(kvSeparator.value)
    if (at === -1) { skippedNoSeparator++; continue }

    let key = raw.slice(0, at)
    let valueRaw = raw.slice(at + 1)
    if (trimValues.value) { key = key.trim(); valueRaw = valueRaw.trim() }
    if (key === '') { skippedEmptyKey++; continue }

    if (seen.has(key)) duplicateCount++
    else seen.add(key)
    // Keep the last value; the key keeps the position of its first appearance.
    record[key] = convertValue(valueRaw, valueOptions.value)
  }

  if (skippedNoSeparator > 0) warnings.push({ key: 'warning_skipped_lines', count: skippedNoSeparator })
  if (skippedEmptyKey > 0) warnings.push({ key: 'warning_empty_keys', count: skippedEmptyKey })
  if (duplicateCount > 0) warnings.push({ key: 'warning_duplicate_keys', count: duplicateCount })

  return {
    mode: 'keyvalue',
    entries: Object.keys(record).map(k => ({ key: k, value: record[k] })),
    data: record,
    warnings,
  }
}

function parseDelimited(text: string): DelimitedResult {
  const rows = parseCsv(text, resolvedDelimiter.value)
  if (rows.length === 0) return EMPTY_DELIMITED

  const { headers, dataRows, usableHeaders } = splitHeaderRow(rows, {
    hasHeader: hasHeader.value,
    trim: trimValues.value,
  })

  const raggedRows: number[] = []
  dataRows.forEach((row, i) => {
    if (row.length !== headers.length) raggedRows.push(i)
  })

  const warnings: Warning[] = []
  if (raggedRows.length > 0) warnings.push({ key: 'error_inconsistent_columns' })

  const data = dataRows.map(row => {
    const obj: Record<string, unknown> = {}
    headers.forEach((h, i) => {
      obj[h] = convertValue(row[i] ?? '', valueOptions.value)
    })
    return obj
  })

  return {
    mode: 'delimited',
    headers,
    allRows: dataRows,
    rows: dataRows.slice(0, PREVIEW_ROW_LIMIT),
    totalRows: dataRows.length,
    raggedRows,
    usableHeaders,
    data,
    warnings,
  }
}

const result = computed<ParseResult>(() => {
  if (!inputText.value.trim()) {
    return mode.value === 'lines' ? EMPTY_LINES
      : mode.value === 'keyvalue' ? EMPTY_KEY_VALUE
      : EMPTY_DELIMITED
  }
  if (mode.value === 'lines') return parseLines(inputText.value)
  if (mode.value === 'keyvalue') return parseKeyValue(inputText.value)
  return parseDelimited(inputText.value)
})

// Narrowed views for the template (one per mode).
const linesResult = computed<LinesResult>(() =>
  result.value.mode === 'lines' ? result.value : EMPTY_LINES)
const keyValueResult = computed<KeyValueResult>(() =>
  result.value.mode === 'keyvalue' ? result.value : EMPTY_KEY_VALUE)
const delimitedResult = computed<DelimitedResult>(() =>
  result.value.mode === 'delimited' ? result.value : EMPTY_DELIMITED)

const hasPreview = computed(() => {
  if (result.value.mode === 'lines') return result.value.values.length > 0
  if (result.value.mode === 'keyvalue') return result.value.entries.length > 0
  return result.value.headers.length > 0
})

const previewTotal = computed(() => {
  if (result.value.mode === 'lines') return result.value.values.length
  if (result.value.mode === 'keyvalue') return result.value.entries.length
  return result.value.totalRows
})
const previewShown = computed(() => Math.min(previewTotal.value, PREVIEW_ROW_LIMIT))

/** Fill `{key}` placeholders from the page copy. */
const fill = (template: string | undefined, values: Record<string, number> = {}): string => {
  if (!template) return ''
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ''))
}

const warningTexts = computed(() =>
  result.value.warnings.map(w => fill(ui.value[w.key], w.count != null ? { count: w.count } : {}))
)

const showingLabel = computed(() => {
  // Fallback is numbers only, so it stays language-neutral.
  return fill(ui.value.preview_showing, { shown: previewShown.value, total: previewTotal.value })
    || `${previewShown.value} / ${previewTotal.value}`
})

function displayCell(value: string): string {
  return value === '' ? '∅' : value
}

function displayValue(value: unknown): string {
  if (value === null) return 'null'
  if (typeof value === 'string') return displayCell(value)
  return String(value)
}

const convert = (silent = false) => {
  error.value = ''
  outputJson.value = ''
  parsedOutputData.value = null

  if (!inputText.value.trim()) {
    error.value = ui.value.error_empty_input
    if (!silent) toast.error(error.value)
    return
  }

  const parsed = result.value
  if (parsed.mode === 'lines' && parsed.values.length === 0) {
    error.value = ui.value.error_no_lines
    if (!silent) toast.error(error.value)
    return
  }
  if (parsed.mode === 'keyvalue' && parsed.entries.length === 0) {
    error.value = ui.value.error_no_pairs
    if (!silent) toast.error(error.value)
    return
  }
  if (parsed.mode === 'delimited') {
    if (parsed.headers.length === 0) {
      error.value = ui.value.error_empty_input
      if (!silent) toast.error(error.value)
      return
    }
    if (hasHeader.value && parsed.usableHeaders === 0) {
      error.value = ui.value.error_no_headers
      if (!silent) toast.error(error.value)
      return
    }
  }

  parsedOutputData.value = parsed.data
  outputJson.value = JSON.stringify(parsed.data, null, indent.value)

  if (!silent) {
    if (parsed.warnings.length > 0) toast.warning(warningTexts.value[0])
    else toast.success(t('toast.converted'))
  }
}

const clearAll = () => {
  outputJson.value = ''
  parsedOutputData.value = null
  error.value = ''
}

// Keep the selected mode in sync with the loaded example so the preview matches.
const { examples } = useToolExample('txt-to-json')
const onExampleLoaded = (text: string) => {
  const id = examples.value.find(e => e.input === text)?.id
  if (id === 'lines' || id === 'keyvalue' || id === 'delimited') mode.value = id
}

const debouncedConvert = useDebounceFn(() => convert(true), 300)
watch(inputText, () => debouncedConvert())
watch(
  [mode, delimiter, hasHeader, kvSeparator, typeInference, emptyAsNull, trimValues, skipEmpty, unique],
  () => { if (inputText.value.trim()) convert(true) },
)
// Indent only affects formatting, so re-render an existing result.
watch(indent, () => {
  if (parsedOutputData.value !== null) {
    outputJson.value = JSON.stringify(parsedOutputData.value, null, indent.value)
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
