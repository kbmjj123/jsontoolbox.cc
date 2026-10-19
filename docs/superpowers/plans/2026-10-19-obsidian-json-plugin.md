# Obsidian 富 JSON 查看器插件 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 jsontoolbox.cc monorepo 内新建自包含的 Obsidian 插件 `plugins/obsidian-json-toolbox/`——命令触发的富 JSON 查看器（可折叠树 + 14 类资源内联预览）+ 格式化/校验/JSON↔YAML/表格工具，为后续剥离成独立 repo 提交社区市场、获取指向 jsontoolbox.cc 的反向链接做准备。

**Architecture:** 插件是完全自包含的目录，不引用站点 `app/` 内部任何路径。分三层：L1 纯逻辑（`mediaPreview.ts` 检测/解码、`jsonTree.ts` 树模型、`commands.ts` 纯函数）、L3 DOM 渲染（`treeView.ts` 用 `HTMLElement` 渲染树与内联预览）、Obsidian 适配层（`main.ts` 命令注册、`viewerModal.ts`、`settings.ts`）。`mediaPreview.ts` 从站点复制并标注同源，是插件差异化的核心。

**Tech Stack:** TypeScript 5、Obsidian API（`obsidian` 类型包）、esbuild（构建，由开发者本地执行）、Vitest + jsdom（测试）、js-yaml（JSON↔YAML）。

## Global Constraints

（以下每条对所有任务生效，逐字摘自 spec）

- 目录：`plugins/obsidian-json-toolbox/`；`pnpm-workspace.yaml` 追加 `plugins/*`
- **自包含铁律**：禁止 import `~/`、`app/` 内部路径；只允许依赖公开 npm 包与自身 `src/`
- 依赖：`obsidian`（types）、`esbuild`、`typescript`、`js-yaml`、`vitest`、`jsdom`
- 离线可用：除"资源预览"外不发起网络请求；无遥测、无账号、无云同步
- 命令 ID 固定：`open-json-viewer`、`format-json`、`validate-json`、`json-yaml-toggle`、`json-to-table`
- 资源预览覆盖 14 类：color / image / audio / video / pdf / url / email / timestamp / jwt / base64 / uuid / ip / markdown / regex，沿用 `detectValueKind` 的检测顺序（最具体→最宽泛）
- 外链四处：README 顶部、`manifest.json` 的 `authorUrl`、设置页 About、Modal 底部；锚文本用品牌名 "JSON Toolbox" 或裸域名 `jsontoolbox.cc`，不堆关键词
- manifest id：`json-toolbox`（若已被占用则 `json-toolbox-viewer`）
- **不在 MVP**：JSON 压缩 Minify、生成 TS/Go 类型、代码块内联渲染（方案 A）
- 构建（`esbuild` 产出 `main.js`）由开发者本地执行；AI 只写代码、文档、跑测试与类型检查

## File Structure

```
plugins/obsidian-json-toolbox/
  manifest.json        插件元信息（含 authorUrl 外链）；剥离后位于 repo 根
  package.json         依赖与脚本（dev/build/test/typecheck）
  tsconfig.json        TS 配置（strict，DOM lib）
  esbuild.config.mjs   打包配置（external: obsidian/electron/codemirror）
  vitest.config.ts     测试配置（jsdom 环境）
  styles.css           树/预览样式
  README.md            功能说明 + 安装 + 外链（剥离后即社区市场页源）
  src/
    main.ts            插件入口：注册 5 个命令 + 设置页
    mediaPreview.ts    L1：14 类检测/解码（复制自 app/utils/mediaPreview.ts）
    jsonTree.ts        L1：JSON → 树模型 + 解析错误封装
    treeView.ts        L3：DOM 渲染可折叠树 + 内联预览 + 表格渲染
    viewerModal.ts     Obsidian Modal 容器（tree / table 两种模式）
    commands.ts        L1：格式化/校验/JSON↔YAML/表格 纯函数
    settings.ts        设置页 About（外链）
  src/__tests__/
    mediaPreview.test.ts
    jsonTree.test.ts
    treeView.test.ts
    commands.test.ts
```

---

### Task 1: 脚手架与 workspace 接入

**Files:**
- Create: `plugins/obsidian-json-toolbox/package.json`
- Create: `plugins/obsidian-json-toolbox/tsconfig.json`
- Create: `plugins/obsidian-json-toolbox/esbuild.config.mjs`
- Create: `plugins/obsidian-json-toolbox/vitest.config.ts`
- Create: `plugins/obsidian-json-toolbox/manifest.json`
- Create: `plugins/obsidian-json-toolbox/styles.css`
- Create: `plugins/obsidian-json-toolbox/README.md`
- Modify: `pnpm-workspace.yaml`

- [ ] **Step 1: 创建 package.json**

```json
{
  "name": "obsidian-json-toolbox",
  "version": "1.0.0",
  "private": true,
  "description": "Obsidian plugin: rich JSON viewer with inline previews for images, colors, links, timestamps, JWT and more.",
  "type": "module",
  "license": "MIT",
  "scripts": {
    "dev": "node esbuild.config.mjs --watch",
    "build": "node esbuild.config.mjs --production",
    "test": "vitest run",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "js-yaml": "^4.1.0"
  },
  "devDependencies": {
    "@types/js-yaml": "^4.0.9",
    "@types/node": "^22.10.2",
    "esbuild": "^0.24.2",
    "jsdom": "^25.0.1",
    "obsidian": "^1.7.2",
    "typescript": "^5.7.3",
    "vitest": "^2.1.8"
  }
}
```

- [ ] **Step 2: 创建 tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2018",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["DOM", "ES2018"],
    "strict": true,
    "noUnusedLocals": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "types": ["node"]
  },
  "include": ["src/**/*.ts"]
}
```

- [ ] **Step 3: 创建 esbuild.config.mjs**

```js
import esbuild from 'esbuild'
import process from 'node:process'

const production = process.argv.includes('--production')
const watch = process.argv.includes('--watch')

const context = await esbuild.context({
  entryPoints: ['src/main.ts'],
  bundle: true,
  external: ['obsidian', 'electron', '@codemirror/autocomplete', '@codemirror/collab', '@codemirror/commands', '@codemirror/language', '@codemirror/lint', '@codemirror/search', '@codemirror/state', '@codemirror/view', '@lezer/common', '@lezer/highlight', '@lezer/lr', 'node:*'],
  format: 'cjs',
  target: 'es2018',
  logLevel: 'info',
  sourcemap: production ? false : 'inline',
  treeShaking: true,
  outfile: 'main.js',
  minify: production,
})

