<template>
  <div class="font-mono text-sm">
    <!-- Children list (lazy / object / array unified) -->
    <template v-if="totalChildren > 0">
      <!-- Virtualized viewport for large lists -->
      <div
        v-if="useVirtual"
        :ref="(el) => registerContainer(props.path, el as HTMLElement | null)"
        class="relative"
        :class="treeViewport ? '' : 'overflow-auto'"
        :style="treeViewport ? undefined : { maxHeight: '480px' }"
      >
        <div :style="{ height: totalHeight + 'px', position: 'relative' }">
          <div
            v-for="ve in virtualEntries"
            :key="ve.entry.childPath"
            :ref="(el) => rowRef(ve.entry.childPath, ve.vi.index, el as HTMLElement | null)"
            class="absolute left-0 right-0"
            :style="{ transform: `translateY(${ve.vi.offset}px)` }"
          >
            <!-- Row -->
            <div
              :class="[
                'flex rounded px-1 cursor-pointer group transition-colors',
                flashPath === ve.entry.childPath
                  ? 'bg-orange-200 dark:bg-orange-700/50 ring-2 ring-orange-400 dark:ring-orange-500 animate-pulse'
                  : isCurrentMatch(ve.entry.childPath)
                    ? 'bg-amber-200 dark:bg-amber-700/60 ring-1 ring-amber-400 dark:ring-amber-500'
                    : isMatch(ve.entry.childPath)
                      ? 'bg-yellow-100 dark:bg-yellow-800/40'
                      : isSelected(ve.entry.childPath)
                        ? 'bg-primary-50 dark:bg-primary-900/30 border-l-2 border-primary-500 dark:border-primary-400'
                        : 'hover:bg-surface-100 dark:hover:bg-surface-700',
              ]"
              @click="ve.entry.expandable ? toggle(ve.entry.childPath) : selectAndCopy(ve.entry.childPath)"
              @mouseenter="!ve.entry.expandable && onNodeInteraction(ve.entry.childPath, 'hover')"
              @mouseleave="onNodeInteraction('', 'hover')"
              @contextmenu.prevent="onRowMenu(ve.entry, $event)"
            >
              <div class="flex items-start gap-1 min-w-0 leading-[1.5] flex-1">
                <button
                  v-if="ve.entry.expandable"
                  @click.stop="toggle(ve.entry.childPath)"
                  class="w-4 h-4 flex items-center justify-center text-surface-400 hover:text-surface-600 shrink-0"
                >
                  <Icon :name="isNodeExpanded(ve.entry.childPath) ? 'lucide:chevron-down' : 'lucide:chevron-right'" class="w-3 h-3" />
                </button>
                <span v-else class="w-4 shrink-0"></span>

                <span v-if="ve.entry.isLazyChild && ve.entry.isArrayIndex" class="text-blue-500 dark:text-blue-400">[{{ ve.entry.key }}]</span>
                <span v-else-if="ve.entry.isLazyChild" class="text-purple-600 dark:text-purple-400">"{{ ve.entry.key }}"</span>
                <span v-else-if="ve.entry.isArrayIndex" class="text-surface-400">[{{ ve.entry.key }}]</span>
                <span v-else class="text-purple-600 dark:text-purple-400">"{{ ve.entry.key }}"</span>
                <span class="text-surface-400">:</span>

                <span v-if="!ve.entry.expandable" class="flex items-center gap-1.5 min-w-0 flex-wrap">
                <span
                  v-if="colorStyleOf(ve.entry.value)"
                  class="inline-block w-3.5 h-3.5 rounded border border-surface-300 dark:border-surface-600 shrink-0"
                  :style="{ backgroundColor: colorStyleOf(ve.entry.value) || undefined }"
                />
                <span :class="ve.entry.isLazyChild ? lazyTypeColorClass(lazyIndex?.get(ve.entry.childPath)?.type || 'null') : valueColorClass(ve.entry.value)">{{ ve.entry.isLazyChild ? (ve.entry.preview || 'null') : formatValue(ve.entry.value, ve.entry.childPath) }}</span>
              </span>
                <span v-else class="text-surface-400">
                  {{ ve.entry.isLazyChild
                    ? (lazyIndex?.get(ve.entry.childPath)?.type === 'array' ? `[${lazyIndex?.get(ve.entry.childPath)?.childCount || 0}]` : '{…}')
                    : (isArray(ve.entry.value) ? `[${ve.entry.value.length}]` : '{…}') }}
                </span>

              <span class="ml-1.5 text-[10px] text-surface-400 dark:text-surface-500 select-none">{{ typeLabel(ve.entry.value) }}</span>
              <button
                v-if="!ve.entry.isLazyChild && isArray(ve.entry.value)"
                @click.stop="showArrayAsTable(ve.entry.childPath)"
                class="opacity-0 group-hover:opacity-100 ml-0.5 text-surface-400 hover:text-surface-600 dark:hover:text-surface-300"
                :title="$t('largeViewer.table.viewAsTable')"
              >
                <Icon name="lucide:table" class="w-3.5 h-3.5" />
              </button>
              <button
                @click.stop="onRowMenu(ve.entry, $event)"
                class="opacity-0 group-hover:opacity-100 ml-0.5 text-surface-400 hover:text-surface-600 dark:hover:text-surface-300"
                :title="$t('largeViewer.copyJsonPath')"
              >
                <Icon name="lucide:more-vertical" class="w-3.5 h-3.5" />
              </button>
              <span
                v-if="hasError(ve.entry.childPath)"
                class="relative group/error shrink-0 ml-1"
              >
                  <span class="inline-block w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span class="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 rounded bg-red-600 text-white text-[10px] whitespace-nowrap opacity-0 group-hover/error:opacity-100 transition-opacity pointer-events-none z-50">
                    {{ getNodeErrors(ve.entry.childPath)[0]?.message }}
                  </span>
                </span>
              </div>
            </div>

            <!-- Expanded children -->
            <div v-if="ve.entry.expandable && isNodeExpanded(ve.entry.childPath)" class="ml-4 border-l border-surface-200 dark:border-surface-700 pl-0">
              <JsonTreeNode :data="ve.entry.isLazyChild ? null : ve.entry.value" :path="ve.entry.childPath" :depth="depth + 1" :lazy-index="lazyIndex" />
            </div>

            <!-- Image preview (non-lazy only) -->
            <div v-if="!ve.entry.isLazyChild && isPossibleImageUrl(ve.entry.value) && !isSensitive(ve.entry.childPath)" class="flex">
              <span class="w-8 shrink-0"></span>
              <img
                :src="ve.entry.value"
                :alt="String(ve.entry.key)"
                class="max-w-[160px] max-h-[100px] rounded-lg border border-surface-200 dark:border-surface-700 object-contain mt-1 mb-1 cursor-zoom-in"
                @click.stop="openPreview(String(ve.entry.key))"
                @error="(($event.target as HTMLImageElement).parentElement as HTMLElement).style.display = 'none'"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Plain list for small lists (keeps element-based locate/scroll working) -->
      <template v-else>
        <div v-for="entry in childrenEntries" :key="entry.childPath">
          <div
            :ref="(el) => rowRef(entry.childPath, null, el as HTMLElement | null)"
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

              <span v-if="entry.isLazyChild && entry.isArrayIndex" class="text-blue-500 dark:text-blue-400">[{{ entry.key }}]</span>
              <span v-else-if="entry.isLazyChild" class="text-purple-600 dark:text-purple-400">"{{ entry.key }}"</span>
              <span v-else-if="entry.isArrayIndex" class="text-surface-400">[{{ entry.key }}]</span>
              <span v-else class="text-purple-600 dark:text-purple-400">"{{ entry.key }}"</span>
              <span class="text-surface-400">:</span>

              <span v-if="!entry.expandable" class="flex items-center gap-1.5 min-w-0 flex-wrap">
                <span
                  v-if="colorStyleOf(entry.value)"
                  class="inline-block w-3.5 h-3.5 rounded border border-surface-300 dark:border-surface-600 shrink-0"
                  :style="{ backgroundColor: colorStyleOf(entry.value) || undefined }"
                />
                <span :class="entry.isLazyChild ? lazyTypeColorClass(lazyIndex?.get(entry.childPath)?.type || 'null') : valueColorClass(entry.value)">{{ entry.isLazyChild ? (entry.preview || 'null') : formatValue(entry.value, entry.childPath) }}</span>
              </span>
              <span v-else class="text-surface-400">
                {{ entry.isLazyChild
                  ? (lazyIndex?.get(entry.childPath)?.type === 'array' ? `[${lazyIndex?.get(entry.childPath)?.childCount || 0}]` : '{…}')
                  : (isArray(entry.value) ? `[${entry.value.length}]` : '{…}') }}
              </span>

              <span class="ml-1.5 text-[10px] text-surface-400 dark:text-surface-500 select-none">{{ typeLabel(entry.value) }}</span>
              <button
                v-if="!entry.isLazyChild && isArray(entry.value)"
                @click.stop="showArrayAsTable(entry.childPath)"
                class="opacity-0 group-hover:opacity-100 ml-0.5 text-surface-400 hover:text-surface-600 dark:hover:text-surface-300"
                :title="$t('largeViewer.table.viewAsTable')"
              >
                <Icon name="lucide:table" class="w-3.5 h-3.5" />
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
                <span class="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 rounded bg-red-600 text-white text-[10px] whitespace-nowrap opacity-0 group-hover/error:opacity-100 transition-opacity pointer-events-none z-50">
                  {{ getNodeErrors(entry.childPath)[0]?.message }}
                </span>
              </span>
            </div>
          </div>

          <div v-if="entry.expandable && isNodeExpanded(entry.childPath)" class="ml-4 border-l border-surface-200 dark:border-surface-700 pl-0">
            <JsonTreeNode :data="entry.isLazyChild ? null : entry.value" :path="entry.childPath" :depth="depth + 1" :lazy-index="lazyIndex" />
          </div>

          <div v-if="!entry.isLazyChild && isPossibleImageUrl(entry.value) && !isSensitive(entry.childPath)" class="flex">
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
            <span class="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 rounded bg-red-600 text-white text-[10px] whitespace-nowrap opacity-0 group-hover/error:opacity-100 transition-opacity pointer-events-none z-50">
              {{ getNodeErrors(props.path)[0]?.message }}
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
  </div>
