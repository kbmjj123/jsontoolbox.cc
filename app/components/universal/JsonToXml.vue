<template>
  <div>
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <!-- Input -->
      <JsonInputEditor
        v-model="inputJson"
        :label="tool.ui?.label_input || 'Input JSON'"
        placeholder='{"name": "JSON Toolbox", "version": "1.0"}'
        show-upload
        @clear="clearAll"
      />

      <!-- Output -->
      <div>
        <div class="flex items-center justify-between mb-2">
          <label class="text-sm font-bold text-surface-700 dark:text-surface-300">{{ tool.ui?.label_output || 'XML Output' }}</label>
          <div class="flex gap-2">
            <button @click="copyOutput" class="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400">
              {{ $t('system.copy') }}
            </button>
            <button @click="downloadOutput" class="text-xs text-surface-500 hover:text-surface-700 dark:text-surface-400">
              {{ $t('system.download') }}
            </button>
          </div>
        </div>
        <div class="relative">
          <textarea
            v-model="outputXml"
            readonly
            class="w-full h-64 rounded-xl border border-surface-200 bg-surface-50 p-4 font-mono text-sm text-surface-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-100 resize-none"
            :placeholder="tool.ui?.placeholder_output || 'XML output will appear here...'"
          ></textarea>
          <div v-if="error" class="absolute bottom-2 left-2 right-2 rounded-lg bg-red-50 border border-red-200 p-2 text-xs text-red-700 dark:bg-red-900/30 dark:border-red-800 dark:text-red-400">
            {{ error }}
          </div>
        </div>
      </div>
    </div>

    <!-- Options -->
    <div class="mt-4 flex flex-wrap items-center gap-4">
      <div class="flex items-center gap-2">
        <label class="text-xs font-bold text-surface-600 dark:text-surface-400">{{ tool.ui?.option_root_element || 'Root Element:' }}</label>
        <input
          v-model="rootElement"
          class="rounded-lg border border-surface-200 bg-white px-3 py-1 text-xs dark:border-surface-700 dark:bg-surface-800 dark:text-surface-100"
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
    </div>

    <!-- Actions -->
    <div class="mt-3 flex flex-wrap gap-3">
      <button @click="convertToXml" class="btn-primary px-5 py-2 text-xs">
        <Icon name="lucide:arrow-right" class="h-4 w-4 mr-1.5" />
        {{ tool.ui?.btn_convert || 'Convert to XML' }}
      </button>
      <button @click="loadExample" class="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400">
        {{ tool.ui?.btn_example || 'Load Example' }}
      </button>
      <button @click="clearAll" class="rounded-xl border border-surface-200 bg-white px-4 py-2 text-xs font-bold text-surface-700 hover:bg-surface-50 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-300 dark:hover:bg-surface-700">
        {{ $t('system.clearAll') }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ tool: any }>()

const inputJson = ref('')
const outputXml = ref('')
const error = ref('')
const rootElement = ref('root')
const indent = ref<number | string>(2)
const encoding = ref('UTF-8')

// Example data
const exampleJson = {
  catalog: {
    book: [
      {
        id: "bk101",
        title: "XML Developer's Guide",
        author: "Gambardella, Matthew",
        genre: "Computer",
        price: 44.95,
        publishDate: "2000-10-01"
      },
      {
        id: "bk102",
        title: "Midnight Rain",
        author: "Ralls, Kim",
        genre: "Fantasy",
        price: 5.95,
        publishDate: "2000-12-16"
      }
    ]
  }
}

const loadExample = () => {
  inputJson.value = JSON.stringify(exampleJson, null, 2)
  convertToXml()
}

const jsonToXml = (obj: any, currentIndent: number = 0): string => {
  const spaces = '  '.repeat(currentIndent)
  let xml = ''

  if (Array.isArray(obj)) {
    obj.forEach(item => {
      xml += `${spaces}<item>\n`
      xml += jsonToXml(item, indent + 1)
      xml += `${spaces}</item>\n`
    })
  } else if (typeof obj === 'object' && obj !== null) {
    for (const [key, value] of Object.entries(obj)) {
      const safeKey = key.replace(/[^a-zA-Z0-9_-]/g, '_')
      if (Array.isArray(value)) {
        value.forEach(item => {
          xml += `${spaces}<${safeKey}>\n`
          xml += jsonToXml(item, indent + 1)
          xml += `${spaces}</${safeKey}>\n`
        })
      } else if (typeof value === 'object' && value !== null) {
        xml += `${spaces}<${safeKey}>\n`
        xml += jsonToXml(value, indent + 1)
        xml += `${spaces}</${safeKey}>\n`
      } else {
        const escaped = String(value ?? '')
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
        xml += `${spaces}<${safeKey}>${escaped}</${safeKey}>\n`
      }
    }
  } else {
    const escaped = String(obj ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
    xml += `${spaces}${escaped}\n`
  }

  return xml
}

const convertToXml = () => {
  error.value = ''
  try {
    const parsed = JSON.parse(inputJson.value)
    const root = rootElement.value || 'root'
    const safeRoot = root.replace(/[^a-zA-Z0-9_-]/g, '_')
    const indentStr = indent.value === 'tab' ? '\t' : '  '.repeat(Number(indent.value) / 2)
    outputXml.value = `<?xml version="1.0" encoding="${encoding.value}"?>\n<${safeRoot}>\n${jsonToXml(parsed, 1)}</${safeRoot}>`
  } catch (e) {
    error.value = (e as Error).message
    outputXml.value = ''
  }
}

const clearAll = () => {
  outputXml.value = ''
  error.value = ''
}

const copyOutput = async () => {
  try {
    await navigator.clipboard.writeText(outputXml.value)
  } catch (e) {
    console.error('Failed to copy:', e)
  }
}

const downloadOutput = () => {
  const blob = new Blob([outputXml.value], { type: 'text/xml' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'output.xml'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
</script>
