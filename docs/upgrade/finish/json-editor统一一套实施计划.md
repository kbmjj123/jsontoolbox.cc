# JSON 编辑器「合并为一套」实施计划（P1 方案）

> 主战场：`packages/json-editor/` + `app/components/universal/JsonEditor.vue`
> 姊妹项：`JsonEditor-toolbar分组计划.md`（已落地）、`JsonEditor-B组外移计划.md`、`JsonOutputPanel-header精简计划.md`
> 目标：站点自用编辑器与 npm 包 `@kbmjj123/json-editor` 收敛为**一套**——包成为唯一实现，站点旗舰页变成「包组件 + 站点外壳注入」。
> 决策来源：2026-10-10 讨论。用户定调「宁愿一口气调整，也不要长期维护两套」，并明确以**外部开发者嵌入意图**为锚（他们看中的是首页 CTA 指向的旗舰编辑器页，想要类似的）。
> 行号以当前 `develop` 为准，实施前请以代码现状复核。

---

## 0. 目标与硬约束

1. **编辑器这件事只剩一份实现。** 判定标准：包的 `src/` 是真源，站点不得再存在等价的第二份。
2. **包的定位是对外分发为主**（外部开发者嵌入 + 换取外链）。包不得引入 Nuxt 依赖（`useI18n` / `useToast` / `useState` / `navigateTo` / `~/` 别名 / auto-import），不得依赖 Tailwind 设计系统。
2-bis. **包的 core 保持纯 `JSON.parse` 语义**（2026-10-10 定）：不做自动修复（`jsonrepair` 不进包）、不做 BigInt 兜底（默认路径不开启）、不养友好错误文案表（`useJsonFixer.ts:282-326` 的 `ERROR_PATTERNS` 留站点）。站的增强一律留在站点侧。包内 `parseJson` 的 `bigInt` 选项保持 opt-in 现状，不作为统一后的共享默认行为。
3. **L4 站点外壳明确划在包外**：分享 payload、5MB 大文件转交、敏感字段遮罩、示例下拉、Nuxt i18n、站点设计系统。这些通过 slot 与 `messages` 注入，不进包。
4. **包不引入 `marked` + `DOMPurify`**。值检查器拆开：时间戳 / Base64 / JWT / 颜色的**纯识别逻辑**进包；**Markdown 预览**留在站点。
5. **copy-accuracy 阻断级**（`.claude/rules/copy-accuracy.md` §5）：
   - `/tools/format/json-editor` 是**流量旗舰页**（首页精选第 1 位 `useTools.ts:7`，且 `useShareJson.ts:300` 硬编码把所有分享链接导向它）。任何可观测行为变化，必须同步回扫 `app/assets/data/format/json-editor.json` 的 `features` / `guide` / `faq` / `article` / `meta` / `ui`。
   - 改实现与改文案必须在**同一个改动**里落地，不允许拆两次提交。
   - 包的 README 同样受此约束（已有一轮对齐：props / events / 错误跳转 / 树复制三项）。
6. **i18n 双语**：包内 `src/i18n/en.ts` 与 `zh.ts` 键集合必须严格一一对应（类型系统会强制）；站点侧 `i18n/locales/en.json` 与 `zh-CN.json`（注意是 `zh-CN`）。包内文案禁止 `?? 'English fallback'` 式兜底。
7. **发布节奏：等补齐后一起发。** 0.1.0 的发布前置项（README 对齐、CI、组件测试、demo 产物清理）已完成并留在仓库里，但**不单独发版**，等 P3 完成后发第一个正式版本。

---

## 1. 背景：不是两套，是四套

| # | 实现 | 使用面 |
|---|---|---|
| 1 | `app/components/universal/JsonEditor.vue`(725) | 仅 1 页 `/tools/format/json-editor` |
| 2 | `tool/JsonInputEditor`(831) + `JsonOutputPanel`(595) + `JsonTreeNode`(627) 家族 | **24~28 个工具页**，是全站输出渲染层 |
| 3 | `universal/LargeJsonViewer.vue` | Worker 流式解析 + 虚拟滚动 |
| 4 | `packages/json-editor` | 仅 `/developers` 一页 |

