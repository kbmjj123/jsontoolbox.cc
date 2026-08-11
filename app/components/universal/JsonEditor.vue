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

      <!-- Output -->
      <div>
        <div class="flex items-center justify-between mb-2">
          <label class="text-sm font-bold text-surface-700 dark:text-surface-300">{{ tool.ui?.label_output || 'Formatted Output' }}</label>
          <div class="flex gap-2">
            <button @click="copyOutput" class="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400">
              {{ $t('system.copy') }}
            </button>
            <button @click="downloadOutput" class="text-xs text-surface-500 hover:text-surface-700 dark:text-surface-400">
              {{ $t('system.download') }}
            </button>
          </div>
        </div>
        <div class="relative">
          <textarea
            v-model="outputJson"
            readonly
            class="w-full h-64 rounded-xl border border-surface-200 bg-surface-50 p-4 font-mono text-sm text-surface-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-100 resize-none"
            :placeholder="tool.ui?.placeholder_output || 'Formatted output will appear here...'"
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
        <label class="text-xs font-bold text-surface-600 dark:text-surface-400">{{ tool.ui?.option_indent || 'Indent:' }}</label>
        <select v-model="indent" class="rounded-lg border border-surface-200 bg-white px-2 py-1 text-xs dark:border-surface-700 dark:bg-surface-800">
          <option :value="2">{{ tool.ui?.option_indent_2 || '2 spaces' }}</option>
          <option :value="4">{{ tool.ui?.option_indent_4 || '4 spaces' }}</option>
          <option :value="0">{{ tool.ui?.option_indent_minified || 'Minified' }}</option>
        </select>
      </div>
      <div class="flex items-center gap-2">
        <input type="checkbox" v-model="sortKeys" id="sort" class="rounded border-surface-300">
        <label for="sort" class="text-xs font-bold text-surface-600 dark:text-surface-400">{{ tool.ui?.option_sort_keys || 'Sort keys' }}</label>
      </div>
    </div>

    <!-- Actions -->
    <div class="mt-4 flex flex-wrap gap-3">
      <button @click="formatJson" class="btn-primary px-5 py-2 text-xs">
        <Icon name="lucide:align-left" class="h-4 w-4 mr-1.5" />
        {{ $t('system.format') }}
      </button>
      <button @click="minifyJson" class="rounded-xl border border-surface-200 bg-white px-4 py-2 text-xs font-bold text-surface-700 hover:bg-surface-50 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-300 dark:hover:bg-surface-700">
        <Icon name="lucide:minimize" class="h-4 w-4 mr-1.5" />
        {{ $t('system.minify') }}
      </button>
      <button @click="validateJson" class="rounded-xl border border-surface-200 bg-white px-4 py-2 text-xs font-bold text-surface-700 hover:bg-surface-50 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-300 dark:hover:bg-surface-700">
        <Icon name="lucide:check" class="h-4 w-4 mr-1.5" />
        {{ $t('system.validate') }}
      </button>
      <button @click="clearAll" class="rounded-xl border border-surface-200 bg-white px-4 py-2 text-xs font-bold text-surface-700 hover:bg-surface-50 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-300 dark:hover:bg-surface-700">
        {{ $t('system.clearAll') }}
      </button>
    </div>

    <!-- Info -->
    <div v-if="info" class="mt-4 rounded-lg bg-blue-50 border border-blue-200 p-3 text-xs text-blue-700 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-400">
      {{ info }}
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ tool: any }>()

const inputJson = ref('')
const outputJson = ref('')
const error = ref('')
const info = ref('')
const indent = ref(2)
const sortKeys = ref(false)

const ui = computed(() => props.tool?.ui || {})

const sortObjectKeys = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map(sortObjectKeys)
  }
  if (typeof obj === 'object' && obj !== null) {
    const sorted: any = {}
    Object.keys(obj).sort().forEach(key => {
      sorted[key] = sortObjectKeys(obj[key])
    })
    return sorted
  }
  return obj
}

const formatJson = () => {
  error.value = ''
  info.value = ''
  try {
    let parsed = JSON.parse(inputJson.value)
    if (sortKeys.value) {
      parsed = sortObjectKeys(parsed)
    }
    outputJson.value = JSON.stringify(parsed, null, indent.value)
  } catch (e) {
    error.value = (e as Error).message
    outputJson.value = ''
  }
}

const minifyJson = () => {
  error.value = ''
  info.value = ''
  try {
    let parsed = JSON.parse(inputJson.value)
    if (sortKeys.value) {
      parsed = sortObjectKeys(parsed)
    }
    outputJson.value = JSON.stringify(parsed)
  } catch (e) {
    error.value = (e as Error).message
    outputJson.value = ''
  }
}

const validateJson = () => {
  error.value = ''
  info.value = ''
  try {
    JSON.parse(inputJson.value)
    info.value = ui.value.status_valid || '✅ Valid JSON'
  } catch (e) {
    error.value = (e as Error).message
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
  error.value = ''
  info.value = ''
}

const clearAll = () => {
  inputJson.value = ''
  outputJson.value = ''
  error.value = ''
  info.value = ''
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
