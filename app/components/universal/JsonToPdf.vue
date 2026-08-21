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
        <div class="flex items-center justify-between mb-2">
          <label class="text-sm font-bold text-surface-700 dark:text-surface-300">{{ tool.ui?.label_preview || 'Preview' }}</label>
          <button v-if="formattedJson" @click="copyOutput" class="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400">{{ $t('system.copy') }}</button>
        </div>
        <div class="w-full rounded-xl border border-surface-200 bg-surface-50 p-4 font-mono text-sm overflow-auto dark:border-surface-700 dark:bg-surface-800" :class="fullscreen ? 'h-full' : 'h-64'">
          <div v-if="!formattedJson" class="text-surface-400 dark:text-surface-500">{{ tool.ui?.placeholder_preview || 'Preview will appear here...' }}</div>
          <pre v-else class="whitespace-pre-wrap text-surface-900 dark:text-surface-100">{{ formattedJson }}</pre>
        </div>
      </div>
    </template>

    <template #toolbar-left>
      <button @click="format" class="btn-primary px-5 py-2 text-xs">
        <Icon name="lucide:eye" class="h-4 w-4 mr-1.5" />
        {{ tool.ui?.btn_preview || 'Preview' }}
      </button>
      <button @click="loadExample" class="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400">
        {{ tool.ui?.btn_example || 'Example' }}
      </button>
      <button @click="downloadPdf" :disabled="!formattedJson" class="rounded-xl border border-surface-200 bg-white px-4 py-2 text-xs font-bold text-surface-700 hover:bg-surface-50 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-300 dark:hover:bg-surface-700 disabled:opacity-50">
        <Icon name="lucide:download" class="h-4 w-4 mr-1.5" />
        {{ tool.ui?.btn_download_pdf || 'PDF' }}
      </button>
      <button @click="downloadTxt" :disabled="!formattedJson" class="rounded-xl border border-surface-200 bg-white px-4 py-2 text-xs font-bold text-surface-700 hover:bg-surface-50 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-300 dark:hover:bg-surface-700 disabled:opacity-50">
        <Icon name="lucide:file-text" class="h-4 w-4 mr-1.5" />
        {{ tool.ui?.btn_download_txt || 'TXT' }}
      </button>
      <button @click="clearAll" class="rounded-xl border border-surface-200 bg-white px-4 py-2 text-xs font-bold text-surface-700 hover:bg-surface-50 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-300 dark:hover:bg-surface-700">
        {{ $t('system.clearAll') }}
      </button>

      <div class="flex items-center gap-2">
        <label class="text-xs font-bold text-surface-600 dark:text-surface-400">{{ tool.ui?.option_font_size || 'Font:' }}</label>
        <select v-model="fontSize" class="rounded-lg border border-surface-200 bg-white px-2 py-1 text-xs dark:border-surface-700 dark:bg-surface-800">
          <option :value="8">8pt</option>
          <option :value="10">10pt</option>
          <option :value="12">12pt</option>
          <option :value="14">14pt</option>
        </select>
      </div>
      <div class="flex items-center gap-2">
        <label class="text-xs font-bold text-surface-600 dark:text-surface-400">{{ tool.ui?.option_orientation || 'Orient:' }}</label>
        <select v-model="orientation" class="rounded-lg border border-surface-200 bg-white px-2 py-1 text-xs dark:border-surface-700 dark:bg-surface-800">
          <option value="portrait">{{ tool.ui?.option_portrait || 'Portrait' }}</option>
          <option value="landscape">{{ tool.ui?.option_landscape || 'Landscape' }}</option>
        </select>
      </div>
    </template>
  </ResizablePanel>

  <div v-if="error" class="mt-4 rounded-lg bg-red-50 border border-red-200 p-3 text-xs text-red-700 dark:bg-red-900/30 dark:border-red-800 dark:text-red-400">{{ error }}</div>
</template>

<script setup lang="ts">
import { jsPDF } from 'jspdf'

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
const formattedJson = ref('')
const error = ref('')
const fontSize = ref(10)
const orientation = ref<'portrait' | 'landscape'>('portrait')
const fullscreen = ref(false)

const exampleJson = { project: "JSON Toolbox", version: "1.0.0", description: "Free online JSON tools", features: ["Format", "Validate", "Convert"], author: { name: "JSON Toolbox Team", website: "https://jsontoolbox.cc" } }

const loadExample = () => { inputJson.value = JSON.stringify(exampleJson, null, 2); format() }

const format = () => {
  error.value = ''
  try { formattedJson.value = JSON.stringify(JSON.parse(inputJson.value), null, 2) }
  catch (e) { error.value = (e as Error).message; formattedJson.value = '' }
}

const copyOutput = async () => {
  try { await navigator.clipboard.writeText(formattedJson.value) } catch (e) { console.error('Failed to copy:', e) }
}

const downloadPdf = () => {
  if (!formattedJson.value) return
  const doc = new jsPDF({ orientation: orientation.value, unit: 'mm', format: 'a4' })
  doc.setFont('courier', 'normal')
  doc.setFontSize(fontSize.value + 4)
  doc.text('JSON Output', 14, 15)
  doc.setFontSize(fontSize.value)
  const lines = doc.splitTextToSize(formattedJson.value, orientation.value === 'landscape' ? 267 : 180)
  doc.text(lines, 14, 25)
  doc.save('json-output.pdf')
}

const downloadTxt = () => {
  const blob = new Blob([formattedJson.value], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url; link.download = 'json-output.txt'
  document.body.appendChild(link); link.click(); document.body.removeChild(link); URL.revokeObjectURL(url)
}

const clearAll = () => { formattedJson.value = ''; error.value = '' }
</script>
