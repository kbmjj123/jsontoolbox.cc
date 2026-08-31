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
          :label="tool.ui?.label_output || 'XML Output'"
          :content="outputXml"
          :error="error"
          :empty-text="tool.ui?.placeholder_output || 'XML output will appear here...'"
          download-filename="output.xml"
          @copy="copyOutput"
          @download="downloadOutput"
        />
      </div>
    </template>

    <template #toolbar-left>
      <button @click="convertToXml" class="btn-primary px-5 py-2 text-xs">
        <Icon name="lucide:arrow-right" class="h-4 w-4 mr-1.5" />
        {{ tool.ui?.btn_convert || 'Convert to XML' }}
      </button>

      <div class="flex items-center gap-2">
        <label class="text-xs font-bold text-surface-600 dark:text-surface-400">{{ tool.ui?.option_root_element || 'Root:' }}</label>
        <input
          v-model="rootElement"
          class="w-20 rounded-lg border border-surface-200 bg-white px-2 py-1 text-xs dark:border-surface-700 dark:bg-surface-800 dark:text-surface-100"
          :placeholder="tool.ui?.placeholder_root || 'root'"
        />
      </div>
      <div class="flex items-center gap-2">
        <label class="text-xs font-bold text-surface-600 dark:text-surface-400">{{ tool.ui?.option_indent || 'Indent:' }}</label>
        <select v-model="indent" class="rounded-lg border border-surface-200 bg-white px-2 py-1 text-xs dark:border-surface-700 dark:bg-surface-800">
          <option :value="2">{{ tool.ui?.option_indent_2 || '2 spaces' }}</option>
          <option :value="4">{{ tool.ui?.option_indent_4 || '4 spaces' }}</option>
          <option value="tab">Tab</option>
        </select>
      </div>
      <div class="flex items-center gap-2">
        <label class="text-xs font-bold text-surface-600 dark:text-surface-400">{{ tool.ui?.option_encoding || 'Encoding:' }}</label>
        <select v-model="encoding" class="rounded-lg border border-surface-200 bg-white px-2 py-1 text-xs dark:border-surface-700 dark:bg-surface-800">
          <option value="UTF-8">UTF-8</option>
          <option value="UTF-16">UTF-16</option>
          <option value="ISO-8859-1">ISO-8859-1</option>
        </select>
      </div>
    </template>
  </ResizablePanel>
</template>

<script setup lang="ts">
const props = defineProps<{ tool: any }>()
const { t } = useI18n()
const toast = useToast()

const inputJson = ref('')
const outputXml = ref('')
const error = ref('')
const rootElement = ref('root')
const indent = ref<number | string>(2)
const encoding = ref('UTF-8')
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
const debouncedConvert = useDebounceFn(() => { convertToXml(true) }, 300)
watch(inputJson, () => {
  debouncedConvert()
  debouncedFormatInPlace()
})

// Re-convert when options change
watch([rootElement, indent, encoding], () => {
  if (inputJson.value.trim()) convertToXml()
})

const onExampleLoaded = () => { nextTick(() => convertToXml()) }
const onPaste = () => { nextTick(() => { formatInputInPlace(); convertToXml() }) }

const jsonToXml = (obj: any, currentIndent: number = 0): string => {
  const unit = indent.value === 'tab' ? '\t' : ' '.repeat(Number(indent.value))
  const spaces = unit.repeat(currentIndent)
  let xml = ''

  if (Array.isArray(obj)) {
    obj.forEach(item => {
      xml += `${spaces}<item>\n`
      xml += jsonToXml(item, currentIndent + 1)
      xml += `${spaces}</item>\n`
    })
  } else if (typeof obj === 'object' && obj !== null) {
    for (const [key, value] of Object.entries(obj)) {
      const safeKey = key.replace(/[^a-zA-Z0-9_-]/g, '_')
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
        const escaped = String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        xml += `${spaces}<${safeKey}>${escaped}</${safeKey}>\n`
      }
    }
  } else {
    const escaped = String(obj ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    xml += `${spaces}${escaped}\n`
  }

  return xml
}

const convertToXml = (silent = false) => {
  error.value = ''
  if (!inputJson.value.trim()) { outputXml.value = ''; return }
  try {
    const parsed = JSON.parse(inputJson.value)
    const root = rootElement.value || 'root'
    const safeRoot = root.replace(/[^a-zA-Z0-9_-]/g, '_')
    outputXml.value = `<?xml version="1.0" encoding="${encoding.value}"?>\n<${safeRoot}>\n${jsonToXml(parsed, 1)}</${safeRoot}>`
    if (!silent) toast.success(t('toast.converted'))
  } catch (e) {
    error.value = (e as Error).message
    outputXml.value = ''
    if (!silent) toast.error((e as Error).message)
  }
}

const clearAll = () => { outputXml.value = ''; error.value = '' }

const copyOutput = async () => { await copyToClipboard(outputXml.value) }

const downloadOutput = () => {
  const blob = new Blob([outputXml.value], { type: 'text/xml' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url; link.download = 'output.xml'
  document.body.appendChild(link); link.click(); document.body.removeChild(link); URL.revokeObjectURL(url)
}
</script>
