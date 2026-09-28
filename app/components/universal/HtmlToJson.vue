<template>
  <ResizablePanel v-model:fullscreen="fullscreen" :initial-ratio="0.5" responsive>
    <template #first>
      <div class="h-full pr-3 flex flex-col">
        <JsonInputEditor
          ref="inputEditorRef"
          v-model="inputHtml"
          :label="ui.label_input"
          :placeholder="ui.placeholder_input"
          accept=".html,.htm,.txt"
          show-upload
          example-slug="html-to-json"
          class="flex-1 min-h-0"
          @clear="clearAll"
        />

        <!-- Table preview: live, independent from Convert -->
        <div class="mt-3 flex max-h-52 shrink-0 flex-col overflow-hidden rounded-xl border border-surface-200 bg-white text-xs dark:border-surface-700 dark:bg-surface-900 dark:text-surface-200">
          <div class="flex shrink-0 items-center gap-2 border-b border-surface-200 px-3 py-1.5 dark:border-surface-700">
            <Icon name="lucide:table-2" class="h-3.5 w-3.5 text-surface-400" />
            <span class="font-bold text-surface-700 dark:text-surface-300">{{ ui.label_preview }}</span>
            <span v-if="tableCount > 0" class="ml-auto flex items-center gap-3 text-surface-500 dark:text-surface-400">
              <span>{{ ui.label_tables }} {{ tableCount }}</span>
              <span>{{ ui.label_rows }} {{ tableData.totalRows }}</span>
              <span>{{ ui.label_columns }} {{ tableData.headers.length }}</span>
            </span>
          </div>

          <div
            v-for="(w, wi) in warningTexts"
            :key="`w-${wi}`"
            class="shrink-0 bg-amber-50 px-3 py-1 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400"
          >
            <span class="font-bold">{{ ui.label_warnings }}</span> {{ w }}
          </div>

          <div v-if="tableData.headers.length > 0" class="min-h-0 flex-1 overflow-auto">
            <table class="w-full border-collapse text-left">
              <thead class="sticky top-0 bg-surface-50 dark:bg-surface-800">
                <tr>
                  <th class="w-10 border-r border-surface-200 px-2 py-1 text-center font-medium text-surface-400 dark:border-surface-700 dark:text-surface-500">#</th>
                  <th
                    v-for="(h, i) in tableData.headers"
                    :key="`h-${i}`"
                    class="whitespace-nowrap border-r border-surface-200 px-2 py-1 font-bold text-surface-700 dark:border-surface-700 dark:text-surface-300"
                  >{{ h }}</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(row, ri) in tableData.rows"
                  :key="`r-${ri}`"
                  :class="tableData.raggedRows.includes(ri) ? 'bg-amber-50 dark:bg-amber-900/20' : ''"
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
            {{ ui.placeholder_output }}
          </div>

          <div
            v-if="tableData.totalRows > tableData.rows.length"
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

      <div v-if="tableCount > 0" class="flex items-center gap-2">
        <label class="text-xs text-surface-600 dark:text-surface-400">{{ ui.label_table }}</label>
        <select v-model.number="tableIndex" class="rounded-lg border border-surface-200 bg-white px-2 py-1 text-xs dark:border-surface-700 dark:bg-surface-800">
          <option v-for="i in tableCount" :key="i" :value="i - 1">
            {{ fill(ui.option_table_index, { index: i }) }}
          </option>
        </select>
      </div>

      <div class="flex items-center gap-2">
        <label class="text-xs text-surface-600 dark:text-surface-400">{{ ui.option_header }}</label>
        <select v-model="headerMode" class="rounded-lg border border-surface-200 bg-white px-2 py-1 text-xs dark:border-surface-700 dark:bg-surface-800">
          <option value="detect">{{ ui.option_detect_header }}</option>
          <option value="firstRow">{{ ui.option_first_row_header }}</option>
          <option value="none">{{ ui.option_no_header }}</option>
        </select>
      </div>

      <label class="flex items-center gap-1.5 cursor-pointer select-none">
        <input type="checkbox" v-model="typeInference" class="w-3.5 h-3.5 rounded border-surface-300 text-primary-600 focus:ring-primary-500" />
        <span class="text-xs text-surface-600 dark:text-surface-400">{{ ui.option_infer_types }}</span>
      </label>

      <label class="flex items-center gap-1.5 cursor-pointer select-none">
        <input type="checkbox" v-model="emptyAsNull" class="w-3.5 h-3.5 rounded border-surface-300 text-primary-600 focus:ring-primary-500" />
        <span class="text-xs text-surface-600 dark:text-surface-400">{{ ui.option_empty_as_null }}</span>
      </label>

      <label class="flex items-center gap-1.5 cursor-pointer select-none">
        <input type="checkbox" v-model="trimText" class="w-3.5 h-3.5 rounded border-surface-300 text-primary-600 focus:ring-primary-500" />
        <span class="text-xs text-surface-600 dark:text-surface-400">{{ ui.option_trim_text }}</span>
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
import { convertValue } from '~/utils/csv'

