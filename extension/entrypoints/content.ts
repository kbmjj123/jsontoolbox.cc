import { browser } from 'wxt/browser'
import { defineContentScript } from 'wxt/utils/define-content-script'
import { registerJsonEditor } from '@kbmjj123/json-editor/wc'
import { analyzeJson } from '@kbmjj123/json-editor/core'
import { detectAndMount, type JsonDocument, type ViewerController, type ViewerLabels } from '../utils/detectAndMount'
import { getOptions, STORAGE_KEY, type ExtensionOptions } from '../utils/options'
import { MAX_AUTO_JSON_BYTES, OWN_HOSTS } from '../utils/constants'

const IGNORED_TAGS = new Set([
  'script', 'style', 'noscript', 'template', 'link', 'meta', 'base', 'iframe',
])

/**
 * Chrome has no built-in JSON tree viewer: an `application/json` response is
 * wrapped into an HTML document with a SINGLE <pre> in <body>, and
 * `document.contentType` is `text/html` — so contentType is NOT used here.
 *
 * Returns null SILENTLY on every ordinary page: blogs, docs and GitHub have
 * nav/article/footer siblings, so the "exactly one meaningful body child"
 * check rejects them before any parsing or DOM mutation.
 */
function findWholePageJson(): JsonDocument | null {
  if (location.protocol !== 'http:' && location.protocol !== 'https:') return null

  const host = location.hostname
  if (OWN_HOSTS.some(h => host === h || host.endsWith(`.${h}`))) return null

  const body = document.body
  if (!body) return null

  const meaningful = Array.from(body.children).filter(
    el => !IGNORED_TAGS.has(el.tagName.toLowerCase())
  )
  if (meaningful.length !== 1) return null

  const pre = meaningful[0]
  if (!pre || pre.tagName.toLowerCase() !== 'pre' || !(pre instanceof HTMLElement)) return null

  // NOTE: do NOT reject `pre.children.length !== 0`. Chrome's own JSON viewer
  // renders `<body><pre id="json">…<span>…</span>…</pre></body>` — the <pre> has
  // <span> children, and relaxing this lets us overlay our viewer on top of
  // Chrome's. The "exactly one meaningful body child" guard above already
  // rejects ordinary pages (which have nav/header/footer siblings), so a lone
  // <pre> with valid JSON is safe to treat as a JSON document.

  // Reject any visible text outside that <pre>.
  for (const node of Array.from(body.childNodes)) {
    if (node === pre) continue
    if (node.nodeType === 3 && (node.textContent ?? '').trim()) return null
  }

  const trimmed = (pre.textContent ?? '').trim()
  if (!/^[{[]/.test(trimmed)) return null
  if (new Blob([trimmed]).size > MAX_AUTO_JSON_BYTES) return null
  if (analyzeJson(trimmed).error !== null) return null

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
  matches: ['<all_urls>'],
  runAt: 'document_idle',
  async main(ctx) {
    let opts: ExtensionOptions = await getOptions()
    // Cached: once mounted, <body> has extra hosts and re-detection would fail.
    let detected: JsonDocument | null = null
    let controller: ViewerController | null = null

    function ensure(): void {
      if (ctx.isInvalid) return

      if (!opts.auto) {
        controller?.destroy()
        controller = null
        return
      }
      if (controller) {
        controller.apply(opts, viewerLabels())
        return
      }

      detected ??= findWholePageJson()
      if (!detected) return // silent on non-JSON pages

      registerJsonEditor() // idempotent; only after detection passes
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