**重叠面只有一处：#1 旗舰页编辑器 ↔ #4 包。** #2 是「全站输出渲染层」，与编辑器职责不同；#3 明确排除（另一类问题）。

### 1.1 用户意图锚点

首页次 CTA 直指 `/tools/format/json-editor`（`app/pages/index.vue:35`），该页是首页精选第 1 位（`useTools.ts:7`，带 🔥 trending）。外部开发者想搬走的就是这个页面的体验：左输入（上传/粘贴/清空/示例 + 错误行 + 友好报错）、右输出（text / rich 树 / table 三视图 + 树内搜索 + 批量/撤销/重做）。

### 1.2 能力对照（包缺什么）

| 旗舰页可见能力 | 包现状 |
|---|---|
| 语法高亮编辑 + 实时校验 + 错误行定位跳转 | ✅ |
| 格式化 / 压缩 / 缩进 | ✅ |
| 树：折叠展开、搜索、复制 path / JSONPath / value | ✅（搜索仅 key+value 两模式，站点有 5 种） |
| 表格视图（排序、列显隐、导出 CSV） | ❌ |
| 节点级编辑（改值/改名/改类型/增删/移动 + undo/redo + 批量） | ❌ |
| JSONPath 求值（`$.a[0]` / `..key` / `[?(@.x=="y")]`） | ❌ |
| 值检查器 | ❌（本计划只搬纯识别部分） |
| 明暗主题 + 一行 script 嵌入 | ✅ |
| 分享链接 / 敏感遮罩 / 5MB 门槛 / 示例下拉 | ❌ —— **属于 L4，不进包** |

### 1.3 关键结论：要搬的能力，核心逻辑是纯的

- `app/composables/useJsonPath.ts`(235) **零外部依赖**
- `app/composables/useTreeSearch.ts`(338) 仅 import 上面那个（`:2`）
- `app/composables/useNodeEditing.ts`(324) 逻辑全纯，仅 2 处碰 Nuxt：`useToast()`(`:89`)、`useI18n()`(`:90`)，且只用于反馈提示

搬得动的是逻辑，搬不动的是 UI 胶水与站点外壳——这决定了本计划的成本结构。

---

## 2. 分层决策

| 层 | 内容 | 决策 |
|---|---|---|
| **L1** | parse / sourceMap / path / tree / format 纯函数 | **统一**，包 `src/core` 为唯一真源 |
| **L2** | CodeMirror 内核（站点 `tool/CodeMirrorEditor.vue` vs 包 `src/vue/useCodeMirror.ts`） | **统一** |
| **L3** | 树 / 表格渲染层 + 节点编辑 + 搜索 + 值检查器 | **包补齐**，旗舰页改为用包 |
| **L4** | 分享 / 大文件转交 / 敏感遮罩 / 示例下拉 / Nuxt i18n / Tailwind | **留站点，通过 slot + `messages` 注入** |

### 2.1 逐字重复清单（L1 的主要战场）

| 逻辑 | 站点 | 包 | 关系 |
|---|---|---|---|
| `buildSourceMap` | `app/utils/sourceMap.ts:10-145` | `src/core/sourceMap.ts:9-140` | 几乎逐字相同 |
| `toJsonPath` | `app/utils/jsonPath.ts:10-17` | `src/core/path.ts:10-17` | 完全相同 |
| `jsonTypeLabel` | `app/utils/jsonPath.ts:22-26` | `src/core/path.ts:21-26` | 相同 |
| `parseJson` + BigInt 兜底 | `app/composables/useJsonParser.ts:13-57` | `src/core/parse.ts:27-57` | 同构；文件内 `parseJson`/`hasLargeNumbers`/`validateJson` **无人调用**，仅 `getErrorLocation` 有 2 个消费者 → P1 已删文件 |
| `getErrorLocation` | `useJsonParser.ts:74-87` | `src/core/parse.ts:93-103` | 相同 |
| `validateJson` | `useJsonParser.ts:94-103` | `src/core/parse.ts:105-112` | 相同 |
| 树模型 | `JsonTreeNode.vue:93` 递归自调用 + `JsonOutputPanel.vue:442-456` 全展开路径集合 | `src/core/tree.ts:97-109` 扁平 `flattenVisible` | **模型不同**，是 L3 的主要摩擦点 |

