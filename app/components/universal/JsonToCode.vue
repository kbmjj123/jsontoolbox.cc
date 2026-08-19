<template>
  <div>
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <!-- Input -->
      <JsonInputEditor
        v-model="inputJson"
        :label="ui?.labelInputJson ?? 'Input JSON'"
        placeholder='{"name": "Alice", "age": 30, "email": "alice@example.com"}'
        show-upload
        @clear="clearAll"
      />

      <!-- Output -->
      <JsonOutputPanel
        :label="ui?.labelOutput ?? 'Code Output'"
        :content="outputCode"
        :error="error"
        :empty-text="ui?.placeholderOutput ?? 'Code output will appear here...'"
        @copy="copyOutput"
        @download="downloadOutput"
      />
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
          class="rounded-lg border border-surface-200 bg-white px-3 py-1 text-xs dark:border-surface-700 dark:bg-surface-800 dark:text-surface-100"
          :placeholder="ui?.placeholderName ?? 'RootObject'"
        />
      </div>
    </div>

    <!-- Actions -->
    <div class="mt-3 flex flex-wrap gap-3">
      <button @click="generate" class="btn-primary px-5 py-2 text-xs">
        <Icon name="lucide:code" class="h-4 w-4 mr-1.5" />
        {{ ui?.btnGenerate ?? 'Generate' }}
      </button>
      <button @click="loadExample" class="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400">
        {{ ui?.btnExample ?? 'Load Example' }}
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

// Example data
const exampleJson = {
  user: {
    id: 12345,
    name: "John Doe",
    email: "john@example.com",
    isActive: true,
    score: 95.5,
    tags: ["admin", "user"],
    address: {
      street: "123 Main St",
      city: "New York",
      country: "USA"
    }
  }
}

const loadExample = () => {
  inputJson.value = JSON.stringify(exampleJson, null, 2)
  generate()
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
    if (lang === 'java') return `List<${elementType}>`
    if (lang === 'kotlin') return `List<${elementType}>`
    if (lang === 'csharp') return `List<${elementType}>`
    if (lang === 'swift') return `[${elementType}]`
    if (lang === 'mysql') return 'JSON'
    if (lang === 'protobuf') return `repeated ${elementType}`
  }
  if (typeof value === 'object') return 'object'
  if (typeof value === 'string') {
    if (lang === 'typescript') return 'string'
    if (lang === 'python') return 'str'
    if (lang === 'go') return 'string'
    if (lang === 'rust') return 'String'
    if (lang === 'java') return 'String'
    if (lang === 'kotlin') return 'String'
    if (lang === 'csharp') return 'string'
    if (lang === 'swift') return 'String'
    if (lang === 'mysql') return 'TEXT'
    if (lang === 'protobuf') return 'string'
  }
  if (typeof value === 'number') {
    if (lang === 'typescript') return 'number'
    if (lang === 'python') return 'int'
    if (lang === 'go') return 'int'
    if (lang === 'rust') return 'i64'
    if (lang === 'java') return 'int'
    if (lang === 'kotlin') return 'Int'
    if (lang === 'csharp') return 'int'
    if (lang === 'swift') return 'Int'
    if (lang === 'mysql') return 'INT'
    if (lang === 'protobuf') return 'int32'
  }
  if (typeof value === 'boolean') {
    if (lang === 'typescript') return 'boolean'
    if (lang === 'python') return 'bool'
    if (lang === 'go') return 'bool'
    if (lang === 'rust') return 'bool'
    if (lang === 'java') return 'boolean'
    if (lang === 'kotlin') return 'Boolean'
    if (lang === 'csharp') return 'bool'
    if (lang === 'swift') return 'Bool'
    if (lang === 'mysql') return 'TINYINT(1)'
    if (lang === 'protobuf') return 'bool'
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

const generateKotlin = (obj: any, name: string): string => {
  const lines: string[] = [`data class ${name}(`]
  const entries = Object.entries(obj)
  entries.forEach(([key, value], index) => {
    const type = getType(value, 'kotlin')
    const comma = index < entries.length - 1 ? ',' : ''
    lines.push(`    val ${key}: ${type}${comma}`)
  })
  lines.push(')')
  return lines.join('\n')
}

const generateCSharp = (obj: any, name: string): string => {
  const lines: string[] = [`public class ${name}`]
  lines.push('{')
  for (const [key, value] of Object.entries(obj)) {
    const type = getType(value, 'csharp')
    const pascalKey = capitalize(key)
    lines.push(`    public ${type} ${pascalKey} { get; set; }`)
  }
  lines.push('}')
  return lines.join('\n')
}

const generateSwift = (obj: any, name: string): string => {
  const lines: string[] = [`struct ${name}: Codable {`]
  for (const [key, value] of Object.entries(obj)) {
    const type = getType(value, 'swift')
    lines.push(`    let ${key}: ${type}`)
  }
  lines.push('}')
  return lines.join('\n')
}

const generateMySQL = (obj: any, name: string): string => {
  const lines: string[] = [`CREATE TABLE ${name} (`]
  const entries = Object.entries(obj)
  entries.forEach(([key, value], index) => {
    const type = getType(value, 'mysql')
    const comma = index < entries.length - 1 ? ',' : ''
    lines.push(`    ${key} ${type}${comma}`)
  })
  lines.push(');')
  return lines.join('\n')
}

const generateProtobuf = (obj: any, name: string): string => {
  const lines: string[] = [`message ${name} {`]
  let fieldNum = 1
  for (const [key, value] of Object.entries(obj)) {
    const type = getType(value, 'protobuf')
    lines.push(`  ${type} ${key} = ${fieldNum};`)
    fieldNum++
  }
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
      case 'kotlin':
        outputCode.value = generateKotlin(parsed, name)
        break
      case 'csharp':
        outputCode.value = generateCSharp(parsed, name)
        break
      case 'swift':
        outputCode.value = generateSwift(parsed, name)
        break
      case 'mysql':
        outputCode.value = generateMySQL(parsed, name)
        break
      case 'protobuf':
        outputCode.value = generateProtobuf(parsed, name)
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
  const ext: Record<string, string> = {
    typescript: 'ts',
    python: 'py',
    go: 'go',
    rust: 'rs',
    java: 'java',
    kotlin: 'kt',
    csharp: 'cs',
    swift: 'swift',
    mysql: 'sql',
    protobuf: 'proto'
  }
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
