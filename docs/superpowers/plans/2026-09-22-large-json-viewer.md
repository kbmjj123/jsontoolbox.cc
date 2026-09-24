# Large JSON Viewer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把大文件落地页从「记录集合 → 选列 → 导出 CSV」重做为「本地只读查看 + Worker 全文搜索 + 跳转定位 + 上下文 + 结果导出」的查看器，并迁移到 `/tools/view/large-json-viewer`。

**Architecture:** 页面由五个职责单一的组件编排（`Dropzone` / `TextViewer` / `SearchBar` / `Results` / 编排器）。纯逻辑（行号索引、文本搜索）下沉到 `app/utils/textSearch.ts` 由 Worker 与验证脚本共用，Worker 只负责在后台跑并回传进度。全屏行为抽成 `useFullscreen()`，由 `ResizablePanel` 与新页面共用。

**Tech Stack:** Nuxt 4 / Vue 3 / TypeScript / Tailwind / Web Worker / `@vueuse/core`（`useVirtualList` 用于结果列表）

---

## Global Constraints

以下约束对每个任务隐式生效，逐条照抄自 spec 与项目规则：

- 站内色板与尺寸：容器 `max-w-[1200px]`，卡片 `rounded-2xl border border-surface-200 bg-white p-6 dark:border-surface-700 dark:bg-surface-900`，文字 `text-surface-500`，主色 `text-primary-600`。**禁止** `border-border` / `text-muted` / `bg-surface-200/40` 这一套词表，禁止 emoji 图标，一律 `<Icon name="lucide:...">`
- 全站唯一体积阈值 `LARGE_FILE_MAX_BYTES = 5 * 1024 * 1024`（`app/composables/useLargeFile.ts`）
- 语言键：工具 JSON 用 **`en` / `zh`**；`i18n/locales/` 文件名是 **`en.json` / `zh-CN.json`**。写反=整块静默为空
- 一切用户可见文案走 `tool.ui.*` 或 i18n，**不得硬编码英文**（本页现状违反此条，Task 11 修）
- 铁律（`CLAUDE.md` → `.claude/rules/copy-accuracy.md`）：每条文案断言必须能指出 `file:line`；数量/顺序/范围/上限必须与实现同向
- **不建全量对象树、不做编辑、不做全文件格式化**
- 验证方式：纯逻辑用 `node --experimental-strip-types` 跑一次性探针脚本（用完即删）+ 浏览器手测矩阵。**不引入新测试框架**（项目当前无测试基建，引入 vitest 属超出本次范围的决定）
- 每个任务结束**提交前需用户确认**（不在未授权下自动 `git commit`）

---

## 任务间接口契约（先读这里）

后一个任务的实现者只看得到自己的任务，下面的名字与类型是唯一约定，不得改名。

```ts
// app/utils/textSearch.ts —— 纯函数，Worker 与探针共用
export function buildLineOffsets(text: string): Uint32Array
export function offsetToLineCol(lineOffsets: Uint32Array, offset: number): { line: number; column: number }
export interface SearchTextHit { index: number; line: number; column: number; offset: number; path?: string; preview: string }
export interface SearchTextOptions { mode: 'key' | 'value' | 'path'; caseSensitive?: boolean; limit?: number }
export interface SearchTextProgress { scanned: number; total: number; matches: number }
export function searchTextScan(
  text: string, lineOffsets: Uint32Array, query: string,
  opts: SearchTextOptions, onProgress?: (p: SearchTextProgress) => void,
): { hits: SearchTextHit[]; truncated: boolean }
```

```ts
// app/composables/useLargeFile.ts —— 新增导出
export interface LargeFileTextSearchState {
  hits: Ref<SearchTextHit[]>
  activeIndex: Ref<number>
  isSearching: Ref<boolean>
  truncated: Ref<boolean>
  progress: Ref<SearchTextProgress>
  query: Ref<string>
  mode: Ref<'key' | 'value' | 'path'>
  caseSensitive: Ref<boolean>
}
// useLargeFile() 返回值新增：
lineOffsets: Ref<Uint32Array | null>
textSearch: LargeFileTextSearchState
searchText(): Promise<void>
cancelSearch(): void
```

```ts
// app/composables/useFullscreen.ts
export function useFullscreen(): {
  isFullscreen: Ref<boolean>
  toggle(): void
}
// 行为：true 时锁定 document.body.style.overflow，监听 keydown Esc 退出
```

组件 props / emits：

| 组件 | props | emits |
|---|---|---|
| `tool/LargeFileDropzone.vue` | 无 props | `pick(file: File, format: FileFormat \| 'auto')` |
| `tool/LargeFileTextViewer.vue` | `text: string`、`lineOffsets: Uint32Array \| null`、`wrap?: boolean`、`activeHit?: SearchTextHit \| null`、`maxLineChars?: number`（默认 2000） | — |
| `tool/LargeFileSearchBar.vue` | `state: LargeFileTextSearchState`、`disabled?: boolean` | `search`、`cancel`、`prev`、`next` |
| `tool/LargeFileResults.vue` | `hits`、`truncated?`、`activeIndex?`、`activeHit?`、`text?`、`lineOffsets?`、`contextLines?`（默认 3） | `select(index: number)`、`copy(text: string)` |

---

### Task 1: 信息架构迁移与骨架

**Files:**
- Delete: `app/assets/data/convert/large-json-csv.json`
- Delete: `app/components/universal/LargeJsonExplorer.vue`
- Create: `app/assets/data/view/_meta.json`
- Create: `app/assets/data/view/large-json-viewer.json`
- Create: `app/components/universal/LargeJsonViewer.vue`（骨架：只渲染 `<LargeFileDropzone>`，Task 9 补全）
- Modify: `app/composables/useLargeFile.ts:57`
- Modify: `app/assets/data/convert/json-to-csv.json:9`

- [ ] **Step 1: 建 view 分类元数据**

