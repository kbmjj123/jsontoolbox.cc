<template>
  <div>
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <!-- Input -->
      <JsonInputEditor
        v-model="inputJson"
        :label="tool.ui?.label_input || 'Input JSON'"
        placeholder='{"name": "Alice", "age": 30, "active": true}'
        show-upload
        @clear="clearAll"
      />

      <!-- Output -->
      <div>
        <div class="flex items-center justify-between mb-2">
          <label class="text-sm font-bold text-surface-700 dark:text-surface-300">{{ tool.ui?.label_output || 'JSON Schema' }}</label>
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
            v-model="outputSchema"
            readonly
            class="w-full h-64 rounded-xl border border-surface-200 bg-surface-50 p-4 font-mono text-sm text-surface-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-100 resize-none"
            :placeholder="tool.ui?.placeholder_output || 'JSON Schema will appear here...'"
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
        <label class="text-xs font-bold text-surface-600 dark:text-surface-400">{{ tool.ui?.option_indent || 'Indent:' }}</label>
        <select v-model="indent" class="rounded-lg border border-surface-200 bg-white px-2 py-1 text-xs dark:border-surface-700 dark:bg-surface-800">
          <option :value="2">{{ tool.ui?.option_indent_2 || '2 spaces' }}</option>
          <option :value="4">{{ tool.ui?.option_indent_4 || '4 spaces' }}</option>
          <option value="tab">Tab</option>
        </select>
      </div>
      <label class="flex items-center gap-1.5 cursor-pointer select-none">
        <input type="checkbox" v-model="includeRequired" class="rounded border-surface-300">
        <span class="text-xs font-bold text-surface-600 dark:text-surface-400">{{ tool.ui?.option_required || 'Include required' }}</span>
      </label>
      <label class="flex items-center gap-1.5 cursor-pointer select-none">
        <input type="checkbox" v-model="additionalProperties" class="rounded border-surface-300">
        <span class="text-xs font-bold text-surface-600 dark:text-surface-400">{{ tool.ui?.option_additional || 'Additional properties' }}</span>
      </label>
    </div>

    <!-- Actions -->
    <div class="mt-3 flex flex-wrap gap-3">
      <button @click="generate" class="btn-primary px-5 py-2 text-xs">
        <Icon name="lucide:file-json" class="h-4 w-4 mr-1.5" />
        {{ tool.ui?.btn_generate || 'Generate Schema' }}
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
const outputSchema = ref('')
const error = ref('')
const indent = ref<number | string>(2)
const includeRequired = ref(true)
const additionalProperties = ref(false)

// Example data
const exampleJson = {
  user: {
    id: 1234567890,
    name: "John Doe",
    email: "john@example.com",
    avatar: "https://example.com/avatar.jpg",
    birthday: "1990-01-15",
    isActive: true,
    score: 95.5,
    tags: ["admin", "user"],
    address: {
      city: "New York",
      country: "USA"
    }
  }
}

const loadExample = () => {
  inputJson.value = JSON.stringify(exampleJson, null, 2)
  generate()
}

const inferSchema = (value: any): any => {
  if (value === null) {
    return { type: 'null' }
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return { type: 'array' }
    }
    return {
      type: 'array',
      items: inferSchema(value[0])
    }
  }

  if (typeof value === 'object') {
    const properties: any = {}
    const required: string[] = []

    for (const [key, val] of Object.entries(value)) {
      properties[key] = inferSchema(val)
      required.push(key)
    }

    const schema: any = {
      type: 'object',
      properties,
    }

    if (includeRequired.value && required.length > 0) {
      schema.required = required
    }

    if (additionalProperties.value) {
      schema.additionalProperties = true
    }

    return schema
  }

  if (typeof value === 'string') {
    const schema: any = { type: 'string' }
    // Enhanced format detection
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      schema.format = 'date'
    } else if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
      schema.format = 'date-time'
    } else if (/^[^@]+@[^@]+\.[^@]+$/.test(value)) {
      schema.format = 'email'
    } else if (/^https?:\/\//.test(value)) {
      schema.format = 'uri'
    } else if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) {
      schema.format = 'uuid'
    } else if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(value)) {
      schema.format = 'ipv4'
    } else if (/^[a-zA-Z0-9][a-zA-Z0-9-\.]+\.[a-zA-Z]{2,}$/.test(value)) {
      schema.format = 'hostname'
    } else if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value)) {
      schema.pattern = '^#([0-9a-f]{3}|[0-9a-f]{6})$'
      schema.description = 'Hex color code'
    }
    return schema
  }

  if (typeof value === 'number') {
    if (Number.isInteger(value)) {
      return { type: 'integer' }
    }
    return { type: 'number' }
  }

  if (typeof value === 'boolean') {
    return { type: 'boolean' }
  }

  return {}
}

const generate = () => {
  error.value = ''
  try {
    const parsed = JSON.parse(inputJson.value)
    const schema = {
      $schema: 'http://json-schema.org/draft-07/schema#',
      ...inferSchema(parsed)
    }
    const space = indent.value === 'tab' ? '\t' : Number(indent.value)
    outputSchema.value = JSON.stringify(schema, null, space)
  } catch (e) {
    error.value = (e as Error).message
    outputSchema.value = ''
  }
}

const clearAll = () => {
  outputSchema.value = ''
  error.value = ''
}

const copyOutput = async () => {
  try {
    await navigator.clipboard.writeText(outputSchema.value)
  } catch (e) {
    console.error('Failed to copy:', e)
  }
}

const downloadOutput = () => {
  const blob = new Blob([outputSchema.value], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'schema.json'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
</script>
