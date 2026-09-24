<template>
  <div class="h-full flex flex-col overflow-hidden rounded-xl border border-surface-200 bg-white text-xs dark:border-surface-700 dark:bg-surface-900 dark:text-surface-200 relative">
    <template v-if="columns.length > 0">
      <!-- Toolbar: filter / columns / copy row / export CSV -->
      <ToolPanelBar>
        <div class="relative">
          <Icon name="lucide:search" class="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-surface-400" />
          <input
            v-model="tableQuery"
            type="text"
            :placeholder="t('largeViewer.table.filterPlaceholder')"
            class="w-44 rounded-lg border border-surface-200 bg-white pl-7 pr-2 py-1 text-xs dark:border-surface-700 dark:bg-surface-800 dark:text-surface-100 focus:outline-none focus:ring-1 focus:ring-primary-400"
          />
        </div>

        <div class="relative" ref="colMenuRef">
          <button
            @click="showColMenu = !showColMenu"
            class="flex items-center gap-1 rounded-lg border border-surface-200 bg-white px-2 py-1 text-xs text-surface-600 hover:bg-surface-50 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-300 dark:hover:bg-surface-700"
          >
            <Icon name="lucide:columns-3" class="w-3.5 h-3.5" />
            {{ t('largeViewer.table.columns') }}
          </button>
          <ToolFloatingPanel v-if="showColMenu" :anchor-el="colMenuRef">
            <div class="pointer-events-auto max-h-64 w-48 overflow-auto rounded-lg border border-surface-200 bg-white shadow-lg dark:border-surface-700 dark:bg-surface-800">
              <label
                v-for="col in columns"
                :key="col"
                class="flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-surface-100 dark:hover:bg-surface-700 cursor-pointer"
              >
                <input type="checkbox" :checked="!hiddenCols.has(col)" @change="toggleCol(col)" class="rounded" />
                <span class="truncate">{{ col }}</span>
              </label>
            </div>
          </ToolFloatingPanel>
        </div>

        <button
          v-if="selectedRow >= 0"
          @click="copyRow(selectedRow)"
          :title="t('largeViewer.table.copyRow')"
          class="flex items-center gap-1 rounded-lg border border-surface-200 bg-white px-2 py-1 text-xs text-surface-600 hover:bg-surface-50 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-300 dark:hover:bg-surface-700"
        >
          <Icon name="lucide:copy" class="w-3.5 h-3.5" />
          {{ t('largeViewer.table.copyRow') }}
        </button>
        <button
          v-if="selectedRow >= 0"
          @click="copyRowPath(selectedRow)"
          :title="t('largeViewer.table.copyRowPath')"
          class="flex items-center gap-1 rounded-lg border border-surface-200 bg-white px-2 py-1 text-xs text-surface-600 hover:bg-surface-50 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-300 dark:hover:bg-surface-700"
        >
          <Icon name="lucide:link" class="w-3.5 h-3.5" />
          {{ t('largeViewer.table.copyRowPath') }}
        </button>

        <button
          @click="exportCsv"
          :title="t('largeViewer.table.exportCsv')"
          class="flex items-center gap-1 rounded-lg border border-surface-200 bg-white px-2 py-1 text-xs text-surface-600 hover:bg-surface-50 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-300 dark:hover:bg-surface-700"
        >
          <Icon name="lucide:download" class="w-3.5 h-3.5" />
          {{ t('largeViewer.table.exportCsv') }}
        </button>

        <span class="ml-auto text-[10px] text-surface-400 dark:text-surface-500">
          {{ filteredRows.length }} {{ t('largeViewer.table.matching') }}
        </span>
      </ToolPanelBar>

      <!-- Fixed header -->
      <div
        class="grid shrink-0 border-b border-surface-200 bg-surface-50 dark:bg-surface-800 dark:border-surface-700 font-bold text-surface-700 dark:text-surface-300"
        :style="{ gridTemplateColumns }"
      >
        <div class="w-12 px-2 py-2 text-center text-surface-400 dark:text-surface-500 font-medium border-r border-surface-200 dark:border-surface-700">#</div>
        <div
          v-for="col in displayColumns"
          :key="col"
          @click="toggleSort(col)"
          class="relative px-3 py-2 text-left cursor-pointer select-none hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors whitespace-nowrap border-r border-surface-200 dark:border-surface-700"
        >
          <span class="inline-flex items-center gap-1">
            {{ col }}
            <span v-if="sortKey === col && sortDir === 'asc'" class="text-primary-500">↑</span>
            <span v-else-if="sortKey === col && sortDir === 'desc'" class="text-primary-500">↓</span>
          </span>
          <div
            class="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-primary-400 dark:hover:bg-primary-500"
            @click.stop
            @mousedown.prevent="startResize(col, $event)"
          />
        </div>
      </div>

      <!-- Scroll body (plain paginated list — no virtual scrolling) -->
      <div ref="bodyRef" class="relative flex-1 min-h-0 overflow-auto">
        <div
          v-for="row in viewRows"
          :key="row.__originalIndex"
          class="grid border-b border-surface-100 dark:border-surface-800 transition-colors cursor-pointer"
          :style="{ gridTemplateColumns }"
          :class="selectedRow === row.__originalIndex
            ? 'bg-primary-100 dark:bg-primary-900/30 ring-1 ring-inset ring-primary-300 dark:ring-primary-700'
            : hoveredRow === row.__originalIndex
              ? 'bg-primary-50 dark:bg-primary-900/15'
              : 'hover:bg-surface-50 dark:hover:bg-surface-800'"
          @click="onRowSelect(row.__originalIndex)"
          @mouseenter="hoveredRow = row.__originalIndex"
          @mouseleave="hoveredRow = -1"
        >
          <div class="w-12 px-2 py-2 text-center text-surface-400 dark:text-surface-500 border-r border-surface-100 dark:border-surface-800">
            {{ row.__originalIndex + 1 }}
          </div>
          <div
            v-for="col in displayColumns"
            :key="col"
            class="jt-cell group flex items-center gap-1 px-3 py-2 text-surface-700 dark:text-surface-300 max-w-[300px] border-r border-surface-100 dark:border-surface-800"
            :class="isComplexValue(row[col]) ? 'cursor-pointer hover:text-primary-600 dark:hover:text-primary-400' : ''"
            @mouseenter="isComplexValue(row[col]) && showPopover(row.__originalIndex, col, $event)"
            @mouseleave="hidePopover"
          >
            <!-- color swatch -->
            <template v-if="isColorValue(row[col])">
              <span class="inline-block w-3.5 h-3.5 rounded border border-surface-300 dark:border-surface-600 shrink-0" :style="{ backgroundColor: getColorStyle(row[col]) || undefined }" />
              <span :class="cellColorClass(row[col])" class="truncate min-w-0">{{ formatCellDisplay(row[col]) }}</span>
            </template>
            <!-- image URL → clickable icon opens lightbox -->
            <template v-else-if="isPossibleImageUrl(row[col])">
              <button
                @click.stop="openCellImage(row[col])"
                :title="t('largeViewer.preview')"
                class="shrink-0 inline-flex items-center text-surface-400 hover:text-primary-600 dark:hover:text-primary-400"
              >
                <Icon name="lucide:image" class="w-3.5 h-3.5" />
              </button>
              <span class="truncate min-w-0">{{ formatCellDisplay(row[col]) }}</span>
            </template>
            <!-- complex (object/array) → popover + copy path -->
            <template v-else-if="isComplexValue(row[col])">
              <span :class="cellColorClass(row[col])" class="truncate min-w-0">{{ formatCellDisplay(row[col]) }}</span>
              <span class="ml-auto text-surface-400 dark:text-surface-500">▾</span>
              <button
                @click.stop="copyCellPath(row.__originalIndex, col)"
                :title="t('largeViewer.table.copyCellPath')"
                class="shrink-0 text-surface-400 hover:text-primary-600 dark:hover:text-primary-400 opacity-0 group-hover:opacity-100"
              >
                <Icon name="lucide:link" class="w-3 h-3" />
              </button>
            </template>
            <!-- plain value -->
            <template v-else>
              <span :class="cellColorClass(row[col])" class="truncate min-w-0">{{ formatCellDisplay(row[col]) }}</span>
            </template>
          </div>
        </div>
        <div v-if="viewRows.length === 0" class="px-3 py-6 text-center text-surface-400 dark:text-surface-500 text-xs">
          {{ t('largeViewer.table.noMatch') }}
        </div>
      </div>

      <!-- Pagination bar -->
      <div class="flex items-center gap-2 px-2 py-1.5 border-t border-surface-200 bg-surface-50 text-xs dark:bg-surface-800 dark:border-surface-700">
        <span class="text-surface-500 dark:text-surface-400">{{ pageRangeLabel }}</span>
        <select
          v-model.number="pageSize"
          class="rounded border border-surface-200 bg-white px-1 py-0.5 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-100"
        >
          <option v-for="sz in pageSizes" :key="sz" :value="sz">{{ sz }}</option>
        </select>
        <span class="text-surface-500 dark:text-surface-400">{{ t('largeViewer.pageSize') }}</span>
        <div class="ml-auto flex items-center gap-1">
          <button
            @click="prevPage"
            :disabled="page <= 0"
            class="w-7 h-7 flex items-center justify-center rounded-lg border border-surface-200 bg-white text-surface-500 hover:bg-surface-50 disabled:opacity-30 disabled:cursor-not-allowed dark:border-surface-700 dark:bg-surface-800 dark:text-surface-400 dark:hover:bg-surface-700"
          >
            <Icon name="lucide:chevron-left" class="w-3.5 h-3.5" />
          </button>
          <button
            @click="nextPage"
            :disabled="(page + 1) * pageSize >= filteredRows.length"
            class="w-7 h-7 flex items-center justify-center rounded-lg border border-surface-200 bg-white text-surface-500 hover:bg-surface-50 disabled:opacity-30 disabled:cursor-not-allowed dark:border-surface-700 dark:bg-surface-800 dark:text-surface-400 dark:hover:bg-surface-700"
          >
            <Icon name="lucide:chevron-right" class="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </template>
    <div v-else class="flex items-center justify-center h-full text-surface-400 dark:text-surface-500 text-sm">
      {{ emptyHint }}
    </div>

    <!-- Hover popover -->
    <Teleport to="body">
      <div
        v-if="popover.visible"
        class="fixed z-[9999] max-w-[480px] max-h-[320px] overflow-auto rounded-lg bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 shadow-lg p-3"
        :style="popoverStyle"
        @mouseenter="keepPopover"
        @mouseleave="hidePopover"
      >
        <div class="text-[10px] font-bold text-surface-400 dark:text-surface-500 uppercase tracking-wider mb-1.5">
          {{ popover.col }}
        </div>
        <JsonSyntaxBlock :data="popover.cellValue" />
      </div>
    </Teleport>

    <!-- Image lightbox (click image icon in a cell) -->
    <Preview
      v-if="showPreview && previewFiles.length"
      :files="previewFiles"
      :start-index="previewIndex"
      @close="showPreview = false"
    />
  </div>
