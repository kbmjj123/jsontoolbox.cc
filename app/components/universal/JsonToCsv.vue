<template>
  <ResizablePanel v-model:fullscreen="fullscreen" :initial-ratio="0.5" responsive>
    <template #first>
      <div class="h-full pr-3">
        <JsonInputEditor
          v-model="inputJson"
          :label="tool.ui?.label_input || 'Input JSON Array'"
          placeholder='[{"name": "Alice", "age": 30}, {"name": "Bob", "age": 25}]'
          :height="fullscreen ? 'h-full' : undefined"
          show-upload
          show-load-url
          @clear="clearAll"
        />
      </div>
    </template>
    <template #second>
      <div class="h-full pl-3">
        <JsonOutputPanel
          :label="tool.ui?.label_output || 'CSV Output'"
          :content="outputCsv"
          :error="error"
          :height="fullscreen ? 'h-full' : undefined"
          empty-text="Result will appear here"
          download-filename="converted.csv"
          :show-download="true"
          @copy="copyOutput"
          @download="downloadCsv"
        />
      </div>
    </template>

    <template #toolbar-left>
      <button @click="convert" class="btn-primary px-5 py-2 text-xs">
        <Icon name="lucide:arrow-right" class="h-4 w-4 mr-1.5" />
        {{ tool.ui?.btn_convert || 'Convert to CSV' }}
      </button>
      <button @click="clearAll" class="rounded-xl border border-surface-200 bg-white px-4 py-2 text-xs font-bold text-surface-700 hover:bg-surface-50 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-300 dark:hover:bg-surface-700">
        {{ $t('system.clearAll') }}
      </button>

      <label class="flex items-center gap-1.5 cursor-pointer select-none">
        <input type="checkbox" v-model="flattenNested" class="w-3.5 h-3.5 rounded border-surface-300 text-primary-600 focus:ring-primary-500" />
        <span class="text-xs text-surface-600 dark:text-surface-400">Flatten nested</span>
      </label>

      <div class="flex items-center gap-2">
        <label class="text-xs text-surface-600 dark:text-surface-400">Encoding:</label>
        <select v-model="encoding" class="rounded-lg border border-surface-200 bg-white px-2 py-1 text-xs dark:border-surface-700 dark:bg-surface-800">
          <option value="utf-8">UTF-8</option>
          <option value="gbk">GBK (Excel)</option>
        </select>
      </div>

      <template v-if="parsedData.length > 0">
        <button @click="showPreview = !showPreview" class="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400">
          {{ showPreview ? 'Hide Preview' : 'Preview' }}
        </button>
        <button @click="showFieldSelector = !showFieldSelector" class="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400">
          {{ showFieldSelector ? 'Hide Fields' : 'Fields' }}
        </button>
      </template>
    </template>
  </ResizablePanel>

  <!-- Table Preview -->
  <div v-if="showPreview && tableData.rows.length > 0" class="mt-4">
    <div class="flex items-center justify-between mb-2">
      <label class="text-sm font-bold text-surface-700 dark:text-surface-300">Preview ({{ tableData.totalRows }} rows)</label>
      <button @click="showPreview = false" class="text-xs text-surface-500 hover:text-surface-700 dark:text-surface-400">Hide</button>
    </div>
    <div class="overflow-x-auto rounded-xl border border-surface-200 dark:border-surface-700">
      <table class="w-full text-xs">
        <thead>
          <tr class="bg-surface-100 dark:bg-surface-800">
            <th v-for="header in tableData.headers" :key="header" class="px-3 py-2 text-left font-bold text-surface-700 dark:text-surface-300 border-b border-surface-200 dark:border-surface-700">{{ header }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, index) in tableData.rows.slice(0, 10)" :key="index" class="hover:bg-surface-50 dark:hover:bg-surface-800">
            <td v-for="(cell, cellIndex) in row" :key="cellIndex" class="px-3 py-2 border-b border-surface-100 dark:border-surface-700 text-surface-700 dark:text-surface-300">{{ truncateCell(cell) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <p v-if="tableData.totalRows > 10" class="mt-2 text-xs text-surface-500 dark:text-surface-400">Showing 10 of {{ tableData.totalRows }} rows</p>
  </div>

  <!-- Field Selector -->
  <div v-if="showFieldSelector && availableFields.length > 0" class="mt-4">
    <div class="flex items-center justify-between mb-2">
      <label class="text-sm font-bold text-surface-700 dark:text-surface-300">Select Fields</label>
      <div class="flex gap-2">
        <button @click="selectAllFields" class="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400">All</button>
        <button @click="deselectAllFields" class="text-xs text-surface-500 hover:text-surface-700 dark:text-surface-400">None</button>
      </div>
    </div>
    <div class="flex flex-wrap gap-2">
      <label v-for="field in availableFields" :key="field" class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border cursor-pointer transition-colors" :class="selectedFields.includes(field) ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30' : 'border-surface-200 dark:border-surface-700'">
        <input type="checkbox" :value="field" v-model="selectedFields" class="w-3 h-3 rounded border-surface-300 text-primary-600 focus:ring-primary-500" />
        <span class="text-xs text-surface-700 dark:text-surface-300">{{ field }}</span>
      </label>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ tool: any }>()

const inputJson = ref('')
const outputCsv = ref('')
const error = ref('')
const flattenNested = ref(true)
const encoding = ref<'utf-8' | 'gbk'>('utf-8')
const showPreview = ref(false)
const showFieldSelector = ref(false)
const selectedFields = ref<string[]>([])
const fullscreen = ref(false)

const { flattenArray, getFlattenedKeys, hasNestedObjects } = useJsonFlatten()
const { toTableData, truncateCell } = useTablePreview()
const { extractFieldPaths, filterByFields } = useFieldSelector()
const { prepareForExcel, generateCsv } = useExcelCompat()

const parsedData = ref<Record<string, any>[]>([])

const availableFields = computed(() => {
  if (parsedData.value.length === 0) return []
  return extractFieldPaths(parsedData.value)
})

const tableData = computed(() => {
  if (parsedData.value.length === 0) return { headers: [], rows: [], totalRows: 0 }
  let data = parsedData.value
  if (selectedFields.value.length > 0) data = filterByFields(data, selectedFields.value)
  if (flattenNested.value && hasNestedObjects(data)) data = flattenArray(data)
  return toTableData(data)
})

const convert = () => {
  try {
    const data = JSON.parse(inputJson.value)
    if (!Array.isArray(data)) {
      error.value = props.tool.ui?.error_not_array || 'Input must be a JSON array'
      outputCsv.value = ''; parsedData.value = []; return
    }
    if (data.length === 0) { outputCsv.value = ''; error.value = ''; parsedData.value = []; return }
    parsedData.value = data
    let processedData = data
    if (selectedFields.value.length > 0) processedData = filterByFields(data, selectedFields.value)
    if (flattenNested.value && hasNestedObjects(processedData)) processedData = flattenArray(processedData)
    const headers = getFlattenedKeys([processedData[0]])
    const rows = processedData.map(item => headers.map(key => item[key] ?? ''))
    outputCsv.value = generateCsv(headers, rows)
    error.value = ''
    showPreview.value = true
  } catch (e) {
    error.value = (e as Error).message; outputCsv.value = ''; parsedData.value = []
  }
}

const clearAll = () => { outputCsv.value = ''; error.value = ''; parsedData.value = []; selectedFields.value = [] }
const selectAllFields = () => { selectedFields.value = [...availableFields.value] }
const deselectAllFields = () => { selectedFields.value = [] }

const copyOutput = async () => {
  try { await navigator.clipboard.writeText(outputCsv.value) } catch (e) { console.error('Failed to copy:', e) }
}

const downloadCsv = () => {
  const { buffer, mimeType, extension } = prepareForExcel(outputCsv.value, { encoding: encoding.value, addBom: encoding.value === 'utf-8' })
  const blob = new Blob([buffer], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url; link.download = `converted.${extension}`
  document.body.appendChild(link); link.click(); document.body.removeChild(link); URL.revokeObjectURL(url)
}
</script>
