<template>
  <ResizablePanel v-model:fullscreen="fullscreen" :initial-ratio="0.4" responsive>
    <template #first>
      <div class="h-full pr-3 overflow-hidden">
        <JsonInputEditor
          ref="inputEditorRef"
          v-model="inputJson"
          :label="ui.label_input"
          placeholder='[{"name": "Alice", "age": 30}, {"name": "Bob", "age": 25}]'
          show-upload
          :example-slug="tool.slug"
          @clear="clearAll"
          @paste="onPaste"
          @example-loaded="onExampleLoaded"
        />
      </div>
    </template>

    <template #second>
      <div class="h-full pl-3 flex flex-col overflow-hidden">
        <!-- Table header bar -->
        <div class="flex items-center justify-between mb-2 gap-3">
          <label class="text-sm font-bold text-surface-700 dark:text-surface-300">{{ ui.label_output }}</label>
          <div v-if="headers.length > 0" class="flex items-center gap-2">
            <!-- Table / HTML view switch (only when the page provides both labels) -->
            <div v-if="ui.view_preview && ui.view_html" class="flex items-center overflow-hidden rounded-lg border border-surface-200 dark:border-surface-700">
              <button
                @click="htmlMode = false"
                class="px-2 py-0.5 text-xs transition-colors"
                :class="!htmlMode ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400' : 'text-surface-500 dark:text-surface-400'"
              >{{ ui.view_preview }}</button>
              <button
                @click="htmlMode = true"
                class="px-2 py-0.5 text-xs transition-colors"
                :class="htmlMode ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400' : 'text-surface-500 dark:text-surface-400'"
              >{{ ui.view_html }}</button>
            </div>
            <button v-if="ui.btn_copy_html" @click="copyHtml" class="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400">
              {{ ui.btn_copy_html }}
            </button>
            <button v-if="ui.btn_download_html" @click="downloadHtml" class="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400">
              {{ ui.btn_download_html }}
            </button>
            <button v-if="ui.btn_download_csv" @click="downloadCsv" class="text-xs text-surface-500 hover:text-surface-700 dark:text-surface-400">
              {{ ui.btn_download_csv }}
            </button>
          </div>
        </div>

        <!-- Generated HTML source (only on pages that provide the HTML view labels) -->
        <pre
          v-if="htmlMode && headers.length > 0"
          class="flex-1 min-h-0 overflow-auto rounded-xl border border-surface-200 bg-white p-3 font-mono text-xs whitespace-pre text-surface-900 dark:border-surface-700 dark:bg-surface-900 dark:text-surface-100"
        >{{ htmlCode }}</pre>

        <!-- Table content -->
        <div v-else class="flex-1 min-h-0 overflow-auto rounded-xl border border-surface-200 bg-white dark:border-surface-700 dark:bg-surface-900">
          <table v-if="headers.length > 0" class="w-full text-sm">
            <thead class="sticky top-0 z-10">
              <tr class="bg-surface-50 dark:bg-surface-800">
                <th v-for="header in headers" :key="header" class="px-4 py-3 text-left font-bold text-surface-700 dark:text-surface-300 border-b border-surface-200 dark:border-surface-700 whitespace-nowrap">{{ header }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, ri) in previewRows" :key="ri" class="border-b border-surface-100 dark:border-surface-800 last:border-0 hover:bg-surface-50 dark:hover:bg-surface-800">
                <td v-for="(_, ci) in headers" :key="ci" class="px-4 py-3 text-surface-900 dark:text-surface-100 whitespace-nowrap">{{ formatCell(row[ci]) }}</td>
              </tr>
            </tbody>
          </table>
          <div v-else-if="error" class="p-3 text-xs text-red-700 dark:text-red-400">{{ error }}</div>
          <div v-else class="flex h-full items-center justify-center text-surface-400 dark:text-surface-500 text-sm">
            {{ ui.empty_state }}
          </div>
        </div>

        <!-- Stats (outside scrollable area) -->
        <div v-if="headers.length > 0" class="mt-2 flex flex-wrap items-center gap-3 shrink-0">
          <div class="stat-chip"><Icon name="lucide:rows" class="h-3 w-3" /> {{ rowsLabel }}</div>
          <div class="stat-chip"><Icon name="lucide:columns" class="h-3 w-3" /> {{ columnsLabel }}</div>
          <span v-if="previewNote" class="text-[10px] text-surface-400 dark:text-surface-500">{{ previewNote }}</span>
        </div>
      </div>
    </template>

    <template #toolbar-left>
      <button @click="renderTable" class="btn-primary px-5 py-2 text-xs">
        <Icon name="lucide:table" class="h-4 w-4 mr-1.5" />
        {{ ui.btn_render }}
      </button>
      <label class="flex items-center gap-1.5 cursor-pointer select-none">
        <input type="checkbox" v-model="flattenNested" class="w-3.5 h-3.5 rounded border-surface-300 text-primary-600 focus:ring-primary-500" />
        <span class="text-xs text-surface-600 dark:text-surface-400">{{ ui.option_flatten }}</span>
      </label>
    </template>
  </ResizablePanel>
</template>

<script setup lang="ts">
import { copyToClipboard, downloadFile } from '~/utils'

const props = defineProps<{ tool: any }>()
const { t } = useI18n()
const toast = useToast()

// Every visible string comes from the page's ui block. No English fallbacks:
// a missing key renders as an empty label instead of leaking English into zh.
const ui = computed<Record<string, string>>(() => props.tool?.ui ?? {})

/** Rows rendered in the preview. Exports always use every parsed row. */
const PREVIEW_ROW_LIMIT = 100