</template>

<script setup lang="ts">
import { copyToClipboard } from '~/utils'
import { toJsonPath } from '~/utils/jsonPath'
import { useToast } from '~/composables/useToast'
import { isColorValue, getColorStyle, isPossibleImageUrl } from '~/utils/mediaPreview'
import type { PreviewImage } from '~/composables/useImagePreview'

const { t } = useI18n()
const toast = useToast()

const props = defineProps<{
  data: unknown[]
  parentPath?: string
}>()

const emptyHint = t('largeViewer.table.emptyHint')

// ── Column detection ──────────────────────────────────────────
const columns = computed(() => {
  const keySet = new Set<string>()
  for (const item of props.data) {
    if (item !== null && typeof item === 'object' && !Array.isArray(item)) {
      for (const key of Object.keys(item)) {
        keySet.add(key)
      }
    }
  }
  return [...keySet]
})

// ── Column visibility (hide / show) ───────────────────────────
const hiddenCols = ref<Set<string>>(new Set())
const displayColumns = computed(() => columns.value.filter(c => !hiddenCols.value.has(c)))
function toggleCol(col: string) {
  const next = new Set(hiddenCols.value)
  if (next.has(col)) next.delete(col)
  else next.add(col)
  hiddenCols.value = next
}

// ── Column widths (resize) ────────────────────────────────────
const colWidths = ref<Record<string, number>>({})
const resizing = reactive({ col: '', startX: 0, startW: 0 })
function startResize(col: string, e: MouseEvent) {
  resizing.col = col
  resizing.startX = e.clientX
  resizing.startW = colWidths.value[col] ?? 160
  window.addEventListener('mousemove', onResize)
  window.addEventListener('mouseup', stopResize)
}
function onResize(e: MouseEvent) {
  if (!resizing.col) return
  const dx = e.clientX - resizing.startX
  colWidths.value = { ...colWidths.value, [resizing.col]: Math.max(60, resizing.startW + dx) }
}
function stopResize() {
  resizing.col = ''
  window.removeEventListener('mousemove', onResize)
  window.removeEventListener('mouseup', stopResize)
}