---

## 3. 影响面

| 文件 | 阶段 | 改动 |
|---|---|---|
| `app/utils/sourceMap.ts` | P1 ✅ | **已删除**，改由 `@kbmjj123/json-editor/core` 提供 |
| `app/utils/jsonPath.ts` | P1 ✅ | **已删除**，同上 |
| `app/composables/useJsonParser.ts` | P1 ✅ | **已删除**（并非死代码：`getErrorLocation` 被 2 个工具使用，已改为直接 import 包） |
| `app/composables/useJsonEditor.ts` | P1 ✅ | **已删除**（确认零消费者，真死代码） |
| `package.json`（根） | P1 ✅ | `postinstall` 增加构建包；新增 `build:pkg` 脚本。修复「dist 被 gitignore，新克隆后站点构建必失败」的隐患 |
| `app/composables/useJsonPath.ts` / `useTreeSearch.ts` / `useNodeEditing.ts` | P3.1 | 迁入包，站点改为 import 包 |
| `app/components/tool/CodeMirrorEditor.vue` | P2 ✅ | 改用包 `createCodeMirror`，皮肤 + diff/高亮 StateField 作为扩展注入；删除 `vue-codemirror6` |
| `app/components/tool/JsonInputEditor.vue` | P2 | 改 CM 来源（**先不动，见 P2 风险面**） |
| `app/components/universal/JsonEditor.vue` | P4 | 改为「包组件 + 外壳注入」 |
| `app/components/tool/PackageJsonEditor.vue` | P4 | 扩充 prop / 事件转发 / slot（当前仅 5 个 prop，`error`/`select`/`oversized-paste` 全丢，`:19-30`） |
| `app/assets/data/format/json-editor.json` | P4 | copy ↔ 实现重审（en + zh） |
| `packages/json-editor/src/**` | P1-P3 | 成为真源 |
| `packages/json-editor/README.md` | P3/P5 | 新增能力同步进文档 |
| `app/components/tool/JsonOutputPanel.vue` 家族 | — | **不改**（P1 阶段只共享 L1） |
| `universal/LargeJsonViewer.vue` | — | **明确排除** |

---

## 4. 实施步骤

### P0 — 测试护栏 ✅ 已完成（2026-10-10）

站点零测试基建，而 L1 被 24 个页面依赖。**先把现有行为固化成测试再动代码。**

1. 包内补 `test/core` 边界用例（28 → 56 个用例全绿）：`buildSourceMap`（键含 `.` / `[`、转义引号与反斜杠、字符串内含结构字符、空容器、顶层与嵌套数组、CRLF、行号归属）、`toJsonPath` / `ancestorPaths`（含 `''` / `0` / `[0]` / 含点键）、`parseJson`（BigInt 正负、数组内大数不转换、16 位阈值、两种引擎错误格式、`getErrorLocation` 合成消息确定性断言与越界钳制）。
2. **站点 ↔ 包差分验证（已通过，P1 的安全凭据）**：把两个零导入纯模块复制进包内跑同一批语料比对输出 —— 24 条 JSON（含非法/截断、Unicode、emoji、CRLF、转义引号、嵌套数组）+ 11 条 path + 11 个取值，**两边输出完全一致**。差分脚本为一次性产物，跑完即删。
3. 消费者盘点（决定 P1 的风险面）：
   - `buildSourceMap` —— **全站仅 1 个消费者**：`universal/JsonEditor.vue:359`
   - `toJsonPath` / `jsonTypeLabel` —— **10 个消费者**：`JsonNodeMenu.vue`、`NodeInspector.vue`、`LargeFileResults.vue`、`JsonTreeNode.vue`、`JsonOutputPanel.vue`、`JsonTableView.vue`、`JsonPathTester.vue`、`JsonCompare.vue`、`LargeJsonViewer.vue`
4. 验收：`pnpm --filter @kbmjj123/json-editor run test` 全绿（56 用例）。

