<template>
  <ResizablePanel v-model:fullscreen="fullscreen" :initial-ratio="0.4" responsive>
    <template #first>
      <div class="h-full pr-3">
        <JsonInputEditor
          v-model="inputJson"
          :label="ui?.label_input ?? 'Input JSON'"
          placeholder='{"store": {"books": [{"title": "The Great Gatsby", "price": 10.99}]}}'
          show-upload
          @clear="clearAll"
        />
      </div>
    </template>
    <template #second>
      <div class="h-full pl-3 overflow-auto">
        <!-- JSONPath Expression -->
        <div class="mb-3">
          <label class="text-sm font-bold text-surface-700 dark:text-surface-300 mb-2 block">{{ ui?.label_expression ?? 'JSONPath Expression' }}</label>
          <div class="flex gap-2">
            <input
              v-model="jsonPath"
              @keyup.enter="evaluate"
              class="flex-1 rounded-xl border border-surface-200 bg-white px-3 py-2 font-mono text-sm text-surface-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-100"
              :placeholder="ui?.placeholder_expression ?? '$.store.books[0].title'"
            />
            <button @click="evaluate" class="btn-primary px-4 py-2 text-xs">
              <Icon name="lucide:play" class="h-4 w-4" />
            </button>
            <button @click="copyExpression" class="rounded-xl border border-surface-200 bg-white px-3 py-2 text-xs text-surface-500 hover:text-surface-700 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-400">
              {{ ui?.btn_copy_expression ?? 'Copy' }}
            </button>
          </div>
          <div class="mt-2 flex flex-wrap items-center gap-1.5">
            <span class="text-[11px] text-surface-400">{{ ui?.label_common_paths ?? 'Common paths:' }}</span>
            <button v-for="path in commonPaths" :key="path" @click="jsonPath = path; evaluate()" class="rounded-lg border border-surface-200 bg-white px-2 py-0.5 text-[11px] text-surface-600 hover:bg-surface-50 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-400 dark:hover:bg-surface-700">
              {{ path }}
            </button>
          </div>
        </div>

        <!-- Error -->
        <div v-if="error" class="mb-3 rounded-lg bg-red-50 border border-red-200 p-3 text-xs text-red-700 dark:bg-red-900/30 dark:border-red-800 dark:text-red-400">{{ error }}</div>

        <!-- Results -->
        <div>
          <div class="flex items-center justify-between mb-2">
            <label class="text-sm font-bold text-surface-700 dark:text-surface-300">{{ ui?.label_results ?? 'Results' }}</label>
            <div class="flex items-center gap-2">
              <span v-if="results.length > 0" class="text-xs text-surface-500 dark:text-surface-400">
                {{ (ui?.status_matches ?? '{count} match(es)').replace('{count}', String(results.length)) }}
              </span>
              <button v-if="results.length > 0" @click="copyResults" class="text-xs text-surface-400 hover:text-surface-600 dark:hover:text-surface-300">
                {{ ui?.btn_copy_results ?? 'Copy results' }}
              </button>
            </div>
          </div>
          <div class="rounded-xl border border-surface-200 bg-surface-50 p-4 font-mono text-sm overflow-auto dark:border-surface-700 dark:bg-surface-800" :class="fullscreen ? 'h-full' : 'min-h-[12rem] max-h-[30rem]'">
            <div v-if="results.length === 0 && !error" class="flex items-center justify-center h-full text-surface-400 dark:text-surface-500 text-sm">
              {{ ui?.placeholder_results ?? 'Enter a JSONPath expression and click Evaluate' }}
            </div>
            <div v-for="(item, index) in results" :key="index" class="mb-3 last:mb-0">
              <div class="flex items-center gap-2 mb-1">
                <span class="text-[11px] text-surface-400">{{ ui?.label_match_path ?? 'Path:' }}</span>
                <span class="text-xs text-primary-600 dark:text-primary-400">{{ item.path }}</span>
                <button @click="copyPath(item.path)" class="text-xs text-surface-400 hover:text-surface-600 dark:hover:text-surface-300"><Icon name="lucide:copy" class="h-3 w-3" /></button>
                <span class="text-[11px] text-surface-400">{{ ui?.label_json_pointer ?? 'Pointer:' }} <code>{{ item.pointer || '/' }}</code></span>
                <span class="text-[11px] text-surface-400">{{ ui?.label_type ?? 'Type:' }} {{ item.type }}</span>
              </div>
              <pre class="text-surface-900 dark:text-surface-100 whitespace-pre-wrap break-all">{{ formatValue(item.value) }}</pre>
            </div>
          </div>
        </div>
      </div>
    </template>

    <template #toolbar-left>
      <button @click="loadExample" class="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400">{{ ui?.btn_example ?? 'Example' }}</button>
      <button @click="clearAll" class="rounded-xl border border-surface-200 bg-white px-4 py-2 text-xs font-bold text-surface-700 hover:bg-surface-50 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-300 dark:hover:bg-surface-700">
        {{ $t('system.clearAll') }}
      </button>
    </template>
  </ResizablePanel>

  <!-- Reference Panel (Collapsible) -->
  <div class="mt-4 rounded-xl border border-surface-200 dark:border-surface-700 overflow-hidden">
    <button @click="showReference = !showReference" class="w-full flex items-center justify-between px-4 py-3 bg-surface-50 dark:bg-surface-800 hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors">
      <span class="text-sm font-bold text-surface-700 dark:text-surface-300"><Icon name="lucide:book-open" class="h-4 w-4 mr-2 inline" />{{ ui?.label_reference ?? 'JSONPath Reference' }}</span>
      <Icon :name="showReference ? 'lucide:chevron-up' : 'lucide:chevron-down'" class="h-4 w-4 text-surface-500" />
    </button>
    <div v-if="showReference" class="p-4 border-t border-surface-200 dark:border-surface-700">
      <p class="mb-3 text-xs text-surface-500 dark:text-surface-400">{{ ui?.note_supported_syntax ?? '' }}</p>
      <div class="mb-4">
        <h4 class="text-xs font-bold text-surface-600 dark:text-surface-400 mb-2">{{ ui?.label_operators ?? 'Operators' }}</h4>
        <div class="overflow-x-auto">
          <table class="w-full text-xs">
            <thead><tr class="border-b border-surface-200 dark:border-surface-700"><th class="text-left py-1 px-2 font-bold text-surface-600 dark:text-surface-400">{{ ui?.col_operator ?? 'Operator' }}</th><th class="text-left py-1 px-2 font-bold text-surface-600 dark:text-surface-400">{{ ui?.col_description ?? 'Description' }}</th><th class="text-left py-1 px-2 font-bold text-surface-600 dark:text-surface-400">{{ ui?.col_example ?? 'Example' }}</th></tr></thead>
            <tbody><tr v-for="op in operators" :key="op.symbol" class="border-b border-surface-100 dark:border-surface-800"><td class="py-1 px-2 font-mono text-primary-600 dark:text-primary-400">{{ op.symbol }}</td><td class="py-1 px-2 text-surface-700 dark:text-surface-300">{{ op.description }}</td><td class="py-1 px-2 font-mono text-surface-500 dark:text-surface-400">{{ op.example }}</td></tr></tbody>
          </table>
        </div>
      </div>
      <div>
        <h4 class="text-xs font-bold text-surface-600 dark:text-surface-400 mb-2">{{ ui?.label_filter_operators ?? 'Filter Operators' }}</h4>
        <div class="overflow-x-auto">
          <table class="w-full text-xs">
            <thead><tr class="border-b border-surface-200 dark:border-surface-700"><th class="text-left py-1 px-2 font-bold text-surface-600 dark:text-surface-400">{{ ui?.col_operator ?? 'Operator' }}</th><th class="text-left py-1 px-2 font-bold text-surface-600 dark:text-surface-400">{{ ui?.col_description ?? 'Description' }}</th><th class="text-left py-1 px-2 font-bold text-surface-600 dark:text-surface-400">{{ ui?.col_example ?? 'Example' }}</th></tr></thead>
            <tbody><tr v-for="filter in filterOperators" :key="filter.operator" class="border-b border-surface-100 dark:border-surface-800"><td class="py-1 px-2 font-mono text-primary-600 dark:text-primary-400">{{ filter.operator }}</td><td class="py-1 px-2 text-surface-700 dark:text-surface-300">{{ filter.description }}</td><td class="py-1 px-2 font-mono text-surface-500 dark:text-surface-400 text-xs">{{ filter.example }}</td></tr></tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { evaluateJsonPath } from '~/composables/useJsonPath'