const gridTemplateColumns = computed(() => {
  const cols = displayColumns.value.map(c => {
    const w = colWidths.value[c]
    return w ? `${w}px` : 'minmax(120px, 1fr)'
  })
  return `3rem ${cols.join(' ')}`
})

// ── Rows with original index ──────────────────────────────────
interface TableRow {
  __originalIndex: number
  [key: string]: unknown
}

const rows = computed<TableRow[]>(() => {
  return props.data.map((item, i) => {
    const row: TableRow = { __originalIndex: i }
    if (item !== null && typeof item === 'object' && !Array.isArray(item)) {
      for (const col of columns.value) {
        row[col] = (item as Record<string, unknown>)[col]
      }
    }
    return row
  })
})

// ── Sorting ───────────────────────────────────────────────────
const sortKey = ref<string | null>(null)
const sortDir = ref<'asc' | 'desc' | null>(null)

function toggleSort(col: string) {
  if (sortKey.value !== col) {
    sortKey.value = col
    sortDir.value = 'asc'
  } else if (sortDir.value === 'asc') {
    sortDir.value = 'desc'
  } else {
    sortKey.value = null
    sortDir.value = null
  }
}

const sortedRows = computed(() => {
  if (!sortKey.value || !sortDir.value) return rows.value

  const key = sortKey.value
  const dir = sortDir.value === 'asc' ? 1 : -1

  return [...rows.value].sort((a, b) => {
    const va = a[key]
    const vb = b[key]

    if (va == null && vb == null) return 0
    if (va == null) return 1
    if (vb == null) return -1

    if (typeof va === 'number' && typeof vb === 'number') {
      return (va - vb) * dir
    }
    if (typeof va === 'boolean' && typeof vb === 'boolean') {
      return (Number(va) - Number(vb)) * dir
    }
    return String(va).localeCompare(String(vb)) * dir
  })
})