```json
{
  "slug": "view",
  "sort": 4,
  "icon": "lucide:eye",
  "theme": {
    "bg": "from-purple-50 to-violet-50 dark:from-purple-950/30 dark:to-violet-950/30",
    "text": "text-purple-600 dark:text-purple-400",
    "iconBg": "bg-purple-100 dark:bg-purple-900/50"
  },
  "en": {
    "title": "JSON View & Search Tools",
    "description": "Open, inspect and search JSON documents in your browser, including files that are too large for a normal editor.",
    "keywords": ["json viewer", "view large json", "search json online", "large json viewer"],
    "h2": "View & Search",
    "pdesc": "Open and search JSON locally — including large files — without uploading anything.",
    "highlights": [
      { "icon": "lucide:eye", "title": "Read-only viewing", "description": "Open large JSON and NDJSON files as read-only text with line numbers." },
      { "icon": "lucide:search", "title": "Local search", "description": "Search keys, values or paths inside a Web Worker, with progress and cancel." },
      { "icon": "lucide:shield-check", "title": "Private & Secure", "description": "All processing happens in your browser. No data is uploaded." }
    ],
    "faq": [
      { "q": "Is my data uploaded?", "a": "No. The file is opened and searched entirely in your browser." }
    ]
  },
  "zh": {
    "title": "JSON 查看与搜索工具",
    "description": "在浏览器中打开、查看并搜索 JSON 文档，包括普通编辑器无法承载的大文件。",
    "keywords": ["json查看器", "查看大json", "在线搜索json", "大文件json查看"],
    "h2": "查看与搜索",
    "pdesc": "在本地打开并搜索 JSON，包括大文件，全程不上传。",
    "highlights": [
      { "icon": "lucide:eye", "title": "只读查看", "description": "以只读文本方式打开大型 JSON 与 NDJSON 文件，带行号。" },
      { "icon": "lucide:search", "title": "本地搜索", "description": "在 Web Worker 中按键名、值或路径搜索，带进度可取消。" },
      { "icon": "lucide:shield-check", "title": "私密安全", "description": "所有处理在浏览器中完成，不会上传数据。" }
    ],
    "faq": [
      { "q": "我的数据会被上传吗？", "a": "不会。文件的打开与搜索全部在你的浏览器中完成。" }
    ]
  }
}
```

三条 highlights 分别对应：只读文本视口（Task 6）、Worker 搜索（Task 4/7）、本地处理（既有实现）——每条都能指认实现，符合铁律。

- [ ] **Step 2: 建工具配置骨架**

`app/assets/data/view/large-json-viewer.json` 先只写定位字段，`features`/`guide`/`faq`/`article`/`ui` 由 Task 11 按最终实现补齐（不先写文案再补实现，避免违反铁律第 1 条）：

```json
{
  "slug": "large-json-viewer",
  "category": "view",
  "component": "LargeJsonViewer",
  "icon": "lucide:eye",
  "featured": false,
  "en": { "name": "Large JSON Viewer", "description": "Open large JSON and NDJSON files in your browser. Read, search and locate values locally — no upload.", "meta": {}, "features": [], "guide": [], "faq": [] },
  "zh": { "name": "大文件 JSON 查看器", "description": "在浏览器中打开大型 JSON 与 NDJSON 文件，本地阅读、搜索与定位，文件不上传。", "meta": {}, "features": [], "guide": [], "faq": [] }
}
```

- [ ] **Step 3: 更新两处引用**

```ts
// app/composables/useLargeFile.ts
export const LARGE_FILE_EXPLORER_PATH = '/tools/view/large-json-viewer'
```

```json
// app/assets/data/convert/json-to-csv.json — recommends 数组第二项
"recommends": ["json-editor", "large-json-viewer"]
```

- [ ] **Step 4: 建组件骨架**

`app/components/universal/LargeJsonViewer.vue`：

```vue
<template>
  <div class="mx-auto w-full">
    <p class="text-sm text-surface-500 dark:text-surface-400">{{ t('largeViewer.skeletonHint') }}</p>
  </div>
</template>
<script setup lang="ts">
const { t } = useI18n()
</script>
```

- [ ] **Step 5: 验证路由可达**

Run: `pnpm dev` → 访问 `/tools/view/large-json-viewer`
Expected: 页面渲染出工具标题与骨架提示，无 "Tool component not found"；`/tools/view` 分类页出现该工具；`/tools/convert/large-json-csv` 返回 404（符合 spec：不做兼容层）

- [ ] **Step 6: 提交**（需用户确认）

---

### Task 2: 抽取 useFullscreen

**Files:**
- Create: `app/composables/useFullscreen.ts`
- Modify: `app/components/tool/ResizablePanel.vue:93-124`

- [ ] **Step 1: 写 composable**

```ts
/**
 * Shared fullscreen behaviour for tool panels: state, ESC hint, ESC to exit,
 * body scroll lock. Used by ResizablePanel and the Large JSON Viewer so both
 * stay identical by construction instead of by copy-paste.
 */
export function useFullscreen(initial = false) {
  const isFullscreen = ref(initial)

  useEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'Escape' && isFullscreen.value) isFullscreen.value = false
  })

  watch(isFullscreen, (v) => {
    document.body.style.overflow = v ? 'hidden' : ''
  })

  onUnmounted(() => { document.body.style.overflow = '' })

  function toggle() { isFullscreen.value = !isFullscreen.value }

  return { isFullscreen, toggle }
}
```

- [ ] **Step 2: 改 ResizablePanel 使用它**

用 `useFullscreen()` 替掉组件内的 `isFullscreen` computed 与两段副作用（保留 `fullscreen` prop / `update:fullscreen` emit 不变）：

```ts
const props = withDefaults(defineProps<Props>(), { /* 不变 */ })
const emit = defineEmits<{ 'update:fullscreen': [value: boolean] }>()

const { isFullscreen, toggle } = useFullscreen(props.fullscreen)
watch(isFullscreen, v => emit('update:fullscreen', v))
watch(() => props.fullscreen, v => { isFullscreen.value = v })
```

删除原 `onMounted` 之外的 `watch(isFullscreen, ...)` 与 `useEventListener('keydown', ...)`（现由 composable 提供），按钮改为 `@click="toggle"`。

- [ ] **Step 3: 验证行为不回归**

Run: `pnpm dev` → 打开 `/tools/format/json-editor`，点全屏按钮
Expected: 全屏展开、出现 "Press ESC to exit fullscreen" 胶囊、按 ESC 退出、全屏时页面背景不滚动——四项与改动前一致

- [ ] **Step 4: 提交**（需用户确认）

---

### Task 3: 纯逻辑下沉 + load 回传 lineOffsets

**Files:**
- Create: `app/utils/textSearch.ts`
- Modify: `app/workers/recordStream.worker.ts`（删掉本地 `buildLineOffsets`，改为 import；`mode:'load'` 回传 offsets）

- [ ] **Step 1: 写 buildLineOffsets 与 offsetToLineCol**

```ts
export function buildLineOffsets(text: string): Uint32Array {
  const n = text.length
  const out: number[] = [0]
  for (let i = 0; i < n; i++) {
    if (text.charCodeAt(i) === 10) out.push(i + 1)
  }
  return new Uint32Array(out)
}

export function offsetToLineCol(lineOffsets: Uint32Array, offset: number): { line: number; column: number } {
  let lo = 0, hi = lineOffsets.length - 1
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1
    if (lineOffsets[mid] <= offset) lo = mid
    else hi = mid - 1
  }
  return { line: lo + 1, column: offset - lineOffsets[lo] + 1 }
}
```

