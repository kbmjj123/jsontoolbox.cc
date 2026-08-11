<template>
  <div>
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <!-- Input -->
      <div>
        <div class="flex items-center justify-between mb-2">
          <label class="text-sm font-bold text-surface-700 dark:text-surface-300">{{ tool.ui?.label_input || 'Input JSON' }}</label>
          <div class="flex gap-2">
            <button @click="pasteFromClipboard" class="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400">
              {{ $t('system.paste') }}
            </button>
            <button @click="clearInput" class="text-xs text-surface-500 hover:text-surface-700 dark:text-surface-400">
              {{ $t('system.clear') }}
            </button>
          </div>
        </div>
        <textarea
          v-model="inputJson"
          class="w-full h-64 rounded-xl border border-surface-200 bg-surface-50 p-4 font-mono text-sm text-surface-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-100 resize-none"
          placeholder='{"name": "JSON Toolbox", "version": "1.0"}'
        ></textarea>
      </div>

      <!-- Preview -->
      <div>
        <div class="flex items-center justify-between mb-2">
          <label class="text-sm font-bold text-surface-700 dark:text-surface-300">{{ tool.ui?.label_preview || 'Formatted Preview' }}</label>
        </div>
        <div class="w-full h-64 rounded-xl border border-surface-200 bg-surface-50 p-4 font-mono text-sm overflow-auto dark:border-surface-700 dark:bg-surface-800">
          <div v-if="!formattedJson" class="text-surface-400 dark:text-surface-500">
            {{ tool.ui?.placeholder_preview || 'Preview will appear here...' }}
          </div>
          <pre v-else class="whitespace-pre-wrap text-surface-900 dark:text-surface-100">{{ formattedJson }}</pre>
        </div>
      </div>
    </div>

    <!-- Actions -->
    <div class="mt-4 flex flex-wrap gap-3">
      <button @click="format" class="btn-primary px-5 py-2 text-xs">
        <Icon name="lucide:eye" class="h-4 w-4 mr-1.5" />
        {{ tool.ui?.btn_preview || 'Preview' }}
      </button>
      <button @click="downloadTxt" :disabled="!formattedJson" class="rounded-xl border border-surface-200 bg-white px-4 py-2 text-xs font-bold text-surface-700 hover:bg-surface-50 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-300 dark:hover:bg-surface-700 disabled:opacity-50">
        <Icon name="lucide:download" class="h-4 w-4 mr-1.5" />
        {{ tool.ui?.btn_download || 'Download TXT' }}
      </button>
      <button @click="clearAll" class="rounded-xl border border-surface-200 bg-white px-4 py-2 text-xs font-bold text-surface-700 hover:bg-surface-50 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-300 dark:hover:bg-surface-700">
        {{ $t('system.clearAll') }}
      </button>
    </div>

    <!-- Note -->
    <div class="mt-4 rounded-lg bg-blue-50 border border-blue-200 p-3 text-xs text-blue-700 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-400">
      <Icon name="lucide:info" class="h-3 w-3 inline mr-1" />
      {{ tool.ui?.note_pdf || 'PDF generation requires a client-side library. This tool provides a formatted text preview and download option.' }}
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
const formattedJson = ref('')
const error = ref('')

const format = () => {
  error.value = ''
  try {
    const parsed = JSON.parse(inputJson.value)
    formattedJson.value = JSON.stringify(parsed, null, 2)
  } catch (e) {
    error.value = (e as Error).message
    formattedJson.value = ''
  }
}

const downloadTxt = () => {
  const blob = new Blob([formattedJson.value], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'json-output.txt'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
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
  formattedJson.value = ''
  error.value = ''
}

const clearAll = () => {
  inputJson.value = ''
  formattedJson.value = ''
  error.value = ''
}
</script>
