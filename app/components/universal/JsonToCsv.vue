<template>
  <ResizablePanel v-model:fullscreen="fullscreen" :initial-ratio="0.5" responsive>
    <template #first>
      <div class="h-full pr-3 flex flex-col">
        <JsonInputEditor
          ref="inputEditorRef"
          v-model="inputJson"
          :label="ui.label_input"
          placeholder='[{"name": "Alice", "age": 30}, {"name": "Bob", "age": 25}]'
          example-slug="json-to-csv"
          show-upload
          class="flex-1 min-h-0"
          block-oversized
          @file-size="onFileSize"
        />
      </div>
    </template>

    <template #second>
      <div class="h-full pl-3 flex flex-col gap-2 min-h-0">
        <!-- Preview header: title, row/column counts, field selection -->
        <div class="flex items-center gap-2 shrink-0">
          <label class="text-sm font-bold text-surface-700 dark:text-surface-300">{{ ui.preview_title }}</label>
          <span v-if="rows.length" class="text-xs text-surface-500 dark:text-surface-400">{{ rowsLabel }}</span>
          <span v-if="rows.length" class="text-xs text-surface-500 dark:text-surface-400">{{ columnsLabel }}</span>

          <div class="relative ml-auto shrink-0" ref="fieldMenuRef">
            <button
              type="button"
              @click="showFieldMenu = !showFieldMenu"
              :disabled="!columns.length"
              class="flex items-center gap-1 rounded-lg border border-surface-200 bg-white px-2 py-1 text-xs text-surface-600 hover:bg-surface-50 disabled:opacity-40 disabled:cursor-not-allowed dark:border-surface-700 dark:bg-surface-800 dark:text-surface-300 dark:hover:bg-surface-700"
            >
              <Icon name="lucide:list-checks" class="w-3.5 h-3.5" />
              {{ ui.option_field_selection }}
            </button>
            <div
              v-if="showFieldMenu && columns.length"
              class="absolute right-0 top-full mt-1 z-20 max-h-64 w-56 overflow-auto rounded-lg border border-surface-200 bg-white py-1 shadow-lg dark:border-surface-700 dark:bg-surface-800"
            >
              <label
                v-for="col in columns"
                :key="col"
                class="flex items-center gap-2 px-3 py-1.5 text-xs text-surface-700 hover:bg-surface-100 cursor-pointer dark:text-surface-300 dark:hover:bg-surface-700"
              >
                <input type="checkbox" :checked="selectedSet.has(col)" @change="toggleField(col)" class="rounded" />
                <span class="truncate">{{ col }}</span>
              </label>
            </div>
          </div>
        </div>

        <div class="flex-1 min-h-0 flex flex-col overflow-hidden rounded-xl border border-surface-200 bg-white dark:border-surface-700 dark:bg-surface-900">
          <template v-if="activeColumns.length">
            <div
              class="grid shrink-0 border-b border-surface-200 bg-surface-50 dark:border-surface-700 dark:bg-surface-800"
              :style="gridStyle"
            >
              <div
                v-for="col in activeColumns"
                :key="col"
                class="px-3 py-2 text-xs font-bold text-surface-700 dark:text-surface-300 truncate border-r border-surface-200 dark:border-surface-700"
                :title="col"
              >{{ col }}</div>
            </div>
            <div class="flex-1 min-h-0 overflow-auto">
              <div
                v-for="(row, i) in pageRows"
                :key="page * PREVIEW_PAGE_SIZE + i"
                class="grid border-b border-surface-100 dark:border-surface-800 last:border-0"
                :style="gridStyle"
              >
                <div
                  v-for="col in activeColumns"
                  :key="col"
                  class="px-3 py-1.5 text-xs text-surface-700 dark:text-surface-300 truncate border-r border-surface-100 dark:border-surface-800"
                >{{ formatCell(row[col]) }}</div>
              </div>
            </div>
            <!-- Pagination (numbers + icons only — language neutral) -->
            <div
              v-if="totalPages > 1"
              class="shrink-0 flex items-center justify-center gap-2 border-t border-surface-200 bg-surface-50 px-2 py-1 text-xs text-surface-500 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-400"
            >
              <button
                @click="prevPage"
                :disabled="page <= 0"
                class="w-6 h-6 flex items-center justify-center rounded border border-surface-200 bg-white disabled:opacity-30 disabled:cursor-not-allowed dark:border-surface-700 dark:bg-surface-900"
              >
                <Icon name="lucide:chevron-left" class="w-3.5 h-3.5" />
              </button>
              <span>{{ page + 1 }} / {{ totalPages }}</span>
              <button
                @click="nextPage"
                :disabled="page >= totalPages - 1"
                class="w-6 h-6 flex items-center justify-center rounded border border-surface-200 bg-white disabled:opacity-30 disabled:cursor-not-allowed dark:border-surface-700 dark:bg-surface-900"
              >
                <Icon name="lucide:chevron-right" class="w-3.5 h-3.5" />
              </button>
            </div>
          </template>
          <div v-else-if="error" class="flex items-center justify-center h-full p-4 text-center text-xs text-red-600 dark:text-red-400">
            {{ error }}
          </div>
          <div v-else class="flex items-center justify-center h-full text-surface-300 dark:text-surface-600">
            <Icon name="lucide:table-2" class="w-6 h-6" />
          </div>
        </div>

        <!-- Raw CSV text -->
        <div class="h-36 shrink-0 flex flex-col min-h-0">
          <JsonOutputPanel
            :label="ui.label_output"
            :content="outputCsv"
            :error="error"
            view-mode="text"
            :show-view-toggle="false"
            :show-copy="false"
            :show-download="false"
            :empty-text="$t('system.emptyOutput')"
            class="flex-1 min-h-0"
          />
        </div>
      </div>
    </template>

    <template #toolbar-left>
      <button @click="convert()" class="btn-primary px-5 py-2 text-xs">
        <Icon name="lucide:arrow-right" class="h-4 w-4 mr-1.5" />
        {{ ui.btn_convert }}
      </button>

      <label class="flex items-center gap-1.5 cursor-pointer select-none shrink-0">
        <input
          type="checkbox"
          v-model="flattenNested"
          class="w-3.5 h-3.5 rounded border-surface-300 text-primary-600 focus:ring-primary-500"
        />
        <span class="text-xs text-surface-600 dark:text-surface-400">{{ ui.option_flatten }}</span>
      </label>

      <label class="flex items-center gap-1.5 shrink-0 text-xs text-surface-600 dark:text-surface-400">
        <span class="whitespace-nowrap">{{ ui.option_delimiter }}</span>
        <select
          v-model="delimiter"
          class="rounded-lg border border-surface-200 bg-white px-1.5 py-1 text-xs dark:border-surface-700 dark:bg-surface-800 dark:text-surface-100"
        >
          <option v-for="opt in delimiterOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
        </select>
      </label>

      <label class="flex items-center gap-1.5 shrink-0 text-xs text-surface-600 dark:text-surface-400">
        <span class="whitespace-nowrap">{{ ui.option_encoding }}</span>
        <select
          v-model="encoding"
          class="rounded-lg border border-surface-200 bg-white px-1.5 py-1 text-xs dark:border-surface-700 dark:bg-surface-800 dark:text-surface-100"
        >
          <option v-for="opt in encodingOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
        </select>
      </label>

    </template>

    <template #toolbar-right>
      <div class="flex items-center gap-2 ml-auto">
        <button
          v-if="outputCsv"
          @click="copyCsv"
          class="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400"
        >
          {{ csvCopied ? '✓ ' + $t('system.copy') : $t('system.copy') }}
        </button>
        <button
          v-if="outputCsv"
          @click="downloadCsv"
          class="text-xs text-surface-500 hover:text-surface-700 dark:text-surface-400"
        >
          {{ ui.btn_download }}
        </button>
      </div>
    </template>
  </ResizablePanel>

  <!-- Over the size limit → Large JSON Explorer -->
  <LargeFileWarning
    :visible="largeFile.visible.value"
    :formatted-size="formatBytes(largeFile.bytes.value)"
    @open-explorer="largeFile.openExplorer()"
    @cancel="handleLargeFileCancel"
  />