</template>

<script setup lang="ts">
import { useVirtualList } from '~/composables/useVirtualList'
import type { PreviewImage } from '~/composables/useImagePreview'
import type { useTreeSearch } from '~/composables/useTreeSearch'
import type { FieldError } from '~/types/jsonErrors'
import type { LazyNode } from '~/workers/jsonStream.worker'
import { toJsonPath, jsonTypeLabel } from '~/utils/jsonPath'
import { isColorValue } from '~/composables/useSmartJsonValue'

const props = withDefaults(defineProps<{
  data: unknown
  path: string
  depth?: number
  lazyIndex?: Map<string, LazyNode> | null
}>(), {
  depth: 0,
  lazyIndex: null,
})

// ── Threshold above which a sibling list is virtualized ──
const VIRTUAL_THRESHOLD = 200

// ── Lazy mode support ──────────────────────────────────────
const isLazy = computed(() => props.lazyIndex !== null && props.lazyIndex!.size > 0)
const lazyNode = computed(() => props.lazyIndex?.get(props.path))

const totalChildren = computed(() => {
  if (isLazy.value && lazyNode.value) {
    return lazyNode.value.childCount
  }
  if (isObject(props.data)) return Object.keys(props.data).length
  if (isArray(props.data)) return (props.data as unknown[]).length
  return 0
})

