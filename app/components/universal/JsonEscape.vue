<template>
  <ResizablePanel v-model:fullscreen="fullscreen" :initial-ratio="0.5" responsive>
    <template #first>
      <div class="h-full pr-3 overflow-hidden">
        <JsonInputEditor v-model="inputText" :label="tool.ui?.label_input || 'Input Text'"
          placeholder='Paste or type text to escape/unescape...' show-upload show-load-url @clear="clearInput">
          <template #actions>
            <div v-if="hasExamples" ref="exampleMenuRef" class="relative">
              <button
                @click="showExampleMenu = !showExampleMenu"
                class="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400"
              >
                {{ $t('system.example') }}
              </button>
              <div v-if="showExampleMenu" class="absolute left-0 top-full mt-1 bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-lg shadow-lg p-1 z-50 min-w-[140px]">
                <button
                  v-for="ex in examples"
                  :key="ex.id"
                  @click="loadExampleById(ex.id); showExampleMenu = false"
                  class="w-full text-left px-3 py-1.5 text-xs hover:bg-surface-100 dark:hover:bg-surface-700 rounded"
                >
                  {{ getExampleLabel(ex) }}
                </button>
              </div>
            </div>
          </template>
        </JsonInputEditor>
      </div>
    </template>
    <template #second>
      <div class="h-full pl-3 flex flex-col overflow-hidden">
        <JsonOutputPanel :label="tool.ui?.label_output || 'Output'" :content="outputText" :error="error"
          view-mode="text" :show-view-toggle="false" empty-text="Output will appear here..."
          download-filename="output.txt" />
      </div>
    </template>
    <template #toolbar-left>
      <button @click="escapeText" class="btn-primary px-5 py-2 text-xs">
        <Icon name="lucide:lock" class="h-4 w-4 mr-1.5" />
        Escape
      </button>
      <button @click="unescapeText" class="rounded-xl border border-surface-200 bg-white px-4 py-2 text-xs font-bold text-surface-700 hover:bg-surface-50 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-300 dark:hover:bg-surface-700">
        <Icon name="lucide:lock-open" class="h-4 w-4 mr-1.5" />
        Unescape
      </button>
      <button @click="swap" class="rounded-xl border border-surface-200 bg-white px-4 py-2 text-xs font-bold text-surface-700 hover:bg-surface-50 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-300 dark:hover:bg-surface-700">
        <Icon name="lucide:arrow-left-right" class="h-4 w-4" />
      </button>
      <button @click="clearAll" class="rounded-xl border border-surface-200 bg-white px-4 py-2 text-xs font-bold text-surface-700 hover:bg-surface-50 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-300 dark:hover:bg-surface-700">
        {{ $t('system.clearAll') }}
      </button>
    </template>
  </ResizablePanel>
</template>

<script setup lang="ts">
const props = defineProps<{ tool: any }>()

const inputText = ref('')
const outputText = ref('')
const error = ref('')
const fullscreen = ref(false)

const { examples, hasExamples, getLabel: getExampleLabel, loadById } = useToolExample('json-escape')
const showExampleMenu = ref(false)
const exampleMenuRef = ref<HTMLElement>()

const loadExampleById = (id: string) => {
  loadById(id, inputText)
}

const escapeText = () => {
  if (!inputText.value) { error.value = 'No input'; return }
  outputText.value = inputText.value.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\t/g, '\\t')
  error.value = ''
}

const unescapeText = () => {
  if (!inputText.value) { error.value = 'No input'; return }
  try {
    outputText.value = JSON.parse('"' + inputText.value.replace(/\\n/g, '\\n').replace(/\\r/g, '\\r').replace(/\\t/g, '\\t') + '"')
    error.value = ''
  } catch (e) {
    error.value = (e as Error).message
  }
}

const swap = () => {
  const t = inputText.value
  inputText.value = outputText.value
  outputText.value = t
}

const clearInput = () => {
  inputText.value = ''
  outputText.value = ''
  error.value = ''
}

const clearAll = () => {
  inputText.value = ''
  outputText.value = ''
  error.value = ''
}

// Close example menu on outside click
const handleClickOutside = (e: MouseEvent) => {
  if (exampleMenuRef.value && !exampleMenuRef.value.contains(e.target as HTMLElement)) {
    showExampleMenu.value = false
  }
}
onMounted(() => { document.addEventListener('click', handleClickOutside) })
onUnmounted(() => { document.removeEventListener('click', handleClickOutside) })
</script>
