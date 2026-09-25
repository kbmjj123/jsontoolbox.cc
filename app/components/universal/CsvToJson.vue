<template>
  <ResizablePanel v-model:fullscreen="fullscreen" :initial-ratio="0.5" responsive>
    <template #first>
      <div class="h-full pr-3 flex flex-col">
        <JsonInputEditor
          ref="inputEditorRef"
          v-model="inputCsv"
          :label="props.tool.ui?.label_input"
          placeholder="name,age,city&#10;Alice,30,New York"
          accept=".csv,.tsv,.txt"
          show-upload
          example-slug="csv-to-json"
          :tool="props.tool"
          class="flex-1 min-h-0"
          @clear="clearAll"
          @example-loaded="clearAll"
        />

        <!-- Parsed rows preview: live, independent from Convert -->
        <div class="mt-3 flex max-h-52 shrink-0 flex-col overflow-hidden rounded-xl border border-surface-200 bg-white text-xs dark:border-surface-700 dark:bg-surface-900 dark:text-surface-200">
          <div class="flex shrink-0 items-center gap-2 border-b border-surface-200 px-3 py-1.5 dark:border-surface-700">
            <Icon name="lucide:table-2" class="h-3.5 w-3.5 text-surface-400" />
            <span class="font-bold text-surface-700 dark:text-surface-300">{{ props.tool.ui?.preview_title }}</span>
            <span v-if="preview.headers.length" class="ml-auto flex items-center gap-3 text-surface-500 dark:text-surface-400">
              <span>{{ props.tool.ui?.preview_rows }} {{ preview.totalRows }}</span>
              <span>{{ props.tool.ui?.preview_columns }} {{ preview.headers.length }}</span>
              <span>{{ props.tool.ui?.option_delimiter }} {{ delimiterLabel }}</span>
            </span>
          </div>

          <div
            v-if="preview.inconsistent"
            class="shrink-0 bg-amber-50 px-3 py-1 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400"
          >
            {{ props.tool.ui?.error_inconsistent_columns }}
          </div>

          <div v-if="preview.headers.length" class="min-h-0 flex-1 overflow-auto">
            <table class="w-full border-collapse text-left">
              <thead class="sticky top-0 bg-surface-50 dark:bg-surface-800">
                <tr>
                  <th class="w-10 border-r border-surface-200 px-2 py-1 text-center font-medium text-surface-400 dark:border-surface-700 dark:text-surface-500">#</th>
                  <th
                    v-for="(h, i) in preview.headers"
                    :key="`h-${i}`"
                    class="whitespace-nowrap border-r border-surface-200 px-2 py-1 font-bold text-surface-700 dark:border-surface-700 dark:text-surface-300"
                  >{{ h }}</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(row, ri) in preview.rows"
                  :key="`r-${ri}`"
                  :class="preview.raggedRows.includes(ri) ? 'bg-amber-50 dark:bg-amber-900/20' : ''"
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
            {{ props.tool.ui?.preview_empty }}
          </div>

          <div
            v-if="preview.totalRows > preview.rows.length"
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
          :label="props.tool.ui?.label_output"
          :content="outputJson"
          :parsed-data="parsedOutputData"
          :error="error"
          :enable-tree-search="false"
          :highlight="'json'"
          :empty-text="props.tool.ui?.placeholder_output"
          download-filename="converted.json"
        />
      </div>
    </template>

    <template #toolbar-left>
      <button @click="convert" class="btn-primary px-5 py-2 text-xs">
        <Icon name="lucide:arrow-right" class="h-4 w-4 mr-1.5" />
        {{ props.tool.ui?.btn_convert }}
      </button>

      <div class="flex items-center gap-2">
        <label class="text-xs text-surface-600 dark:text-surface-400">{{ props.tool.ui?.option_delimiter }}</label>
        <select v-model="delimiter" class="rounded-lg border border-surface-200 bg-white px-2 py-1 text-xs dark:border-surface-700 dark:bg-surface-800">
          <option value="auto">{{ props.tool.ui?.option_auto_delimiter }}</option>
          <option value=",">{{ props.tool.ui?.option_delimiter_comma }}</option>
          <option value=";">{{ props.tool.ui?.option_delimiter_semicolon }}</option>
          <option value="	">{{ props.tool.ui?.option_delimiter_tab }}</option>
          <option value="|">{{ props.tool.ui?.option_delimiter_pipe }}</option>
        </select>
      </div>

      <label class="flex items-center gap-1.5 cursor-pointer select-none">
        <input type="checkbox" v-model="hasHeader" class="w-3.5 h-3.5 rounded border-surface-300 text-primary-600 focus:ring-primary-500" />
        <span class="text-xs text-surface-600 dark:text-surface-400">{{ props.tool.ui?.option_has_header }}</span>
      </label>

      <label class="flex items-center gap-1.5 cursor-pointer select-none">
        <input type="checkbox" v-model="typeInference" class="w-3.5 h-3.5 rounded border-surface-300 text-primary-600 focus:ring-primary-500" />
        <span class="text-xs text-surface-600 dark:text-surface-400">{{ props.tool.ui?.option_infer_types }}</span>
      </label>

      <label class="flex items-center gap-1.5 cursor-pointer select-none">
        <input type="checkbox" v-model="emptyAsNull" class="w-3.5 h-3.5 rounded border-surface-300 text-primary-600 focus:ring-primary-500" />
        <span class="text-xs text-surface-600 dark:text-surface-400">{{ props.tool.ui?.option_empty_as_null }}</span>
      </label>

      <label class="flex items-center gap-1.5 cursor-pointer select-none">
        <input type="checkbox" v-model="trimValues" class="w-3.5 h-3.5 rounded border-surface-300 text-primary-600 focus:ring-primary-500" />
        <span class="text-xs text-surface-600 dark:text-surface-400">{{ props.tool.ui?.option_trim_values }}</span>
      </label>

      <div class="flex items-center gap-2">
        <label class="text-xs text-surface-600 dark:text-surface-400">{{ props.tool.ui?.option_indent }}</label>
        <select v-model.number="indent" class="rounded-lg border border-surface-200 bg-white px-2 py-1 text-xs dark:border-surface-700 dark:bg-surface-800">
          <option :value="2">{{ props.tool.ui?.option_indent_2 }}</option>
          <option :value="4">{{ props.tool.ui?.option_indent_4 }}</option>
        </select>
      </div>
    </template>
  </ResizablePanel>
