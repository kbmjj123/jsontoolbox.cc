<template>
  <ResizablePanel v-model:fullscreen="fullscreen" :initial-ratio="0.5" responsive>
    <template #first>
      <div class="h-full pr-3">
        <JsonInputEditor
          v-model="inputJson"
          :label="tool.ui?.label_input || 'Input JSON'"
          placeholder='{"name": "JSON Toolbox", "version": "1.0"}'
          show-upload
          show-load-url
          @clear="clearAll"
        />
      </div>
    </template>
    <template #second>
      <div class="h-full pl-3">
        <JsonOutputPanel
          :label="tool.ui?.label_output || 'YAML Output'"
          :content="outputYaml"
          :error="error"
          :empty-text="tool.ui?.placeholder_output || 'YAML output will appear here...'"
          download-filename="output.yaml"
          @copy="copyOutput"
          @download="downloadOutput"
        />
      </div>
    </template>

    <template #toolbar-left>
      <button @click="convertToYaml" class="btn-primary px-5 py-2 text-xs">
        <Icon name="lucide:arrow-right" class="h-4 w-4 mr-1.5" />
        {{ tool.ui?.btn_convert || 'Convert to YAML' }}
      </button>
      <button @click="clearAll" class="rounded-xl border border-surface-200 bg-white px-4 py-2 text-xs font-bold text-surface-700 hover:bg-surface-50 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-300 dark:hover:bg-surface-700">
        {{ $t('system.clearAll') }}
      </button>
      <div class="flex items-center gap-2">
        <label class="text-xs text-surface-600 dark:text-surface-400">Indent:</label>
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

const inputJson = ref('')
const outputYaml = ref('')
const error = ref('')
const indent = ref(2)
const fullscreen = ref(false)

const { copyToClipboard } = useClipboard()
const { loadDataFromUrl } = useUrlParams()

onMounted(() => {
  const urlData = loadDataFromUrl('json') || loadDataFromUrl('data')
  if (urlData) {
    inputJson.value = urlData
    nextTick(() => convertToYaml())
  }
})

const convertToYaml = () => {
  error.value = ''
  try {
    const parsed = JSON.parse(inputJson.value)
    outputYaml.value = yaml.dump(parsed, {
      indent: indent.value,
      lineWidth: -1,
      noRefs: true,
    })
  } catch (e) {
    error.value = (e as Error).message
    outputYaml.value = ''
  }
}

const clearAll = () => {
  outputYaml.value = ''
  error.value = ''
}

const copyOutput = async () => {
  await copyToClipboard(outputYaml.value)
}

const downloadOutput = () => {
  const blob = new Blob([outputYaml.value], { type: 'text/yaml' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'output.yaml'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
</script>
