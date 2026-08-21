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
          :show-edit-actions="true"
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
          :label="tool.ui?.label_output || 'JSON Schema'"
          :content="outputSchema"
          :error="error"
          :empty-text="tool.ui?.placeholder_output || 'JSON Schema will appear here...'"
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
      <button @click="loadExample" class="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400">
        {{ tool.ui?.btn_example || 'Load Example' }}
      </button>
      <button @click="clearAll" class="rounded-xl border border-surface-200 bg-white px-4 py-2 text-xs font-bold text-surface-700 hover:bg-surface-50 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-300 dark:hover:bg-surface-700">
        {{ $t('system.clearAll') }}
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
const props = defineProps<{ tool: any }>()

const { formatJson, minifyJson, validateJson, fixJson } = useJsonEditor()

const inputError = ref('')
const inputViewMode = ref<'text' | 'rich'>('text')

const parsedInputData = computed(() => {
  if (!inputJson.value.trim()) return null
  try { return JSON.parse(inputJson.value) } catch { return null }
})

const onFormat = () => {
  const result = formatJson(inputJson.value)
  if (result.output) { inputJson.value = result.output; inputError.value = '' }
  else { inputError.value = result.error }
}
const onMinify = () => {
  const result = minifyJson(inputJson.value)
  if (result.output) { inputJson.value = result.output; inputError.value = '' }
  else { inputError.value = result.error }
}
const onValidate = () => {
  const result = validateJson(inputJson.value)
  inputError.value = result.error
}
const onFix = () => {
  const result = fixJson(inputJson.value)
  if (result.fixed) { inputJson.value = result.fixed; inputError.value = '' }
  else { inputError.value = result.error }
}
const onPaste = () => { nextTick(() => onFormat()) }

const inputJson = ref('')
const outputSchema = ref('')
const error = ref('')
const indent = ref<number | string>(2)
const includeRequired = ref(true)
const additionalProperties = ref(false)
const fullscreen = ref(false)

const exampleJson = {
  user: { id: 1234567890, name: "John Doe", email: "john@example.com", avatar: "https://example.com/avatar.jpg", birthday: "1990-01-15", isActive: true, score: 95.5, tags: ["admin", "user"], address: { city: "New York", country: "USA" } }
}

const loadExample = () => {
  inputJson.value = JSON.stringify(exampleJson, null, 2)
  generate()
}

const inferSchema = (value: any): any => {
  if (value === null) return { type: 'null' }
  if (Array.isArray(value)) {
    if (value.length === 0) return { type: 'array' }
    return { type: 'array', items: inferSchema(value[0]) }
  }
  if (typeof value === 'object') {
    const properties: any = {}
    const required: string[] = []
    for (const [key, val] of Object.entries(value)) {
      properties[key] = inferSchema(val)
      required.push(key)
    }
    const schema: any = { type: 'object', properties }
    if (includeRequired.value && required.length > 0) schema.required = required
    if (additionalProperties.value) schema.additionalProperties = true
    return schema
  }
  if (typeof value === 'string') {
    const schema: any = { type: 'string' }
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) schema.format = 'date'
    else if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) schema.format = 'date-time'
    else if (/^[^@]+@[^@]+\.[^@]+$/.test(value)) schema.format = 'email'
    else if (/^https?:\/\//.test(value)) schema.format = 'uri'
    else if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) schema.format = 'uuid'
    return schema
  }
  if (typeof value === 'number') return Number.isInteger(value) ? { type: 'integer' } : { type: 'number' }
  if (typeof value === 'boolean') return { type: 'boolean' }
  return {}
}

const generate = () => {
  error.value = ''
  try {
    const parsed = JSON.parse(inputJson.value)
    const schema = { $schema: 'http://json-schema.org/draft-07/schema#', ...inferSchema(parsed) }
    const space = indent.value === 'tab' ? '\t' : Number(indent.value)
    outputSchema.value = JSON.stringify(schema, null, space)
  } catch (e) {
    error.value = (e as Error).message; outputSchema.value = ''
  }
}

const clearAll = () => { outputSchema.value = ''; error.value = '' }

const copyOutput = async () => {
  try { await navigator.clipboard.writeText(outputSchema.value) } catch (e) { console.error('Failed to copy:', e) }
}

const downloadOutput = () => {
  const blob = new Blob([outputSchema.value], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url; link.download = 'schema.json'
  document.body.appendChild(link); link.click(); document.body.removeChild(link); URL.revokeObjectURL(url)
}
</script>
