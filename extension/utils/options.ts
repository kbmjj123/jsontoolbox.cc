// Typed options persisted in browser.storage.local.
// Read by the popup AND the content script, so it must stay free of Vue and of
// any module-scope browser.* calls (WXT imports JS entrypoints in Node at build).
import { browser } from 'wxt/browser'

export type IndentOption = 2 | 4 | 'tab'
export type ThemeOption = 'light' | 'dark' | 'auto'
export type AppLocale = 'en' | 'zh'
export type EditorView = 'both' | 'editor' | 'tree' | 'table'

export interface ExtensionOptions {
  indent: IndentOption
  theme: ThemeOption
  locale: AppLocale
  view: EditorView
  /** Master config switch (default ON). NOT a permission opt-in: the extension
   *  auto-beautifies from install; this only lets the user turn the feature off. */
  auto: boolean
  /** Show remote image/audio/video/PDF previews (default ON). Local base64 /
   *  data-URI images always render. Turning this off also stops the browser
   *  from fetching third-party media when a JSON value points at one. */
  imagePreview: boolean
}

export const STORAGE_KEY = 'jsontb:options:v1'

// `getOptions()` merges DEFAULT_OPTIONS, so existing installs silently gain
// `auto: true` without a storage-key bump.
export const DEFAULT_OPTIONS: ExtensionOptions = {
  indent: 2,
  theme: 'auto',
  locale: 'en',
  view: 'both',
  auto: true,
  imagePreview: true,
}

export async function getOptions(): Promise<ExtensionOptions> {
  try {
    const stored = await browser.storage.local.get(STORAGE_KEY)
    const raw = stored?.[STORAGE_KEY] as Partial<ExtensionOptions> | undefined
    return { ...DEFAULT_OPTIONS, ...(raw ?? {}) }
  } catch {
    return { ...DEFAULT_OPTIONS }
  }
}

export async function setOptions(next: Partial<ExtensionOptions>): Promise<ExtensionOptions> {
  const merged = { ...(await getOptions()), ...next }
  await browser.storage.local.set({ [STORAGE_KEY]: merged })
  return merged
}

/** Resolve a theme setting to a concrete dark/light decision. */
export function resolveDark(theme: ThemeOption): boolean {
  if (theme === 'dark') return true
  if (theme === 'light') return false
  return typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: dark)').matches
}

/** Apply `.dark` on <html>. Used by the popup on mount / change. */
export function applyTheme(theme: ThemeOption): void {
  const dark = resolveDark(theme)
  document.documentElement.classList.toggle('dark', dark)
  document.documentElement.style.colorScheme = dark ? 'dark' : 'light'
}
