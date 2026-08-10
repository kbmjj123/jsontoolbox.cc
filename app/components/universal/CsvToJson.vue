<template>
  <div>
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <!-- Input -->
      <div>
        <div class="flex items-center justify-between mb-2">
          <label class="text-sm font-bold text-surface-700 dark:text-surface-300">Input CSV</label>
          <div class="flex gap-2">
            <button @click="pasteFromClipboard" class="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400">
              Paste
            </button>
            <button @click="clearInput" class="text-xs text-surface-500 hover:text-surface-700 dark:text-surface-400">
              Clear
            </button>
          </div>
        </div>
        <textarea
          v-model="inputCsv"
          class="w-full h-64 rounded-xl border border-surface-200 bg-surface-50 p-4 font-mono text-sm text-surface-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-100 resize-none"
          placeholder="name,age,city&#10;Alice,30,New York&#10;Bob,25,San Francisco"
        ></textarea>
      </div>

      <!-- Output -->
      <div>
        <div class="flex items-center justify-between mb-2">
          <label class="text-sm font-bold text-surface-700 dark:text-surface-300">JSON Output</label>
          <div class="flex gap-2">
            <button @click="copyOutput" class="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400">
              Copy
            </button>
            <button @click="downloadOutput" class="text-xs text-surface-500 hover:text-surface-700 dark:text-surface-400">
              Download
            </button>
          </div>
        </div>
        <div class="relative">
          <textarea
            v-model="outputJson"
            readonly
            class="w-full h-64 rounded-xl border border-surface-200 bg-surface-50 p-4 font-mono text-sm text-surface-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-100 resize-none"
            placeholder="JSON output will appear here..."
          ></textarea>
          <div v-if="error" class="absolute bottom-2 left-2 right-2 rounded-lg bg-red-50 border border-red-200 p-2 text-xs text-red-700 dark:bg-red-900/30 dark:border-red-800 dark:text-red-400">
            {{ error }}
          </div>
        </div>
      </div>
    </div>

    <!-- Options -->
    <div class="mt-4 flex flex-wrap items-center gap-4">
      <div class="flex items-center gap-2">
        <label class="text-xs font-bold text-surface-600 dark:text-surface-400">Delimiter:</label>
        <select v-model="delimiter" class="rounded-lg border border-surface-200 bg-white px-2 py-1 text-xs dark:border-surface-700 dark:bg-surface-800">
          <option value=",">Comma (,)</option>
          <option value=";">Semicolon (;)</option>
          <option value="&#9;">Tab</option>
          <option value="|">Pipe (|)</option>
        </select>
      </div>
      <div class="flex items-center gap-2">
        <input type="checkbox" v-model="hasHeader" id="header" class="rounded border-surface-300">
        <label for="header" class="text-xs font-bold text-surface-600 dark:text-surface-400">First row is header</label>
      </div>
      <div class="flex items-center gap-2">
        <label class="text-xs font-bold text-surface-600 dark:text-surface-400">Indent:</label>
        <select v-model="indent" class="rounded-lg border border-surface-200 bg-white px-2 py-1 text-xs dark:border-surface-700 dark:bg-surface-800">
          <option :value="2">2 spaces</option>
          <option :value="4">4 spaces</option>
        </select>
      </div>
    </div>

    <!-- Actions -->
    <div class="mt-4 flex flex-wrap gap-3">
      <button @click="convert" class="btn-primary px-5 py-2 text-xs">
        <Icon name="lucide:arrow-right" class="h-4 w-4 mr-1.5" />
        Convert to JSON
      </button>
      <button @click="clearAll" class="rounded-xl border border-surface-200 bg-white px-4 py-2 text-xs font-bold text-surface-700 hover:bg-surface-50 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-300 dark:hover:bg-surface-700">
        Clear All
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
const inputCsv = ref('')
const outputJson = ref('')
const error = ref('')
const delimiter = ref(',')
const hasHeader = ref(true)
const indent = ref(2)

const parseCsvLine = (line: string, delimiter: string): string[] => {
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
      error.value = 'No data to convert'
      return
    }

    const rows = lines.map(line => parseCsvLine(line, delimiter.value))

    if (hasHeader.value) {
      const headers = rows[0]
      const data = rows.slice(1).map(row => {
        const obj: any = {}
        headers.forEach((header, index) => {
          const value = row[index] || ''
          const num = Number(value)
          obj[header] = value !== '' && !isNaN(num) ? num : value
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

const pasteFromClipboard = async () => {
  try {
    inputCsv.value = await navigator.clipboard.readText()
  } catch (e) {
    console.error('Failed to read clipboard:', e)
  }
}

const clearInput = () => {
  inputCsv.value = ''
  error.value = ''
}

const clearAll = () => {
  inputCsv.value = ''
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