// ── In-table filter ───────────────────────────────────────────
const tableQuery = ref('')
const filteredRows = computed(() => {
  const q = tableQuery.value.trim().toLowerCase()
  if (!q) return sortedRows.value
  return sortedRows.value.filter(r =>
    displayColumns.value.some(c => {
      const v = r[c]
      if (v == null) return false
      const s = typeof v === 'object' ? JSON.stringify(v) : String(v)
      return s.toLowerCase().includes(q)
    }),
  )
})

// ── Pagination ───────────────────────────────────────────────
const page = ref(0)
const pageSize = ref(100)
const pageSizes = [50, 100, 200, 500]
const pageStart = computed(() => page.value * pageSize.value)
const viewRows = computed(() => filteredRows.value.slice(pageStart.value, pageStart.value + pageSize.value))
const pageRangeLabel = computed(() => {
  const total = filteredRows.value.length
  if (total === 0) return t('largeViewer.range', { a: 0, b: 0, m: 0 })
  const a = pageStart.value + 1
  const b = Math.min(pageStart.value + pageSize.value, total)
  return t('largeViewer.range', { a, b, m: total })
})
function prevPage() {
  if (page.value > 0) page.value--
}
function nextPage() {
  if ((page.value + 1) * pageSize.value < filteredRows.value.length) page.value++
}
watch([filteredRows, pageSize], () => {
  if (page.value > 0 && pageStart.value >= filteredRows.value.length) page.value = 0
})
watch(() => props.data, () => {
  page.value = 0
  tableQuery.value = ''
})