> 已固化的行为契约（改动即视为回归）：**`buildSourceMap` 记录的是冒号所在行，不是值所在行**——`map.set` 发生在消费 `:` 之后、解析值之前。键与冒号之间的换行会计入，冒号之后的换行不计。

### P1 — L1 统一 ✅ 已完成（2026-10-10）

1. **前提（§0 2-bis）**：`jsonrepair` 修复、BigInt 兜底、友好错误文案映射**都不进包**，包的 core 保持纯 `JSON.parse` 语义。站点走 §5 #7 的 **A 方案**：调用包的 core，增强叠在外面。
2. **纯函数替换**（P0 差分已证明输出全等）：删除 `app/utils/sourceMap.ts`、`app/utils/jsonPath.ts`，11 处 import 改为 `@kbmjj123/json-editor/core`。
   - 注意 `JsonEditor.vue` 里的 `buildSourceMap` 原本是 **Nuxt auto-import**（`app/utils/*` 无 import 行），删除文件后必须显式补 import，否则静默失效。
3. **parse 收敛**：
   - `useJsonFixer.getJsonError` → 调用包 `analyzeJson`（归一化消息 + 行列一次给出），站点只补 `errorKey → i18n` 友好文案映射。原实现里的 `offset` 无人消费，已移除（`ParseError.offset` 本就是可选字段）。
   - `JsonEditor.vue` 的 `parsedData` → `parseJson(...).data`。
   - 删除 `useJsonParser.ts`：`getErrorLocation` 的两个消费者（`JsonParseStringify.vue`、`JsoncToJson.vue`）改为直接 import 包。文件内 `parseJson` / `hasLargeNumbers` / `validateJson` 确认无人调用，随文件删除（其 BigInt 分支本就是本次「不进包」的对象）。
   - 删除 `useJsonEditor.ts`（零消费者）。
4. **修隐患**：`packages/json-editor/dist` 被 gitignore，而站点经 `@kbmjj123/json-editor` 依赖它 —— 新克隆仓库装完依赖直接 `pnpm build` 会失败。已把构建包加进根 `postinstall`，并新增 `build:pkg`。
5. 验收：站点 `pnpm build` 通过（332 条路由预渲染，0 error）；旗舰页及受影响的 `json-parse-stringify` / `jsonc-to-json` / `json-path-tester` / `json-compare` / `large-json-viewer` / `developers` 均正常产出且无 "Tool component not found"。

> **未做（有意保留）**：`JsonEditor.vue` 里仍有 4 处裸 `JSON.parse`（`:306`、`:544`、`:555`、`:594`、`:659`）在 try/catch 内。它们只是直接调用平台 API，不含重复逻辑；真正重复的部分（错误归一化 + 行列计算 + BigInt 包装）已只在包里有一份。改成 `parseJson` 需要重构这些函数的错误流（含 toast / `lastAction` / jsonrepair 回退），收益低、无测试覆盖，故不动。若日后要彻底消除，单独立项并先补测试。

### P2 — L2 统一 ✅ 已完成（2026-10-10）

1. 站点 `tool/CodeMirrorEditor.vue`（`vue-codemirror6`）↔ 包 `src/vue/useCodeMirror.ts`（裸 `@codemirror/*`）收敛成一份：包 `createCodeMirror` 新增 `extensions` 注入点，站点把皮肤（`Prec.high(EditorView.theme(...))`）与 diff / 高亮两个 `StateField` 作为扩展注入，移除 `vue-codemirror6` 依赖与 `nuxt.config.ts` 的 transpile 残留。
2. **风险面控制**：`JsonInputEditor.vue` 暂不动（仍走它自己的 CM 来源），回归面压在旗舰页与 `json-compare` 的对比编辑器上。
3. **顺手修的 bug**：重写时原先 `highlightLines` 误走 `decorationEffect`（diff 字段），导致 flash/subtle 高亮与 diff 装饰共用一个 StateField、`clearLineDecorations` 会误清高亮。已拆成 `highlightEffect` 独立字段，与 `decorationEffect` 分离。
4. **验证**：
   - 真机（浏览器）已验证旗舰页 `/tools/format/json-editor`：CM 经包挂载、皮肤与语法高亮生效、暗色切换正常、输入实时同步到输出、**0 console error**（P2 前一轮）。
   - 新增 `packages/json-editor/test/codemirror-extensions.test.ts`：确定性断言「注入的装饰 StateField 能在目标行解析到 `diff-added` 装饰」——正是 `setLineDecorations` 依赖的路径（jsdom 下 CodeMirror 的 RAF/measure 不稳定，故只读 `view.state.field(field)` 而非 DOM 类名）。
   - 包 57 测试全绿；站点 `pnpm build` 332 路由 0 error。
   - **未做（环境限制）**：本环境无 Playwright / 浏览器，未重跑「在 json-compare 输入两段 JSON、点 Compare、肉眼确认 `.diff-added/.diff-removed/.diff-changed` 行底色」的真机视觉检查。建议发布前手动过一遍（或装 Playwright 后补一个 e2e）。
