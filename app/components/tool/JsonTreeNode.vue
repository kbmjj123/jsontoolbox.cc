<template>
  <div class="font-mono text-sm">
    <!-- Children list (object / array unified) — every child is rendered in full -->
    <template v-if="totalChildren > 0">
      <div v-for="entry in childrenEntries" :key="entry.childPath">
        <div
          :ref="(el) => markRow(entry.childPath, el as HTMLElement | null)"
          :class="[
            'flex rounded px-1 cursor-pointer group transition-colors',
            flashPath === entry.childPath
              ? 'bg-orange-200 dark:bg-orange-700/50 ring-2 ring-orange-400 dark:ring-orange-500 animate-pulse'
              : isCurrentMatch(entry.childPath)
                ? 'bg-amber-200 dark:bg-amber-700/60 ring-1 ring-amber-400 dark:ring-amber-500'
                : isMatch(entry.childPath)
                  ? 'bg-yellow-100 dark:bg-yellow-800/40'
                  : isSelected(entry.childPath)
                    ? 'bg-primary-50 dark:bg-primary-900/30 border-l-2 border-primary-500 dark:border-primary-400'
                    : 'hover:bg-surface-100 dark:hover:bg-surface-700',
          ]"
          @click="entry.expandable ? toggle(entry.childPath) : selectAndCopy(entry.childPath)"
          @mouseenter="!entry.expandable && onNodeInteraction(entry.childPath, 'hover')"
          @mouseleave="onNodeInteraction('', 'hover')"
          @contextmenu.prevent="onRowMenu(entry, $event)"
        >
          <div class="flex items-start gap-1 min-w-0 leading-[1.5] flex-1">
            <button
              v-if="entry.expandable"
              @click.stop="toggle(entry.childPath)"
              class="w-4 h-4 flex items-center justify-center text-surface-400 hover:text-surface-600 shrink-0"
            >
              <Icon :name="isNodeExpanded(entry.childPath) ? 'lucide:chevron-down' : 'lucide:chevron-right'" class="w-3 h-3" />
            </button>
            <span v-else class="w-4 shrink-0"></span>

            <span v-if="entry.isArrayIndex" class="text-surface-400">[{{ entry.key }}]</span>
            <span v-else class="text-purple-600 dark:text-purple-400">"{{ entry.key }}"</span>
            <span class="text-surface-400">:</span>

            <span v-if="!entry.expandable" class="flex items-center gap-1.5 min-w-0 flex-wrap">
              <span
                v-if="colorStyleOf(entry.value)"
                class="inline-block w-3.5 h-3.5 rounded border border-surface-300 dark:border-surface-600 shrink-0"
                :style="{ backgroundColor: colorStyleOf(entry.value) || undefined }"
              />
              <span :class="valueColorClass(entry.value)">{{ formatValue(entry.value, entry.childPath) }}</span>
            </span>
            <span v-else class="text-surface-400">
              {{ isArray(entry.value) ? `[${entry.value.length}]` : '{…}' }}
            </span>

            <span class="ml-1.5 text-[10px] text-surface-400 dark:text-surface-500 select-none">{{ typeLabel(entry.value) }}</span>
            <JsonValuePreview :value="entry.value" />
            <button
              v-if="isArray(entry.value)"
              @click.stop="showArrayAsTable(entry.childPath)"
              class="opacity-0 group-hover:opacity-100 ml-0.5 text-surface-400 hover:text-surface-600 dark:hover:text-surface-300"
              :title="$t('largeViewer.table.viewAsTable')"
            >
              <Icon name="lucide:table" class="w-3.5 h-3.5" />
            </button>
            <button
              v-if="editing?.batchMode.value"
              @click.stop="editing?.toggleBatch(entry.childPath)"
              class="ml-0.5 shrink-0"
              :class="isBatchSelected(entry.childPath) ? 'text-primary-600 dark:text-primary-400' : 'text-surface-300 hover:text-surface-500 dark:text-surface-600'"
              :title="$t('edit.batch')"
            >
              <Icon :name="isBatchSelected(entry.childPath) ? 'lucide:check-square' : 'lucide:square'" class="w-3.5 h-3.5" />
            </button>
            <button
              @click.stop="onRowMenu(entry, $event)"
              class="opacity-0 group-hover:opacity-100 ml-0.5 text-surface-400 hover:text-surface-600 dark:hover:text-surface-300"
              :title="$t('largeViewer.copyJsonPath')"
            >
              <Icon name="lucide:more-vertical" class="w-3.5 h-3.5" />
            </button>
            <span
              v-if="hasError(entry.childPath)"
              class="relative group/error shrink-0 ml-1"
            >
              <span class="inline-block w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span class="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 rounded bg-red-600 text-white text-[10px] text-left opacity-0 group-hover/error:opacity-100 transition-opacity pointer-events-none z-50">
                <template v-for="(line, li) in errorTooltipLines(getNodeErrors(entry.childPath), entry.value)" :key="li">
                  <div>{{ line.message }}</div>
                  <div v-if="line.detail" class="opacity-80">{{ line.detail }}</div>
                </template>
              </span>
            </span>
          </div>
        </div>

        <div v-if="entry.expandable && isNodeExpanded(entry.childPath)" class="ml-4 border-l border-surface-200 dark:border-surface-700 pl-0">
          <JsonTreeNode :data="entry.value" :path="entry.childPath" :depth="depth + 1" />
        </div>

        <div v-if="isPossibleImageUrl(entry.value) && !isSensitive(entry.childPath)" class="flex">
          <span class="w-8 shrink-0"></span>
          <img
            :src="entry.value"
            :alt="String(entry.key)"
            class="max-w-[160px] max-h-[100px] rounded-lg border border-surface-200 dark:border-surface-700 object-contain mt-1 mb-1 cursor-zoom-in"
            @click.stop="openPreview(String(entry.key))"
            @error="(($event.target as HTMLImageElement).parentElement as HTMLElement).style.display = 'none'"
          />
        </div>
      </div>
    </template>

    <!-- Primitive (root-level) -->
    <template v-else>
      <div
        :ref="(el) => markRow(props.path, el as HTMLElement | null)"
        :class="[
          'flex rounded px-1 group transition-colors',
          flashPath === props.path
            ? 'bg-orange-200 dark:bg-orange-700/50 ring-2 ring-orange-400 dark:ring-orange-500 animate-pulse'
            : isCurrentMatch(props.path)
              ? 'bg-amber-200 dark:bg-amber-700/60 ring-1 ring-amber-400 dark:ring-amber-500'
              : isMatch(props.path)
                ? 'bg-yellow-100 dark:bg-yellow-800/40'
                : isSelected(props.path)
                  ? 'bg-primary-50 dark:bg-primary-900/30 border-l-2 border-primary-500 dark:border-primary-400'
                  : '',
        ]"
        @contextmenu.prevent="onRootMenu($event)"
      >
        <div class="flex items-start gap-1 leading-[1.5] flex-1">
          <span class="w-4 shrink-0"></span>
          <span class="flex items-center gap-1.5">
            <span
              v-if="colorStyleOf(data)"
              class="inline-block w-3.5 h-3.5 rounded border border-surface-300 dark:border-surface-600 shrink-0"
              :style="{ backgroundColor: colorStyleOf(data) || undefined }"
            />
            <span :class="valueColorClass(data)">{{ formatValue(data, props.path) }}</span>
          </span>

          <span class="ml-1.5 text-[10px] text-surface-400 dark:text-surface-500 select-none">{{ typeLabel(props.data) }}</span>
          <JsonValuePreview :value="props.data" />
          <button
            v-if="editing?.batchMode.value"
            @click.stop="editing?.toggleBatch(props.path)"
            class="ml-0.5 shrink-0"
            :class="isBatchSelected(props.path) ? 'text-primary-600 dark:text-primary-400' : 'text-surface-300 hover:text-surface-500 dark:text-surface-600'"
            :title="$t('edit.batch')"
          >
            <Icon :name="isBatchSelected(props.path) ? 'lucide:check-square' : 'lucide:square'" class="w-3.5 h-3.5" />
          </button>
          <button
            @click.stop="onRootMenu($event)"
            class="opacity-0 group-hover:opacity-100 ml-0.5 text-surface-400 hover:text-surface-600 dark:hover:text-surface-300"
            :title="$t('largeViewer.copyJsonPath')"
          >
            <Icon name="lucide:more-vertical" class="w-3.5 h-3.5" />
          </button>
          <span
            v-if="hasError(props.path)"
            class="relative group/error shrink-0 ml-1"
          >
            <span class="inline-block w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span class="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 rounded bg-red-600 text-white text-[10px] text-left opacity-0 group-hover/error:opacity-100 transition-opacity pointer-events-none z-50">
              <template v-for="(line, li) in errorTooltipLines(getNodeErrors(props.path), props.data)" :key="li">
                <div>{{ line.message }}</div>
                <div v-if="line.detail" class="opacity-80">{{ line.detail }}</div>
              </template>
            </span>
          </span>
        </div>
      </div>
    </template>

    <!-- Image lightbox -->
    <Preview
      v-if="showPreview && previewFiles.length"
      :files="previewFiles"
      :start-index="previewIndex"
      @close="showPreview = false"
    />

    <!-- Node action menu (right-click / "⋯"): Copy JSONPath, value, node, parent -->
    <JsonNodeMenu
      v-if="!props.path && menuState.node"
      :node="menuState.node"
      :x="menuState.x"
      :y="menuState.y"
      @close="closeNodeMenu"
    />
    <JsonValueInspector
      v-if="!props.path && inspectorValue !== null"
      :value="inspectorValue"
      @close="inspectorValue = null"
    />
  </div>
