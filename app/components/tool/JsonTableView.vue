<template>
  <div class="h-full overflow-auto rounded-xl border border-surface-200 bg-white dark:border-surface-700 dark:bg-surface-900">
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
        <template v-for="(row, displayIndex) in sortedRows" :key="row.__originalIndex">
          <tr
            class="border-b transition-colors"
            :class="[
              isExpandedRow(row.__originalIndex) ? 'border-transparent' : 'border-surface-100 dark:border-surface-800 last:border-0',
              hoveredRow === row.__originalIndex
                ? 'bg-primary-50 dark:bg-primary-900/20'
                : 'hover:bg-surface-50 dark:hover:bg-surface-800',
            ]"
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
              @click="isComplexValue(row[col]) && toggleExpand(row.__originalIndex, col)"
            >
              <span :class="cellColorClass(row[col])">{{ formatCellDisplay(row[col]) }}</span>
              <span v-if="isComplexValue(row[col])" class="ml-1 text-surface-400 dark:text-surface-500">
                {{ isCellExpanded(row.__originalIndex, col) ? '▾' : '▸' }}
              </span>
            </td>
          </tr>
          <!-- Expanded detail row -->
          <tr v-if="getExpandedValue(row.__originalIndex) !== undefined" class="bg-surface-50 dark:bg-surface-800/50">
            <td :colspan="columns.length + 1" class="px-4 py-3">
              <div class="flex items-start gap-2">
                <span class="text-[10px] font-bold text-surface-400 dark:text-surface-500 uppercase tracking-wider shrink-0 mt-0.5">
                  {{ getExpandedCol(row.__originalIndex) }}
                </span>
                <pre class="flex-1 text-xs font-mono text-surface-700 dark:text-surface-300 whitespace-pre-wrap break-all leading-relaxed bg-white dark:bg-surface-900 rounded-lg p-3 border border-surface-200 dark:border-surface-700">{{ formatExpandedValue(row.__originalIndex) }}</pre>
              </div>
            </td>
          </tr>
        </template>
      </tbody>
    </table>
    <div v-else class="flex items-center justify-center h-full text-surface-400 dark:text-surface-500 text-sm">
      No array data to display
    </div>
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

    // null/undefined → bottom
    if (va == null && vb == null) return 0
    if (va == null) return 1
    if (vb == null) return -1

    // numbers
    if (typeof va === 'number' && typeof vb === 'number') {
      return (va - vb) * dir
    }

    // booleans
    if (typeof va === 'boolean' && typeof vb === 'boolean') {
      return (Number(va) - Number(vb)) * dir
    }

    // strings (and mixed types)
    return String(va).localeCompare(String(vb)) * dir
  })
})

// ── Cell expand (click object/array → inline detail) ──────────
const expandedCell = ref<{ rowIndex: number; col: string } | null>(null)

function isComplexValue(value: unknown): boolean {
  return value !== null && typeof value === 'object'
}

function toggleExpand(rowIndex: number, col: string) {
  if (expandedCell.value?.rowIndex === rowIndex && expandedCell.value?.col === col) {
    expandedCell.value = null
  } else {
    expandedCell.value = { rowIndex, col }
  }
}

function isCellExpanded(rowIndex: number, col: string): boolean {
  return expandedCell.value?.rowIndex === rowIndex && expandedCell.value?.col === col
}

function isExpandedRow(rowIndex: number): boolean {
  return expandedCell.value?.rowIndex === rowIndex
}

function getExpandedCol(rowIndex: number): string | undefined {
  return expandedCell.value?.rowIndex === rowIndex ? expandedCell.value.col : undefined
}

function getExpandedValue(rowIndex: number): unknown {
  if (expandedCell.value?.rowIndex !== rowIndex) return undefined
  const row = sortedRows.value.find(r => r.__originalIndex === rowIndex)
  if (!row) return undefined
  return row[expandedCell.value.col]
}

function formatExpandedValue(rowIndex: number): string {
  const value = getExpandedValue(rowIndex)
  if (value === undefined) return ''
  return JSON.stringify(value, null, 2)
}

// ── Hover → left editor highlight ─────────────────────────────
const onNodeInteraction = inject<(path: string, type: 'click' | 'hover') => void>('onNodeInteraction', () => {})
const hoveredRow = ref<number>(-1)

function onRowHover(index: number) {
  hoveredRow.value = index
  const path = buildRowPath(index)
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

function formatCellTitle(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (typeof value === 'object') return 'Click to expand'
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

