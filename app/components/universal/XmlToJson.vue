<template>
  <ResizablePanel v-model:fullscreen="fullscreen" :initial-ratio="0.5" responsive>
    <template #first>
      <div class="h-full pr-3 overflow-hidden">
        <JsonInputEditor
          ref="inputEditorRef"
          v-model="inputXml"
          :label="tool.ui?.label_input || 'Input XML'"
          placeholder='<root><item>data</item></root>'
          show-upload
          show-load-url
          example-slug="xml-to-json"
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
        <label class="text-xs font-bold text-surface-600 dark:text-surface-400">{{ tool.ui?.label_indent || 'Indent:' }}</label>
        <select v-model="indent" class="rounded-lg border border-surface-200 bg-white px-2 py-1 text-xs dark:border-surface-700 dark:bg-surface-800">
          <option :value="2">2 spaces</option>
          <option :value="4">4 spaces</option>
        </select>
      </div>
      <div class="flex items-center gap-2">
        <label class="text-xs font-bold text-surface-600 dark:text-surface-400">{{ tool.ui?.label_attr_prefix || 'Attr prefix:' }}</label>
        <input
          v-model="attrPrefix"
          class="w-16 rounded-lg border border-surface-200 bg-white px-2 py-1 text-xs dark:border-surface-700 dark:bg-surface-800"
          placeholder="@"
        />
      </div>
      <label class="flex items-center gap-1.5 cursor-pointer select-none">
        <input type="checkbox" v-model="preserveTextNodes" class="rounded border-surface-300">
        <span class="text-xs font-bold text-surface-600 dark:text-surface-400">{{ tool.ui?.label_preserve_text || 'Preserve #text' }}</span>
      </label>
    </template>
  </ResizablePanel>
</template>

<script setup lang="ts">
const props = defineProps<{ tool: any }>()

const inputXml = ref('')
const outputJson = ref('')
const error = ref('')
const indent = ref(2)
const attrPrefix = ref('@')
const preserveTextNodes = ref(false)
const fullscreen = ref(false)

const inputEditorRef = ref<InstanceType<typeof import('~/components/tool/JsonInputEditor.vue').default>>()

// Auto-convert on input change (debounced 300ms)
const debouncedConvert = useDebounceFn(() => { convertToJson() }, 300)
watch(inputXml, () => {
  debouncedConvert()
})

// Re-convert when options change
watch([indent, attrPrefix, preserveTextNodes], () => {
  if (inputXml.value.trim()) convertToJson()
})

const onExampleLoaded = () => { nextTick(() => convertToJson()) }
const onPaste = () => { nextTick(() => convertToJson()) }

const parseXmlNode = (node: Element): any => {
  const children = Array.from(node.children)
  if (children.length === 0) {
    return node.textContent?.trim() || ''
  }

  const result: any = {}
  for (const attr of Array.from(node.attributes)) {
    result[attrPrefix.value + attr.name] = attr.value
  }

  for (const child of children) {
    const key = child.tagName
    const value = parseXmlNode(child)
    if (key in result) {
      if (!Array.isArray(result[key])) {
        result[key] = [result[key]]
      }
      result[key].push(value)
    } else {
      result[key] = value
    }
  }

  if (preserveTextNodes.value) {
    const directText = Array.from(node.childNodes)
      .filter(n => n.nodeType === Node.TEXT_NODE)
      .map(n => n.textContent?.trim())
      .filter(t => t)
      .join(' ')
    if (directText) {
      result['#text'] = directText
    }
  }

  return result
}

const convertToJson = () => {
  error.value = ''
  if (!inputXml.value.trim()) { outputJson.value = ''; return }
  try {
    const parser = new DOMParser()
    const doc = parser.parseFromString(inputXml.value, 'text/xml')
    const parserError = doc.querySelector('parsererror')
    if (parserError) {
      error.value = (tool.ui?.error_invalid_xml || 'Invalid XML: ') + parserError.textContent
      outputJson.value = ''
      return
    }
    const root = doc.documentElement
    const result = { [root.tagName]: parseXmlNode(root) }
    outputJson.value = JSON.stringify(result, null, indent.value)
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
