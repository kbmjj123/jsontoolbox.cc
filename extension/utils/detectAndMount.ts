// On-page JSON viewer: mount a read-only <json-editor> over Chrome's raw JSON
// <pre>, with an always-available 原始 / 树形 (raw / tree) toggle.
//
// Both hosts use their OWN shadow roots so the host page's CSS cannot affect
// the viewer and ours cannot leak out. The /wc element additionally owns a
// nested shadow root with its CSS inlined, so no external stylesheet is needed.
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
const TOGGLE_ID = 'jsontb-toggle'
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

  function restoreRaw(): void {
    if (savedDisplay) raw.style.setProperty('display', savedDisplay, savedPriority)
    else raw.style.removeProperty('display')
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

  // Created with createElement (not innerHTML) so the isolated world's
  // customElements registry upgrades it. NO `attribution` attr — the single
  // site link lives in the toolbar above.
  const editor = document.createElement('json-editor')
  editor.setAttribute('value', doc.text)
  editor.setAttribute('height', '100%')
  editor.setAttribute('readonly', '')
  body.appendChild(editor)
  wrap.append(bar, body)
  root.appendChild(wrap)
  document.body.appendChild(viewerHost)

  // ── Always-visible floating toggle ──────────────────────────────────────
  const toggleHost = fixedHost(TOGGLE_ID, { right: '16px', bottom: '16px' })
  const toggleRoot = toggleHost.attachShadow({ mode: 'open' })
  const toggleStyle = document.createElement('style')
  const toggleBtn = document.createElement('button')
  toggleBtn.type = 'button'
  toggleRoot.append(toggleStyle, toggleBtn)
  document.body.appendChild(toggleHost)

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
      json-editor { display: block; height: 100% }
    `
    toggleStyle.textContent = `
      :host { all: initial }
      button { cursor: pointer; border: 1px solid ${line}; background: ${bg};
        color: ${fg}; border-radius: 9999px; padding: 8px 14px;
        box-shadow: 0 4px 14px rgba(0,0,0,.18);
        font: 600 12px system-ui, -apple-system, sans-serif }
      button:hover { border-color: #0052D4; color: #0052D4 }
    `
  }

  function updateLabels(): void {
    // While in tree mode the button offers 「原始」; while in raw mode it offers 「树形」.
    const label = mode === 'tree' ? currentLabels.raw : currentLabels.tree
    toggleBtn.textContent = label
    barToggle.textContent = label
  }

  function setMode(next: 'tree' | 'raw'): void {
    if (destroyed) return
    mode = next
    if (next === 'tree') {
      raw.style.setProperty('display', 'none', 'important')
      viewerHost.style.setProperty('display', 'block', 'important')
    } else {
      restoreRaw()
      viewerHost.style.setProperty('display', 'none', 'important')
    }
    updateLabels()
  }

  function toggle(): void {
    setMode(mode === 'tree' ? 'raw' : 'tree')
  }
  toggleBtn.addEventListener('click', toggle)
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
    // attributeChangedCallback → setOptions() → reactive update inside /wc.
    editor.setAttribute('theme', dark ? 'dark' : 'light')
    editor.setAttribute('locale', next.locale)
    editor.setAttribute('indent', String(next.indent))
    editor.setAttribute('view', next.view)
    title.textContent = nextLabels.title
    title.appendChild(siteLink)
    siteAnchor.textContent = nextLabels.site
    paint(dark)
    updateLabels()
  }

  function destroy(): void {
    if (destroyed) return
    destroyed = true
    restoreRaw()
    siteHost.remove()
    toggleHost.remove()
    viewerHost.remove() // <json-editor> disconnectedCallback → app.unmount()
  }

  apply(options, labels)
  setMode('tree') // auto-beautify: tree is the default view

  return { apply, destroy }
}
