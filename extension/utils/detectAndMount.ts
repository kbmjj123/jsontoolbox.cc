// On-page JSON viewer: mount a read-only JSON editor over Chrome's raw <pre>,
// with an always-available 原始 / 树形 (raw / tree) toggle.
//
// Content scripts run in an isolated world where `customElements` is null, so
// the <json-editor> custom element CANNOT be registered here. Use /wc's
// imperative `defineJsonEditor()` instead and inject its inlined CSS ourselves.
import { defineJsonEditor, editorCss, type JsonEditorInstance, type JsonEditorOptions } from '@kbmjj123/json-editor/wc'
import { resolveDark, type ExtensionOptions } from './options'
import { SITE_URL } from './constants'

export interface JsonDocument {
  text: string
  /** The single <pre> that holds the raw JSON. */
  source: HTMLElement
}

export interface ViewerLabels {
  title: string
  raw: string
  tree: string
  /** Brand label for the always-visible top-right site link. */
  site: string
}

export interface ViewerController {
  /** Re-apply config live (called from storage.onChanged). */
  apply(options: ExtensionOptions, labels: ViewerLabels): void
  /** Restore the native <pre> and unmount the Vue app. */
  destroy(): void
}

const ROOT_ID = 'jsontb-root'
const SITELINK_ID = 'jsontb-sitelink'

function fixedHost(id: string, extra: Record<string, string>): HTMLDivElement {
  const host = document.createElement('div')
  host.id = id
  host.style.setProperty('position', 'fixed', 'important')
  host.style.setProperty('z-index', '2147483647', 'important')
  for (const [prop, value] of Object.entries(extra)) {
    host.style.setProperty(prop, value, 'important')
  }
  return host
}

