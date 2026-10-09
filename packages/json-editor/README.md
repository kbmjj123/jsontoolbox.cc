# @kbmjj123/json-editor

A framework-agnostic JSON editor for the web: CodeMirror 6 editing, live
validation with error-line location, format/minify, and a searchable read-only
tree view. Use it as a **Vue 3 component**, a **custom element
(`<json-editor>`)**, or a plain **script tag** from a CDN.

All processing happens in the browser — your JSON never leaves the device.

- [Demo / playground](https://jsontoolbox.cc/developers)
- [Package source](https://github.com/kbmjj123/jsontoolbox.cc/tree/main/packages/json-editor)

---

## Features

- **CodeMirror 6 editor** with JSON syntax highlighting, line numbers and error
  line highlighting.
- **Live validation** — reports parse errors with line/column location and a
  one-click jump to the error line.
- **Format / minify** toolbar actions.
- **Read-only tree view** — collapse/expand, search keys and values, copy path,
  JSONPath or value.
- **Three view modes** — editor only, tree only, or split side-by-side.
- **Light / dark / auto** theming via CSS custom properties.
- **Zero runtime dependencies** for the CDN bundle (Vue + CodeMirror are
  bundled).
- **Small Vue peer-dependency footprint** for the npm build.
- **Optional attribution badge** (`attribution` prop) to help visitors find the
  original project — default is **off**.

---

## Install

### npm / pnpm / yarn

```bash
npm install @kbmjj123/json-editor
# or
pnpm add @kbmjj123/json-editor
```

Peer dependencies (Vue 3 + CodeMirror 6 packages) must be installed by the
consumer:

```bash
npm install vue @codemirror/commands @codemirror/lang-json @codemirror/language @codemirror/state @codemirror/view @lezer/highlight
```

### CDN / script tag

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@kbmjj123/json-editor@latest/dist/json-editor.iife.css">
<script src="https://cdn.jsdelivr.net/npm/@kbmjj123/json-editor@latest/dist/json-editor.iife.js"></script>

<json-editor
  value='{"hello": "world"}'
  view="both"
  theme="light"
></json-editor>
```

The CDN build is also available on [unpkg](https://unpkg.com/@kbmjj123/json-editor)
and can be submitted to [cdnjs](https://cdnjs.com).

---

## Usage

### Vue 3

```vue
<script setup lang="ts">
import { ref } from 'vue'
import JsonEditor from '@kbmjj123/json-editor'
import '@kbmjj123/json-editor/style.css'

const value = ref('{"name": "JSON Toolbox"}')
</script>

<template>
  <JsonEditor
    v-model="value"
    v-model:view="view"
    theme="dark"
    locale="en"
    height="400px"
  />
</template>
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `modelValue` / `value` | `string` | `""` | JSON text. |
| `view` | `'editor' \| 'tree' \| 'both'` | `'both'` | Active view. |
| `theme` | `'light' \| 'dark' \| 'auto'` | `'auto'` | Theme. |
| `locale` | `'en' \| 'zh'` | `'en'` | UI language. |
| `indent` | `2 \| 4 \| 'tab'` | `2` | Formatter indentation. |
| `readOnly` | `boolean` | `false` | Disable editing. |
| `height` | `string` | `'420px'` | Editor height. |
| `placeholder` | `string` | `""` | Placeholder text. |
| `maxBytes` | `number` | `0` | Paste size limit (0 = unlimited). |
| `bordered` | `boolean` | `true` | Show outer border. |
| `showStatus` | `boolean` | `true` | Show status bar. |
| `attribution` | `boolean` | `false` | Show "Powered by jsontoolbox.cc" badge. |
| `attributionUrl` | `string` | `'https://jsontoolbox.cc'` | Attribution link URL. |

#### Events

| Event | Payload | Description |
|-------|---------|-------------|
| `update:modelValue` / `input` | `string` | Text changed. |
| `update:view` | `'editor' \| 'tree' \| 'both'` | View changed. |
| `error` | `{ message, location }` | Validation error. |
| `select` | `{ path, jsonPath, value }` | Tree node selected. |

---

### Web Component / custom element

Register manually if you do not use the CDN bundle (which auto-registers):

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

By default the element renders into an **open shadow root**, so the page CSS
cannot leak in. Set `use-shadow="false"` to render into the light DOM instead.

---

### Imperative API

Useful when you want full control over the host element:

```ts
import { defineJsonEditor } from '@kbmjj123/json-editor/wc'
import '@kbmjj123/json-editor/style.css'

const editor = defineJsonEditor(document.getElementById('host'), {
  value: '{"a": 1}',
  view: 'editor',
  theme: 'dark',
})

editor.format()
editor.on('change', (value) => console.log(value))
editor.destroy()
```

---

### Framework-agnostic core

If you only need JSON utilities, import the core module directly:

```ts
import { parseJson, formatJson, buildTree, searchTree } from '@kbmjj123/json-editor/core'
```

---

## Styling

The component ships with its own CSS and uses the `--je-*` custom property
namespace. Override variables in your own stylesheet:

```css
:root {
  --je-bg: #ffffff;
  --je-fg: #1f2937;
  --je-key: #0451a5;
  --je-string: #a31515;
  --je-number: #098658;
}
```

Dark mode variables are applied automatically when `theme="dark"` or when an
ancestor has `.je-dark`.

---

## Backlinks / attribution

If you embed the editor on a public page, enabling the optional attribution
badge (`attribution` prop) is the easiest way to give the project a natural
backlink. It is **off by default** and never added without your consent.

---

## License

[MIT](./LICENSE)
