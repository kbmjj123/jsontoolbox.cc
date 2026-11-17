---
title: Entwickler & Einbettung
description: Nutze den JSON-Toolbox-Editor in deinem eigenen Projekt — Vue-3-Komponente, Web Component oder einfaches Script-Tag. Kostenlos, Open Source und 100 % clientseitig.
updatedAt: 2026-11-11
---

## Paket installieren

```bash
npm install @kbmjj123/json-editor
# oder
pnpm add @kbmjj123/json-editor
```

Peer-Dependencies (Vue 3 + CodeMirror 6) müssen vom Host installiert werden:

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

## CDN / Script-Tag

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@kbmjj123/json-editor@latest/dist/json-editor.iife.css">
<script src="https://cdn.jsdelivr.net/npm/@kbmjj123/json-editor@latest/dist/json-editor.iife.js"></script>

<json-editor value='{"hello": "world"}' theme="dark"></json-editor>
```

Das CDN-Bundle ist auch auf [unpkg](https://unpkg.com/@kbmjj123/json-editor) verfügbar.

## Funktionen

- CodeMirror-6-Editor mit JSON-Syntax-Hervorhebung und Zeilennummern
- Live-Validierung mit Fehlerzeilen-Position und Sprung per Klick
- Formatieren-/Minimieren-Aktionen in der Symbolleiste
- Schreibgeschützte Baumansicht mit Auf-/Zuklappen, Suche, Kopieren von Pfad/Wert
- Helles/dunkles/automatisches Design
- Optionales `attribution`-Abzeichen für einen natürlichen Backlink

## Open-Source-Projekte

JSON Toolbox wird als vier getrennte Repositories gepflegt. Jedes Projekt ist
in sich geschlossen und verlinkt auf diese Website.

| Repository | Was es ist | Quelle |
|---|---|---|
| Website | Diese Nuxt-4-Website: clientseitige Tools zum Formatieren, Validieren, Umwandeln und Anzeigen von JSON | [GitHub](https://github.com/kbmjj123/jsontoolbox.cc) |
| `@kbmjj123/json-editor` | Die auf npm veröffentlichte Editor-Bibliothek — Vue-3-Komponente, Web Component oder CDN-Script | [GitHub](https://github.com/kbmjj123/json-editor) |
| Browser-Erweiterung | Chrome/Edge-MV3-Erweiterung, die rohe JSON-Seiten als schreibgeschützten Baum darstellt | [GitHub](https://github.com/kbmjj123/json-browser-plugins) |
| Obsidian-Plugin | Umfangreicher JSON/YAML-Viewer für Obsidian mit 14 Arten von Inline-Vorschauen | [GitHub](https://github.com/kbmjj123/json-toolbox) |

## Quelle & Lizenz

- [GitHub-Repository](https://github.com/kbmjj123/json-editor)
- [npm-Paket](https://www.npmjs.com/package/@kbmjj123/json-editor)
- [MIT-Lizenz](https://github.com/kbmjj123/json-editor/blob/main/LICENSE)
