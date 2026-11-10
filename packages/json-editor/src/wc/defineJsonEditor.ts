import { createApp, reactive, h, type App } from 'vue'
import JsonEditor from '../vue/JsonEditor.vue'
import type { IndentOption } from '../core/format'
import type { Locale, Messages } from '../i18n'
import type { ThemeOption } from '../vue/useTheme'
import type { JsonEditorView } from '../vue/JsonEditor.vue'

export interface JsonEditorOptions {
  value?: string
  view?: JsonEditorView
  theme?: ThemeOption
  locale?: Locale
  messages?: Partial<Messages>
  readOnly?: boolean
  placeholder?: string
  indent?: IndentOption
  /** Refuse pastes larger than this many bytes. `0` disables the check. */
  maxBytes?: number
  height?: string
  attribution?: boolean
  attributionUrl?: string
  /** Show remote image previews (default ON). Local base64/data-URI images always render. */
  imagePreview?: boolean
  /** Restrict which view-mode buttons are shown. Default: all four (editor/tree/both/table). */
  allowedViews?: JsonEditorView[]
  /** Render the search box in the top toolbar instead of inside the tree. */
  searchInToolbar?: boolean
  /** Render tree expand/collapse toggles as text instead of chevron icons. */
  expandLabels?: boolean
  /** Render image values as just the <img> with no surrounding label. */
  bareImage?: boolean
  /** Sync scroll between the editor and tree panes in Split view. */
  linkScroll?: boolean
}

export interface JsonEditorErrorInfo {
  message: string
  location: { line: number; column: number } | null
}

export interface JsonEditorSelectInfo {
  path: string
  jsonPath: string
  value: unknown
}

type EditorHandle = {
  format(): void
  minify(): void
  focus(): void
  scrollToLine(line: number): void
}

export type JsonEditorEvent = 'change' | 'error' | 'select'

export interface JsonEditorInstance {
  setValue(value: string): void
  getValue(): string
  setOptions(options: JsonEditorOptions): void
  setTheme(theme: ThemeOption): void
  setLocale(locale: Locale): void
  format(): void
  minify(): void
  scrollToLine(line: number): void
  focus(): void
  on(event: 'change', handler: (value: string) => void): () => void
  on(event: 'error', handler: (info: JsonEditorErrorInfo | null) => void): () => void
  on(event: 'select', handler: (info: JsonEditorSelectInfo) => void): () => void
  destroy(): void
}

function normalize(options: JsonEditorOptions) {
  return {
    value: options.value ?? '',
    view: options.view ?? ('both' as JsonEditorView),
    theme: options.theme ?? ('auto' as ThemeOption),
    locale: options.locale ?? ('en' as Locale),
    messages: options.messages,
    readOnly: options.readOnly ?? false,
    placeholder: options.placeholder ?? '',
    indent: options.indent ?? (2 as IndentOption),
    maxBytes: options.maxBytes ?? 0,
    height: options.height ?? '420px',
    attribution: options.attribution ?? false,
    attributionUrl: options.attributionUrl ?? 'https://jsontoolbox.cc',
    imagePreview: options.imagePreview ?? true,
    allowedViews: options.allowedViews,
    searchInToolbar: options.searchInToolbar ?? false,
    expandLabels: options.expandLabels ?? false,
    bareImage: options.bareImage ?? false,
    linkScroll: options.linkScroll ?? false,
  }
}

/**
 * Mount a `JsonEditor` onto an existing element.
 *
 * This is the shared imperative API: the custom element uses it, and it is
 * also usable directly from plain JavaScript or another framework.
 */
export function defineJsonEditor(el: HTMLElement, options: JsonEditorOptions = {}): JsonEditorInstance {
  const state = reactive(normalize(options))

  const handlers: Record<JsonEditorEvent, Array<(payload: any) => void>> = {
    change: [],
    error: [],
    select: [],
  }

  let editor: EditorHandle | null = null

  const app: App = createApp({
    render() {
      return h(JsonEditor, {
        ref: (instance: unknown) => {
          editor = (instance as EditorHandle | null) ?? null
        },
        modelValue: state.value,
        view: state.view,
        theme: state.theme,
        locale: state.locale,
        messages: state.messages,
        readOnly: state.readOnly,
        placeholder: state.placeholder,
        indent: state.indent,
        maxBytes: state.maxBytes,
        height: state.height,
        attribution: state.attribution,
        attributionUrl: state.attributionUrl,
        imagePreview: state.imagePreview,
        allowedViews: state.allowedViews,
        searchInToolbar: state.searchInToolbar,
        expandLabels: state.expandLabels,
        bareImage: state.bareImage,
        linkScroll: state.linkScroll,
        'onUpdate:modelValue': (value: string) => {
          state.value = value
          handlers.change.slice().forEach((fn) => fn(value))
        },
        'onUpdate:view': (view: JsonEditorView) => {
          state.view = view
        },
        onError: (info: JsonEditorErrorInfo | null) => {
          handlers.error.slice().forEach((fn) => fn(info))
        },
        onSelect: (info: JsonEditorSelectInfo) => {
          handlers.select.slice().forEach((fn) => fn(info))
        },
      })
    },
  })

  app.mount(el)

  return {
    setValue(value) {
      state.value = value
    },
    getValue() {
      return state.value
    },
    setOptions(next) {
      const merged = normalize(next)
      Object.keys(merged).forEach((key) => {
        ;(state as Record<string, unknown>)[key] = (merged as Record<string, unknown>)[key]
      })
    },
    setTheme(theme) {
      state.theme = theme
    },
    setLocale(locale) {
      state.locale = locale
    },
    format() {
      editor?.format()
    },
    minify() {
      editor?.minify()
    },
    scrollToLine(line) {
      editor?.scrollToLine(line)
    },
    focus() {
      editor?.focus()
    },
    on(event, handler) {
      const list = handlers[event]
      list.push(handler as (payload: any) => void)
      return () => {
        const index = list.indexOf(handler as (payload: any) => void)
        if (index >= 0) list.splice(index, 1)
      }
    },
    destroy() {
      app.unmount()
      handlers.change.length = 0
      handlers.error.length = 0
      handlers.select.length = 0
      editor = null
    },
  }
}
