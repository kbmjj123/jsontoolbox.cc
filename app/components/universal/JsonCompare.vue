<template>
  <!-- Fullscreen-capable wrapper: in fullscreen the toolbar + editors + results
       all live inside the enlarged view. -->
  <div
    class="relative"
    :class="isFullscreen
      ? 'cmp-fullscreen fixed inset-0 z-50 bg-white dark:bg-surface-900 p-4 flex flex-col overflow-hidden'
      : ''"
  >
    <!-- Top bar: options toolbar + fullscreen toggle -->
    <div class="flex items-center justify-between gap-2 mb-3 shrink-0">
      <div class="flex flex-wrap items-center gap-2">
        <button type="button" class="lf-btn-sm" :class="{ 'active': sortKeys }" @click="sortKeys = !sortKeys">
          <Icon name="lucide:sort-asc" class="h-3.5 w-3.5" />
          {{ tool.ui?.btn_sort_keys || 'Sort object keys' }}
        </button>

        <button type="button" class="lf-btn-sm" :class="{ 'active': ignoreOrder }" @click="ignoreOrder = !ignoreOrder">
          <Icon name="lucide:list-ordered" class="h-3.5 w-3.5" />
          {{ tool.ui?.btn_ignore_order || 'Ignore array order' }}
        </button>

        <div class="lf-input-sm flex items-center gap-1.5">
          <Icon name="lucide:filter" class="h-3.5 w-3.5 text-surface-400 shrink-0" />
          <input
            v-model="ignoreFields"
            :placeholder="tool.ui?.ignore_fields || 'Ignore fields (e.g. updatedAt)'"
            class="bg-transparent outline-none w-44 placeholder:text-surface-400"
          />
        </div>

        <button type="button" class="lf-btn-sm" @click="swap">
          <Icon name="lucide:arrow-left-right" class="h-3.5 w-3.5" />
          {{ tool.ui?.btn_swap || 'Swap inputs' }}
        </button>

        <button type="button" class="lf-btn-sm-primary" @click="compare()">
          <Icon name="lucide:git-compare" class="h-3.5 w-3.5" />
          {{ tool.ui?.btn_compare || 'Compare' }}
        </button>
      </div>

      <div class="flex items-center gap-2 shrink-0">
        <Transition name="esc-hint">
          <span
            v-if="isFullscreen"
            class="text-xs text-surface-400 dark:text-surface-500 bg-surface-100 dark:bg-surface-800 px-3 py-1 rounded-full"
          >
            Press ESC to exit fullscreen
          </span>
        </Transition>
        <button
          type="button"
          class="lf-btn-icon-sm"
          :title="isFullscreen ? 'Exit fullscreen' : 'Fullscreen'"
          @click="toggleFullscreen"
        >
          <Icon :name="isFullscreen ? 'lucide:minimize' : 'lucide:maximize'" class="w-4 h-4" />
        </button>
      </div>
    </div>

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
    </div>

    <!-- Desktop: resizable split (kept inside the fullscreen wrapper) -->
    <div class="hidden lg:block" :class="isFullscreen ? 'flex-1 min-h-0' : ''">
      <ResizablePanel :initial-ratio="0.5" responsive :class="isFullscreen ? 'h-full' : ''">
        <template #first>
          <div class="h-full pr-3">
            <JsonInputEditor
              ref="leftEditor"
              v-model="leftJson"
              editor-mode="codemirror"
              :label="tool.ui?.label_json_a || 'JSON A (Original)'"
              placeholder='{"name": "Alice", "age": 30}'
              show-upload
              show-load-url
              @clear="onClearLeft"
            />
          </div>
        </template>
        <template #second>
          <div class="h-full pl-3">
            <JsonInputEditor
              ref="rightEditor"
              v-model="rightJson"
              editor-mode="codemirror"
              :label="tool.ui?.label_json_b || 'JSON B (Modified)'"
              placeholder='{"name": "Alice", "age": 31, "email": "alice@example.com"}'
              show-upload
              show-load-url
              @clear="onClearRight"
            />
          </div>
        </template>
        <!-- Hide the panel's own fullscreen button; the outer wrapper owns it. -->
        <template #header-right />
      </ResizablePanel>
    </div>

    <!-- Error -->
    <div v-if="error" class="mt-4 rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-700 dark:bg-red-900/30 dark:border-red-800 dark:text-red-400 shrink-0">{{ error }}</div>

    <!-- Structured result -->
    <div
      v-if="compared && diffs.length"
      class="mt-4"
      :class="isFullscreen ? 'max-h-[45vh] overflow-y-auto shrink-0' : ''"
    >
      <div class="flex flex-wrap items-center justify-between gap-2 mb-2">
        <div class="flex items-center gap-2 text-xs">
          <span class="font-semibold">{{ diffs.length }} {{ tool.ui?.status_total || 'differences' }}</span>
          <span class="text-green-600 dark:text-green-400">+{{ counts.added }}</span>
          <span class="text-red-600 dark:text-red-400">-{{ counts.removed }}</span>
          <span class="text-amber-600 dark:text-amber-400">~{{ counts.changed + counts.typeChanged }}</span>
        </div>
        <div class="flex flex-wrap gap-1.5">
          <button
            v-for="f in filterOptions"
            :key="f.value"
            class="lf-btn-sm"
            :class="{ 'active': filterKind === f.value }"
            @click="filterKind = f.value"
          >
            {{ f.label }}
          </button>
        </div>
      </div>

      <div class="flex flex-wrap gap-2 mb-2">
        <button class="lf-btn-sm" @click="copyAllPaths">
          <Icon name="lucide:clipboard-list" class="h-3.5 w-3.5" />
          {{ tool.ui?.copy_paths || 'Copy all paths' }}
        </button>
        <button class="lf-btn-sm" @click="copyResult">
          <Icon name="lucide:copy" class="h-3.5 w-3.5" />
          {{ tool.ui?.copy_result || 'Copy result' }}
        </button>
        <button class="lf-btn-sm" @click="exportResult">
          <Icon name="lucide:download" class="h-3.5 w-3.5" />
          {{ tool.ui?.export_result || 'Export' }}
        </button>
      </div>

      <div class="rounded-2xl border border-surface-200 divide-y divide-surface-200 dark:border-surface-700 dark:divide-surface-700">
        <div
          v-for="(d, i) in visibleDiffs"
          :key="i"
          class="flex items-start gap-2 p-2.5 cursor-pointer hover:bg-surface-50 dark:hover:bg-surface-800/60"
          @click="locate(d)"
        >
          <span class="shrink-0 mt-0.5 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase" :class="badgeClass(d.type)">
            {{ typeLabel(d) }}
          </span>
          <div class="min-w-0 flex-1">
            <div class="font-mono text-xs break-all text-surface-700 dark:text-surface-200">{{ toDisplayPath(d.path) }}</div>
            <div class="mt-1 text-xs space-y-0.5">
              <div v-if="d.type === 'added'" class="text-green-700 dark:text-green-400"><span class="opacity-50">+ </span>{{ displayValue(d.newValue) }}</div>
              <div v-else-if="d.type === 'removed'" class="text-red-700 dark:text-red-400"><span class="opacity-50">- </span>{{ displayValue(d.oldValue) }}</div>
              <template v-else>
                <div class="text-red-700 dark:text-red-400"><span class="opacity-50">- </span>{{ displayValue(d.oldValue) }}</div>
                <div class="text-green-700 dark:text-green-400"><span class="opacity-50">+ </span>{{ displayValue(d.newValue) }}</div>
                <div v-if="d.type === 'typeChanged'" class="text-purple-600 dark:text-purple-400">{{ d.typeChange }}</div>
              </template>
            </div>
          </div>
          <button
            class="shrink-0 rounded p-1 text-surface-400 hover:bg-surface-200 hover:text-surface-700 dark:hover:bg-surface-700 dark:hover:text-surface-200"
            :title="tool.ui?.btn_copy_path || 'Copy path'"
            @click.stop="copyPath(d)"
          >
            <Icon name="lucide:copy" class="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <p v-if="isTruncated" class="mt-2 text-xs text-surface-500">
        {{ tool.ui?.result_showing || 'Showing first' }} {{ RENDER_CAP }} {{ tool.ui?.status_total || 'differences' }}.
      </p>
    </div>

    <div
      v-else-if="compared && !diffs.length"
      class="mt-4 rounded-xl bg-green-50 border border-green-200 p-3 text-xs text-green-700 dark:bg-green-900/30 dark:border-green-800 dark:text-green-400"
    >
      {{ tool.ui?.status_identical || 'The JSON documents are structurally identical.' }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { toJsonPath } from '~/utils/jsonPath'
import { copyToClipboard, downloadFile } from '~/utils/index'
import { useFullscreen } from '~/composables/useFullscreen'
import { useDiffLineMapping, type DiffEntry, type LineDecoration } from '~/composables/useDiffLineMapping'

const props = defineProps<{ tool: any }>()
// `tool` is auto-resolved in template scope, but not in script scope — bind it explicitly.
const tool = props.tool
const { t } = useI18n()
const toast = useToast()
const { isFullscreen, toggle: toggleFullscreen } = useFullscreen()

const RENDER_CAP = 500

const leftJson = ref('')
const rightJson = ref('')
const error = ref('')
const diffs = ref<DiffEntry[]>([])
const compared = ref(false)
const leftDecorations = ref<LineDecoration[]>([])
const rightDecorations = ref<LineDecoration[]>([])
const leftPathLine = ref(new Map<string, number>())
const rightPathLine = ref(new Map<string, number>())

// ── Comparison options ──
const sortKeys = ref(false)
const ignoreOrder = ref(false)
const ignoreFields = ref('')
const filterKind = ref<'all' | 'added' | 'removed' | 'changed' | 'typeChanged'>('all')

const leftEditor = ref<InstanceType<typeof JsonInputEditor>>()
const rightEditor = ref<InstanceType<typeof JsonInputEditor>>()

const { loadDataFromUrl } = useUrlParams()
const { computeAndMap } = useDiffLineMapping()

onMounted(() => {
  const leftUrl = loadDataFromUrl('left')
  const rightUrl = loadDataFromUrl('right')
  if (leftUrl) leftJson.value = leftUrl
  if (rightUrl) rightJson.value = rightUrl
  if (leftUrl && rightUrl) nextTick(() => compare())
})

// ── Line-level diff highlighting ──
watch([leftDecorations, rightDecorations], ([newLeft, newRight]) => {
  leftEditor.value?.setLineDecorations(newLeft)
  rightEditor.value?.setLineDecorations(newRight)
}, { flush: 'post' })

// ── Auto-compare on input / option change (debounced) ──
let compareTimer: ReturnType<typeof setTimeout> | null = null
watch([leftJson, rightJson, sortKeys, ignoreOrder, ignoreFields], () => {
  if (compareTimer) clearTimeout(compareTimer)
  compareTimer = setTimeout(() => { compare(true) }, 300)
})

// ── Scroll sync between editors ──
let scrollSyncing = false

onMounted(() => {
  leftEditor.value?.onCmScrollRegister((info) => {
    if (scrollSyncing) return
    scrollSyncing = true
    const ratio = info.scrollTop / Math.max(1, info.scrollHeight - info.clientHeight)
    rightEditor.value?.scrollToRatio(ratio)
    nextTick(() => { scrollSyncing = false })
  })

  rightEditor.value?.onCmScrollRegister((info) => {
    if (scrollSyncing) return
    scrollSyncing = true
    const ratio = info.scrollTop / Math.max(1, info.scrollHeight - info.clientHeight)
    leftEditor.value?.scrollToRatio(ratio)
    nextTick(() => { scrollSyncing = false })
  })
})

const compare = (silent = false) => {
  error.value = ''
  diffs.value = []
  compared.value = false
  leftDecorations.value = []
  rightDecorations.value = []
  leftPathLine.value = new Map()
  rightPathLine.value = new Map()
  leftEditor.value?.clearLineDecorations()
  rightEditor.value?.clearLineDecorations()

  if (!leftJson.value.trim()) { error.value = tool.ui?.error_empty_a || 'Enter JSON A first'; return }
  if (!rightJson.value.trim()) { error.value = tool.ui?.error_empty_b || 'Enter JSON B first'; return }

  try { JSON.parse(leftJson.value) } catch (e) { error.value = `${tool.ui?.error_invalid_a || 'JSON A is not valid JSON'}: ${(e as Error).message}`; if (!silent) toast.error(error.value); return }
  try { JSON.parse(rightJson.value) } catch (e) { error.value = `${tool.ui?.error_invalid_b || 'JSON B is not valid JSON'}: ${(e as Error).message}`; if (!silent) toast.error(error.value); return }

  const patterns = ignoreFields.value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

  const result = computeAndMap(leftJson.value, rightJson.value, {
    ignoreArrayOrder: ignoreOrder.value,
    ignorePaths: patterns.length ? patterns : undefined,
    sortKeys: sortKeys.value,
  })
  diffs.value = result.diffs
  leftDecorations.value = result.leftLines
  rightDecorations.value = result.rightLines
  leftPathLine.value = result.leftPathLine
  rightPathLine.value = result.rightPathLine
  compared.value = true
  if (!silent) toast.success(t('toast.compared'))
}

const swap = () => {
  const a = leftJson.value
  leftJson.value = rightJson.value
  rightJson.value = a
}

// ── Derived result data ──
const counts = computed(() => {
  const c = { added: 0, removed: 0, changed: 0, typeChanged: 0 }
  for (const d of diffs.value) c[d.type]++
  return c
})

const filteredDiffs = computed(() => {
  if (filterKind.value === 'all') return diffs.value
  return diffs.value.filter((d) => d.type === filterKind.value)
})

const visibleDiffs = computed(() => filteredDiffs.value.slice(0, RENDER_CAP))
const isTruncated = computed(() => filteredDiffs.value.length > RENDER_CAP)

const filterOptions = computed(() => [
  { value: 'all' as const, label: tool.ui?.filter_all || 'All' },
  { value: 'added' as const, label: tool.ui?.status_added || 'Added' },
  { value: 'removed' as const, label: tool.ui?.status_removed || 'Removed' },
  { value: 'changed' as const, label: tool.ui?.status_changed || 'Changed' },
  { value: 'typeChanged' as const, label: tool.ui?.status_type_changed || 'Type changed' },
])

function toDisplayPath(path: string): string {
  return toJsonPath(path)
}

function displayValue(v: unknown): string {
  if (v === undefined) return ''
  try { return typeof v === 'string' ? `"${v}"` : JSON.stringify(v) } catch { return String(v) }
}

function typeLabel(d: DiffEntry): string {
  if (d.type === 'added') return tool.ui?.status_added || 'added'
  if (d.type === 'removed') return tool.ui?.status_removed || 'removed'
  if (d.type === 'typeChanged') return tool.ui?.status_type_changed || 'type changed'
  return tool.ui?.status_changed || 'changed'
}

function badgeClass(type: DiffEntry['type']): string {
  switch (type) {
    case 'added': return 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
    case 'removed': return 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
    case 'typeChanged': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300'
    default: return 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
  }
}

async function copyPath(d: DiffEntry) {
  const ok = await copyToClipboard(toDisplayPath(d.path))
  if (ok) toast.success(t('toast.copied') || 'Copied')
}

async function copyAllPaths() {
  const text = diffs.value.map((d) => toDisplayPath(d.path)).join('\n')
  const ok = await copyToClipboard(text)
  if (ok) toast.success(t('toast.copied') || 'Copied')
}

async function copyResult() {
  const lines = diffs.value.map((d) => {
    const p = toDisplayPath(d.path)
    if (d.type === 'added') return `+ ${p}: ${displayValue(d.newValue)}`
    if (d.type === 'removed') return `- ${p}: ${displayValue(d.oldValue)}`
    if (d.type === 'typeChanged') return `~ ${p}: ${displayValue(d.oldValue)} → ${displayValue(d.newValue)} (${d.typeChange})`
    return `~ ${p}: ${displayValue(d.oldValue)} → ${displayValue(d.newValue)}`
  })
  const ok = await copyToClipboard(lines.join('\n'))
  if (ok) toast.success(t('toast.copied') || 'Copied')
}

function exportResult() {
  const lines = diffs.value.map((d) => {
    const p = toDisplayPath(d.path)
    if (d.type === 'added') return `+ ${p}: ${displayValue(d.newValue)}`
    if (d.type === 'removed') return `- ${p}: ${displayValue(d.oldValue)}`
    if (d.type === 'typeChanged') return `~ ${p}: ${displayValue(d.oldValue)} → ${displayValue(d.newValue)} (${d.typeChange})`
    return `~ ${p}: ${displayValue(d.oldValue)} → ${displayValue(d.newValue)}`
  })
  downloadFile(lines.join('\n'), 'json-diff.txt', 'text/plain')
}

function locate(d: DiffEntry) {
  let editor: InstanceType<typeof JsonInputEditor> | undefined
  let line: number | undefined
  if (d.type === 'added') {
    editor = rightEditor.value
    line = rightPathLine.value.get(d.path)
  } else if (d.type === 'removed') {
    editor = leftEditor.value
    line = leftPathLine.value.get(d.path)
  } else {
    editor = rightEditor.value
    line = rightPathLine.value.get(d.path) ?? leftPathLine.value.get(d.path)
  }
  if (editor && line) {
    editor.scrollToLine(line)
    editor.highlightLine(line, 'flash')
  }
}

const onClearLeft = () => { error.value = '' }
const onClearRight = () => { error.value = '' }
</script>