if (watch) {
  await context.watch()
} else {
  await context.rebuild()
  await context.dispose()
}
```

- [ ] **Step 4: 创建 vitest.config.ts**

```ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.ts'],
  },
})
```

- [ ] **Step 5: 创建 manifest.json（含外链 authorUrl）**

```json
{
  "id": "json-toolbox",
  "name": "JSON Toolbox",
  "version": "1.0.0",
  "minAppVersion": "1.4.0",
  "description": "View JSON as a collapsible rich tree with inline previews for images, colors, links, timestamps, JWT and more. Format, validate, convert to YAML or a table.",
  "author": "kbmjj123",
  "authorUrl": "https://jsontoolbox.cc",
  "isDesktopOnly": false
}
```

- [ ] **Step 6: 创建 styles.css（基础样式）**

```css
.json-toolbox-tree {
  font-family: var(--font-monospace, monospace);
  font-size: var(--font-ui-smaller, 12px);
  line-height: 1.5;
  overflow: auto;
}
.json-toolbox-node { padding: 1px 2px; border-radius: 3px; }
.json-toolbox-node:hover { background: var(--background-modifier-hover); }
.json-toolbox-toggle {
  cursor: pointer;
  color: var(--text-faint);
  width: 14px;
  display: inline-block;
  user-select: none;
}
.json-toolbox-key { color: var(--text-accent); }
.json-toolbox-punct { color: var(--text-faint); }
.json-toolbox-val-string { color: var(--color-green, #6a9955); }
.json-toolbox-val-number { color: var(--color-blue, #569cd6); }
.json-toolbox-val-boolean { color: var(--color-orange, #ce9178); }
.json-toolbox-val-null { color: var(--text-faint); font-style: italic; }
.json-toolbox-swatch {
  display: inline-block;
  width: 12px;
  height: 12px;
  border-radius: 2px;
  border: 1px solid var(--background-modifier-border);
  vertical-align: middle;
  margin-right: 4px;
}
.json-toolbox-thumb {
  display: block;
  max-width: 160px;
  max-height: 100px;
  margin: 2px 0 4px 18px;
  border-radius: 4px;
  border: 1px solid var(--background-modifier-border);
  object-fit: contain;
}
.json-toolbox-kind {
  font-size: 10px;
  color: var(--text-faint);
  border: 1px solid var(--background-modifier-border);
  border-radius: 8px;
  padding: 0 5px;
  margin-left: 6px;
}
.json-toolbox-table {
  border-collapse: collapse;
  font-size: var(--font-ui-smaller, 12px);
  width: 100%;
}
.json-toolbox-table th,
.json-toolbox-table td {
  border: 1px solid var(--background-modifier-border);
  padding: 4px 8px;
  text-align: left;
}
.json-toolbox-footer {
  margin-top: 12px;
  font-size: var(--font-ui-smaller, 12px);
  color: var(--text-faint);
}
.json-toolbox-error { color: var(--color-red, #e06c75); }
```

- [ ] **Step 7: 创建 README.md（含外链）**

```markdown
# JSON Toolbox — Obsidian Plugin

View JSON in Obsidian as a collapsible **rich tree** with inline previews for
images, colors, links, timestamps, JWTs, Base64 and more — then format,
validate, convert to YAML, or turn it into a table.

🌐 **Full online version with 30+ JSON tools:** https://jsontoolbox.cc

## Commands

| Command | What it does |
|---|---|
| Open JSON Viewer | View selected JSON as a collapsible rich tree with inline previews |
| Format JSON | Pretty-print selected JSON (2-space indent) |
| Validate JSON | Validate selected JSON and locate the error |
| JSON ↔ YAML | Convert selection between JSON and YAML (auto-detects direction) |
| JSON → Table/CSV | Turn a JSON array/object into a table |

## Inline previews

Detected automatically on leaf values: color, image, audio, video, pdf, url,
email, timestamp, jwt, base64, uuid, ip, markdown, regex.

## Privacy

All processing happens locally in Obsidian. No telemetry, no accounts, no cloud.

## Install

Copy `main.js`, `manifest.json`, `styles.css` into
`<vault>/.obsidian/plugins/json-toolbox/`.
```

- [ ] **Step 8: 修改 pnpm-workspace.yaml 追加 plugins/***

```yaml
packages:
  - packages/*
  - plugins/*

ignoredBuiltDependencies:
  - '@parcel/watcher'
  - '@sentry/cli'
  - better-sqlite3
  - esbuild
  - unrs-resolver
  - vue-demi
```

- [ ] **Step 9: 安装依赖（开发者本地执行）**

Run: `cd /Users/zhenggl/Desktop/personal_upgrade/json/jsontoolbox.cc && pnpm install`
Expected: 新增 `obsidian-json-toolbox` workspace 包，依赖安装完成，无报错。

- [ ] **Step 10: 类型检查**

Run: `cd plugins/obsidian-json-toolbox && pnpm typecheck`
Expected: 通过（`src` 暂为空或后续任务填充；此时 include 无文件可能报错，属正常，Task 2 填充后即可通过）。

- [ ] **Step 11: Commit**

```bash
git add plugins/obsidian-json-toolbox pnpm-workspace.yaml
git commit -m "feat(obsidian-plugin): 脚手架与 workspace 接入"
```

---

### Task 2: mediaPreview.ts（复制 + 单测）

**Files:**
- Create: `plugins/obsidian-json-toolbox/src/mediaPreview.ts`
- Create: `plugins/obsidian-json-toolbox/src/__tests__/mediaPreview.test.ts`

**Interfaces:**
- Produces（后续任务依赖）：
  - `detectValueKind(value: unknown): ValueKind | null`
  - `ValueKind = 'image' | 'audio' | 'video' | 'pdf' | 'url' | 'email' | 'color' | 'timestamp' | 'jwt' | 'base64' | 'uuid' | 'ip' | 'markdown' | 'regex'`
  - `isColorValue(v: unknown): boolean`、`getColorStyle(v: string): string | null`
  - `isPossibleImageUrl(v: unknown): boolean`、`isImageUrl(v: unknown): boolean`
  - `decodeJwt(v: string): JwtParts | null`（`{ header: unknown; payload: unknown }`）
  - `decodeBase64(v: string): DecodedBase64 | null`（`{ kind: 'image'|'text'; dataUrl?: string; text?: string; bytes: number }`）
  - `formatTimestamps(v: string | number): TimestampViews | null`（`{ local: string; utc: string; iso: string }`）
  - `isRemoteResource(kind: ValueKind | null): boolean`
  - `truncate(value: string, max?: number): string`

- [ ] **Step 1: 完整复制 mediaPreview.ts 并加同源注释**

复制 `app/utils/mediaPreview.ts` 的**全部内容（357 行，勿改写任何逻辑）**到 `plugins/obsidian-json-toolbox/src/mediaPreview.ts`，并在文件最顶部插入：

```ts
/**
 * COPIED FROM jsontoolbox.cc — app/utils/mediaPreview.ts
 * Single source of truth lives in the site repo. This copy keeps the Obsidian
 * plugin self-contained so it can be extracted into its own repository.
 * If you change detection rules here, mirror the change back to the site.
 */
```

- [ ] **Step 2: 写失败测试**

```ts
// src/__tests__/mediaPreview.test.ts
import { describe, it, expect } from 'vitest'
import {
  detectValueKind,
  decodeJwt,
  decodeBase64,
  formatTimestamps,
  isRemoteResource,
} from '../mediaPreview'

describe('detectValueKind', () => {
  it('detects colors', () => {
    expect(detectValueKind('#ff0000')).toBe('color')
    expect(detectValueKind('rgb(1,2,3)')).toBe('color')
  })
  it('detects image urls', () => {
    expect(detectValueKind('https://cdn.example.com/a.png')).toBe('image')
  })
  it('detects audio/video/pdf before generic url', () => {
    expect(detectValueKind('https://x.com/a.mp3')).toBe('audio')
    expect(detectValueKind('https://x.com/a.mp4')).toBe('video')
    expect(detectValueKind('https://x.com/a.pdf')).toBe('pdf')
  })
  it('detects jwt, uuid, email, ip', () => {
    expect(detectValueKind('a.b.c')).toBe('jwt')
    expect(detectValueKind('123e4567-e89b-12d3-a456-426614174000')).toBe('uuid')
    expect(detectValueKind('a@b.com')).toBe('email')
    expect(detectValueKind('192.168.1.1')).toBe('ip')
  })
  it('detects timestamps (epoch and ISO)', () => {
    expect(detectValueKind(1700000000)).toBe('timestamp')
    expect(detectValueKind('2023-11-14T22:13:20Z')).toBe('timestamp')
  })
  it('detects url, base64, markdown, regex', () => {
    expect(detectValueKind('https://example.com')).toBe('url')
    expect(detectValueKind('aGVsbG8gd29ybGQgd29ybGQ=')).toBe('base64')
    expect(detectValueKind('# Title\n\n**bold**')).toBe('markdown')
    expect(detectValueKind('/^abc$/gi')).toBe('regex')
  })
  it('returns null for plain strings', () => {
    expect(detectValueKind('hello')).toBeNull()
  })
})

describe('decodeJwt', () => {
  it('decodes header and payload', () => {
    const header = btoa(JSON.stringify({ alg: 'HS256' }))
    const payload = btoa(JSON.stringify({ sub: '123' }))
    const jwt = `${header}.${payload}.sig`
    const parts = decodeJwt(jwt)
    expect(parts).not.toBeNull()
    expect(parts!.payload).toEqual({ sub: '123' })
  })
})

describe('decodeBase64', () => {
  it('decodes plain base64 to text', () => {
    const decoded = decodeBase64(btoa('hello world'))
    expect(decoded?.kind).toBe('text')
    expect(decoded?.text).toBe('hello world')
  })
})

describe('formatTimestamps', () => {
  it('formats epoch seconds', () => {
    expect(formatTimestamps(1700000000)?.iso).toBe('2023-11-14T22:13:20.000Z')
  })
})

describe('isRemoteResource', () => {
  it('flags remote kinds only', () => {
    expect(isRemoteResource('image')).toBe(true)
    expect(isRemoteResource('color')).toBe(false)
  })
})
```

- [ ] **Step 3: 运行测试确认通过**

Run: `cd plugins/obsidian-json-toolbox && pnpm test`
Expected: PASS（复制的逻辑完整，测试应直接通过）。

- [ ] **Step 4: Commit**

```bash
git add plugins/obsidian-json-toolbox/src
git commit -m "feat(obsidian-plugin): 移植 mediaPreview 14 类资源检测与单测"
```

---

### Task 3: jsonTree.ts（树模型 + 解析）

**Files:**
- Create: `plugins/obsidian-json-toolbox/src/jsonTree.ts`
- Create: `plugins/obsidian-json-toolbox/src/__tests__/jsonTree.test.ts`

**Interfaces:**
- Consumes: 无
- Produces:
  - `type JsonNode = { key: string | number | null; value: unknown; path: string; kind: 'object' | 'array' | 'primitive'; children: JsonNode[] }`
  - `buildTree(value: unknown, key?: string | number | null, path?: string): JsonNode`
  - `parseJson(input: string): { ok: true; root: unknown } | { ok: false; error: string }`

- [ ] **Step 1: 写失败测试**

```ts
// src/__tests__/jsonTree.test.ts
import { describe, it, expect } from 'vitest'
import { buildTree, parseJson } from '../jsonTree'

describe('parseJson', () => {
  it('parses valid JSON', () => {
    expect(parseJson('{"a":1}')).toEqual({ ok: true, root: { a: 1 } })
  })
  it('reports error for invalid JSON', () => {
    const result = parseJson('{"a":}')
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toBeTruthy()
  })
})

describe('buildTree', () => {
  it('builds nested nodes with paths', () => {
    const root = buildTree({ a: { b: [1, 2] } })
    expect(root.kind).toBe('object')
    expect(root.children[0].key).toBe('a')
    expect(root.children[0].children[0].key).toBe('b')
    expect(root.children[0].children[0].kind).toBe('array')
    expect(root.children[0].children[0].path).toBe('a.b')
    expect(root.children[0].children[0].children[1].path).toBe('a.b[1]')
  })
  it('marks primitives with empty children', () => {
    const root = buildTree({ n: 5 })
    expect(root.children[0].kind).toBe('primitive')
    expect(root.children[0].children).toEqual([])
  })
})
```

- [ ] **Step 2: 运行测试确认失败**

Run: `cd plugins/obsidian-json-toolbox && pnpm test`
Expected: FAIL（模块 `../jsonTree` 不存在）。

- [ ] **Step 3: 实现 jsonTree.ts**

```ts
export type JsonNode = {
  key: string | number | null
  value: unknown
  path: string
  kind: 'object' | 'array' | 'primitive'
  children: JsonNode[]
}

export function buildTree(
  value: unknown,
  key: string | number | null = null,
  path = '',
): JsonNode {
  const isObject = value !== null && typeof value === 'object' && !Array.isArray(value)
  const isArray = Array.isArray(value)

  if (isObject || isArray) {
    const entries = isArray
      ? (value as unknown[]).map((item, index) => [index, item] as const)
      : Object.entries(value as Record<string, unknown>)

    const children = entries.map(([childKey, childValue]) => {
      const childPath =
        typeof childKey === 'number'
          ? `${path}[${childKey}]`
          : path
            ? `${path}.${childKey}`
            : String(childKey)
      return buildTree(childValue, childKey, childPath)
    })

    return { key, value, path, kind: isArray ? 'array' : 'object', children }
  }

  return { key, value, path, kind: 'primitive', children: [] }
}

export type ParseResult =
  | { ok: true; root: unknown }
  | { ok: false; error: string }

export function parseJson(input: string): ParseResult {
  try {
    return { ok: true, root: JSON.parse(input) }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) }
  }
}
```

- [ ] **Step 4: 运行测试确认通过**

Run: `cd plugins/obsidian-json-toolbox && pnpm test`
Expected: PASS。

- [ ] **Step 5: Commit**

```bash
git add plugins/obsidian-json-toolbox/src
git commit -m "feat(obsidian-plugin): jsonTree 树模型与解析"
```

---

### Task 4: treeView.ts（DOM 渲染 + 14 类预览 + 表格）

**Files:**
- Create: `plugins/obsidian-json-toolbox/src/treeView.ts`
- Create: `plugins/obsidian-json-toolbox/src/__tests__/treeView.test.ts`

**Interfaces:**
- Consumes: `JsonNode`（Task 3）、`detectValueKind` / `decodeJwt` / `decodeBase64` / `formatTimestamps` / `isPossibleImageUrl` / `isColorValue` / `getColorStyle` / `truncate`（Task 2）
- Produces:
  - `renderTree(container: HTMLElement, root: JsonNode): void`
  - `renderTable(container: HTMLElement, headers: string[], rows: string[][]): void`

- [ ] **Step 1: 写失败测试**

```ts
// src/__tests__/treeView.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { renderTree, renderTable } from '../treeView'
import { buildTree } from '../jsonTree'

let container: HTMLElement
beforeEach(() => {
  container = document.createElement('div')
  document.body.appendChild(container)
})

describe('renderTree', () => {
  it('renders keys and primitive values', () => {
    renderTree(container, buildTree({ name: 'ada', age: 36 }))
    expect(container.textContent).toContain('name')
    expect(container.textContent).toContain('ada')
    expect(container.textContent).toContain('36')
  })

  it('renders a color swatch for color values', () => {
    renderTree(container, buildTree({ color: '#ff0000' }))
    const swatch = container.querySelector('.json-toolbox-swatch') as HTMLElement
    expect(swatch).toBeTruthy()
    expect(swatch.style.backgroundColor).toBe('rgb(255, 0, 0)')
  })

  it('renders an img for possible image urls', () => {
    renderTree(container, buildTree({ avatar: 'https://cdn.example.com/a.png' }))
    const img = container.querySelector('img.json-toolbox-thumb') as HTMLImageElement
    expect(img).toBeTruthy()
    expect(img.getAttribute('src')).toBe('https://cdn.example.com/a.png')
  })

  it('renders an anchor for plain urls', () => {
    renderTree(container, buildTree({ site: 'https://example.com/page' }))
    const anchor = container.querySelector('a') as HTMLAnchorElement
    expect(anchor).toBeTruthy()
    expect(anchor.getAttribute('href')).toBe('https://example.com/page')
  })

  it('renders decoded timestamp for epoch values', () => {
    renderTree(container, buildTree({ ts: 1700000000 }))
    expect(container.textContent).toContain('2023-11-14T22:13:20.000Z')
  })

  it('renders kind chip for jwt', () => {
    const jwt = `${btoa('{"alg":"HS256"}')}.${btoa('{"sub":"1"}')}.sig`
    renderTree(container, buildTree({ token: jwt }))
    expect(container.textContent?.toLowerCase()).toContain('jwt')
  })

  it('renders children collapsed by default for nested objects', () => {
    renderTree(container, buildTree({ outer: { inner: 1 } }))
    expect(container.querySelector('.json-toolbox-toggle')).toBeTruthy()
  })
})

describe('renderTable', () => {
  it('renders headers and rows', () => {
    renderTable(container, ['a', 'b'], [['1', '2'], ['3', '4']])
    expect(container.querySelectorAll('th').length).toBe(2)
    expect(container.querySelectorAll('td').length).toBe(4)
  })
})
```

- [ ] **Step 2: 运行测试确认失败**

Run: `cd plugins/obsidian-json-toolbox && pnpm test`
Expected: FAIL（模块 `../treeView` 不存在）。

- [ ] **Step 3: 实现 treeView.ts**

```ts
import type { JsonNode } from './jsonTree'
import {
  detectValueKind,
  decodeJwt,
  decodeBase64,
  formatTimestamps,
  isPossibleImageUrl,
  isColorValue,
  getColorStyle,
  truncate,
  type ValueKind,
} from './mediaPreview'

function el(tag: string, className?: string, text?: string): HTMLElement {
  const node = document.createElement(tag)
  if (className) node.className = className
  if (text !== undefined) node.textContent = text
  return node
}

function valueClass(value: unknown): string {
  if (value === null) return 'json-toolbox-val-null'
  if (value === undefined) return 'json-toolbox-val-null'
  switch (typeof value) {
    case 'string': return 'json-toolbox-val-string'
    case 'number': return 'json-toolbox-val-number'
    case 'boolean': return 'json-toolbox-val-boolean'
    default: return ''
  }
}

function formatPrimitive(value: unknown): string {
  if (value === null) return 'null'
  if (typeof value === 'string') return `"${value}"`
  return String(value)
}

/** Append a kind chip such as `jwt`, `uuid`, `ip`. */
function appendKindChip(parent: HTMLElement, kind: ValueKind): void {
  parent.appendChild(el('span', 'json-toolbox-kind', kind))
}

function renderValue(parent: HTMLElement, value: unknown): void {
  const kind = detectValueKind(value)
  const text = el('span', valueClass(value), formatPrimitive(value))

  if (isColorValue(value)) {
    const swatch = el('span', 'json-toolbox-swatch')
    swatch.style.backgroundColor = getColorStyle(String(value)) ?? ''
    parent.appendChild(swatch)
  }

  parent.appendChild(text)

  if (!kind) return

  if (kind === 'image' || (kind === 'url' && isPossibleImageUrl(value))) {
    const img = document.createElement('img')
    img.className = 'json-toolbox-thumb'
    img.src = String(value)
    img.alt = ''
    img.addEventListener('error', () => img.remove())
    parent.parentElement?.appendChild(img)
    appendKindChip(parent, 'image')
    return
  }

  if (kind === 'url' || kind === 'audio' || kind === 'video' || kind === 'pdf') {
    const anchor = document.createElement('a')
    anchor.href = String(value)
    anchor.textContent = 'open'
    anchor.setAttr?.('target', '_blank')
    anchor.setAttribute('target', '_blank')
    anchor.setAttribute('rel', 'noopener noreferrer')
    anchor.className = 'json-toolbox-kind'
    parent.appendChild(anchor)
    if (kind !== 'url') appendKindChip(parent, kind)
    return
  }

  if (kind === 'email') {
    const anchor = document.createElement('a')
    anchor.href = `mailto:${String(value)}`
    anchor.textContent = 'mailto'
    anchor.className = 'json-toolbox-kind'
    parent.appendChild(anchor)
    return
  }

  if (kind === 'timestamp') {
    const views = formatTimestamps(value as string | number)
    if (views) appendKindChip(parent, views.iso as ValueKind)
    return
  }

  if (kind === 'jwt') {
    const parts = decodeJwt(String(value))
    appendKindChip(parent, 'jwt')
    if (parts) {
      parent.appendChild(el('span', 'json-toolbox-kind', truncate(JSON.stringify(parts.payload), 80)))
    }
    return
  }

  if (kind === 'base64') {
    const decoded = decodeBase64(String(value))
    appendKindChip(parent, 'base64')
    if (decoded?.kind === 'image' && decoded.dataUrl) {
      const img = document.createElement('img')
      img.className = 'json-toolbox-thumb'
      img.src = decoded.dataUrl
      img.addEventListener('error', () => img.remove())
      parent.parentElement?.appendChild(img)
    } else if (decoded?.kind === 'text') {
      parent.appendChild(el('span', 'json-toolbox-kind', truncate(decoded.text ?? '', 80)))
    }
    return
  }

  appendKindChip(parent, kind)
}

function renderNode(parent: HTMLElement, node: JsonNode, depth: number): void {
  const row = el('div', 'json-toolbox-node')
  row.style.paddingLeft = `${depth * 14}px`

  const expandable = node.children.length > 0
  if (expandable) {
    const toggle = el('span', 'json-toolbox-toggle', '▸')
    const childBox = el('div')
    let expanded = false
    toggle.addEventListener('click', (event) => {
      event.stopPropagation()
      expanded = !expanded
      toggle.textContent = expanded ? '▾' : '▸'
      childBox.style.display = expanded ? '' : 'none'
    })
    row.appendChild(toggle)
    childBox.style.display = 'none'

    if (node.key !== null) {
      row.appendChild(el('span', 'json-toolbox-key', String(node.key)))
      row.appendChild(el('span', 'json-toolbox-punct', ': '))
    }
    row.appendChild(
      el('span', 'json-toolbox-punct', node.kind === 'array' ? `[${node.children.length}]` : `{${node.children.length}}`),
    )
    parent.appendChild(row)

    node.children.forEach((child) => renderNode(childBox, child, depth + 1))
    parent.appendChild(childBox)
    return
  }

  row.appendChild(el('span', 'w-4'))
  if (node.key !== null) {
    row.appendChild(el('span', 'json-toolbox-key', String(node.key)))
    row.appendChild(el('span', 'json-toolbox-punct', ': '))
  }
  renderValue(row, node.value)
  parent.appendChild(row)
}

export function renderTree(container: HTMLElement, root: JsonNode): void {
  container.empty?.()
  container.innerHTML = ''
  container.classList.add('json-toolbox-tree')
  root.children.forEach((child) => renderNode(container, child, 0))
  if (root.children.length === 0 && root.kind === 'primitive') {
    renderNode(container, root, 0)
  }
}

export function renderTable(container: HTMLElement, headers: string[], rows: string[][]): void {
  container.innerHTML = ''
  const table = document.createElement('table')
  table.className = 'json-toolbox-table'

  const thead = document.createElement('thead')
  const headRow = document.createElement('tr')
  headers.forEach((header) => headRow.appendChild(el('th', undefined, header)))
  thead.appendChild(headRow)
  table.appendChild(thead)

  const tbody = document.createElement('tbody')
  rows.forEach((row) => {
    const tr = document.createElement('tr')
    row.forEach((cell) => tr.appendChild(el('td', undefined, cell)))
    tbody.appendChild(tr)
  })
  table.appendChild(tbody)

  container.appendChild(table)
}
```

- [ ] **Step 4: 修正 `anchor.setAttr?.` 这行多余代码**

上面实现中有一行遗留的 `anchor.setAttr?.('target', '_blank')`，删除该行（Obsidian DOM 无此 API，保留会静默失败）。确保 `url` 分支只保留：

```ts
    anchor.setAttribute('target', '_blank')
    anchor.setAttribute('rel', 'noopener noreferrer')
```

- [ ] **Step 5: 运行测试确认通过**

Run: `cd plugins/obsidian-json-toolbox && pnpm test`
Expected: PASS（含颜色取色 `rgb(255, 0, 0)`、图片 `src`、链接 `href`、时间戳 ISO、JWT chip）。

- [ ] **Step 6: Commit**

```bash
git add plugins/obsidian-json-toolbox/src
git commit -m "feat(obsidian-plugin): treeView DOM 渲染与 14 类内联预览"
```

---

### Task 5: viewerModal.ts（Modal 容器 + 外链底部）

**Files:**
- Create: `plugins/obsidian-json-toolbox/src/viewerModal.ts`
- Create: `plugins/obsidian-json-toolbox/src/__tests__/viewerModal.test.ts`

**Interfaces:**
- Consumes: `renderTree` / `renderTable`（Task 4）、`parseJson` / `buildTree`（Task 3）
- Produces: `JsonViewerModal`（`new JsonViewerModal(app, input, mode?)`，`mode: 'tree' | 'table'`，默认 `'tree'`）

- [ ] **Step 1: 写失败测试（mock obsidian Modal）**

```ts
// src/__tests__/viewerModal.test.ts
import { describe, it, expect, vi } from 'vitest'

const contentEl = document.createElement('div')
vi.mock('obsidian', () => ({
  Modal: class {
    contentEl = contentEl
    titleEl = document.createElement('div')
    constructor(public app: unknown) {}
    open() { this.onOpen() }
    onOpen() {}
    close() {}
  },
}))

import { JsonViewerModal } from '../viewerModal'

describe('JsonViewerModal', () => {
  it('renders tree for valid JSON', () => {
    const modal = new JsonViewerModal({} as never, '{"a":1,"b":"#ff0000"}')
    modal.open()
    expect(contentEl.textContent).toContain('a')
    expect(contentEl.querySelector('.json-toolbox-swatch')).toBeTruthy()
  })

  it('renders error message for invalid JSON', () => {
    const modal = new JsonViewerModal({} as never, 'not json')
    modal.open()
    expect(contentEl.querySelector('.json-toolbox-error')).toBeTruthy()
  })

  it('renders footer link to jsontoolbox.cc', () => {
    const modal = new JsonViewerModal({} as never, '{"a":1}')
    modal.open()
    expect(contentEl.innerHTML).toContain('jsontoolbox.cc')
  })
})
```

- [ ] **Step 2: 运行测试确认失败**

Run: `cd plugins/obsidian-json-toolbox && pnpm test`
Expected: FAIL（模块 `../viewerModal` 不存在）。

- [ ] **Step 3: 实现 viewerModal.ts**

```ts
import { Modal } from 'obsidian'
import { buildTree, parseJson } from './jsonTree'
import { renderTree, renderTable } from './treeView'
import { toTable } from './commands'

export const SITE_URL = 'https://jsontoolbox.cc'

export type ViewerMode = 'tree' | 'table'

export class JsonViewerModal extends Modal {
  private readonly input: string
  private readonly mode: ViewerMode

  constructor(app: unknown, input: string, mode: ViewerMode = 'tree') {
    super(app as never)
    this.input = input
    this.mode = mode
  }

  onOpen(): void {
    this.titleEl.setText?.('JSON Toolbox')
    this.titleEl.textContent = 'JSON Toolbox'
    this.contentEl.classList.add('json-toolbox-modal')

    const parsed = parseJson(this.input.trim())
    if (!parsed.ok) {
      const error = this.contentEl.createEl?.('div', { cls: 'json-toolbox-error' })
      const node = error ?? document.createElement('div')
      if (!error) node.className = 'json-toolbox-error'
      node.textContent = `Invalid JSON: ${parsed.error}`
      if (!error) this.contentEl.appendChild(node)
      this.appendFooter()
      return
    }

    const body = document.createElement('div')
    body.className = 'json-toolbox-body'
    this.contentEl.appendChild(body)

    if (this.mode === 'table') {
      const table = toTable(this.input)
      if (table.ok) renderTable(body, table.headers, table.rows)
      else body.textContent = `Cannot build table: ${table.error}`
    } else {
      renderTree(body, buildTree(parsed.root))
    }

    this.appendFooter()
  }

  onClose(): void {
    this.contentEl.empty?.()
    this.contentEl.innerHTML = ''
  }

  private appendFooter(): void {
    const footer = document.createElement('div')
    footer.className = 'json-toolbox-footer'
    const link = document.createElement('a')
    link.href = SITE_URL
    link.textContent = 'JSON Toolbox'
    link.setAttribute('target', '_blank')
    link.setAttribute('rel', 'noopener noreferrer')
    footer.appendChild(document.createTextNode('Powered by '))
    footer.appendChild(link)
    footer.appendChild(document.createTextNode(' · jsontoolbox.cc'))
    this.contentEl.appendChild(footer)
  }
}
```

- [ ] **Step 4: 运行测试确认通过**

Run: `cd plugins/obsidian-json-toolbox && pnpm test`
Expected: PASS。

- [ ] **Step 5: Commit**

```bash
git add plugins/obsidian-json-toolbox/src
git commit -m "feat(obsidian-plugin): viewerModal 模态容器与外链底部"
```

---

### Task 6: commands.ts（格式化 / 校验 / JSON↔YAML / 表格）

**Files:**
- Create: `plugins/obsidian-json-toolbox/src/commands.ts`
- Create: `plugins/obsidian-json-toolbox/src/__tests__/commands.test.ts`

**Interfaces:**
- Consumes: `js-yaml`
- Produces（供 Task 5、Task 7 使用）:
  - `formatJson(input: string, indent?: number): { ok: true; output: string } | { ok: false; error: string }`
  - `validateJson(input: string): { ok: true } | { ok: false; error: string }`
  - `toggleJsonYaml(input: string): { ok: true; output: string; direction: 'json→yaml' | 'yaml→json' } | { ok: false; error: string }`
  - `toTable(input: string): { ok: true; headers: string[]; rows: string[][] } | { ok: false; error: string }`

- [ ] **Step 1: 写失败测试**

```ts
// src/__tests__/commands.test.ts
import { describe, it, expect } from 'vitest'
import { formatJson, validateJson, toggleJsonYaml, toTable } from '../commands'

describe('formatJson', () => {
  it('pretty-prints with 2-space indent', () => {
    const result = formatJson('{"a":1,"b":[2,3]}')
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.output).toBe('{\n  "a": 1,\n  "b": [\n    2,\n    3\n  ]\n}')
  })
  it('reports error for invalid input', () => {
    expect(formatJson('{oops').ok).toBe(false)
  })
})

describe('validateJson', () => {
  it('passes valid JSON', () => {
    expect(validateJson('{"a":1}').ok).toBe(true)
  })
  it('fails invalid JSON with message', () => {
    const result = validateJson('{"a":}')
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toContain('JSON')
  })
})

describe('toggleJsonYaml', () => {
  it('converts JSON to YAML', () => {
    const result = toggleJsonYaml('{"a":1,"b":"x"}')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.direction).toBe('json→yaml')
      expect(result.output).toContain('a: 1')
    }
  })
  it('converts YAML to JSON', () => {
    const result = toggleJsonYaml('a: 1\nb: x\n')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.direction).toBe('yaml→json')
      expect(JSON.parse(result.output)).toEqual({ a: 1, b: 'x' })
    }
  })
  it('reports error for neither JSON nor YAML', () => {
    expect(toggleJsonYaml('\t\tbroken: [').ok).toBe(false)
  })
})

describe('toTable', () => {
  it('builds table from array of objects', () => {
    const result = toTable('[{"a":1,"b":2},{"a":3,"b":4}]')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.headers).toEqual(['a', 'b'])
      expect(result.rows).toEqual([['1', '2'], ['3', '4']])
    }
  })
  it('builds key/value table from a plain object', () => {
    const result = toTable('{"a":1,"b":2}')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.headers).toEqual(['key', 'value'])
      expect(result.rows).toEqual([['a', '1'], ['b', '2']])
    }
  })
  it('rejects non-tabular input', () => {
    expect(toTable('42').ok).toBe(false)
  })
})
```

- [ ] **Step 2: 运行测试确认失败**

Run: `cd plugins/obsidian-json-toolbox && pnpm test`
Expected: FAIL（模块 `../commands` 不存在）。

- [ ] **Step 3: 实现 commands.ts**

```ts
import yaml from 'js-yaml'

