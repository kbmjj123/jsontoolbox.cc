<template>
  <div>
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <!-- Input -->
      <div>
        <div class="flex items-center justify-between mb-2">
          <label class="text-sm font-bold text-surface-700 dark:text-surface-300">Input JSON Array</label>
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
          v-model="inputJson"
          class="w-full h-64 rounded-xl border border-surface-200 bg-surface-50 p-4 font-mono text-sm text-surface-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-100 resize-none"
          placeholder='[{"name": "Alice", "age": 30}, {"name": "Bob", "age": 25}]'
        ></textarea>
      </div>

      <!-- Output -->
      <div>
        <div class="flex items-center justify-between mb-2">
          <label class="text-sm font-bold text-surface-700 dark:text-surface-300">CSV Output</label>
          <div class="flex gap-2">
            <button @click="copyOutput" class="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400">
              Copy
            </button>
            <button @click="downloadCsv" class="text-xs text-surface-500 hover:text-surface-700 dark:text-surface-400">
              Download .csv
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

    <!-- Convert Button -->
    <div class="mt-4">
      <button @click="convert" class="btn-primary px-6 py-2.5 text-sm">
        Convert to CSV
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
const inputJson = ref('')
const outputCsv = ref('')
const error = ref('')

const convert = () => {
  try {
    const data = JSON.parse(inputJson.value)

    if (!Array.isArray(data)) {
      error.value = 'Input must be a JSON array'
      outputCsv.value = ''
      return
    }

    if (data.length === 0) {
      outputCsv.value = ''
      error.value = ''
      return
    }

    // Collect all unique keys
    const keys = [...new Set(data.flatMap(item => Object.keys(item)))]

    const header = keys.map(key => `"${key}"`).join(',')
    const rows = data.map(item =>
      keys.map(key => {
        const value = item[key]
        if (value === null || value === undefined) return ''
        const str = String(value)
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`
        }
        return str
      }).join(',')
    )

    outputCsv.value = [header, ...rows].join('\n')
    error.value = ''
  } catch (e) {
    error.value = (e as Error).message
    outputCsv.value = ''
  }
}

const pasteFromClipboard = async () => {
  try {
    inputJson.value = await navigator.clipboard.readText()
  } catch (e) {
    console.error('Failed to read clipboard:', e)
  }
}

const clearInput = () => {
  inputJson.value = ''
  outputCsv.value = ''
  error.value = ''
}

const copyOutput = async () => {
  try {
    await navigator.clipboard.writeText(outputCsv.value)
  } catch (e) {
    console.error('Failed to copy:', e)
  }
}

const downloadCsv = () => {
  const blob = new Blob([outputCsv.value], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'converted.csv'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
</script>
