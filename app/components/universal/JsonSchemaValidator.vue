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

        <!-- Validation Result (visible only in fullscreen) -->
        <div v-if="fullscreen && result !== null" class="mt-2 flex flex-col flex-1 min-h-0 overflow-auto rounded-xl border" :class="result.valid ? 'border-green-200 dark:border-green-800' : 'border-red-200 dark:border-red-800'">
          <div class="flex items-center justify-between px-4 py-2 border-b" :class="result.valid ? 'border-green-200 dark:border-green-800' : 'border-red-200 dark:border-red-800'">
            <label class="text-sm font-bold text-surface-700 dark:text-surface-300">{{ tool.ui?.label_result || 'Validation Result' }}</label>
            <div class="flex gap-2">
              <button @click="copyResult" class="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400">{{ $t('system.copy') }}</button>
              <button @click="downloadResult" class="text-xs text-surface-500 hover:text-surface-700 dark:text-surface-400">{{ $t('system.download') }}</button>
            </div>
          </div>
          <!-- Valid -->
          <div v-if="result.valid" class="flex flex-col items-center justify-center flex-1 gap-3 p-6 text-center">
            <Icon name="lucide:check-circle" class="w-8 h-8 text-green-400 dark:text-green-500" />
            <div>
              <p class="text-sm font-medium text-green-700 dark:text-green-400">{{ tool.ui?.status_valid || 'Valid JSON' }}</p>
              <p class="text-xs text-surface-500 dark:text-surface-400 mt-1">{{ tool.ui?.status_matches || 'The JSON data matches the schema.' }}</p>
            </div>
          </div>
          <!-- Invalid -->
          <div v-else class="flex flex-col flex-1 min-h-0">
            <div class="flex flex-col items-center justify-center gap-2 p-4 text-center">
              <Icon name="lucide:x-circle" class="w-8 h-8 text-red-400 dark:text-red-500" />
              <p class="text-sm font-medium text-red-700 dark:text-red-400">{{ result.fieldErrors.length }} {{ result.fieldErrors.length === 1 ? 'error' : 'errors' }} found</p>
            </div>
            <div class="flex-1 min-h-0 overflow-auto border-t border-red-200 dark:border-red-800">
              <JsonErrorsPanel :field-errors="result.fieldErrors" @locate-field-error="onLocateFieldError" />
              <div v-if="parsedData" class="p-4">
                <JsonTreeNode :data="parsedData" path="" />
              </div>
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

  <!-- Validation Result (hidden in fullscreen, shown inside panel instead) -->
  <div v-if="!fullscreen && result !== null" class="mt-4 rounded-xl border overflow-hidden" :class="result.valid ? 'border-green-200 dark:border-green-800' : 'border-red-200 dark:border-red-800'">
    <div class="flex items-center justify-between px-4 py-2 border-b" :class="result.valid ? 'border-green-200 dark:border-green-800' : 'border-red-200 dark:border-red-800'">
      <label class="text-sm font-bold text-surface-700 dark:text-surface-300">{{ tool.ui?.label_result || 'Validation Result' }}</label>
      <div class="flex gap-2">
        <button @click="copyResult" class="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400">{{ $t('system.copy') }}</button>
        <button @click="downloadResult" class="text-xs text-surface-500 hover:text-surface-700 dark:text-surface-400">{{ $t('system.download') }}</button>
      </div>
    </div>
    <!-- Valid -->
    <div v-if="result.valid" class="flex flex-col items-center justify-center gap-3 p-6 text-center">
      <Icon name="lucide:check-circle" class="w-8 h-8 text-green-400 dark:text-green-500" />
      <div>
        <p class="text-sm font-medium text-green-700 dark:text-green-400">{{ tool.ui?.status_valid || 'Valid JSON' }}</p>
        <p class="text-xs text-surface-500 dark:text-surface-400 mt-1">{{ tool.ui?.status_matches || 'The JSON data matches the schema.' }}</p>
      </div>
    </div>
    <!-- Invalid -->
    <div v-else>
      <div class="flex flex-col items-center justify-center gap-2 p-4 text-center">
        <Icon name="lucide:x-circle" class="w-8 h-8 text-red-400 dark:text-red-500" />
        <p class="text-sm font-medium text-red-700 dark:text-red-400">{{ result.fieldErrors.length }} {{ result.fieldErrors.length === 1 ? 'error' : 'errors' }} found</p>
      </div>
      <div class="border-t border-red-200 dark:border-red-800">
        <JsonErrorsPanel :field-errors="result.fieldErrors" @locate-field-error="onLocateFieldError" />
        <div v-if="parsedData" class="p-4">
          <JsonTreeNode :data="parsedData" path="" />
        </div>
      </div>
    </div>
  </div>

  <div v-if="!fullscreen && schemaError" class="mt-4 rounded-lg bg-red-50 border border-red-200 p-3 text-xs text-red-700 dark:bg-red-900/30 dark:border-red-800 dark:text-red-400">
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