export type Ok<T> = { ok: true } & T
export type Err = { ok: false; error: string }

export function formatJson(input: string, indent = 2): Ok<{ output: string }> | Err {
  try {
    return { ok: true, output: JSON.stringify(JSON.parse(input), null, indent) }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) }
  }
}

export function validateJson(input: string): Ok<Record<string, never>> | Err {
  try {
    JSON.parse(input)
    return { ok: true } as Ok<Record<string, never>>
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return { ok: false, error: `Invalid JSON: ${message}` }
  }
}

export function toggleJsonYaml(
  input: string,
): Ok<{ output: string; direction: 'json→yaml' | 'yaml→json' }> | Err {
  try {
    const parsed = JSON.parse(input)
    return { ok: true, output: yaml.dump(parsed), direction: 'json→yaml' }
  } catch {
    // not JSON — try YAML
  }
  try {
    const loaded = yaml.load(input)
    if (loaded === null || typeof loaded !== 'object') {
      return { ok: false, error: 'Input is neither JSON nor a YAML mapping' }
    }
    return { ok: true, output: JSON.stringify(loaded, null, 2), direction: 'yaml→json' }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) }
  }
}

function cell(value: unknown): string {
  if (value === null) return 'null'
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

export function toTable(input: string): Ok<{ headers: string[]; rows: string[][] }> | Err {
  let parsed: unknown
  try {
    parsed = JSON.parse(input)
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) }
  }

  if (Array.isArray(parsed)) {
    const objects = parsed.filter(
      (item): item is Record<string, unknown> =>
        item !== null && typeof item === 'object' && !Array.isArray(item),
    )
    if (objects.length === 0) return { ok: false, error: 'Array has no objects to tabulate' }

    const headers: string[] = []
    objects.forEach((obj) => {
      Object.keys(obj).forEach((key) => {
        if (!headers.includes(key)) headers.push(key)
      })
    })
    const rows = objects.map((obj) => headers.map((key) => cell(obj[key])))
    return { ok: true, headers, rows }
  }

  if (parsed !== null && typeof parsed === 'object') {
    const entries = Object.entries(parsed as Record<string, unknown>)
    return {
      ok: true,
      headers: ['key', 'value'],
      rows: entries.map(([key, value]) => [key, cell(value)]),
    }
  }

  return { ok: false, error: 'Only JSON objects and arrays of objects can be tabulated' }
}
```

- [ ] **Step 4: 运行测试确认通过**

Run: `cd plugins/obsidian-json-toolbox && pnpm test`
Expected: PASS。

- [ ] **Step 5: Commit**

```bash
git add plugins/obsidian-json-toolbox/src
git commit -m "feat(obsidian-plugin): 格式化/校验/JSON↔YAML/表格命令纯函数"
```

---

### Task 7: settings.ts + main.ts（命令注册 + About 外链）

**Files:**
- Create: `plugins/obsidian-json-toolbox/src/settings.ts`
- Create: `plugins/obsidian-json-toolbox/src/main.ts`

**Interfaces:**
- Consumes: `JsonViewerModal`（Task 5）、`formatJson` / `validateJson` / `toggleJsonYaml`（Task 6）、`SITE_URL`（Task 5）
- Produces: 默认导出 `JsonToolboxPlugin`（Obsidian 插件入口）

- [ ] **Step 1: 实现 settings.ts**

```ts
import { PluginSettingTab, Setting } from 'obsidian'
import type JsonToolboxPlugin from './main'
import { SITE_URL } from './viewerModal'

