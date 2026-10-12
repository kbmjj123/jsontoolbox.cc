<template>
  <div class="je-table-wrap">
    <div v-if="!canShow" class="je-table-empty">{{ t('no_table_data') }}</div>

    <template v-else>
      <div class="je-table-bar">
        <div class="je-col-toggle">
          <button type="button" class="je-btn je-btn-sm" :aria-label="t('columns')" @click="columnsOpen = !columnsOpen">
            {{ t('columns') }}
          </button>
          <div v-if="columnsOpen" class="je-col-menu">
            <label v-for="col in columns" :key="col.id" class="je-col-item">
              <input type="checkbox" :checked="visibleIds.has(col.id)" @change="toggleColumn(col.id)" />
              <span :title="col.label">{{ col.label }}</span>
            </label>
            <div class="je-col-actions">
              <button type="button" class="je-btn je-btn-sm" @click="showAll">{{ t('show_all') }}</button>
              <button type="button" class="je-btn je-btn-sm" @click="hideAll">{{ t('hide_all') }}</button>
            </div>
          </div>
        </div>
        <span class="je-table-count">{{ t('items', { n: dataRows.length }) }}</span>
        <span class="je-toolbar-spacer" />
        <button type="button" class="je-btn je-btn-sm" :disabled="dataRows.length === 0" @click="onExport">
          {{ t('export_csv') }}
        </button>
      </div>

      <div class="je-table-scroll">
        <table class="je-table">
          <thead>
            <tr>
              <th
                v-for="col in visibleColumns"
                :key="col.id"
                class="je-th"
                :class="{ 'is-sorted': sortKey === col.id }"
                @click="onSort(col.id)"
              >
                <span class="je-th-label">{{ col.label }}</span>
                <span v-if="sortKey === col.id" class="je-th-dir">
                  {{ sortDir === 'asc' ? '▲' : '▼' }}
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, ri) in sortedRows" :key="ri">
              <td v-for="col in visibleColumns" :key="col.id" class="je-td">
                {{ cellText(row[col.id]) }}
              </td>
            </tr>
            <tr v-if="sortedRows.length === 0">
              <td class="je-td je-td-empty" :colspan="visibleColumns.length">{{ t('empty') }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { createTranslator, type Locale, type Messages } from '../i18n'
import { toCsv } from '../core/csv'
import { downloadFile } from './clipboard'

interface Column {
  id: string
  label: string
}

const props = withDefaults(
  defineProps<{
    /** Parsed JSON value to render. A top-level array is shown as a table. */
    value: unknown
    locale?: Locale
    messages?: Partial<Messages>
    /** Receive export notifications (e.g. when download is unavailable). */
    onNotify?: (message: string, kind: 'error' | 'success') => void
  }>(),
  { locale: 'en' }
)

const t = computed(() => createTranslator(props.locale, props.messages))

const isObjectRow = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v)

/** Derive columns + normalized row records from the value. */
const model = computed<{ columns: Column[]; rows: Record<string, unknown>[] } | null>(() => {
  const v = props.value
  if (!Array.isArray(v)) return null
  if (v.length === 0) return { columns: [], rows: [] }

  const allObjects = v.every(isObjectRow)

  if (allObjects) {
    const order: string[] = []
    const seen = new Set<string>()
    for (const item of v) {
      for (const k of Object.keys(item)) {
        if (!seen.has(k)) {
          seen.add(k)
          order.push(k)
        }
      }
    }
    const columns: Column[] = order.map((k) => ({ id: k, label: k }))
    const rows = v.map((item) => ({ ...item }))
    return { columns, rows }
  }

  // Array of arrays, or array of primitives/non-objects → index-based columns.
  let width = 0
  for (const item of v) {
    if (Array.isArray(item)) width = Math.max(width, item.length)
  }
  if (width === 0) width = 1 // primitives: a single synthetic column
  const columns: Column[] = []
  for (let i = 0; i < width; i++) {
    columns.push({ id: String(i), label: t.value('column') + ' ' + (i + 1) })
  }
  const rows = v.map((item) => {
    const rec: Record<string, unknown> = {}
    if (Array.isArray(item)) {
      for (let i = 0; i < item.length; i++) rec[String(i)] = item[i]
    } else {
      rec['0'] = item
    }
    return rec
  })
  return { columns, rows }
})

const canShow = computed(() => model.value !== null)
const columns = computed(() => model.value?.columns ?? [])
const dataRows = computed(() => model.value?.rows ?? [])

const visibleIds = ref<Set<string>>(new Set())
const columnsOpen = ref(false)

// Keep visibleIds in sync with the available columns (reset when value changes).
const syncVisible = () => {
  const next = new Set<string>()
  for (const c of columns.value) next.add(c.id)
  visibleIds.value = next
}
syncVisible()
watch(columns, syncVisible, { deep: true })

const visibleColumns = computed(() => columns.value.filter((c) => visibleIds.value.has(c.id)))

function toggleColumn(id: string) {
  const next = new Set(visibleIds.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  visibleIds.value = next
}
function showAll() {
  visibleIds.value = new Set(columns.value.map((c) => c.id))
}
function hideAll() {
  visibleIds.value = new Set()
}

const sortKey = ref<string | null>(null)
const sortDir = ref<'asc' | 'desc'>('asc')

function onSort(id: string) {
  if (sortKey.value === id) {
    sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortKey.value = id
    sortDir.value = 'asc'
  }
}

function compareCells(a: unknown, b: unknown): number {
  if (a === b) return 0
  if (a === null || a === undefined) return -1
  if (b === null || b === undefined) return 1
  if (typeof a === 'number' && typeof b === 'number') return a - b
  return String(a).localeCompare(String(b), undefined, { numeric: true })
}

const sortedRows = computed(() => {
  if (!sortKey.value) return dataRows.value
  const key = sortKey.value
  const dir = sortDir.value === 'asc' ? 1 : -1
  // Copy so we don't mutate the source records order.
  return [...dataRows.value].sort((r1, r2) => dir * compareCells(r1[key], r2[key]))
})

function cellText(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  return JSON.stringify(value)
}

function onExport() {
  if (dataRows.value.length === 0) return
  const headers = visibleColumns.value.map((c) => c.label)
  const rows = sortedRows.value.map((row) =>
    visibleColumns.value.map((c) => row[c.id])
  )
  const csv = toCsv(headers, rows, { bom: true })
  const ok = downloadFile('json-table.csv', csv, 'text/csv')
  if (!ok) {
    props.onNotify?.(t.value('copy'), 'error')
  }
}
</script>
