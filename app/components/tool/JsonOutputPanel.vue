<template>
  <div class="flex-1 min-h-0 flex flex-col relative">
    <!-- Header -->
    <div class="flex items-center mb-2 gap-2 overflow-x-auto scrollbar-hide">
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

        <!-- Mask sensitive fields toggle -->
        <button
          v-if="sensitivePaths.size > 0"
          @click="emit('update:masked', !masked)"
          class="flex items-center gap-1 text-xs transition-colors"
          :class="masked
            ? 'text-amber-600 dark:text-amber-400'
            : 'text-surface-400 hover:text-surface-600 dark:text-surface-500 dark:hover:text-surface-300'"
          :title="masked ? $t('privacy_notice.unmask_toggle') : $t('privacy_notice.mask_toggle')"
        >
          <Icon :name="masked ? 'lucide:eye-off' : 'lucide:eye'" class="w-3.5 h-3.5" />
          <span class="hidden sm:inline">{{ masked ? $t('privacy_notice.unmask_toggle') : $t('privacy_notice.mask_toggle') }}</span>
        </button>
      </div>
      <div class="flex gap-2 items-center shrink-0 sm:ml-auto">

        <!-- Search bar (rich mode only; hidden in compact contexts via `enableTreeSearch`) -->
        <template v-if="currentMode === 'rich' && parsedData !== null && enableTreeSearch">
          <button
            @click="toggleExpandAll"
            class="text-xs text-surface-500 hover:text-surface-700 dark:text-surface-400 dark:hover:text-surface-200 whitespace-nowrap"
          >
            {{ allExpanded ? $t('tree.collapseAll') : $t('tree.expandAll') }}
          </button>

          <div class="relative" ref="modeDropdownRef">
            <button
              @click="toggleModeDropdown"
              class="flex items-center gap-1 rounded-lg border border-surface-200 bg-white px-2.5 py-1.5 text-xs font-medium text-surface-600 hover:bg-surface-50 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-300 dark:hover:bg-surface-700"
            >
              {{ modeLabel }}
              <Icon name="lucide:chevron-down" class="w-3 h-3" />
            </button>
            <!-- Rendered into `body`: the header is a horizontal scroll container
                 (overflow-x-auto ⇒ overflow-y computes to auto), so an absolutely
                 positioned dropdown inside it gets clipped instead of dropping down. -->
            <Teleport to="body">
              <Transition name="fade">
                <div
                  v-if="showModeDropdown && dropdownPos"
                  :style="dropdownStyle"
                  class="fixed z-[100] rounded-lg border border-surface-200 bg-white shadow-lg dark:border-surface-700 dark:bg-surface-800 overflow-hidden"
                >
                  <button
                    v-for="m in modes"
                    :key="m.value"
                    @click="selectSearchMode(m.value)"
                    class="block w-full text-left px-3 py-1.5 text-xs hover:bg-surface-100 dark:hover:bg-surface-700"
                    :class="treeSearch.mode.value === m.value ? 'text-primary-600 dark:text-primary-400 font-medium' : 'text-surface-600 dark:text-surface-300'"
                  >
                    {{ m.label }}
                  </button>
                </div>
              </Transition>
            </Teleport>
          </div>

          <div ref="searchBoxRef" class="relative">
            <Icon name="lucide:search" class="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-surface-400" />
            <input
              :value="treeSearch.query.value"
              @input="onSearchInput"
              @keydown.enter.prevent="onEnter"
              @keydown.escape="treeSearch.clear()"
              @focus="showHistory = true"
              type="text"
              :placeholder="searchPlaceholder"
              class="w-48 rounded-lg border border-surface-200 bg-white pl-8 pr-14 py-1.5 text-xs dark:border-surface-700 dark:bg-surface-800 dark:text-surface-100 focus:outline-none focus:ring-1 focus:ring-primary-400"
            />
            <span
              v-if="treeSearch.isSearching.value"
              class="absolute right-2 top-1/2 -translate-y-1/2"
            >
              <span class="block w-3.5 h-3.5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
            </span>
            <span
              v-else-if="treeSearch.query.value"
              class="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-mono"
              :class="treeSearch.totalCount.value > 0 ? 'text-surface-400' : 'text-red-400'"
            >
              {{ treeSearch.totalCount.value > 0 ? `${treeSearch.currentIndex.value + 1}/${treeSearch.totalCount.value}` : '0/0' }}
            </span>
            <!-- Floating panels for this box (invalid-path hint + recent searches)
                 are teleported to `body` — the header is a horizontal scroll
                 container and clips anything below it. -->
          </div>

          <Teleport to="body">
            <div
              v-if="searchPanelVisible && searchPanelPos"
              :style="searchPanelStyle"
              class="fixed z-[100] flex flex-col items-stretch gap-1 pointer-events-none"
            >
              <!-- Unsupported / invalid JSONPath expression -->
              <div
                v-if="treeSearch.invalidExpression.value"
                class="pointer-events-auto self-end whitespace-nowrap rounded bg-red-600 px-1.5 py-0.5 text-[10px] text-white shadow"
              >
                {{ t('largeViewer.pathInvalid') }}
              </div>

              <!-- Recent searches -->
              <div
                v-if="showHistory && treeSearch.history.value.length > 0"
                class="pointer-events-auto overflow-hidden rounded-lg border border-surface-200 bg-white shadow-lg dark:border-surface-700 dark:bg-surface-800"
              >
                <div class="flex items-center justify-between border-b border-surface-100 px-3 py-1 text-[10px] uppercase tracking-wider text-surface-400 dark:border-surface-700 dark:text-surface-500">
                  <span>{{ t('search.history') }}</span>
                  <button class="hover:text-surface-600 dark:hover:text-surface-300" @click="treeSearch.clearHistory()">
                    {{ t('edit.clear') }}
                  </button>
                </div>
                <button
                  v-for="item in treeSearch.history.value"
                  :key="item"
                  @click="applyHistory(item)"
                  class="block w-full truncate px-3 py-1.5 text-left text-xs hover:bg-surface-100 dark:hover:bg-surface-700"
                >
                  {{ item }}
                </button>
              </div>
            </div>
          </Teleport>

          <template v-if="treeSearch.query.value">
            <button
              @click="showResultsDrawer = !showResultsDrawer"
              :title="t('largeViewer.results')"
              class="w-7 h-7 flex items-center justify-center rounded-lg border border-surface-200 bg-white text-surface-500 hover:bg-surface-50 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-400 dark:hover:bg-surface-700"
              :class="showResultsDrawer ? 'text-primary-600 dark:text-primary-400' : ''"
            >
              <Icon name="lucide:list" class="w-3.5 h-3.5" />
            </button>
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
          @click="handleDownload"
          class="text-xs text-surface-500 hover:text-surface-700 dark:text-surface-400"
        >
          {{ $t('system.download') }}
        </button>
      </div>
    </div>

    <!-- Search results drawer -->
    <div
      v-if="showResultsDrawer && resultList.length"
      class="absolute left-2 right-2 top-11 z-50 max-h-80 overflow-auto rounded-lg border border-surface-200 bg-white shadow-lg dark:border-surface-700 dark:bg-surface-800"
    >
      <div class="sticky top-0 flex items-center justify-between border-b border-surface-200 bg-surface-50 px-3 py-1.5 text-xs font-medium text-surface-600 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-300">
        <span>{{ t('largeViewer.results') }} ({{ resultList.length }})</span>
        <div class="flex items-center gap-1">
          <button
            class="rounded px-1 py-0.5 text-surface-400 hover:text-surface-600 hover:bg-surface-100 dark:hover:text-surface-300 dark:hover:bg-surface-700"
            :title="t('largeViewer.exportTxt')"
            @click="exportResults('txt')"
          >
            <Icon name="lucide:file-text" class="w-3.5 h-3.5" />
          </button>
          <button
            class="rounded px-1 py-0.5 text-surface-400 hover:text-surface-600 hover:bg-surface-100 dark:hover:text-surface-300 dark:hover:bg-surface-700"
            :title="t('largeViewer.exportJson')"
            @click="exportResults('json')"
          >
            <Icon name="lucide:file-json" class="w-3.5 h-3.5" />
          </button>
          <button
            class="rounded px-1 py-0.5 text-surface-400 hover:text-surface-600 hover:bg-surface-100 dark:hover:text-surface-300 dark:hover:bg-surface-700"
            :title="t('largeViewer.exportCsv')"
            @click="exportResults('csv')"
          >
            <Icon name="lucide:table" class="w-3.5 h-3.5" />
          </button>
          <button class="text-surface-400 hover:text-surface-600 dark:hover:text-surface-300" @click="showResultsDrawer = false">
            <Icon name="lucide:x" class="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      <button
        v-for="(item, i) in resultList"
        :key="item.path"
        @click="jumpTo(item.path, i)"
        class="block w-full border-b border-surface-100 px-3 py-1.5 text-left last:border-0 hover:bg-surface-50 dark:border-surface-800 dark:hover:bg-surface-700"
      >
        <div class="flex flex-wrap items-center gap-1.5 text-xs">
          <span class="font-mono text-primary-600 dark:text-primary-400">{{ item.snippet }}</span>
          <span class="rounded bg-surface-100 px-1 text-[10px] text-surface-500 dark:bg-surface-700">{{ item.kindLabel }}</span>
          <span class="rounded bg-surface-100 px-1 text-[10px] text-surface-500 dark:bg-surface-700">{{ item.type }}</span>
          <span v-if="item.parentArray" class="rounded bg-surface-100 px-1 text-[10px] text-surface-500 dark:bg-surface-700">@{{ item.parentArray }}</span>
        </div>
        <div class="mt-0.5 truncate font-mono text-[10px] text-surface-400 dark:text-surface-500">{{ item.path }}</div>
      </button>
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
          <pre v-if="highlight" class="flex-1 p-4 m-0 whitespace-pre leading-[1.5] text-surface-900 dark:text-surface-100" v-html="highlightedContent" />
          <pre v-else class="flex-1 p-4 m-0 whitespace-pre leading-[1.5] text-surface-900 dark:text-surface-100">{{ content }}</pre>
        </div>
        <div v-else class="p-4">{{ emptyText }}</div>
      </div>
    </div>

    <!-- Rich view -->
    <div
      v-show="currentMode === 'rich'"
      ref="richRef"
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
import type { SearchMode } from '~/composables/useTreeSearch'
import { jsonTypeLabel } from '~/utils/jsonPath'
import { generateCsv } from '~/composables/useExcelCompat'

