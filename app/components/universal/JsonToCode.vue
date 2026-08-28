<template>
  <ResizablePanel v-model:fullscreen="fullscreen" :initial-ratio="0.5" responsive>
    <template #first>
      <div class="h-full pr-3 overflow-hidden">
        <JsonInputEditor
          ref="inputEditorRef"
          v-model="inputJson"
          :label="ui?.labelInputJson ?? 'Input JSON'"
          placeholder='{"name": "Alice", "age": 30, "email": "alice@example.com"}'
          show-upload
          show-load-url
          example-slug="json-to-code"
          @clear="clearAll"
          @paste="onPaste"
          @example-loaded="onExampleLoaded"
        />
      </div>
    </template>

    <template #second>
      <div class="h-full pl-3 flex flex-col overflow-hidden">
        <JsonOutputPanel
          :label="ui?.labelOutput ?? 'Code Output'"
          :content="outputCode"
          :error="error"
          :empty-text="ui?.placeholderOutput ?? 'Code output will appear here...'"
          download-filename="output.txt"
          @copy="copyOutput"
          @download="downloadOutput"
        />
      </div>
    </template>

    <template #toolbar-left>
      <button @click="generate" class="btn-primary px-5 py-2 text-xs">
        <Icon name="lucide:code" class="h-4 w-4 mr-1.5" />
        {{ ui?.btnGenerate ?? 'Generate' }}
      </button>

      <div class="flex items-center gap-2">
        <label class="text-xs font-bold text-surface-600 dark:text-surface-400">{{ ui?.labelLanguage ?? 'Language:' }}</label>
        <select v-model="language" class="rounded-lg border border-surface-200 bg-white px-2 py-1 text-xs dark:border-surface-700 dark:bg-surface-800">
          <option value="typescript">TypeScript</option>
          <option value="python">Python</option>
          <option value="go">Go</option>
          <option value="rust">Rust</option>
          <option value="java">Java</option>
          <option value="kotlin">Kotlin</option>
          <option value="csharp">C#</option>
          <option value="swift">Swift</option>
          <option value="mysql">MySQL</option>
          <option value="protobuf">Protobuf</option>
        </select>
      </div>
      <div class="flex items-center gap-2">
        <label class="text-xs font-bold text-surface-600 dark:text-surface-400">{{ ui?.labelTypeName ?? 'Type Name:' }}</label>
        <input
          v-model="typeName"
          class="w-28 rounded-lg border border-surface-200 bg-white px-2 py-1 text-xs dark:border-surface-700 dark:bg-surface-800 dark:text-surface-100"
          :placeholder="ui?.placeholderName ?? 'RootObject'"
        />
      </div>
    </template>
  </ResizablePanel>
</template>

<script setup lang="ts">
const props = defineProps<{ tool: any }>()

const ui = computed(() => props.tool?.ui)

const inputJson = ref('')
const outputCode = ref('')
const error = ref('')
const language = ref('typescript')
const typeName = ref('RootObject')
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

// Auto-generate on input change (debounced 300ms)
const debouncedGenerate = useDebounceFn(() => { generate() }, 300)
watch(inputJson, () => {
  debouncedGenerate()
  debouncedFormatInPlace()
})

// Re-generate when options change
watch([language, typeName], () => {
  if (inputJson.value.trim()) generate()
})

const onExampleLoaded = () => {
  nextTick(() => generate())
}

const onPaste = () => {
  nextTick(() => {
    formatInputInPlace()
    generate()
  })
}

const getType = (value: any, lang: string): string => {
  if (value === null) return lang === 'typescript' ? 'null' : 'None'
  if (Array.isArray(value)) {
    if (value.length === 0) return lang === 'typescript' ? 'any[]' : 'list'
    const elementType = getType(value[0], lang)
    if (lang === 'typescript') return `${elementType}[]`
    if (lang === 'python') return `list[${elementType}]`
    if (lang === 'go') return `[]${elementType}`
    if (lang === 'rust') return `Vec<${elementType}>`
    if (lang === 'java' || lang === 'kotlin') return `List<${elementType}>`
    if (lang === 'csharp') return `List<${elementType}>`
    if (lang === 'swift') return `[${elementType}]`
    if (lang === 'mysql') return 'JSON'
    if (lang === 'protobuf') return `repeated ${elementType}`
  }
  if (typeof value === 'object') return 'object'
  if (typeof value === 'string') {
    if (lang === 'typescript' || lang === 'go' || lang === 'csharp' || lang === 'protobuf') return 'string'
    if (lang === 'python') return 'str'
    if (lang === 'rust') return 'String'
    if (lang === 'java' || lang === 'kotlin' || lang === 'swift') return 'String'
    if (lang === 'mysql') return 'TEXT'
  }
  if (typeof value === 'number') {
    if (lang === 'typescript') return 'number'
    if (lang === 'python') return 'int'
    if (lang === 'go' || lang === 'java' || lang === 'csharp') return 'int'
    if (lang === 'rust') return 'i64'
    if (lang === 'kotlin') return 'Int'
    if (lang === 'swift') return 'Int'
    if (lang === 'mysql') return 'INT'
    if (lang === 'protobuf') return 'int32'
  }
  if (typeof value === 'boolean') {
    if (lang === 'typescript' || lang === 'python' || lang === 'go' || lang === 'rust' || lang === 'csharp' || lang === 'protobuf') return lang === 'python' ? 'bool' : 'boolean'
    if (lang === 'java') return 'boolean'
    if (lang === 'kotlin') return 'Boolean'
    if (lang === 'swift') return 'Bool'
    if (lang === 'mysql') return 'TINYINT(1)'
  }
  return 'any'
}

