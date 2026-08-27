<template>
  <ResizablePanel v-model:fullscreen="fullscreen" :initial-ratio="0.5" responsive>
    <template #first>
      <div class="h-full pr-3 flex flex-col">
        <JsonInputEditor
          ref="inputEditorRef"
          v-model="inputJson"
          :label="tool.ui?.label_input || 'Input JSON Array'"
          placeholder='[{"name": "Alice", "age": 30}, {"name": "Bob", "age": 25}]'
          example-slug="json-to-csv"
          class="flex-1 min-h-0"
        />
      </div>
    </template>
    <template #second>
      <div class="h-full pl-3 flex flex-col">
        <JsonOutputPanel
          v-model:view-mode="outputViewMode"
          :label="tool.ui?.label_output || 'JSON Output'"
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
        {{ tool.ui?.btn_convert || 'Convert to CSV' }}
      </button>
    </template>

    <template #toolbar-right>
      <div class="flex items-center gap-2 ml-auto">
        <button
          v-if="outputCsv"
          @click="copyCsv"
          class="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400"
        >
          {{ csvCopied ? '✓ Copied!' : $t('system.copy') }}
        </button>
        <button
          v-if="outputCsv"
          @click="downloadCsv"
          class="text-xs text-surface-500 hover:text-surface-700 dark:text-surface-400"
        >
          {{ $t('system.download') }}
        </button>
      </div>
    </template>
  </ResizablePanel>
</template>

<script setup lang="ts">
const props = defineProps<{ tool: any }>()

const inputJson = ref('')
const outputJson = ref('')
const outputCsv = ref('')
const error = ref('')
const fullscreen = ref(false)
const inputEditorRef = ref()
const outputViewMode = ref<'text' | 'rich' | 'table'>('rich')
const csvCopied = ref(false)

const { flattenArray, getFlattenedKeys, hasNestedObjects } = useJsonFlatten()
const { prepareForExcel, generateCsv } = useExcelCompat()

const parsedData = computed(() => {
  if (!outputJson.value.trim()) return null
  try { return JSON.parse(outputJson.value) } catch { return null }
})

const convert = () => {
  error.value = ''
  outputJson.value = ''
  outputCsv.value = ''

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

    const headers = getFlattenedKeys([processedData[0]])
    const rows = processedData.map(item => headers.map(key => item[key] ?? ''))
    outputCsv.value = generateCsv(headers, rows)
    outputJson.value = JSON.stringify(processedData, null, 2)
    error.value = ''
  } catch (e) {
    error.value = (e as Error).message
  }
}

const copyCsv = async () => {
  await copyToClipboard(outputCsv.value)
  csvCopied.value = true
  setTimeout(() => { csvCopied.value = false }, 2000)
}

const downloadCsv = () => {
  const { buffer, mimeType, extension } = prepareForExcel(outputCsv.value, { encoding: 'utf-8', addBom: true })
  const blob = new Blob([buffer], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url; link.download = `converted.${extension}`
  document.body.appendChild(link); link.click(); document.body.removeChild(link); URL.revokeObjectURL(url)
}

onMounted(() => {
  inputEditorRef.value?.loadDefaultExample()
})
</script>