// Single scroll viewport for the rich tree. Virtualized subtree lists window
// against this element instead of creating a scroll box of their own, which is
// what used to produce a second scrollbar inside the tree.
const richRef = ref<HTMLElement | null>(null)
provide('treeViewport', richRef)

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
  /** Syntax highlighting in text mode: '' = none, 'json' = JSON highlighting */
  highlight?: '' | 'json'
  /** Enable masked display for sensitive fields */
  masked?: boolean
  /** Set of sensitive field paths to mask */
  sensitivePaths?: Set<string>
  /** Show the in-tree search controls in rich mode (expand all, mode picker, query, prev/next) */
  enableTreeSearch?: boolean
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
  highlight: '',
  masked: false,
  sensitivePaths: () => new Set(),
  enableTreeSearch: true,
})

const emit = defineEmits<{
  'update:viewMode': [mode: 'text' | 'rich' | 'table']
  'update:content': [value: string]
  'update:masked': [value: boolean]
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
const searchBoxRef = ref<HTMLElement>()
const showHistory = ref(false)
const textareaRef = ref<HTMLTextAreaElement>()

const currentMode = computed(() => props.viewMode)
const hasContent = computed(() => !!props.content)

// Table mode helpers
// Non-root array tables: a tree node can request any nested array to be shown
// as a table. `tableOverride` wins over the root-array fallback.
const tableOverride = ref<{ data: unknown[]; parentPath: string } | null>(null)

function showArrayAsTable(path: string) {
  const arr = valueAtPath(parsedDataRef.value, path)
  if (Array.isArray(arr)) {
    tableOverride.value = { data: arr, parentPath: path }
    emit('update:viewMode', 'table')
  }
}
provide('showArrayAsTable', showArrayAsTable)

// Clear a stale override once the underlying document changes.
watch(() => props.parsedData, () => { tableOverride.value = null })

const isArrayData = computed(() => Array.isArray(tableOverride.value?.data ?? props.parsedData))
const tableData = computed(() => {
  if (tableOverride.value) return tableOverride.value.data
  if (!isArrayData.value) return null
  return props.parsedData as unknown[]
})
const tableParentPath = computed(() => tableOverride.value?.parentPath ?? '')
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

// ── Search results drawer (P0-4): list + jump to node ──
const showResultsDrawer = ref(false)

function valueAtPath(data: unknown, path: string): unknown {
  if (data === null || data === undefined || !path) return data
  const segs = path.replace(/\[(\d+)\]/g, '.$1').split('.').filter(Boolean)
  let cur: any = data
  for (const s of segs) {
    if (cur == null) return undefined
    cur = cur[s]
  }
  return cur
}

function arrayNameOf(path: string): string {
  const m = /(.*)\[(\d+)\]/.exec(path)
  if (!m) return ''
  const parts = m[1].split('.')
  return parts[parts.length - 1] || m[1]
}

function kindLabel(k: SearchMode): string {
  if (k === 'key') return t('largeViewer.scopeKey')
  if (k === 'value') return t('largeViewer.scopeValue')
  if (k === 'path') return t('largeViewer.scopePath')
  if (k === 'jsonpath') return t('largeViewer.jsonPath')
  return t('largeViewer.scopeAll')
}

const resultList = computed(() => {
  const list: { path: string; snippet: string; kindLabel: string; type: string; parentArray: string }[] = []
  for (const [path, d] of treeSearch.matchDetails.value) {
    list.push({
      path,
      snippet: d.snippet,
      kindLabel: kindLabel(d.kind),
      type: jsonTypeLabel(valueAtPath(parsedDataRef.value, path)),
      parentArray: arrayNameOf(path),
    })
  }
  return list
})

/** Download the current result list as .txt / .json / .csv. */
function exportResults(kind: 'txt' | 'json' | 'csv') {
  const rows = resultList.value
  if (rows.length === 0) return

  if (kind === 'txt') {
    const content = rows.map((r) => `${r.path}=${r.snippet}`).join('\n')
    downloadFile(content, 'search-results.txt', 'text/plain')
    return
  }

  if (kind === 'json') {
    const content = JSON.stringify(
      rows.map((r) => ({ path: r.path, type: r.type, matchedBy: r.kindLabel, parentArray: r.parentArray, value: r.snippet })),
      null,
      2,
    )
    downloadFile(content, 'search-results.json', 'application/json')
    return
  }

  const content = generateCsv(
    ['path', 'type', 'matchedBy', 'value', 'parentArray'],
    rows.map((r) => [r.path, r.type, r.kindLabel, r.snippet, r.parentArray]),
  )
  downloadFile(content, 'search-results.csv', 'text/csv')
}

function jumpTo(path: string, index: number) {
  treeSearch.currentIndex.value = index
  locatePath.value = path
  showResultsDrawer.value = false
}

const modes = computed(() => [
  { value: 'all' as const, label: t('largeViewer.scopeAll') },
  { value: 'key' as const, label: t('tree.searchByKey') },
  { value: 'value' as const, label: t('tree.searchByValue') },
  { value: 'path' as const, label: t('tree.searchByPath') },
  { value: 'jsonpath' as const, label: t('tree.searchByJsonPath') },
])

const modeLabel = computed(() => modes.value.find(m => m.value === treeSearch.mode.value)?.label ?? 'Key')

// The dropdown lives in <Teleport to="body">, so it needs a viewport position
// measured from its trigger.
function measureAnchor(el: HTMLElement | undefined | null) {
  if (!el) return null
  const r = el.getBoundingClientRect()
  return { top: r.bottom + 4, left: r.left, width: r.width }
}

function anchorStyle(pos: { top: number; left: number; width: number } | null) {
  if (!pos) return {}
  return { top: `${pos.top}px`, left: `${pos.left}px`, minWidth: `${pos.width}px` }
}

const dropdownPos = ref<{ top: number; left: number; width: number } | null>(null)
const dropdownStyle = computed(() => anchorStyle(dropdownPos.value))

function measureDropdown() {
  const p = measureAnchor(modeDropdownRef.value)
  if (p) dropdownPos.value = p
}

function toggleModeDropdown() {
  if (showModeDropdown.value) {
    showModeDropdown.value = false
    return
  }
  measureDropdown()
  showModeDropdown.value = true
}

function selectSearchMode(value: SearchMode) {
  treeSearch.mode.value = value
  showModeDropdown.value = false
}

// Recent searches + invalid-path hint share the search box as their anchor.
const searchPanelPos = ref<{ top: number; left: number; width: number } | null>(null)
const searchPanelStyle = computed(() => anchorStyle(searchPanelPos.value))
const searchPanelVisible = computed(
  () => treeSearch.invalidExpression.value || (showHistory.value && treeSearch.history.value.length > 0),
)

function measureSearchPanel() {
  const p = measureAnchor(searchBoxRef.value)
  if (p) searchPanelPos.value = p
}

// Keep both floating panels glued to their triggers while they are open.
function onViewportChange() {
  if (showModeDropdown.value) measureDropdown()
  if (searchPanelVisible.value) measureSearchPanel()
}

watch([showModeDropdown, searchPanelVisible], ([modeOpen, panelOpen]) => {
  if (modeOpen) {
    measureDropdown()
    window.addEventListener('scroll', measureDropdown, true)
  } else {
    window.removeEventListener('scroll', measureDropdown, true)
  }

  if (panelOpen) {
    measureSearchPanel()
    window.addEventListener('scroll', measureSearchPanel, true)
  } else {
    window.removeEventListener('scroll', measureSearchPanel, true)
  }

  if (modeOpen || panelOpen) window.addEventListener('resize', onViewportChange)
  else window.removeEventListener('resize', onViewportChange)
})

onUnmounted(() => {
  window.removeEventListener('scroll', measureDropdown, true)
  window.removeEventListener('scroll', measureSearchPanel, true)
  window.removeEventListener('resize', onViewportChange)
})

const searchPlaceholder = computed(() => {
  switch (treeSearch.mode.value) {
    case 'key': return t('tree.placeholderKey')
    case 'value': return t('tree.placeholderValue')
    case 'path': return t('tree.placeholderPath')
    case 'jsonpath': return t('largeViewer.pathPlaceholder')
    default: return t('tree.placeholderKey')
  }
})

function onSearchInput(e: Event) {
  treeSearch.query.value = (e.target as HTMLInputElement).value
}

function onEnter(e: KeyboardEvent) {
  // Only a committed query (Enter) enters history — not every keystroke.
  treeSearch.rememberQuery(treeSearch.query.value)
  showHistory.value = false
  if (e.shiftKey) treeSearch.prev()
  else treeSearch.next()
}

function applyHistory(value: string) {
  treeSearch.query.value = value
  showHistory.value = false
}

// Close mode dropdown on outside click
onMounted(() => {
  const handler = (e: MouseEvent) => {
    if (modeDropdownRef.value && !modeDropdownRef.value.contains(e.target as Node)) {
      showModeDropdown.value = false
    }
    if (searchBoxRef.value && !searchBoxRef.value.contains(e.target as Node)) {
      showHistory.value = false
    }
  }
  document.addEventListener('click', handler)
  onUnmounted(() => document.removeEventListener('click', handler))
})

// Provide search state to tree nodes
provide('treeSearch', treeSearch)

// Provide masked state for sensitive fields
provide('maskedFields', computed(() => props.masked ? props.sensitivePaths : new Set()))

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

function getAllExpandablePaths(data: unknown, parentPath = '', depth = 0): string[] {
  const paths: string[] = []
  if (isObject(data)) {
    for (const key of Object.keys(data)) {
      const childPath = parentPath ? `${parentPath}.${key}` : key
      if (isExpandable(data[key])) { paths.push(childPath); paths.push(...getAllExpandablePaths(data[key], childPath, depth + 1)) }
    }
  } else if (isArray(data)) {
    data.forEach((item, i) => {
      const childPath = `${parentPath}[${i}]`
      if (isExpandable(item)) { paths.push(childPath); paths.push(...getAllExpandablePaths(item, childPath, depth + 1)) }
    })
  }
  return paths
}

const richExpanded = ref<Set<string>>(new Set())
provide('richExpanded', richExpanded)

// Expand nodes in rich view whenever the data changes
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
  // Self-contained: write to clipboard if content exists
  if (props.content) {
    try { await navigator.clipboard.writeText(props.content) } catch {}
  }
  copied.value = true
  setTimeout(() => { copied.value = false }, 2000)
}

