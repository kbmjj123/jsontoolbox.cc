<template>
  <ResizablePanel v-model:fullscreen="fullscreen" :initial-ratio="0.4" responsive>
    <template #first>
      <div class="h-full pr-3 overflow-hidden">
        <JsonInputEditor
          ref="inputEditorRef"
          v-model="inputJson"
          :label="tool.ui?.label_input || 'Input JSON'"
          placeholder='[{"name": "Alice", "age": 30}, {"name": "Bob", "age": 25}]'
          show-upload
          show-load-url
          example-slug="json-to-table"
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
          <label class="text-sm font-bold text-surface-700 dark:text-surface-300">{{ tool.ui?.label_output || 'Table Preview' }}</label>
          <div v-if="rows.length > 0" class="flex items-center gap-2">
            <button @click="copyHtml" class="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400">
              {{ tool.ui?.btnCopyHtml ?? 'Copy HTML' }}
            </button>
            <button @click="downloadCsv" class="text-xs text-surface-500 hover:text-surface-700 dark:text-surface-400">
              {{ tool.ui?.btnDownloadCsv ?? 'CSV' }}
            </button>
          </div>
        </div>

        <!-- Table content -->
        <div class="flex-1 min-h-0 overflow-auto rounded-xl border border-surface-200 bg-white dark:border-surface-700 dark:bg-surface-900">
          <table v-if="headers.length > 0" class="w-full text-sm">
            <thead class="sticky top-0 z-10">
              <tr class="bg-surface-50 dark:bg-surface-800">
                <th v-for="header in headers" :key="header" class="px-4 py-3 text-left font-bold text-surface-700 dark:text-surface-300 border-b border-surface-200 dark:border-surface-700 whitespace-nowrap">{{ header }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, ri) in rows" :key="ri" class="border-b border-surface-100 dark:border-surface-800 last:border-0 hover:bg-surface-50 dark:hover:bg-surface-800">
                <td v-for="(_, ci) in headers" :key="ci" class="px-4 py-3 text-surface-900 dark:text-surface-100 whitespace-nowrap">{{ formatCell(row[ci]) }}</td>
              </tr>
            </tbody>
          </table>
          <div v-else-if="error" class="p-3 text-xs text-red-700 dark:text-red-400">{{ error }}</div>
          <div v-else class="flex h-full items-center justify-center text-surface-400 dark:text-surface-500 text-sm">
            {{ tool.ui?.emptyState ?? 'Paste a JSON array to preview as table' }}
          </div>
        </div>

        <!-- Stats (outside scrollable area) -->
        <div v-if="rows.length > 0" class="mt-2 flex flex-wrap gap-3 shrink-0">
          <div class="stat-chip"><Icon name="lucide:rows" class="h-3 w-3" /> {{ rows.length }} rows</div>
          <div class="stat-chip"><Icon name="lucide:columns" class="h-3 w-3" /> {{ headers.length }} columns</div>
        </div>
      </div>
    </template>

    <template #toolbar-left>
      <button @click="renderTable" class="btn-primary px-5 py-2 text-xs">
        <Icon name="lucide:table" class="h-4 w-4 mr-1.5" />
        {{ tool.ui?.btnRender ?? 'Render Table' }}
      </button>
      <label class="flex items-center gap-1.5 cursor-pointer select-none">
        <input type="checkbox" v-model="flattenNested" class="w-3.5 h-3.5 rounded border-surface-300 text-primary-600 focus:ring-primary-500" />
        <span class="text-xs text-surface-600 dark:text-surface-400">{{ tool.ui?.option_flatten ?? 'Flatten' }}</span>
      </label>
    </template>
  </ResizablePanel>
</template>

<script setup lang="ts">
const props = defineProps<{ tool: any }>()

const ui = computed(() => props.tool?.ui)

const inputJson = ref('')
const error = ref('')
const headers = ref<string[]>([])
const rows = ref<any[]>([])
const flattenNested = ref(false)
const fullscreen = ref(false)

const inputEditorRef = ref<InstanceType<typeof import('~/components/tool/JsonInputEditor.vue').default>>()

const { flatten } = useJsonFlatten()
const { toTableData } = useTablePreview()
const { exportToCsv } = useExcelCompat()

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
const debouncedRender = useDebounceFn(() => { renderTable() }, 300)
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

const renderTable = () => {
  error.value = ''; headers.value = []; rows.value = []
  if (!inputJson.value.trim()) return
  try {
    let data = JSON.parse(inputJson.value)
    if (!Array.isArray(data)) { error.value = ui.value?.errorInvalidInput ?? 'Input must be a JSON array'; return }
    if (data.length === 0) { error.value = ui.value?.errorEmptyArray ?? 'Array is empty'; return }
    if (flattenNested.value) data = data.map(item => flatten(item))
    const tableData = toTableData(data)
    headers.value = tableData.headers; rows.value = tableData.rows
  } catch (e) { error.value = (e as Error).message }
}

const generateHtmlTable = (): string => {
  let html = '<table border="1" cellpadding="5" cellspacing="0">\n<thead>\n<tr>\n'
  headers.value.forEach(h => { html += `  <th>${h}</th>\n` })
  html += '</tr>\n</thead>\n<tbody>\n'
  rows.value.forEach(row => {
    html += '<tr>\n'
    headers.value.forEach(h => { html += `  <td>${formatCell(row[h])}</td>\n` })
    html += '</tr>\n'
  })
  html += '</tbody>\n</table>'
  return html
}

const copyHtml = async () => {
  await copyToClipboard(generateHtmlTable())
}

const downloadCsv = () => {
  const csvData = rows.value.map(row => {
    const csvRow: Record<string, any> = {}
    headers.value.forEach(h => { csvRow[h] = row[h] })
    return csvRow
  })
  exportToCsv(csvData, headers.value, 'table-data.csv')
}

const clearAll = () => {
  error.value = ''; headers.value = []; rows.value = []
}
</script>
