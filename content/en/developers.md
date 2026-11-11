---
title: Developers & Embed
description: Use the JSON Toolbox editor in your own project — Vue 3 component, Web Component, or plain script tag. Free, open source, and 100% client-side.
updatedAt: 2026-11-11
---

## Get the package

```bash
npm install @kbmjj123/json-editor
# or
pnpm add @kbmjj123/json-editor
```

Peer dependencies (Vue 3 + CodeMirror 6) must be installed by the host:

```bash
npm install vue @codemirror/commands @codemirror/lang-json @codemirror/language @codemirror/state @codemirror/view @lezer/highlight
```

## Vue 3

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { JsonEditor } from '@kbmjj123/json-editor'
import '@kbmjj123/json-editor/style.css'

const value = ref('{"hello": "world"}')
</script>

<template>
  <JsonEditor v-model="value" view="both" theme="auto" locale="en" />
</template>
```

## Web Component

```ts
import { registerJsonEditor } from '@kbmjj123/json-editor/wc'
import '@kbmjj123/json-editor/style.css'

registerJsonEditor()
```

```html
<json-editor
  value='{"hello": "world"}'
  view="both"
  theme="light"
  height="320px"
></json-editor>
```

## CDN / script tag

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@kbmjj123/json-editor@latest/dist/json-editor.iife.css">
<script src="https://cdn.jsdelivr.net/npm/@kbmjj123/json-editor@latest/dist/json-editor.iife.js"></script>

<json-editor value='{"hello": "world"}' theme="dark"></json-editor>
```

The CDN bundle is also available on [unpkg](https://unpkg.com/@kbmjj123/json-editor).

## Features

- CodeMirror 6 editor with JSON syntax highlighting and line numbers
- Live validation with error line location and one-click jump
- Format / minify toolbar actions
- Read-only tree view with collapse/expand, search, copy path/value
- Light / dark / auto theming
- Optional `attribution` badge for a natural backlink

## Open-source projects

JSON Toolbox is maintained as four separate repositories. Each project is
self-contained and links back to this site.

| Repository | What it is | Source |
|---|---|---|
| Site | This Nuxt 4 site: client-side tools to format, validate, convert and view JSON | [GitHub](https://github.com/kbmjj123/jsontoolbox.cc) |
| `@kbmjj123/json-editor` | The editor library published on npm — Vue 3 component, Web Component or CDN script | [GitHub](https://github.com/kbmjj123/json-editor) |
| Browser extension | Chrome/Edge MV3 extension that turns raw JSON pages into a read-only tree | [GitHub](https://github.com/kbmjj123/json-browser-plugins) |
| Obsidian plugin | Rich JSON/YAML viewer for Obsidian with 14 kinds of inline previews | [GitHub](https://github.com/kbmjj123/json-toolbox) |

## Source & license

- [GitHub repository](https://github.com/kbmjj123/json-editor)
- [npm package](https://www.npmjs.com/package/@kbmjj123/json-editor)
- [MIT license](https://github.com/kbmjj123/json-editor/blob/main/LICENSE)
