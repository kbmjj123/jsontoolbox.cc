<template>
  <ResizablePanel v-model:fullscreen="fullscreen" :initial-ratio="0.5" responsive>
    <template #first>
      <div class="h-full pr-3">
        <JsonInputEditor
          v-model="jsonData"
          :label="tool.ui?.label_json_data || 'JSON Data'"
          placeholder='{"name": "Alice", "age": 30}'
          show-upload
          show-load-url
          @clear="clearJsonData"
        />
      </div>
    </template>
    <template #second>
      <div class="h-full pl-3 flex flex-col overflow-hidden">
        <JsonInputEditor
          v-model="schemaData"
          :label="tool.ui?.label_json_schema || 'JSON Schema'"
          placeholder='{"type": "object", "properties": {"name": {"type": "string"}}, "required": ["name"]}'
          show-upload
          accept=".json"
          @clear="clearSchemaData"
        />

        <!-- Validation Result (inside panel, visible in fullscreen) -->
        <div v-if="result !== null" class="mt-2 flex flex-col flex-1 min-h-0 overflow-auto">
          <div class="flex items-center justify-between mb-2">
            <label class="text-sm font-bold text-surface-700 dark:text-surface-300">{{ tool.ui?.label_result || 'Validation Result' }}</label>
            <div class="flex gap-2">
              <button @click="copyResult" class="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400">{{ $t('system.copy') }}</button>
              <button @click="downloadResult" class="text-xs text-surface-500 hover:text-surface-700 dark:text-surface-400">{{ $t('system.download') }}</button>
            </div>
          </div>

          <!-- Valid -->
          <div v-if="result.valid" class="rounded-xl border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20">
            <div class="flex items-center gap-2">
              <Icon name="lucide:check-circle" class="h-5 w-5 text-green-500" />
              <span class="text-sm font-bold text-green-700 dark:text-green-400">{{ tool.ui?.status_valid || 'Valid JSON' }}</span>
            </div>
            <p class="mt-2 text-xs text-green-600 dark:text-green-400">{{ tool.ui?.status_matches || 'The JSON data matches the schema.' }}</p>
          </div>

          <!-- Invalid -->
          <div v-else>
            <div class="rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20 mb-2">
              <div class="flex items-center gap-2">
                <Icon name="lucide:x-circle" class="h-5 w-5 text-red-500" />
                <span class="text-sm font-bold text-red-700 dark:text-red-400">
                  {{ result.fieldErrors.length }} {{ result.fieldErrors.length === 1 ? 'error' : 'errors' }} found
                </span>
              </div>
            </div>

            <JsonErrorsPanel
              :field-errors="result.fieldErrors"
              @locate-field-error="onLocateFieldError"
            />

            <!-- Rich tree view with error markers -->
            <div v-if="parsedData" class="mt-3 rounded-xl border border-surface-200 bg-surface-50 p-4 dark:border-surface-700 dark:bg-surface-800 overflow-auto">
              <JsonTreeNode :data="parsedData" path="" />
            </div>
          </div>
        </div>
      </div>
    </template>

    <template #toolbar-left>
      <button @click="validate" class="btn-primary px-5 py-2 text-xs">
        <Icon name="lucide:check-circle" class="h-4 w-4 mr-1.5" />
        {{ $t('system.validate') }}
      </button>
      <button @click="loadSample" class="rounded-xl border border-surface-200 bg-white px-4 py-2 text-xs font-bold text-surface-700 hover:bg-surface-50 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-300 dark:hover:bg-surface-700">
        {{ tool.ui?.btn_load_sample || 'Sample' }}
      </button>
      <button @click="clearAll" class="rounded-xl border border-surface-200 bg-white px-4 py-2 text-xs font-bold text-surface-700 hover:bg-surface-50 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-300 dark:hover:bg-surface-700">
        {{ $t('system.clearAll') }}
      </button>
    </template>
  </ResizablePanel>

  <div v-if="schemaError" class="mt-4 rounded-lg bg-red-50 border border-red-200 p-3 text-xs text-red-700 dark:bg-red-900/30 dark:border-red-800 dark:text-red-400">
    {{ schemaError }}
  </div>
</template>

<script setup lang="ts">
import type { FieldError } from '~/types/jsonErrors'

const props = defineProps<{ tool: any }>()

const jsonData = ref('')
const schemaData = ref('')
const schemaError = ref('')
const result = ref<{ valid: boolean; fieldErrors: FieldError[] } | null>(null)
const fullscreen = ref(false)

const { validateWithSchemaText } = useSchemaValidation()

// Provide state for tree nodes
const errorMap = ref<Record<string, FieldError[]>>({})
provide('jsonErrors', errorMap)
const locatePath = ref('')
provide('locatePath', locatePath)
provide('treeSearch', null)
const expandAllSignal = ref(0)
const collapseAllSignal = ref(0)
provide('expandAllSignal', expandAllSignal)
provide('collapseAllSignal', collapseAllSignal)

const parsedData = computed(() => {
  try { return JSON.parse(jsonData.value) } catch { return null }
})

const validate = () => {
  schemaError.value = ''
  result.value = null
  errorMap.value = {}

  if (!jsonData.value.trim() || !schemaData.value.trim()) {
    schemaError.value = 'Please enter both JSON data and JSON Schema.'
    return
  }

  let data: any
  try {
    data = JSON.parse(jsonData.value)
  } catch (e) {
    schemaError.value = `Invalid JSON data: ${(e as Error).message}`
    return
  }

  const { errors, schemaError: se } = validateWithSchemaText(data, schemaData.value)
  if (se) {
    schemaError.value = se
    return
  }

  result.value = { valid: errors.length === 0, fieldErrors: errors }

  // Build errorMap for tree nodes
  const map: Record<string, FieldError[]> = {}
  for (const err of errors) {
    const path = err.instancePath
    if (!map[path]) map[path] = []
    map[path].push(err)
  }
  errorMap.value = map
}

const onLocateFieldError = (err: FieldError) => {
  const dotPath = err.instancePath.replace(/^\//, '').replace(/\//g, '.')
  locatePath.value = ''
  nextTick(() => { locatePath.value = dotPath })
}

const loadSample = () => {
  jsonData.value = JSON.stringify({ name: 'Alice', age: 30, email: 'alice@example.com' }, null, 2)
  schemaData.value = JSON.stringify({
    type: 'object',
    properties: {
      name: { type: 'string', minLength: 1 },
      age: { type: 'number', minimum: 0 },
      email: { type: 'string', pattern: '^[^@]+@[^@]+$' },
    },
    required: ['name', 'email'],
  }, null, 2)
}

const clearJsonData = () => { schemaError.value = '' }
const clearSchemaData = () => { schemaError.value = '' }
const clearAll = () => { schemaError.value = ''; result.value = null; errorMap.value = {} }

const copyResult = async () => {
  if (!result.value) return
  await copyToClipboard(
    JSON.stringify({ valid: result.value.valid, errors: result.value.fieldErrors, timestamp: new Date().toISOString() }, null, 2)
  )
}

const downloadResult = () => {
  if (!result.value) return
  const content = JSON.stringify({ valid: result.value.valid, errors: result.value.fieldErrors, timestamp: new Date().toISOString() }, null, 2)
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
