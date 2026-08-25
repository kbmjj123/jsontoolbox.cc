<template>
  <div class="flex-1 min-h-0 flex flex-col">
    <!-- Header -->
    <div class="flex items-center justify-between mb-2 gap-3">
      <div class="flex items-center gap-2 shrink-0">
        <label class="text-sm font-bold text-surface-700 dark:text-surface-300">{{ label }}</label>
        <!-- View mode toggle -->
        <div
          v-if="parsedData !== null && showViewToggle"
          class="flex rounded-lg border border-surface-200 dark:border-surface-700 overflow-hidden"
        >
          <button
            @click="emit('update:viewMode', 'rich')"
            :class="viewMode === 'rich' ? 'bg-primary-600 text-white' : 'bg-white text-surface-600 dark:bg-surface-800 dark:text-surface-400'"
            class="px-2 py-0.5 text-xs transition-colors"
          >
            Rich
          </button>
          <button
            @click="emit('update:viewMode', 'text')"
            :class="viewMode === 'text' ? 'bg-primary-600 text-white' : 'bg-white text-surface-600 dark:bg-surface-800 dark:text-surface-400'"
            class="px-2 py-0.5 text-xs transition-colors"
          >
            Text
          </button>
          <button
            v-if="isArrayData"
            @click="emit('update:viewMode', 'table')"
            :class="viewMode === 'table' ? 'bg-primary-600 text-white' : 'bg-white text-surface-600 dark:bg-surface-800 dark:text-surface-400'"
            class="px-2 py-0.5 text-xs transition-colors"
          >
            Table
          </button>
        </div>
      </div>
      <div class="flex gap-2 items-center flex-1 justify-end">

        <!-- Search bar (rich mode only) -->
        <template v-if="currentMode === 'rich' && parsedData !== null">
          <button
            @click="toggleExpandAll"
            class="text-xs text-surface-500 hover:text-surface-700 dark:text-surface-400 dark:hover:text-surface-200 whitespace-nowrap"
          >
            {{ allExpanded ? $t('tree.collapseAll') : $t('tree.expandAll') }}
          </button>

          <div class="relative" ref="modeDropdownRef">
            <button
              @click="showModeDropdown = !showModeDropdown"
              class="flex items-center gap-1 rounded-lg border border-surface-200 bg-white px-2.5 py-1.5 text-xs font-medium text-surface-600 hover:bg-surface-50 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-300 dark:hover:bg-surface-700"
            >
              {{ modeLabel }}
              <Icon name="lucide:chevron-down" class="w-3 h-3" />
            </button>
            <Transition name="fade">
              <div v-if="showModeDropdown" class="absolute top-full mt-1 left-0 z-50 rounded-lg border border-surface-200 bg-white shadow-lg dark:border-surface-700 dark:bg-surface-800 overflow-hidden">
                <button
                  v-for="m in modes"
                  :key="m.value"
                  @click="treeSearch.mode.value = m.value; showModeDropdown = false"
                  class="block w-full text-left px-3 py-1.5 text-xs hover:bg-surface-100 dark:hover:bg-surface-700"
                  :class="treeSearch.mode.value === m.value ? 'text-primary-600 dark:text-primary-400 font-medium' : 'text-surface-600 dark:text-surface-300'"
                >
                  {{ m.label }}
                </button>
              </div>
            </Transition>
          </div>

          <div class="relative">
            <Icon name="lucide:search" class="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-surface-400" />
            <input
              :value="treeSearch.query.value"
              @input="onSearchInput"
              @keydown.enter.prevent="onEnter"
              @keydown.escape="treeSearch.clear()"
              type="text"
              :placeholder="searchPlaceholder"
              class="w-48 rounded-lg border border-surface-200 bg-white pl-8 pr-14 py-1.5 text-xs dark:border-surface-700 dark:bg-surface-800 dark:text-surface-100 focus:outline-none focus:ring-1 focus:ring-primary-400"
            />
            <span
              v-if="treeSearch.query.value"
              class="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-mono"
              :class="treeSearch.totalCount.value > 0 ? 'text-surface-400' : 'text-red-400'"
            >
              {{ treeSearch.totalCount.value > 0 ? `${treeSearch.currentIndex.value + 1}/${treeSearch.totalCount.value}` : '0/0' }}
            </span>
          </div>

          <template v-if="treeSearch.query.value">
            <button
              @click="treeSearch.prev()"
              :disabled="treeSearch.totalCount.value === 0"
              class="w-7 h-7 flex items-center justify-center rounded-lg border border-surface-200 bg-white text-surface-500 hover:bg-surface-50 disabled:opacity-30 disabled:cursor-not-allowed dark:border-surface-700 dark:bg-surface-800 dark:text-surface-400 dark:hover:bg-surface-700"
            >
              <Icon name="lucide:chevron-up" class="w-3.5 h-3.5" />
            </button>
            <button
              @click="treeSearch.next()"
              :disabled="treeSearch.totalCount.value === 0"
              class="w-7 h-7 flex items-center justify-center rounded-lg border border-surface-200 bg-white text-surface-500 hover:bg-surface-50 disabled:opacity-30 disabled:cursor-not-allowed dark:border-surface-700 dark:bg-surface-800 dark:text-surface-400 dark:hover:bg-surface-700"
            >
              <Icon name="lucide:chevron-down" class="w-3.5 h-3.5" />
            </button>
          </template>
        </template>

        <!-- Edit action buttons (when editable) -->
        <template v-if="showEditActions">
          <button @click="emit('format')" class="btn-primary px-3 py-1 text-xs">
            {{ $t('system.format') }}
          </button>
          <button @click="emit('minify')" class="rounded-lg border border-surface-200 bg-white px-3 py-1 text-xs font-bold text-surface-700 hover:bg-surface-50 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-300 dark:hover:bg-surface-700">
            {{ $t('system.minify') }}
          </button>
          <button @click="emit('validate')" class="rounded-lg border border-surface-200 bg-white px-3 py-1 text-xs font-bold text-surface-700 hover:bg-surface-50 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-300 dark:hover:bg-surface-700">
            {{ $t('system.validate') }}
          </button>
          <button @click="emit('fix')" class="rounded-lg border border-surface-200 bg-white px-3 py-1 text-xs font-bold text-surface-700 hover:bg-surface-50 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-300 dark:hover:bg-surface-700">
            {{ $t('system.fix') }}
          </button>
        </template>

        <slot name="actions" />

        <button
          v-if="showCopy"
          @click="handleCopy"
          class="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400"
        >
          {{ copied ? '✓ Copied!' : $t('system.copy') }}
        </button>
        <button
          v-if="showDownload"
          @click="emit('download')"
          class="text-xs text-surface-500 hover:text-surface-700 dark:text-surface-400"
        >
          {{ $t('system.download') }}
        </button>
      </div>
    </div>

    <!-- Text view -->
    <div v-show="currentMode === 'text'" class="relative flex-1 min-h-0">
      <!-- Editable mode: textarea with line numbers -->
      <div
        v-if="editable"
        class="w-full h-full rounded-xl border border-surface-200 bg-surface-50 font-mono text-sm overflow-hidden dark:border-surface-700 dark:bg-surface-800 flex"
        :class="error ? 'border-red-300 dark:border-red-700' : ''"
      >
        <div ref="lineNumbersRef" class="w-10 shrink-0 select-none text-right py-4 pl-2 pr-3 text-surface-400 dark:text-surface-500 border-r border-surface-200 dark:border-surface-700 leading-[1.5] overflow-hidden">
          <div v-for="n in lineCount" :key="n">{{ n }}</div>
        </div>
        <textarea
          ref="textareaRef"
          :value="content"
          @input="onTextareaInput"
          @paste="emit('paste')"
          @scroll="syncLineNumbers"
          :placeholder="placeholder"
          class="flex-1 p-4 m-0 bg-transparent font-mono text-sm text-surface-900 dark:text-surface-100 resize-none outline-none leading-[1.5] whitespace-pre overflow-auto w-full h-full"
          spellcheck="false"
        />
      </div>
      <!-- Read-only mode: pre with line numbers -->
      <div
        v-else
        class="w-full h-full rounded-xl border border-surface-200 bg-surface-50 font-mono text-sm overflow-auto dark:border-surface-700 dark:bg-surface-800"
      >
        <!-- Error state: always shown when error, regardless of content -->
        <div v-if="error" class="flex flex-col items-center justify-center h-full gap-3 p-6 text-center">
          <span class="i-lucide-alert-circle w-8 h-8 text-red-400 dark:text-red-500" />
          <div>
            <p class="text-sm font-medium text-red-700 dark:text-red-400">{{ t('errorEmpty.title') }}</p>
            <p class="text-xs text-surface-500 dark:text-surface-400 mt-1">
              {{ friendlyMessage || error }}
            </p>
          </div>
          <div class="flex gap-2 mt-1">
            <button
              @click="emit('locateError')"
              class="rounded-lg bg-red-50 border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/30 transition-colors"
            >
              {{ t('errorEmpty.locateError') }}
            </button>
            <button
              @click="emit('loadExample')"
              class="rounded-lg border border-surface-200 bg-white px-3 py-1.5 text-xs font-medium text-surface-600 hover:bg-surface-50 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-300 dark:hover:bg-surface-700 transition-colors"
            >
              {{ t('errorEmpty.loadExample') }}
            </button>
          </div>
        </div>
        <!-- Content -->
        <div v-else-if="hasContent" class="flex min-w-max">
          <div class="w-10 shrink-0 select-none text-right pr-3 pl-2 py-4 text-surface-400 dark:text-surface-500 border-r border-surface-200 dark:border-surface-700 leading-[1.5]">
            <div v-for="n in lineCount" :key="n">{{ n }}</div>
          </div>
          <pre class="flex-1 p-4 m-0 whitespace-pre leading-[1.5] text-surface-900 dark:text-surface-100">{{ content }}</pre>
        </div>
        <div v-else class="p-4">{{ emptyText }}</div>
      </div>
    </div>

    <!-- Rich view -->
    <div
      v-show="currentMode === 'rich'"
      class="flex-1 min-h-0 overflow-auto rounded-xl border border-surface-200 bg-surface-50 p-4 dark:border-surface-700 dark:bg-surface-800"
    >
      <JsonTreeNode
        v-if="parsedData !== null"
        :data="parsedData"
        :path="''"
      />
      <div v-else-if="error" class="flex flex-col items-center justify-center h-full gap-3 p-6 text-center">
        <span class="i-lucide-alert-circle w-8 h-8 text-red-400 dark:text-red-500" />
        <div>
          <p class="text-sm font-medium text-red-700 dark:text-red-400">{{ t('errorEmpty.title') }}</p>
          <p class="text-xs text-surface-500 dark:text-surface-400 mt-1">
            {{ friendlyMessage || error }}
          </p>
        </div>
        <div class="flex gap-2 mt-1">
          <button
            @click="emit('locateError')"
            class="rounded-lg bg-red-50 border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/30 transition-colors"
          >
            {{ t('errorEmpty.locateError') }}
          </button>
          <button
            @click="emit('loadExample')"
            class="rounded-lg border border-surface-200 bg-white px-3 py-1.5 text-xs font-medium text-surface-600 hover:bg-surface-50 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-300 dark:hover:bg-surface-700 transition-colors"
          >
            {{ t('errorEmpty.loadExample') }}
          </button>
        </div>
      </div>
      <div v-else class="flex items-center justify-center h-full text-surface-400 text-sm">
        {{ emptyText }}
      </div>
    </div>

    <!-- Table view -->
    <div
      v-show="currentMode === 'table'"
      class="flex-1 min-h-0 overflow-auto"
    >
      <JsonTableView
        v-if="isArrayData && tableData"
        :data="tableData"
        :parent-path="tableParentPath"
      />
      <div v-else class="flex items-center justify-center h-full text-surface-400 text-sm">
        {{ emptyText }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { FieldError } from '~/types/jsonErrors'

const { t } = useI18n()

interface Props {
  label?: string
  content?: string
  error?: string
  /** Friendly localized error message (shown instead of raw error when available) */
  friendlyMessage?: string
  viewMode?: 'text' | 'rich' | 'table'
  parsedData?: unknown | null
  fieldErrors?: FieldError[]
  showCopy?: boolean
  showDownload?: boolean
  downloadFilename?: string
  emptyText?: string
  locateTarget?: string
  /** Enable editable textarea in text mode */
  editable?: boolean
  /** Placeholder text when editable and empty */
  placeholder?: string
  /** Show format/minify/validate/fix action buttons in header */
  showEditActions?: boolean
  /** Show text/rich view mode toggle */
  showViewToggle?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  label: 'Output',
  content: '',
  error: '',
  friendlyMessage: '',
  viewMode: 'text',
  parsedData: null,
  fieldErrors: () => [],
  showCopy: true,
  showDownload: true,
  downloadFilename: 'output.json',
  emptyText: 'Result will appear here',
  locateTarget: '',
  editable: false,
  placeholder: '',
  showEditActions: false,
  showViewToggle: true,
})