- [ ] **Step 2: 探针验证**

```js
// tmp-offset-probe.mjs（用完删除）
import { buildLineOffsets, offsetToLineCol } from './app/utils/textSearch.ts'
const text = 'a\nbb\nccc\n\nddd'
const offs = buildLineOffsets(text)
console.log([...offs])                                  // [0,2,5,9,10]
console.log(offsetToLineCol(offs, 0))                   // {line:1,column:1}
console.log(offsetToLineCol(offs, 5))                   // {line:3,column:1}
console.log(offsetToLineCol(offs, 10))                  // {line:5,column:1}
console.log(text.slice(offs[2], offs[2] + 3))           // 'ccc'
```

Run: `node --experimental-strip-types tmp-offset-probe.mjs`
Expected: `[ 0, 2, 5, 9, 10 ]`、`{ line: 1, column: 1 }`、`{ line: 3, column: 1 }`、`{ line: 5, column: 1 }`、`ccc`

- [ ] **Step 3: Worker 改为 import 并在 load 完成时回传 offsets**

```ts
import { buildLineOffsets, offsetToLineCol, searchTextScan } from '~/utils/textSearch'
```

`mode:'load'` 成功分支的 `ScanResult` 增加字段 `lineOffsets`，并在 postMessage 时转移所有权：

```ts
const res: ScanResult = {
  id: data.id, type: 'scan', ok: true, rootType, format: docFormat,
  recordCount, candidates, bytes: docText.length, lineOffsets: buildLineOffsets(docText),
}
self.postMessage(res, [res.lineOffsets!.buffer])
```

同步修改 `ScanResult` 接口（`app/workers/recordStream.worker.ts` 顶部）加 `lineOffsets?: Uint32Array`，删除文件内原有的 `buildLineOffsets` 定义。

- [ ] **Step 4: 提交**（需用户确认）

---

### Task 4: Worker 全文搜索（searchText）

**Files:**
- Modify: `app/utils/textSearch.ts`（加 `searchTextScan`）
- Modify: `app/workers/recordStream.worker.ts`（加 `searchText` 分支与进度消息）
- Modify: `app/composables/useLargeFile.ts`（加 `searchText` / `cancelSearch` / `textSearch` 状态 / `lineOffsets`）

- [ ] **Step 1: 写 searchTextScan（分块扫描 + 进度回调）**

```ts
export function searchTextScan(
  text: string,
  lineOffsets: Uint32Array,
  query: string,
  opts: SearchTextOptions,
  onProgress?: (p: SearchTextProgress) => void,
  chunkSize = 1 << 20,
): { hits: SearchTextHit[]; truncated: boolean } {
  const limit = opts.limit ?? 5000
  const needle = opts.caseSensitive ? query : query.toLowerCase()
  const hay = opts.caseSensitive ? text : text.toLowerCase()
  const hits: SearchTextHit[] = []
  if (!needle) return { hits, truncated: false }

  const n = hay.length
  let scanned = 0
  let lastProgress = 0

  while (scanned < n) {
    const end = Math.min(n, scanned + chunkSize)
    let from = scanned
    while (from < end && hits.length < limit) {
      const at = hay.indexOf(needle, from)
      if (at === -1 || at >= end) break
      const { line, column } = offsetToLineCol(lineOffsets, at)
      hits.push({
        index: hits.length,
        line, column, offset: at,
        preview: text.slice(Math.max(0, at - 40), at + needle.length + 40),
      })
      from = at + needle.length
    }
    scanned = end
    if (onProgress && scanned - lastProgress >= chunkSize) {
      lastProgress = scanned
      onProgress({ scanned, total: n, matches: hits.length })
    }
    if (hits.length >= limit) break
  }
  return { hits, truncated: hits.length >= limit }
}
```

`path` 字段留空（JSONPath 解析属 spec 的 P3，本任务不实现，`SearchTextHit.path` 保持可选）。

- [ ] **Step 2: 探针验证（与 indexOf 交叉校验）**

