<template>
  <div
    ref="containerRef"
    class="relative h-full overflow-auto bg-surface-50 dark:bg-surface-900 text-surface-800 dark:text-surface-200 font-mono text-[13px] leading-[20px]"
    @scroll.passive="onScroll"
  >
    <div class="relative" :style="{ height: totalHeight + 'px' }">
      <div
        v-for="row in visible"
        :key="row.i"
        class="absolute left-0 right-0 flex hover:bg-surface-100/60 dark:hover:bg-surface-800/60"
        :class="[
          row.isCurrent ? 'bg-primary-50/70 dark:bg-primary-900/30' : '',
        ]"
        :style="{ top: row.top + 'px', height: row.height + 'px' }"
        @click="emit('lineClick', row.i + 1)"
      >
        <!-- line-number gutter -->
        <div
          class="flex-none w-14 shrink-0 select-none border-r border-surface-200 dark:border-surface-700 px-2 text-right text-surface-400 dark:text-surface-500"
          :class="row.isCurrent ? 'text-primary-600 dark:text-primary-400' : ''"
        >
          {{ row.i + 1 }}
        </div>

        <!-- content -->
        <div
          class="min-w-0 flex-1 overflow-hidden px-3"
          :class="props.wrap || row.expanded ? 'whitespace-pre-wrap break-words' : 'whitespace-pre'"
        >
          <template v-if="row.isMatch && matchQuery">
            <span>{{ row.matchBefore }}</span><mark class="bg-amber-300 text-surface-900 dark:bg-amber-400 rounded-sm">{{ row.matchMid }}</mark><span>{{ row.matchAfter }}</span>
          </template>
          <template v-else>
            <span>{{ row.display }}</span>
          </template>

          <button
            v-if="row.clipped"
            type="button"
            class="ml-2 align-top rounded bg-surface-200 px-1.5 py-0.5 text-[11px] text-surface-600 hover:bg-surface-300 dark:bg-surface-700 dark:text-surface-300 dark:hover:bg-surface-600"
            @click.stop="toggleExpand(row.i)"
          >
            {{ t('largeViewer.lineClipped') }} ({{ row.fullLen - maxLineChars }})
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { SearchTextHit } from '~/utils/textSearch'

const props = withDefaults(defineProps<{
  text: string
  lineOffsets: Uint32Array | null
  currentLine?: number
  activeMatch?: SearchTextHit | null
  matchQuery?: string
  wrap?: boolean
  maxLineChars?: number
}>(), {
  currentLine: 0,
  activeMatch: null,
  matchQuery: '',
  wrap: false,
  maxLineChars: 2000,
})

const emit = defineEmits<{
  'lineClick': [line: number]
  'update:wrap': [value: boolean]
}>()

const { t } = useI18n()

const LINE_H = 20
const containerRef = ref<HTMLDivElement>()
const scrollTop = ref(0)
const viewportH = ref(0)
const charWidth = ref(7.8)
const expanded = ref(new Set<number>())

// Per-line heights (px) and their prefix sums, recomputed only when the input,
// wrap mode, expansion or width changes — never on scroll.
const heights = shallowRef<number[]>([])
const cumTop = shallowRef<number[]>([0])

const total = computed(() => props.lineOffsets?.length ?? 0)

const charsPerLine = computed(() => {
  const w = (containerRef.value?.clientWidth ?? 800) - 64
  return Math.max(10, Math.floor(w / charWidth.value))
})

function lineStart(i: number): number {
  return props.lineOffsets ? props.lineOffsets[i] : 0
}
function lineEndStrict(i: number): number {
  const off = props.lineOffsets
  if (!off) return 0
  let end = i + 1 < off.length ? off[i + 1] : props.text.length
  const ch = props.text[end - 1]
  if (ch === '\n') end--
  if (props.text[end - 1] === '\r') end--
  return end
}

function rawLine(i: number): string {
  return props.text.slice(lineStart(i), lineEndStrict(i))
}

/** Length of a line WITHOUT allocating a substring — recompute() must stay O(n)
 *  with no per-line string slicing, otherwise large files freeze the main thread
 *  (hundreds of thousands of `slice` calls block painting). */
function rawLineLen(i: number): number {
  return lineEndStrict(i) - lineStart(i)
}

function heightAt(i: number): number {
  const isExpanded = expanded.value.has(i)
  if (props.wrap || isExpanded) {
    const len = isExpanded ? rawLineLen(i) : Math.min(rawLineLen(i), props.maxLineChars)
    return Math.max(1, Math.ceil(len / charsPerLine.value)) * LINE_H
  }
  return LINE_H
}

