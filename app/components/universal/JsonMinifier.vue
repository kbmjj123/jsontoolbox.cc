<template>
  <ResizablePanel v-model:fullscreen="fullscreen" :initial-ratio="0.5" responsive>
    <template #first>
      <div class="h-full pr-3">
        <JsonOutputPanel
          v-model:view-mode="inputViewMode"
          :label="tool.ui?.label_input || 'Input JSON'"
          :content="inputJson"
          :parsed-data="parsedInputData"
          :error="inputError"
          :editable="true"
          :show-edit-actions="false"
          :show-copy="false"
          :show-download="false"
          placeholder='{"name": "JSON Toolbox", "version": "1.0"}'
          empty-text="Paste your JSON here"
          @update:content="inputJson = $event"
          @format="onFormat"
          @minify="onMinify"
          @validate="onValidate"
          @fix="onFix"
          @paste="onPaste"
        />
      </div>
    </template>
    <template #second>
      <div class="h-full pl-3">
        <JsonOutputPanel
          :label="tool.ui?.label_output || 'Minified JSON'"
          :content="outputJson"
          :error="error"
          :empty-text="tool.ui?.placeholder_output || 'Minified output will appear here...'"
          download-filename="minified.json"
          @copy="copyOutput"
          @download="downloadOutput"
        />
      </div>
    </template>

    <template #toolbar-left>
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

      <!-- Stats -->
      <template v-if="outputJson && !error">
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
      </template>
    </template>
  </ResizablePanel>
</template>

<script setup lang="ts">
defineProps<{ tool: any }>()

const inputJson = ref('')
const outputJson = ref('')

const inputError = ref('')
const inputViewMode = ref<'text' | 'rich'>('text')

const parsedInputData = computed(() => {
  if (!inputJson.value.trim()) return null
  try { return JSON.parse(inputJson.value) } catch { return null }
})
const error = ref('')
const fullscreen = ref(false)

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

const clearAll = () => {
  outputJson.value = ''
  error.value = ''
}

const copyOutput = async () => {
  await copyToClipboard(outputJson.value)
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
