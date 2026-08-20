<template>
  <!-- Mobile: stacked layout -->
  <div class="grid grid-cols-1 gap-4 lg:hidden">
    <JsonInputEditor
      v-model="leftJson"
      :label="tool.ui?.label_json_a || 'JSON A (Original)'"
      placeholder='{"name": "Alice", "age": 30}'
      show-load-url
      @clear="onClearLeft"
    />
    <JsonInputEditor
      v-model="rightJson"
      :label="tool.ui?.label_json_b || 'JSON B (Modified)'"
      placeholder='{"name": "Alice", "age": 31, "email": "alice@example.com"}'
      show-load-url
      @clear="onClearRight"
    />
    <div class="flex flex-wrap gap-3">
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
    </div>
  </div>

  <!-- Desktop: resizable split -->
  <div class="hidden lg:block">
    <ResizablePanel v-model:fullscreen="fullscreen" :initial-ratio="0.5" responsive>
      <template #first>
        <div class="h-full pr-3">
          <JsonInputEditor
            v-model="leftJson"
            :label="tool.ui?.label_json_a || 'JSON A (Original)'"
            placeholder='{"name": "Alice", "age": 30}'
            :height="fullscreen ? 'h-full' : undefined"
            show-upload
            show-load-url
            @clear="onClearLeft"
          />
        </div>
      </template>
      <template #second>
        <div class="h-full pl-3">
          <JsonInputEditor
            v-model="rightJson"
            :label="tool.ui?.label_json_b || 'JSON B (Modified)'"
            placeholder='{"name": "Alice", "age": 31, "email": "alice@example.com"}'
            :height="fullscreen ? 'h-full' : undefined"
            show-upload
            show-load-url
            @clear="onClearRight"
          />
        </div>
      </template>

      <template #toolbar-left>
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

        <!-- Stats -->
        <template v-if="diffs.length > 0">
          <div class="stat-chip"><span class="h-2 w-2 rounded-full bg-red-500"></span> {{ removedCount }} removed</div>
          <div class="stat-chip"><span class="h-2 w-2 rounded-full bg-green-500"></span> {{ addedCount }} added</div>
          <div class="stat-chip"><span class="h-2 w-2 rounded-full bg-yellow-500"></span> {{ changedCount }} changed</div>
        </template>
      </template>

      <template #toolbar-right>
        <div v-if="diffs.length > 0" class="flex items-center gap-2 ml-auto">
          <button @click="copyResults" class="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400">
            {{ copied ? '✓ Copied!' : 'Copy Results' }}
          </button>
          <button @click="downloadReport" class="text-xs text-surface-500 hover:text-surface-700 dark:text-surface-400">
            Download Report
          </button>
        </div>
      </template>
    </ResizablePanel>
  </div>

  <!-- Error -->
  <div v-if="error" class="mt-4 rounded-lg bg-red-50 border border-red-200 p-3 text-xs text-red-700 dark:bg-red-900/30 dark:border-red-800 dark:text-red-400">{{ error }}</div>

  <!-- Diff Results -->
  <div v-if="diffs.length > 0" class="mt-4 rounded-xl border border-surface-200 bg-white dark:border-surface-700 dark:bg-surface-900 overflow-hidden">
    <div class="px-4 py-3 border-b border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800">
      <div class="flex items-center gap-2 text-sm font-bold text-surface-700 dark:text-surface-300">
        <Icon name="lucide:list" class="h-4 w-4" />
        {{ tool.ui?.label_differences || 'Differences' }}
        <span class="text-xs font-normal text-surface-500 dark:text-surface-400">({{ totalDiffs }})</span>
      </div>
    </div>
    <div class="max-h-96 overflow-y-auto">
      <div v-for="(diff, index) in diffs" :key="index" class="flex items-start gap-3 px-4 py-3 border-b border-surface-100 dark:border-surface-800 last:border-0">
        <span class="flex-shrink-0 mt-0.5 inline-flex items-center rounded-md px-2 py-0.5 text-xs font-bold" :class="{
          'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400': diff.type === 'removed',
          'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400': diff.type === 'added',
          'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400': diff.type === 'changed',
        }">{{ diffTypeLabel(diff.type) }}</span>
        <div class="flex-1 min-w-0">
          <div class="font-mono text-sm text-surface-900 dark:text-surface-100 break-all">{{ diff.path }}</div>
          <div v-if="diff.type === 'changed'" class="mt-1 text-xs">
            <span class="text-red-600 dark:text-red-400 line-through">{{ formatValue(diff.oldValue) }}</span>
            <span class="text-surface-400 mx-1">→</span>
            <span class="text-green-600 dark:text-green-400">{{ formatValue(diff.newValue) }}</span>
          </div>
          <div v-else-if="diff.type === 'added'" class="mt-1 text-xs text-green-600 dark:text-green-400">{{ formatValue(diff.value) }}</div>
          <div v-else-if="diff.type === 'removed'" class="mt-1 text-xs text-red-600 dark:text-red-400">{{ formatValue(diff.value) }}</div>
        </div>
      </div>
    </div>
  </div>

  <!-- No Diff -->
  <div v-else-if="compared && diffs.length === 0" class="mt-4 rounded-xl border border-green-200 bg-green-50 p-6 text-center dark:border-green-800 dark:bg-green-900/20">
    <Icon name="lucide:check-circle" class="h-8 w-8 mx-auto text-green-500 mb-2" />
    <p class="text-sm font-bold text-green-700 dark:text-green-400">{{ tool.ui?.status_identical || 'JSON documents are identical!' }}</p>
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
const copied = ref(false)
const fullscreen = ref(false)

