<template>
  <div class="font-mono text-xs">
    <!-- Object -->
    <template v-if="isObject(data)">
      <div v-for="(value, key) in data" :key="key">
        <div
          :ref="(el) => markRow(getFullPath(key), el as HTMLElement)"
          :class="[
            'grid rounded px-1 cursor-pointer group transition-colors',
            flashPath === getFullPath(key)
              ? 'bg-orange-200 dark:bg-orange-700/50 ring-2 ring-orange-400 dark:ring-orange-500 animate-pulse'
              : isCurrentMatch(getFullPath(key))
                ? 'bg-amber-200 dark:bg-amber-700/60 ring-1 ring-amber-400 dark:ring-amber-500'
                : isMatch(getFullPath(key))
                  ? 'bg-yellow-100 dark:bg-yellow-800/40'
                  : isSelected(getFullPath(key))
                    ? 'bg-primary-50 dark:bg-primary-900/30 border-l-2 border-primary-500 dark:border-primary-400'
                    : 'hover:bg-surface-100 dark:hover:bg-surface-700',
          ]"
          style="grid-template-columns: 2rem 1fr"
          @click="isExpandable(value) ? toggle(key) : selectAndCopy(getFullPath(key))"
        >
          <!-- Line number -->
          <span class="text-right pr-2 pt-px text-surface-400 dark:text-surface-500 select-none leading-5">{{ lineMap[getFullPath(key)] ?? '' }}</span>

          <!-- Content -->
          <div class="flex items-start gap-1 min-w-0 leading-5">
            <button
              v-if="isExpandable(value)"
              @click.stop="toggle(key)"
              class="w-4 h-4 flex items-center justify-center text-surface-400 hover:text-surface-600 shrink-0"
            >
              <Icon :name="isNodeExpanded(key) ? 'lucide:chevron-down' : 'lucide:chevron-right'" class="w-3 h-3" />
            </button>
            <span v-else class="w-4 shrink-0"></span>

            <span class="text-purple-600 dark:text-purple-400">"{{ key }}"</span>
            <span class="text-surface-400">:</span>

            <span v-if="!isExpandable(value)" class="flex items-center gap-1.5 min-w-0 flex-wrap">
              <span
                v-if="isColorValue(value)"
                class="inline-block w-3.5 h-3.5 rounded border border-surface-300 dark:border-surface-600 shrink-0"
                :style="{ backgroundColor: getColorStyle(value) || undefined }"
              />
              <span :class="valueColorClass(value)">{{ formatValue(value) }}</span>
            </span>
            <span v-else-if="isArray(value)" class="text-surface-400">[{{ value.length }}]</span>
            <span v-else class="text-surface-400">{...}</span>

            <!-- Error indicator -->
            <span
              v-if="hasError(getFullPath(key))"
              class="relative group/error shrink-0 ml-1"
            >
              <span class="inline-block w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span class="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 rounded bg-red-600 text-white text-[10px] whitespace-nowrap opacity-0 group-hover/error:opacity-100 transition-opacity pointer-events-none z-50">
                {{ getNodeErrors(getFullPath(key))[0]?.message }}
              </span>
            </span>
          </div>
        </div>

        <!-- Image preview -->
        <div v-if="isPossibleImageUrl(value)" class="grid" style="grid-template-columns: 2rem 1fr">
          <span />
          <img
            :src="value"
            :alt="String(key)"
            class="max-w-[160px] max-h-[100px] rounded-lg border border-surface-200 dark:border-surface-700 object-contain mt-1 mb-1 cursor-zoom-in"
            @click.stop="openPreview(String(key))"
            @error="(($event.target as HTMLImageElement).parentElement as HTMLElement).style.display = 'none'"
          />
        </div>

        <!-- Expanded children -->
        <div v-if="isNodeExpanded(key) && isExpandable(value)" class="ml-4 border-l border-surface-200 dark:border-surface-700 pl-0">
          <JsonTreeNode :data="value" :path="getFullPath(key)" />
        </div>
      </div>
    </template>

    <!-- Array -->
    <template v-else-if="isArray(data)">
      <div v-for="(item, index) in data" :key="index">
        <div
          :ref="(el) => markRow(getFullPath(index), el as HTMLElement)"
          :class="[
            'grid rounded px-1 cursor-pointer transition-colors',
            flashPath === getFullPath(index)
              ? 'bg-orange-200 dark:bg-orange-700/50 ring-2 ring-orange-400 dark:ring-orange-500 animate-pulse'
              : isCurrentMatch(getFullPath(index))
                ? 'bg-amber-200 dark:bg-amber-700/60 ring-1 ring-amber-400 dark:ring-amber-500'
                : isMatch(getFullPath(index))
                  ? 'bg-yellow-100 dark:bg-yellow-800/40'
                  : isSelected(getFullPath(index))
                    ? 'bg-primary-50 dark:bg-primary-900/30 border-l-2 border-primary-500 dark:border-primary-400'
                    : 'hover:bg-surface-100 dark:hover:bg-surface-700',
          ]"
          style="grid-template-columns: 2rem 1fr"
          @click="isExpandable(item) ? toggle(index) : selectAndCopy(getFullPath(index))"
        >
          <!-- Line number -->
          <span class="text-right pr-2 pt-px text-surface-400 dark:text-surface-500 select-none leading-5">{{ lineMap[getFullPath(index)] ?? '' }}</span>

          <!-- Content -->
          <div class="flex items-start gap-1 min-w-0 leading-5">
            <button
              v-if="isExpandable(item)"
              @click.stop="toggle(index)"
              class="w-4 h-4 flex items-center justify-center text-surface-400 hover:text-surface-600 shrink-0"
            >
              <Icon :name="isNodeExpanded(index) ? 'lucide:chevron-down' : 'lucide:chevron-right'" class="w-3 h-3" />
            </button>
            <span v-else class="w-4 shrink-0"></span>

            <span class="text-surface-400">[{{ index }}]</span>

            <span v-if="!isExpandable(item)" class="flex items-center gap-1.5 min-w-0 flex-wrap ml-1">
              <span
                v-if="isColorValue(item)"
                class="inline-block w-3.5 h-3.5 rounded border border-surface-300 dark:border-surface-600 shrink-0"
                :style="{ backgroundColor: getColorStyle(item) || undefined }"
              />
              <span :class="valueColorClass(item)">{{ formatValue(item) }}</span>
            </span>
            <span v-else-if="isArray(item)" class="text-surface-400 ml-1">[{{ item.length }}]</span>
            <span v-else class="text-surface-400 ml-1">{...}</span>

            <!-- Error indicator -->
            <span
              v-if="hasError(getFullPath(index))"
              class="relative group/error shrink-0 ml-1"
            >
              <span class="inline-block w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span class="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 rounded bg-red-600 text-white text-[10px] whitespace-nowrap opacity-0 group-hover/error:opacity-100 transition-opacity pointer-events-none z-50">
                {{ getNodeErrors(getFullPath(index))[0]?.message }}
              </span>
            </span>
          </div>
        </div>

        <!-- Image preview -->
        <div v-if="isPossibleImageUrl(item)" class="grid" style="grid-template-columns: 2rem 1fr">
          <span />
          <img
            :src="item"
            :alt="`[${index}]`"
            class="max-w-[160px] max-h-[100px] rounded-lg border border-surface-200 dark:border-surface-700 object-contain mt-1 mb-1 cursor-zoom-in"
            @click.stop="openPreview(`[${index}]`)"
            @error="(($event.target as HTMLImageElement).parentElement as HTMLElement).style.display = 'none'"
          />
        </div>

        <!-- Expanded children -->
        <div v-if="isNodeExpanded(index) && isExpandable(item)" class="ml-4 border-l border-surface-200 dark:border-surface-700 pl-0">
          <JsonTreeNode :data="item" :path="getFullPath(index)" />
        </div>
      </div>
    </template>

    <!-- Primitive (root-level) -->
    <template v-else>
      <div
        :ref="(el) => markRow(props.path, el as HTMLElement)"
        :class="[
          'grid rounded px-1 transition-colors',
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
        style="grid-template-columns: 2rem 1fr"
      >
        <span class="text-right pr-2 pt-px text-surface-400 dark:text-surface-500 select-none leading-5">{{ lineMap[props.path] ?? 1 }}</span>
        <div class="flex items-start gap-1 leading-5">
          <span class="w-4 shrink-0"></span>
          <span class="flex items-center gap-1.5">
            <span
              v-if="isColorValue(data)"
              class="inline-block w-3.5 h-3.5 rounded border border-surface-300 dark:border-surface-600 shrink-0"
              :style="{ backgroundColor: getColorStyle(data) || undefined }"
            />
            <span :class="valueColorClass(data)">{{ formatValue(data) }}</span>
          </span>

          <!-- Error indicator -->
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
  </div>
