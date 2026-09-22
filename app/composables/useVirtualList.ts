/**
 * Variable-height virtual list composable.
 *
 * Renders only the items currently inside the scroll viewport. Item heights are
 * measured after mount (and on resize) so it works with arbitrarily tall rows
 * (e.g. an expanded JSON subtree, an image preview, a wrapped cell).
 *
 * Usage:
 *   const { virtualItems, totalHeight, measure, scrollToIndex } = useVirtualList(
 *     containerRef,
 *     { itemCount: () => items.value.length, estimateHeight: 30, overscan: 8 },
 *   )
 *
 * Template (scroll container = containerRef):
 *   <div ref="containerRef" class="overflow-auto" style="position: relative">
 *     <div :style="{ height: totalHeight + 'px' }">
 *       <div
 *         v-for="vi in virtualItems"
 *         :key="vi.index"
 *         :ref="(el) => measure(vi.index, el as HTMLElement | null)"
 *         :style="{ position: 'absolute', top: '0', transform: `translateY(${vi.offset}px)`, left: '0', right: '0' }"
 *       >
 *         {{ items[vi.index] }}
 *       </div>
 *     </div>
 *   </div>
 */
import { computed, onBeforeUnmount, onMounted, ref, watch, type Ref } from 'vue'

export interface VirtualItem {
  index: number
  /** Cumulative offset of the item from the top of the list. */
  offset: number
  /** Measured (or estimated) height of the item. */
  height: number
}

export interface UseVirtualListOptions {
  /** Reactive item count. Pass a getter to avoid an extra ref. */
  itemCount: Ref<number> | (() => number)
  /** Estimated row height before measurement (px). */
  estimateHeight?: number
  /** Extra rows rendered above/below the viewport. */
  overscan?: number
  /**
   * External scroll viewport. When given, the window is computed against this
   * element and the list itself stays a plain, non-scrolling spacer. That is
   * what keeps a nested list from introducing a second scrollbar.
   */
  viewportRef?: Ref<HTMLElement | null>
  /** Distance from the top of the viewport's scrollable content to the list top. */
  offsetTop?: () => number
}

export function useVirtualList(
  containerRef: Ref<HTMLElement | null>,
  options: UseVirtualListOptions,
) {
  const estimate = options.estimateHeight ?? 30
  const overscan = options.overscan ?? 8

  const scrollTop = ref(0)
  const viewportHeight = ref(0)

  // Measured heights keyed by item index (non-reactive on purpose).
  const measured = new Map<number, number>()
  // Bumped whenever a measurement changes so derived computeds re-run.
  const version = ref(0)

  // element -> index so the shared ResizeObserver can update by element.
  const elToIndex = new WeakMap<Element, number>()
  const indexToEl = new Map<number, HTMLElement>()

  let ro: ResizeObserver | null = null

  function getItemCount(): number {
    return typeof options.itemCount === 'function'
      ? options.itemCount()
      : options.itemCount.value
  }

  function getItemHeight(i: number): number {
    return measured.get(i) ?? estimate
  }

  // Cached prefix-offset array, rebuilt only when measured heights change.
  let prefixCache: number[] = []
  let prefixVersion = -1
  function getOffsets(): number[] {
    const count = getItemCount()
    if (prefixVersion === version.value && prefixCache.length === count + 1) {
      return prefixCache
    }
    const arr: number[] = new Array(count + 1)
    arr[0] = 0
    for (let i = 0; i < count; i++) arr[i + 1] = arr[i] + getItemHeight(i)
    prefixCache = arr
    prefixVersion = version.value
    return arr
  }

  const totalHeight = computed(() => {
    const arr = getOffsets()
    return arr[arr.length - 1]
  })

  function findStart(top: number): number {
    const arr = getOffsets()
    const count = arr.length - 1
    let lo = 0
    let hi = count
    while (lo < hi) {
      const mid = (lo + hi) >> 1
      if (arr[mid + 1] <= top) lo = mid + 1
      else hi = mid
    }
    return lo
  }

  const virtualItems = computed<VirtualItem[]>(() => {
    const arr = getOffsets()
    const count = arr.length - 1
    if (count === 0) return []
    const start = Math.max(0, findStart(scrollTop.value) - overscan)
    const bottom = scrollTop.value + viewportHeight.value
    let end = start
    while (end < count && arr[end + 1] < bottom + overscan * estimate) end++
    const items: VirtualItem[] = []
    for (let i = start; i <= end; i++) {
      items.push({ index: i, offset: arr[i], height: getItemHeight(i) })
    }
    return items
  })

  /** Recompute the visible window from the current scroll position. */
  function refresh() {
    const vp = options.viewportRef?.value ?? null
    if (vp) {
      viewportHeight.value = vp.clientHeight
      scrollTop.value = Math.max(0, vp.scrollTop - (options.offsetTop?.() ?? 0))
      return
    }
    const el = containerRef.value
    if (!el) return
    viewportHeight.value = el.clientHeight
    scrollTop.value = el.scrollTop
  }

  function onScroll() {
    refresh()
  }

  function measure(index: number, el: HTMLElement | null) {
    if (el) {
      elToIndex.set(el, index)
      indexToEl.set(index, el)
      if (ro) ro.observe(el)
      const h = el.offsetHeight
      if (h > 0 && measured.get(index) !== h) {
        measured.set(index, h)
        version.value++
      }
    } else {
      const prev = indexToEl.get(index)
      if (prev) {
        elToIndex.delete(prev)
        indexToEl.delete(index)
        if (ro) ro.unobserve(prev)
      }
    }
  }

  /** Smoothly scroll so the given item is visible (used by locate features). */
  function scrollToIndex(index: number, align: 'start' | 'center' = 'center') {
    const arr = getOffsets()
    if (index < 0 || index >= arr.length - 1) return
    const offset = arr[index]
    const h = getItemHeight(index)
    const vp = options.viewportRef?.value ?? null
    if (vp) {
      const target = (options.offsetTop?.() ?? 0) + offset
      vp.scrollTop = align === 'center' ? target - (vp.clientHeight - h) / 2 : target
      refresh()
      return
    }
    const el = containerRef.value
    if (!el) return
    if (align === 'center') {
      el.scrollTop = offset - (el.clientHeight - h) / 2
    } else {
      el.scrollTop = offset
    }
  }

  let vpRo: ResizeObserver | null = null

  onMounted(() => {
    const el = containerRef.value
    const vp = options.viewportRef?.value ?? null
    refresh()
    if (vp) {
      vp.addEventListener('scroll', onScroll, { passive: true })
      if (typeof ResizeObserver !== 'undefined') {
        vpRo = new ResizeObserver(() => refresh())
        vpRo.observe(vp)
        if (el) vpRo.observe(el)
      }
    } else if (el) {
      el.addEventListener('scroll', onScroll, { passive: true })
    }
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const idx = elToIndex.get(entry.target)
          if (idx === undefined) continue
          const h = (entry.target as HTMLElement).offsetHeight
          if (h > 0 && measured.get(idx) !== h) {
            measured.set(idx, h)
            version.value++
          }
        }
      })
    }
  })

  // Re-window whenever measured heights change (rows expanding, images loading).
  watch(version, refresh)

  onBeforeUnmount(() => {
    const el = containerRef.value
    if (el) el.removeEventListener('scroll', onScroll)
    options.viewportRef?.value?.removeEventListener('scroll', onScroll)
    ro?.disconnect()
    ro = null
    vpRo?.disconnect()
    vpRo = null
    measured.clear()
    indexToEl.clear()
  })

  return { virtualItems, totalHeight, measure, scrollToIndex, refresh }
}
