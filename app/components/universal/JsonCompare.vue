<template>
  <div>
    <!-- Mobile: stacked layout -->
    <div class="grid grid-cols-1 gap-4 lg:hidden">
      <JsonInputEditor
        v-model="leftJson"
        :label="tool.ui?.label_json_a || 'JSON A (Original)'"
        placeholder='{"name": "Alice", "age": 30}'
        @clear="onClearLeft"
      />
      <JsonInputEditor
        v-model="rightJson"
        :label="tool.ui?.label_json_b || 'JSON B (Modified)'"
        placeholder='{"name": "Alice", "age": 31, "email": "alice@example.com"}'
        @clear="onClearRight"
      />
    </div>

    <!-- Desktop: resizable split -->
    <div class="hidden lg:block">
      <ResizablePanel :initial-ratio="0.5">
        <template #first>
          <div class="pr-2">
            <JsonInputEditor
              v-model="leftJson"
              :label="tool.ui?.label_json_a || 'JSON A (Original)'"
              placeholder='{"name": "Alice", "age": 30}'
              @clear="onClearLeft"
            />
          </div>
        </template>
        <template #second>
          <div class="pl-2">
            <JsonInputEditor
              v-model="rightJson"
              :label="tool.ui?.label_json_b || 'JSON B (Modified)'"
              placeholder='{"name": "Alice", "age": 31, "email": "alice@example.com"}'
              @clear="onClearRight"
            />
          </div>
        </template>
      </ResizablePanel>
    </div>

    <!-- Actions -->
    <div class="mt-4 flex flex-wrap items-center gap-3">
      <button @click="compare" class="btn-primary px-5 py-2 text-xs">
        <Icon name="lucide:git-compare" class="h-4 w-4 mr-1.5" />
        {{ tool.ui?.btn_compare || 'Compare' }}
      </button>
      <button @click="swapInputs" class="rounded-xl border border-surface-200 bg-white px-4 py-2 text-xs font-bold text-surface-700 hover:bg-surface-50 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-300 dark:hover:bg-surface-700">
        <Icon name="lucide:arrow-left-right" class="h-4 w-4 mr-1.5" />
        {{ tool.ui?.btn_swap || 'Swap' }}
      </button>
      <button @click="clearAll" class="rounded-xl border border-surface-200 bg-white px-4 py-2 text-xs font-bold text-surface-700 hover:bg-surface-50 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-300 dark:hover:bg-surface-700">
        {{ $t('system.clearAll') }}
      </button>

      <!-- Error -->
      <div v-if="error" class="flex-1 rounded-lg bg-red-50 border border-red-200 p-2 text-xs text-red-700 dark:bg-red-900/30 dark:border-red-800 dark:text-red-400">
        {{ error }}
      </div>
    </div>

    <!-- Stats -->
    <div v-if="diffs.length > 0" class="mt-4 flex flex-wrap gap-3">
      <div class="stat-chip">
        <span class="h-2 w-2 rounded-full bg-red-500"></span>
        {{ removedCount }} {{ tool.ui?.status_removed || 'removed' }}
      </div>
      <div class="stat-chip">
        <span class="h-2 w-2 rounded-full bg-green-500"></span>
        {{ addedCount }} {{ tool.ui?.status_added || 'added' }}
      </div>
      <div class="stat-chip">
        <span class="h-2 w-2 rounded-full bg-yellow-500"></span>
        {{ changedCount }} {{ tool.ui?.status_changed || 'changed' }}
      </div>
      <div class="stat-chip">
        <span class="h-2 w-2 rounded-full bg-surface-400"></span>
        {{ totalDiffs }} {{ tool.ui?.status_total || 'total differences' }}
      </div>
    </div>

    <!-- Diff Results -->
    <div v-if="diffs.length > 0" class="mt-4 rounded-xl border border-surface-200 bg-white dark:border-surface-700 dark:bg-surface-900 overflow-hidden">
      <div class="px-4 py-3 border-b border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800">
        <div class="flex items-center gap-2 text-sm font-bold text-surface-700 dark:text-surface-300">
          <Icon name="lucide:list" class="h-4 w-4" />
          {{ tool.ui?.label_differences || 'Differences' }}
        </div>
      </div>
      <div class="max-h-96 overflow-y-auto">
        <div
          v-for="(diff, index) in diffs"
          :key="index"
          class="flex items-start gap-3 px-4 py-3 border-b border-surface-100 dark:border-surface-800 last:border-0"
        >
          <!-- Type Badge -->
          <span
            class="flex-shrink-0 mt-0.5 inline-flex items-center rounded-md px-2 py-0.5 text-xs font-bold"
            :class="{
              'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400': diff.type === 'removed',
              'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400': diff.type === 'added',
              'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400': diff.type === 'changed',
            }"
          >
            {{ diffTypeLabel(diff.type) }}
          </span>

          <!-- Path -->
          <div class="flex-1 min-w-0">
            <div class="font-mono text-sm text-surface-900 dark:text-surface-100 break-all">
              {{ diff.path }}
            </div>
            <div v-if="diff.type === 'changed'" class="mt-1 text-xs">
              <span class="text-red-600 dark:text-red-400 line-through">{{ formatValue(diff.oldValue) }}</span>
              <span class="text-surface-400 mx-1">→</span>
              <span class="text-green-600 dark:text-green-400">{{ formatValue(diff.newValue) }}</span>
            </div>
            <div v-else-if="diff.type === 'added'" class="mt-1 text-xs text-green-600 dark:text-green-400">
              {{ formatValue(diff.value) }}
            </div>
            <div v-else-if="diff.type === 'removed'" class="mt-1 text-xs text-red-600 dark:text-red-400">
              {{ formatValue(diff.value) }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- No Diff -->
    <div v-else-if="compared && diffs.length === 0" class="mt-4 rounded-xl border border-green-200 bg-green-50 p-6 text-center dark:border-green-800 dark:bg-green-900/20">
      <Icon name="lucide:check-circle" class="h-8 w-8 mx-auto text-green-500 mb-2" />
      <p class="text-sm font-bold text-green-700 dark:text-green-400">{{ tool.ui?.status_identical || 'JSON documents are identical!' }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ tool: any }>()

interface Diff {
  path: string
  type: 'added' | 'removed' | 'changed'
  value?: any
  oldValue?: any
  newValue?: any
}

const leftJson = ref('')
const rightJson = ref('')
const error = ref('')
const diffs = ref<Diff[]>([])
const compared = ref(false)

const addedCount = computed(() => diffs.value.filter(d => d.type === 'added').length)
const removedCount = computed(() => diffs.value.filter(d => d.type === 'removed').length)
const changedCount = computed(() => diffs.value.filter(d => d.type === 'changed').length)
const totalDiffs = computed(() => diffs.value.length)

const diffTypeLabel = (type: string): string => {
  const ui = props.tool?.ui
  if (!ui) return type
  const map: Record<string, string> = {
    added: ui.status_added || type,
    removed: ui.status_removed || type,
    changed: ui.status_changed || type,
  }
  return map[type] || type
}

const formatValue = (val: any): string => {
  if (val === undefined) return 'undefined'
  if (val === null) return 'null'
  if (typeof val === 'string') return `"${val}"`
  if (typeof val === 'object') return JSON.stringify(val)
  return String(val)
}

const compareObjects = (left: any, right: any, path: string, result: Diff[]) => {
  if (left === right) return

  // Handle null/undefined
  if (left === null || left === undefined || right === null || right === undefined) {
    if (left !== right) {
      result.push({
        path,
        type: left == null ? 'added' : 'removed',
        value: left == null ? right : left,
      })
    }
    return
  }

  // Handle different types
  if (typeof left !== typeof right) {
    result.push({ path, type: 'changed', oldValue: left, newValue: right })
    return
  }

  // Handle arrays
  if (Array.isArray(left) && Array.isArray(right)) {
    const maxLen = Math.max(left.length, right.length)
    for (let i = 0; i < maxLen; i++) {
      const itemPath = `${path}[${i}]`
      if (i >= left.length) {
        result.push({ path: itemPath, type: 'added', value: right[i] })
      } else if (i >= right.length) {
        result.push({ path: itemPath, type: 'removed', value: left[i] })
      } else {
        compareObjects(left[i], right[i], itemPath, result)
      }
    }
    return
  }

  // Handle objects
  if (typeof left === 'object' && typeof right === 'object') {
    const allKeys = new Set([...Object.keys(left), ...Object.keys(right)])
    for (const key of allKeys) {
      const childPath = path ? `${path}.${key}` : key
      if (!(key in left)) {
        result.push({ path: childPath, type: 'added', value: right[key] })
      } else if (!(key in right)) {
        result.push({ path: childPath, type: 'removed', value: left[key] })
      } else {
        compareObjects(left[key], right[key], childPath, result)
      }
    }
    return
  }

  // Handle primitives
  if (left !== right) {
    result.push({ path, type: 'changed', oldValue: left, newValue: right })
  }
}

const compare = () => {
  error.value = ''
  diffs.value = []
  compared.value = false

  let parsedLeft: any
  let parsedRight: any

  try {
    parsedLeft = JSON.parse(leftJson.value)
  } catch (e) {
    error.value = `JSON A: ${(e as Error).message}`
    return
  }

  try {
    parsedRight = JSON.parse(rightJson.value)
  } catch (e) {
    error.value = `JSON B: ${(e as Error).message}`
    return
  }

  const result: Diff[] = []
  compareObjects(parsedLeft, parsedRight, '', result)
  diffs.value = result
  compared.value = true
}

const swapInputs = () => {
  const temp = leftJson.value
  leftJson.value = rightJson.value
  rightJson.value = temp
}

const onClearLeft = () => {
  error.value = ''
}

const onClearRight = () => {
  error.value = ''
}

const clearAll = () => {
  leftJson.value = ''
  rightJson.value = ''
  error.value = ''
  diffs.value = []
  compared.value = false
}
</script>
