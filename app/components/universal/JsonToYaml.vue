<template>
  <ResizablePanel v-model:fullscreen="fullscreen" :initial-ratio="0.5" responsive>
    <template #first>
      <div class="h-full pr-3 overflow-hidden">
        <JsonInputEditor
          ref="inputEditorRef"
          v-model="inputJson"
          :label="props.tool.ui?.label_input"
          placeholder='{"name": "JSON Toolbox", "version": "1.0"}'
          show-upload
          example-slug="json-to-yaml"
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
          :content="outputYaml"
          :error="error"
          :friendly-message="friendlyError"
          :empty-text="props.tool.ui?.placeholder_output"
          download-filename="output.yaml"
          @copy="copyOutput"
          @download="downloadOutput"
        />
      </div>
    </template>

    <template #toolbar-left>
      <button @click="convertToYaml" class="btn-primary px-5 py-2 text-xs">
        <Icon name="lucide:arrow-right" class="h-4 w-4 mr-1.5" />
        {{ props.tool.ui?.btn_convert }}
      </button>

      <div class="flex items-center gap-2">
        <label class="text-xs font-bold text-surface-600 dark:text-surface-400">{{ props.tool.ui?.option_indent }}</label>
        <select v-model="indent" class="rounded-lg border border-surface-200 bg-white px-2 py-1 text-xs dark:border-surface-700 dark:bg-surface-800">
          <option :value="2">{{ props.tool.ui?.option_indent_2 }}</option>
          <option :value="4">{{ props.tool.ui?.option_indent_4 }}</option>
        </select>
      </div>
    </template>
  </ResizablePanel>
</template>

<script setup lang="ts">
import YAML from 'yaml'

const props = defineProps<{ tool: any }>()
const { t } = useI18n()
const toast = useToast()

const inputJson = ref('')
const outputYaml = ref('')
const error = ref('')
/** Which step failed, so the message can pick the right localized label. */
const errorStage = ref<'parse' | 'dump' | ''>('')
const indent = ref(2)
const fullscreen = ref(false)

const inputEditorRef = ref<InstanceType<typeof import('~/components/tool/JsonInputEditor.vue').default>>()

// Auto-format input in-place (debounced 1.5s after user stops typing)
const formatInputInPlace = () => {
  if (!inputJson.value.trim()) return
  try {
    const parsed = JSON.parse(inputJson.value)
    inputJson.value = JSON.stringify(parsed, null, 2)
  } catch {}
}
const debouncedFormatInPlace = useDebounceFn(() => { formatInputInPlace() }, 1500)

// Auto-convert on input change (debounced 300ms)
const debouncedConvert = useDebounceFn(() => { convertToYaml(true) }, 300)
watch(inputJson, () => {
  debouncedConvert()
  debouncedFormatInPlace()
})

// Re-convert when indent changes
watch(indent, () => {
  if (inputJson.value.trim()) convertToYaml()
})

const onExampleLoaded = () => { nextTick(() => convertToYaml()) }
const onPaste = () => { nextTick(() => { formatInputInPlace(); convertToYaml() }) }

/** Localized headline for the current failure, or '' when nothing failed. */
const friendlyError = computed(() => {
  if (!error.value) return ''
  return errorStage.value === 'dump'
    ? props.tool.ui?.error_conversion
    : props.tool.ui?.error_invalid_json
})

const fail = (stage: 'parse' | 'dump', e: unknown, silent: boolean) => {
  errorStage.value = stage
  error.value = (e as Error).message || String(e)
  outputYaml.value = ''
  if (!silent) toast.error(friendlyError.value || error.value)
}

const convertToYaml = (silent = false) => {
  errorStage.value = ''
  error.value = ''
  if (!inputJson.value.trim()) {
    outputYaml.value = ''
    if (!silent && props.tool.ui?.error_empty_input) toast.error(props.tool.ui.error_empty_input)
    return
  }
  // Parse and dump are kept apart so each failure can report its own message.
  let parsed: unknown
  try {
    parsed = JSON.parse(inputJson.value)
  } catch (e) {
    fail('parse', e, silent)
    return
  }
  try {
    outputYaml.value = YAML.stringify(parsed, {
      // Emit with the YAML 1.1 schema so scalars that YAML 1.1 parsers would
      // reinterpret (yes/no/on/off, dates, bare numbers) are quoted as strings.
      // Plain values such as "localhost" stay unquoted (see docs/upgrade/json-to-yaml.md, note #4).
      schema: 'yaml-1.1',
      indent: indent.value,
      // Never fold scalars across lines: a wrapped plain scalar is harder to
      // review and easy to misread as a structural change.
      lineWidth: -1,
      // Repeated objects stay inline as plain data instead of YAML anchors.
      noRefs: true,
      // Emit keys in the order they appear in the source JSON.
      sortKeys: false,
    })
    if (!silent) toast.success(t('toast.converted'))
  } catch (e) {
    fail('dump', e, silent)
  }
}

const clearAll = () => { outputYaml.value = ''; error.value = ''; errorStage.value = '' }

const copyOutput = async () => { await copyToClipboard(outputYaml.value) }

const downloadOutput = () => {
  const blob = new Blob([outputYaml.value], { type: 'text/yaml' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url; link.download = 'output.yaml'
  document.body.appendChild(link); link.click(); document.body.removeChild(link); URL.revokeObjectURL(url)
}
</script>