</template>

<script setup lang="ts">
import { useDebounceFn } from '@vueuse/core'

const props = defineProps<{ tool: any }>()
const { t } = useI18n()
const toast = useToast()

const ui = computed(() => props.tool?.ui ?? {})

/** Rows rendered per preview page (pagination only — no data is dropped). */
const PREVIEW_PAGE_SIZE = 50

const delimiterOptions = [
  { value: ',', label: ',' },
  { value: ';', label: ';' },
  { value: '\t', label: 'Tab' },
]
const encodingOptions = [
  { value: 'utf-8', label: 'UTF-8' },
  { value: 'utf-8-bom', label: 'UTF-8 (BOM)' },
]

const inputJson = ref('')
onMounted(() => {
  const text = useJsonInbox().consumeInbox()
  if (text != null) inputJson.value = text
})
const error = ref('')
const fullscreen = ref(false)
const inputEditorRef = ref()
const csvCopied = ref(false)

const flattenNested = ref(true)
const delimiter = ref(',')
const encoding = ref<'utf-8' | 'utf-8-bom'>('utf-8-bom')

const rows = ref<Record<string, any>[]>([])
const columns = ref<string[]>([])
const selectedColumns = ref<string[]>([])
const showFieldMenu = ref(false)
const fieldMenuRef = ref<HTMLElement>()
const page = ref(0)