const { copied: clipboardCopied, copyToClipboard } = useClipboard()
const { loadDataFromUrl } = useUrlParams()

onMounted(() => {
  const leftUrl = loadDataFromUrl('left')
  const rightUrl = loadDataFromUrl('right')
  if (leftUrl) leftJson.value = leftUrl
  if (rightUrl) rightJson.value = rightUrl
  if (leftUrl && rightUrl) nextTick(() => compare())
})

const addedCount = computed(() => diffs.value.filter(d => d.type === 'added').length)
const removedCount = computed(() => diffs.value.filter(d => d.type === 'removed').length)
const changedCount = computed(() => diffs.value.filter(d => d.type === 'changed').length)
const totalDiffs = computed(() => diffs.value.length)

const diffTypeLabel = (type: string): string => {
  const ui = props.tool?.ui
  if (!ui) return type
  const map: Record<string, string> = { added: ui.status_added || type, removed: ui.status_removed || type, changed: ui.status_changed || type }
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
  if (left === null || left === undefined || right === null || right === undefined) {
    if (left !== right) result.push({ path, type: left == null ? 'added' : 'removed', value: left == null ? right : left })
    return
  }
  if (typeof left !== typeof right) { result.push({ path, type: 'changed', oldValue: left, newValue: right }); return }
  if (Array.isArray(left) && Array.isArray(right)) {
    const maxLen = Math.max(left.length, right.length)
    for (let i = 0; i < maxLen; i++) {
      if (i >= left.length) result.push({ path: `${path}[${i}]`, type: 'added', value: right[i] })
      else if (i >= right.length) result.push({ path: `${path}[${i}]`, type: 'removed', value: left[i] })
      else compareObjects(left[i], right[i], `${path}[${i}]`, result)
    }
    return
  }
  if (typeof left === 'object' && typeof right === 'object') {
    const allKeys = new Set([...Object.keys(left), ...Object.keys(right)])
    for (const key of allKeys) {
      const childPath = path ? `${path}.${key}` : key
      if (!(key in left)) result.push({ path: childPath, type: 'added', value: right[key] })
      else if (!(key in right)) result.push({ path: childPath, type: 'removed', value: left[key] })
      else compareObjects(left[key], right[key], childPath, result)
    }
    return
  }
  if (left !== right) result.push({ path, type: 'changed', oldValue: left, newValue: right })
}

const compare = () => {
  error.value = ''; diffs.value = []; compared.value = false
  let parsedLeft: any, parsedRight: any
  try { parsedLeft = JSON.parse(leftJson.value) } catch (e) { error.value = `JSON A: ${(e as Error).message}`; return }
  try { parsedRight = JSON.parse(rightJson.value) } catch (e) { error.value = `JSON B: ${(e as Error).message}`; return }
  const result: Diff[] = []
  compareObjects(parsedLeft, parsedRight, '', result)
  diffs.value = result; compared.value = true
}

const swapInputs = () => { const temp = leftJson.value; leftJson.value = rightJson.value; rightJson.value = temp }
const onClearLeft = () => { error.value = '' }
const onClearRight = () => { error.value = '' }
const clearAll = () => { leftJson.value = ''; rightJson.value = ''; error.value = ''; diffs.value = []; compared.value = false }

const copyResults = async () => {
  const text = diffs.value.map(d => {
    const label = d.type === 'added' ? '+ ADDED' : d.type === 'removed' ? '- REMOVED' : '~ CHANGED'
    const value = d.type === 'changed' ? `${formatValue(d.oldValue)} → ${formatValue(d.newValue)}` : formatValue(d.value)
    return `${label} ${d.path}: ${value}`
  }).join('\n')
  await copyToClipboard(text)
  copied.value = true
  setTimeout(() => { copied.value = false }, 2000)
}

const downloadReport = () => {
  const report = { timestamp: new Date().toISOString(), summary: { total: totalDiffs.value, added: addedCount.value, removed: removedCount.value, changed: changedCount.value }, differences: diffs.value.map(d => ({ path: d.path, type: d.type, ...(d.type === 'changed' ? { oldValue: d.oldValue, newValue: d.newValue } : { value: d.value }) })) }
  const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url; link.download = 'json-diff-report.json'
  document.body.appendChild(link); link.click(); document.body.removeChild(link); URL.revokeObjectURL(url)
}
</script>