</template>

<script setup lang="ts">
import type { PreviewImage } from '~/composables/useImagePreview'
import type { useTreeSearch } from '~/composables/useTreeSearch'
import type { FieldError } from '~/types/jsonErrors'
import { toJsonPath, jsonTypeLabel } from '~/utils/jsonPath'
import { isColorValue } from '~/utils/mediaPreview'
import { useNodeEditing } from '~/composables/useNodeEditing'

const { t } = useI18n()

const props = withDefaults(defineProps<{
  data: unknown
  path: string
  depth?: number
}>(), {
  depth: 0,
})

const totalChildren = computed(() => {
  if (isObject(props.data)) return Object.keys(props.data).length
  if (isArray(props.data)) return (props.data as unknown[]).length
  return 0
})

// ── Children entries — every child of the node, rendered in full (no windowing) ──
interface ChildEntry {
  key: string | number
  value: unknown
  expandable: boolean
  childPath: string
  isArrayIndex: boolean
}

const childrenEntries = computed<ChildEntry[]>(() => {
  if (isObject(props.data)) {
    return Object.entries(props.data).map(([key, value]) => ({
      key,
      value,
      expandable: isExpandable(value),
      childPath: getFullPath(key),
      isArrayIndex: false,
    }))
  }
  if (isArray(props.data)) {
    return (props.data as unknown[]).map((value, index) => ({
      key: index,
      value,
      expandable: isExpandable(value),
      childPath: getFullPath(index),
      isArrayIndex: true,
    }))
  }
  return []
})

