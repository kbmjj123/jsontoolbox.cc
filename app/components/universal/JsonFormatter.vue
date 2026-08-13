<template>
  <div>
    <!-- Input / Output resizable split -->
    <ResizablePanel :initial-ratio="0.5">
      <template #first>
        <div class="pr-2">
          <JsonInputEditor
            v-model="inputJson"
            :label="tool.ui?.label_input || 'Input JSON'"
            placeholder='{"name": "JSON Toolbox", "version": "1.0"}'
            show-upload
            @clear="clearAll"
            @paste="onInputPaste"
          />
        </div>
      </template>
      <template #second>
        <div class="pl-2">
          <div class="flex items-center justify-between mb-2">
            <label class="text-sm font-bold text-surface-700 dark:text-surface-300">{{ tool.ui?.label_output || 'Output' }}</label>
            <div class="flex gap-2">
              <!-- View mode toggle -->
              <div class="flex rounded-lg border border-surface-200 dark:border-surface-700 overflow-hidden">
                <button
                  @click="viewMode = 'text'"
                  :class="viewMode === 'text' ? 'bg-primary-600 text-white' : 'bg-white text-surface-600 dark:bg-surface-800 dark:text-surface-400'"
                  class="px-2 py-0.5 text-xs transition-colors"
                >
                  Text
                </button>
                <button
                  @click="viewMode = 'tree'"
                  :class="viewMode === 'tree' ? 'bg-primary-600 text-white' : 'bg-white text-surface-600 dark:bg-surface-800 dark:text-surface-400'"
                  class="px-2 py-0.5 text-xs transition-colors"
                >
                  Tree
                </button>
              </div>
              <button @click="copyOutput" class="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400">
                {{ $t('system.copy') }}
              </button>
              <button @click="downloadOutput" class="text-xs text-surface-500 hover:text-surface-700 dark:text-surface-400">
                {{ $t('system.download') }}
              </button>
            </div>
          </div>

          <!-- Text view -->
          <div v-if="viewMode === 'text'" class="relative">
            <pre class="w-full h-64 rounded-xl border border-surface-200 bg-surface-50 p-4 font-mono text-sm text-surface-900 overflow-auto dark:border-surface-700 dark:bg-surface-800 dark:text-surface-100">{{ outputJson }}</pre>
            <div v-if="error" class="absolute bottom-2 left-2 right-2 rounded-lg bg-red-50 border border-red-200 p-2 text-xs text-red-700 dark:bg-red-900/30 dark:border-red-800 dark:text-red-400">
              {{ error }}
            </div>
          </div>

          <!-- Tree view -->
          <div v-else class="h-64 overflow-auto rounded-xl border border-surface-200 bg-surface-50 p-4 dark:border-surface-700 dark:bg-surface-800">
            <TreeNode
              v-if="parsedData !== null"
              :data="parsedData"
              :path="''"
              :search="''"
              @copy="copyPath"
            />
            <div v-else class="flex items-center justify-center h-full text-surface-400 text-sm">
              {{ error || 'Paste JSON and click Format' }}
            </div>
          </div>
        </div>
      </template>
    </ResizablePanel>

    <!-- Load from URL -->
    <div class="mt-3">
      <button
        v-if="!showUrlInput"
        @click="showUrlInput = true"
        class="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400"
      >
        {{ $t('system.loadUrl') }}
      </button>
      <div v-else class="flex items-center gap-2">
        <input
          v-model="urlToFetch"
          type="url"
          placeholder="https://api.example.com/data.json"
          class="flex-1 rounded-lg border border-surface-200 bg-white px-3 py-1.5 text-xs dark:border-surface-700 dark:bg-surface-800 dark:text-surface-100"
          @keydown.enter="fetchFromUrl"
        />
        <button
          @click="fetchFromUrl"
          :disabled="urlLoading"
          class="btn-primary px-3 py-1.5 text-xs disabled:opacity-50"
        >
          {{ urlLoading ? '...' : $t('system.fetch') }}
        </button>
        <button
          @click="showUrlInput = false; urlError = ''"
          class="text-xs text-surface-500 hover:text-surface-700 dark:text-surface-400"
        >
          {{ $t('system.close') }}
        </button>
      </div>
      <p v-if="urlError" class="mt-1 text-xs text-red-600 dark:text-red-400">{{ urlError }}</p>
    </div>

    <!-- Options -->
    <div class="mt-4 flex flex-wrap items-center gap-4">
      <div class="flex items-center gap-2">
        <label class="text-xs font-bold text-surface-600 dark:text-surface-400">{{ tool.ui?.option_indent || 'Indent:' }}</label>
        <select v-model="indent" class="rounded-lg border border-surface-200 bg-white px-2 py-1 text-xs dark:border-surface-700 dark:bg-surface-800">
          <option :value="1">1 space</option>
          <option :value="2">{{ tool.ui?.option_2_spaces || '2 spaces' }}</option>
          <option :value="3">3 spaces</option>
          <option :value="4">{{ tool.ui?.option_4_spaces || '4 spaces' }}</option>
          <option :value="6">6 spaces</option>
          <option :value="8">8 spaces</option>
          <option value="tab">Tab</option>
          <option :value="0">{{ tool.ui?.option_minified || 'Minified' }}</option>
        </select>
      </div>

      <button @click="formatJson" class="btn-primary px-4 py-2 text-xs">
        {{ $t('system.format') }}
      </button>
      <button @click="minifyJson" class="rounded-xl border border-surface-200 bg-white px-4 py-2 text-xs font-bold text-surface-700 hover:bg-surface-50 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-300">
        {{ $t('system.minify') }}
      </button>
      <button @click="validateJson" class="rounded-xl border border-surface-200 bg-white px-4 py-2 text-xs font-bold text-surface-700 hover:bg-surface-50 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-300">
        {{ $t('system.validate') }}
      </button>

      <!-- Auto-format toggle -->
      <label class="flex items-center gap-1.5 ml-auto cursor-pointer select-none">
        <span class="text-xs text-surface-600 dark:text-surface-400">{{ $t('system.autoFormat') }}</span>
        <button
          @click="autoFormat = !autoFormat"
          :class="autoFormat ? 'bg-primary-600' : 'bg-surface-300 dark:bg-surface-600'"
          class="relative inline-flex h-5 w-9 items-center rounded-full transition-colors"
        >
          <span
            :class="autoFormat ? 'translate-x-4' : 'translate-x-0.5'"
            class="inline-block h-4 w-4 rounded-full bg-white transition-transform"
          ></span>
        </button>
      </label>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ tool: any }>()