</template>

<script setup lang="ts">
import type { PreviewImage } from '~/composables/useImagePreview'
import type { useTreeSearch } from '~/composables/useTreeSearch'
import type { FieldError } from '~/types/jsonErrors'

const props = defineProps<{
  data: unknown
  path: string
}>()

// ── Shared expanded state (inject + re-provide) ────────────────
const expanded = inject<Ref<Set<string>>>('richExpanded', ref(new Set()))
provide('richExpanded', expanded)

// ── Selected path ──────────────────────────────────────────────
const selectedPath = inject<Ref<string>>('richSelectedPath', ref(''))
provide('richSelectedPath', selectedPath)

// ── Line number map ────────────────────────────────────────────
const lineMap = inject<Ref<Record<string, number>>>('richLineMap', ref({}))
provide('richLineMap', lineMap)

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

// ── Locate path signal (click error → scroll to node) ─────────
const locatePath = inject<Ref<string>>('locatePath', ref(''))
provide('locatePath', locatePath)
const flashPath = ref('')

// ── Search state (injected from JsonTreeViewer) ────────────────
const search = inject<ReturnType<typeof useTreeSearch> | null>('treeSearch', null)

// Root instance: watch expand/collapse signals
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

    // Expand all ancestors of the target path
    // e.g. for "users.2.email" → expand "users", "users.2"
    const parts = target.split(/\.|\[|\]/).filter(Boolean)
    const next = new Set(expanded.value)
    let current = ''
    for (let i = 0; i < parts.length - 1; i++) {
      current = current ? `${current}.${parts[i]}` : parts[i]
      next.add(current)
    }
    expanded.value = next

    // Scroll into view after DOM updates
    nextTick(() => {
      const el = rowElements.get(target)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
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

// Root instance: auto-scroll current match into view
if (!props.path && search) {
  watch(() => search.currentMatchPath.value, (path) => {
    if (path) {
      nextTick(() => {
        const el = rowElements.get(path)
        el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      })
    }
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

// ── Helpers (must be before watch block) ────────────────────────
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
function isNodeExpanded(key: string | number) {
  const fullPath = getFullPath(key)
  if (expanded.value.has(fullPath)) return true
  if (search?.searchExpandedPaths.value.has(fullPath)) return true
  return false
}

function toggle(key: string | number) {
  const fullPath = getFullPath(key)
  const next = new Set(expanded.value)
  if (next.has(fullPath)) {
    next.delete(fullPath)
  } else {
    next.add(fullPath)
  }
  expanded.value = next
}

function isSelected(path: string) {
  return selectedPath.value === path
}

function selectAndCopy(path: string) {
  selectedPath.value = path
  navigator.clipboard.writeText(path).catch(() => {})
}

function formatValue(val: unknown): string {
  if (val === null) return 'null'
  if (val === undefined) return 'undefined'
  if (typeof val === 'string') return `"${val}"`
  return String(val)
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

// Root instance: compute line map
if (!props.path) {
  watch(
    () => {
      // Reactive deps: data, expanded set, and search-expanded paths
      const se = search?.searchExpandedPaths.value
      return [props.data, [...expanded.value].sort().join(), se ? [...se].sort().join() : '']
    },
    () => {
      const map: Record<string, number> = {}
      let counter = 1

      const walkChildren = (val: unknown, parentPath: string) => {
        if (isObject(val)) {
          for (const key of Object.keys(val)) {
            const childPath = parentPath ? `${parentPath}.${key}` : String(key)
            map[childPath] = counter++
            const child = (val as Record<string, unknown>)[key]
            if (isExpandable(child) && isNodeExpanded(key)) {
              walkChildren(child, childPath)
            }
          }
        } else if (isArray(val)) {
          val.forEach((item, i) => {
            const childPath = `${parentPath}[${i}]`
            map[childPath] = counter++
            if (isExpandable(item) && isNodeExpanded(i)) {
              walkChildren(item, childPath)
            }
          })
        }
      }

      if (isObject(props.data) || isArray(props.data)) {
        walkChildren(props.data, '')
      } else {
        map[''] = counter
      }
      lineMap.value = map
    },
    { immediate: true },
  )
}
</script>
