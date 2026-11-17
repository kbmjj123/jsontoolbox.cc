# Changelog

All notable, user-facing changes to JSON Toolbox are recorded here. The format
follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and version
numbers follow [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

JSON Toolbox is a static site, not an npm package. A version describes what is
live at <https://jsontoolbox.cc> when its GitHub Release is published.

## [Unreleased]

## [v1.0.0] - 2026-11-17

First versioned release. Baseline: 31 client-side tools across format, convert,
and view; all processing stays in the browser.

### Added

- Embed any tool with `/embed/tool?tool=<slug>`. The generator at `/embed`
  copies a ready-made iframe with `theme`, `height`, `branding`, and `lang`
  controls.
- Inbound deep links (`#in=`) carry the current input into a related tool. The
  `jtb1d` payload uses deflate-raw + base64url and lives in the URL fragment,
  capped at 512 KB raw / 256 KB decompressed.
- `?example=` deep links pre-fill a hosted tool from a saved example.
- PWA foundation: `site.webmanifest` and a production-only service worker
  (`/sw.js`) using network-first navigation and cache-first same-origin assets.

### Changed

- "Related tools" links now append `#in=` automatically, so data survives a
  tool-to-tool jump. Oversized or malformed payloads show a warning and fall
  back to the first built-in example.

### Limitations

- Embedded iframes always start empty; `#in=` is read only on `/tools/` pages.
- Offline support covers pages and assets that were already cached. An
  unvisited tool falls back to the cached homepage, offline reload is not
  guaranteed, and no custom install prompt is shipped.

[Unreleased]: https://github.com/kbmjj123/jsontoolbox.cc/compare/v1.0.0...HEAD
[v1.0.0]: https://github.com/kbmjj123/jsontoolbox.cc/releases/tag/v1.0.0