const inputJson = ref('')
const outputJson = ref('')
const error = ref('')
const indent = ref<number | string>(2)
const autoFormat = ref(false)
const viewMode = ref<'text' | 'tree'>('text')
const showUrlInput = ref(false)
const urlToFetch = ref('')
const urlLoading = ref(false)
const urlError = ref('')

const fetchFromUrl = async () => {
  const url = urlToFetch.value.trim()
  if (!url) return

  urlLoading.value = true
  urlError.value = ''
  try {
    const res = await fetch(url)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const text = await res.text()
    // Try to parse to validate it's JSON
    JSON.parse(text)
    inputJson.value = text
    showUrlInput.value = false
    urlToFetch.value = ''
  } catch (e) {
    urlError.value = (e as Error).message
  } finally {
    urlLoading.value = false
  }
}

const parsedData = computed(() => {
  try {
    return JSON.parse(inputJson.value)
  } catch {
    return null
  }
})

const copyPath = async (path: string) => {
  try {
    await navigator.clipboard.writeText(path)
  } catch {}
}

const formatJson = () => {
  try {
    const parsed = JSON.parse(inputJson.value)
    const space = indent.value === 'tab' ? '\t' : Number(indent.value)
    outputJson.value = JSON.stringify(parsed, null, space)
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

const clearAll = () => {
  outputJson.value = ''
  error.value = ''
}

const onInputPaste = () => {
  if (autoFormat.value) {
    nextTick(() => formatJson())
  }
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
