import {
  defineJsonEditor,
  type JsonEditorInstance,
  type JsonEditorOptions,
  type JsonEditorSelectInfo,
} from './defineJsonEditor'
import type { IndentOption } from '../core/format'
import type { Locale } from '../i18n'
import type { ThemeOption } from '../vue/useTheme'
import type { JsonEditorView } from '../vue/JsonEditor.vue'
import cssText from '../styles/index.css?inline'

const OBSERVED = [
  'value',
  'view',
  'theme',
  'locale',
  'indent',
  'max-bytes',
  'height',
  'placeholder',
  'attribution',
  'attribution-url',
  'readonly',
] as const

function readIndent(raw: string | null): IndentOption {
  if (raw === 'tab') return 'tab'
  return Number(raw) === 4 ? 4 : 2
}

/**
 * `<json-editor>` custom element.
 *
 * Renders into a shadow root by default so the host page's CSS cannot leak in
 * and no external stylesheet is needed. Set `use-shadow="false"` to render
 * into the light DOM instead (for example to theme it with page-level CSS
 * variables).
 */
export class JsonEditorElement extends HTMLElement {
  static get observedAttributes(): string[] {
    return [...OBSERVED]
  }

  private instance: JsonEditorInstance | null = null
  private syncingAttribute = false

  connectedCallback() {
    if (this.instance) return

    const host = this.createHost()
    const container = document.createElement('div')
    container.style.height = '100%'
    host.appendChild(container)

    this.instance = defineJsonEditor(container, this.readOptions())

    this.instance.on('change', (value) => {
      // Keep the attribute in sync, but ignore the resulting callback echo.
      this.syncingAttribute = true
      this.setAttribute('value', value)
      this.syncingAttribute = false
      this.dispatchEvent(new CustomEvent('input', { detail: { value }, bubbles: true }))
    })

    this.instance.on('error', (info) => {
      this.dispatchEvent(new CustomEvent('error', { detail: info, bubbles: true }))
    })

    this.instance.on('select', (info: JsonEditorSelectInfo) => {
      this.dispatchEvent(new CustomEvent('select', { detail: info, bubbles: true }))
    })
  }

  disconnectedCallback() {
    this.instance?.destroy()
    this.instance = null
  }

  attributeChangedCallback(name: string, previous: string | null, next: string | null) {
    if (!this.instance || previous === next) return
    if (name === 'value' && this.syncingAttribute) return
    this.instance.setOptions(this.readOptions())
  }

  private createHost(): HTMLElement | ShadowRoot {
    if (this.getAttribute('use-shadow') === 'false') {
      this.style.display = 'block'
      return this
    }
    const root = this.shadowRoot ?? this.attachShadow({ mode: 'open' })
    const style = document.createElement('style')
    style.textContent = `:host { display: block; }\n${cssText}`
    root.appendChild(style)
    return root
  }

  private readOptions(): JsonEditorOptions {
    const attr = (name: string) => this.getAttribute(name)
    return {
      value: attr('value') ?? '',
      view: (attr('view') as JsonEditorView | null) ?? 'both',
      theme: (attr('theme') as ThemeOption | null) ?? 'auto',
      locale: (attr('locale') as Locale | null) ?? 'en',
      indent: readIndent(attr('indent')),
      maxBytes: Number(attr('max-bytes') ?? 0) || 0,
      height: attr('height') ?? '420px',
      placeholder: attr('placeholder') ?? '',
      readOnly: this.hasAttribute('readonly'),
      attribution: this.hasAttribute('attribution'),
      attributionUrl: attr('attribution-url') ?? 'https://jsontoolbox.cc',
    }
  }

  // ── Public methods ────────────────────────────────────────

  setValue(value: string) {
    this.instance?.setValue(value)
  }

  getValue(): string {
    return this.instance?.getValue() ?? ''
  }

  format() {
    this.instance?.format()
  }

  minify() {
    this.instance?.minify()
  }

  scrollToLine(line: number) {
    this.instance?.scrollToLine(line)
  }

  focus() {
    this.instance?.focus()
  }

  destroy() {
    this.instance?.destroy()
    this.instance = null
  }
}

/**
 * Register `<json-editor>`. Safe to call more than once.
 * Returns `false` when `customElements` is unavailable (SSR).
 */
export function registerJsonEditor(tag = 'json-editor'): boolean {
  if (typeof customElements === 'undefined') return false
  if (customElements.get(tag)) return true
  customElements.define(tag, JsonEditorElement)
  return true
}