</template>

<script setup lang="ts">
/** Number of parsed rows rendered in the preview table (stated in the page copy). */
const PREVIEW_ROW_LIMIT = 10

const props = defineProps<{ tool: any }>()
const { t } = useI18n()
const toast = useToast()

const inputCsv = ref('')
onMounted(() => {
  const text = useJsonInbox().consumeInbox()
  if (text != null) inputCsv.value = text
})
const outputJson = ref('')
const parsedOutputData = ref<unknown>(null)
const error = ref('')
const delimiter = ref('auto')
const hasHeader = ref(true)
const typeInference = ref(false)
const emptyAsNull = ref(false)
const trimValues = ref(true)
const indent = ref(2)
const fullscreen = ref(false)
const outputViewMode = ref<'text' | 'rich' | 'table'>('rich')
const inputEditorRef = ref()

interface ParsedTable {
  headers: string[]
  /** Every parsed data row (used for conversion). */
  allRows: string[][]
  /** First PREVIEW_ROW_LIMIT data rows (used for the preview). */
  rows: string[][]
  totalRows: number
  /** Indexes (within `allRows`) whose column count differs from `headers`. */
  raggedRows: number[]
  inconsistent: boolean
  /** How many header cells came from the header row instead of being generated. */
  usableHeaders: number
}

const EMPTY_TABLE: ParsedTable = {
  headers: [],
  allRows: [],
  rows: [],
  totalRows: 0,
  raggedRows: [],
  inconsistent: false,
  usableHeaders: 0,
}

/** Count separators that are outside double-quoted sections. */
function countOutsideQuotes(line: string, sep: string): number {
  let count = 0
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') i++
        else inQuotes = false
      }
      continue
    }
    if (ch === '"') { inQuotes = true; continue }
    if (ch === sep) count++
  }
  return count
}

/**
 * Auto-detection is a convenience, not a guarantee: it scores each candidate by
 * how consistently it splits the first rows into the same number of columns.
 */
function detectDelimiter(text: string): string {
  const lines = text.split(/\r?\n/).filter(l => l.trim() !== '').slice(0, 5)
  let best = ','
  let bestScore = -Infinity
  for (const sep of [',', ';', '\t', '|']) {
    const counts = lines.map(l => countOutsideQuotes(l, sep) + 1)
    if (counts.length === 0) continue
    const first = counts[0]
    const consistent = counts.filter(c => c === first).length
    const score = consistent * 1000 + Math.min(first, 50)
    if (score > bestScore) { bestScore = score; best = sep }
  }
  return best
}