export class JsonToolboxSettingTab extends PluginSettingTab {
  constructor(app: never, private readonly plugin: JsonToolboxPlugin) {
    super(app, plugin as never)
  }

  display(): void {
    const { containerEl } = this
    containerEl.empty?.()
    containerEl.innerHTML = ''

    new Setting(containerEl).setName('JSON Toolbox').setHeading()

    const about = containerEl.createDiv?.() ?? document.createElement('div')
    if (!containerEl.createDiv) containerEl.appendChild(about)
    about.className = 'json-toolbox-footer'
    about.append?.('Rich JSON viewing and formatting inside Obsidian. ')
    about.appendChild(document.createTextNode('Rich JSON viewing and formatting inside Obsidian. '))

    const link = document.createElement('a')
    link.href = SITE_URL
    link.textContent = SITE_URL
    link.setAttribute('target', '_blank')
    link.setAttribute('rel', 'noopener noreferrer')
    about.appendChild(link)

    about.appendChild(
      document.createTextNode(
        ' — the full online version with 30+ JSON tools. All processing happens locally; no telemetry.',
      ),
    )
  }
}
```

- [ ] **Step 2: 实现 main.ts（注册 5 个命令）**

```ts
import { Notice, Plugin } from 'obsidian'
import { JsonViewerModal } from './viewerModal'
import { formatJson, validateJson, toggleJsonYaml } from './commands'

