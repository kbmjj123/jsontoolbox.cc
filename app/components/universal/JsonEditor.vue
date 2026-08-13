<template>
  <div>
    <!-- Full-width editor -->
    <JsonInputEditor
      v-model="inputJson"
      :label="tool.ui?.label_input || 'JSON Editor'"
      placeholder='{"name": "JSON Toolbox", "version": "1.0"}'
      height="h-80"
      show-upload
      @clear="clearAll"
    />

    <!-- Toolbar -->
    <div class="mt-4 flex flex-wrap items-center gap-4">
      <div class="flex items-center gap-2">
        <label class="text-xs font-bold text-surface-600 dark:text-surface-400">{{ tool.ui?.option_indent || 'Indent:' }}</label>
        <select v-model="indent" class="rounded-lg border border-surface-200 bg-white px-2 py-1 text-xs dark:border-surface-700 dark:bg-surface-800">
          <option :value="1">1 space</option>
          <option :value="2">{{ tool.ui?.option_indent_2 || '2 spaces' }}</option>
          <option :value="3">3 spaces</option>
          <option :value="4">{{ tool.ui?.option_indent_4 || '4 spaces' }}</option>
          <option :value="6">6 spaces</option>
          <option :value="8">8 spaces</option>
          <option value="tab">Tab</option>
          <option :value="0">{{ tool.ui?.option_indent_minified || 'Minified' }}</option>
        </select>
      </div>
      <label class="flex items-center gap-1.5 cursor-pointer select-none">
        <input type="checkbox" v-model="sortKeys" class="rounded border-surface-300">
        <span class="text-xs font-bold text-surface-600 dark:text-surface-400">{{ tool.ui?.option_sort_keys || 'Sort keys' }}</span>
      </label>
    </div>

    <!-- Actions -->
    <div class="mt-3 flex flex-wrap gap-3">
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
      <button @click="loadExample" class="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400">
        Load Example
      </button>
      <NuxtLinkLocale to="/tools/convert/json-schema-generator" class="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400">
        Generate Schema
      </NuxtLinkLocale>
      <button @click="clearAll" class="rounded-xl border border-surface-200 bg-white px-4 py-2 text-xs font-bold text-surface-700 hover:bg-surface-50 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-300 dark:hover:bg-surface-700">
        {{ $t('system.clearAll') }}
      </button>
    </div>

    <!-- Result panel -->
    <div v-if="outputJson || error || info" class="mt-4">
      <div class="flex items-center justify-between mb-2">
        <label class="text-sm font-bold text-surface-700 dark:text-surface-300">{{ tool.ui?.label_output || 'Output' }}</label>
        <div v-if="outputJson" class="flex gap-2">
          <button @click="copyOutput" class="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400">
            {{ $t('system.copy') }}
          </button>
          <button @click="downloadOutput" class="text-xs text-surface-500 hover:text-surface-700 dark:text-surface-400">
            {{ $t('system.download') }}
          </button>
        </div>
      </div>

      <!-- Success/info -->
      <div v-if="info" class="rounded-lg bg-blue-50 border border-blue-200 p-3 text-xs text-blue-700 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-400">
        {{ info }}
      </div>

      <!-- Error -->
      <div v-else-if="error" class="rounded-lg bg-red-50 border border-red-200 p-3 text-xs text-red-700 dark:bg-red-900/30 dark:border-red-800 dark:text-red-400">
        {{ error }}
      </div>

      <!-- Output content -->
      <div v-else-if="outputJson" class="rounded-xl border border-surface-200 bg-surface-50 p-4 font-mono text-sm text-surface-900 overflow-auto max-h-80 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-100">
        <pre class="whitespace-pre-wrap">{{ outputJson }}</pre>

        <!-- Smart Type Detection Summary -->
        <div v-if="detectedTypes.length > 0" class="mt-4 pt-4 border-t border-surface-200 dark:border-surface-700">
          <p class="text-xs font-bold text-surface-600 dark:text-surface-400 mb-2">Detected Types:</p>
          <div class="flex flex-wrap gap-2">
            <span
              v-for="item in detectedTypes"
              :key="item.path"
              class="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs"
              :class="{
                'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400': item.type === 'url',
                'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400': item.type === 'image',
                'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400': item.type === 'email',
                'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400': item.type === 'date',
                'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400': item.type === 'color',
              }"
            >
              <Icon :name="getTypeIcon(item.type)" class="h-3 w-3" />
              {{ item.path }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ tool: any }>()

const inputJson = ref('')
const outputJson = ref('')
const error = ref('')
const info = ref('')
const indent = ref<number | string>(2)
const sortKeys = ref(false)

const ui = computed(() => props.tool?.ui || {})

// Example data
const exampleJson = {
  user: {
    id: 1234567890123456789,
    name: "John Doe",
    email: "john@example.com",
    avatar: "https://example.com/avatar.jpg",
    website: "https://example.com",
    birthday: "1990-01-15",
    favoriteColor: "#3498db",
    isActive: true,
    tags: ["developer", "designer"],
    address: {
      city: "New York",
      country: "USA"
    }
  }
}

// Use smart JSON value detection composable
const parsedOutput = computed(() => {
  if (!outputJson.value) return null
  try {
    return JSON.parse(outputJson.value)
  } catch {
    return null
  }
})

const { detectedTypes, getTypeIcon } = useSmartJsonValue(parsedOutput)

const loadExample = () => {
  inputJson.value = JSON.stringify(exampleJson, null, 2)
  formatJson()
}

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
    const space = indent.value === 'tab' ? '\t' : Number(indent.value)
    outputJson.value = JSON.stringify(parsed, null, space)
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
  outputJson.value = ''
  try {
    JSON.parse(inputJson.value)
    info.value = ui.value.status_valid || '✅ Valid JSON'
  } catch (e) {
    error.value = (e as Error).message
  }
}

const clearAll = () => {
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
