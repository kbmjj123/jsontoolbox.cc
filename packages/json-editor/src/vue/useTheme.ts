import { computed, onScopeDispose, ref, type ComputedRef, type Ref } from 'vue'

export type ThemeOption = 'light' | 'dark' | 'auto'

const QUERY = '(prefers-color-scheme: dark)'

/**
 * Resolve `theme` to a concrete dark/light mode.
 *
 * `auto` follows the OS preference and updates live. No `window` access on the
 * server, so SSR renders the light palette and hydration does not mismatch.
 */
export function useTheme(theme: Ref<ThemeOption>): { isDark: ComputedRef<boolean> } {
  const prefersDark = ref(false)

  if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
    const media = window.matchMedia(QUERY)
    prefersDark.value = media.matches
    const onChange = (event: MediaQueryListEvent) => {
      prefersDark.value = event.matches
    }
    if (typeof media.addEventListener === 'function') {
      media.addEventListener('change', onChange)
      onScopeDispose(() => media.removeEventListener('change', onChange))
    } else if (typeof media.addListener === 'function') {
      // Safari < 14 only has the deprecated listener API.
      media.addListener(onChange)
      onScopeDispose(() => media.removeListener(onChange))
    }
  }

  const isDark = computed(() => {
    if (theme.value === 'dark') return true
    if (theme.value === 'light') return false
    return prefersDark.value
  })

  return { isDark }
}
