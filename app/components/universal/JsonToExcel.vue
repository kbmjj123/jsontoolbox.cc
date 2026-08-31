<template>
  <ResizablePanel v-model:fullscreen="fullscreen" :initial-ratio="0.5" responsive>
    <template #first>
      <div class="h-full pr-3 flex flex-col">
        <JsonInputEditor
          ref="inputEditorRef"
          v-model="inputJson"
          :label="tool.ui?.label_input || 'Input JSON Array'"
          placeholder='[{"name": "Alice", "age": 30}, {"email": "alice@example.com"}]'
          example-slug="json-to-excel"
          class="flex-1 min-h-0"
        />
      </div>
    </template>
    <template #second>
      <div class="h-full pl-3 flex flex-col">
        <JsonOutputPanel
          v-model:view-mode="outputViewMode"
          :label="tool.ui?.label_output || 'Output'"
          :content="outputJson"
          :parsed-data="parsedData"
          :error="error"
          :show-copy="false"
          :show-download="false"
          highlight="json"
          empty-text="JSON output will appear here"
          class="flex-1 min-h-0"
        />
      </div>
    </template>

    <template #toolbar-left>
      <button @click="convert" class="btn-primary px-5 py-2 text-xs">
        <Icon name="lucide:arrow-right" class="h-4 w-4 mr-1.5" />
        {{ tool.ui?.btn_convert || 'Convert to Excel' }}
      </button>
    </template>

    <template #toolbar-right>
      <div class="flex items-center gap-2 ml-auto">
        <button
          v-if="outputJson"
          @click="copyCsv"
          class="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400"
        >
          {{ csvCopied ? '✓ Copied!' : $t('system.copy') }}
        </button>
        <button
          v-if="outputJson"
          @click="downloadExcel"
          class="text-xs text-surface-500 hover:text-surface-700 dark:text-surface-400"
        >
          {{ $t('system.download') }}
        </button>
      </div>
    </template>
  </ResizablePanel>
</template>

<script setup lang="ts">
import * as XLSX from 'xlsx'

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

const { flattenArray, getFlattenedKeys, hasNestedObjects } = useJsonFlatten()

const parsedData = computed(() => {
  if (!outputJson.value.trim()) return null
  try { return JSON.parse(outputJson.value) } catch { return null }
})

const convert = () => {
  error.value = ''
  outputJson.value = ''
  csvContent.value = ''

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

    let processedData = data
    if (hasNestedObjects(processedData)) processedData = flattenArray(processedData)

    // Generate CSV for clipboard copy
    const headers = Object.keys(processedData[0])
    const csvRows = [headers.join(',')]
    for (const row of processedData) {
      csvRows.push(headers.map(h => escapeCsvField(row[h])).join(','))
    }
    csvContent.value = csvRows.join('\n')
    outputJson.value = JSON.stringify(processedData, null, 2)
    error.value = ''
    toast.success(t('toast.converted'))
  } catch (e) {
    error.value = (e as Error).message
    toast.error((e as Error).message)
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

const downloadExcel = () => {
  if (!outputJson.value) return
  const data = JSON.parse(outputJson.value)
  const headers = Object.keys(data[0])
  const rows = data.map((item: Record<string, any>) => headers.map(h => item[h] ?? ''))

  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows])

  // Auto-fit column widths
  ws['!cols'] = headers.map((h, i) => {
    const maxLen = Math.max(h.length, ...rows.map(r => String(r[i] ?? '').length))
    return { wch: Math.min(maxLen + 2, 40) }
  })

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1')
  XLSX.writeFile(wb, 'converted.xlsx')
}

onMounted(() => {
  inputEditorRef.value?.loadDefaultExample()
})
</script>