const { flattenArray } = useJsonFlatten()
const { prepareForExcel, generateCsv } = useExcelCompat()
const { formatBytes } = useFileSize()
// Big record sets are not converted here — they go to the Large JSON Explorer.
const largeFile = useLargeFileGate()

const selectedSet = computed(() => new Set(selectedColumns.value))
const activeColumns = computed(() => columns.value.filter(c => selectedSet.value.has(c)))

const csvRows = computed(() => rows.value.map(row => activeColumns.value.map(col => row[col])))
const outputCsv = computed(() =>
  rows.value.length && activeColumns.value.length
    ? generateCsv(activeColumns.value, csvRows.value, delimiter.value)
    : '',
)

const onFileSize = (info: { bytes: number; oversized: boolean; text: string; fileName?: string }) => {
  if (!info.oversized) return
  largeFile.check(info.text, info.fileName || 'data.json', info.bytes)
}

const handleLargeFileCancel = () => {
  largeFile.close()
}

const isRecord = (value: unknown): value is Record<string, any> =>
  value !== null && typeof value === 'object' && !Array.isArray(value)

/** Without flattening, nested values are serialized so a cell stays one value. */
const serializeRow = (item: Record<string, any>): Record<string, any> => {
  const out: Record<string, any> = {}
  for (const key of Object.keys(item)) {
    const value = item[key]
    out[key] = value !== null && typeof value === 'object' ? JSON.stringify(value) : value
  }
  return out
}

const collectColumns = (data: Record<string, any>[]): string[] => {
  const seen = new Set<string>()
  const keys: string[] = []
  for (const item of data) {
    for (const key of Object.keys(item)) {
      if (!seen.has(key)) { seen.add(key); keys.push(key) }
    }
  }
  return keys
}

const fail = (message: string, silent: boolean) => {
  error.value = message
  if (!silent && message) toast.error(message)
}