// ── Shared expanded state (inject + re-provide) ────────────────
const expanded = inject<Ref<Set<string>>>('richExpanded', ref(new Set()))
provide('richExpanded', expanded)

// ── Selected path ──────────────────────────────────────────────
const selectedPath = inject<Ref<string>>('richSelectedPath', ref(''))
provide('richSelectedPath', selectedPath)

// ── Node interaction callback (click/hover → source line) ────
const onNodeInteraction = inject<(path: string, type: 'click' | 'hover') => void>('onNodeInteraction', () => {})

// ── "View as table" request (array node → JsonOutputPanel table view) ──
const showArrayAsTable = inject<(path: string) => void>('showArrayAsTable', () => {})

// ── Expand/collapse all signals ────────────────────────────────
const expandAllSignal = inject<Ref<number>>('expandAllSignal', ref(0))
const collapseAllSignal = inject<Ref<number>>('collapseAllSignal', ref(0))
provide('expandAllSignal', expandAllSignal)
provide('collapseAllSignal', collapseAllSignal)

// Collect all expandable paths for "expand all"
function getAllExpandablePaths(data: unknown, parentPath = ''): string[] {
  const paths: string[] = []
  if (isObject(data)) {
    for (const key of Object.keys(data)) {
      const childPath = parentPath ? `${parentPath}.${key}` : key
      const child = (data as Record<string, unknown>)[key]
      if (isExpandable(child)) {
        paths.push(childPath)
        paths.push(...getAllExpandablePaths(child, childPath))
      }
    }
  } else if (isArray(data)) {
    for (let i = 0; i < data.length; i++) {
      const childPath = `${parentPath}[${i}]`
      if (isExpandable(data[i])) {
        paths.push(childPath)
        paths.push(...getAllExpandablePaths(data[i], childPath))
      }
    }
  }
  return paths
}

