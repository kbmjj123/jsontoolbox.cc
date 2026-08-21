<template>
  <ResizablePanel v-model:fullscreen="fullscreen" :initial-ratio="0.5" responsive>
    <template #first>
      <div class="h-full pr-3">
        <JsonOutputPanel
          v-model:view-mode="inputViewMode"
          :label="tool.ui?.label_input || 'Input Text'"
          :content="inputText"
          :parsed-data="parsedInputData"
          :error="inputError"
          :editable="true"
          :show-edit-actions="false"
          :show-copy="false"
          :show-download="false"
          placeholder='Paste JSON or text to escape/unescape...'
          empty-text="Paste your text here"
          @update:content="inputText = $event"
        />
      </div>
    </template>
    <template #second>
      <div class="h-full pl-3">
        <JsonOutputPanel
          :label="tool.ui?.label_output || 'Escaped JSON'"
          :content="outputText"
          :error="error"
          :empty-text="tool.ui?.placeholder_output || 'Output will appear here...'"
          download-filename="output.txt"
          @copy="copyOutput"
          @download="downloadOutput"
        />
      </div>
    </template>

    <template #toolbar-left>
      <button @click="escapeJson" class="btn-primary px-5 py-2 text-xs">
        <Icon name="lucide:lock" class="h-4 w-4 mr-1.5" />
        {{ tool.ui?.btn_escape || 'Escape' }}
      </button>
      <button @click="unescapeJson" class="rounded-xl border border-surface-200 bg-white px-4 py-2 text-xs font-bold text-surface-700 hover:bg-surface-50 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-300 dark:hover:bg-surface-700">
        <Icon name="lucide:unlock" class="h-4 w-4 mr-1.5" />
        {{ tool.ui?.btn_unescape || 'Unescape' }}
      </button>
      <button @click="swap" class="rounded-xl border border-surface-200 bg-white px-4 py-2 text-xs font-bold text-surface-700 hover:bg-surface-50 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-300 dark:hover:bg-surface-700">
        <Icon name="lucide:arrow-left-right" class="h-4 w-4 mr-1.5" />
        {{ tool.ui?.btn_swap || 'Swap' }}
      </button>
      <button @click="loadExample" class="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400">
        Load Example
      </button>
      <button @click="clearAll" class="rounded-xl border border-surface-200 bg-white px-4 py-2 text-xs font-bold text-surface-700 hover:bg-surface-50 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-300 dark:hover:bg-surface-700">
        {{ $t('system.clearAll') }}
      </button>
    </template>
  </ResizablePanel>
</template>

<script setup lang="ts">
defineProps<{ tool: any }>()

const inputText = ref('')
const outputText = ref('')

const inputError = ref('')
const inputViewMode = ref<'text' | 'rich'>('text')

const parsedInputData = computed(() => {
  if (!inputText.value.trim()) return null
  try { return JSON.parse(inputText.value) } catch { return null }
})
const error = ref('')
const fullscreen = ref(false)

const escapeJson = () => {
  error.value = ''
  try {
    outputText.value = JSON.stringify(inputText.value)
  } catch (e) {
    error.value = (e as Error).message
    outputText.value = ''
  }
}

const unescapeJson = () => {
  error.value = ''
  try {
    outputText.value = JSON.parse(inputText.value)
  } catch (e) {
    error.value = (e as Error).message
    outputText.value = ''
  }
}

const swap = () => {
  const temp = inputText.value
  inputText.value = outputText.value
  outputText.value = temp
}

const clearAll = () => {
  outputText.value = ''
  error.value = ''
}

const loadExample = () => {
  inputText.value = '{"message": "Hello \\"World\\"", "path": "C:\\\\Users\\\\file.txt", "newline": "line1\\nline2"}'
  escapeJson()
}

const copyOutput = async () => {
  try {
    await navigator.clipboard.writeText(outputText.value)
  } catch (e) {
    console.error('Failed to copy:', e)
  }
}

const downloadOutput = () => {
  const blob = new Blob([outputText.value], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'output.txt'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
</script>
