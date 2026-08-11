<template>
  <div>
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <!-- Input JSON -->
      <div>
        <div class="flex items-center justify-between mb-2">
          <label class="text-sm font-bold text-surface-700 dark:text-surface-300">{{ ui?.labelInputJson ?? 'Input JSON' }}</label>
          <div class="flex gap-2">
            <button @click="pasteFromClipboard" class="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400">
              {{ $t('system.paste') }}
            </button>
            <button @click="clearInput" class="text-xs text-surface-500 hover:text-surface-700 dark:text-surface-400">
              {{ $t('system.clear') }}
            </button>
          </div>
        </div>
        <textarea
          v-model="inputJson"
          class="w-full h-64 rounded-xl border border-surface-200 bg-surface-50 p-4 font-mono text-sm text-surface-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-100 resize-none"
          placeholder='{"store": {"book": [{"title": "Sayings of the Century"}]}}'
        ></textarea>
      </div>

      <!-- Results -->
      <div>
        <div class="flex items-center justify-between mb-2">
          <label class="text-sm font-bold text-surface-700 dark:text-surface-300">{{ ui?.labelResults ?? 'Results' }}</label>
          <span v-if="results.length > 0" class="text-xs text-surface-500 dark:text-surface-400">
            {{ (ui?.statusMatches ?? '{count} match(es)').replace('{count}', String(results.length)) }}
          </span>
        </div>
        <div class="w-full h-64 rounded-xl border border-surface-200 bg-surface-50 p-4 font-mono text-sm overflow-auto dark:border-surface-700 dark:bg-surface-800">
          <div v-if="results.length === 0 && !error" class="text-surface-400 dark:text-surface-500">
            {{ ui?.placeholderResults ?? 'Results will appear here...' }}
          </div>
          <div v-for="(result, index) in results" :key="index" class="mb-2 last:mb-0">
            <div class="text-xs text-surface-500 dark:text-surface-400 mb-1">{{ result.path }}</div>
            <div class="text-surface-900 dark:text-surface-100 break-all">{{ formatValue(result.value) }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- JSONPath Input -->
    <div class="mt-4">
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
    </div>

    <!-- Common Paths -->
    <div class="mt-4">
      <label class="text-xs font-bold text-surface-600 dark:text-surface-400 mb-2 block">{{ ui?.labelCommonPaths ?? 'Common Paths:' }}</label>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="path in commonPaths"
          :key="path"
          @click="jsonPath = path; evaluate()"
          class="rounded-lg border border-surface-200 bg-white px-3 py-1 text-xs text-surface-700 hover:bg-surface-50 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-300 dark:hover:bg-surface-700"
        >
          {{ path }}
        </button>
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
const ui = computed(() => props.tool?.ui)

const inputJson = ref('')
const jsonPath = ref('')
const error = ref('')
const results = ref<Array<{ path: string; value: any }>>([])

const commonPaths = [
  '$',
  '$.*',
  '$[0]',
  '$[*]',
  '$.store',
  '$.store.book[*]',
  '$.store.book[0]',
]

const formatValue = (val: any): string => {
  if (val === undefined) return 'undefined'
  if (val === null) return 'null'
  if (typeof val === 'object') return JSON.stringify(val, null, 2)
  return String(val)
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

const pasteFromClipboard = async () => {
  try {
    inputJson.value = await navigator.clipboard.readText()
  } catch (e) {
    console.error('Failed to read clipboard:', e)
  }
}

const clearInput = () => {
  inputJson.value = ''
  error.value = ''
  results.value = []
}
</script>