function recompute() {
  const n = total.value
  const h = new Array<number>(n)
  const c = new Array<number>(n + 1)
  c[0] = 0
  for (let i = 0; i < n; i++) {
    h[i] = heightAt(i)
    c[i + 1] = c[i] + h[i]
  }
  heights.value = h
  cumTop.value = c
}

const totalHeight = computed(() => cumTop.value[total.value] ?? 0)

const OVERSCAN = 6
const visible = computed(() => {
  if (!total.value) return []
  const top = scrollTop.value
  const bottom = top + viewportH.value
  // first line whose top >= top
  let lo = 0
  let hi = total.value - 1
  while (lo < hi) {
    const mid = (lo + hi) >> 1
    if (cumTop.value[mid] < top) lo = mid + 1
    else hi = mid
  }
  let start = Math.max(0, lo - OVERSCAN)
  // first line whose top >= bottom
  lo = start
  hi = total.value - 1
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1
    if (cumTop.value[mid] <= bottom) lo = mid
    else hi = mid - 1
  }
  let end = Math.min(total.value - 1, lo + OVERSCAN)

  const rows = []
  for (let i = start; i <= end; i++) {
    const full = rawLine(i)
    const isExpanded = expanded.value.has(i)
    const clipped = !isExpanded && full.length > props.maxLineChars
    const display = isExpanded ? full : full.slice(0, props.maxLineChars)
    const isCurrent = props.currentLine === i + 1
    const isMatch = !!props.activeMatch && props.activeMatch.line === i + 1 && !!props.matchQuery
    let matchBefore = ''
    let matchMid = ''
    let matchAfter = ''
    if (isMatch && props.activeMatch && props.matchQuery) {
      const col0 = Math.max(0, props.activeMatch.column - 1)
      const len = props.matchQuery.length
      const atLine = display.slice(col0, col0 + len)
      // Only highlight inline when the line actually contains the query at this
      // column. For path scope the offset points at the value/container, not at
      // the path text, so we skip the inline mark and keep just the row accent.
      if (atLine.toLowerCase() === props.matchQuery.toLowerCase()) {
        matchBefore = display.slice(0, col0)
        matchMid = atLine
        matchAfter = display.slice(col0 + len)
      }
    }
    rows.push({
      i,
      top: cumTop.value[i],
      height: heights.value[i] ?? LINE_H,
      display,
      fullLen: full.length,
      clipped,
      expanded: isExpanded,
      isCurrent,
      isMatch,
      matchBefore,
      matchMid,
      matchAfter,
    })
  }
  return rows
})

function toggleExpand(i: number) {
  const s = new Set(expanded.value)
  if (s.has(i)) s.delete(i)
  else s.add(i)
  expanded.value = s
  recompute()
}

function onScroll() {
  if (!containerRef.value) return
  scrollTop.value = containerRef.value.scrollTop
}

function scrollToLine(line: number) {
  if (!containerRef.value || line < 1 || line > total.value) return
  const target = cumTop.value[line - 1] ?? 0
  const vh = viewportH.value || containerRef.value.clientHeight
  containerRef.value.scrollTop = Math.max(0, target - vh * 0.3)
}

function measure() {
  if (!containerRef.value) return
  // Clamp to the viewport: if layout ever leaves the container unconstrained,
  // clientHeight could equal the full (huge) content height, which would make
  // the virtual list render every line and freeze the tab.
  viewportH.value = Math.min(containerRef.value.clientHeight, window.innerHeight || containerRef.value.clientHeight)
  const span = document.createElement('span')
  span.className = 'font-mono text-[13px]'
  span.style.position = 'absolute'
  span.style.visibility = 'hidden'
  span.style.whiteSpace = 'pre'
  span.textContent = 'M'.repeat(100)
  containerRef.value.appendChild(span)
  charWidth.value = span.offsetWidth / 100 || 7.8
  containerRef.value.removeChild(span)
  recompute()
  if (props.currentLine) scrollToLine(props.currentLine)
}

onMounted(() => {
  measure()
  if (containerRef.value && 'ResizeObserver' in window) {
    const ro = new ResizeObserver(() => {
      const el = containerRef.value!
      viewportH.value = Math.min(el.clientHeight, window.innerHeight || el.clientHeight)
      recompute()
    })
    ro.observe(containerRef.value)
  }
})

watch(() => [props.text, props.wrap, props.lineOffsets], () => {
  expanded.value = new Set()
  recompute()
}, { deep: false })

watch(() => props.activeMatch, (m) => {
  if (m) {
    const s = new Set(expanded.value)
    s.add(m.line - 1)
    expanded.value = s
    recompute()
    scrollToLine(m.line)
  }
}, { immediate: true })

watch(() => props.currentLine, (l) => {
  if (l) scrollToLine(l)
})
</script>
