<template>
  <div>
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <!-- Input -->
      <JsonInputEditor
        v-model="inputJson"
        :label="ui?.labelInputJson ?? 'Input JSON'"
        placeholder='{"name": "Alice", "age": 30}'
        @clear="clearAll"
      />

      <!-- Output -->
      <div>
        <div class="flex items-center justify-between mb-2">
          <label class="text-sm font-bold text-surface-700 dark:text-surface-300">{{ ui?.labelOutput ?? 'Code Output' }}</label>
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
            v-model="outputCode"
            readonly
            class="w-full h-64 rounded-xl border border-surface-200 bg-surface-50 p-4 font-mono text-sm text-surface-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-100 resize-none"
            :placeholder="ui?.placeholderOutput ?? 'Code output will appear here...'"
          ></textarea>
          <div v-if="error" class="absolute bottom-2 left-2 right-2 rounded-lg bg-red-50 border border-red-200 p-2 text-xs text-red-700 dark:bg-red-900/30 dark:border-red-800 dark:text-red-400">
            {{ error }}
          </div>
        </div>
      </div>
    </div>

    <!-- Language Selection -->
    <div class="mt-4 flex flex-wrap items-center gap-4">
      <div class="flex items-center gap-2">
        <label class="text-xs font-bold text-surface-600 dark:text-surface-400">{{ ui?.labelLanguage ?? 'Language:' }}</label>
        <select v-model="language" class="rounded-lg border border-surface-200 bg-white px-2 py-1 text-xs dark:border-surface-700 dark:bg-surface-800">
          <option value="typescript">TypeScript</option>
          <option value="python">Python</option>
          <option value="go">Go</option>
          <option value="rust">Rust</option>
          <option value="java">Java</option>
        </select>
      </div>
      <div class="flex items-center gap-2">
        <label class="text-xs font-bold text-surface-600 dark:text-surface-400">{{ ui?.labelTypeName ?? 'Type Name:' }}</label>
        <input
          v-model="typeName"
          class="rounded-lg border border-surface-200 bg-white px-3 py-1 text-xs dark:border-surface-700 dark:bg-surface-800 dark:text-surface-100"
          :placeholder="ui?.placeholderName ?? 'RootObject'"
        />
      </div>
    </div>

    <!-- Actions -->
    <div class="mt-4 flex flex-wrap gap-3">
      <button @click="generate" class="btn-primary px-5 py-2 text-xs">
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
const outputCode = ref('')
const error = ref('')
const language = ref('typescript')
const typeName = ref('RootObject')

const getType = (value: any, lang: string): string => {
  if (value === null) return lang === 'typescript' ? 'null' : 'None'
  if (Array.isArray(value)) {
    if (value.length === 0) return lang === 'typescript' ? 'any[]' : 'list'
    const elementType = getType(value[0], lang)
    if (lang === 'typescript') return `${elementType}[]`
    if (lang === 'python') return `list[${elementType}]`
    if (lang === 'go') return `[]${elementType}`
    if (lang === 'rust') return `Vec<${elementType}>`
    if (lang === 'java') return `List<${elementType}>`
  }
  if (typeof value === 'object') return 'object'
  if (typeof value === 'string') {
    if (lang === 'typescript') return 'string'
    if (lang === 'python') return 'str'
    if (lang === 'go') return 'string'
    if (lang === 'rust') return 'String'
    if (lang === 'java') return 'String'
  }
  if (typeof value === 'number') {
    if (lang === 'typescript') return 'number'
    if (lang === 'python') return 'int' // simplified
    if (lang === 'go') return 'int'
    if (lang === 'rust') return 'i64'
    if (lang === 'java') return 'int'
  }
  if (typeof value === 'boolean') {
    if (lang === 'typescript') return 'boolean'
    if (lang === 'python') return 'bool'
    if (lang === 'go') return 'bool'
    if (lang === 'rust') return 'bool'
    if (lang === 'java') return 'boolean'
  }
  return 'any'
}

const generateTypeScript = (obj: any, name: string): string => {
  const lines: string[] = [`export interface ${name} {`]
  for (const [key, value] of Object.entries(obj)) {
    const type = getType(value, 'typescript')
    if (type === 'object') {
      const nested = generateTypeScript(value, capitalize(key))
      lines.unshift(nested)
      lines.push(`  ${key}: ${capitalize(key)};`)
    } else {
      lines.push(`  ${key}: ${type};`)
    }
  }
  lines.push('}')
  return lines.join('\n')
}

const generatePython = (obj: any, name: string): string => {
  const lines: string[] = [`class ${name}:`]
  const initLines: string[] = ['    def __init__(self):']
  for (const [key, value] of Object.entries(obj)) {
    const type = getType(value, 'python')
    initLines.push(`        self.${key}: ${type} = ${JSON.stringify(value)}`)
  }
  lines.push(initLines.join('\n'))
  return lines.join('\n')
}

const generateGo = (obj: any, name: string): string => {
  const lines: string[] = [`type ${name} struct {`]
  for (const [key, value] of Object.entries(obj)) {
    const type = getType(value, 'go')
    const goKey = capitalize(key)
    lines.push(`    ${goKey} ${type} \`json:"${key}"\``)
  }
  lines.push('}')
  return lines.join('\n')
}

const generateRust = (obj: any, name: string): string => {
  const lines: string[] = ['#[derive(Debug, Serialize, Deserialize)]', `pub struct ${name} {`]
  for (const [key, value] of Object.entries(obj)) {
    const type = getType(value, 'rust')
    lines.push(`    pub ${key}: ${type},`)
  }
  lines.push('}')
  return lines.join('\n')
}

const generateJava = (obj: any, name: string): string => {
  const lines: string[] = [`public class ${name} {`]
  for (const [key, value] of Object.entries(obj)) {
    const type = getType(value, 'java')
    lines.push(`    private ${type} ${key};`)
  }
  lines.push('')
  lines.push('    // Getters and Setters')
  lines.push('}')
  return lines.join('\n')
}

const capitalize = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

const generate = () => {
  error.value = ''
  try {
    const parsed = JSON.parse(inputJson.value)
    const name = typeName.value || 'RootObject'

    switch (language.value) {
      case 'typescript':
        outputCode.value = generateTypeScript(parsed, name)
        break
      case 'python':
        outputCode.value = generatePython(parsed, name)
        break
      case 'go':
        outputCode.value = generateGo(parsed, name)
        break
      case 'rust':
        outputCode.value = generateRust(parsed, name)
        break
      case 'java':
        outputCode.value = generateJava(parsed, name)
        break
    }
  } catch (e) {
    error.value = (e as Error).message
    outputCode.value = ''
  }
}

const clearAll = () => {
  outputCode.value = ''
  error.value = ''
}

const copyOutput = async () => {
  try {
    await navigator.clipboard.writeText(outputCode.value)
  } catch (e) {
    console.error('Failed to copy:', e)
  }
}

const downloadOutput = () => {
  const ext = { typescript: 'ts', python: 'py', go: 'go', rust: 'rs', java: 'java' }[language.value] || 'txt'
  const blob = new Blob([outputCode.value], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `output.${ext}`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
</script>