5. ** `--je-bg-hover` / `--je-bg-active` 说明**：包 baseTheme 引用这两个变量，但站点 `.cm-host` 未定义；站点皮肤用 `Prec.high` 把 `.cm-activeLine` 设透明、`.cm-selectionBackground` 设 `#b5d5ff80 !important`，恰好覆盖了这两处，故未定义变量不产生可见副作用。

### P3 — L3 包补齐

**3.1 纯逻辑迁入**
- `useJsonPath.ts` → 包内 `src/core/jsonPath.ts`（零依赖，可直接搬）
- `useTreeSearch.ts` → 包内，5 种模式 `'key'|'value'|'path'|'all'|'jsonpath'`（`:4`）
- `useNodeEditing.ts` → 包内；`useToast()` / `useI18n()` 换成可注入的 `onNotify` 回调 + `messages`

**3.2 UI 补齐**
- `TreeView.vue` 接 5 种搜索模式
- 新增节点菜单：改名 / 改值 / 改类型 / 增删 / 移动（对齐 `JsonNodeMenu.vue:48-78` 的 `edit.*` 能力集）
- 新增 undo / redo / 批量赋值（暴露为 composable + 工具条 slot）
- 新增 `TableView`：排序、列显隐、导出 CSV（导出是否复用 `app/utils/csv.ts` 见 §5）✅ done 2026-10-12

**3.3 值检查器（拆分）**
- 进包：时间戳 / Base64 / JWT / 颜色的**纯识别**（类型判定逻辑在 `app/utils/mediaPreview.ts`）
- 留站点：Markdown 预览（`marked` + `DOMPurify`）、图片 lightbox、`MediaToDataUriModal`

**3.4 i18n**
- 包 Messages 从 38 键涨到约 80 键，en/zh 必须一一对应。用 playbook §4 的自检脚本核对：
  ```bash
  node -e "const d=require('./packages/json-editor/src/i18n/en.ts')…"
  ```
  （实际以 `Object.keys` 比对两文件为准）

### P4 — 旗舰页改造

1. 包先提供扩展点：工具栏 / 页脚 / 节点菜单 slot；`error` / `select` / `oversized-paste` 事件完整转发；`messages` 覆盖；`theme` 桥接（站点 `useColorMode()` → 包 `theme`）。
2. `universal/JsonEditor.vue` 改为「包组件 + 外壳注入」：分享横幅 / 错误态、5MB 门槛（`useLargeFile.ts:60`）、敏感遮罩、示例下拉、Nuxt i18n 映射全部挂 slot。
3. `PackageJsonEditor.vue` 扩充 prop 与事件。
4. **copy ↔ 实现审计**：`app/assets/data/format/json-editor.json` en + zh 逐条比对，输出 playbook §7 的表格。

### P5 — 发布

P3 完成后发第一个正式版本。前置项已完成：
- README 与实现对齐（props / events / 错误跳转 / 树复制）
- CI（`.github/workflows/ci.yml`：typecheck → test → build）
- 组件冒烟测试（37 用例，含 Web Component + shadow DOM）
- `demo/demo-dist` 构建产物已 untrack 并 gitignore
- IIFE / CDN 路径已真机验证（`<json-editor>` 自动注册、CodeMirror 挂载、状态栏、错误跳转按钮）