function parseCsv(text: string, sep: string): string[][] {
  const rows: string[][] = []
  let current: string[] = []
  let field = ''
  let inQuotes = false

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i++ }
        else inQuotes = false
      } else field += ch
    } else {
      if (ch === '"') inQuotes = true
      else if (ch === sep) { current.push(field); field = '' }
      else if (ch === '\n' || ch === '\r') {
        if (ch === '\r' && text[i + 1] === '\n') i++
        current.push(field); field = ''
        if (current.length > 0 && !(current.length === 1 && current[0] === '')) rows.push(current)
        current = []
      } else field += ch
    }
  }
  current.push(field)
  if (current.length > 0 && !(current.length === 1 && current[0] === '')) rows.push(current)
  return rows
}

const resolvedDelimiter = computed(() =>
  delimiter.value === 'auto' ? detectDelimiter(inputCsv.value) : delimiter.value
)

const delimiterLabel = computed(() => (resolvedDelimiter.value === '\t' ? '\\t' : resolvedDelimiter.value))

const parsedTable = computed<ParsedTable>(() => {
  if (!inputCsv.value.trim()) return EMPTY_TABLE

  const rows = parseCsv(inputCsv.value, resolvedDelimiter.value)
  if (rows.length === 0) return EMPTY_TABLE

  let headers: string[]
  let allRows: string[][]

  if (hasHeader.value) {
    headers = rows[0].map(h => (trimValues.value ? h.trim() : h))
    allRows = rows.slice(1)
  } else {
    headers = rows[0].map((_, i) => `column_${i + 1}`)
    allRows = rows
  }

  let usableHeaders = hasHeader.value ? 0 : headers.length
  if (hasHeader.value) {
    headers = headers.map((h, i) => {
      if (h !== '') { usableHeaders++; return h }
      return `column_${i + 1}`
    })
  }

  const columnCount = headers.length

  const raggedRows: number[] = []
  allRows.forEach((row, i) => {
    if (row.length !== columnCount) raggedRows.push(i)
  })

  return {
    headers,
    allRows,
    rows: allRows.slice(0, PREVIEW_ROW_LIMIT),
    totalRows: allRows.length,
    raggedRows,
    inconsistent: raggedRows.length > 0,
    usableHeaders,
  }
})

const preview = computed(() => parsedTable.value)

function displayCell(value: string): string {
  return value === '' ? '∅' : value
}

const showingLabel = computed(() => {
  const template = props.tool.ui?.preview_showing
  const shown = String(preview.value.rows.length)
  const total = String(preview.value.totalRows)
  // Fallback is numbers only, so it stays language-neutral.
  return template ? template.replace('{shown}', shown).replace('{total}', total) : `${shown} / ${total}`
})

/** Value conversion for one cell: trim → empty policy → optional type inference. */
function convertValue(raw: string): unknown {
  const value = trimValues.value ? raw.trim() : raw
  if (value === '') return emptyAsNull.value ? null : ''
  if (!typeInference.value) return value
  if (value === 'true') return true
  if (value === 'false') return false
  if (/^-?\d+$/.test(value) || /^-?\d+\.\d+$/.test(value)) {
    const n = Number(value)
    if (!Number.isNaN(n)) return n
  }
  return value
}

const convert = () => {
  error.value = ''
  outputJson.value = ''
  parsedOutputData.value = null

  if (!inputCsv.value.trim()) {
    error.value = props.tool.ui?.error_no_data
    toast.error(error.value)
    return
  }

  try {
    const table = parsedTable.value
    if (table.headers.length === 0) {
      error.value = props.tool.ui?.error_no_data
      toast.error(error.value)
      return
    }
    if (hasHeader.value && table.usableHeaders === 0) {
      error.value = props.tool.ui?.error_no_headers
      toast.error(error.value)
      return
    }
    if (table.inconsistent) {
      error.value = props.tool.ui?.error_inconsistent_columns
      toast.error(error.value)
      return
    }

    const result = table.allRows.map(row => {
      const obj: Record<string, unknown> = {}
      table.headers.forEach((h, i) => {
        obj[h] = convertValue(row[i] ?? '')
      })
      return obj
    })

    parsedOutputData.value = result
    outputJson.value = JSON.stringify(result, null, indent.value)
    toast.success(t('toast.converted'))
  } catch {
    error.value = props.tool.ui?.error_parse
    toast.error(error.value)
  }
}

const clearAll = () => {
  outputJson.value = ''
  parsedOutputData.value = null
  error.value = ''
}

// Indent only affects formatting, so re-render an existing result.
watch(indent, () => {
  if (parsedOutputData.value !== null) {
    outputJson.value = JSON.stringify(parsedOutputData.value, null, indent.value)
  }
})

onMounted(() => {
  inputEditorRef.value?.loadDefaultExample()
})
</script>