const emit = defineEmits<{
  'update:viewMode': [mode: 'text' | 'rich' | 'table']
  'update:content': [value: string]
  copy: []
  download: []
  copyPath: [path: string]
  format: []
  minify: []
  validate: []
  fix: []
  paste: []
  locateError: []
  loadExample: []
}>()

const copied = ref(false)
const showModeDropdown = ref(false)
const modeDropdownRef = ref<HTMLElement>()
const textareaRef = ref<HTMLTextAreaElement>()

const currentMode = computed(() => props.viewMode)
const hasContent = computed(() => !!props.content)

// Table mode helpers
const isArrayData = computed(() => Array.isArray(props.parsedData))
const tableData = computed(() => {
  if (!isArrayData.value) return null
  return props.parsedData as unknown[]
})
const tableParentPath = computed(() => '')
const lineCount = computed(() => {
  const lines = (props.content || '').split('\n')
  return Math.max(lines.length, 1)
})

function onTextareaInput(e: Event) {
  const target = e.target as HTMLTextAreaElement
  emit('update:content', target.value)
}

const lineNumbersRef = ref<HTMLElement>()

function syncLineNumbers() {
  if (textareaRef.value && lineNumbersRef.value) {
    lineNumbersRef.value.scrollTop = textareaRef.value.scrollTop
  }
}