验收命令：
```bash
pnpm --filter @kbmjj123/json-editor run typecheck
pnpm --filter @kbmjj123/json-editor run test
pnpm --filter @kbmjj123/json-editor run build
npm pack --dry-run            # 在 packages/json-editor 下
```
CDN 真机冒烟（file:// 被浏览器策略挡，需起本地 http）：
```bash
cp packages/json-editor/dist/json-editor.iife.{js,css} /tmp/je-smoke/
cd /tmp/je-smoke && python3 -m http.server 8099
# 浏览器打开 http://127.0.0.1:8099/index.html，验证 shadowRoot 内 .je-root / .cm-editor / 状态栏
```

---

## 5. 未决问题（实施前需定）

| # | 问题 | 影响 |
|---|---|---|
| 1 | ~~**视图枚举不兼容**：包 `editor\|tree\|both` vs 站点 `text\|rich\|table`~~ → **包扩展语义（已定 2026-10-12，P3-6）** | 包 `JsonEditorView` 扩为 `'editor'|'tree'|'both'|'table'`，`view="table"` 渲染 `TableView`；站点 P4 做映射或改投包语义 |
| 2 | ~~`jsonrepair` 修复链路是否进包~~ → **不进包**（已定 2026-10-10） | 站点保留自己的修复链路；包维持「不支持自动修复」的既有文案承诺（见 §0 2-bis） |
| 3 | ~~BigInt 兜底是否进包~~ → **不进包**（已定 2026-10-10） | 包内 `parseJson` 的 `bigInt` 保持 opt-in，不成为共享默认；站点保留自己的兜底 |
| 3-bis | 错误友好文案映射（`ERROR_PATTERNS`）是否进包 | 按「不进包」同一原则：留站点。进包就要养 en/zh 两份文案表，与纯 `JSON.parse` 定位冲突。若以后希望包也有友好报错，单独立项 |
| 4 | ~~**表格导出 CSV** 是否复用 `app/utils/csv.ts`~~ → **不复用，包内自建纯 `toCsv`（已定 2026-10-12，P3-6）** | 包保持零站点依赖；`core/csv.ts` 的 `toCsv` 行为对齐站 `generateCsv`（RFC4180 引号），嵌套值改 JSON.stringify；P3-8 站点可改投包实现 |
| 5 | **树渲染模型**：扁平 `flattenVisible` vs 递归组件 | L3 必须二选一重写一边。倾向保留包的扁平模型（搜索高亮与展开态控制更简单），把站点递归组件的能力平移过来 |
| 6 | 站点 i18n（`useI18n`）与包 `messages` prop 的桥接方式 | 站点有约 15 个 key 命名空间要映射进包的 ~80 键 |
| 7 | **站点的 parse 层要不要改为调用包的 `parseJson`** | 承 #2/#3 而来：增强不进包，但站点若继续自带 parse，则 parse 仍是一份独立实现，与「不长期维护两套」冲突。见下方说明 | |

### #7 说明：增强留站点 ≠ parse 一定两套

站的 parse 是「裸 `JSON.parse` → 失败后 `jsonrepair` 修复 → BigInt 兜底 → 友好文案映射」四层叠加（分散在 `JsonEditor.vue:521` 的 `parsedData`、`useJsonFixer`、`JsonInputEditor`）。既然增强层不进包，有两种收敛方式：

- **A（收敛）**：站点改为调用包的 `parseJson` / `analyzeJson`，把 jsonrepair 修复、BigInt 兜底、友好文案**叠在外面**当装饰层。parse 只剩一份实现（包的），站点的增强行为全部保留。
- **B（不动）**：站点保留自己的 parse 实现，本轮只统一已被差分证明等价的 `buildSourceMap` / `toJsonPath` / `jsonTypeLabel`。风险最低，但 parse 这一层仍是两套。

---

## 6. 明确不做

- `universal/LargeJsonViewer.vue` 不纳入（Worker 流式 + 虚拟滚动，另一类问题）
- 24 个工具页的 `JsonOutputPanel` 家族不改 UI（只共享 L1）
- 包不引入 Nuxt 依赖、不引入 Tailwind、不引入 `marked` / `DOMPurify`
- 包的 L4 能力（分享 / 大文件 / 敏感 / 示例）不做
