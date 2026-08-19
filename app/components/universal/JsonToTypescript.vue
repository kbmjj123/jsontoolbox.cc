<template>
  <div>
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <!-- Input -->
      <JsonInputEditor
        v-model="inputJson"
        :label="ui?.labelInputJson ?? 'Input JSON'"
        placeholder='{"name": "Alice", "age": 30, "active": true}'
        @clear="clearAll"
      />

      <!-- Output -->
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

    <!-- Options -->
    <div class="mt-4 flex flex-wrap items-center gap-4">
      <div class="flex items-center gap-2">
        <label class="text-xs font-bold text-surface-600 dark:text-surface-400">{{ ui?.labelInterfaceName ?? 'Interface Name:' }}</label>
        <input
          v-model="interfaceName"
          class="rounded-lg border border-surface-200 bg-white px-3 py-1 text-xs dark:border-surface-700 dark:bg-surface-800 dark:text-surface-100"
          :placeholder="ui?.placeholderName ?? 'RootObject'"
        />
      </div>
      <div class="flex items-center gap-2">
        <input type="checkbox" v-model="exportInterface" id="export" class="rounded border-surface-300">
        <label for="export" class="text-xs font-bold text-surface-600 dark:text-surface-400">{{ ui?.labelExport ?? 'Export' }}</label>
      </div>
    </div>

    <!-- Actions -->
    <div class="mt-4 flex flex-wrap gap-3">
      <button @click="generateTypescript" class="btn-primary px-5 py-2 text-xs">
        <Icon name="lucide:code" class="h-4 w-4 mr-1.5" />
        {{ ui?.btnGenerate ?? 'Generate' }}
      </button>
      <button @click="clearAll" class="rounded-xl border border-surface-200 bg-white px-4 py-2 text-xs font-bold text-surface-700 hover:bg-surface-50 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-300 dark:hover:bg-surface-700">
        {{ $t('system.clearAll') }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ tool: any }>()
const ui = computed(() => props.tool?.ui)

const inputJson = ref('')
const outputTs = ref('')
const error = ref('')
const interfaceName = ref('RootObject')
const exportInterface = ref(true)

const getType = (value: any): string => {
  if (value === null) return 'null'
  if (value === undefined) return 'undefined'
  if (Array.isArray(value)) {
    if (value.length === 0) return 'any[]'
    const elementType = getType(value[0])
    return `${elementType}[]`
  }
  if (typeof value === 'object') return 'object'
  return typeof value
}

const generateInterface = (obj: any, name: string, indent: number = 0): string => {
  const spaces = '  '.repeat(indent)
  const lines: string[] = []

  if (indent === 0 && exportInterface.value) {
    lines.push(`export interface ${name} {`)
  } else if (indent === 0) {
    lines.push(`interface ${name} {`)
  } else {
    lines.push(`${spaces}interface ${name} {`)
  }

  for (const [key, value] of Object.entries(obj)) {
    const type = getType(value)

    if (type === 'object' && value !== null) {
      const nestedName = capitalize(key)
      const nested = generateInterface(value, nestedName, indent + 1)
      lines.push(nested)
      lines.push(`${spaces}  ${key}: ${nestedName};`)
    } else if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object' && value[0] !== null) {
      const nestedName = capitalize(singularize(key))
      const nested = generateInterface(value[0], nestedName, indent + 1)
      lines.push(nested)
      lines.push(`${spaces}  ${key}: ${nestedName}[];`)
    } else {
      lines.push(`${spaces}  ${key}: ${type};`)
    }
  }

  lines.push(`${spaces}}`)
  return lines.join('\n')
}

const capitalize = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

const singularize = (str: string): string => {
  if (str.endsWith('ies')) return str.slice(0, -3) + 'y'
  if (str.endsWith('s')) return str.slice(0, -1)
  return str
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
      if (parsed.length === 0) {
        error.value = ui.value?.errorEmptyArray ?? 'Array is empty'
        return
      }
      outputTs.value = generateInterface(parsed[0], interfaceName.value)
    } else {
      outputTs.value = generateInterface(parsed, interfaceName.value)
    }
  } catch (e) {
    error.value = (e as Error).message
    outputTs.value = ''
  }
}

const clearAll = () => {
  outputTs.value = ''
  error.value = ''
}

const copyOutput = async () => {
  try {
    await navigator.clipboard.writeText(outputTs.value)
  } catch (e) {
    console.error('Failed to copy:', e)
  }
}

const downloadOutput = () => {
  const blob = new Blob([outputTs.value], { type: 'text/typescript' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'types.ts'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
</script>
