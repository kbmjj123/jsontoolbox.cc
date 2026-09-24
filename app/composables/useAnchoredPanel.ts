/**
 * Position a floating panel (dropdown, menu, hint) against a trigger element.
 *
 * Panels rendered inside a scroll container get clipped: a container with
 * `overflow-x: auto` forces `overflow-y` to compute to `auto` as well, so an
 * `absolute top-full` child is cut off instead of dropping down. The fix is to
 * render the panel into `body` and give it a viewport position — which is what
 * this composable computes.
 *
 * Usage (see `ToolFloatingPanel.vue`, the only sanctioned wrapper):
 *   const { style, measure, startTracking, stopTracking } =
 *     useAnchoredPanel(() => triggerEl.value)
 */
export interface AnchoredPanelPos {
  top: number
  left: number
  width: number
}

export function useAnchoredPanel(
  anchorEl: () => HTMLElement | null | undefined,
  options: { offset?: number } = {},
) {
  const offset = options.offset ?? 4

  const pos = ref<AnchoredPanelPos | null>(null)

  const style = computed<Record<string, string>>(() => {
    const p = pos.value
    if (!p) return {}
    return { top: `${p.top}px`, left: `${p.left}px`, minWidth: `${p.width}px` }
  })

  function measure() {
    const el = anchorEl()
    if (!el) return
    const r = el.getBoundingClientRect()
    pos.value = { top: r.bottom + offset, left: r.left, width: r.width }
  }

  // Capture phase: the trigger usually lives inside a scroll container that
  // does not emit window-level scroll events of its own.
  function startTracking() {
    measure()
    window.addEventListener('scroll', measure, true)
    window.addEventListener('resize', measure)
  }

  function stopTracking() {
    window.removeEventListener('scroll', measure, true)
    window.removeEventListener('resize', measure)
  }

  onBeforeUnmount(stopTracking)

  return { pos, style, measure, startTracking, stopTracking }
}
