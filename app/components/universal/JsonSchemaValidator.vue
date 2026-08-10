<template>
  <div>
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <!-- JSON Input -->
      <div>
        <div class="flex items-center justify-between mb-2">
          <label class="text-sm font-bold text-surface-700 dark:text-surface-300">JSON Data</label>
          <div class="flex gap-2">
            <button @click="pasteJson" class="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400">
              Paste
            </button>
            <button @click="clearJson" class="text-xs text-surface-500 hover:text-surface-700 dark:text-surface-400">
              Clear
            </button>
          </div>
        </div>
        <textarea
          v-model="jsonData"
          class="w-full h-64 rounded-xl border border-surface-200 bg-surface-50 p-4 font-mono text-sm text-surface-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-100 resize-none"
          placeholder='{"name": "Alice", "age": 30}'
        ></textarea>
      </div>

      <!-- Schema Input -->
      <div>
        <div class="flex items-center justify-between mb-2">
          <label class="text-sm font-bold text-surface-700 dark:text-surface-300">JSON Schema</label>
          <div class="flex gap-2">
            <button @click="pasteSchema" class="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400">
              Paste
            </button>
            <button @click="clearSchema" class="text-xs text-surface-500 hover:text-surface-700 dark:text-surface-400">
              Clear
            </button>
          </div>
        </div>
        <textarea
          v-model="schemaData"
          class="w-full h-64 rounded-xl border border-surface-200 bg-surface-50 p-4 font-mono text-sm text-surface-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-100 resize-none"
          placeholder='{"type": "object", "properties": {"name": {"type": "string"}, "age": {"type": "number"}}, "required": ["name"]}'
        ></textarea>
      </div>
    </div>

    <!-- Actions -->
    <div class="mt-4 flex flex-wrap gap-3">
      <button @click="validate" class="btn-primary px-5 py-2 text-xs">
        <Icon name="lucide:check-circle" class="h-4 w-4 mr-1.5" />
        Validate
      </button>
      <button @click="loadSample" class="rounded-xl border border-surface-200 bg-white px-4 py-2 text-xs font-bold text-surface-700 hover:bg-surface-50 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-300 dark:hover:bg-surface-700">
        Load Sample
      </button>
      <button @click="clearAll" class="rounded-xl border border-surface-200 bg-white px-4 py-2 text-xs font-bold text-surface-700 hover:bg-surface-50 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-300 dark:hover:bg-surface-700">
        Clear All
      </button>
    </div>

    <!-- Results -->
    <div v-if="result !== null" class="mt-4">
      <div
        v-if="result.valid"
        class="rounded-xl border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20"
      >
        <div class="flex items-center gap-2">
          <Icon name="lucide:check-circle" class="h-5 w-5 text-green-500" />
          <span class="text-sm font-bold text-green-700 dark:text-green-400">Valid JSON</span>
        </div>
        <p class="mt-2 text-xs text-green-600 dark:text-green-400">The JSON data matches the schema.</p>
      </div>

      <div
        v-else
        class="rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20"
      >
        <div class="flex items-center gap-2">
          <Icon name="lucide:x-circle" class="h-5 w-5 text-red-500" />
          <span class="text-sm font-bold text-red-700 dark:text-red-400">Invalid JSON</span>
        </div>
        <div class="mt-3 space-y-2">
          <div
            v-for="(error, index) in result.errors"
            :key="index"
            class="text-xs text-red-600 dark:text-red-400"
          >
            <span class="font-mono">{{ error.path || '/' }}</span>: {{ error.message }}
          </div>
        </div>
      </div>
    </div>

    <!-- Error -->
    <div v-if="error" class="mt-4 rounded-lg bg-red-50 border border-red-200 p-3 text-xs text-red-700 dark:bg-red-900/30 dark:border-red-800 dark:text-red-400">
      {{ error }}
    </div>
  </div>
</template>

<script setup lang="ts">
const jsonData = ref('')
const schemaData = ref('')
const error = ref('')
const result = ref<{ valid: boolean; errors: Array<{ path: string; message: string }> } | null>(null)

