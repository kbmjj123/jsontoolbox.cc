import { onUnmounted, ref, watch } from 'vue'

/**
 * Shared fullscreen behaviour for tool panels: state, ESC to exit, body scroll
 * lock.
 *
 * Used by `ResizablePanel` and the Large JSON Viewer so both stay identical by
 * construction instead of by copy-paste.
 */
export function useFullscreen(initial = false) {
  const isFullscreen = ref(initial)

  useEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'Escape' && isFullscreen.value) isFullscreen.value = false
  })

  watch(isFullscreen, (v) => {
    document.body.style.overflow = v ? 'hidden' : ''
  })

  onUnmounted(() => {
    document.body.style.overflow = ''
  })

  function toggle() {
    isFullscreen.value = !isFullscreen.value
  }

  return { isFullscreen, toggle }
}
