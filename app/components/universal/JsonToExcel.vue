<template>
  <ResizablePanel v-model:fullscreen="fullscreen" :initial-ratio="0.5" responsive>
    <template #first>
      <div class="h-full pr-3">
        <JsonOutputPanel
          v-model:view-mode="inputViewMode"
          :label="tool.ui?.label_input || 'Input JSON'"
          :content="inputJson"
          :parsed-data="parsedInputData"
          :error="inputError"
          :editable="true"
          :show-edit-actions="true"
          :show-copy="false"
          :show-download="false"
          placeholder='{"name": "JSON Toolbox", "version": "1.0"}'
          empty-text="Paste your JSON here"
          @update:content="inputJson = $event"
          @format="onFormat"
          @minify="onMinify"
          @validate="onValidate"
          @fix="onFix"
          @paste="onPaste"
        />
      </div>
    </template>
    <template #second>
      <div class="h-full pl-3">
        <div class="flex items-center justify-between mb-2">
          <label class="text-sm font-bold text-surface-700 dark:text-surface-300">{{ tool.ui?.label_preview || 'Preview' }}</label>
          <div class="flex gap-2">
            <span v-if="csvContent" class="text-xs text-surface-500 dark:text-surface-400">{{ rowCount }} {{ tool.ui?.status_rows || 'rows' }}</span>
            <button v-if="csvContent" @click="copyCsv" class="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400">{{ $t('system.copy') }}</button>
          </div>
        </div>
        <div class="w-full rounded-xl border border-surface-200 bg-surface-50 p-4 font-mono text-sm overflow-auto dark:border-surface-700 dark:bg-surface-800" :class="fullscreen ? 'h-full' : 'h-64'">
          <div v-if="!csvContent" class="text-surface-400 dark:text-surface-500">{{ tool.ui?.placeholder_preview || 'Preview will appear here...' }}</div>
          <div v-else class="whitespace-pre">{{ csvContent }}</div>
        </div>
      </div>
    </template>

    <template #toolbar-left>
      <button @click="convert" class="btn-primary px-5 py-2 text-xs">
        <Icon name="lucide:file-spreadsheet" class="h-4 w-4 mr-1.5" />
        {{ tool.ui?.btn_convert || 'Convert to CSV' }}
      </button>
      <button @click="loadExample" class="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400">
        {{ tool.ui?.btn_example || 'Load Example' }}
      </button>
      <button @click="downloadCsv" :disabled="!csvContent" class="rounded-xl border border-surface-200 bg-white px-4 py-2 text-xs font-bold text-surface-700 hover:bg-surface-50 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-300 dark:hover:bg-surface-700 disabled:opacity-50">
        <Icon name="lucide:download" class="h-4 w-4 mr-1.5" />
        {{ tool.ui?.btn_download || 'Download' }}
      </button>
      <button @click="clearAll" class="rounded-xl border border-surface-200 bg-white px-4 py-2 text-xs font-bold text-surface-700 hover:bg-surface-50 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-300 dark:hover:bg-surface-700">
        {{ $t('system.clearAll') }}
      </button>

      <div class="flex items-center gap-2">
        <label class="text-xs font-bold text-surface-600 dark:text-surface-400">{{ tool.ui?.option_delimiter || 'Delimiter:' }}</label>
        <select v-model="delimiter" class="rounded-lg border border-surface-200 bg-white px-2 py-1 text-xs dark:border-surface-700 dark:bg-surface-800">
          <option value=",">{{ tool.ui?.option_delimiter_comma || 'Comma' }}</option>
          <option value=";">{{ tool.ui?.option_delimiter_semicolon || 'Semicolon' }}</option>
          <option value="&#9;">{{ tool.ui?.option_delimiter_tab || 'Tab' }}</option>
        </select>
      </div>
      <label class="flex items-center gap-1.5 cursor-pointer select-none">
        <input type="checkbox" v-model="includeHeader" class="rounded border-surface-300">
        <span class="text-xs font-bold text-surface-600 dark:text-surface-400">{{ tool.ui?.option_include_header || 'Header' }}</span>
      </label>
      <label class="flex items-center gap-1.5 cursor-pointer select-none">
        <input type="checkbox" v-model="flattenNested" class="rounded border-surface-300">
        <span class="text-xs font-bold text-surface-600 dark:text-surface-400">{{ tool.ui?.option_flatten || 'Flatten' }}</span>
      </label>
    </template>
  </ResizablePanel>

  <!-- Error -->
  <div v-if="error" class="mt-4 rounded-lg bg-red-50 border border-red-200 p-3 text-xs text-red-700 dark:bg-red-900/30 dark:border-red-800 dark:text-red-400">{{ error }}</div>