```js
// tmp-search-probe.mjs（用完删除）
import { buildLineOffsets, searchTextScan, offsetToLineCol } from './app/utils/textSearch.ts'
const doc = JSON.stringify({ labels: [], components: Array.from({ length: 200 }, (_, i) => ({ id: i, url: `https://atar.cc/300?u=${i}` })) }, null, 2)
const offs = buildLineOffsets(doc)
for (const q of ['atar.cc', 'components', 'id', 'ZZZ']) {
  const { hits, truncated } = searchTextScan(doc, offs, q, { mode: 'value' })
  const first = doc.indexOf(q)
  const ok = hits.length === 0 ? first === -1 : hits[0].offset === first
  console.log(`${ok ? 'OK  ' : 'FAIL'} q=${q.padEnd(12)} hits=${String(hits.length).padEnd(5)} first=${first} hit0=${hits[0]?.offset} line=${hits[0]?.line}:${hits[0]?.column} truncated=${truncated}`)
}
const l = searchTextScan(doc, offs, 'atar.cc', { mode: 'value', limit: 10 })
console.log('limit works:', l.hits.length === 10 && l.truncated === true)
```

Run: `node --experimental-strip-types tmp-search-probe.mjs`
Expected: 四行全 `OK`；`limit works: true`

- [ ] **Step 3: Worker 接 searchText**

新增请求类型与消息：

```ts
export interface SearchTextRequest {
  id: number
  mode: 'searchText'
  query: string
  searchMode: 'key' | 'value' | 'path'
  caseSensitive: boolean
  limit: number
}
export interface SearchTextProgressMsg { id: number; type: 'searchTextProgress'; scanned: number; total: number; matches: number }
export interface SearchTextResultMsg { id: number; type: 'searchTextResult'; hits: SearchTextHit[]; truncated: boolean }
```

处理分支（在 `self.onmessage` 内，`docText` / 已缓存的 `lineOffsets` 基础上执行）：

```ts
if (data.mode === 'searchText') {
  const offsets = lineOffsets.length ? lineOffsets : buildLineOffsets(docText)
  const r = searchTextScan(docText, offsets, data.query,
    { mode: data.searchMode, caseSensitive: data.caseSensitive, limit: data.limit },
    (p) => self.postMessage({ id: data.id, type: 'searchTextProgress', ...p } as SearchTextProgressMsg))
  self.postMessage({ id: data.id, type: 'searchTextResult', hits: r.hits, truncated: r.truncated } as SearchTextResultMsg)
  return
}
```

- [ ] **Step 4: useLargeFile 接线**

```ts
const lineOffsets = ref<Uint32Array | null>(null)
const textSearch = {
  hits: ref<SearchTextHit[]>([]),
  activeIndex: ref(-1),
  isSearching: ref(false),
  truncated: ref(false),
  progress: ref<SearchTextProgress>({ scanned: 0, total: 0, matches: 0 }),
  query: ref(''),
  mode: ref<'key' | 'value' | 'path'>('value'),
  caseSensitive: ref(false),
}
```

`handleMessage` 里接 `scan` 时把 `data.lineOffsets` 存入 `lineOffsets`；新增对 `searchTextProgress` / `searchTextResult` 的处理；新增：

```ts
async function searchText() {
  if (!scan.value?.ok || !textSearch.query.value.trim()) { textSearch.hits.value = []; return }
  textSearch.isSearching.value = true
  textSearch.activeIndex.value = -1
  const id = ++reqId
  return new Promise<void>((resolve) => {
    pending.set(id, { resolve: () => { textSearch.isSearching.value = false; resolve() }, reject: () => resolve(), kind: 'search' })
    post(id, { mode: 'searchText', query: textSearch.query.value, searchMode: textSearch.mode.value,
               caseSensitive: textSearch.caseSensitive.value, limit: 5000 })
  })
}
function cancelSearch() { if (textSearch.isSearching.value) { cancel(); textSearch.isSearching.value = false } }
```

把 `lineOffsets`、`textSearch`、`searchText`、`cancelSearch` 加入 `useLargeFile()` 的返回对象。

- [ ] **Step 5: 提交**（需用户确认）

---

### Task 5: LargeFileDropzone（公共组件）

**Files:**
- Create: `app/components/tool/LargeFileDropzone.vue`
- Modify: `app/components/universal/LargeJsonViewer.vue`（接入）

- [ ] **Step 1: 写组件**

按站内色板重写（替换原 explorer 里的 emoji + `border-border` 版本），保留原有能力：拖拽、点击选择、格式三选（auto/json/ndjson）。

```vue
<template>
  <div
    class="rounded-2xl border-2 border-dashed border-surface-200 bg-surface-50 p-10 text-center transition dark:border-surface-700 dark:bg-surface-800"
    :class="{ 'border-primary-600 bg-primary-50 dark:border-primary-500 dark:bg-primary-900/20': dragOver }"
    @dragover.prevent="dragOver = true"
    @dragleave.prevent="dragOver = false"
    @drop.prevent="onDrop"
  >
    <Icon name="lucide:upload" class="mx-auto h-8 w-8 text-surface-400" />
    <p class="mt-3 text-sm font-medium text-surface-900 dark:text-surface-100">{{ t('largeViewer.dropzoneTitle') }}</p>
    <p class="mx-auto mt-1 max-w-md text-xs text-surface-500 dark:text-surface-400">{{ t('largeViewer.dropzoneHint') }}</p>
    <input ref="fileInput" type="file" accept=".json,.ndjson,.jsonl,.jsonlines,application/json" class="hidden" @change="onFilePicked">
    <button class="mt-4 rounded-xl bg-primary-600 px-4 py-2 text-xs font-semibold text-white hover:bg-primary-700 dark:bg-primary-500" @click="fileInput?.click()">
      {{ t('largeViewer.chooseFile') }}
    </button>
    <div class="mt-3 flex items-center justify-center gap-3 text-xs text-surface-500 dark:text-surface-400">
      <span>{{ t('largeViewer.format') }}</span>
      <label class="flex items-center gap-1"><input v-model="format" type="radio" value="auto"> {{ t('largeViewer.formatAuto') }}</label>
      <label class="flex items-center gap-1"><input v-model="format" type="radio" value="json"> JSON</label>
      <label class="flex items-center gap-1"><input v-model="format" type="radio" value="ndjson"> NDJSON</label>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { FileFormat } from '~/workers/recordStream.worker'

// 无 props：父组件按 lf.status 决定是否渲染本组件
const emit = defineEmits<{ pick: [file: File, format: FileFormat | 'auto'] }>()
const { t } = useI18n()

const dragOver = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)
const format = ref<FileFormat | 'auto'>('auto')