// ── Field errors (injected from JsonOutputPanel) ───────────────
const errorMap = inject<Ref<Record<string, FieldError[]>>>('jsonErrors', ref({}))
provide('jsonErrors', errorMap)

// ── Locate path signal (click error → scroll to tree node) ─────────
const locatePath = inject<Ref<string>>('locatePath', ref(''))
provide('locatePath', locatePath)
const flashPath = ref('')

// ── Search state (injected from JsonTreeViewer) ────────────────
const search = inject<ReturnType<typeof useTreeSearch> | null>('treeSearch', null)

// ── Masked state for sensitive fields ─────────────────────────
const maskedFields = inject<ComputedRef<Set<string>>>('maskedFields', computed(() => new Set()))
provide('maskedFields', maskedFields)

// ── Node action menu (right-click / "⋯"): Copy JSONPath, value, node, parent ──
interface NodeMenuInfo {
  path: string
  parentPath: string
  value: unknown
  type: string
  isArrayIndex: boolean
  index?: number
}
const menuState = reactive<{ node: NodeMenuInfo | null; x: number; y: number }>({ node: null, x: 0, y: 0 })
function openNodeMenu(info: NodeMenuInfo, x: number, y: number) {
  menuState.node = info
  menuState.x = x
  menuState.y = y
}
function closeNodeMenu() {
  menuState.node = null
}
// Only the ROOT provides it. Every node used to provide it, which made a nested
// node resolve to its PARENT instead of the root — and only the root renders the
// menu, so "⋯" silently did nothing below the first level. Provides are inherited
// down the tree, so descendants still resolve to this single instance.
if (!props.path) {
  provide('nodeMenu', { open: openNodeMenu, close: closeNodeMenu })
}

const nodeMenu = inject<{ open: (info: NodeMenuInfo, x: number, y: number) => void; close: () => void }>('nodeMenu', null)

// ── Node editing context (provided by JsonEditor; null in read-only views) ──
const editing = inject<ReturnType<typeof useNodeEditing> | null>('nodeEditing', null)
function isBatchSelected(path: string): boolean {
  return editing?.batchSelected.value.has(path) ?? false
}

// ── Value inspector (P1-3/P1-4) ────────────────────────────────
// Only the ROOT provides it. Provides are inherited down the component tree,
// so every descendant resolves to this single instance — providing from every
// node would make nested nodes resolve to their parent instead (and nothing
// would ever render).
const inspectorValue = ref<unknown>(null)
function openInspector(value: unknown) { inspectorValue.value = value }
if (!props.path) {
  provide('valueInspector', { open: openInspector })
}

