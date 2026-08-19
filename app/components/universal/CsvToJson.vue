<template>
  <div>
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <!-- Input -->
      <JsonInputEditor
        v-model="inputCsv"
        :label="tool.ui?.label_input || 'Input CSV'"
        placeholder="name,age,city&#10;Alice,30,New York&#10;Bob,25,San Francisco"
        show-upload
        accept=".csv,.tsv,.txt"
        @clear="clearAll"
      />

      <!-- Output -->
      <JsonOutputPanel
        :label="tool.ui?.label_output ?? 'JSON Output'"
        :content="outputJson"
        :error="error"
        :empty-text="tool.ui?.placeholder_output ?? 'JSON output will appear here...'"
        height="h-64"
        @copy="copyOutput"
        @download="downloadOutput"
      />
    </div>

    <!-- Options -->
    <div class="mt-4 flex flex-wrap items-center gap-4">
      <div class="flex items-center gap-2">
        <label class="text-xs font-bold text-surface-600 dark:text-surface-400">{{ tool.ui?.option_delimiter || 'Delimiter:' }}</label>
        <select v-model="delimiter" class="rounded-lg border border-surface-200 bg-white px-2 py-1 text-xs dark:border-surface-700 dark:bg-surface-800">
          <option value=",">Comma (,)</option>
          <option value=";">Semicolon (;)</option>
          <option value="&#9;">Tab</option>
          <option value="|">Pipe (|)</option>
          <option value="auto">Auto-detect</option>
        </select>
      </div>
      <div class="flex items-center gap-2">
        <input type="checkbox" v-model="hasHeader" id="header" class="rounded border-surface-300">
        <label for="header" class="text-xs font-bold text-surface-600 dark:text-surface-400">{{ tool.ui?.option_has_header || 'First row is header' }}</label>
      </div>
      <div class="flex items-center gap-2">
        <label class="text-xs font-bold text-surface-600 dark:text-surface-400">{{ tool.ui?.option_indent || 'Indent:' }}</label>
        <select v-model="indent" class="rounded-lg border border-surface-200 bg-white px-2 py-1 text-xs dark:border-surface-700 dark:bg-surface-800">
          <option :value="2">2 spaces</option>
          <option :value="4">4 spaces</option>
        </select>
      </div>
    </div>

    <!-- Actions -->
    <div class="mt-3 flex flex-wrap gap-3">
      <button @click="convert" class="btn-primary px-5 py-2 text-xs">
        <Icon name="lucide:arrow-right" class="h-4 w-4 mr-1.5" />
        {{ tool.ui?.btn_convert || 'Convert to JSON' }}
      </button>
      <button @click="loadExample" class="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400">
        {{ tool.ui?.btn_example || 'Load Example' }}
      </button>
      <button @click="clearAll" class="rounded-xl border border-surface-200 bg-white px-4 py-2 text-xs font-bold text-surface-700 hover:bg-surface-50 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-300 dark:hover:bg-surface-700">
        {{ $t('system.clearAll') }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ tool: any }>()

const inputCsv = ref('')
const outputJson = ref('')
const error = ref('')
const delimiter = ref(',')
const hasHeader = ref(true)
const indent = ref(2)

// Example data
const exampleCsv = `name,age,city,active
Alice,30,New York,true
Bob,25,San Francisco,false
Charlie,35,London,true`

const loadExample = () => {
  inputCsv.value = exampleCsv
  convert()
}

const detectDelimiter = (csv: string): string => {
  const firstLine = csv.split('\n')[0]
  const delimiters = [',', ';', '\t', '|']
  let maxCount = 0
  let detected = ','

  for (const d of delimiters) {
    const count = (firstLine.match(new RegExp(d === '|' ? '\\|' : d === '\t' ? '\t' : d, 'g')) || []).length
    if (count > maxCount) {
      maxCount = count
      detected = d
    }
  }

  return detected
}

const parseCsvLine = (line: string, delim: string): string[] => {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]

    if (inQuotes) {
      if (char === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        current += char
      }
    } else {
      if (char === '"') {
        inQuotes = true
      } else if (char === delimiter) {
        result.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
  }

  result.push(current.trim())
  return result
}

const convert = () => {
  error.value = ''
  try {
    const lines = inputCsv.value.split('\n').filter(line => line.trim())
    if (lines.length === 0) {
      error.value = props.tool.ui?.error_no_data || 'No data to convert'
      return
    }

    // Auto-detect delimiter if needed
    const effectiveDelimiter = delimiter.value === 'auto' ? detectDelimiter(inputCsv.value) : delimiter.value

    const rows = lines.map(line => parseCsvLine(line, effectiveDelimiter))

    if (hasHeader.value) {
      const headers = rows[0]
      const data = rows.slice(1).map(row => {
        const obj: any = {}
        headers.forEach((header, index) => {
          const value = row[index] || ''
          // Enhanced type inference
          if (value === '' || value === 'null') {
            obj[header] = null
          } else if (value === 'true') {
            obj[header] = true
          } else if (value === 'false') {
            obj[header] = false
          } else {
            const num = Number(value)
            obj[header] = value !== '' && !isNaN(num) ? num : value
          }
        })
        return obj
      })
      outputJson.value = JSON.stringify(data, null, indent.value)
    } else {
      outputJson.value = JSON.stringify(rows, null, indent.value)
    }
  } catch (e) {
    error.value = (e as Error).message
    outputJson.value = ''
  }
}

const clearAll = () => {
  outputJson.value = ''
  error.value = ''
}

const copyOutput = async () => {
  try {
    await navigator.clipboard.writeText(outputJson.value)
  } catch (e) {
    console.error('Failed to copy:', e)
  }
}

const downloadOutput = () => {
  const blob = new Blob([outputJson.value], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'output.json'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
</script>