/** Number of parsed rows rendered in the preview (stated in the page copy). */
const PREVIEW_ROW_LIMIT = 10

const props = defineProps<{ tool: any }>()
const { t } = useI18n()
const toast = useToast()

// Every visible string comes from the page's ui block. No English fallbacks:
// a missing key renders as an empty label instead of leaking English into zh.
const ui = computed<Record<string, string>>(() => props.tool?.ui ?? {})

type HeaderMode = 'detect' | 'firstRow' | 'none'
interface Warning { key: string }

interface TableData {
  headers: string[]
  /** Every data row, as raw cell text. */
  allRows: string[][]
  /** First PREVIEW_ROW_LIMIT data rows. */
  rows: string[][]
  totalRows: number
  raggedRows: number[]
  warnings: Warning[]
}

const EMPTY_TABLE: TableData = {
  headers: [], allRows: [], rows: [], totalRows: 0, raggedRows: [], warnings: [],
}

const inputHtml = ref('')
const inboxApplied = ref(false)
const tableIndex = ref(0)
const headerMode = ref<HeaderMode>('detect')
const typeInference = ref(false)
const emptyAsNull = ref(false)
const trimText = ref(true)
const indent = ref(2)
const outputJson = ref('')
const parsedOutputData = ref<unknown>(null)
const error = ref('')
const fullscreen = ref(false)
const outputViewMode = ref<'text' | 'rich' | 'table'>('rich')
const inputEditorRef = ref()

/** Fill `{key}` placeholders from the page copy. */
const fill = (template: string | undefined, values: Record<string, number> = {}): string => {
  if (!template) return ''
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ''))
}

/**
 * Direct children only: a table nested inside a cell has its own tr/td deeper
 * in the tree and must not be merged into the outer row.
 */
function rowCells(row: Element): Element[] {
  return Array.from(row.children).filter(el => {
    const tag = el.tagName.toLowerCase()
    return tag === 'th' || tag === 'td'
  })
}

function cellText(cell: Element): string {
  return cell.textContent ?? ''
}

const tableCount = computed(() => {
  if (!inputHtml.value.trim() || !inputHtml.value.includes('<')) return 0
  const doc = new DOMParser().parseFromString(inputHtml.value, 'text/html')
  return doc.querySelectorAll('table').length
})

const tableData = computed<TableData>(() => {
  if (tableCount.value === 0) return EMPTY_TABLE

  const doc = new DOMParser().parseFromString(inputHtml.value, 'text/html')
  const tables = Array.from(doc.querySelectorAll('table'))
  const table = tables[Math.min(tableIndex.value, tables.length - 1)]
  if (!table) return EMPTY_TABLE

  const warnings: Warning[] = []
  // Rows of a nested table belong to that nested table, not to this one.
  const allRows = Array.from(table.querySelectorAll('tr'))
    .filter(tr => tr.closest('table') === table)
  const grid = allRows.map(rowCells)

  // A cell that spans more than one position cannot be expanded in this
  // version, so the result is reported instead of silently misaligned.
  const hasSpan = allRows.some(row => rowCells(row).some(cell => {
    const colspan = Number(cell.getAttribute('colspan') || '1')
    const rowspan = Number(cell.getAttribute('rowspan') || '1')
    return colspan > 1 || rowspan > 1
  }))
  if (hasSpan) warnings.push({ key: 'warning_colspan' })

  // Header selection. `detect` prefers thead, then a leading row of th cells.
  let headerRow: Element[] | null = null
  let headerRowIndex = -1

  if (headerMode.value === 'firstRow' && grid.length > 0) {
    headerRow = grid[0]
    headerRowIndex = 0
  } else if (headerMode.value === 'detect') {
    if (table.tHead) {
      const headRows = Array.from(table.tHead.querySelectorAll('tr'))
      if (headRows.length > 1) warnings.push({ key: 'warning_multi_header' })
      if (headRows.length > 0) {
        headerRow = rowCells(headRows[0])
        // Locate it in the flat row list so it can be excluded from the data.
        headerRowIndex = allRows.findIndex(r => r === headRows[0])
      }
    }
    if (!headerRow && grid.length > 0) {
      const first = grid[0]
      if (first.length > 0 && first.every(c => c.tagName.toLowerCase() === 'th')) {
        headerRow = first
        headerRowIndex = 0
      }
    }
  }

  const dataGrid = headerRowIndex >= 0
    ? grid.filter((_, i) => i !== headerRowIndex)
    : grid

  const columnCount = dataGrid.reduce((max, row) => Math.max(max, row.length), headerRow?.length ?? 0)

  let headers: string[]
  let namingIssues = 0
  if (headerRow) {
    const seen = new Map<string, number>()
    headers = Array.from({ length: columnCount }, (_, i) => {
      const raw = headerRow![i] ? cellText(headerRow![i]) : ''
      const name = trimText.value ? raw.trim() : raw
      if (name === '') { namingIssues++; return `column_${i + 1}` }
      const times = seen.get(name) ?? 0
      seen.set(name, times + 1)
      if (times > 0) { namingIssues++; return `${name}_${times + 1}` }
      return name
    })
  } else {
    headers = Array.from({ length: columnCount }, (_, i) => `column_${i + 1}`)
  }
  if (namingIssues > 0) warnings.push({ key: 'warning_duplicate_headers' })

  const rawRows = dataGrid.map(row => Array.from({ length: columnCount }, (_, i) =>
    row[i] ? cellText(row[i]) : ''
  ))

  const ragged = dataGrid
    .map((row, i) => (row.length !== columnCount ? i : -1))
    .filter(i => i >= 0)
  // The header row itself counts: fewer header cells than data cells means
  // generated column names, which the reader has to know about.
  const headerShort = headerRow !== null && headerRow.length !== columnCount
  if (ragged.length > 0 || headerShort) warnings.push({ key: 'error_inconsistent_cells' })

  return {
    headers,
    allRows: rawRows,
    rows: rawRows.slice(0, PREVIEW_ROW_LIMIT),
    totalRows: rawRows.length,
    raggedRows: ragged,
    warnings,
  }
})