const handleDownload = () => {
  emit('download')
  // Self-contained: create blob download if content exists
  if (props.content) {
    const blob = new Blob([props.content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = props.downloadFilename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }
}

// JSON syntax highlighting for text mode
const highlightedContent = computed(() => {
  if (!props.highlight || !props.content) return props.content
  if (props.highlight === 'json') return highlightJson(props.content)
  return props.content
})

function highlightJson(str: string): string {
  // Single-pass character scanner — avoids nested regex replacement bugs
  let out = ''
  let i = 0
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

  while (i < str.length) {
    const ch = str[i]

    if (ch === '"') {
      // Find end of string
      let j = i + 1
      while (j < str.length) {
        if (str[j] === '\\') { j += 2; continue }
        if (str[j] === '"') break
        j++
      }
      const raw = str.slice(i, j + 1)
      // Look ahead: skip whitespace after closing quote
      let k = j + 1
      while (k < str.length && (str[k] === ' ' || str[k] === '\t')) k++
      if (str[k] === ':') {
        // It's a key
        out += `<span class="text-purple-600 dark:text-purple-400">${esc(raw)}</span>`
      } else {
        // It's a value
        out += `<span class="text-green-600 dark:text-green-400">${esc(raw)}</span>`
      }
      i = j + 1
      continue
    }

    // Numbers
    if (ch === '-' || (ch >= '0' && ch <= '9')) {
      let j = i + 1
      while (j < str.length && /[\d.eE+-]/.test(str[j])) j++
      out += `<span class="text-amber-600 dark:text-amber-400">${esc(str.slice(i, j))}</span>`
      i = j
      continue
    }

    // Booleans and null
    if (str.startsWith('true', i)) {
      out += '<span class="text-blue-600 dark:text-blue-400">true</span>'
      i += 4; continue
    }
    if (str.startsWith('false', i)) {
      out += '<span class="text-blue-600 dark:text-blue-400">false</span>'
      i += 5; continue
    }
    if (str.startsWith('null', i)) {
      out += '<span class="text-blue-600 dark:text-blue-400">null</span>'
      i += 4; continue
    }

    // Punctuation, whitespace, etc.
    out += esc(ch)
    i++
  }

  return out
}
</script>