import { jsonTypeLabel, toJsonPath } from '~/utils/jsonPath'

const props = defineProps<{ tool: any }>()
const toast = useToast()
const ui = computed(() => props.tool?.ui)

const inputJson = ref('')
const jsonPath = ref('')
const error = ref('')
const results = ref<Array<{ path: string; pointer: string; type: string; value: any }>>([])
const showReference = ref(false)
const fullscreen = ref(false)

const exampleJson = {
  store: {
    name: "Online Store",
    books: [
      { id: 1, title: "The Great Gatsby", author: "F. Scott Fitzgerald", price: 10.99, inStock: true, tags: ["fiction", "classic"] },
      { id: 2, title: "1984", author: "George Orwell", price: 8.99, inStock: false, tags: ["fiction", "dystopian"] }
    ],
    address: { city: "New York", country: "USA" }
  }
}

// Only examples the evaluator actually supports (no slices, no regex filters).
const commonPaths = ['$', '$.*', '$.store', '$.store.books[*]', '$.store.books[0]', '$.store.books[*].title', '$.store.books[?(@.price < 10)]']

/** Internal tree path (`store.books[0].title`) → JSON Pointer (RFC 6901). */
const toJsonPointer = (internalPath: string) => {
  if (!internalPath) return ''
  return '/' + internalPath
    .replace(/\[(\d+)\]/g, '/$1')
    .replace(/\./g, '/')
    .replace(/\/{2,}/g, '/')
    .replace(/^\//, '')
}

const operators = computed(() => [
  { symbol: '$', description: ui.value?.op_root ?? 'Root element', example: '$.store' },
  { symbol: '@', description: ui.value?.op_current ?? 'Current node inside a filter', example: '[?(@.price < 10)]' },
  { symbol: '*', description: ui.value?.op_wildcard ?? 'Wildcard: every child', example: '$.store.*' },
  { symbol: '..', description: ui.value?.op_deep_scan ?? 'Recursive descent', example: '$..price' },
  { symbol: '.', description: ui.value?.op_dot ?? 'Child by name', example: '$.store.name' },
  { symbol: "['name']", description: ui.value?.op_bracket ?? 'Child in bracket notation', example: "$.store['name']" },
  { symbol: '[?(expr)]', description: ui.value?.op_filter ?? 'Filter expression', example: '[?(@.price < 10)]' },
])

const filterOperators = computed(() => [
  { operator: '==', description: ui.value?.filter_eq ?? 'Equals', example: "[?(@.name == 'Alice')]" },
  { operator: '!=', description: ui.value?.filter_ne ?? 'Not equals', example: "[?(@.name != 'Bob')]" },
  { operator: '<', description: ui.value?.filter_lt ?? 'Less than', example: '[?(@.price < 10)]' },
  { operator: '>', description: ui.value?.filter_gt ?? 'Greater than', example: '[?(@.price > 10)]' },
  { operator: '<=', description: ui.value?.filter_lte ?? 'Less than or equal', example: '[?(@.price <= 10)]' },
  { operator: '>=', description: ui.value?.filter_gte ?? 'Greater than or equal', example: '[?(@.price >= 10)]' },
])

const formatValue = (val: any): string => {
  if (val === undefined) return 'undefined'
  if (val === null) return 'null'
  if (typeof val === 'object') return JSON.stringify(val, null, 2)
  return String(val)
}

const copyPath = async (path: string) => { await copyToClipboard(path) }
const copyExpression = async () => { await copyToClipboard(jsonPath.value) }
const copyResults = async () => {
  await copyToClipboard(results.value.map(r => `${r.path}\n${formatValue(r.value)}`).join('\n\n'))
}

const evaluate = () => {
  error.value = ''
  results.value = []
  if (!inputJson.value.trim()) {
    error.value = ui.value?.error_no_json ?? 'Please enter JSON data'
    toast.error(error.value)
    return
  }
  if (!jsonPath.value.trim()) {
    error.value = ui.value?.error_no_expression ?? 'Please enter a JSONPath expression'
    toast.error(error.value)
    return
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(inputJson.value)
  } catch (e) {
    error.value = ui.value?.status_invalid_json ?? 'The JSON could not be parsed'
    toast.error(error.value)
    return
  }

  const matches = evaluateJsonPath(parsed, jsonPath.value)
  if (matches === null) {
    // The evaluator only returns null for syntax it cannot parse.
    error.value = ui.value?.status_invalid_expression ?? 'This expression is invalid or uses unsupported syntax'
    toast.error(error.value)
    return
  }
  if (matches.length === 0) {
    error.value = ui.value?.status_no_matches ?? 'The expression is valid but matched nothing'
    toast.warning(error.value)
    return
  }

  results.value = matches.map(m => ({
    path: toJsonPath(m.path),
    pointer: toJsonPointer(m.path),
    type: jsonTypeLabel(m.value),
    value: m.value,
  }))
}

const clearAll = () => { error.value = ''; results.value = [] }

const loadExample = () => {
  inputJson.value = JSON.stringify(exampleJson, null, 2)
  jsonPath.value = '$.store.books[*].title'
  evaluate()
}
</script>
