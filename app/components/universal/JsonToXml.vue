<template>
  <ResizablePanel v-model:fullscreen="fullscreen" :initial-ratio="0.5" responsive>
    <template #first>
      <div class="h-full pr-3 overflow-hidden">
        <JsonInputEditor
          ref="inputEditorRef"
          v-model="inputJson"
          :label="props.tool.ui?.label_input || 'Input JSON'"
          placeholder='{"name": "JSON Toolbox", "version": "1.0"}'
          show-upload
          example-slug="json-to-xml"
          @clear="clearAll"
          @paste="onPaste"
          @example-loaded="onExampleLoaded"
        />
      </div>
    </template>

    <template #second>
      <div class="h-full pl-3 flex flex-col overflow-hidden">
        <JsonOutputPanel
          :label="props.tool.ui?.label_output || 'XML Output'"
          :content="outputXml"
          :error="error"
          :empty-text="props.tool.ui?.placeholder_output || 'XML output will appear here...'"
          download-filename="output.xml"
          @copy="copyOutput"
          @download="downloadOutput"
        />
      </div>
    </template>

    <template #toolbar-left>
      <button @click="convertToXml" class="btn-primary px-5 py-2 text-xs">
        <Icon name="lucide:arrow-right" class="h-4 w-4 mr-1.5" />
        {{ props.tool.ui?.btn_convert || 'Convert to XML' }}
      </button>

      <div class="flex items-center gap-2">
        <label class="text-xs font-bold text-surface-600 dark:text-surface-400">{{ props.tool.ui?.option_root_element || 'Root element:' }}</label>
        <input
          v-model="rootElement"
          class="w-20 rounded-lg border border-surface-200 bg-white px-2 py-1 text-xs dark:border-surface-700 dark:bg-surface-800 dark:text-surface-100"
          :placeholder="props.tool.ui?.placeholder_root || 'root'"
        />
      </div>
      <div class="flex items-center gap-2">
        <label class="text-xs font-bold text-surface-600 dark:text-surface-400">{{ props.tool.ui?.option_array_item || 'Array item element:' }}</label>
        <input
          v-model="arrayItem"
          class="w-20 rounded-lg border border-surface-200 bg-white px-2 py-1 text-xs dark:border-surface-700 dark:bg-surface-800 dark:text-surface-100"
          :placeholder="props.tool.ui?.placeholder_array_item || 'item'"
        />
      </div>
      <div class="flex items-center gap-2">
        <label class="text-xs font-bold text-surface-600 dark:text-surface-400">{{ props.tool.ui?.option_indent || 'Indent:' }}</label>
        <select v-model="indent" class="rounded-lg border border-surface-200 bg-white px-2 py-1 text-xs dark:border-surface-700 dark:bg-surface-800">
          <option :value="2">{{ props.tool.ui?.option_indent_2 || '2 spaces' }}</option>
          <option :value="4">{{ props.tool.ui?.option_indent_4 || '4 spaces' }}</option>
        </select>
      </div>
      <label class="flex items-center gap-1.5 cursor-pointer select-none">
        <input type="checkbox" v-model="includeDeclaration" class="rounded border-surface-300">
        <span class="text-xs font-bold text-surface-600 dark:text-surface-400">{{ props.tool.ui?.option_declaration || 'Include XML declaration' }}</span>
      </label>
    </template>
  </ResizablePanel>
</template>

<script setup lang="ts">
const props = defineProps<{ tool: any }>()
const { t } = useI18n()
const toast = useToast()

const inputJson = ref('')
onMounted(() => {
  const text = useJsonInbox().consumeInbox()
  if (text != null) inputJson.value = text
})
const outputXml = ref('')
const error = ref('')
const rootElement = ref('root')
const arrayItem = ref('item')
const indent = ref<number>(2)
const includeDeclaration = ref(true)
const fullscreen = ref(false)

const inputEditorRef = ref<InstanceType<typeof import('~/components/tool/JsonInputEditor.vue').default>>()

/**
 * Element names that can be used directly. JSON keys are still sanitized
 * instead of rejected, but names typed by the user are validated so the page
 * never silently emits an element that is not well-formed XML.
 */
