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
          placeholder='{\n  "name": "JSON Toolbox",\n  "version": "1.0"\n}'
        ></textarea>
      </div>

      <!-- Output -->
      <div>
        <div class="flex items-center justify-between mb-2">
          <label class="text-sm font-bold text-surface-700 dark:text-surface-300">{{ tool.ui?.label_output || 'Minified Output' }}</label>
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
            :placeholder="tool.ui?.placeholder_output || 'Minified output will appear here...'"
          ></textarea>
          <div v-if="error" class="absolute bottom-2 left-2 right-2 rounded-lg bg-red-50 border border-red-200 p-2 text-xs text-red-700 dark:bg-red-900/30 dark:border-red-800 dark:text-red-400">
            {{ error }}
          </div>
        </div>
      </div>
    </div>

    <!-- Stats -->
    <div v-if="outputJson && !error" class="mt-4 flex flex-wrap gap-3">
      <div class="stat-chip">
        <Icon name="lucide:file-text" class="h-3 w-3" />
        {{ inputSize }} {{ tool.ui?.unit_chars || 'chars' }}
      </div>
      <div class="stat-chip">
        <Icon name="lucide:minimize" class="h-3 w-3" />
        {{ outputSize }} {{ tool.ui?.unit_chars || 'chars' }}
      </div>
      <div class="stat-chip" :class="compressionRatio > 0 ? 'text-green-600 dark:text-green-400' : ''">
        <Icon name="lucide:trending-down" class="h-3 w-3" />
        {{ compressionRatio }}% {{ tool.ui?.unit_smaller || 'smaller' }}
      </div>
    </div>

    <!-- Actions -->
    <div class="mt-4 flex flex-wrap gap-3">
      <button @click="minifyJson" class="btn-primary px-5 py-2 text-xs">
        <Icon name="lucide:minimize" class="h-4 w-4 mr-1.5" />
        {{ $t('system.minify') }}
      </button>
      <button @click="beautifyInput" class="rounded-xl border border-surface-200 bg-white px-4 py-2 text-xs font-bold text-surface-700 hover:bg-surface-50 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-300 dark:hover:bg-surface-700">
        <Icon name="lucide:align-left" class="h-4 w-4 mr-1.5" />
        {{ tool.ui?.btn_beautify || 'Beautify First' }}
      </button>
      <button @click="clearAll" class="rounded-xl border border-surface-200 bg-white px-4 py-2 text-xs font-bold text-surface-700 hover:bg-surface-50 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-300 dark:hover:bg-surface-700">
        {{ $t('system.clearAll') }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ tool: any }>()

const inputJson = ref('')
const outputJson = ref('')
const error = ref('')

const inputSize = computed(() => inputJson.value.length)
const outputSize = computed(() => outputJson.value.length)
const compressionRatio = computed(() => {
  if (!inputJson.value || !outputJson.value) return 0
  return Math.round((1 - outputJson.value.length / inputJson.value.length) * 100)
})

const minifyJson = () => {
  error.value = ''
  try {
    const parsed = JSON.parse(inputJson.value)
    outputJson.value = JSON.stringify(parsed)
  } catch (e) {
    error.value = (e as Error).message
    outputJson.value = ''
  }
}

const beautifyInput = () => {
  error.value = ''
  try {
    const parsed = JSON.parse(inputJson.value)
    inputJson.value = JSON.stringify(parsed, null, 2)
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
}

const clearAll = () => {
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
  link.download = 'minified.json'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
</script>