const convert = (silent = false) => {
  error.value = ''
  rows.value = []
  columns.value = []
  selectedColumns.value = []

  if (largeFile.blocked.value) return

  const raw = inputJson.value.trim()
  if (!raw) {
    fail(ui.value?.error_no_data ?? '', silent)
    return
  }

  try {
    const data = JSON.parse(raw)
    if (!Array.isArray(data)) {
      fail(ui.value?.error_not_array ?? '', silent)
      return
    }
    if (data.length === 0) {
      fail(ui.value?.error_empty_array ?? '', silent)
      return
    }
    if (!data.every(isRecord)) {
      fail(ui.value?.error_invalid_row ?? '', silent)
      return
    }

    const processed = flattenNested.value ? flattenArray(data) : data.map(serializeRow)
    const keys = collectColumns(processed)
    if (keys.length === 0) {
      fail(ui.value?.error_no_columns ?? '', silent)
      return
    }

    rows.value = processed
    columns.value = keys
    selectedColumns.value = [...keys]
    if (!silent) toast.success(t('toast.converted'))
  } catch (e) {
    // Auto-conversion runs while the user is still typing — a raw JSON.parse
    // message there would be noise (and would leak engine English on the zh
    // page). Only an explicit Convert surfaces it.
    if (silent) error.value = ''
    else fail((e as Error).message, false)
  }
}

// ── Field selection ──────────────────────────────────────────
const toggleField = (col: string) => {
  const next = new Set(selectedColumns.value)
  if (next.has(col)) next.delete(col)
  else next.add(col)
  selectedColumns.value = columns.value.filter(c => next.has(c))
  error.value = selectedColumns.value.length === 0 ? (ui.value?.error_no_columns ?? '') : ''
}

// ── Preview pagination ───────────────────────────────────────
const totalPages = computed(() => Math.max(1, Math.ceil(rows.value.length / PREVIEW_PAGE_SIZE)))
const pageRows = computed(() =>
  rows.value.slice(page.value * PREVIEW_PAGE_SIZE, page.value * PREVIEW_PAGE_SIZE + PREVIEW_PAGE_SIZE),
)
const prevPage = () => { if (page.value > 0) page.value-- }
const nextPage = () => { if (page.value < totalPages.value - 1) page.value++ }
watch([rows, activeColumns], () => { page.value = 0 })

const gridStyle = computed(() => ({
  gridTemplateColumns: `repeat(${Math.max(activeColumns.value.length, 1)}, minmax(120px, 1fr))`,
}))

const formatCell = (value: unknown): string => {
  if (value === null || value === undefined) return ''
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

// ── Status labels ({count} placeholder) ──────────────────────
const countLabel = (snakeKey: string, camelKey: string, count: number): string => {
  const template = (ui.value?.[snakeKey] ?? ui.value?.[camelKey] ?? '') as string
  return template.replace('{count}', String(count))
}
const rowsLabel = computed(() => countLabel('status_rows', 'statusRows', rows.value.length))
const columnsLabel = computed(() => countLabel('status_columns', 'statusColumns', activeColumns.value.length))

const copyCsv = async () => {
  await copyToClipboard(outputCsv.value)
  csvCopied.value = true
  setTimeout(() => { csvCopied.value = false }, 2000)
}

const downloadCsv = () => {
  if (!outputCsv.value) return
  const { buffer, mimeType, extension } = prepareForExcel(outputCsv.value, {
    encoding: 'utf-8',
    addBom: encoding.value === 'utf-8-bom',
  })
  const blob = new Blob([buffer], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url; link.download = `converted.${extension}`
  document.body.appendChild(link); link.click(); document.body.removeChild(link); URL.revokeObjectURL(url)
}

// Re-run whenever the input or the flatten option changes (silent: no toast spam)
const debouncedConvert = useDebounceFn(() => convert(true), 400)
watch(inputJson, () => debouncedConvert())
watch(flattenNested, () => { if (inputJson.value.trim()) convert(true) })
watch(() => columns.value.length, (n) => { if (n === 0) showFieldMenu.value = false })

const onDocumentClick = (e: MouseEvent) => {
  if (fieldMenuRef.value && !fieldMenuRef.value.contains(e.target as Node)) showFieldMenu.value = false
}
onMounted(() => {
  document.addEventListener('click', onDocumentClick)
  inputEditorRef.value?.loadDefaultExample()
})
onUnmounted(() => {
  document.removeEventListener('click', onDocumentClick)
})
</script>