const warningTexts = computed(() => tableData.value.warnings.map(w => ui.value[w.key] ?? ''))

const showingLabel = computed(() => {
  const shown = String(tableData.value.rows.length)
  const total = String(tableData.value.totalRows)
  // Fallback is numbers only, so it stays language-neutral.
  return fill(ui.value.preview_showing, { shown: tableData.value.rows.length, total: tableData.value.totalRows })
    || `${shown} / ${total}`
})

function displayCell(value: string): string {
  return value === '' ? '∅' : value
}

const convert = (silent = false) => {
  error.value = ''
  outputJson.value = ''
  parsedOutputData.value = null

  if (!inputHtml.value.trim()) {
    error.value = ui.value.error_empty_input
    if (!silent) toast.error(error.value)
    return
  }
  if (!inputHtml.value.includes('<')) {
    error.value = ui.value.error_invalid_html
    if (!silent) toast.error(error.value)
    return
  }
  if (tableCount.value === 0) {
    error.value = ui.value.error_no_table
    if (!silent) toast.error(error.value)
    return
  }

  const data = tableData.value
  if (data.headers.length === 0) {
    error.value = ui.value.error_no_table
    if (!silent) toast.error(error.value)
    return
  }

  const result = data.allRows.map(row => {
    const obj: Record<string, unknown> = {}
    data.headers.forEach((h, i) => {
      obj[h] = convertValue(row[i] ?? '', {
        trimValues: trimText.value,
        typeInference: typeInference.value,
        emptyAsNull: emptyAsNull.value,
      })
    })
    return obj
  })

  parsedOutputData.value = result
  outputJson.value = JSON.stringify(result, null, indent.value)

  if (!silent) {
    if (data.warnings.length > 0) toast.warning(warningTexts.value[0])
    else toast.success(t('toast.converted'))
  }
}

const clearAll = () => {
  outputJson.value = ''
  parsedOutputData.value = null
  error.value = ''
}

const debouncedConvert = useDebounceFn(() => convert(true), 300)
watch(inputHtml, () => { tableIndex.value = 0; debouncedConvert() })
watch([tableIndex, headerMode, typeInference, emptyAsNull, trimText], () => {
  if (inputHtml.value.trim()) convert(true)
})
// Indent only affects formatting, so re-render an existing result.
watch(indent, () => {
  if (parsedOutputData.value !== null) {
    outputJson.value = JSON.stringify(parsedOutputData.value, null, indent.value)
  }
})

onMounted(() => {
  const text = useJsonInbox().consumeInbox()
  if (text != null) {
    inputHtml.value = text
    inboxApplied.value = true
  }
})
onMounted(() => {
  if (inboxApplied.value) return
  inputEditorRef.value?.loadDefaultExample()
})
</script>
