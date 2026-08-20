<template>
  <ResizablePanel v-model:fullscreen="fullscreen" :initial-ratio="0.5" responsive>
    <template #first>
      <div class="h-full pr-3">
        <JsonInputEditor
          v-model="inputXml"
          :label="ui?.labelInputXml ?? 'Input XML'"
          placeholder='<?xml version="1.0"?>&#10;<catalog>&#10;  <book id="bk101">&#10;    <title>XML Developer Guide</title>&#10;    <price>44.95</price>&#10;  </book>&#10;</catalog>'
          :height="fullscreen ? 'h-full' : undefined"
          show-upload
          show-load-url
          accept=".xml"
          @clear="clearAll"
        />
      </div>
    </template>
    <template #second>
      <div class="h-full pl-3">
        <JsonOutputPanel
          :label="ui?.labelOutput ?? 'JSON Output'"
          :content="outputJson"
          :error="error"
          :height="fullscreen ? 'h-full' : undefined"
          empty-text="JSON output will appear here..."
          @copy="copyOutput"
          @download="downloadOutput"
        />
      </div>
    </template>

    <template #toolbar-left>
      <button @click="convertToJson" class="btn-primary px-5 py-2 text-xs">
        <Icon name="lucide:arrow-right" class="h-4 w-4 mr-1.5" />
        {{ ui?.btnConvert ?? 'Convert to JSON' }}
      </button>
      <button @click="loadExample" class="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400">
        {{ ui?.btnExample ?? 'Load Example' }}
      </button>
      <button @click="clearAll" class="rounded-xl border border-surface-200 bg-white px-4 py-2 text-xs font-bold text-surface-700 hover:bg-surface-50 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-300 dark:hover:bg-surface-700">
        {{ $t('system.clearAll') }}
      </button>

      <div class="flex items-center gap-2">
        <label class="text-xs font-bold text-surface-600 dark:text-surface-400">{{ ui?.labelIndent ?? 'Indent:' }}</label>
        <select v-model="indent" class="rounded-lg border border-surface-200 bg-white px-2 py-1 text-xs dark:border-surface-700 dark:bg-surface-800">
          <option :value="2">{{ ui?.optionSpaces2 ?? '2 spaces' }}</option>
          <option :value="4">{{ ui?.optionSpaces4 ?? '4 spaces' }}</option>
        </select>
      </div>
      <div class="flex items-center gap-2">
        <label class="text-xs font-bold text-surface-600 dark:text-surface-400">{{ ui?.labelAttrPrefix ?? 'Attribute prefix:' }}</label>
        <input
          v-model="attrPrefix"
          class="w-16 rounded-lg border border-surface-200 bg-white px-2 py-1 text-xs dark:border-surface-700 dark:bg-surface-800"
          placeholder="@"
        />
      </div>
      <label class="flex items-center gap-1.5 cursor-pointer select-none">
        <input type="checkbox" v-model="preserveTextNodes" class="rounded border-surface-300">
        <span class="text-xs font-bold text-surface-600 dark:text-surface-400">{{ ui?.labelPreserveText ?? 'Preserve #text' }}</span>
      </label>
    </template>
  </ResizablePanel>
</template>

<script setup lang="ts">
const props = defineProps<{ tool: any }>()
const ui = computed(() => props.tool?.ui)

const inputXml = ref('')
const outputJson = ref('')
const error = ref('')
const indent = ref(2)
const attrPrefix = ref('@')
const preserveTextNodes = ref(false)
const fullscreen = ref(false)

const exampleXml = `<?xml version="1.0" encoding="UTF-8"?>
<catalog>
  <book id="bk101">
    <title>XML Developer's Guide</title>
    <author>Gambardella, Matthew</author>
    <genre>Computer</genre>
    <price>44.95</price>
    <publishDate>2000-10-01</publishDate>
  </book>
  <book id="bk102">
    <title>Midnight Rain</title>
    <author>Ralls, Kim</author>
    <genre>Fantasy</genre>
    <price>5.95</price>
    <publishDate>2000-12-16</publishDate>
  </book>
</catalog>`

const loadExample = () => {
  inputXml.value = exampleXml
  convertToJson()
}

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
  try {
    const parser = new DOMParser()
    const doc = parser.parseFromString(inputXml.value, 'text/xml')
    const parserError = doc.querySelector('parsererror')
    if (parserError) {
      error.value = (ui.value?.errorInvalidXml ?? 'Invalid XML: ') + parserError.textContent
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

const clearAll = () => {
  outputJson.value = ''
  error.value = ''
}

const copyOutput = async () => {
  try {
    await navigator.clipboard.writeText(outputJson.value)
  } catch (e) {
    console.error('Failed to copy:', e)
  }
}

const downloadOutput = () => {
  const blob = new Blob([outputJson.value], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'output.json'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
</script>