function typeLabel(v: unknown): string {
  return jsonTypeLabel(v)
}

function buildNodeInfo(entry: { childPath: string; value: unknown; isArrayIndex: boolean; key: string | number }): NodeMenuInfo {
  return {
    path: entry.childPath,
    parentPath: parentPathOf(entry.childPath),
    value: entry.value,
    type: typeLabel(entry.value),
    isArrayIndex: entry.isArrayIndex,
    index: entry.isArrayIndex ? Number(entry.key) : undefined,
    siblingCount: Array.isArray(props.data) ? props.data.length : undefined,
  }
}

function onRowMenu(entry: { childPath: string; value: unknown; isArrayIndex: boolean; key: string | number }, event: MouseEvent) {
  nodeMenu?.open(buildNodeInfo(entry), event.clientX, event.clientY)
}

function onRootMenu(event: MouseEvent) {
  // The root has no ancestor providing the menu, so call its own opener.
  openNodeMenu(
    {
      path: props.path,
      parentPath: parentPathOf(props.path),
      value: props.data,
      type: typeLabel(props.data),
      isArrayIndex: false,
    },
    event.clientX,
    event.clientY,
  )
}

// Root instance: watch expand/collapse/locate/search
if (!props.path) {
  watch(expandAllSignal, () => {
    expanded.value = new Set(getAllExpandablePaths(props.data))
  })
  watch(collapseAllSignal, () => {
    expanded.value = new Set()
  })

  // Locate path: expand ancestors + scroll + flash
  watch(() => locatePath.value, (target) => {
    if (!target) return

    const parts = target.split(/\.|\[|\]/).filter(Boolean)
    const next = new Set(expanded.value)
    let current = ''
    for (let i = 0; i < parts.length - 1; i++) {
      current = current ? `${current}.${parts[i]}` : parts[i]
      next.add(current)
    }
    expanded.value = next

    nextTick(() => {
      if (tryScroll(target)) {
        flashPath.value = target
        setTimeout(() => { flashPath.value = '' }, 2000)
      }
      locatePath.value = ''
    })
  })
}

function getNodeErrors(path: string): FieldError[] {
  return errorMap.value[path] ?? []
}

// Build tooltip lines for a node's errors. For `type` mismatches, append the
// expected vs actual JSON type so users see "期望/实际类型" inline.
function errorTooltipLines(errors: FieldError[], value: unknown) {
  return errors.map((e) => {
    let detail: string | undefined
    if (e.keyword === 'type' && e.params?.type) {
      detail = `${t('schema.expected')}: ${e.params.type} · ${t('schema.actual')}: ${jsonTypeLabel(value)}`
    }
    return { message: e.message, detail }
  })
}

function hasError(path: string): boolean {
  return path in errorMap.value
}

function isMatch(path: string) {
  return search?.isMatch(path) ?? false
}

function isCurrentMatch(path: string) {
  return search?.isCurrentMatch(path) ?? false
}

// Row element refs for scroll-into-view (shared across all tree nodes)
const rowElements = inject<Map<string, HTMLElement>>('treeRowElements', new Map())
provide('treeRowElements', rowElements)

function markRow(path: string, el: HTMLElement | null) {
  if (el) rowElements.set(path, el)
  else rowElements.delete(path)
}

// Best-effort scroll of a path into view. Returns true if the row exists and
// was scrolled into view.
function parentPathOf(path: string): string {
  if (path.endsWith(']')) {
    const i = path.lastIndexOf('[')
    return i > 0 ? path.slice(0, i) : ''
  }
  const i = path.lastIndexOf('.')
  return i > 0 ? path.slice(0, i) : ''
}

function tryScroll(path: string): boolean {
  const el = rowElements.get(path)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    return true
  }
  return false
}

