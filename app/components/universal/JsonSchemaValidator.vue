<template>
  <div>
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <!-- JSON Input -->
      <JsonInputEditor
        v-model="jsonData"
        :label="tool.ui?.label_json_data || 'JSON Data'"
        height="h-40"
        placeholder='{"name": "Alice", "age": 30}'
        show-upload
        @clear="clearJsonData"
      />

      <!-- Schema Input -->
      <JsonInputEditor
        v-model="schemaData"
        :label="tool.ui?.label_json_schema || 'JSON Schema'"
        height="h-40"
        placeholder='{"type": "object", "properties": {"name": {"type": "string"}, "age": {"type": "number"}}, "required": ["name"]}'
        show-upload
        accept=".json"
        @clear="clearSchemaData"
      />
    </div>

    <!-- Actions -->
    <div class="mt-4 flex flex-wrap gap-3">
      <button @click="validate" class="btn-primary px-5 py-2 text-xs">
        <Icon name="lucide:check-circle" class="h-4 w-4 mr-1.5" />
        {{ $t('system.validate') }}
      </button>
      <button @click="loadSample" class="rounded-xl border border-surface-200 bg-white px-4 py-2 text-xs font-bold text-surface-700 hover:bg-surface-50 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-300 dark:hover:bg-surface-700">
        {{ tool.ui?.btn_load_sample || 'Load Sample' }}
      </button>
      <button @click="clearAll" class="rounded-xl border border-surface-200 bg-white px-4 py-2 text-xs font-bold text-surface-700 hover:bg-surface-50 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-300 dark:hover:bg-surface-700">
        {{ $t('system.clearAll') }}
      </button>
    </div>

    <!-- Results -->
    <div v-if="result !== null" class="mt-4">
      <div class="flex items-center justify-between mb-2">
        <label class="text-sm font-bold text-surface-700 dark:text-surface-300">{{ tool.ui?.label_result || 'Validation Result' }}</label>
        <div class="flex gap-2">
          <button @click="copyResult" class="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400">
            {{ $t('system.copy') }}
          </button>
          <button @click="downloadResult" class="text-xs text-surface-500 hover:text-surface-700 dark:text-surface-400">
            {{ $t('system.download') }}
          </button>
        </div>
      </div>

      <div
        v-if="result.valid"
        class="rounded-xl border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20"
      >
        <div class="flex items-center gap-2">
          <Icon name="lucide:check-circle" class="h-5 w-5 text-green-500" />
          <span class="text-sm font-bold text-green-700 dark:text-green-400">{{ tool.ui?.status_valid || 'Valid JSON' }}</span>
        </div>
        <p class="mt-2 text-xs text-green-600 dark:text-green-400">{{ tool.ui?.status_matches || 'The JSON data matches the schema.' }}</p>
      </div>

      <div
        v-else
        class="rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20"
      >
        <div class="flex items-center gap-2">
          <Icon name="lucide:x-circle" class="h-5 w-5 text-red-500" />
          <span class="text-sm font-bold text-red-700 dark:text-red-400">{{ tool.ui?.status_invalid || 'Invalid JSON' }}</span>
        </div>
        <div class="mt-3 space-y-2">
          <div
            v-for="(err, index) in result.errors"
            :key="index"
            class="text-xs text-red-600 dark:text-red-400"
          >
            <span class="font-mono">{{ err.path || '/' }}</span>: {{ err.message }}
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
const props = defineProps<{ tool: any }>()

const jsonData = ref('')
const schemaData = ref('')
const error = ref('')
const result = ref<{ valid: boolean; errors: Array<{ path: string; message: string }> } | null>(null)

const ui = computed(() => props.tool?.ui || {})

const validateValue = (value: any, schema: any, path: string = ''): Array<{ path: string; message: string }> => {
  const errors: Array<{ path: string; message: string }> = []

  if (!schema) return errors

  // Type validation
  if (schema.type) {
    const actualType = Array.isArray(value) ? 'array' : typeof value
    if (value === null) {
      if (schema.type !== 'null') {
        errors.push({ path, message: `${ui.value.error_expected_type || 'Expected'} ${schema.type}, ${ui.value.error_got_null || 'got null'}` })
      }
    } else if (actualType !== schema.type) {
      errors.push({ path, message: `${ui.value.error_expected_type || 'Expected'} ${schema.type}, ${ui.value.error_got_type || 'got'} ${actualType}` })
    }
  }

  // Required properties
  if (schema.required && typeof value === 'object' && !Array.isArray(value)) {
    for (const key of schema.required) {
      if (!(key in value)) {
        errors.push({ path: path ? `${path}.${key}` : key, message: ui.value.error_missing_required || 'Missing required property' })
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
      errors.push({ path, message: `${ui.value.error_string_too_short || 'String length'} ${value.length} ${ui.value.error_string_less_min || 'is less than minimum'} ${schema.minLength}` })
    }
    if (schema.maxLength !== undefined && value.length > schema.maxLength) {
      errors.push({ path, message: `${ui.value.error_string_too_long || 'String length'} ${value.length} ${ui.value.error_string_greater_max || 'is greater than maximum'} ${schema.maxLength}` })
    }
    if (schema.pattern && !new RegExp(schema.pattern).test(value)) {
      errors.push({ path, message: `${ui.value.error_string_no_match || 'String does not match pattern'} ${schema.pattern}` })
    }
  }

  // Number constraints
  if (typeof value === 'number') {
    if (schema.minimum !== undefined && value < schema.minimum) {
      errors.push({ path, message: `${ui.value.error_value_too_small || 'Value'} ${value} ${ui.value.error_number_less_min || 'is less than minimum'} ${schema.minimum}` })
    }
    if (schema.maximum !== undefined && value > schema.maximum) {
      errors.push({ path, message: `${ui.value.error_value_too_large || 'Value'} ${value} ${ui.value.error_number_greater_max || 'is greater than maximum'} ${schema.maximum}` })
    }
  }

  // Array constraints
  if (Array.isArray(value)) {
    if (schema.minItems !== undefined && value.length < schema.minItems) {
      errors.push({ path, message: `${ui.value.error_array_too_short || 'Array length'} ${value.length} ${ui.value.error_array_less_min || 'is less than minimum'} ${schema.minItems}` })
    }
    if (schema.maxItems !== undefined && value.length > schema.maxItems) {
      errors.push({ path, message: `${ui.value.error_array_too_long || 'Array length'} ${value.length} ${ui.value.error_array_greater_max || 'is greater than maximum'} ${schema.maxItems}` })
    }
  }

  // Enum validation
  if (schema.enum && !schema.enum.includes(value)) {
    errors.push({ path, message: `${ui.value.error_enum_invalid || 'Value must be one of:'} ${schema.enum.join(', ')}` })
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

const clearJsonData = () => {
  error.value = ''
}

const clearSchemaData = () => {
  error.value = ''
}

const clearAll = () => {
  error.value = ''
  result.value = null
}

const copyResult = async () => {
  if (!result.value) return

  const report = {
    valid: result.value.valid,
    errors: result.value.errors,
    timestamp: new Date().toISOString(),
  }

  try {
    await navigator.clipboard.writeText(JSON.stringify(report, null, 2))
  } catch (e) {
    console.error('Failed to copy:', e)
  }
}

const downloadResult = () => {
  if (!result.value) return

  const report = {
    valid: result.value.valid,
    errors: result.value.errors,
    timestamp: new Date().toISOString(),
  }

  const content = JSON.stringify(report, null, 2)
  const blob = new Blob([content], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'validation-report.json'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
</script>