const bodyRef = ref<HTMLElement | null>(null)
let hideTimer: ReturnType<typeof setTimeout> | null = null

// ── Hover popover ─────────────────────────────────────────────
const popover = reactive({
  visible: false,
  col: '',
  cellValue: null as unknown,
  x: 0,
  y: 0,
})

function isComplexValue(value: unknown): boolean {
  return value !== null && typeof value === 'object'
}

function showPopover(rowIndex: number, col: string, event: MouseEvent) {
  if (hideTimer) { clearTimeout(hideTimer); hideTimer = null }

  const row = viewRows.value.find(r => r.__originalIndex === rowIndex)
  if (!row) return

  const value = row[col]
  if (!isComplexValue(value)) return

  popover.col = col
  popover.cellValue = value

  // Position below the cell
  const td = (event.target as HTMLElement).closest('.jt-cell')
  if (td) {
    const rect = td.getBoundingClientRect()
    popover.x = rect.left
    popover.y = rect.bottom + 4
  }

  popover.visible = true
}

function keepPopover() {
  if (hideTimer) { clearTimeout(hideTimer); hideTimer = null }
}

function hidePopover() {
  hideTimer = setTimeout(() => {
    popover.visible = false
  }, 150)
}

const popoverStyle = computed(() => ({
  left: `${popover.x}px`,
  top: `${popover.y}px`,
}))

// ── Row selection → left editor highlight ─────────────────────
const onNodeInteraction = inject<(path: string, type: 'click' | 'hover') => void>('onNodeInteraction', () => {})
const hoveredRow = ref<number>(-1)
const selectedRow = ref<number>(-1)

function onRowSelect(index: number) {
  if (selectedRow.value === index) {
    // Deselect
    selectedRow.value = -1
    onNodeInteraction('', 'click')
  } else {
    selectedRow.value = index
    const path = buildRowPath(index)
    if (path) onNodeInteraction(path, 'click')
  }
}

function buildRowPath(index: number): string {
  const parent = props.parentPath ?? ''
  if (parent) return `${parent}[${index}]`
  return String(index)
}

// ── Copy row / row path / cell path ──────────────────────────
async function copyRow(index: number) {
  const item = props.data[index]
  const ok = await copyToClipboard(JSON.stringify(item, null, 2))
  if (ok) toast.success('✓ ' + t('largeViewer.copyNode'))
}
async function copyRowPath(index: number) {
  const ok = await copyToClipboard(toJsonPath(buildRowPath(index)))
  if (ok) toast.success('✓ ' + t('largeViewer.copyJsonPath'))
}
async function copyCellPath(rowIndex: number, col: string) {
  const path = `${buildRowPath(rowIndex)}.${col}`
  const ok = await copyToClipboard(toJsonPath(path))
  if (ok) toast.success('✓ ' + t('largeViewer.copyJsonPath'))
}