export function detectAndMount(
  doc: JsonDocument,
  options: ExtensionOptions,
  labels: ViewerLabels
): ViewerController {
  const raw = doc.source
  // Remember the original inline display (value + priority) so 「原始」 restores
  // exactly what the page had. We only ever set `display` ourselves.
  const savedDisplay = raw.style.getPropertyValue('display')
  const savedPriority = raw.style.getPropertyPriority('display')

  // Chrome's built-in JSON viewer renders its own tree into this container and
  // may hide the native <pre>. Take it over so "Raw" always shows plain text and
  // our tree overlay never sits on top of a second tree.
  const viewerContainer = document.querySelector<HTMLElement>('.json-formatter-container')
  const savedViewerDisplay = viewerContainer?.style.getPropertyValue('display') ?? ''
  const savedViewerPriority = viewerContainer?.style.getPropertyPriority('display') ?? ''

  function restoreRawDisplay(): void {
    if (savedDisplay) raw.style.setProperty('display', savedDisplay, savedPriority)
    else raw.style.removeProperty('display')
  }

  function restoreViewerContainer(): void {
    if (!viewerContainer) return
    if (savedViewerDisplay) viewerContainer.style.setProperty('display', savedViewerDisplay, savedViewerPriority)
    else viewerContainer.style.removeProperty('display')
  }

  function showRawText(): void {
    restoreRawDisplay()
    // Chrome's viewer may have hidden the <pre> itself (display:none); force the
    // plain JSON text visible when the user switches to Raw.
    if (raw.style.getPropertyValue('display') === 'none') raw.style.removeProperty('display')
    viewerContainer?.style.setProperty('display', 'none', 'important')
  }

  // ── Full-screen overlay (tree mode) ──────────────────────────────────────
  const viewerHost = fixedHost(ROOT_ID, { inset: '0', margin: '0', padding: '0', border: '0' })
  viewerHost.style.setProperty('display', 'none', 'important')
  const root = viewerHost.attachShadow({ mode: 'open' })

  const styleEl = document.createElement('style')
  root.appendChild(styleEl)

  const wrap = document.createElement('div')
  wrap.className = 'wrap'

  const bar = document.createElement('div')
  bar.className = 'bar'
  const title = document.createElement('span')
  title.className = 'title'
  const siteLink = document.createElement('a')
  siteLink.href = SITE_URL
  siteLink.target = '_blank'
  siteLink.rel = 'noopener'
  siteLink.textContent = 'jsontoolbox.cc'
  title.appendChild(siteLink)
  const barToggle = document.createElement('button')
  barToggle.type = 'button'
  bar.append(title, barToggle)

  const body = document.createElement('div')
  body.className = 'body'

  // Nested shadow root: editor CSS stays isolated from our overlay CSS.
  const editorMount = document.createElement('div')
  editorMount.className = 'je-mount'
  const editorRoot = editorMount.attachShadow({ mode: 'open' })
  const editorStyle = document.createElement('style')
  editorStyle.textContent = `:host { display: block; height: 100% }\n${editorCss}`
  const editorInner = document.createElement('div')
  editorInner.style.height = '100%'
  editorRoot.append(editorStyle, editorInner)
  body.appendChild(editorMount)

  // `setOptions()` normalizes the FULL options object — always pass `value`,
  // otherwise a config change would silently clear the editor.
  function editorOptions(next: ExtensionOptions): JsonEditorOptions {
    return {
      value: doc.text,
      view: next.view,
      theme: resolveDark(next.theme) ? 'dark' : 'light',
      locale: next.locale,
      indent: next.indent,
      readOnly: true,
      height: '100%',
      attribution: false,
      imagePreview: next.imagePreview,
      // Plugin-only UX: split-first, search in top bar, text expand toggles,
      // bare image values, and synced split-pane scrolling.
      allowedViews: ['both', 'table'],
      searchInToolbar: true,
      expandLabels: true,
      bareImage: true,
      linkScroll: true,
    }
  }

  // NO `attribution` — the single site link lives in the toolbar above.
  const editor: JsonEditorInstance = defineJsonEditor(editorInner, editorOptions(options))
  wrap.append(bar, body)
  root.appendChild(wrap)
  document.body.appendChild(viewerHost)

  let mode: 'tree' | 'raw' = 'tree'
  let currentLabels = labels
  let destroyed = false

  function paint(dark: boolean): void {
    const line = dark ? '#334155' : '#e2e8f0'
    const barLine = dark ? '#1e293b' : '#e2e8f0'
    const bg = dark ? '#020617' : '#ffffff'
    const fg = dark ? '#f1f5f9' : '#0f172a'
    const barBg = dark ? '#0f172a' : '#f8fafc'

    styleEl.textContent = `
      :host { all: initial }
      .wrap { position: fixed; inset: 0; display: flex; flex-direction: column;
        background: ${bg}; color: ${fg};
        font: 14px/1.5 system-ui, -apple-system, sans-serif }
      .bar { flex: 0 0 auto; display: flex; align-items: center; gap: 12px;
        padding: 8px 14px; border-bottom: 1px solid ${barLine}; background: ${barBg} }
      .title { font-size: 13px; font-weight: 700 }
      .title a { color: #0052D4; text-decoration: none; margin-left: 8px; font-weight: 600 }
      button { cursor: pointer; border: 1px solid ${line}; background: transparent;
        color: inherit; border-radius: 8px; padding: 5px 12px;
        font: 600 12px system-ui, -apple-system, sans-serif }
      button:hover { border-color: #0052D4; color: #0052D4 }
      .body { flex: 1 1 auto; min-height: 0; overflow: hidden }
      .je-mount { display: block; height: 100% }
    `
  }

  function updateLabels(): void {
    // While in tree mode the button offers 「原始」; while in raw mode it offers 「树形」.
    const label = mode === 'tree' ? currentLabels.raw : currentLabels.tree
    barToggle.textContent = label
  }

  function setMode(next: 'tree' | 'raw'): void {
    if (destroyed) return
    mode = next
    if (next === 'tree') {
      raw.style.setProperty('display', 'none', 'important')
      viewerContainer?.style.setProperty('display', 'none', 'important')
      viewerHost.style.setProperty('display', 'block', 'important')
    } else {
      showRawText()
      viewerHost.style.setProperty('display', 'none', 'important')
    }
    updateLabels()
  }

  function toggle(): void {
    setMode(mode === 'tree' ? 'raw' : 'tree')
  }
  barToggle.addEventListener('click', toggle)

  // ── Always-visible top-right site link (both raw and tree modes) ──────────
  // Drives traffic back to the site. Appended last so it sits above the overlay.
  const siteHost = fixedHost(SITELINK_ID, { top: '16px', right: '16px' })
  const siteRoot = siteHost.attachShadow({ mode: 'open' })
  const siteStyle = document.createElement('style')
  siteStyle.textContent = `
    :host { all: initial }
    a { display: inline-flex; align-items: center; gap: 4px;
      cursor: pointer; text-decoration: none;
      background: #0052D4; color: #fff; border-radius: 9999px;
      padding: 7px 13px; box-shadow: 0 4px 14px rgba(0,0,0,.18);
      font: 600 12px system-ui, -apple-system, sans-serif }
    a:hover { background: #003ea8 }
    a::after { content: ' ↗' }
  `
  const siteAnchor = document.createElement('a')
  siteAnchor.href = SITE_URL
  siteAnchor.target = '_blank'
  siteAnchor.rel = 'noopener'
  siteAnchor.textContent = currentLabels.site
  siteRoot.append(siteStyle, siteAnchor)
  document.body.appendChild(siteHost)

  function apply(next: ExtensionOptions, nextLabels: ViewerLabels): void {
    if (destroyed) return
    currentLabels = nextLabels
    const dark = resolveDark(next.theme)
    editor.setOptions(editorOptions(next))
    title.textContent = nextLabels.title
    title.appendChild(siteLink)
    siteAnchor.textContent = nextLabels.site
    paint(dark)
    updateLabels()
  }

  function destroy(): void {
    if (destroyed) return
    destroyed = true
    editor.destroy() // no custom element → no disconnectedCallback to do this
    restoreRawDisplay()
    restoreViewerContainer()
    siteHost.remove()
    viewerHost.remove()
  }

  apply(options, labels)
  setMode('tree') // auto-beautify: tree is the default view

  return { apply, destroy }
}
