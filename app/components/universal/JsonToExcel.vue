<template>
  <div>
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <!-- Input -->
      <JsonInputEditor
        v-model="inputJson"
        :label="tool.ui?.label_input || 'Input JSON Array'"
        placeholder='[{"name": "Alice", "age": 30}, {"name": "Bob", "age": 25}]'
        @clear="clearAll"
      />

      <!-- Preview -->
      <div>
        <div class="flex items-center justify-between mb-2">
          <label class="text-sm font-bold text-surface-700 dark:text-surface-300">{{ tool.ui?.label_preview || 'Preview' }}</label>
          <span v-if="csvContent" class="text-xs text-surface-500 dark:text-surface-400">
            {{ rowCount }} {{ tool.ui?.status_rows || 'rows' }}
          </span>
        </div>
        <div class="w-full h-64 rounded-xl border border-surface-200 bg-surface-50 p-4 font-mono text-sm overflow-auto dark:border-surface-700 dark:bg-surface-800">
          <div v-if="!csvContent" class="text-surface-400 dark:text-surface-500">
            {{ tool.ui?.placeholder_preview || 'Preview will appear here...' }}
          </div>
          <div v-else class="whitespace-pre">{{ csvContent }}</div>
        </div>
      </div>
    </div>

    <!-- Options -->
    <div class="mt-4 flex flex-wrap items-center gap-4">
      <div class="flex items-center gap-2">
        <label class="text-xs font-bold text-surface-600 dark:text-surface-400">{{ tool.ui?.option_delimiter || 'Delimiter:' }}</label>
        <select v-model="delimiter" class="rounded-lg border border-surface-200 bg-white px-2 py-1 text-xs dark:border-surface-700 dark:bg-surface-800">
          <option value=",">{{ tool.ui?.option_delimiter_comma || 'Comma (,)' }}</option>
          <option value=";">{{ tool.ui?.option_delimiter_semicolon || 'Semicolon (;)' }}</option>
          <option value="&#9;">{{ tool.ui?.option_delimiter_tab || 'Tab' }}</option>
        </select>
      </div>
      <div class="flex items-center gap-2">
        <input type="checkbox" v-model="includeHeader" id="header" class="rounded border-surface-300">
        <label for="header" class="text-xs font-bold text-surface-600 dark:text-surface-400">{{ tool.ui?.option_include_header || 'Include header' }}</label>
      </div>
    </div>

    <!-- Actions -->
    <div class="mt-4 flex flex-wrap gap-3">
      <button @click="convert" class="btn-primary px-5 py-2 text-xs">
        <Icon name="lucide:file-spreadsheet" class="h-4 w-4 mr-1.5" />
        {{ tool.ui?.btn_convert || 'Convert to CSV' }}
      </button>
      <button @click="downloadCsv" :disabled="!csvContent" class="rounded-xl border border-surface-200 bg-white px-4 py-2 text-xs font-bold text-surface-700 hover:bg-surface-50 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-300 dark:hover:bg-surface-700 disabled:opacity-50">
        <Icon name="lucide:download" class="h-4 w-4 mr-1.5" />
        {{ tool.ui?.btn_download || 'Download CSV' }}
      </button>
      <button @click="clearAll" class="rounded-xl border border-surface-200 bg-white px-4 py-2 text-xs font-bold text-surface-700 hover:bg-surface-50 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-300 dark:hover:bg-surface-700">
        {{ $t('system.clearAll') }}
      </button>
    </div>

    <!-- Error -->
    <div v-if="error" class="mt-4 rounded-lg bg-red-50 border border-red-200 p-3 text-xs text-red-700 dark:bg-red-900/30 dark:border-red-800 dark:text-red-400">
      {{ error }}
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ tool: any }>()

const inputJson = ref('')
const csvContent = ref('')
const error = ref('')
const delimiter = ref(',')
const includeHeader = ref(true)
const rowCount = ref(0)

const ui = computed(() => props.tool?.ui || {})

const escapeCsvField = (field: any, delimiter: string): string => {
  const str = String(field ?? '')
  if (str.includes(delimiter) || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

const convert = () => {
  error.value = ''
  csvContent.value = ''

  try {
    const data = JSON.parse(inputJson.value)
    if (!Array.isArray(data)) {
      error.value = ui.value.error_not_array || 'Input must be a JSON array'
      return
    }
    if (data.length === 0) {
      error.value = ui.value.error_empty || 'Array is empty'
      return
    }

    const headers = Object.keys(data[0])
    const rows: string[] = []

    if (includeHeader.value) {
      rows.push(headers.map(h => escapeCsvField(h, delimiter.value)).join(delimiter.value))
    }

    for (const item of data) {
      const row = headers.map(h => escapeCsvField(item[h], delimiter.value)).join(delimiter.value)
      rows.push(row)
    }

    csvContent.value = rows.join('\n')
    rowCount.value = data.length
  } catch (e) {
    error.value = (e as Error).message
  }
}

const downloadCsv = () => {
  const blob = new Blob([csvContent.value], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'data.csv'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

const clearAll = () => {
  csvContent.value = ''
  error.value = ''
  rowCount.value = 0
}
</script>
