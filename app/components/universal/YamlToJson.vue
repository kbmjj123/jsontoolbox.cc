<template>
  <ResizablePanel v-model:fullscreen="fullscreen" :initial-ratio="0.5" responsive>
    <template #first>
      <div class="h-full pr-3 overflow-hidden">
        <JsonInputEditor
          ref="inputEditorRef"
          v-model="inputYaml"
          :label="tool.ui?.label_input || 'Input YAML'"
          placeholder="name: JSON Toolbox\nversion: 1.0"
          show-upload
          show-load-url
          example-slug="yaml-to-json"
          @clear="clearAll"
          @paste="onPaste"
          @example-loaded="onExampleLoaded"
        />
      </div>
    </template>

    <template #second>
      <div class="h-full pl-3 flex flex-col overflow-hidden">
        <JsonOutputPanel
          :label="tool.ui?.label_output || 'JSON Output'"
          :content="outputJson"
          :error="error"
          :empty-text="tool.ui?.placeholder_output || 'JSON output will appear here...'"
          highlight="json"
          download-filename="output.json"
          @copy="copyOutput"
          @download="downloadOutput"
        />
      </div>
    </template>

    <template #toolbar-left>
      <button @click="convertToJson" class="btn-primary px-5 py-2 text-xs">
        <Icon name="lucide:arrow-right" class="h-4 w-4 mr-1.5" />
        {{ tool.ui?.btn_convert || 'Convert to JSON' }}
      </button>

      <div class="flex items-center gap-2">
        <label class="text-xs font-bold text-surface-600 dark:text-surface-400">{{ tool.ui?.option_indent || 'Indent:' }}</label>
        <select v-model="indent" class="rounded-lg border border-surface-200 bg-white px-2 py-1 text-xs dark:border-surface-700 dark:bg-surface-800">
          <option :value="2">2 spaces</option>
          <option :value="4">4 spaces</option>
        </select>
      </div>
    </template>
  </ResizablePanel>
</template>

<script setup lang="ts">
import yaml from 'js-yaml'

const props = defineProps<{ tool: any }>()

const inputYaml = ref('')
const outputJson = ref('')
const error = ref('')
const indent = ref(2)
const fullscreen = ref(false)

const inputEditorRef = ref<InstanceType<typeof import('~/components/tool/JsonInputEditor.vue').default>>()

// Auto-convert on input change (debounced 300ms)
const debouncedConvert = useDebounceFn(() => { convertToJson() }, 300)
watch(inputYaml, () => {
  debouncedConvert()
})

// Re-convert when indent changes
watch(indent, () => {
  if (inputYaml.value.trim()) convertToJson()
})

const onExampleLoaded = () => { nextTick(() => convertToJson()) }
const onPaste = () => { nextTick(() => convertToJson()) }

const convertToJson = () => {
  error.value = ''
  if (!inputYaml.value.trim()) { outputJson.value = ''; return }
  try {
    const parsed = yaml.load(inputYaml.value)
    outputJson.value = JSON.stringify(parsed, null, indent.value)
  } catch (e) {
    error.value = (e as Error).message
    outputJson.value = ''
  }
}

const clearAll = () => { outputJson.value = ''; error.value = '' }

const copyOutput = async () => { await copyToClipboard(outputJson.value) }

const downloadOutput = () => {
  const blob = new Blob([outputJson.value], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url; link.download = 'output.json'
  document.body.appendChild(link); link.click(); document.body.removeChild(link); URL.revokeObjectURL(url)
}
</script>
