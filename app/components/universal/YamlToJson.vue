<template>
  <ResizablePanel v-model:fullscreen="fullscreen" :initial-ratio="0.5" responsive>
    <template #first>
      <div class="h-full pr-3 overflow-hidden">
        <JsonInputEditor
          ref="inputEditorRef"
          v-model="inputYaml"
          :label="props.tool.ui?.label_input"
          placeholder="name: JSON Toolbox\nversion: 1.0"
          show-upload
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
          :label="props.tool.ui?.label_output"
          :content="outputJson"
          :error="error"
          :empty-text="props.tool.ui?.placeholder_output"
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
        {{ props.tool.ui?.btn_convert }}
      </button>

      <div class="flex items-center gap-2">
        <label class="text-xs font-bold text-surface-600 dark:text-surface-400">{{ props.tool.ui?.option_indent }}</label>
        <select v-model="indent" class="rounded-lg border border-surface-200 bg-white px-2 py-1 text-xs dark:border-surface-700 dark:bg-surface-800">
          <option :value="2">{{ props.tool.ui?.option_indent_2 }}</option>
          <option :value="4">{{ props.tool.ui?.option_indent_4 }}</option>
          <option :value="0">{{ props.tool.ui?.option_indent_minified }}</option>
        </select>
      </div>

      <span v-if="docCount > 1" class="text-xs text-surface-500 dark:text-surface-400">
        {{ (props.tool.ui?.status_multi_document).replace('{count}', String(docCount)) }}
      </span>
    </template>
  </ResizablePanel>
</template>

<script setup lang="ts">
import yaml from 'js-yaml'

const props = defineProps<{ tool: any }>()
const { t } = useI18n()
const toast = useToast()

const inputYaml = ref('')
onMounted(() => {
  const text = useJsonInbox().consumeInbox()
  if (text != null) inputYaml.value = text
})
const outputJson = ref('')
const error = ref('')
const indent = ref(2)
const docCount = ref(0)
const fullscreen = ref(false)

const inputEditorRef = ref<InstanceType<typeof import('~/components/tool/JsonInputEditor.vue').default>>()

// Auto-convert on input change (debounced 300ms)
const debouncedConvert = useDebounceFn(() => { convertToJson(true) }, 300)
watch(inputYaml, () => {
  debouncedConvert()
})

// Re-convert when indent changes
watch(indent, () => {
  if (inputYaml.value.trim()) convertToJson()
})

const onExampleLoaded = () => { nextTick(() => convertToJson()) }
const onPaste = () => { nextTick(() => convertToJson()) }

const serialize = (data: unknown) => indent.value === 0
  ? JSON.stringify(data)
  : JSON.stringify(data, null, indent.value)

/** js-yaml throws YAMLException with a `mark` carrying 0-based line/column. */
const describeError = (e: unknown) => {
  const raw = (e as Error).message || String(e)
  const mark = (e as { mark?: { line?: number, column?: number } }).mark
  const location = (props.tool.ui?.error_location)
    .replace('{line}', String((mark?.line ?? 0) + 1))
    .replace('{column}', String((mark?.column ?? 0) + 1))
  return mark ? `${raw} (${location})` : raw
}

const convertToJson = (silent = false) => {
  error.value = ''
  docCount.value = 0
  if (!inputYaml.value.trim()) { outputJson.value = ''; return }
  try {
    const docs = yaml.loadAll(inputYaml.value)
    if (docs.length === 0) {
      error.value = props.tool.ui?.error_invalid_yaml
      outputJson.value = ''
      if (!silent) toast.error(error.value)
      return
    }
    docCount.value = docs.length
    outputJson.value = serialize(docs.length > 1 ? docs : docs[0])
    if (!silent) toast.success(t('toast.converted'))
  } catch (e) {
    error.value = describeError(e)
    outputJson.value = ''
    if (!silent) toast.error(error.value)
  }
}

const clearAll = () => { outputJson.value = ''; error.value = ''; docCount.value = 0 }

const copyOutput = async () => { await copyToClipboard(outputJson.value) }

const downloadOutput = () => {
  const blob = new Blob([outputJson.value], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url; link.download = 'output.json'
  document.body.appendChild(link); link.click(); document.body.removeChild(link); URL.revokeObjectURL(url)
}
</script>