function onDrop(e: DragEvent) {
  dragOver.value = false
  const file = e.dataTransfer?.files?.[0]
  if (file) emit('pick', file, format.value)
}
function onFilePicked(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) emit('pick', file, format.value)
}
</script>
```

- [ ] **Step 2: 编排器接入**

`LargeJsonViewer.vue` 内：`<LargeFileDropzone v-if="lf.status.value === 'idle'" @pick="onPick" />`，`onPick` 调 `lf.loadFile(file, fmt === 'auto' ? undefined : fmt)`。

- [ ] **Step 3: 验证**

Run: `pnpm dev` → `/tools/view/large-json-viewer` 拖入一个 >5MB 的 .json
Expected: 上传后进入扫描态，无 emoji、无 `border-border` 词表，深色模式下配色正确

- [ ] **Step 4: 提交**（需用户确认）

---

### Task 6: LargeFileTextViewer（只读虚拟滚动视口）

**Files:**
- Create: `app/components/tool/LargeFileTextViewer.vue`

- [ ] **Step 1: 写组件**

核心：不物化全部行数组，靠 `lineOffsets` 二分定位可视区间，只渲染可视行。

```vue
<template>
  <div class="flex h-full min-h-0 flex-col rounded-xl border border-surface-200 bg-white dark:border-surface-700 dark:bg-surface-900">
    <div class="flex items-center justify-between border-b border-surface-200 px-3 py-2 dark:border-surface-700">
      <span class="text-xs text-surface-500 dark:text-surface-400">
        {{ lineCount.toLocaleString() }} {{ t('largeViewer.lines') }}
      </span>
      <label class="flex items-center gap-1.5 text-xs text-surface-500 dark:text-surface-400">
        <input v-model="wrapLocal" type="checkbox"> {{ t('largeViewer.wrap') }}
      </label>
    </div>

    <div ref="scrollRef" class="relative min-h-0 flex-1 overflow-auto font-mono text-xs" @scroll="onScroll">
      <div :style="{ height: totalHeight + 'px' }" class="relative">
        <div :style="{ transform: `translateY(${offsetY}px)` }" class="absolute inset-x-0 top-0">
          <div v-for="row in visibleRows" :key="row.line" class="flex" :class="{ 'bg-primary-50 dark:bg-primary-900/30': row.line === activeLine }">
            <span class="w-16 shrink-0 select-none pr-2 text-right text-surface-400">{{ row.line + 1 }}</span>
            <span class="whitespace-pre" :class="wrapLocal ? 'whitespace-pre-wrap break-all' : ''">{{ row.text }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { SearchTextHit } from '~/utils/textSearch'

const props = withDefaults(defineProps<{
  text: string
  lineOffsets: Uint32Array | null
  wrap?: boolean
  activeHit?: SearchTextHit | null
  maxLineChars?: number
}>(), { wrap: false, activeHit: null, maxLineChars: 2000 })

const LINE_HEIGHT = 20
const { t } = useI18n()

// props 不可直接 v-model，用本地 ref 承接换行开关
const wrapLocal = ref(props.wrap)
watch(() => props.wrap, v => { wrapLocal.value = v })

const scrollRef = ref<HTMLElement | null>(null)
const scrollTop = ref(0)
const viewportH = ref(400)
const lineCount = computed(() => props.lineOffsets?.length ?? 1)
const activeLine = computed(() => props.activeHit ? props.activeHit.line - 1 : -1)

const totalHeight = computed(() => lineCount.value * LINE_HEIGHT)
const startIndex = computed(() => Math.max(0, Math.floor(scrollTop.value / LINE_HEIGHT) - 4))
const endIndex = computed(() => Math.min(lineCount.value, startIndex.value + Math.ceil(viewportH.value / LINE_HEIGHT) + 8))
const offsetY = computed(() => startIndex.value * LINE_HEIGHT)

// 只切片可视区间，绝不把整份文本拆成行数组
const visibleRows = computed(() => {
  const offs = props.lineOffsets
  if (!offs) return []
  const rows: { line: number; text: string }[] = []
  for (let i = startIndex.value; i < endIndex.value; i++) {
    const start = offs[i]
    const end = i + 1 < offs.length ? offs[i + 1] : props.text.length
    let line = props.text.slice(start, end).replace(/\n$/, '')
    let clipped = false
    if (line.length > props.maxLineChars) { line = line.slice(0, props.maxLineChars); clipped = true }
    rows.push({ line: i, text: clipped ? line + ' …' + t('largeViewer.lineClipped') : line })
  }
  return rows
})

function onScroll() { scrollTop.value = scrollRef.value?.scrollTop ?? 0 }

onMounted(() => {
  viewportH.value = scrollRef.value?.clientHeight ?? 400
  const ro = new ResizeObserver(() => { viewportH.value = scrollRef.value?.clientHeight ?? 400 })
  if (scrollRef.value) ro.observe(scrollRef.value)
  onUnmounted(() => ro.disconnect())
})

// 外部命中变化时滚动到该行
watch(() => props.activeHit?.line, (line) => {
  if (!line || !scrollRef.value) return
  scrollRef.value.scrollTop = Math.max(0, (line - 1 - 4) * LINE_HEIGHT)
})

defineExpose({ scrollToLine: (line: number) => { if (scrollRef.value) scrollRef.value.scrollTop = Math.max(0, (line - 1 - 4) * LINE_HEIGHT) } })
</script>
```

- [ ] **Step 2: 验证长行与内存**

Run: `pnpm dev` → 打开一个 10MB 单行 JSON（未换行）
Expected: 首屏出现行号与截断后的首行 + `…` 提示；滚动流畅；DevTools Memory 中不出现按行数膨胀的字符串数组；勾选 wrap 后自动折行

- [ ] **Step 3: 提交**（需用户确认）

---

### Task 7: LargeFileSearchBar + 搜索接线

**Files:**
- Create: `app/components/tool/LargeFileSearchBar.vue`
- Modify: `app/components/universal/LargeJsonViewer.vue`

- [ ] **Step 1: 写组件**

```vue
<template>
  <div class="flex flex-wrap items-center gap-2">
    <input
      :value="state.query.value"
      :placeholder="t('largeViewer.searchPlaceholder')"
      class="w-56 rounded-lg border border-surface-200 bg-white px-3 py-1.5 text-xs dark:border-surface-700 dark:bg-surface-800"
      @input="state.query.value = ($event.target as HTMLInputElement).value"
      @keydown.enter.prevent="emit('search')"
    >
    <select v-model="state.mode.value" class="rounded-lg border border-surface-200 bg-white px-2 py-1.5 text-xs dark:border-surface-700 dark:bg-surface-800">
      <option value="value">{{ t('largeViewer.scopeValue') }}</option>
      <option value="key">{{ t('largeViewer.scopeKey') }}</option>
      <option value="path">{{ t('largeViewer.scopePath') }}</option>
    </select>
    <label class="flex items-center gap-1 text-xs text-surface-500 dark:text-surface-400">
      <input v-model="state.caseSensitive.value" type="checkbox"> Aa
    </label>
    <button class="rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-700 dark:bg-primary-500" :disabled="disabled || state.isSearching.value" @click="emit('search')">
      {{ t('largeViewer.search') }}
    </button>
    <button v-if="state.isSearching.value" class="text-xs text-surface-500 hover:text-surface-700 dark:text-surface-400" @click="emit('cancel')">
      {{ t('largeViewer.cancel') }}
    </button>
    <template v-if="state.hits.value.length">
      <span class="text-xs text-surface-500 dark:text-surface-400">
        {{ state.activeIndex.value + 1 }} / {{ state.hits.value.length }}
      </span>
      <button class="rounded-lg border border-surface-200 px-2 py-1 text-xs dark:border-surface-700" @click="emit('prev')">↑</button>
      <button class="rounded-lg border border-surface-200 px-2 py-1 text-xs dark:border-surface-700" @click="emit('next')">↓</button>
    </template>
    <span v-if="state.isSearching.value" class="text-xs text-surface-500 dark:text-surface-400">
      {{ Math.round(state.progress.value.scanned / Math.max(1, state.progress.value.total) * 100) }}%
    </span>
  </div>
</template>

<script setup lang="ts">
import type { LargeFileTextSearchState } from '~/composables/useLargeFile'
const props = defineProps<{ state: LargeFileTextSearchState; disabled?: boolean }>()
defineOptions({ inheritAttrs: false })
const emit = defineEmits<{ search: []; cancel: []; prev: []; next: [] }>()
const { t } = useI18n()
</script>
```

- [ ] **Step 2: 编排器接线**

```ts
function onPrev() { if (lf.textSearch.hits.value.length) lf.textSearch.activeIndex.value = (lf.textSearch.activeIndex.value - 1 + lf.textSearch.hits.value.length) % lf.textSearch.hits.value.length }
function onNext() { if (lf.textSearch.hits.value.length) lf.textSearch.activeIndex.value = (lf.textSearch.activeIndex.value + 1) % lf.textSearch.hits.value.length }
```

- [ ] **Step 3: 验证**

Run: `pnpm dev` → 50MB 文件里搜一个出现多次的值
Expected: 进度百分比走动；搜索中界面不卡；结果出现 `n / N`；↑↓ 循环切换；点取消立即停止

- [ ] **Step 4: 提交**（需用户确认）

---

### Task 8: LargeFileResults（虚拟列表 + 上下文 + 复制）

**Files:**
- Create: `app/components/tool/LargeFileResults.vue`

- [ ] **Step 1: 写组件**

命中上限 5000，仍需虚拟化，统一用 `@vueuse/core` 的 `useVirtualList`（**不要**再手写 `height` / `transform`，两者混用会导致高度算两遍）。

```vue
<template>
  <div class="flex h-full min-h-0 flex-col rounded-xl border border-surface-200 bg-white dark:border-surface-700 dark:bg-surface-900">
    <div class="flex items-center justify-between border-b border-surface-200 px-3 py-2 dark:border-surface-700">
      <span class="text-xs font-medium text-surface-900 dark:text-surface-100">{{ t('largeViewer.results') }}</span>
      <span v-if="truncated" class="text-xs text-amber-600 dark:text-amber-400">{{ t('largeViewer.resultsTruncated') }}</span>
    </div>

    <div v-if="!hits.length" class="flex flex-1 items-center justify-center text-xs text-surface-400">
      {{ t('largeViewer.noResults') }}
    </div>

    <div v-else v-bind="containerProps" class="min-h-0 flex-1 overflow-auto">
      <div v-bind="wrapperProps">
        <button
          v-for="hit in visibleHits"
          :key="hit.data.index"
          class="flex h-11 w-full items-center gap-2 border-b border-surface-100 px-3 text-left text-xs hover:bg-surface-50 dark:border-surface-800 dark:hover:bg-surface-800"
          :class="{ 'bg-primary-50 dark:bg-primary-900/30': hit.data.index === activeIndex }"
          @click="emit('select', hit.data.index)"
        >
          <span class="w-16 shrink-0 font-mono text-primary-600 dark:text-primary-400">{{ hit.data.line }}:{{ hit.data.column }}</span>
          <span class="truncate font-mono text-surface-600 dark:text-surface-400">{{ hit.data.preview }}</span>
        </button>
      </div>
    </div>

    <div v-if="activeContext" class="border-t border-surface-200 p-3 dark:border-surface-700">
      <div class="mb-1 flex items-center justify-between">
        <span class="text-xs text-surface-500 dark:text-surface-400">{{ t('largeViewer.context') }}</span>
        <button class="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400" @click="emit('copy', activeContext)">
          {{ t('largeViewer.copyContext') }}
        </button>
      </div>
      <pre class="max-h-32 overflow-auto rounded-lg bg-surface-50 p-2 font-mono text-[11px] text-surface-700 dark:bg-surface-800 dark:text-surface-300">{{ activeContext }}</pre>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useVirtualList } from '@vueuse/core'