const inputJson = ref('')
onMounted(() => {
  const text = useJsonInbox().consumeInbox()
  if (text != null) inputJson.value = text
})
const error = ref('')
const headers = ref<string[]>([])
const sourceRows = ref<Record<string, any>[]>([])
const previewRows = ref<any[][]>([])
const flattenNested = ref(false)
const fullscreen = ref(false)
const htmlMode = ref(false)

const inputEditorRef = ref<InstanceType<typeof import('~/components/tool/JsonInputEditor.vue').default>>()

const { flatten } = useJsonFlatten()
const { toTableData } = useTablePreview()
const { generateCsv, addUtf8Bom } = useExcelCompat()

// ── Localized labels with {count} placeholders ────────────────
const fill = (template: string | undefined, values: Record<string, number> = {}): string => {
  if (!template) return ''
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ''))
}
const rowsLabel = computed(() => fill(ui.value.status_rows, { count: sourceRows.value.length }))
const columnsLabel = computed(() => fill(ui.value.status_columns, { count: headers.value.length }))
const previewNote = computed(() =>
  sourceRows.value.length > PREVIEW_ROW_LIMIT
    ? fill(ui.value.preview_limit, { count: PREVIEW_ROW_LIMIT })
    : '',
)

// Auto-format input in-place (debounced 1.5s after user stops typing)
const formatInputInPlace = () => {
  if (!inputJson.value.trim()) return
  try {
    const parsed = JSON.parse(inputJson.value)
    inputJson.value = JSON.stringify(parsed, null, 2)
  } catch {}
}
const debouncedFormatInPlace = useDebounceFn(() => { formatInputInPlace() }, 1500)

// Auto-render on input change (debounced 300ms)
const debouncedRender = useDebounceFn(() => { renderTable(true) }, 300)
watch(inputJson, () => {
  debouncedRender()
  debouncedFormatInPlace()
})

// Re-render when flatten option changes
watch(flattenNested, () => {
  if (inputJson.value.trim()) renderTable()
})

const onExampleLoaded = () => {
  nextTick(() => renderTable())
}

const onPaste = () => {
  nextTick(() => {
    formatInputInPlace()
    renderTable()
  })
}

const formatCell = (value: any): string => {
  if (value === null || value === undefined) return ''
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

const isPlainObject = (value: unknown): boolean =>
  value !== null && typeof value === 'object' && !Array.isArray(value)

const fail = (message: string | undefined, silent: boolean) => {
  error.value = message ?? ''
  headers.value = []
  sourceRows.value = []
  previewRows.value = []
  if (!silent && error.value) toast.error(error.value)
}

const renderTable = (silent = false) => {
  error.value = ''; headers.value = []; sourceRows.value = []; previewRows.value = []
  if (!inputJson.value.trim()) return
  try {
    let data = JSON.parse(inputJson.value)
    if (!Array.isArray(data)) { fail(ui.value.error_invalid_input, silent); return }
    if (data.length === 0) { fail(ui.value.error_empty_array, silent); return }
    if (!data.every(isPlainObject)) { fail(ui.value.error_invalid_row, silent); return }
    if (flattenNested.value) data = data.map(item => flatten(item))
    const tableData = toTableData(data, PREVIEW_ROW_LIMIT)
    if (tableData.headers.length === 0) { fail(ui.value.error_no_columns, silent); return }
    sourceRows.value = data
    headers.value = tableData.headers
    previewRows.value = tableData.rows
    if (!silent) toast.success(t('toast.converted'))
  } catch (e) { error.value = ui.value.error_invalid_json || (e as Error).message; if (!silent) toast.error(ui.value.error_invalid_json || (e as Error).message) }
}

// ── HTML generation ───────────────────────────────────────────
/** Escape the five characters that are meaningful inside HTML text nodes. */
const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

/** All rows (preview cap does not apply to exports). */
const exportRows = (): any[][] => toTableData(sourceRows.value, sourceRows.value.length).rows

const buildHtmlTable = (rows: any[][]): string => {
  const lines: string[] = ['<table class="json-table">', '  <thead>', '    <tr>']
  headers.value.forEach(h => { lines.push(`      <th>${escapeHtml(String(h))}</th>`) })
  lines.push('    </tr>', '  </thead>', '  <tbody>')
  rows.forEach(row => {
    lines.push('    <tr>')
    headers.value.forEach((_, ci) => { lines.push(`      <td>${escapeHtml(formatCell(row[ci]))}</td>`) })
    lines.push('    </tr>')
  })
  lines.push('  </tbody>', '</table>')
  return lines.join('\n')
}

const htmlCode = computed(() => (headers.value.length > 0 ? buildHtmlTable(exportRows()) : ''))

const htmlDocument = (): string => [
  '<!DOCTYPE html>',
  '<html lang="en">',
  '<head>',
  '<meta charset="utf-8">',
  '<title>JSON Table</title>',
  '<style>',
  '.json-table { border-collapse: collapse; font-family: system-ui, sans-serif; font-size: 14px; }',
  '.json-table th, .json-table td { border: 1px solid #d4d4d8; padding: 6px 10px; text-align: left; }',
  '.json-table th { background: #f4f4f5; }',
  '</style>',
  '</head>',
  '<body>',
  htmlCode.value,
  '</body>',
  '</html>',
].join('\n')

const copyHtml = async () => {
  const ok = await copyToClipboard(htmlCode.value)
  if (ok) toast.success(t('toast.copied'))
}

const downloadHtml = () => {
  downloadFile(htmlDocument(), 'json-table.html', 'text/html;charset=utf-8')
}

const downloadCsv = () => {
  const csv = generateCsv(headers.value, exportRows())
  downloadFile(addUtf8Bom(csv), 'table-data.csv', 'text/csv;charset=utf-8')
}

const clearAll = () => {
  error.value = ''; headers.value = []; sourceRows.value = []; previewRows.value = []
}
</script>
