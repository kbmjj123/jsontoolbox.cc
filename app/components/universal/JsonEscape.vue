<template>
  <ResizablePanel v-model:fullscreen="fullscreen" :initial-ratio="0.5" responsive>
    <template #first>
      <div class="h-full pr-3 overflow-hidden">
        <JsonInputEditor
          v-model="inputText"
          :label="tool.ui?.label_input || 'Input Text'"
          placeholder='Paste or type text to escape/unescape...'
          show-upload
          show-load-url
          @clear="clearAll"
        />
      </div>
    </template>

    <template #second>
      <div class="h-full pl-3 overflow-hidden">
        <JsonOutputPanel
          :label="tool.ui?.label_output || 'Output'"
          :content="outputText"
          :error="error"
          view-mode="text"
          :show-view-toggle="false"
          empty-text="Output will appear here..."
          download-filename="output.txt"
        />
      </div>
    </template>

    <template #toolbar-left>
      <button @click="escapeText" class="btn-primary px-5 py-2 text-xs">
        <Icon name="lucide:lock" class="h-4 w-4 mr-1.5" />
        {{ tool.ui?.btn_escape || 'Escape' }}
      </button>
      <button @click="unescapeText" class="rounded-xl border border-surface-200 bg-white px-4 py-2 text-xs font-bold text-surface-700 hover:bg-surface-50 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-300 dark:hover:bg-surface-700">
        <Icon name="lucide:unlock" class="h-4 w-4 mr-1.5" />
        {{ tool.ui?.btn_unescape || 'Unescape' }}
      </button>
      <button @click="swap" class="rounded-xl border border-surface-200 bg-white px-4 py-2 text-xs font-bold text-surface-700 hover:bg-surface-50 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-300 dark:hover:bg-surface-700">
        <Icon name="lucide:arrow-left-right" class="h-4 w-4 mr-1.5" />
        {{ tool.ui?.btn_swap || 'Swap' }}
      </button>
      <button @click="loadExample" class="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400">
        {{ $t('system.example') }}
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
const error = ref('')
const fullscreen = ref(false)

const escapeText = () => {
  error.value = ''
  try {
    outputText.value = JSON.stringify(inputText.value)
  } catch (e) {
    error.value = (e as Error).message
    outputText.value = ''
  }
}

const unescapeText = () => {
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
  inputText.value = ''
  outputText.value = ''
  error.value = ''
}

const loadExample = () => {
  inputText.value = '{"message": "Hello \\"World\\"", "path": "C:\\\\Users\\\\file.txt", "newline": "line1\\nline2"}'
  escapeText()
}
</script>