</template>

<script setup lang="ts">
const props = defineProps<{ tool: any }>()

const { formatJson, minifyJson, validateJson, fixJson } = useJsonEditor()

const inputError = ref('')
const inputViewMode = ref<'text' | 'rich'>('text')

const parsedInputData = computed(() => {
  if (!inputJson.value.trim()) return null
  try { return JSON.parse(inputJson.value) } catch { return null }
})

const onFormat = () => {
  const result = formatJson(inputJson.value)
  if (result.output) { inputJson.value = result.output; inputError.value = '' }
  else { inputError.value = result.error }
}
const onMinify = () => {
  const result = minifyJson(inputJson.value)
  if (result.output) { inputJson.value = result.output; inputError.value = '' }
  else { inputError.value = result.error }
}
const onValidate = () => {
  const result = validateJson(inputJson.value)
  inputError.value = result.error
}
const onFix = () => {
  const result = fixJson(inputJson.value)
  if (result.fixed) { inputJson.value = result.fixed; inputError.value = '' }
  else { inputError.value = result.error }
}
const onPaste = () => { nextTick(() => onFormat()) }

const inputJson = ref('')
const csvContent = ref('')
const error = ref('')
const delimiter = ref(',')
const includeHeader = ref(true)
const flattenNested = ref(false)
const rowCount = ref(0)
const fullscreen = ref(false)

const ui = computed(() => props.tool?.ui || {})

const exampleData = [
  { name: "Alice", age: 30, email: "alice@example.com", address: { city: "New York", country: "USA" } },
  { name: "Bob", age: 25, email: "bob@example.com", address: { city: "San Francisco", country: "USA" } },
  { name: "Charlie", age: 35, email: "charlie@example.com", address: { city: "London", country: "UK" } }
]

const { flatten } = useJsonFlatten()
const { exportToCsv } = useExcelCompat()

const loadExample = () => {
  inputJson.value = JSON.stringify(exampleData, null, 2)
  convert()
}

const escapeCsvField = (field: any, delim: string): string => {
  const str = String(field ?? '')
  if (str.includes(delim) || str.includes('"') || str.includes('\n')) return `"${str.replace(/"/g, '""')}"`
  return str
}

const convert = () => {
  error.value = ''; csvContent.value = ''
  try {
    let data = JSON.parse(inputJson.value)
    if (!Array.isArray(data)) { error.value = ui.value.error_not_array || 'Input must be a JSON array'; return }
    if (data.length === 0) { error.value = ui.value.error_empty || 'Array is empty'; return }
    if (flattenNested.value) data = data.map(item => flatten(item))
    const headers = Object.keys(data[0])
    const rows: string[] = []
    if (includeHeader.value) rows.push(headers.map(h => escapeCsvField(h, delimiter.value)).join(delimiter.value))
    for (const item of data) rows.push(headers.map(h => escapeCsvField(item[h], delimiter.value)).join(delimiter.value))
    csvContent.value = rows.join('\n'); rowCount.value = data.length
  } catch (e) { error.value = (e as Error).message }
}

const copyCsv = async () => {
  await copyToClipboard(csvContent.value)
}

const downloadCsv = () => {
  let data = JSON.parse(inputJson.value)
  if (flattenNested.value) data = data.map((item: any) => flatten(item))
  const headers = Object.keys(data[0])
  exportToCsv(data, headers, 'data.csv')
}

const clearAll = () => { csvContent.value = ''; error.value = ''; rowCount.value = 0 }
</script>
