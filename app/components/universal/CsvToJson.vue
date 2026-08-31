<template>
  <ResizablePanel v-model:fullscreen="fullscreen" :initial-ratio="0.5" responsive>
    <template #first>
      <div class="h-full pr-3 flex flex-col">
        <JsonInputEditor
          ref="inputEditorRef"
          v-model="inputCsv"
          :label="tool.ui?.label_input || 'Input CSV'"
          :placeholder="tool.ui?.placeholder_input || 'Paste CSV data here...'"
          example-slug="csv-to-json"
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
          :parsed-data="parsedOutputData"
          :error="error"
          view-mode="rich"
          :highlight="'json'"
          empty-text="JSON output will appear here"
          download-filename="converted.json"
        />
      </div>
    </template>

    <template #toolbar-left>
      <button @click="convert" class="btn-primary px-5 py-2 text-xs">
        <Icon name="lucide:arrow-right" class="h-4 w-4 mr-1.5" />
        {{ tool.ui?.btn_convert || 'Convert to JSON' }}
      </button>

      <div class="flex items-center gap-2">
        <label class="text-xs text-surface-600 dark:text-surface-400">{{ tool.ui?.option_delimiter || 'Delimiter:' }}</label>
        <select v-model="delimiter" class="rounded-lg border border-surface-200 bg-white px-2 py-1 text-xs dark:border-surface-700 dark:bg-surface-800">
          <option value="auto">Auto</option>
          <option value=",">Comma (,)</option>
          <option value=";">Semicolon (;)</option>
          <option value="	">Tab</option>
          <option value="|">Pipe (|)</option>
        </select>
      </div>

      <label class="flex items-center gap-1.5 cursor-pointer select-none">
        <input type="checkbox" v-model="hasHeader" class="w-3.5 h-3.5 rounded border-surface-300 text-primary-600 focus:ring-primary-500" />
        <span class="text-xs text-surface-600 dark:text-surface-400">{{ tool.ui?.option_has_header || 'First row is header' }}</span>
      </label>

      <label class="flex items-center gap-1.5 cursor-pointer select-none">
        <input type="checkbox" v-model="typeInference" class="w-3.5 h-3.5 rounded border-surface-300 text-primary-600 focus:ring-primary-500" />
        <span class="text-xs text-surface-600 dark:text-surface-400">Type inference</span>
      </label>
    </template>
  </ResizablePanel>
</template>

<script setup lang="ts">
const props = defineProps<{ tool: any }>()
const { t } = useI18n()
const toast = useToast()

const inputCsv = ref('')
const outputJson = ref('')
const parsedOutputData = ref<unknown>(null)
const error = ref('')
const delimiter = ref('auto')
const hasHeader = ref(true)
const typeInference = ref(true)
const fullscreen = ref(false)
const outputViewMode = ref<'text' | 'rich' | 'table'>('rich')
const inputEditorRef = ref()

function detectDelimiter(text: string): string {
  const lines = text.trim().split('\n').slice(0, 5)
  const delimiters = [
    { char: ',', name: ',' },
    { char: ';', name: ';' },
    { char: '	', name: '	' },
    { char: '|', name: '|' },
  ]
  let best = delimiters[0]
  let bestCount = 0
  for (const d of delimiters) {
    const count = lines.reduce((sum, line) => sum + (line.split(d.char).length - 1), 0)
    if (count > bestCount) { bestCount = count; best = d }
  }
  return best.name
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

function inferType(value: string): any {
  if (value === '') return null
  if (value === 'true') return true
  if (value === 'false') return false
  if (/^-?\d+$/.test(value)) { const n = parseInt(value, 10); if (!isNaN(n)) return n }
  if (/^-?\d+\.\d+$/.test(value)) { const n = parseFloat(value); if (!isNaN(n)) return n }
  return value
}

const convert = () => {
  error.value = ''
  outputJson.value = ''
  parsedOutputData.value = null

  if (!inputCsv.value.trim()) {
    error.value = props.tool.ui?.error_no_data || 'No data to convert'
    return
  }

  try {
    const sep = delimiter.value === 'auto' ? detectDelimiter(inputCsv.value) : delimiter.value
    const rows = parseCsv(inputCsv.value, sep)
    if (rows.length === 0) { error.value = 'No data to convert'; return }

    let headers: string[]
    let dataRows: string[][]

    if (hasHeader.value) {
      headers = rows[0]
      dataRows = rows.slice(1)
    } else {
      headers = rows[0].map((_, i) => `column_${i + 1}`)
      dataRows = rows
    }

    const result = dataRows.map(row => {
      const obj: Record<string, any> = {}
      headers.forEach((h, i) => {
        const val = (row[i] ?? '').trim()
        obj[h] = typeInference.value ? inferType(val) : val
      })
      return obj
    })

    parsedOutputData.value = result
    outputJson.value = JSON.stringify(result, null, 2)
    toast.success(t('toast.converted'))
  } catch (e) {
    error.value = (e as Error).message
    toast.error((e as Error).message)
  }
}

onMounted(() => {
  inputEditorRef.value?.loadDefaultExample()
})
</script>