const validateValue = (value: any, schema: any, path: string = ''): Array<{ path: string; message: string }> => {
  const errors: Array<{ path: string; message: string }> = []

  if (!schema) return errors

  // Type validation
  if (schema.type) {
    const actualType = Array.isArray(value) ? 'array' : typeof value
    if (value === null) {
      if (schema.type !== 'null') {
        errors.push({ path, message: `Expected ${schema.type}, got null` })
      }
    } else if (actualType !== schema.type) {
      errors.push({ path, message: `Expected ${schema.type}, got ${actualType}` })
    }
  }

  // Required properties
  if (schema.required && typeof value === 'object' && !Array.isArray(value)) {
    for (const key of schema.required) {
      if (!(key in value)) {
        errors.push({ path: path ? `${path}.${key}` : key, message: `Missing required property` })
      }
    }
  }

  // Properties validation
  if (schema.properties && typeof value === 'object' && !Array.isArray(value)) {
    for (const [key, propSchema] of Object.entries(schema.properties)) {
      if (key in value) {
        const childPath = path ? `${path}.${key}` : key
        errors.push(...validateValue(value[key], propSchema, childPath))
      }
    }
  }

  // Items validation (arrays)
  if (schema.items && Array.isArray(value)) {
    value.forEach((item, index) => {
      const childPath = `${path}[${index}]`
      errors.push(...validateValue(item, schema.items, childPath))
    })
  }

  // String constraints
  if (typeof value === 'string') {
    if (schema.minLength !== undefined && value.length < schema.minLength) {
      errors.push({ path, message: `String length ${value.length} is less than minimum ${schema.minLength}` })
    }
    if (schema.maxLength !== undefined && value.length > schema.maxLength) {
      errors.push({ path, message: `String length ${value.length} is greater than maximum ${schema.maxLength}` })
    }
    if (schema.pattern && !new RegExp(schema.pattern).test(value)) {
      errors.push({ path, message: `String does not match pattern ${schema.pattern}` })
    }
  }

  // Number constraints
  if (typeof value === 'number') {
    if (schema.minimum !== undefined && value < schema.minimum) {
      errors.push({ path, message: `Value ${value} is less than minimum ${schema.minimum}` })
    }
    if (schema.maximum !== undefined && value > schema.maximum) {
      errors.push({ path, message: `Value ${value} is greater than maximum ${schema.maximum}` })
    }
  }

  // Array constraints
  if (Array.isArray(value)) {
    if (schema.minItems !== undefined && value.length < schema.minItems) {
      errors.push({ path, message: `Array length ${value.length} is less than minimum ${schema.minItems}` })
    }
    if (schema.maxItems !== undefined && value.length > schema.maxItems) {
      errors.push({ path, message: `Array length ${value.length} is greater than maximum ${schema.maxItems}` })
    }
  }

  // Enum validation
  if (schema.enum && !schema.enum.includes(value)) {
    errors.push({ path, message: `Value must be one of: ${schema.enum.join(', ')}` })
  }

  return errors
}

const validate = () => {
  error.value = ''
  result.value = null

  try {
    const data = JSON.parse(jsonData.value)
    const schema = JSON.parse(schemaData.value)
    const errors = validateValue(data, schema)
    result.value = { valid: errors.length === 0, errors }
  } catch (e) {
    error.value = (e as Error).message
  }
}

const loadSample = () => {
  jsonData.value = JSON.stringify({ name: "Alice", age: 30, email: "alice@example.com" }, null, 2)
  schemaData.value = JSON.stringify({
    type: "object",
    properties: {
      name: { type: "string", minLength: 1 },
      age: { type: "number", minimum: 0 },
      email: { type: "string", pattern: "^[^@]+@[^@]+$" }
    },
    required: ["name", "email"]
  }, null, 2)
}

const pasteJson = async () => {
  try {
    jsonData.value = await navigator.clipboard.readText()
  } catch (e) {
    console.error('Failed to read clipboard:', e)
  }
}

const pasteSchema = async () => {
  try {
    schemaData.value = await navigator.clipboard.readText()
  } catch (e) {
    console.error('Failed to read clipboard:', e)
  }
}

const clearJson = () => {
  jsonData.value = ''
  error.value = ''
}

const clearSchema = () => {
  schemaData.value = ''
  error.value = ''
}

const clearAll = () => {
  jsonData.value = ''
  schemaData.value = ''
  error.value = ''
  result.value = null
}
</script>
