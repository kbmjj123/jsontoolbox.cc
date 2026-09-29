<template>
  <ResizablePanel v-model:fullscreen="fullscreen" :initial-ratio="0.5" responsive>
    <template #first>
      <div class="h-full pr-3 flex flex-col">
        <!-- Panel title (state-driven) -->
        <p class="mb-2 text-sm font-semibold text-surface-700 dark:text-surface-300">
          {{ isLoaded ? (ui.label_preview || 'Preview') : (ui.label_input || 'Input') }}
        </p>

        <!-- Filename above content: single line, no wrap -->
        <div
          v-if="isLoaded"
          class="mb-2 flex items-center gap-2 text-xs text-surface-500 dark:text-surface-400"
        >
          <span class="truncate" :title="fileName">📄 {{ fileName }}</span>
          <button
            @click="clearAll"
            class="shrink-0 text-surface-400 hover:text-surface-600 dark:hover:text-surface-200"
            :title="$t('system.clearAll')"
          >
            ✕
          </button>
        </div>

        <!-- Main area: dropzone (empty) OR source preview table (loaded) -->
        <div class="flex-1 min-h-0">
          <!-- Empty state -->
          <div
            v-if="!isLoaded"
            class="h-full flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-surface-300 dark:border-surface-700 px-6 py-10 text-center cursor-pointer hover:border-primary-400 hover:bg-primary-50/40 dark:hover:bg-primary-950/20 transition-colors"
            @click="fileInputRef?.click()"
            @dragover.prevent="dragOver = true"
            @dragleave.prevent="dragOver = false"
            @drop.prevent="onDrop"
            :class="{ 'border-primary-400 bg-primary-50/40 dark:bg-primary-950/20': dragOver }"
          >
            <Icon name="lucide:file-spreadsheet" class="h-10 w-10 text-surface-400 mb-3" />
            <p class="text-sm font-medium text-surface-600 dark:text-surface-300">
              {{ ui.label_drop }}
            </p>
            <p class="mt-2 text-xs text-surface-400">
              {{ ui.btn_choose }}
            </p>
            <input
              ref="fileInputRef"
              type="file"
              accept=".xlsx,.xls,.csv"
              class="hidden"
              @change="onFileChange"
            />
          </div>

          <!-- Loaded state: read-only source table -->
          <div
            v-else
            class="h-full overflow-auto rounded-xl border border-surface-200 bg-white dark:border-surface-700 dark:bg-surface-800"
          >
            <table v-if="previewRows.length" class="w-full text-left text-xs">
              <thead class="sticky top-0 z-10 bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-300">
                <tr>
                  <th class="px-3 py-2 font-semibold border-b border-surface-200 dark:border-surface-700 w-10">#</th>
                  <th
                    v-for="col in columns"
                    :key="col"
                    class="px-3 py-2 font-semibold border-b border-surface-200 dark:border-surface-700 whitespace-nowrap"
                  >
                    {{ col }}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(row, i) in previewRows"
                  :key="i"
                  class="hover:bg-surface-50 dark:hover:bg-surface-700/50"
                >
                  <td class="px-3 py-1.5 text-surface-400 border-b border-surface-100 dark:border-surface-700">{{ i + 1 }}</td>
                  <td
                    v-for="col in columns"
                    :key="col"
                    class="px-3 py-1.5 border-b border-surface-100 dark:border-surface-700 font-mono whitespace-nowrap"
                  >
                    {{ formatCell(row[col]) }}
                  </td>
                </tr>
              </tbody>
            </table>
            <div
              v-else
              class="flex items-center justify-center h-full text-surface-400 text-sm px-4 text-center"
            >
              {{ friendlyError || ui.placeholder_output }}
            </div>
          </div>
        </div>

        <!-- Horizontal status bar (loaded only) -->
        <div
          v-if="isLoaded"
          class="mt-3 flex flex-wrap items-center gap-3 text-xs text-surface-500 dark:text-surface-400"
        >
          <select
            v-if="sheetNames.length > 1"
            v-model="activeSheet"
            class="rounded-lg border border-surface-200 bg-white px-2 py-1.5 dark:border-surface-700 dark:bg-surface-800"
          >
            <option v-for="name in sheetNames" :key="name" :value="name">{{ name }}</option>
          </select>
          <span v-if="rowCount > 0" class="stat-chip">
            <Icon name="lucide:rows" class="h-3 w-3" />
            {{ (ui.status_rows || '{count} rows').replace('{count}', String(rowCount)) }}
          </span>
          <span v-if="isPreviewTruncated" class="text-surface-400">
            {{ (ui.note_preview_limit || '').replace('{shown}', String(shownCount)).replace('{total}', String(rowCount)) }}
          </span>
        </div>
      </div>
    </template>

    <template #second>
      <div class="h-full pl-3 flex flex-col overflow-hidden">
        <JsonOutputPanel
          :label="ui.label_output"
          :content="outputJson"
          :parsed-data="parsedRows"
          :error="error"
          :friendly-message="friendlyError"
          :view-mode="viewMode"
          :show-view-toggle="false"
          :show-copy="false"
          :show-download="false"
          :enable-tree-search="true"
          highlight="json"
          :empty-text="ui.placeholder_output || $t('system.emptyOutput')"
          class="flex-1 min-h-0"
        >
          <template #actions>
            <div
              v-if="outputJson && !error"
              class="flex items-center gap-1 text-xs rounded-lg border border-surface-200 dark:border-surface-700 overflow-hidden"
            >
              <button
                v-for="m in viewModes"
                :key="m"
                @click="viewMode = m"
                :class="viewMode === m ? 'bg-primary-600 text-white' : 'bg-white text-surface-600 dark:bg-surface-800 dark:text-surface-400'"
                class="px-2 py-1 transition-colors"
              >
                {{ viewLabel(m) }}
              </button>
            </div>
          </template>
        </JsonOutputPanel>
      </div>
    </template>

    <template #toolbar-right>
      <div class="flex items-center gap-2 shrink-0">
        <button
          v-if="outputJson && !error"
          @click="copyOutput"
          class="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400"
        >
          {{ ui.btn_copy }}
        </button>
        <button
          v-if="outputJson && !error"
          @click="downloadOutput"
          class="text-xs text-surface-500 hover:text-surface-700 dark:text-surface-400"
        >
          {{ ui.btn_download }}
        </button>
      </div>
    </template>

    <template #toolbar-left>
      <button @click="fileInputRef?.click()" class="btn-primary px-5 py-2 text-xs">
        <Icon name="lucide:upload" class="h-4 w-4 mr-1.5" />
        {{ ui.btn_choose }}
      </button>
      <button @click="clearAll" class="rounded-xl border border-surface-200 bg-white px-4 py-2 text-xs font-bold text-surface-700 hover:bg-surface-50 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-300 dark:hover:bg-surface-700">
        {{ $t('system.clearAll') }}
      </button>
    </template>

  </ResizablePanel>