// ── Unified children entries (works for both lazy and normal mode) ──
interface ChildEntry {
  key: string | number
  value: unknown
  expandable: boolean
  preview?: string
  childPath: string
  isLazyChild: boolean
  isArrayIndex: boolean
}

const childrenEntries = computed<ChildEntry[]>(() => {
  if (isLazy.value && lazyNode.value && props.lazyIndex) {
    // Lazy mode: build entries from lazy index
    return lazyNode.value.children.map((childPath) => {
      const node = props.lazyIndex!.get(childPath)
      if (!node) return null
      const expandable = node.type === 'object' || node.type === 'array'
      return {
        key: node.key,
        value: expandable ? null : node.preview,
        expandable,
        preview: node.preview,
        childPath,
        isLazyChild: true,
        isArrayIndex: node.type === 'array',
      }
    }).filter((e): e is ChildEntry => e !== null)
  }

  // Normal mode: build entries from data
  if (isObject(props.data)) {
    return Object.entries(props.data).map(([key, value]) => ({
      key,
      value,
      expandable: isExpandable(value),
      childPath: getFullPath(key),
      isLazyChild: false,
      isArrayIndex: false,
    }))
  }
  if (isArray(props.data)) {
    return (props.data as unknown[]).map((value, index) => ({
      key: index,
      value,
      expandable: isExpandable(value),
      childPath: getFullPath(index),
      isLazyChild: false,
      isArrayIndex: true,
    }))
  }
  return []
})

