<template>
  <ResizablePanel v-model:fullscreen="fullscreen" :initial-ratio="0.5" responsive>
    <template #first>
      <div class="h-full pr-3 overflow-hidden">
        <JsonInputEditor
          v-model="inputJson"
          :label="tool.ui?.label_input || 'Input JSON'"
          :error="error"
          placeholder='{"name": "JSON Toolbox", "version": "1.0"}'
          show-upload
          show-load-url
          @clear="clearInput"
        >
          <template #actions>
            <div v-if="hasExamples" ref="exampleMenuRef" class="relative">
              <button @click="showExampleMenu = !showExampleMenu"
                class="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400">
                {{ $t('system.example') }}
              </button>
              <div v-if="showExampleMenu"
                class="absolute right-0 top-full mt-1 bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-lg shadow-lg p-1 z-50 min-w-[140px]">
                <button v-for="ex in examples" :key="ex.id"
                  @click="loadExampleById(ex.id); showExampleMenu = false"
                  class="w-full text-left px-3 py-1.5 text-xs hover:bg-surface-100 dark:hover:bg-surface-700 rounded">
                  {{ getExampleLabel(ex) }}
                </button>
              </div>
            </div>
          </template>
        </JsonInputEditor>
      </div>
    </template>

    <template #second>
      <div class="h-full pl-3 overflow-hidden">
        <JsonOutputPanel
          :label="tool.ui?.label_output || 'Minified JSON'"
          :content="outputJson"
          :error="error"
          view-mode="text"
          :show-view-toggle="false"
          empty-text="Minified output will appear here..."
          download-filename="minified.json"
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
const error = ref('')
const fullscreen = ref(false)
const { examples, hasExamples, getLabel: getExampleLabel, loadById, loadDefault } = useToolExample('json-minifier')
const showExampleMenu = ref(false)
const exampleMenuRef = ref<HTMLElement>()
const loadExampleById = (id: string) => { loadById(id, inputJson) }

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

const clearInput = () => {
  outputJson.value = ''
  error.value = ''
}

const clearAll = () => {
  inputJson.value = ''
  outputJson.value = ''
  error.value = ''
}

const handleClickOutside = (e: MouseEvent) => {
  if (exampleMenuRef.value && !exampleMenuRef.value.contains(e.target as HTMLElement)) showExampleMenu.value = false
}
onMounted(() => { document.addEventListener('click', handleClickOutside); loadDefault(inputJson) })
onUnmounted(() => { document.removeEventListener('click', handleClickOutside) })
</script>
