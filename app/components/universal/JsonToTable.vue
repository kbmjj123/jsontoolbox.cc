<template>
  <div>
    <div class="mb-4">
      <JsonInputEditor
        v-model="inputJson"
        :label="ui?.labelInputJson ?? 'Input JSON Array'"
        height="h-40"
        placeholder='[{"name": "Alice", "age": 30, "address": {"city": "NYC"}}, {"name": "Bob", "age": 25, "address": {"city": "LA"}}]'
        show-upload
        @clear="clearAll"
      />
    </div>

    <!-- Options -->
    <div class="mb-4 flex flex-wrap items-center gap-4">
      <label class="flex items-center gap-1.5 cursor-pointer select-none">
        <input
          type="checkbox"
          v-model="flattenNested"
          class="w-4 h-4 rounded border-surface-300 text-primary-600 focus:ring-primary-500"
        />
        <span class="text-xs text-surface-600 dark:text-surface-400">{{ ui?.option_flatten ?? 'Flatten nested objects' }}</span>
      </label>
    </div>

    <!-- Actions -->
    <div class="mb-4 flex flex-wrap gap-3">
      <button @click="renderTable" class="btn-primary px-5 py-2 text-xs">
        <Icon name="lucide:table" class="h-4 w-4 mr-1.5" />
        {{ ui?.btnRender ?? 'Render Table' }}
      </button>
      <button @click="loadExample" class="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400">
        {{ ui?.btnExample ?? 'Load Example' }}
      </button>
      <button @click="copyHtml" class="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400">
        {{ ui?.btnCopyHtml ?? 'Copy HTML' }}
      </button>
      <button @click="downloadCsv" class="text-xs text-surface-500 hover:text-surface-700 dark:text-surface-400">
        {{ ui?.btnDownloadCsv ?? 'Download CSV' }}
      </button>
      <button @click="clearAll" class="rounded-xl border border-surface-200 bg-white px-4 py-2 text-xs font-bold text-surface-700 hover:bg-surface-50 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-300 dark:hover:bg-surface-700">
        {{ $t('system.clearAll') }}
      </button>
    </div>

    <!-- Table -->
    <div v-if="headers.length > 0" class="rounded-xl border border-surface-200 bg-white dark:border-surface-700 dark:bg-surface-900 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-surface-50 dark:bg-surface-800">
              <th
                v-for="header in headers"
                :key="header"
                class="px-4 py-3 text-left font-bold text-surface-700 dark:text-surface-300 border-b border-surface-200 dark:border-surface-700"
              >
                {{ header }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(row, index) in rows"
              :key="index"
              class="border-b border-surface-100 dark:border-surface-800 last:border-0 hover:bg-surface-50 dark:hover:bg-surface-800"
            >
              <td
                v-for="header in headers"
                :key="header"
                class="px-4 py-3 text-surface-900 dark:text-surface-100"
              >
                {{ formatCell(row[header]) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Stats -->
    <div v-if="rows.length > 0" class="mt-4 flex flex-wrap gap-3">
      <div class="stat-chip">
        <Icon name="lucide:rows" class="h-3 w-3" />
        {{ (ui?.statusRows ?? '{count} rows').replace('{count}', String(rows.length)) }}
      </div>
      <div class="stat-chip">
        <Icon name="lucide:columns" class="h-3 w-3" />
        {{ (ui?.statusColumns ?? '{count} columns').replace('{count}', String(headers.length)) }}
      </div>
    </div>

    <!-- Error -->
    <div v-if="error" class="mt-4 rounded-lg bg-red-50 border border-red-200 p-3 text-xs text-red-700 dark:bg-red-900/30 dark:border-red-800 dark:text-red-400">
      {{ error }}
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ tool: any }>()
const ui = computed(() => props.tool?.ui)

const inputJson = ref('')
const error = ref('')
const headers = ref<string[]>([])
const rows = ref<any[]>([])
const flattenNested = ref(false)

// Example data
const exampleData = [
  { name: "Alice", age: 30, email: "alice@example.com", address: { city: "New York", country: "USA" } },
  { name: "Bob", age: 25, email: "bob@example.com", address: { city: "San Francisco", country: "USA" } },
  { name: "Charlie", age: 35, email: "charlie@example.com", address: { city: "London", country: "UK" } }
]

// Composables
const { flatten } = useJsonFlatten()
const { toTableData } = useTablePreview()
const { exportToCsv } = useExcelCompat()

const loadExample = () => {
  inputJson.value = JSON.stringify(exampleData, null, 2)
  renderTable()
}

const formatCell = (value: any): string => {
  if (value === null || value === undefined) return ''
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

const renderTable = () => {
  error.value = ''
  headers.value = []
  rows.value = []

  try {
    let data = JSON.parse(inputJson.value)
    if (!Array.isArray(data)) {
      error.value = ui.value?.errorInvalidInput ?? 'Input must be a JSON array'
      return
    }
    if (data.length === 0) {
      error.value = ui.value?.errorEmptyArray ?? 'Array is empty'
      return
    }

    // Flatten nested objects if enabled
    if (flattenNested.value) {
      data = data.map(item => flatten(item))
    }

    // Use table preview composable
    const tableData = toTableData(data)
    headers.value = tableData.headers
    rows.value = tableData.rows
  } catch (e) {
    error.value = (e as Error).message
  }
}

const generateHtmlTable = (): string => {
  let html = '<table border="1" cellpadding="5" cellspacing="0">\n<thead>\n<tr>\n'
  headers.value.forEach(header => {
    html += `  <th>${header}</th>\n`
  })
  html += '</tr>\n</thead>\n<tbody>\n'
  rows.value.forEach(row => {
    html += '<tr>\n'
    headers.value.forEach(header => {
      html += `  <td>${formatCell(row[header])}</td>\n`
    })
    html += '</tr>\n'
  })
  html += '</tbody>\n</table>'
  return html
}

const copyHtml = async () => {
  const html = generateHtmlTable()
  try {
    await navigator.clipboard.writeText(html)
  } catch (e) {
    console.error('Failed to copy:', e)
  }
}

const downloadCsv = () => {
  const csvData = rows.value.map(row => {
    const csvRow: Record<string, any> = {}
    headers.value.forEach(header => {
      csvRow[header] = row[header]
    })
    return csvRow
  })
  exportToCsv(csvData, headers.value, 'table-data.csv')
}

const clearAll = () => {
  error.value = ''
  headers.value = []
  rows.value = []
}
</script>