const useVirtual = computed(() => totalChildren.value > VIRTUAL_THRESHOLD)

// Cache Object.entries for object nodes (used by buildEntry / indexOfChildPath
// in virtual mode). Built once per node mount; only matters for object nodes.
const objectEntriesCache = computed(() =>
  isObject(props.data) ? Object.entries(props.data as Record<string, unknown>) : [],
)

/**
 * Build a single child entry by index WITHOUT materializing the whole sibling
 * list. For huge arrays/objects this avoids allocating millions of entry objects
 * at once (the old `childrenEntries` did `.map` over the entire list), which is
 * what previously froze / OOM'd the tab when a giant list got expanded.
 */
function buildEntry(index: number): ChildEntry | null {
  if (isLazy.value && lazyNode.value && props.lazyIndex) {
    const childPath = lazyNode.value.children[index]
    if (childPath === undefined) return null
    const node = props.lazyIndex.get(childPath)
    if (!node) return null
    const expandable = node.type === 'object' || node.type === 'array'
    return {
      key: node.key,
      value: expandable ? null : node.preview,
      expandable,
      preview: node.preview,
      childPath,
      isLazyChild: true,
      isArrayIndex: node.type === 'array',
    }
  }
  if (isArray(props.data)) {
    const value = (props.data as unknown[])[index]
    return {
      key: index,
      value,
      expandable: isExpandable(value),
      childPath: getFullPath(index),
      isLazyChild: false,
      isArrayIndex: true,
    }
  }
  if (isObject(props.data)) {
    const kv = objectEntriesCache.value[index]
    if (!kv) return null
    const [key, value] = kv
    return {
      key,
      value,
      expandable: isExpandable(value),
      childPath: getFullPath(key),
      isLazyChild: false,
      isArrayIndex: false,
    }
  }
  return null
}

// ── Virtual scrolling (only active for large sibling lists) ──
const listRef = ref<HTMLElement | null>(null)

// The panel that actually scrolls. When it is available the list windows against
// it instead of becoming a scroll container itself, so the tree keeps exactly one
// scrollbar no matter how many nested lists are expanded.
const treeViewport = inject<Ref<HTMLElement | null> | null>('treeViewport', null)

function listOffsetTop(): number {
  const vp = treeViewport?.value
  const el = listRef.value
  if (!vp || !el) return 0
  return el.getBoundingClientRect().top - vp.getBoundingClientRect().top + vp.scrollTop
}

const { virtualItems, totalHeight, measure, scrollToIndex } = useVirtualList(listRef, {
  itemCount: () => totalChildren.value,
  estimateHeight: 28,
  overscan: 12,
  viewportRef: treeViewport ?? undefined,
  offsetTop: () => listOffsetTop(),
})

