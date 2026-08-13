<template>
  <div>
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <!-- Input -->
      <JsonInputEditor
        v-model="inputJson"
        :label="tool.ui?.label_input || 'Input JSON Array'"
        placeholder='[{"name": "Alice", "age": 30, "address": {"city": "NYC"}}, {"name": "Bob", "age": 25, "address": {"city": "LA"}}]'
        @clear="clearAll"
      />

      <!-- Output -->
      <div>
        <div class="flex items-center justify-between mb-2">
          <label class="text-sm font-bold text-surface-700 dark:text-surface-300">{{ tool.ui?.label_output || 'CSV Output' }}</label>
          <div class="flex gap-2">
            <button @click="copyOutput" class="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400">
              {{ $t('system.copy') }}
            </button>
            <button @click="downloadCsv" class="text-xs text-surface-500 hover:text-surface-700 dark:text-surface-400">
              {{ tool.ui?.btn_download || 'Download .csv' }}
            </button>
          </div>
        </div>
        <div class="relative">
          <pre class="w-full h-64 rounded-xl border border-surface-200 bg-surface-50 p-4 font-mono text-sm text-surface-900 overflow-auto dark:border-surface-700 dark:bg-surface-800 dark:text-surface-100">{{ outputCsv }}</pre>
          <div v-if="error" class="absolute bottom-2 left-2 right-2 rounded-lg bg-red-50 border border-red-200 p-2 text-xs text-red-700 dark:bg-red-900/30 dark:border-red-800 dark:text-red-400">
            {{ error }}
          </div>
        </div>
      </div>
    </div>

    <!-- Options -->
    <div class="mt-4 flex flex-wrap items-center gap-4">
      <button @click="convert" class="btn-primary px-6 py-2.5 text-sm">
        {{ tool.ui?.btn_convert || 'Convert to CSV' }}
      </button>

      <!-- Flatten nested JSON toggle -->
      <label class="flex items-center gap-1.5 cursor-pointer select-none">
        <input
          type="checkbox"
          v-model="flattenNested"
          class="w-4 h-4 rounded border-surface-300 text-primary-600 focus:ring-primary-500"
        />
        <span class="text-xs text-surface-600 dark:text-surface-400">Flatten nested objects</span>
      </label>

      <!-- Encoding selector -->
      <div class="flex items-center gap-2">
        <label class="text-xs text-surface-600 dark:text-surface-400">Encoding:</label>
        <select v-model="encoding" class="rounded-lg border border-surface-200 bg-white px-2 py-1 text-xs dark:border-surface-700 dark:bg-surface-800">
          <option value="utf-8">UTF-8</option>
          <option value="gbk">GBK (Excel 中文)</option>
        </select>
      </div>
    </div>

    <!-- Table Preview -->
    <div v-if="showPreview && tableData.rows.length > 0" class="mt-4">
      <div class="flex items-center justify-between mb-2">
        <label class="text-sm font-bold text-surface-700 dark:text-surface-300">Preview ({{ tableData.totalRows }} rows)</label>
        <button @click="showPreview = false" class="text-xs text-surface-500 hover:text-surface-700 dark:text-surface-400">
          Hide Preview
        </button>
      </div>
      <div class="overflow-x-auto rounded-xl border border-surface-200 dark:border-surface-700">
        <table class="w-full text-xs">
          <thead>
            <tr class="bg-surface-100 dark:bg-surface-800">
              <th v-for="header in tableData.headers" :key="header" class="px-3 py-2 text-left font-bold text-surface-700 dark:text-surface-300 border-b border-surface-200 dark:border-surface-700">
                {{ header }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, index) in tableData.rows.slice(0, 10)" :key="index" class="hover:bg-surface-50 dark:hover:bg-surface-800">
              <td v-for="(cell, cellIndex) in row" :key="cellIndex" class="px-3 py-2 border-b border-surface-100 dark:border-surface-700 text-surface-700 dark:text-surface-300">
                {{ truncateCell(cell) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p v-if="tableData.totalRows > 10" class="mt-2 text-xs text-surface-500 dark:text-surface-400">
        Showing 10 of {{ tableData.totalRows }} rows
      </p>
    </div>

    <!-- Field Selector -->
    <div v-if="showFieldSelector && availableFields.length > 0" class="mt-4">
      <div class="flex items-center justify-between mb-2">
        <label class="text-sm font-bold text-surface-700 dark:text-surface-300">Select Fields to Export</label>
        <div class="flex gap-2">
          <button @click="selectAllFields" class="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400">
            Select All
          </button>
          <button @click="deselectAllFields" class="text-xs text-surface-500 hover:text-surface-700 dark:text-surface-400">
            Deselect All
          </button>
        </div>
      </div>
      <div class="flex flex-wrap gap-2">
        <label
          v-for="field in availableFields"
          :key="field"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border cursor-pointer transition-colors"
          :class="selectedFields.includes(field) ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30' : 'border-surface-200 dark:border-surface-700'"
        >
          <input
            type="checkbox"
            :value="field"
            v-model="selectedFields"
            class="w-3 h-3 rounded border-surface-300 text-primary-600 focus:ring-primary-500"
          />
          <span class="text-xs text-surface-700 dark:text-surface-300">{{ field }}</span>
        </label>
      </div>
    </div>

    <!-- Preview Toggle -->
    <div v-if="parsedData.length > 0" class="mt-4 flex gap-4">
      <button
        @click="showPreview = !showPreview"
        class="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400"
      >
        {{ showPreview ? 'Hide Table Preview' : 'Show Table Preview' }}
      </button>
      <button
        @click="showFieldSelector = !showFieldSelector"
        class="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400"
      >
        {{ showFieldSelector ? 'Hide Field Selector' : 'Select Fields' }}
      </button>
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

// Composables
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
  if (parsedData.value.length === 0) {
    return { headers: [], rows: [], totalRows: 0 }
  }

  let data = parsedData.value

  // Apply field selection
  if (selectedFields.value.length > 0) {
    data = filterByFields(data, selectedFields.value)
  }

  // Apply flattening
  if (flattenNested.value && hasNestedObjects(data)) {
    data = flattenArray(data)
  }

  return toTableData(data)
})