// Root instance: auto-scroll current match into view.
// Retries across several ticks so ancestors auto-expanded by the search have
// time to render the row before we scroll to it.
if (!props.path && search) {
  watch(() => search.currentMatchPath.value, (path) => {
    if (!path) return
    const attempt = (tries: number) => {
      if (tries <= 0) return
      nextTick(() => {
        if (!tryScroll(path)) attempt(tries - 1)
      })
    }
    attempt(5)
  })
}

// ── Image preview state ────────────────────────────────────────
const showPreview = ref(false)
const previewIndex = ref(0)
const previewFiles = ref<PreviewImage[]>([])

const imageUrls = computed(() => {
  const urls: { url: string; alt: string }[] = []
  if (isObject(props.data)) {
    for (const [k, v] of Object.entries(props.data)) {
      if (typeof v === 'string' && isPossibleImageUrl(v)) urls.push({ url: v, alt: k })
    }
  } else if (isArray(props.data)) {
    for (let i = 0; i < props.data.length; i++) {
      const item = props.data[i]
      if (typeof item === 'string' && isPossibleImageUrl(item)) urls.push({ url: item, alt: `[${i}]` })
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

async function openPreview(altKey: string) {
  const sources = imageUrls.value
  const idx = sources.findIndex(s => s.alt === altKey)
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

// ── Helpers ────────────────────────────────────────────────────
function isObject(val: unknown): val is Record<string, unknown> {
  return val !== null && typeof val === 'object' && !Array.isArray(val)
}

function isArray(val: unknown): val is unknown[] {
  return Array.isArray(val)
}

function isExpandable(val: unknown): val is Record<string, unknown> | unknown[] {
  return isObject(val) || isArray(val)
}

function getFullPath(key: string | number) {
  if (props.path) {
    return typeof key === 'number' ? `${props.path}[${key}]` : `${props.path}.${key}`
  }
  return String(key)
}

// Expand state: manual expand OR search-driven auto-expand
function isNodeExpanded(path: string) {
  if (expanded.value.has(path)) return true
  if (search?.searchExpandedPaths.value.has(path)) return true
  return false
}

function toggle(path: string) {
  const next = new Set(expanded.value)
  if (next.has(path)) {
    next.delete(path)
  } else {
    next.add(path)
  }
  expanded.value = next
}

function isSelected(path: string) {
  return selectedPath.value === path
}

function selectAndCopy(path: string) {
  selectedPath.value = path
  copyToClipboard(path)
  onNodeInteraction(path, 'click')
}

function isSensitive(path: string): boolean {
  return maskedFields.value.has(path)
}

function formatValue(val: unknown, path?: string): string {
  if (path && isSensitive(path)) {
    if (typeof val === 'string') return '"****"'
    if (typeof val === 'number') return '0'
    if (typeof val === 'boolean') return 'false'
    return '****'
  }
  if (val === null) return 'null'
  if (val === undefined) return 'undefined'
  if (typeof val === 'string') return `"${val}"`
  return String(val)
}

// Resolve a CSS color string for inline swatch rendering. Quoted values carry
// no meaning here, so surrounding quotes are stripped before detection.
// Returns null when the value is not a CSS color.
function colorStyleOf(val: unknown): string | null {
  if (typeof val !== 'string') return null
  const s = val.startsWith('"') && val.endsWith('"') ? val.slice(1, -1) : val
  return isColorValue(s) ? s : null
}

function valueColorClass(val: unknown): string {
  if (val === null || val === undefined) return 'text-surface-400 italic'
  switch (typeof val) {
    case 'string': return 'text-emerald-600 dark:text-emerald-400'
    case 'number': return 'text-blue-600 dark:text-blue-400'
    case 'boolean': return 'text-orange-600 dark:text-orange-400'
    default: return 'text-surface-700 dark:text-surface-300'
  }
}

</script>