import type { SearchTextHit } from '~/utils/textSearch'

const props = withDefaults(defineProps<{
  hits: SearchTextHit[]
  truncated?: boolean
  activeIndex?: number
  activeHit?: SearchTextHit | null
  text?: string
  lineOffsets?: Uint32Array | null
  contextLines?: number
}>(), {
  truncated: false, activeIndex: -1, activeHit: null,
  text: '', lineOffsets: null, contextLines: 3,
})

const emit = defineEmits<{ select: [index: number]; copy: [text: string] }>()
const { t } = useI18n()

const { list: visibleHits, containerProps, wrapperProps } =
  useVirtualList(computed(() => props.hits), { itemHeight: 44 })

// 上下文 = 命中行前后各 contextLines 行，按行切片，不解析 JSON
const activeContext = computed(() => {
  const hit = props.activeHit
  const offs = props.lineOffsets
  if (!hit || !offs) return ''
  const from = Math.max(1, hit.line - props.contextLines)
  const to = Math.min(offs.length, hit.line + props.contextLines)
  const parts: string[] = []
  for (let ln = from; ln <= to; ln++) {
    const start = offs[ln - 1]
    const end = ln < offs.length ? offs[ln] : props.text.length
    parts.push(props.text.slice(start, end).replace(/\n$/, ''))
  }
  return parts.join('\n')
})
</script>
```

- [ ] **Step 2: 验证**

Run: `pnpm dev` → 搜一个命中 3000+ 的词
Expected: 列表滚动流畅（DOM 中始终只有可视行）；显示「仅显示前 5000 条」提示；点击某条 → 高亮 + 下方显示命中行**前后各 3 行**；点复制 → 剪贴板拿到完整上下文

- [ ] **Step 3: 提交**（需用户确认）

---

### Task 9: 编排、布局与全屏

**Files:**
- Modify: `app/components/universal/LargeJsonViewer.vue`（重写）
- Modify: `app/components/universal/LargeJsonExplorer.vue` → 已由 Task 1 删除

- [ ] **Step 1: 写编排器**

```vue
<template>
  <div class="w-full" :class="isFullscreen ? 'fixed inset-0 z-50 bg-white p-4 dark:bg-surface-900' : ''">
    <!-- 工具条 -->
    <div class="mb-2 flex flex-wrap items-center gap-3">
      <template v-if="isReady">
        <span class="text-xs font-medium text-surface-900 dark:text-surface-100">{{ lf.fileName.value }}</span>
        <span class="text-xs text-surface-500 dark:text-surface-400">{{ (lf.fileSize.value / 1048576).toFixed(1) }} MB</span>
        <span class="rounded-lg bg-primary-50 px-2 py-0.5 text-xs text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
          {{ lf.scan.value?.format === 'ndjson' ? 'NDJSON' : 'JSON' }}
        </span>
      </template>
      <LargeFileSearchBar
        v-if="isReady"
        class="ml-auto"
        :state="lf.textSearch"
        :disabled="!isReady"
        @search="lf.searchText()"
        @cancel="lf.cancelSearch()"
        @prev="onPrev"
        @next="onNext"
      />
      <button
        class="text-surface-400 hover:text-surface-600 dark:text-surface-500 dark:hover:text-surface-300"
        :title="isFullscreen ? 'Exit fullscreen' : 'Fullscreen'"
        @click="toggle"
      >
        <Icon :name="isFullscreen ? 'lucide:minimize' : 'lucide:maximize'" class="h-4 w-4" />
      </button>
    </div>

    <LargeFileDropzone v-if="lf.status.value === 'idle'" @pick="onPick" />

    <div v-else-if="isScanning" class="rounded-2xl border border-surface-200 bg-surface-50 p-10 text-center dark:border-surface-700 dark:bg-surface-800">
      <p class="text-sm text-surface-500 dark:text-surface-400">{{ t('largeViewer.scanning') }}</p>
    </div>

    <div v-else-if="isInvalid" class="rounded-2xl border border-red-200 bg-red-50 p-6 dark:border-red-800 dark:bg-red-900/20">
      <h3 class="text-sm font-semibold text-red-700 dark:text-red-400">{{ t('largeViewer.invalidTitle') }}</h3>
      <p class="mt-1 text-xs text-red-700 dark:text-red-400">{{ lf.scanError.value?.message }}</p>
      <pre v-if="lf.scanError.value?.snippet" class="mt-2 overflow-x-auto rounded-lg bg-white p-2 text-[11px] dark:bg-surface-900">{{ lf.scanError.value.snippet }}</pre>
      <button class="mt-3 text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400" @click="chooseAnother">{{ t('largeViewer.chooseAnother') }}</button>
    </div>

    <!-- 工作区 -->
    <div v-else class="flex flex-col gap-3">
      <LargeFileTextViewer
        class="h-[55dvh] min-h-[320px]"
        :class="isFullscreen ? 'h-[70dvh]' : ''"
        :text="lf.rawText.value"
        :line-offsets="lf.lineOffsets.value"
        :active-hit="activeHit"
      />
      <LargeFileResults
        class="h-[25dvh] min-h-[160px]"
        :class="isFullscreen ? 'h-[25dvh]' : ''"
        :hits="lf.textSearch.hits.value"
        :truncated="lf.textSearch.truncated.value"
        :active-index="lf.textSearch.activeIndex.value"
        :active-hit="activeHit"
        :text="lf.rawText.value"
        :line-offsets="lf.lineOffsets.value"
        @select="onSelectHit"
        @copy="copyToClipboard"
      />
    </div>
  </div>
