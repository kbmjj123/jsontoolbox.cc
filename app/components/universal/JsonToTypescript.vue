<template>
  <ResizablePanel v-model:fullscreen="fullscreen" :initial-ratio="0.5" responsive>
    <template #first>
      <div class="h-full pr-3">
        <JsonOutputPanel
          v-model:view-mode="inputViewMode"
          :label="ui?.labelInputJson ?? 'Input JSON'"
          :content="inputJson"
          :parsed-data="parsedInputData"
          :error="inputError"
          :editable="true"
          :show-edit-actions="true"
          :show-copy="false"
          :show-download="false"
          placeholder='{"name": "Alice", "age": 30, "active": true}'
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
          :label="ui?.labelOutput ?? 'TypeScript Interface'"
          :content="outputTs"
          :error="error"
          :empty-text="ui?.placeholderOutput ?? 'TypeScript interface will appear here...'"
          download-filename="types.ts"
          @copy="copyOutput"
          @download="downloadOutput"
        />
      </div>
    </template>

    <template #toolbar-left>
      <button @click="generateTypescript" class="btn-primary px-5 py-2 text-xs">
        <Icon name="lucide:code" class="h-4 w-4 mr-1.5" />
        {{ ui?.btnGenerate ?? 'Generate' }}
      </button>
      <button @click="clearAll" class="rounded-xl border border-surface-200 bg-white px-4 py-2 text-xs font-bold text-surface-700 hover:bg-surface-50 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-300 dark:hover:bg-surface-700">
        {{ $t('system.clearAll') }}
      </button>

      <div class="flex items-center gap-2">
        <label class="text-xs font-bold text-surface-600 dark:text-surface-400">{{ ui?.labelInterfaceName ?? 'Interface Name:' }}</label>
        <input
          v-model="interfaceName"
          class="w-28 rounded-lg border border-surface-200 bg-white px-2 py-1 text-xs dark:border-surface-700 dark:bg-surface-800 dark:text-surface-100"
          :placeholder="ui?.placeholderName ?? 'RootObject'"
        />
      </div>
      <label class="flex items-center gap-1.5 cursor-pointer select-none">
        <input type="checkbox" v-model="exportInterface" class="rounded border-surface-300">
        <span class="text-xs font-bold text-surface-600 dark:text-surface-400">{{ ui?.labelExport ?? 'Export' }}</span>
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
const ui = computed(() => props.tool?.ui)

const inputJson = ref('')
const outputTs = ref('')
const error = ref('')
const interfaceName = ref('RootObject')
const exportInterface = ref(true)
const fullscreen = ref(false)

const getType = (value: any): string => {
  if (value === null) return 'null'
  if (value === undefined) return 'undefined'
  if (Array.isArray(value)) {
    if (value.length === 0) return 'any[]'
    return `${getType(value[0])}[]`
  }
  if (typeof value === 'object') return 'object'
  return typeof value
}

const capitalize = (str: string): string => str.charAt(0).toUpperCase() + str.slice(1)

const singularize = (str: string): string => {
  if (str.endsWith('ies')) return str.slice(0, -3) + 'y'
  if (str.endsWith('s')) return str.slice(0, -1)
  return str
}

const generateInterface = (obj: any, name: string, indent: number = 0): string => {
  const spaces = '  '.repeat(indent)
  const lines: string[] = []

  if (indent === 0) {
    lines.push(`${exportInterface.value ? 'export ' : ''}interface ${name} {`)
  } else {
    lines.push(`${spaces}interface ${name} {`)
  }

  for (const [key, value] of Object.entries(obj)) {
    const type = getType(value)
    if (type === 'object' && value !== null) {
      const nestedName = capitalize(key)
      lines.push(generateInterface(value, nestedName, indent + 1))
      lines.push(`${spaces}  ${key}: ${nestedName};`)
    } else if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object' && value[0] !== null) {
      const nestedName = capitalize(singularize(key))
      lines.push(generateInterface(value[0], nestedName, indent + 1))
      lines.push(`${spaces}  ${key}: ${nestedName}[];`)
    } else {
      lines.push(`${spaces}  ${key}: ${type};`)
    }
  }

  lines.push(`${spaces}}`)
  return lines.join('\n')
}

const generateTypescript = () => {
  error.value = ''
  try {
    const parsed = JSON.parse(inputJson.value)
    if (typeof parsed !== 'object' || parsed === null) {
      error.value = ui.value?.errorInvalidInput ?? 'Input must be a JSON object or array'
      return
    }
    if (Array.isArray(parsed)) {
      if (parsed.length === 0) { error.value = ui.value?.errorEmptyArray ?? 'Array is empty'; return }
      outputTs.value = generateInterface(parsed[0], interfaceName.value)
    } else {
      outputTs.value = generateInterface(parsed, interfaceName.value)
    }
  } catch (e) {
    error.value = (e as Error).message
    outputTs.value = ''
  }
}

const clearAll = () => { outputTs.value = ''; error.value = '' }

const copyOutput = async () => {
  try { await navigator.clipboard.writeText(outputTs.value) } catch (e) { console.error('Failed to copy:', e) }
}

const downloadOutput = () => {
  const blob = new Blob([outputTs.value], { type: 'text/typescript' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url; link.download = 'types.ts'
  document.body.appendChild(link); link.click(); document.body.removeChild(link); URL.revokeObjectURL(url)
}
</script>
