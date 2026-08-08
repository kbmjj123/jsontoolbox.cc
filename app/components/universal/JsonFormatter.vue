<template>
  <div>
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <!-- Input -->
      <div>
        <div class="flex items-center justify-between mb-2">
          <label class="text-sm font-bold text-surface-700 dark:text-surface-300">Input JSON</label>
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
          placeholder='{"name": "JSON Toolbox", "version": "1.0"}'
        ></textarea>
      </div>

      <!-- Output -->
      <div>
        <div class="flex items-center justify-between mb-2">
          <label class="text-sm font-bold text-surface-700 dark:text-surface-300">Output</label>
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
          <pre class="w-full h-64 rounded-xl border border-surface-200 bg-surface-50 p-4 font-mono text-sm text-surface-900 overflow-auto dark:border-surface-700 dark:bg-surface-800 dark:text-surface-100">{{ outputJson }}</pre>
          <div v-if="error" class="absolute bottom-2 left-2 right-2 rounded-lg bg-red-50 border border-red-200 p-2 text-xs text-red-700 dark:bg-red-900/30 dark:border-red-800 dark:text-red-400">
            {{ error }}
          </div>
        </div>
      </div>
    </div>

    <!-- Options -->
    <div class="mt-4 flex flex-wrap items-center gap-4">
      <div class="flex items-center gap-2">
        <label class="text-xs font-bold text-surface-600 dark:text-surface-400">Indent:</label>
        <select v-model="indent" class="rounded-lg border border-surface-200 bg-white px-2 py-1 text-xs dark:border-surface-700 dark:bg-surface-800">
          <option :value="2">2 spaces</option>
          <option :value="4">4 spaces</option>
          <option :value="0">Minified</option>
        </select>
      </div>

      <button @click="formatJson" class="btn-primary px-4 py-2 text-xs">
        Format
      </button>
      <button @click="minifyJson" class="rounded-xl border border-surface-200 bg-white px-4 py-2 text-xs font-bold text-surface-700 hover:bg-surface-50 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-300">
        Minify
      </button>
      <button @click="validateJson" class="rounded-xl border border-surface-200 bg-white px-4 py-2 text-xs font-bold text-surface-700 hover:bg-surface-50 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-300">
        Validate
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
const inputJson = ref('')
const outputJson = ref('')
const error = ref('')
const indent = ref(2)

const formatJson = () => {
  try {
    const parsed = JSON.parse(inputJson.value)
    outputJson.value = JSON.stringify(parsed, null, indent.value)
    error.value = ''
  } catch (e) {
    error.value = (e as Error).message
  }
}

const minifyJson = () => {
  try {
    const parsed = JSON.parse(inputJson.value)
    outputJson.value = JSON.stringify(parsed)
    error.value = ''
  } catch (e) {
    error.value = (e as Error).message
  }
}

const validateJson = () => {
  try {
    JSON.parse(inputJson.value)
    outputJson.value = '✅ Valid JSON'
    error.value = ''
  } catch (e) {
    error.value = (e as Error).message
    outputJson.value = ''
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
  link.download = 'formatted.json'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
</script>