export default class JsonToolboxPlugin extends Plugin {
  async onload(): Promise<void> {
    this.addCommand({
      id: 'open-json-viewer',
      name: 'Open JSON Viewer',
      callback: () => {
        const text = this.getSelectionText()
        new JsonViewerModal(this.app, text, 'tree').open()
      },
    })

    this.addCommand({
      id: 'format-json',
      name: 'Format JSON',
      callback: () => this.replaceSelection((text) => {
        const result = formatJson(text)
        return result.ok ? { ok: true, output: result.output } : { ok: false, error: result.error }
      }),
    })

    this.addCommand({
      id: 'validate-json',
      name: 'Validate JSON',
      callback: () => {
        const result = validateJson(this.getSelectionText())
        new Notice(result.ok ? '✓ Valid JSON' : `✗ ${result.error}`)
      },
    })

    this.addCommand({
      id: 'json-yaml-toggle',
      name: 'JSON ↔ YAML',
      callback: () => this.replaceSelection((text) => {
        const result = toggleJsonYaml(text)
        return result.ok
          ? { ok: true, output: result.output, notice: `Converted ${result.direction}` }
          : { ok: false, error: result.error }
      }),
    })

    this.addCommand({
      id: 'json-to-table',
      name: 'JSON → Table/CSV',
      callback: () => {
        new JsonViewerModal(this.app, this.getSelectionText(), 'table').open()
      },
    })

    this.addSettingTab(new (await import('./settings')).JsonToolboxSettingTab(this.app as never, this))
  }