// Bridge virtualItems → entries for the template (windowed, no full build)
const virtualEntries = computed<{ entry: ChildEntry; vi: { index: number; offset: number } }[]>(() => {
  const result: { entry: ChildEntry; vi: { index: number; offset: number } }[] = []
  for (const vi of virtualItems.value) {
    const entry = buildEntry(vi.index)
    if (entry) result.push({ entry, vi })
  }
  return result
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

// Registry of virtualized child lists so locate/search can scroll them into view.
const childScrollers = inject<Map<string, (childPath: string) => void>>('childScrollers', null)

// Map a child path → its index within THIS node's sibling list, WITHOUT
// materializing the whole list (the old code used childrenEntries.findIndex,
// which forced a full build and OOM'd on giant arrays).
function indexOfChildPath(childPath: string): number | null {
  if (isLazy.value && lazyNode.value) {
    const idx = lazyNode.value.children.indexOf(childPath)
    return idx >= 0 ? idx : null
  }
  if (isArray(props.data)) {
    const m = /\[(\d+)\]$/.exec(childPath)
    return m ? Number(m[1]) : null
  }
  if (isObject(props.data)) {
    const idx = objectEntriesCache.value.findIndex(([k]) => getFullPath(k) === childPath)
    return idx >= 0 ? idx : null
  }
  return null
}

function registerContainer(path: string, el: HTMLElement | null) {
  // Also bind the list element: the virtualizer needs it to locate the list
  // inside the shared scroll viewport.
  listRef.value = el
  if (!childScrollers) return
  if (el) {
    childScrollers.set(path, (childPath: string) => {
      const idx = indexOfChildPath(childPath)
      if (idx !== null) scrollToIndex(idx)
    })
  } else {
    childScrollers.delete(path)
  }
}

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
provide('nodeMenu', { open: openNodeMenu, close: closeNodeMenu })

const nodeMenu = inject<{ open: (info: NodeMenuInfo, x: number, y: number) => void; close: () => void }>('nodeMenu', null)

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
  }
}

function onRowMenu(entry: { childPath: string; value: unknown; isArrayIndex: boolean; key: string | number }, event: MouseEvent) {
  nodeMenu?.open(buildNodeInfo(entry), event.clientX, event.clientY)
}

function onRootMenu(event: MouseEvent) {
  nodeMenu?.open(
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

// Root instance: provide child-scroller registry + watch expand/collapse/locate/search
if (!props.path) {
  const scrollers = new Map<string, (childPath: string) => void>()
  provide('childScrollers', scrollers)

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
      const result = tryScroll(target)
      if (result === 'pending') {
        nextTick(() => {
          const el = rowElements.get(target)
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' })
            flashPath.value = target
            setTimeout(() => { flashPath.value = '' }, 2000)
          }
          locatePath.value = ''
        })
      } else {
        if (result) {
          flashPath.value = target
          setTimeout(() => { flashPath.value = '' }, 2000)
        }
        locatePath.value = ''
      }
    })
  })
}

function getNodeErrors(path: string): FieldError[] {
  return errorMap.value[path] ?? []
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

function rowRef(path: string, index: number | null, el: HTMLElement | null) {
  markRow(path, el)
  if (index !== null && useVirtual.value) measure(index, el)
}

// Best-effort scroll of a path into view. Returns true if found & scrolled,
// 'pending' if a virtualized parent list was told to scroll it into range,
// or false if it cannot be reached.
function parentPathOf(path: string): string {
  if (path.endsWith(']')) {
    const i = path.lastIndexOf('[')
    return i > 0 ? path.slice(0, i) : ''
  }
  const i = path.lastIndexOf('.')
  return i > 0 ? path.slice(0, i) : ''
}

function tryScroll(path: string): boolean | 'pending' {
  const el = rowElements.get(path)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    return true
  }
  const parent = parentPathOf(path)
  const scroller = childScrollers?.get(parent)
  if (scroller) {
    scroller(path)
    return 'pending'
  }
  return false
}

// Root instance: auto-scroll current match into view.
// Retry across several ticks so ancestors (auto-expanded by the search) and
// any virtualized lists have time to render before we scroll to the node.
if (!props.path && search) {
  watch(() => search.currentMatchPath.value, (path) => {
    if (!path) return
    const attempt = (tries: number) => {
      if (tries <= 0) return
      nextTick(() => {
        const r = tryScroll(path)
        if (r !== true && r !== 'pending') attempt(tries - 1)
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

// Resolve a CSS color string for inline swatch rendering. Strips surrounding
// quotes so both normal-mode raw values ("#ff0000") and lazy-mode previews
// ('"#ff0000"') are detected. Returns null when the value is not a CSS color.
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

function lazyTypeColorClass(type: string): string {
  switch (type) {
    case 'string': return 'text-emerald-600 dark:text-emerald-400'
    case 'number': return 'text-blue-600 dark:text-blue-400'
    case 'boolean': return 'text-orange-600 dark:text-orange-400'
    case 'null': return 'text-surface-400 italic'
    default: return 'text-surface-700 dark:text-surface-300'
  }
}
</script>