</template>

<script setup lang="ts">
const props = defineProps<{ tool: any }>()
const { t } = useI18n()
const toast = useToast()

const fileInputRef = ref<HTMLInputElement>()
const dragOver = ref(false)
const fileName = ref('')
const sheetNames = ref<string[]>([])
const activeSheet = ref('')
const outputJson = ref('')
const parsedRows = ref<Record<string, unknown>[]>([])
const rowCount = ref(0)
const error = ref('')
const friendlyError = ref('')
const fullscreen = ref(false)
const viewMode = ref<'text' | 'rich' | 'table'>('text')

const PREVIEW_ROW_LIMIT = 100
const viewModes = ['text', 'rich', 'table'] as const

const ui = computed<Record<string, string>>(() => props.tool?.ui ?? {})
const isLoaded = computed(() => fileName.value !== '')
const columns = computed(() =>
  parsedRows.value.length ? Object.keys(parsedRows.value[0]) : [],
)
const previewRows = computed(() => parsedRows.value.slice(0, PREVIEW_ROW_LIMIT))
const shownCount = computed(() => previewRows.value.length)
const isPreviewTruncated = computed(() => parsedRows.value.length > PREVIEW_ROW_LIMIT)

const viewLabel = (m: string) => ui.value['btn_view_' + m] || m

const formatCell = (v: unknown): string => {
  if (v === null || v === undefined || v === '') return ''
  if (typeof v === 'object') return JSON.stringify(v)
  return String(v)
}

let workbook: any = null
let xlsxMod: any = null

const renderSheet = (sheetName: string) => {
  if (!workbook || !workbook.Sheets[sheetName]) return
  try {
    const rows = xlsxMod.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '' })
    if (!Array.isArray(rows) || rows.length === 0) {
      outputJson.value = ''
      parsedRows.value = []
      rowCount.value = 0
      error.value = 'empty'
      friendlyError.value = ui.value.error_empty
      return
    }
    outputJson.value = JSON.stringify(rows, null, 2)
    parsedRows.value = rows as Record<string, unknown>[]
    rowCount.value = rows.length
    error.value = ''
    friendlyError.value = ''
  } catch (e) {
    outputJson.value = ''
    parsedRows.value = []
    rowCount.value = 0
    error.value = 'read'
    friendlyError.value = ui.value.error_read
    toast.error(friendlyError.value)
  }
}

const loadWorkbook = async (data: ArrayBuffer, name: string) => {
  error.value = ''
  friendlyError.value = ''
  fileName.value = name
  try {
    const XLSX = await import('xlsx')
    xlsxMod = XLSX
    workbook = XLSX.read(data, { type: 'array' })
    sheetNames.value = workbook.SheetNames || []
    if (sheetNames.value.length === 0) {
      outputJson.value = ''
      parsedRows.value = []
      rowCount.value = 0
      error.value = 'empty'
      friendlyError.value = ui.value.error_empty
      return
    }
    activeSheet.value = sheetNames.value[0]
    renderSheet(activeSheet.value)
  } catch (e) {
    outputJson.value = ''
    parsedRows.value = []
    rowCount.value = 0
    error.value = 'read'
    friendlyError.value = ui.value.error_read
    toast.error(friendlyError.value)
  }
}

const onFileChange = async (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  const buf = await file.arrayBuffer()
  await loadWorkbook(buf, file.name)
  ;(e.target as HTMLInputElement).value = ''
}

const onDrop = async (e: DragEvent) => {
  dragOver.value = false
  const file = e.dataTransfer?.files?.[0]
  if (!file) return
  const buf = await file.arrayBuffer()
  await loadWorkbook(buf, file.name)
}

watch(activeSheet, (name) => { if (name) renderSheet(name) })

const copyOutput = async () => {
  if (!outputJson.value) return
  try {
    await navigator.clipboard.writeText(outputJson.value)
    toast.success(t('toast.copied'))
  } catch {
    toast.error(ui.value.error_processing)
  }
}

const downloadOutput = () => {
  if (!outputJson.value) return
  downloadFile(outputJson.value, 'converted.json', 'application/json')
}

const clearAll = () => {
  workbook = null
  fileName.value = ''
  sheetNames.value = []
  activeSheet.value = ''
  outputJson.value = ''
  parsedRows.value = []
  rowCount.value = 0
  error.value = ''
  friendlyError.value = ''
  if (fileInputRef.value) fileInputRef.value.value = ''
}
</script>
