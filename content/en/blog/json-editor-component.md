---
title: "JSON Editor Component: Vue, Web Component & CDN (Open Source)"
description: "Embed a full JSON editor in any app — Vue 3 component, custom element, or CDN script tag. Tree and table views, node editing, live validation, 100% client-side, MIT."
h1: "JSON Editor Component: Vue, Web Component & CDN (Open Source)"
category: "json_tools"
date: 2026-10-19
lastmod: 2026-10-19
image: "/blog/cover/en/json-editor-component-cover.svg"
tags:
  - "JSON"
  - "JSON Editor"
  - "Vue"
  - "Web Component"
  - "Open Source"
  - "Component"
author: "JSON Toolbox Team"
promo:
  slug: "json-editor"
  text: "Try the exact editor this post is about, right in your browser:"
  btn: "Open JSON Editor"
locales: ["en"]
draft: true
---

# JSON Editor Component: Vue, Web Component & CDN (Open Source)

Most JSON editors on the web fall into one of two camps: a read-only viewer you point at some JSON, or an editor welded to a single framework. If you need a *full* JSON editor — validation with error locations, a tree you can actually edit, a table for arrays — and you want to drop it into any stack without rewriting it, the options are thin.

We open-sourced the editor that powers [JSON Toolbox](https://jsontoolbox.cc) as a standalone package: **`@kbmjj123/json-editor`**. It is one editor, three surfaces, all processing in the browser. Your JSON never leaves the device.

- Live playground: [jsontoolbox.cc/developers](https://jsontoolbox.cc/developers)
- Source: [github.com/kbmjj123/jsontoolbox.cc/tree/main/packages/json-editor](https://github.com/kbmjj123/jsontoolbox.cc/tree/main/packages/json-editor)

## Three ways to use it

You do not have to commit to a framework.

**Vue 3 component**

```bash
npm install @kbmjj123/json-editor
# plus the Vue 3 + CodeMirror 6 peer dependencies (see the README)
```

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { JsonEditor } from '@kbmjj123/json-editor'
import '@kbmjj123/json-editor/style.css'

const value = ref('{"name": "JSON Toolbox"}')
</script>

<template>
  <JsonEditor v-model="value" view="both" theme="auto" locale="en" />
</template>
```

**Web Component** — works in any framework, or none:

```ts
import { registerJsonEditor } from '@kbmjj123/json-editor/wc'
import '@kbmjj123/json-editor/style.css'

registerJsonEditor()
```

```html
<json-editor value='{"hello": "world"}' view="both" theme="light"></json-editor>
```

**CDN script tag** — no build step, Vue and CodeMirror already bundled:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@kbmjj123/json-editor@latest/dist/json-editor.iife.css">
<script src="https://cdn.jsdelivr.net/npm/@kbmjj123/json-editor@latest/dist/json-editor.iife.js"></script>

<json-editor value='{"hello": "world"}' view="both" theme="light"></json-editor>
```

The same component is also on [unpkg](https://unpkg.com/@kbmjj123/json-editor) and [cdnjs](https://cdnjs.com).

## What you get

- **CodeMirror 6 editor** with JSON syntax highlighting, line numbers, and error-line highlighting.
- **Live validation** — parse errors report line and column, with a one-click jump to the offending line.
- **Format / minify** from the toolbar.
- **Tree view** — collapse and expand nodes, search in five modes (key, value, path, all, or a JSONPath expression), and copy a path, JSONPath, or value.
- **Node editing** — rename, add, and remove nodes, batch operations, and undo/redo.
- **Table view** — a top-level array of objects renders as a sortable table; hide/show columns and export to CSV.
- **Value inspector** — click a leaf value to recognize colors, timestamps, JWTs, and Base64 (with inline image preview).
- **Sensitive-field masking** — redact values at configured paths (for example `users[0].email`) as `••••`.
- **Light / dark / auto theming** via CSS custom properties, plus English and Chinese UI.
- **Zero runtime dependencies** in the CDN bundle, and a small peer-dependency footprint for the npm build.
- **Opt-in attribution** — an `attribution` badge is available but off by default; it is never added without consent.

## How it compares

| | @kbmjj123/json-editor | svelte-jsoneditor | jsoneditor | react-json-view |
|---|---|---|---|---|
| Drop-in `<json-editor>` custom element | ✅ | ❌ | ❌ | ❌ |
| Primary framework | Vue 3 | Svelte | Vanilla JS | React |
| Tree / table / text views | ✅ | ✅ | Tree/text/preview | Tree only |
| Sensitive-field masking | ✅ | ❌ | ❌ | ❌ |
| JSON Schema validation | ❌ | ✅ | ✅ | ❌ |
| Handles 100 MB+ documents | ❌ | ✅ (512 MB) | ✅ (500 MB) | ❌ |

The table is deliberately honest about the trade-offs. `svelte-jsoneditor` is the
more feature-complete heavyweight — JSON Schema validation, query and transform,
and documents up to 512 MB. Where this editor is different is the *drop-in*
ergonomics: a real `<json-editor>` custom element that auto-registers from a
script tag with no wrapper code, a Vue-first component, and sensitive-field
masking for privacy-sensitive payloads.

## Use only the pieces you need

If you already have your own editor and only want the tree or the table, import them directly from the `/vue` subpath:

```vue
<script setup lang="ts">
import { TreeView, TableView } from '@kbmjj123/json-editor/vue'
import '@kbmjj123/json-editor/style.css'

const text = '{"users":[{"name":"Ada","email":"ada@example.com"}]}'
const parsedArray = [{ name: 'Ada', email: 'ada@example.com' }]
</script>

<template>
  <TreeView :text="text" :editable="false" :masked="true" :sensitive-paths="['users[0].email']" />
  <TableView :value="parsedArray" />
</template>
```

The package also exposes a framework-agnostic core (`parseJson`, `formatJson`, `buildTree`, `searchTree`) from `@kbmjj123/json-editor/core` if you only want the utilities.

## What it does not do yet

Being honest about the edges:

- It is still `0.x`, so the API may shift between minor releases.
- Vue 3 is the first-class integration; the Web Component is a wrapper around the same component.
- Massive files are out of scope for the package — the site ships a separate streamed viewer for very large documents. This editor targets normal-sized, human-authored JSON.

## Where to go next

- Embed it from the [developers page](https://jsontoolbox.cc/developers), which has the full install and API reference.
- See the same editor driving the flagship [JSON Editor](https://jsontoolbox.cc/tools/format/json-editor) tool.
- If you work with JSON beyond editing, the toolbox has a [JSON to CSV](https://jsontoolbox.cc/tools/convert/json-to-csv) converter, a [JSONPath tester](https://jsontoolbox.cc/tools/format/json-path-tester), and a [JSON minifier](https://jsontoolbox.cc/tools/format/json-minifier), all client-side.

The whole package is MIT-licensed. If you embed it on a public page, enabling the optional `attribution` badge is the easiest way to support the project.
