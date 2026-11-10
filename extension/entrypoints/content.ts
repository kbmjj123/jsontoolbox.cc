import { browser } from 'wxt/browser'
import { defineContentScript } from 'wxt/utils/define-content-script'
import { analyzeJson } from '@kbmjj123/json-editor/core'
import { detectAndMount, type JsonDocument, type ViewerController, type ViewerLabels } from '../utils/detectAndMount'
import { getOptions, STORAGE_KEY, type ExtensionOptions } from '../utils/options'
import { MAX_AUTO_JSON_BYTES, OWN_HOSTS } from '../utils/constants'

/**
 * Dev-only diagnostics. Detection rejections are intentionally silent in
 * production; these logs make the reason visible while debugging injection.
 * `import.meta.env.DEV` is compiled away in release builds.
 */
const DEBUG = import.meta.env.DEV
function diag(message: string, detail?: unknown): void {
  if (DEBUG) console.info(`[jt] ${message}`, detail ?? '')
}
function reject(reason: string): null {
  diag(`detect rejected: ${reason}`)
  return null
}

const IGNORED_TAGS = new Set([
  'script', 'style', 'noscript', 'template', 'link', 'meta', 'base', 'iframe',
])

/**
 * Chrome's built-in JSON viewer appends `<div class="json-formatter-container">`
 * to <body> next to the raw <pre> (verified on Chrome 148). It is viewer chrome,
 * not page content — ignore it whether empty or already rendering a tree.
 */
const VIEWER_CONTAINER_CLASS = 'json-formatter-container'

/**
 * Chrome has no built-in JSON tree viewer: an `application/json` response is
 * wrapped into an HTML document with a SINGLE <pre> in <body>, and
 * `document.contentType` is `text/html` — so contentType is NOT used here.
 *
 * Returns null SILENTLY on every ordinary page: blogs, docs and GitHub have
 * nav/article/footer siblings, so the "exactly one CONTENT-bearing body child"
 * check rejects them before any parsing or DOM mutation. Empty mount points and
 * Chrome's own viewer container are ignored (see filter below).
 */
function findWholePageJson(): JsonDocument | null {
  // http/https are the common case; `file:` lets the viewer overlay local
  // `*.json` files opened directly in Chrome (Chrome renders them as the same
  // single-<pre> native JSON view). Extension injection on file:// still
  // requires the user to enable "Allow access to file URLs" on the extension
  // card — that step is a Chrome safeguard and cannot be coded around.
  if (
    location.protocol !== 'http:' &&
    location.protocol !== 'https:' &&
    location.protocol !== 'file:'
  )
    return reject(`protocol=${location.protocol}`)

  const host = location.hostname
  if (OWN_HOSTS.includes(host)) return reject(`own host=${host}`)

  const body = document.body
  if (!body) return reject('no <body>')

  const meaningful = Array.from(body.children).filter((el): el is HTMLElement => {
    if (!(el instanceof HTMLElement)) return false
    if (IGNORED_TAGS.has(el.tagName.toLowerCase())) return false
    if (el.classList.contains(VIEWER_CONTAINER_CLASS)) return false
    // Empty, childless mount points injected by browsers / other viewers.
    if (el.children.length === 0 && (el.textContent ?? '').trim() === '') return false
    return true
  })
  if (meaningful.length !== 1)
    return reject(`meaningful=${meaningful.length}, children=[${Array.from(body.children).map(el => el.tagName.toLowerCase()).join(',')}]`)

  const pre = meaningful[0]
  if (!pre || pre.tagName.toLowerCase() !== 'pre')
    return reject(`first child is <${pre?.tagName.toLowerCase() ?? 'none'}>, not <pre>`)

  // NOTE: do NOT reject `pre.children.length !== 0`. Chrome's own JSON viewer
  // renders `<body><pre id="json">…<span>…</span>…</pre></body>` — the <pre> has
  // <span> children, and relaxing this lets us overlay our viewer on top of
  // Chrome's. The "exactly one meaningful body child" guard above already
  // rejects ordinary pages (which have nav/header/footer siblings), so a lone
  // <pre> with valid JSON is safe to treat as a JSON document.

  // Reject any visible text outside that <pre>.
  for (const node of Array.from(body.childNodes)) {
    if (node === pre) continue
    if (node.nodeType === 3 && (node.textContent ?? '').trim())
      return reject('visible text node outside <pre>')
  }

  const trimmed = (pre.textContent ?? '').trim()
  diag('detect: single <pre> found', { chars: trimmed.length, head: trimmed.slice(0, 40) })
  if (!/^[{[]/.test(trimmed)) return reject(`root starts with ${JSON.stringify(trimmed[0])}`)
  const bytes = new Blob([trimmed]).size
  if (bytes > MAX_AUTO_JSON_BYTES) return reject(`too large: ${bytes} bytes`)
  const analysis = analyzeJson(trimmed)
  if (analysis.error !== null) return reject(`invalid JSON: ${analysis.error}`)

  diag('detect ok', { bytes })
  return { text: trimmed, source: pre }
}

/** Literal keys only — wxt prepare generates a literal-union getMessage type. */
function viewerLabels(): ViewerLabels {
  return {
    title: browser.i18n.getMessage('viewerTitle'),
    raw: browser.i18n.getMessage('viewerRaw'),
    tree: browser.i18n.getMessage('viewerTree'),
    site: browser.i18n.getMessage('extName'),
  }
}

export default defineContentScript({
  matches: ['<all_urls>', 'file:///*'],
  runAt: 'document_idle',
  async main(ctx) {
    diag('content script alive', { href: location.href, contentType: document.contentType })
    let opts: ExtensionOptions = await getOptions()
    diag('options loaded', opts)
    // Cached: once mounted, <body> has extra hosts and re-detection would fail.
    let detected: JsonDocument | null = null
    let controller: ViewerController | null = null

    function ensure(): void {
      if (ctx.isInvalid) {
        diag('ensure: context invalidated')
        return
      }

      if (!opts.auto) {
        diag('ensure: auto-beautify is OFF — restoring native <pre>')
        controller?.destroy()
        controller = null
        return
      }
      if (controller) {
        diag('ensure: applying config to existing viewer')
        controller.apply(opts, viewerLabels())
        return
      }

      detected ??= findWholePageJson()
      if (!detected) return // rejection reason already logged by reject()

      diag('ensure: mounting viewer')
      controller = detectAndMount(detected, opts, viewerLabels())
    }

    ensure()

    browser.storage.onChanged.addListener((changes, area) => {
      // Fires in EVERY content script instance across all tabs — bail out cheaply.
      if (ctx.isInvalid || area !== 'local') return
      const change = changes[STORAGE_KEY]
      if (!change) return
      opts = { ...opts, ...((change.newValue as Partial<ExtensionOptions> | undefined) ?? {}) }
      ensure()
    })

    ctx.onInvalidated(() => {
      controller?.destroy()
      controller = null
    })
  },
})