const convert = () => {
  try {
    const data = JSON.parse(inputJson.value)

    if (!Array.isArray(data)) {
      error.value = props.tool.ui?.error_not_array || 'Input must be a JSON array'
      outputCsv.value = ''
      parsedData.value = []
      return
    }

    if (data.length === 0) {
      outputCsv.value = ''
      error.value = ''
      parsedData.value = []
      return
    }

    parsedData.value = data

    // Apply field selection
    let processedData = data
    if (selectedFields.value.length > 0) {
      processedData = filterByFields(data, selectedFields.value)
    }

    // Apply flattening
    if (flattenNested.value && hasNestedObjects(processedData)) {
      processedData = flattenArray(processedData)
    }

    // Get headers and generate CSV
    const headers = getFlattenedKeys([processedData[0]])
    const rows = processedData.map(item =>
      headers.map(key => item[key] ?? '')
    )

    outputCsv.value = generateCsv(headers, rows)
    error.value = ''

    // Show preview after conversion
    showPreview.value = true
  } catch (e) {
    error.value = (e as Error).message
    outputCsv.value = ''
    parsedData.value = []
  }
}

const clearAll = () => {
  outputCsv.value = ''
  error.value = ''
  parsedData.value = []
  selectedFields.value = []
}

const selectAllFields = () => {
  selectedFields.value = [...availableFields.value]
}

const deselectAllFields = () => {
  selectedFields.value = []
}

const copyOutput = async () => {
  try {
    await navigator.clipboard.writeText(outputCsv.value)
  } catch (e) {
    console.error('Failed to copy:', e)
  }
}

const downloadCsv = () => {
  const { buffer, mimeType, extension } = prepareForExcel(outputCsv.value, {
    encoding: encoding.value,
    addBom: encoding.value === 'utf-8'
  })

  const blob = new Blob([buffer], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `converted.${extension}`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
</script>