// Search
const parsedDataRef = computed(() => props.parsedData)
const treeSearch = useTreeSearch(parsedDataRef)

const modes = computed(() => [
  { value: 'key' as const, label: t('tree.searchByKey') },
  { value: 'value' as const, label: t('tree.searchByValue') },
  { value: 'path' as const, label: t('tree.searchByPath') },
])

const modeLabel = computed(() => modes.value.find(m => m.value === treeSearch.mode.value)?.label ?? 'Key')

const searchPlaceholder = computed(() => {
  switch (treeSearch.mode.value) {
    case 'key': return t('tree.placeholderKey')
    case 'value': return t('tree.placeholderValue')
    case 'path': return t('tree.placeholderPath')
  }
})

function onSearchInput(e: Event) {
  treeSearch.query.value = (e.target as HTMLInputElement).value
}

function onEnter(e: KeyboardEvent) {
  if (e.shiftKey) treeSearch.prev()
  else treeSearch.next()
}

// Close mode dropdown on outside click
onMounted(() => {
  const handler = (e: MouseEvent) => {
    if (modeDropdownRef.value && !modeDropdownRef.value.contains(e.target as Node)) {
      showModeDropdown.value = false
    }
  }
  document.addEventListener('click', handler)
  onUnmounted(() => document.removeEventListener('click', handler))
})

