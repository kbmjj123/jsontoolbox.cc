---
title: 开发者与嵌入
description: 在你自己的项目中使用 JSON Toolbox 编辑器 —— Vue 3 组件、Web Component 或纯 script 标签。免费、开源、100% 客户端。
updatedAt: 2026-10-08
---

## 安装

```bash
npm install @kbmjj123/json-editor
# 或
pnpm add @kbmjj123/json-editor
```

宿主项目需要自行安装 Vue 3 与 CodeMirror 6 对等依赖：

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
  <JsonEditor v-model="value" view="both" theme="auto" locale="zh" />
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

## CDN / script 标签

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@kbmjj123/json-editor@latest/dist/json-editor.iife.css">
<script src="https://cdn.jsdelivr.net/npm/@kbmjj123/json-editor@latest/dist/json-editor.iife.js"></script>

<json-editor value='{"hello": "world"}' theme="dark"></json-editor>
```

CDN 包也可通过 [unpkg](https://unpkg.com/@kbmjj123/json-editor) 获取。

## 功能

- 基于 CodeMirror 6 的编辑器，支持 JSON 语法高亮与行号
- 实时校验，显示错误行列并支持一键定位
- 格式化 / 压缩工具栏
- 只读树视图：折叠展开、搜索、复制路径与值
- 浅色 / 深色 / 自动主题
- 可选 `attribution` 角标，自然获得反向链接

## 源码与许可

- [GitHub 仓库](https://github.com/kbmjj123/jsontoolbox.cc)
- [npm 包](https://www.npmjs.com/package/@kbmjj123/json-editor)
- [MIT 许可证](https://github.com/kbmjj123/jsontoolbox.cc/blob/main/packages/json-editor/LICENSE)
