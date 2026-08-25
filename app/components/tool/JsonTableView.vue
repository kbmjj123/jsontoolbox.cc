<template>
  <div ref="containerRef" class="h-full overflow-auto rounded-xl border border-surface-200 bg-white dark:border-surface-700 dark:bg-surface-900 relative">
    <table v-if="columns.length > 0" class="w-full text-xs font-mono">
      <thead>
        <tr class="sticky top-0 z-10 bg-surface-50 dark:bg-surface-800 border-b border-surface-200 dark:border-surface-700">
          <th class="w-12 px-2 py-2 text-center text-surface-400 dark:text-surface-500 font-medium">#</th>
          <th
            v-for="col in columns"
            :key="col"
            @click="toggleSort(col)"
            class="px-3 py-2 text-left font-bold text-surface-700 dark:text-surface-300 cursor-pointer select-none hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors whitespace-nowrap"
          >
            <span class="inline-flex items-center gap-1">
              {{ col }}
              <span v-if="sortKey === col && sortDir === 'asc'" class="text-primary-500">↑</span>
              <span v-else-if="sortKey === col && sortDir === 'desc'" class="text-primary-500">↓</span>
            </span>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(row, displayIndex) in sortedRows"
          :key="row.__originalIndex"
          class="border-b border-surface-100 dark:border-surface-800 last:border-0 transition-colors"
          :class="hoveredRow === row.__originalIndex
            ? 'bg-primary-50 dark:bg-primary-900/20'
            : 'hover:bg-surface-50 dark:hover:bg-surface-800'"
          @mouseenter="onRowHover(row.__originalIndex)"
          @mouseleave="onRowLeave"
        >
          <td class="w-12 px-2 py-2 text-center text-surface-400 dark:text-surface-500">
            {{ row.__originalIndex + 1 }}
          </td>
          <td
            v-for="col in columns"
            :key="col"
            class="px-3 py-2 text-surface-700 dark:text-surface-300 max-w-[300px] truncate"
            :class="isComplexValue(row[col]) ? 'cursor-pointer hover:text-primary-600 dark:hover:text-primary-400' : ''"
            @mouseenter="isComplexValue(row[col]) && showPopover(row.__originalIndex, col, $event)"
            @mouseleave="hidePopover"
          >
            <span :class="cellColorClass(row[col])">{{ formatCellDisplay(row[col]) }}</span>
            <span v-if="isComplexValue(row[col])" class="ml-1 text-surface-400 dark:text-surface-500">▾</span>
          </td>
        </tr>
      </tbody>
    </table>
    <div v-else class="flex items-center justify-center h-full text-surface-400 dark:text-surface-500 text-sm">
      No array data to display
    </div>

    <!-- Hover popover -->
    <Teleport to="body">
      <div
        v-if="popover.visible"
        ref="popoverRef"
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
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  data: unknown[]
  parentPath?: string
}>()

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

// ── Hover popover ─────────────────────────────────────────────
const popover = reactive({
  visible: false,
  col: '',
  cellValue: null as unknown,
  x: 0,
  y: 0,
})

const popoverRef = ref<HTMLElement>()
const containerRef = ref<HTMLElement>()
let hideTimer: ReturnType<typeof setTimeout> | null = null

function isComplexValue(value: unknown): boolean {
  return value !== null && typeof value === 'object'
}

function showPopover(rowIndex: number, col: string, event: MouseEvent) {
  if (hideTimer) { clearTimeout(hideTimer); hideTimer = null }

  const row = sortedRows.value.find(r => r.__originalIndex === rowIndex)
  if (!row) return

  const value = row[col]
  if (!isComplexValue(value)) return

  popover.col = col
  popover.cellValue = value

  // Position below the cell
  const td = (event.target as HTMLElement).closest('td')
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

// ── Hover → left editor highlight ─────────────────────────────
const onNodeInteraction = inject<(path: string, type: 'click' | 'hover') => void>('onNodeInteraction', () => {})
const hoveredRow = ref<number>(-1)

function onRowHover(index: number) {
  hoveredRow.value = index
  const path = buildRowPath(index)
  console.log('[TableView] onRowHover path:', path)
  if (path) onNodeInteraction(path, 'hover')
}

function onRowLeave() {
  hoveredRow.value = -1
  onNodeInteraction('', 'hover')
}

function buildRowPath(index: number): string {
  const parent = props.parentPath ?? ''
  if (parent) return `${parent}[${index}]`
  return `[${index}]`
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
</script>
