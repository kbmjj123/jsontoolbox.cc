<template>
  <ResizablePanel v-model:fullscreen="fullscreen" :initial-ratio="0.5" responsive>
    <template #first>
      <div class="h-full pr-3 flex flex-col">
        <JsonInputEditor
          ref="inputEditorRef"
          v-model="inputJson"
          :label="props.tool.ui?.label_input || 'Input JSON Array'"
          placeholder='[{"name": "Alice", "age": 30}, {"email": "alice@example.com"}]'
          show-upload
          example-slug="json-to-excel"
          class="flex-1 min-h-0"
        />
      </div>
    </template>
    <template #second>
      <div class="h-full pl-3 flex flex-col">
        <JsonOutputPanel
          v-model:view-mode="outputViewMode"
          :label="props.tool.ui?.label_preview || 'Preview'"
          :content="outputJson"
          :parsed-data="parsedData"
          :error="error"
          :enable-tree-search="false"
          :show-copy="false"
          :show-download="false"
          highlight="json"
          :empty-text="props.tool.ui?.placeholder_preview || 'Preview will appear here...'"
          class="flex-1 min-h-0"
        />
      </div>
    </template>

    <template #toolbar-left>
      <button @click="convert" class="btn-primary px-5 py-2 text-xs">
        <Icon name="lucide:arrow-right" class="h-4 w-4 mr-1.5" />
        {{ props.tool.ui?.btn_convert || 'Convert to Excel' }}
      </button>

      <label class="flex items-center gap-1.5 cursor-pointer select-none">
        <input type="checkbox" v-model="flatten" class="rounded border-surface-300">
        <span class="text-xs font-bold text-surface-600 dark:text-surface-400">{{ props.tool.ui?.option_flatten || 'Flatten nested objects' }}</span>
      </label>

      <label class="flex items-center gap-1.5 cursor-pointer select-none">
        <input type="checkbox" v-model="includeHeader" class="rounded border-surface-300">
        <span class="text-xs font-bold text-surface-600 dark:text-surface-400">{{ props.tool.ui?.option_include_header || 'Include header row' }}</span>
      </label>

      <span v-if="rowCount" class="text-xs text-surface-500 dark:text-surface-400">
        {{ (props.tool.ui?.status_rows || '{count} rows').replace('{count}', String(rowCount)) }}
      </span>
    </template>

    <template #toolbar-right>
      <div class="flex items-center gap-2 ml-auto">
        <button
          v-if="outputJson"
          @click="copyCsv"
          class="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400"
        >
          {{ csvCopied ? '✓ Copied!' : (props.tool.ui?.btn_copy_csv || 'Copy CSV') }}
        </button>
        <button
          v-if="outputJson"
          @click="downloadExcel"
          class="text-xs text-surface-500 hover:text-surface-700 dark:text-surface-400"
        >
          {{ props.tool.ui?.btn_download_xlsx || 'Download XLSX' }}
        </button>
      </div>
    </template>
  </ResizablePanel>
</template>

<script setup lang="ts">
const props = defineProps<{ tool: any }>()
const { t } = useI18n()
const toast = useToast()

const inputJson = ref('')
const outputJson = ref('')
const csvContent = ref('')
const error = ref('')
const fullscreen = ref(false)
const inputEditorRef = ref()
const outputViewMode = ref<'text' | 'rich' | 'table'>('rich')
const csvCopied = ref(false)
const flatten = ref(true)
const includeHeader = ref(true)
const rowCount = ref(0)

const { flattenArray, hasNestedObjects } = useJsonFlatten()

const parsedData = computed(() => {
  if (!outputJson.value.trim()) return null
  try { return JSON.parse(outputJson.value) } catch { return null }
})

/** Union of the keys of every record, in first-seen order. */
const collectHeaders = (rows: Record<string, any>[]) => {
  const headers: string[] = []
  for (const row of rows) {
    for (const key of Object.keys(row)) {
      if (!headers.includes(key)) headers.push(key)
    }
  }
  return headers
}

const convert = () => {
  error.value = ''
  outputJson.value = ''
  csvContent.value = ''
  rowCount.value = 0

  if (!inputJson.value.trim()) {
    error.value = props.tool.ui?.error_no_data || 'No data to convert'
    return
  }

  try {
    const data = JSON.parse(inputJson.value)
    if (!Array.isArray(data)) {
      error.value = props.tool.ui?.error_not_array || 'Input must be a JSON array'
      return
    }
    if (data.length === 0) { error.value = ''; return }

    const badRow = data.findIndex(item => item === null || typeof item !== 'object' || Array.isArray(item))
    if (badRow !== -1) {
      error.value = props.tool.ui?.error_invalid_row || 'Every array item must be a JSON object'
      return
    }

    let processedData: Record<string, any>[] = data
    if (flatten.value && hasNestedObjects(processedData)) processedData = flattenArray(processedData)

    const headers = collectHeaders(processedData)
    if (headers.length === 0) {
      error.value = props.tool.ui?.error_no_columns || 'No columns could be detected'
      return
    }

    const csvRows = processedData.map(row => headers.map(h => escapeCsvField(row[h])).join(','))
    csvContent.value = includeHeader.value ? [headers.join(','), ...csvRows].join('\n') : csvRows.join('\n')
    outputJson.value = JSON.stringify(processedData, null, 2)
    rowCount.value = processedData.length
    toast.success(t('toast.converted'))
  } catch (e) {
    error.value = props.tool.ui?.error_invalid_json || 'Input must be valid JSON'
    toast.error(props.tool.ui?.error_invalid_json || 'Input must be valid JSON')
  }
}

const escapeCsvField = (value: any): string => {
  const str = String(value ?? '')
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

const copyCsv = async () => {
  await copyToClipboard(csvContent.value)
  csvCopied.value = true
  setTimeout(() => { csvCopied.value = false }, 2000)
}

const downloadExcel = async () => {
  if (!outputJson.value) return
  const XLSX = await import('xlsx')
  const data: Record<string, any>[] = JSON.parse(outputJson.value)
  const headers = collectHeaders(data)
  const rows = data.map(item => headers.map(h => item[h] ?? ''))

  const aoa = includeHeader.value ? [headers, ...rows] : rows
  const ws = XLSX.utils.aoa_to_sheet(aoa)

  // Auto-fit column widths
  ws['!cols'] = headers.map((h, i) => {
    const maxLen = Math.max(h.length, ...rows.map(r => String(r[i] ?? '').length))
    return { wch: Math.min(maxLen + 2, 40) }
  })

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1')

  try {
    XLSX.writeFile(wb, 'converted.xlsx')
  } catch (e) {
    toast.error(props.tool.ui?.error_export || 'The XLSX file could not be created')
  }
}

onMounted(() => {
  inputEditorRef.value?.loadDefaultExample()
})
</script>
