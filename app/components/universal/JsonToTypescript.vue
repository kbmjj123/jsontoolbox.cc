<template>
  <div>
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <!-- Input -->
      <div>
        <div class="flex items-center justify-between mb-2">
          <label class="text-sm font-bold text-surface-700 dark:text-surface-300">{{ ui?.labelInputJson ?? 'Input JSON' }}</label>
          <div class="flex gap-2">
            <button @click="pasteFromClipboard" class="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400">
              {{ $t('system.paste') }}
            </button>
            <button @click="clearInput" class="text-xs text-surface-500 hover:text-surface-700 dark:text-surface-400">
              {{ $t('system.clear') }}
            </button>
          </div>
        </div>
        <textarea
          v-model="inputJson"
          class="w-full h-64 rounded-xl border border-surface-200 bg-surface-50 p-4 font-mono text-sm text-surface-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-100 resize-none"
          placeholder='{"name": "Alice", "age": 30, "active": true}'
        ></textarea>
      </div>

      <!-- Output -->
      <div>
        <div class="flex items-center justify-between mb-2">
          <label class="text-sm font-bold text-surface-700 dark:text-surface-300">{{ ui?.labelOutput ?? 'TypeScript Interface' }}</label>
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
            v-model="outputTs"
            readonly
            class="w-full h-64 rounded-xl border border-surface-200 bg-surface-50 p-4 font-mono text-sm text-surface-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-100 resize-none"
            :placeholder="ui?.placeholderOutput ?? 'TypeScript interface will appear here...'"
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

const pasteFromClipboard = async () => {
  try {
    inputJson.value = await navigator.clipboard.readText()
  } catch (e) {
    console.error('Failed to read clipboard:', e)
  }
}

const clearInput = () => {
  inputJson.value = ''
  error.value = ''
}

const clearAll = () => {
  inputJson.value = ''
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
