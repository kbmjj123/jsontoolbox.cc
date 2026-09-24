<template>
  <ResizablePanel v-model:fullscreen="fullscreen" :initial-ratio="0.5" responsive>
    <template #first>
      <div class="h-full pr-3 overflow-hidden">
        <JsonInputEditor
          ref="inputEditorRef"
          v-model="inputJson"
          :label="tool.ui?.label_input || 'Input JSON'"
          placeholder='{"name": "JSON Toolbox", "version": "1.0"}'
          show-upload
          show-load-url
          example-slug="json-schema-generator"
          @clear="clearAll"
          @paste="onPaste"
          @example-loaded="onExampleLoaded"
        />
      </div>
    </template>

    <template #second>
      <div class="h-full pl-3 flex flex-col overflow-hidden">
        <JsonOutputPanel
          :label="tool.ui?.label_output || 'JSON Schema'"
          :content="outputSchema"
          :error="error"
          :empty-text="tool.ui?.placeholder_output || 'JSON Schema will appear here...'"
          highlight="json"
          download-filename="schema.json"
          @copy="copyOutput"
          @download="downloadOutput"
        />
      </div>
    </template>

    <template #toolbar-left>
      <button @click="generate" class="btn-primary px-5 py-2 text-xs">
        <Icon name="lucide:file-json" class="h-4 w-4 mr-1.5" />
        {{ tool.ui?.btn_generate || 'Generate Schema' }}
      </button>

      <div class="flex items-center gap-2">
        <label class="text-xs font-bold text-surface-600 dark:text-surface-400">{{ tool.ui?.option_indent || 'Indent:' }}</label>
        <select v-model="indent" class="rounded-lg border border-surface-200 bg-white px-2 py-1 text-xs dark:border-surface-700 dark:bg-surface-800">
          <option :value="2">{{ tool.ui?.option_indent_2 || '2 spaces' }}</option>
          <option :value="4">{{ tool.ui?.option_indent_4 || '4 spaces' }}</option>
          <option value="tab">Tab</option>
        </select>
      </div>
      <label class="flex items-center gap-1.5 cursor-pointer select-none">
        <input type="checkbox" v-model="includeRequired" class="rounded border-surface-300">
        <span class="text-xs font-bold text-surface-600 dark:text-surface-400">{{ tool.ui?.option_required || 'Required' }}</span>
      </label>
      <label class="flex items-center gap-1.5 cursor-pointer select-none">
        <input type="checkbox" v-model="additionalProperties" class="rounded border-surface-300">
        <span class="text-xs font-bold text-surface-600 dark:text-surface-400">{{ tool.ui?.option_additional || 'Additional' }}</span>
      </label>
    </template>
  </ResizablePanel>
</template>

<script setup lang="ts">
import { generateSchemaText } from '~/composables/useSchemaGenerate'
const props = defineProps<{ tool: any }>()
const { t } = useI18n()
const toast = useToast()

const inputJson = ref('')
const outputSchema = ref('')
const error = ref('')
const indent = ref<number | string>(2)
const includeRequired = ref(true)
const additionalProperties = ref(false)
const fullscreen = ref(false)

const inputEditorRef = ref<InstanceType<typeof import('~/components/tool/JsonInputEditor.vue').default>>()

// Auto-format input in-place (debounced 1.5s after user stops typing)
const formatInputInPlace = () => {
  if (!inputJson.value.trim()) return
  try {
    const parsed = JSON.parse(inputJson.value)
    const space = indent.value === 'tab' ? '\t' : Number(indent.value)
    inputJson.value = JSON.stringify(parsed, null, space)
  } catch {}
}
const debouncedFormatInPlace = useDebounceFn(() => { formatInputInPlace() }, 1500)

// Auto-generate on input change (debounced 300ms)
const debouncedGenerate = useDebounceFn(() => { generate(true) }, 300)
watch(inputJson, () => {
  debouncedGenerate()
  debouncedFormatInPlace()
})

// Re-generate when options change; re-format input when indent changes
watch([indent, includeRequired, additionalProperties], () => {
  if (inputJson.value.trim()) {
    formatInputInPlace()
    generate()
  }
})

const onExampleLoaded = () => {
  nextTick(() => generate())
}

const onPaste = () => {
  nextTick(() => {
    formatInputInPlace()
    generate()
  })
}

const generate = (silent = false) => {
  error.value = ''
  if (!inputJson.value.trim()) { outputSchema.value = ''; return }
  try {
    const parsed = JSON.parse(inputJson.value)
    outputSchema.value = generateSchemaText(parsed, {
      indent: indent.value as number | 'tab',
      includeRequired: includeRequired.value,
      additionalProperties: additionalProperties.value,
    })
    if (!silent) toast.success(t('toast.generated'))
  } catch (e) {
    error.value = (e as Error).message
    outputSchema.value = ''
    if (!silent) toast.error((e as Error).message)
  }
}

const clearAll = () => {
  outputSchema.value = ''
  error.value = ''
}

const copyOutput = async () => {
  await copyToClipboard(outputSchema.value)
}

const downloadOutput = () => {
  const blob = new Blob([outputSchema.value], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'schema.json'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
</script>