// ── Export CSV (full array, all rows) ────────────────────────
function csvCell(v: unknown): string {
  if (v === null || v === undefined) return ''
  if (typeof v === 'object') return JSON.stringify(v)
  return String(v)
}
function csvEscape(s: string): string {
  return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s
}
function toCsv(dataRows: unknown[], cols: string[]): string {
  const head = cols.map(csvEscape).join(',')
  const body = dataRows.map(item => {
    const obj = (item !== null && typeof item === 'object' && !Array.isArray(item)) ? item as Record<string, unknown> : {}
    return cols.map(c => csvEscape(csvCell(obj[c]))).join(',')
  }).join('\n')
  return head + '\n' + body
}
function exportCsv() {
  const cols = displayColumns.value
  if (cols.length === 0) return
  const csv = toCsv(props.data, cols)
  const base = props.parentPath
    ? toJsonPath(props.parentPath).replace(/[^\w]+/g, '_').replace(/^_+|_+$/g, '') || 'array'
    : 'array'
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${base}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  toast.success('✓ ' + t('largeViewer.table.exportCsv'))
}

// ── Cell formatting ───────────────────────────────────────────
function formatCellDisplay(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (Array.isArray(value)) return `[${value.length}]`
  if (typeof value === 'object') return `{${Object.keys(value).length}}`
  return String(value)
}

function cellColorClass(value: unknown): string {
  if (value === null || value === undefined) return 'text-surface-300 dark:text-surface-600 italic'
  switch (typeof value) {
    case 'string': return 'text-emerald-600 dark:text-emerald-400'
    case 'number': return 'text-blue-600 dark:text-blue-400'
    case 'boolean': return 'text-orange-600 dark:text-orange-400'
    default: return 'text-surface-600 dark:text-surface-400'
  }
}

// ── Image preview (click icon → lightbox, same as rich mode) ──
const showPreview = ref(false)
const previewIndex = ref(0)
const previewFiles = ref<PreviewImage[]>([])

// Collect unique image URLs across all rows for the visible columns
const cellImageUrls = computed(() => {
  const urls: { url: string; alt: string }[] = []
  const seen = new Set<string>()
  for (const item of props.data) {
    if (item && typeof item === 'object' && !Array.isArray(item)) {
      for (const col of displayColumns.value) {
        const v = (item as Record<string, unknown>)[col]
        if (typeof v === 'string' && isPossibleImageUrl(v) && !seen.has(v)) {
          seen.add(v)
          urls.push({ url: v, alt: `${props.parentPath ? props.parentPath + '.' : ''}${col}` })
        }
      }
    }
  }
  return urls
})

function loadDimensions(url: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight })
    img.onerror = () => resolve({ width: 800, height: 600 })
    img.src = url
  })
}

async function openCellImage(url: unknown) {
  const str = typeof url === 'string' ? url : String(url)
  const sources = cellImageUrls.value
  const idx = sources.findIndex(s => s.url === str)
  previewIndex.value = idx >= 0 ? idx : 0
  const loaded = await Promise.all(
    sources.map(async (s) => {
      const dim = await loadDimensions(s.url)
      return { url: s.url, alt: s.alt, ...dim }
    }),
  )
  previewFiles.value = loaded
  showPreview.value = true
}

// ── Column menu outside-click close ──────────────────────────
const showColMenu = ref(false)
let colMenuClickHandler: ((e: MouseEvent) => void) | null = null
onMounted(() => {
  colMenuClickHandler = (e: MouseEvent) => {
    if (colMenuRef.value && !colMenuRef.value.contains(e.target as Node)) {
      showColMenu.value = false
    }
  }
  document.addEventListener('click', colMenuClickHandler)
})
onUnmounted(() => {
  if (colMenuClickHandler) document.removeEventListener('click', colMenuClickHandler)
})
const colMenuRef = ref<HTMLElement>()
</script>
