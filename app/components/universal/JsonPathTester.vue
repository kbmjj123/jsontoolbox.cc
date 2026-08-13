<template>
  <div>
    <!-- JSON Input (compact) -->
    <div class="mb-4">
      <div class="flex items-center justify-between mb-2">
        <label class="text-sm font-bold text-surface-700 dark:text-surface-300">{{ ui?.labelInputJson ?? 'Input JSON' }}</label>
        <button
          @click="loadExample"
          class="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400"
        >
          Load Example
        </button>
      </div>
      <textarea
        v-model="inputJson"
        class="w-full h-40 rounded-xl border border-surface-200 bg-surface-50 p-4 font-mono text-sm text-surface-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-100 resize-none"
        placeholder='{"store": {"books": [{"title": "The Great Gatsby", "price": 10.99}]}}'
        @clear="clearAll"
      ></textarea>
    </div>

    <!-- JSONPath Expression -->
    <div class="mb-4">
      <label class="text-sm font-bold text-surface-700 dark:text-surface-300 mb-2 block">{{ ui?.labelExpression ?? 'JSONPath Expression' }}</label>
      <div class="flex gap-3">
        <input
          v-model="jsonPath"
          @keyup.enter="evaluate"
          class="flex-1 rounded-xl border border-surface-200 bg-white px-4 py-2.5 font-mono text-sm text-surface-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-100"
          :placeholder="ui?.placeholderExpression ?? '$.store.book[0].title'"
        />
        <button @click="evaluate" class="btn-primary px-5 py-2 text-xs">
          <Icon name="lucide:play" class="h-4 w-4 mr-1.5" />
          {{ ui?.btnEvaluate ?? 'Evaluate' }}
        </button>
      </div>

      <!-- Common Paths -->
      <div class="mt-2 flex flex-wrap gap-2">
        <button
          v-for="path in commonPaths"
          :key="path"
          @click="jsonPath = path; evaluate()"
          class="rounded-lg border border-surface-200 bg-white px-2.5 py-1 text-xs text-surface-600 hover:bg-surface-50 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-400 dark:hover:bg-surface-700"
        >
          {{ path }}
        </button>
      </div>
    </div>

    <!-- Reference Panel (Collapsible) -->
    <div class="mb-4 rounded-xl border border-surface-200 dark:border-surface-700 overflow-hidden">
      <button
        @click="showReference = !showReference"
        class="w-full flex items-center justify-between px-4 py-3 bg-surface-50 dark:bg-surface-800 hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors"
      >
        <span class="text-sm font-bold text-surface-700 dark:text-surface-300">
          <Icon name="lucide:book-open" class="h-4 w-4 mr-2 inline" />
          JSONPath Reference
        </span>
        <Icon
          :name="showReference ? 'lucide:chevron-up' : 'lucide:chevron-down'"
          class="h-4 w-4 text-surface-500"
        />
      </button>

      <div v-if="showReference" class="p-4 border-t border-surface-200 dark:border-surface-700">
        <!-- Operators -->
        <div class="mb-4">
          <h4 class="text-xs font-bold text-surface-600 dark:text-surface-400 mb-2">Operators</h4>
          <div class="overflow-x-auto">
            <table class="w-full text-xs">
              <thead>
                <tr class="border-b border-surface-200 dark:border-surface-700">
                  <th class="text-left py-1 px-2 font-bold text-surface-600 dark:text-surface-400">Operator</th>
                  <th class="text-left py-1 px-2 font-bold text-surface-600 dark:text-surface-400">Description</th>
                  <th class="text-left py-1 px-2 font-bold text-surface-600 dark:text-surface-400">Example</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="op in operators" :key="op.symbol" class="border-b border-surface-100 dark:border-surface-800">
                  <td class="py-1 px-2 font-mono text-primary-600 dark:text-primary-400">{{ op.symbol }}</td>
                  <td class="py-1 px-2 text-surface-700 dark:text-surface-300">{{ op.description }}</td>
                  <td class="py-1 px-2 font-mono text-surface-500 dark:text-surface-400">{{ op.example }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Functions -->
        <div class="mb-4">
          <h4 class="text-xs font-bold text-surface-600 dark:text-surface-400 mb-2">Functions</h4>
          <div class="overflow-x-auto">
            <table class="w-full text-xs">
              <thead>
                <tr class="border-b border-surface-200 dark:border-surface-700">
                  <th class="text-left py-1 px-2 font-bold text-surface-600 dark:text-surface-400">Function</th>
                  <th class="text-left py-1 px-2 font-bold text-surface-600 dark:text-surface-400">Returns</th>
                  <th class="text-left py-1 px-2 font-bold text-surface-600 dark:text-surface-400">Description</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="fn in functions" :key="fn.name" class="border-b border-surface-100 dark:border-surface-800">
                  <td class="py-1 px-2 font-mono text-primary-600 dark:text-primary-400">{{ fn.name }}</td>
                  <td class="py-1 px-2 text-surface-500 dark:text-surface-400">{{ fn.returns }}</td>
                  <td class="py-1 px-2 text-surface-700 dark:text-surface-300">{{ fn.description }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Filter Operators -->
        <div>
          <h4 class="text-xs font-bold text-surface-600 dark:text-surface-400 mb-2">Filter Operators</h4>
          <div class="overflow-x-auto">
            <table class="w-full text-xs">
              <thead>
                <tr class="border-b border-surface-200 dark:border-surface-700">
                  <th class="text-left py-1 px-2 font-bold text-surface-600 dark:text-surface-400">Operator</th>
                  <th class="text-left py-1 px-2 font-bold text-surface-600 dark:text-surface-400">Description</th>
                  <th class="text-left py-1 px-2 font-bold text-surface-600 dark:text-surface-400">Example</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="filter in filterOperators" :key="filter.operator" class="border-b border-surface-100 dark:border-surface-800">
                  <td class="py-1 px-2 font-mono text-primary-600 dark:text-primary-400">{{ filter.operator }}</td>
                  <td class="py-1 px-2 text-surface-700 dark:text-surface-300">{{ filter.description }}</td>
                  <td class="py-1 px-2 font-mono text-surface-500 dark:text-surface-400 text-xs">{{ filter.example }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- Error -->
    <div v-if="error" class="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-xs text-red-700 dark:bg-red-900/30 dark:border-red-800 dark:text-red-400">
      {{ error }}
    </div>

    <!-- Results (full width) -->
    <div>
      <div class="flex items-center justify-between mb-2">
        <label class="text-sm font-bold text-surface-700 dark:text-surface-300">{{ ui?.labelResults ?? 'Results' }}</label>
        <span v-if="results.length > 0" class="text-xs text-surface-500 dark:text-surface-400">
          {{ (ui?.statusMatches ?? '{count} match(es)').replace('{count}', String(results.length)) }}
        </span>
      </div>
      <div class="min-h-[12rem] max-h-[30rem] rounded-xl border border-surface-200 bg-surface-50 p-4 font-mono text-sm overflow-auto dark:border-surface-700 dark:bg-surface-800">
        <div v-if="results.length === 0 && !error" class="flex items-center justify-center h-full text-surface-400 dark:text-surface-500 text-sm">
          {{ ui?.placeholderResults ?? 'Enter a JSONPath expression and click Evaluate' }}
        </div>
        <div v-for="(item, index) in results" :key="index" class="mb-3 last:mb-0">
          <div class="flex items-center gap-2 mb-1">
            <span class="text-xs text-primary-600 dark:text-primary-400">{{ item.path }}</span>
            <button @click="copyPath(item.path)" class="text-xs text-surface-400 hover:text-surface-600 dark:hover:text-surface-300">
              <Icon name="lucide:copy" class="h-3 w-3" />
            </button>
          </div>
          <pre class="text-surface-900 dark:text-surface-100 whitespace-pre-wrap break-all">{{ formatValue(item.value) }}</pre>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ tool: any }>()
const ui = computed(() => props.tool?.ui)

const inputJson = ref('')
const jsonPath = ref('')
const error = ref('')
const results = ref<Array<{ path: string; value: any }>>([])
const showReference = ref(false)

// Example JSON data
const exampleJson = {
  store: {
    name: "Online Store",
    books: [
      {
        id: 1,
        title: "The Great Gatsby",
        author: "F. Scott Fitzgerald",
        price: 10.99,
        inStock: true,
        tags: ["fiction", "classic"]
      },
      {
        id: 2,
        title: "1984",
        author: "George Orwell",
        price: 8.99,
        inStock: false,
        tags: ["fiction", "dystopian"]
      }
    ],
    address: {
      city: "New York",
      country: "USA"
    }
  }
}

const commonPaths = [
  '$',
  '$.*',
  '$[0]',
  '$[*]',
  '$.store',
  '$.store.books[*]',
  '$.store.books[0]',
  '$.store.books[*].title',
  '$.store.books[?(@.price < 10)]',
]

// Reference data
const operators = [
  { symbol: '$', description: 'Root element', example: '$.store' },
  { symbol: '@', description: 'Current node', example: '[?(@.price < 10)]' },
  { symbol: '*', description: 'Wildcard', example: '$.store.*' },
  { symbol: '..', description: 'Deep scan', example: '$..price' },
  { symbol: '.', description: 'Dot notation', example: '$.store.name' },
  { symbol: '[]', description: 'Bracket notation', example: "$.store['name']" },
  { symbol: '[start:end]', description: 'Array slice', example: '$.store.books[0:2]' },
  { symbol: '[?(expr)]', description: 'Filter expression', example: '[?(@.price < 10)]' },
]

const functions = [
  { name: 'min()', returns: 'Double', description: 'Minimum value' },
  { name: 'max()', returns: 'Double', description: 'Maximum value' },
  { name: 'avg()', returns: 'Double', description: 'Average value' },
  { name: 'length()', returns: 'Integer', description: 'Array length' },
]

const filterOperators = [
  { operator: '==', description: 'Equals', example: "[?(@.name == 'Alice')]" },
  { operator: '!=', description: 'Not equals', example: "[?(@.name != 'Bob')]" },
  { operator: '<', description: 'Less than', example: '[?(@.price < 10)]' },
  { operator: '>', description: 'Greater than', example: '[?(@.price > 10)]' },
  { operator: '<=', description: 'Less or equal', example: '[?(@.price <= 10)]' },
  { operator: '>=', description: 'Greater or equal', example: '[?(@.price >= 10)]' },
  { operator: '=~', description: 'Regex match', example: "[?(@.name =~ /^A.*$/)]" },
  { operator: 'in', description: 'In set', example: "[?(@.type in ['A','B'])]" },
  { operator: 'nin', description: 'Not in set', example: "[?(@.type nin ['C','D'])]" },
]

const formatValue = (val: any): string => {
  if (val === undefined) return 'undefined'
  if (val === null) return 'null'
  if (typeof val === 'object') return JSON.stringify(val, null, 2)
  return String(val)
}

const copyPath = async (path: string) => {
  try {
    await navigator.clipboard.writeText(path)
  } catch {}
}

const getByPath = (obj: any, path: string): any[] => {
  if (!path || path === '$') return [{ path: '$', value: obj }]

  const results: Array<{ path: string; value: any }> = []
  const parts = path.replace(/^\$\.?/, '').split(/\.|\[|\]/).filter(Boolean)

  const traverse = (current: any, currentPath: string, partIndex: number) => {
    if (partIndex >= parts.length) {
      results.push({ path: currentPath, value: current })
      return
    }

    const part = parts[partIndex]

    if (current === null || current === undefined) return

    if (Array.isArray(current)) {
      if (part === '*') {
        current.forEach((item, i) => {
          traverse(item, `${currentPath}[${i}]`, partIndex + 1)
        })
      } else if (/^\d+$/.test(part)) {
        const index = parseInt(part)
        if (index < current.length) {
          traverse(current[index], `${currentPath}[${index}]`, partIndex + 1)
        }
      }
    } else if (typeof current === 'object') {
      if (part === '*') {
        Object.keys(current).forEach(key => {
          traverse(current[key], `${currentPath}.${key}`, partIndex + 1)
        })
      } else if (part in current) {
        traverse(current[part], `${currentPath}.${part}`, partIndex + 1)
      }
    }
  }

  traverse(obj, '$', 0)
  return results
}

const evaluate = () => {
  error.value = ''
  results.value = []

  if (!inputJson.value.trim()) {
    error.value = ui.value?.errorNoJson ?? 'Please enter JSON data'
    return
  }

  if (!jsonPath.value.trim()) {
    error.value = ui.value?.errorNoExpression ?? 'Please enter a JSONPath expression'
    return
  }

  try {
    const parsed = JSON.parse(inputJson.value)
    results.value = getByPath(parsed, jsonPath.value)
    if (results.value.length === 0) {
      error.value = ui.value?.errorNoMatches ?? 'No matches found'
    }
  } catch (e) {
    error.value = (e as Error).message
  }
}

const clearAll = () => {
  error.value = ''
  results.value = []
}

const loadExample = () => {
  inputJson.value = JSON.stringify(exampleJson, null, 2)
  jsonPath.value = '$.store.books[*].title'
  evaluate()
}
</script>
