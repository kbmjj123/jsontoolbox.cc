# JSON Toolbox — browser extension

A WXT + Vue 3 companion extension for [jsontoolbox.cc](https://jsontoolbox.cc).
Chrome / Edge Manifest V3 only in v1.

## What it does

The extension has **one job**: automatically turn raw JSON pages into a readable
tree. The popup contains **no tools** — it is a config panel plus links that send
you to the real tools on the site.

### Automatic on-page JSON viewer

Install it and open any URL that returns JSON (e.g.
`https://jsonplaceholder.typicode.com/users/1`). The raw `<pre>` is replaced by a
read-only JSON editor/tree view with:

- a **原始 / 树形 (Raw / Tree)** toggle — a floating button plus one in the toolbar;
  switching to Raw restores the page's original `<pre>` exactly as it was
- a `jsontoolbox.cc` link in the viewer toolbar (tree mode) **and** an always-visible
  "JSON Toolbox ↗" link pinned to the top-right of the viewport (both raw and tree
  modes) that opens the site — this is the primary traffic-driver back to jsontoolbox.cc
- live config: changing indentation / theme / language / default view in the
  popup applies immediately, without reloading the page

Detection is deliberately conservative: the body must contain **exactly one
content-bearing element — a `<pre>` whose text is valid JSON**. Chrome renders a
raw JSON response as `<pre>{...}</pre>` **plus** an empty
`<div class="json-formatter-container">` (its own JSON-viewer mount point);
empty childless elements and that container are ignored, and the viewer
container is hidden while our overlay is up so "Raw" always shows plain text.
Ordinary pages, blog posts and `<pre><code>` documentation samples have
nav/article/footer siblings and are left completely untouched — **no overlay,
no notification, no DOM changes**. Only the tool site's own UI hosts
(`jsontoolbox.cc` / `www.jsontoolbox.cc`) are excluded — subdomains are **not**,
so the `resources.jsontoolbox.cc` sample files are beautified normally.
Documents over **2 MiB** are skipped silently.

### Popup

- **Settings** — indentation, theme, language, default view, and an
  "Auto-beautify" master switch (default ON). This is a config toggle, not a
  permission prompt: beautification works from install.
- **Popular tools** — 6 links to real site tool pages, plus a prominent
  "View all tools →" button. Links are locale-aware (`/zh/...` when the popup
  language is 中文).
- Privacy note + a link to the full toolbox.

There is no standalone Options page, no context menu, and no manual "Beautify"
button.

## Privacy & permissions

| Item | Value |
|---|---|
| `permissions` | `['storage']` — only to save popup config locally |
| `content_scripts.matches` | `['<all_urls>']` — required for automatic detection |
| `host_permissions` | **not declared** (content scripts inject via `matches`) |

**Chrome will show "Read and change all your data on all websites" at install.**
That warning comes from `content_scripts.matches: ['<all_urls>']` and is expected:
Chrome offers no way to run a content script automatically based on a response's
content type, so auto-detection requires this broad match. It was a deliberate,
accepted tradeoff — note that no explicit `host_permissions` are requested.

What the code actually does is **local-only and read-only**: it reads the page's
existing text, parses it in memory, and renders into a shadow root. There are
**zero network requests** — no `fetch`, no `XMLHttpRequest`, no analytics, no
remote scripts or fonts (Inter is bundled locally, the viewer's CSS is inlined).
The only egress is a link the user clicks to open `jsontoolbox.cc`. `clipboardWrite`
is not requested; the viewer's Copy button relies on the user-gesture Clipboard API
with an `execCommand` fallback.

One narrow exception: with **image & media preview** enabled (the default), the
viewer renders `<img>` / `<audio>` / `<video>` / `<iframe>` for values that look
like image / audio / video / PDF URLs, which makes the browser fetch those assets
from their own servers. Local `data:` / `base64` images are rendered inline with
**no request**. Toggle "Preview images & media" in the popup to disable every
third-party fetch.

## Code reuse

This package is a pnpm workspace member and depends on `@kbmjj123/json-editor`
(`workspace:*`):

| Subpath | Used by |
|---|---|
| `/wc` (`defineJsonEditor`, `editorCss`) | `entrypoints/content.ts` — mounts the editor imperatively into a nested shadow root. **Do not switch back to `<json-editor>` / `registerJsonEditor()`**: extension content scripts run in an isolated world where `customElements` is `null`, so a custom element can never be registered (it throws `Cannot read properties of null (reading 'get')`). `editorCss` is the inlined stylesheet injected into that shadow root. |
| `/core` (`analyzeJson`) | the detection predicate in `entrypoints/content.ts` |

Design tokens are copied from the root `tailwind.config.js` into this package's
Tailwind 3 config. The four PNGs in `public/` were generated once (via `sharp`)
from the site's `public/web-app-manifest-512x512.png`.

Two locale systems, both using `zh` (never `zh-CN`):

- `i18n/{en,zh}.json` — popup UI (vue-i18n)
- `public/_locales/{en,zh}/messages.json` — manifest strings (`__MSG_*__`) and
  the viewer's three labels via `browser.i18n.getMessage`. These follow the
  **browser UI language**, not the popup's language setting; the editor toolbar
  itself is driven by the `locale` attribute from popup config.

## Development

From the repository root:

```bash
pnpm install                              # root postinstall builds dist/; extension postinstall runs wxt prepare
pnpm --filter extension exec wxt prepare  # REQUIRED after editing _locales (regenerates literal getMessage keys)
pnpm --filter extension compile           # vue-tsc --noEmit
pnpm --filter extension dev               # HMR dev (-b chrome is already in the script)
pnpm --filter extension build             # → extension/.output/chrome-mv3/
pnpm --filter extension zip               # → extension/.output/*-chrome.zip
```

> `precompile` / `predev` / `prebuild` / `prezip` build `@kbmjj123/json-editor`
> first because its `exports` point at `dist/`. Do not invoke `wxt build`
> directly (that bypasses the pnpm lifecycle scripts).

Load unpacked from `chrome://extensions` → Developer mode →
`extension/.output/chrome-mv3`.

## Verification checklist

**Generated manifest** (`.output/chrome-mv3/manifest.json`):

- `permissions: ["storage"]` only; no `host_permissions`, no `background`, no
  `options_ui`
- `content_scripts[0]` = `matches: ["<all_urls>"]`, `js: ["content-scripts/content.js"]`,
  `run_at: "document_idle"`
- `action.default_popup: "popup.html"`, `default_locale: "en"`, 4 icons
- The install warning **does** mention all websites (expected, see above)
- No `beautify.js`, `background.js` or `options.html` in the output

**Real browser** — automated end-to-end run with `puppeteer-core` + Chrome for
Testing 148 against **both** `chrome-mv3` and `chrome-mv3-dev`: 12/12 checks
pass (auto-mount, Vue editor actually rendered, raw/tree toggle both ways,
ordinary page untouched, zero runtime errors). The manual checklist below is
still worth running in your own Chrome profile, especially the locale and
live-config items:

1. Open a `.json` URL → tree overlay appears automatically, native `<pre>` hidden,
   floating toggle + `jsontoolbox.cc` link + always-visible top-right "JSON Toolbox ↗"
   link visible
2. Toggle Raw → original `<pre>` restored with its text/styles intact; toggle Tree
   → overlay returns; there is no permanent Close
3. `https://example.com`, a blog post with `<pre><code>{...}</code></pre>`, a
   GitHub blob view → no overlay, no toast, no DOM change
4. `https://jsontoolbox.cc/tools/format/json-editor` → unaffected (self-exclusion);
   `https://resources.jsontoolbox.cc/orders-1mb.json` → tree overlay appears (subdomains are not excluded)
5. With a JSON page open, change popup indent / theme / view / language → applies
   live without reload
6. Turn "Auto-beautify" OFF → overlay + toggle removed and `<pre>` restored; ON →
   re-mounts
7. Set Language = 中文 → all 6 links + "View all tools" open `/zh/tools/...`
8. Popup DevTools → Network: zero external requests; built output has no remote
   `<script src>`, `eval` or `new Function`; no `[Vue warn]: injection … not found`

## Not in v1

- Intercepting `fetch` / `XMLHttpRequest` JSON responses (needs MAIN-world
  monkey-patching, brittle under MV3 CSP)
- Code splitting for the content script (WXT builds content scripts as a single
  IIFE, so Vue + CodeMirror are parsed on every page — DOM work still only
  happens after detection passes)
- Firefox / Safari builds, extra store locales (es / pt / id)