const capitalize = (str: string): string => str.charAt(0).toUpperCase() + str.slice(1)

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
    lines.push(`    ${capitalize(key)} ${type} \`json:"${key}"\``)
  }
  lines.push('}')
  return lines.join('\n')
}

const generateRust = (obj: any, name: string): string => {
  const lines: string[] = ['#[derive(Debug, Serialize, Deserialize)]', `pub struct ${name} {`]
  for (const [key, value] of Object.entries(obj)) {
    lines.push(`    pub ${key}: ${getType(value, 'rust')},`)
  }
  lines.push('}')
  return lines.join('\n')
}

const generateJava = (obj: any, name: string): string => {
  const lines: string[] = [`public class ${name} {`]
  for (const [key, value] of Object.entries(obj)) {
    lines.push(`    private ${getType(value, 'java')} ${key};`)
  }
  lines.push('', '    // Getters and Setters', '}')
  return lines.join('\n')
}

const generateKotlin = (obj: any, name: string): string => {
  const entries = Object.entries(obj)
  const lines: string[] = [`data class ${name}(`]
  entries.forEach(([key, value], index) => {
    const comma = index < entries.length - 1 ? ',' : ''
    lines.push(`    val ${key}: ${getType(value, 'kotlin')}${comma}`)
  })
  lines.push(')')
  return lines.join('\n')
}

const generateCSharp = (obj: any, name: string): string => {
  const lines: string[] = [`public class ${name}`, '{']
  for (const [key, value] of Object.entries(obj)) {
    lines.push(`    public ${getType(value, 'csharp')} ${capitalize(key)} { get; set; }`)
  }
  lines.push('}')
  return lines.join('\n')
}

const generateSwift = (obj: any, name: string): string => {
  const lines: string[] = [`struct ${name}: Codable {`]
  for (const [key, value] of Object.entries(obj)) {
    lines.push(`    let ${key}: ${getType(value, 'swift')}`)
  }
  lines.push('}')
  return lines.join('\n')
}

const generateMySQL = (obj: any, name: string): string => {
  const entries = Object.entries(obj)
  const lines: string[] = [`CREATE TABLE ${name} (`]
  entries.forEach(([key, value], index) => {
    const comma = index < entries.length - 1 ? ',' : ''
    lines.push(`    ${key} ${getType(value, 'mysql')}${comma}`)
  })
  lines.push(');')
  return lines.join('\n')
}

const generateProtobuf = (obj: any, name: string): string => {
  const lines: string[] = [`message ${name} {`]
  let fieldNum = 1
  for (const [key, value] of Object.entries(obj)) {
    lines.push(`  ${getType(value, 'protobuf')} ${key} = ${fieldNum};`)
    fieldNum++
  }
  lines.push('}')
  return lines.join('\n')
}

const generators: Record<string, (obj: any, name: string) => string> = {
  typescript: generateTypeScript, python: generatePython, go: generateGo, rust: generateRust,
  java: generateJava, kotlin: generateKotlin, csharp: generateCSharp, swift: generateSwift,
  mysql: generateMySQL, protobuf: generateProtobuf
}

const generate = () => {
  error.value = ''
  if (!inputJson.value.trim()) { outputCode.value = ''; return }
  try {
    const parsed = JSON.parse(inputJson.value)
    const name = typeName.value || 'RootObject'
    outputCode.value = generators[language.value]?.(parsed, name) || ''
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
  await copyToClipboard(outputCode.value)
}

const downloadOutput = () => {
  const ext: Record<string, string> = { typescript: 'ts', python: 'py', go: 'go', rust: 'rs', java: 'java', kotlin: 'kt', csharp: 'cs', swift: 'swift', mysql: 'sql', protobuf: 'proto' }
  const blob = new Blob([outputCode.value], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `output.${ext[language.value] || 'txt'}`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
</script>