// Provide search state to tree nodes
provide('treeSearch', treeSearch)

// Field errors → errorMap for tree nodes
const errorMap = computed(() => {
  const map: Record<string, FieldError[]> = {}
  for (const err of props.fieldErrors) {
    const path = err.instancePath
    if (!map[path]) map[path] = []
    map[path].push(err)
  }
  return map
})
provide('jsonErrors', errorMap)

// Default: expand all nodes in rich view
function isObject(v: unknown): v is Record<string, unknown> { return typeof v === 'object' && v !== null && !Array.isArray(v) }
function isArray(v: unknown): v is unknown[] { return Array.isArray(v) }
function isExpandable(v: unknown): boolean { return isObject(v) || isArray(v) }

function getAllExpandablePaths(data: unknown, parentPath = ''): string[] {
  const paths: string[] = []
  if (isObject(data)) {
    for (const key of Object.keys(data)) {
      const childPath = parentPath ? `${parentPath}.${key}` : key
      if (isExpandable(data[key])) { paths.push(childPath); paths.push(...getAllExpandablePaths(data[key], childPath)) }
    }
  } else if (isArray(data)) {
    data.forEach((item, i) => {
      const childPath = `${parentPath}[${i}]`
      if (isExpandable(item)) { paths.push(childPath); paths.push(...getAllExpandablePaths(item, childPath)) }
    })
  }
  return paths
}

const richExpanded = ref<Set<string>>(new Set())
provide('richExpanded', richExpanded)

watch(() => props.parsedData, (data) => {
  if (data !== null && data !== undefined) {
    richExpanded.value = new Set(getAllExpandablePaths(data))
  } else {
    richExpanded.value = new Set()
  }
}, { immediate: true })

// Expand/collapse all signals
const allExpanded = ref(true)
const expandAllSignal = ref(0)
const collapseAllSignal = ref(0)
provide('expandAllSignal', expandAllSignal)
provide('collapseAllSignal', collapseAllSignal)

// Locate path signal — used by error panel click → scroll to tree node
const locatePath = ref<string>('')
provide('locatePath', locatePath)

// Sync locateTarget prop → locatePath provide
watch(() => props.locateTarget, (target) => {
  if (target) {
    locatePath.value = target
    // Switch to rich view so the tree is visible
    emit('update:viewMode', 'rich')
  }
})

function toggleExpandAll() {
  if (allExpanded.value) {
    collapseAllSignal.value++
    allExpanded.value = false
  } else {
    expandAllSignal.value++
    allExpanded.value = true
  }
}

const handleCopy = async () => {
  emit('copy')
  copied.value = true
  setTimeout(() => {
    copied.value = false
  }, 2000)
}
</script>