</template>
```

脚本：`const { isFullscreen, toggle } = useFullscreen()`；`activeHit = computed(() => lf.textSearch.hits.value[lf.textSearch.activeIndex.value] ?? null)`；`onSelectHit(i)` 设 `activeIndex`。

- [ ] **Step 2: 验证**

Run: `pnpm dev`
Expected: 视口内工作区，页面本身不出现纵向长滚动；全屏按钮与 `/tools/format/json-editor` 的样式行为一致；ESC 退出全屏；深色模式配色与站内一致

- [ ] **Step 3: 提交**（需用户确认）

---

### Task 10: 导出菜单

**Files:**
- Create: `app/components/tool/LargeFileExportMenu.vue`
- Modify: `app/components/universal/LargeJsonViewer.vue`

- [ ] **Step 1: 写菜单**

导出目标三种，全部本地 Blob 下载：

```ts
function exportHits(kind: 'txt' | 'json' | 'csv') {
  const hits = props.hits
  if (!hits.length) return
  let body = ''
  let ext = kind
  if (kind === 'txt') body = hits.map(h => `${h.line}:${h.column}\t${h.preview.trim()}`).join('\n')
  if (kind === 'json') { body = JSON.stringify(hits.map(h => ({ line: h.line, column: h.column, preview: h.preview.trim() })), null, 2) }
  if (kind === 'csv') {
    const esc = (v: string) => `"${v.replace(/"/g, '""')}"`
    body = ['line,column,match', ...hits.map(h => `${h.line},${h.column},${esc(h.preview.trim())}`)].join('\n')
  }
  const url = URL.createObjectURL(new Blob([body], { type: 'text/plain;charset=utf-8' }))
  const a = document.createElement('a')
  a.href = url; a.download = `matches.${ext}`
  document.body.appendChild(a); a.click(); document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
```

菜单 UI 用站内 `rounded-xl border border-surface-200` 卡片 + 按钮组，条目文案取 `t('largeViewer.exportTxt' / 'exportJson' / 'exportCsv')`。

- [ ] **Step 2: 把「全量记录 → CSV」接进同一菜单**

spec §2.3 要求保留现有记录导出能力，只是从主流程收进导出菜单。菜单第四项调用 `useLargeFile()` 既有的 `startExport()`：

```ts
async function exportAllRecords() {
  if (!lf.scan.value?.ok) return
  if (!lf.fields.value.length) await lf.fetchFields()
  await lf.startExport({
    columns: lf.selectedColumns.value.length ? lf.selectedColumns.value : lf.fields.value.map(f => f.path),
    delimiter: ',', includeHeader: true, bom: true, arrayMode: 'json',
  })
}
```

按钮文案 `t('largeViewer.exportRecordsCsv')`，并在旁边标一行 `t('largeViewer.exportRecordsHint')`（说明这是把记录数组导出为表格，与前面「导出匹配结果」不同）。

- [ ] **Step 3: 验证**

Run: `pnpm dev` → 搜索后分别导出三种匹配结果；再对含记录数组的文件导出全量 CSV
Expected: 四个文件都下载成功；匹配结果 CSV 用 Excel 打开列对齐（引号转义生效）；全量 CSV 行为与改动前一致；0 命中时匹配导出按钮禁用，但全量导出仍可用

- [ ] **Step 3: 提交**（需用户确认）

---

### Task 11: 删除旧代码 + 文案与 i18n 重写 + 铁律核对

**Files:**
- Modify: `i18n/locales/en.json`、`i18n/locales/zh-CN.json`（新增 `largeViewer` 命名空间）
- Modify: `app/assets/data/view/large-json-viewer.json`（补齐 `ui` / `features` / `guide` / `faq` / `article` / `meta`）
- Delete: 残留的 Structure tree 相关代码（`useLazyTree` / `useWorkerParser` 的 `parseStream` 若仅被它使用）

- [ ] **Step 1: 补齐 i18n 命名空间**

`en.json` 与 `zh-CN.json` 各加一份，键名必须完全一致：

```json
"largeViewer": {
  "dropzoneTitle": "Upload a JSON or NDJSON file",
  "dropzoneHint": "Files are processed entirely in your browser. Nothing is uploaded.",
  "chooseFile": "Choose file",
  "format": "Format",
  "formatAuto": "Auto",
  "lines": "lines",
  "wrap": "Wrap long lines",
  "lineClipped": "line clipped",
  "searchPlaceholder": "Search…",
  "search": "Search",
  "cancel": "Cancel",
  "scopeValue": "Value",
  "scopeKey": "Key",
  "scopePath": "Path",
  "results": "Matches",
  "resultsTruncated": "Only the first 5,000 matches are listed",
  "noResults": "No matches yet",
  "context": "Context",
  "copyContext": "Copy context",
  "exportTxt": "Export matches (.txt)",
  "exportJson": "Export matches (.json)",
  "exportCsv": "Export matches (.csv)",
  "scanning": "Scanning…",
  "invalidTitle": "Invalid file",
  "chooseAnother": "Choose another file",
  "skeletonHint": "Loading…"
}
```

zh 版逐条对应翻译，键名一字不差。

- [ ] **Step 2: 补齐工具 JSON 文案**

每条文案后面标注的实现出处，就是铁律要求的 `file:line` 证据。`features`（6 条）：

```json
"features": [
  { "icon": "lucide:eye", "title": "Read-only text view", "desc": "Open the file as read-only text with virtualized scrolling, so a multi-megabyte document never freezes the page. (LargeFileTextViewer.vue)" },
  { "icon": "lucide:list", "title": "Line numbers and long-line control", "desc": "Every line is numbered, long lines can be wrapped, and a single very long line is clipped instead of being rendered in full. (LargeFileTextViewer.vue)" },
  { "icon": "lucide:search", "title": "Worker search with progress", "desc": "Search values, keys or paths inside a Web Worker, case-sensitively if needed, with a progress indicator and a cancel button. (textSearch.ts / recordStream.worker.ts)" },
  { "icon": "lucide:crosshair", "title": "Jump to any match", "desc": "Each result shows its line and column. Click one to jump the text view there and read the lines before and after it. (LargeFileResults.vue / LargeFileTextViewer.vue)" },
  { "icon": "lucide:download", "title": "Copy and export matches", "desc": "Copy a match with its context, or export the whole result list as TXT, JSON or CSV. (LargeFileResults.vue / LargeFileExportMenu.vue)" },
  { "icon": "lucide:shield-check", "title": "Local only", "desc": "The file is opened and searched in your browser. Nothing is uploaded to a server. (useLargeFile.ts)" }
]
```

zh `features` 六条逐条对应翻译，键名与条数一致。

`guide`（4 步）：上传文件 → 浏览（行号 / 换行 / 长行截断） → 搜索（选范围、大小写、看进度、可取消） → 定位与导出（点结果跳转、看上下文、复制或导出）。

`faq`（6 条）：

```json
"faq": [
  { "q": "What file sizes are supported?", "a": "This page handles files that are too large for the regular tools, which accept input up to 5 MB. There is no fixed upper limit here; how large a file feels comfortable depends on its structure and your device memory." },
  { "q": "Why was I sent here from the JSON Editor or JSON to CSV?", "a": "Those pages target everyday, smaller documents. When an input is above the limit, it is handed over to this page, which processes it inside a Web Worker so the browser stays responsive. Your content is carried over automatically — you do not have to upload it again." },
  { "q": "Can I edit the file here?", "a": "No. This page is a viewer: it opens, validates, searches and exports. Editing multi-megabyte text in a browser is slow and memory-heavy, so it is deliberately not offered." },
  { "q": "Can I format or beautify the file?", "a": "No. Formatting a whole large document is exactly the kind of work this page avoids. Use the JSON Editor for files within its size limit." },
  { "q": "Does it support NDJSON / JSONL?", "a": "Yes. NDJSON files are validated line by line, and the same text view, search, jump and export features apply." },
  { "q": "Is my data uploaded?", "a": "No. Opening, scanning, searching and exporting all run in your browser. The file never leaves your device." }
]
```

zh `faq` 六条逐条对应翻译，「能编辑吗」「能格式化吗」两题的 zh 答案同样必须是明确的**不能**。

`article`：标题 "Open and search large JSON files without uploading them"，正文三段——为什么普通编辑器撑不住大文件；本页的做法（只读文本视图 + Worker 搜索 + 行号定位 + 上下文）；什么时候该改用命令行（jq / Python / DuckDB）。zh 版同结构。

`meta.title` / `meta.description` / `keywords` 围绕 `large json viewer` / `view large json online` / `search large json` 重写，**不再**包含 `json to csv` 系词（该意图由 `json-to-csv` 页承接，两页用 `recommends` 互链）。`ui` 块留空（本页全部文案走 i18n 的 `largeViewer.*`）。

- [ ] **Step 3: 删除 Structure tree 残留**

删除 `LargeJsonViewer.vue` 中对 `useLazyTree` / `parseStream` 的引用；若 `useLazyTree.ts` 与 `useWorkerParser.ts` 的 `parseStream` 已无任何调用点（全仓 grep 确认），删除这两个文件与 `app/workers/jsonStream.worker.ts`。

- [ ] **Step 4: 跑铁律核对清单**

按 `.claude/rules/copy-accuracy.md` §3 输出表格：`断言 | 来源(文件:行) | 实现位置(文件:行) | 结论`。任何指不到实现的条目当场删改。同时核对 `en` 与 `zh` 断言集合一一对应。

- [ ] **Step 5: 提交**（需用户确认）

---

### Task 12: 端到端验收

**Files:** 无新增（清理探针脚本）

- [ ] **Step 1: 跑性能门槛**

准备三个样本（用脚本生成，不入库）：`single-line-10mb.json`（单行）、`multi-line-50mb.json`（多行）、`events.ndjson`。

Run: `pnpm dev` + DevTools Performance
Expected: 50MB 打开到首屏 ≤ 3s（记录基线）；搜索期间无 >50ms 主线程长任务；Memory 面板不出现随行数线性增长的字符串数组

- [ ] **Step 2: 跑手测矩阵**

| 用例 | 期望 |
|---|---|
| 10MB 单行 | 首行截断显示 + `…` 提示，滚动流畅 |
| 50MB 多行 | 行号正确，跳转命中行准确 |
| NDJSON | 每行独立校验，搜索命中行号正确 |
| 非法 JSON | 显示行号列号与失败行片段，不进入工作区 |
| 0 命中 | 显示 `noResults`，导出按钮禁用 |
| 3000+ 命中 | 列表虚拟化，显示截断提示 |
| 搜索中取消 | 立即停止，界面不卡 |
| 移动端（375px） | 结果面板与文本视口纵向排布，均可独立滚动 |
| 深色模式 | 与站内其他工具页配色一致 |
| zh 站点 | 无英文漏出 |

- [ ] **Step 3: 交叉校验探针**

复用 Task 4 的探针思路，对最终 `app/utils/textSearch.ts` 跑一次 `node --experimental-strip-types`，确认 `hits[0].offset === text.indexOf(query)` 且 `line/column` 与 `offsetToLineCol` 一致，跑完删除临时脚本。

- [ ] **Step 4: 提交**（需用户确认）

---

## 自评备注

- Task 8 统一用 `@vueuse` 的 `useVirtualList`，**不得**再手写 `height` / `transform`，混用会把高度算两遍
- Task 6 的换行开关是 props，必须用本地 `wrapLocal` 承接，禁止直接 `v-model` 绑 prop
- 全站文案与体积阈值口径统一在 Task 11 收口，前序任务若临时写死英文，必须在 Task 11 全部替换
- `SearchTextHit.path` 为可选字段，Task 4 不填（JSONPath 属 spec P3）