  onunload(): void {
    // nothing to dispose
  }

  private getSelectionText(): string {
    const editor = this.app.workspace.activeEditor?.editor
    if (!editor) return ''
    const selected = editor.getSelection()
    return selected && selected.trim() ? selected : editor.getValue()
  }

  private replaceSelection(
    transform: (text: string) =>
      | { ok: true; output: string; notice?: string }
      | { ok: false; error: string },
  ): void {
    const editor = this.app.workspace.activeEditor?.editor
    if (!editor) {
      new Notice('No active editor')
      return
    }
    const input = editor.getSelection() || editor.getValue()
    const result = transform(input)
    if (!result.ok) {
      new Notice(`✗ ${result.error}`)
      return
    }
    if (editor.getSelection()) editor.replaceSelection(result.output)
    else editor.setValue(result.output)
    new Notice(result.notice ?? '✓ Done')
  }
}
```

- [ ] **Step 3: 修正 settings.ts 中的重复 append**

`about.append?.(...)` 与随后 `appendChild(document.createTextNode(...))` 会重复插入同一句文案。保留后者（`appendChild`），删除 `about.append?.('Rich JSON viewing and formatting inside Obsidian. ')` 这一行。

- [ ] **Step 4: 类型检查**

Run: `cd plugins/obsidian-json-toolbox && pnpm typecheck`
Expected: 无 TS 错误。若 `this.app.workspace.activeEditor` 类型在所用 `obsidian` 版本下不匹配，改用 `this.app.workspace.getActiveViewOfType(MarkdownView)?.editor`（从 `obsidian` 导入 `MarkdownView`）并保持行为一致。

- [ ] **Step 5: 跑全部测试**

Run: `cd plugins/obsidian-json-toolbox && pnpm test`
Expected: PASS。

- [ ] **Step 6: Commit**

```bash
git add plugins/obsidian-json-toolbox/src
git commit -m "feat(obsidian-plugin): 命令注册与设置页外链"
```

---

### Task 8: README / manifest 核对与文档收尾

**Files:**
- Modify: `plugins/obsidian-json-toolbox/README.md`
- Modify: `plugins/obsidian-json-toolbox/manifest.json`
- Modify: `docs/superpowers/specs/2026-10-19-obsidian-json-plugin-design.md`（补充"实现状态：MVP 已落地"一行）

- [ ] **Step 1: 核对 manifest.json 字段完整**

确保 `manifest.json` 含且仅含：`id`（`json-toolbox`）、`name`、`version`、`minAppVersion`、`description`、`author`、`authorUrl`（`https://jsontoolbox.cc`）、`isDesktopOnly`。版本号与 `package.json` 一致。