const XML_NAME = /^[A-Za-z_][A-Za-z0-9_.-]*$/

const escapeXml = (value: unknown) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&apos;')

const sanitizeKey = (key: string) => key.replace(/[^A-Za-z0-9_-]/g, '_').replace(/^([^A-Za-z_])/, '_$1')

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
const debouncedConvert = useDebounceFn(() => { convertToXml(true) }, 300)
watch(inputJson, () => {
  debouncedConvert()
  debouncedFormatInPlace()
})

// Re-convert when options change
watch([rootElement, arrayItem, indent, includeDeclaration], () => {
  if (inputJson.value.trim()) convertToXml()
})

const onExampleLoaded = () => { nextTick(() => convertToXml()) }
const onPaste = () => { nextTick(() => { formatInputInPlace(); convertToXml() }) }

const jsonToXml = (obj: any, currentIndent: number = 0): string => {
  const unit = ' '.repeat(indent.value)
  const spaces = unit.repeat(currentIndent)
  let xml = ''

  if (Array.isArray(obj)) {
    const itemName = sanitizeKey(arrayItem.value || 'item')
    obj.forEach(item => {
      xml += `${spaces}<${itemName}>\n`
      xml += jsonToXml(item, currentIndent + 1)
      xml += `${spaces}</${itemName}>\n`
    })
  } else if (typeof obj === 'object' && obj !== null) {
    for (const [key, value] of Object.entries(obj)) {
      const safeKey = sanitizeKey(key)
      if (Array.isArray(value)) {
        value.forEach(item => {
          xml += `${spaces}<${safeKey}>\n`
          xml += jsonToXml(item, currentIndent + 1)
          xml += `${spaces}</${safeKey}>\n`
        })
      } else if (typeof value === 'object' && value !== null) {
        xml += `${spaces}<${safeKey}>\n`
        xml += jsonToXml(value, currentIndent + 1)
        xml += `${spaces}</${safeKey}>\n`
      } else {
        xml += `${spaces}<${safeKey}>${escapeXml(value)}</${safeKey}>\n`
      }
    }
  } else {
    xml += `${spaces}${escapeXml(obj)}\n`
  }

  return xml
}

const convertToXml = (silent = false) => {
  error.value = ''
  if (!inputJson.value.trim()) { if (!silent) error.value = props.tool.ui?.error_empty_input || 'Enter JSON or open a JSON file first'; outputXml.value = ''; return }

  const root = rootElement.value?.trim() || 'root'
  if (!XML_NAME.test(root)) {
    error.value = props.tool.ui?.error_invalid_root || 'Root element name is not valid XML'
    outputXml.value = ''
    if (!silent) toast.error(error.value)
    return
  }
  const itemName = arrayItem.value?.trim() || 'item'
  if (!XML_NAME.test(itemName)) {
    error.value = props.tool.ui?.error_invalid_array_item || 'Array item element name is not valid XML'
    outputXml.value = ''
    if (!silent) toast.error(error.value)
    return
  }

  try {
    const parsed = JSON.parse(inputJson.value)
    const declaration = includeDeclaration.value ? '<?xml version="1.0" encoding="UTF-8"?>\n' : ''
    outputXml.value = `${declaration}<${root}>\n${jsonToXml(parsed, 1)}</${root}>`
    if (!silent) toast.success(t('toast.converted'))
  } catch (e) {
    error.value = props.tool.ui?.error_invalid_json || 'Input is not valid JSON'
    outputXml.value = ''
    if (!silent) toast.error(props.tool.ui?.error_invalid_json || 'Input is not valid JSON')
  }
}

const clearAll = () => { outputXml.value = ''; error.value = '' }

const copyOutput = async () => { await copyToClipboard(outputXml.value) }

const downloadOutput = () => {
  const blob = new Blob([outputXml.value], { type: 'application/xml;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url; link.download = 'output.xml'
  document.body.appendChild(link); link.click(); document.body.removeChild(link); URL.revokeObjectURL(url)
}
</script>