- [ ] **Step 2: 完善 README（功能 + 外链 + 隐私）**

README 顶部必须包含：

```markdown
🌐 **Full online version with 30+ JSON tools:** https://jsontoolbox.cc
```

并确保列出 5 个命令、14 类预览、隐私说明（本地处理、无遥测）。

- [ ] **Step 3: 检查自包含铁律（关键门禁）**

Run: `cd plugins/obsidian-json-toolbox && grep -rn "from '\~/\|from '~/\|app/utils\|app/components" src/ || echo "OK: 无站点内部引用"`
Expected: 输出 `OK: 无站点内部引用`（保证后续可整体剥离）。

- [ ] **Step 4: 跑全部测试 + 类型检查**

Run: `cd plugins/obsidian-json-toolbox && pnpm test && pnpm typecheck`
Expected: 全部 PASS，无 TS 错误。

- [ ] **Step 5: 在 spec 文档标注实现状态**

在 `docs/superpowers/specs/2026-10-19-obsidian-json-plugin-design.md` 顶部 `- **状态**：` 一行改为：

```
- **状态**：MVP 已实现（方案 B），方案 A（代码块内联）待后续迭代
```

- [ ] **Step 6: Commit**

```bash
git add plugins/obsidian-json-toolbox README.md plugins/obsidian-json-toolbox/manifest.json docs/superpowers/specs/2026-10-19-obsidian-json-plugin-design.md
git commit -m "docs(obsidian-plugin): README/manifest 外链核对与实现状态标注"
```

---

## 自审结果（已执行）

1. **Spec 覆盖**：外链策略（README + authorUrl + 设置页 + Modal 底部）→ Task 1/5/7/8；14 类预览 → Task 2/4；5 个命令 → Task 6/7；离线/隐私 → Task 1 README + 实现（无网络调用）；自包含 → Task 8 门禁；目录与 workspace → Task 1。无缺口。
2. **占位符扫描**：无 TBD / TODO / "后续补充"；每个步骤含具体代码或命令。
3. **类型一致性**：`JsonNode`（Task 3）被 `treeView`（Task 4）与 `viewerModal`（Task 5）一致使用；`toTable` 在 Task 6 定义、Task 5 导入，签名 `{ ok: true; headers: string[]; rows: string[][] }` 一致；`SITE_URL` 在 Task 5 导出、Task 7 导入；命令 ID 与 spec 逐字一致。

## 执行方式

计划已保存到 `docs/superpowers/plans/2026-10-19-obsidian-json-plugin.md`。

**注意**：`main.js` 的 esbuild 构建由开发者本地执行（`pnpm --filter obsidian-json-toolbox build`），AI 只写代码/文档/跑测试与类型检查。
