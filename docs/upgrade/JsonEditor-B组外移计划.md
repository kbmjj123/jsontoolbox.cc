# JsonEditor 移除 B 组（Schema / Generate）实施计划

> 战场：`app/components/universal/JsonEditor.vue` + `app/assets/data/format/json-editor.json`
> 姊妹项：`JsonOutputPanel-header精简计划.md`（输出面板 header）、`JsonEditor-toolbar分组计划.md`（短期分组，已落地）
> 目标：把 B 组（Schema 校验 / Generate）按钮及其挂载的两个完整面板**移出编辑器**，让 JsonEditor 回归纯"格式化/编辑"工具；用户通过已有的 Related Tools 机制跳到专用工具页。
> 关联分析：B 组按钮点击效果 = 挂载 `JsonSchemaPanel`（Schema 工具）/ `JsonGeneratePanel`（codegen 工具），与编辑器核心（输入→格式化 JSON 输出）职责错位，且与独立工具页重复（schema 重复 UI、codegen 重复逻辑）。详见对话分析。

---

## 0. 目标与硬约束

1. **JsonEditor 回归单职责**：只负责"编辑 + 格式化/压缩 + 语法校验 + 树浏览"，不再内嵌 Schema 校验/生成与代码生成。
2. **能力不丢**：移除的每一项能力都必须由专用工具页承接（已确认页面存在且 `features` 已承诺：`json-schema-validator` / `json-schema-generator` / `json-to-typescript` / `json-to-yaml` / `json-to-code`）。
3. **copy-accuracy 阻断级（本次核心风险）**：json-editor 的 `features` 当前**明文承诺** Schema 校验与代码生成——en 第 111-112（JSON Schema Validation）、136-137（Convert to TypeScript…）、141-142（Generate fetch/cURL…），zh 对应 326-327、351-352；faq en 225-226 还直接问"Does it support JSON Schema validation?"。移除 B 组 = 移除页面能力，**必须同步回扫 `features`/`faq`/`article`**，否则变虚假承诺（违反 `.claude/rules/copy-accuracy.md` §1.2 / §5）。改实现与改文案在同一改动里落地，不允许拆两次提交。
4. **路由机制现成**：json-editor 页已通过 `ToolSeoContent.vue:75-81` 用 `tool.nextSteps`/`tool.recommends` 渲染 `ToolRelated`（Related Tools 区）。本计划复用它，不新造跳转 UI（除非可选增强）。

---

## 1. 背景（要点，详见分析）

- B 组点击效果不是"编辑器子功能"，而是两个完整工具：`JsonSchemaPanel`（粘贴/生成 JSON Schema + `useSchemaValidation` 校验 + 树高亮错误）与 `JsonGeneratePanel`（TS/YAML/CSV/JSON-Schema 生成 + fetch/curl/axios/python 片段，走 `~/utils/codegen`）。
- 重复度：Schema 逻辑共享（`useSchemaGenerate`/`useSchemaValidation` 被编辑面板 + 独立页共用）→ **UI 重复**；codegen 逻辑也重复（`JsonGeneratePanel` 用 `codegen.ts`，`JsonToTypescript.vue` 等独立页内联自有 `generateInterface`/`getType`）→ **逻辑第二份**。
- 输入/输出/心智模型不同：编辑器操作"一份 JSON 的呈现"；Schema 需要第二份输入（schema 文本）产出校验报告；Generate 产出别的语言代码。

---

## 2. 影响面

| 文件 | 改动 |
|---|---|
| `app/components/universal/JsonEditor.vue` | 删 B 组两个按钮（142-150、153-161）、`schemaMode`/`generateMode` ref（335-336）、`toggleSchema`/`toggleGenerate`（339-346）、`#second` 里的两个 panel 挂载（59-60）与 import；删短期分组加的两条分隔线 |
| `app/assets/data/format/json-editor.json` | 删 3 条 `features`（en/zh）、重写相关 `faq`（en/zh）、更新 `nextSteps`/`recommends` 指向专用工具 |
| 短期分组加的分隔线（`JsonEditor-toolbar分组计划.md` 已落地） | B 组消失 → 删 A\|B、B\|C 两条分隔线，仅留 A 组 + C 组（C 为 rich-only） |
| `app/components/tool/ToolSeoContent.vue` / `ToolRelated.vue` | 不改（机制复用） |
| 专用工具页（`json-schema-validator` 等 5 个） | 不改实现；仅确认 `features` 已承诺（已确认） |

> **可选 P-optional（高风险，单列）**：把 `JsonToTypescript.vue` 等独立页的内联 codegen 改为复用 `~/utils/codegen.convert`，消第二份 TS 生成实现。需输出比对验证，不在本计划主流程。

---

## 3. 实施步骤

### P1 — 移出面板与状态（`JsonEditor.vue`）

1. 删 import：`JsonSchemaPanel`、`JsonGeneratePanel`。
2. 删 `#second` 内（当前 59-60）：
   ```html
   <JsonSchemaPanel v-if="schemaMode" :parsed-data="parsedData" />
   <JsonGeneratePanel v-else-if="generateMode" :parsed-data="parsedData" />
   ```
3. 删 `toolbar-left` 的 Schema 按钮（142-150）与 Generate 按钮（153-161），以及短期分组加的 A\|B、B\|C 两条分隔线 `<span class="h-5 w-px ...">`。
4. 删 `<script>` 内：`schemaMode`/`generateMode` ref（335-336）、`toggleSchema`/`toggleGenerate`（339-346）。`parsedData` 仍被 `JsonOutputPanel` 使用，保留。

完成后 `toolbar-left` 仅剩：A 组（缩进/Minify·Format/Auto-format）+ C 组（批量/撤销/重做，`v-if="viewMode==='rich'"`，来自短期计划）。

### P2 — 文案回扫（copy-accuracy，阻断，与 P1 同一提交）

`app/assets/data/format/json-editor.json`：

1. **删 `features`**（en + zh 同步）：
   - "JSON Schema Validation"（en 111 / zh 326）
   - "Convert to TypeScript, YAML, CSV or JSON Schema"（en 136 / zh 351）
   - "Generate fetch, cURL, Axios and Python Requests"（en 141 / zh 对应）
   - 理由：这些是"本工具内置能力"的断言，移除 B 组后不再成立。站点级覆盖由专用工具页 `features` 承接（已确认）。
2. **重写 `faq`**（en + zh 同步）：问题 "Does it support JSON Schema validation?"（en 225 / zh）答案改为"本页只做 JSON 语法校验；结构/约束校验请用 JSON Schema validator（见下方相关工具）"，去掉"本工具可生成 TS/YAML"等暗示。
3. **`article` 复核**（en 243 / zh）：文中 "schema validation… are separate capabilities" 已正确表述"separate"，无需改；确认无"本工具可生成 TypeScript/YAML"类断言残留（grep `TypeScript|YAML|CSV|schema` 在 article 仅出现在"separate capabilities"语境）。
4. **更新 `nextSteps` / `recommends`**（en + zh 同步）：
   - `recommends` 增：`json-schema-generator`、`json-to-typescript`、`json-to-yaml`、`json-to-code`（保留现有 `json-schema-validator`）。
   - `nextSteps` 保留：`json-minifier`、`json-to-csv`。
5. **copy-accuracy 审计表**（按 `.claude/rules/copy-accuracy.md` §3）：逐条列出 json-editor 剩余 `features`/`guide`/`faq`/`article`/`meta`/`ui` 断言 → 实现/专用页位置，确认无"本页内置 schema/gen"类断言；专用页 `features` 已承诺对应能力（抽查通过）。

### P3 — 入口呈现（默认零新 UI；可选增强）

- **默认**：靠 `ToolSeoContent.vue:75-81` 的 Related Tools 区（json-editor 页已渲染 `ToolRelated`）承载跳转，仅由 P2.4 的 `recommends` 配置驱动，无需新组件。
- **可选增强（不强制，避免工具栏又变长）**：在 `JsonEditor.vue` 编辑区下方加一行紧凑"相关工具"链接（复用 `ToolRelated` 或 `NuxtLinkLocale` + `tool.recommends` 解析）。若做，需回归"无横向溢出"。

### P4（可选）— 消除 codegen 逻辑重复

- 将 `JsonToTypescript.vue` 的 `generateInterface`/`getType` 等内联实现替换为 `~/utils/codegen.convert(parsedData, 'typescript', opts)`；`JsonToYaml`/`JsonToCode` 同理评估。
- **前置验证**：同输入同选项下，新旧输出逐字符一致后再合并；不一致需先对齐 `codegen.ts` 选项语义。高风险，单列 DoD。

---

## 4. DoD / 验证（Playwright `:3333`，仿 P4）

1. json-editor 页 `toolbar-left` **无** Schema / Generate 按钮（DOM 不含这两按钮文本）。
2. 右侧默认 = 格式化输出；切换视图/操作**不出现** schema/generate 面板（无 `JsonSchemaPanel`/`JsonGeneratePanel` 痕迹）。
3. 页脚 Related Tools 区出现 `json-schema-validator` / `json-schema-generator` / `json-to-typescript` / `json-to-yaml` / `json-to-code` 链接，`elementFromPoint` 命中可点击、跳转 200。
4. 跳转后 5 个专用工具页功能正常（Schema 校验/生成、TS/YAML/code 生成可产出）。
5. **copy-accuracy**：json-editor `features` 无 schema/gen 断言；重写后 `faq` 不暗示本页内置；专用页 `features` 已承诺（抽查 4 个 slug）。
6. 短期分组的 C 组 rich-only 行为回归通过（rich 可见、Text 隐藏）。
7. 宽度 1440 / 768 / 375 无横向溢出；零控制台错误。

---

## 5. 决策记录

| 日期 | 决策 | 备选 | 理由 | 反悔成本 |
|---|---|---|---|---|
| 2026-09-24 | B 组整体移出编辑器，能力交由专用工具页承接 | 保留 B 组仅做视觉分组（短期已做） / 收进下拉 | 短期分组未解决"职责错位 + 与独立页重复"；B 组点击效果是完整独立工具，不属于格式化组件 | 中：需回扫 json-editor 文案（P2）+ 确保专用页承诺 |
| 2026-09-24 | 移除 B 组必须同步删 json-editor `features` 3 条 + 重写 faq | 保留 features 仅改描述 | 这 3 条是"本工具内置"断言，不删即虚假承诺（copy-accuracy 阻断级） | 低：文案单点 |
| 2026-09-24 | 跳转复用现有 `nextSteps`/`recommends` → `ToolRelated`，不新造 UI | 在工具栏加"跳转"按钮 | 新按钮会让工具栏又变长（回到蔓延），且 Related Tools 区已现成 | 低 |
| 2026-09-24 | codegen 重复消除列为可选 P4，不进主流程 | 一并重构独立页 | 独立页改 `codegen` 需输出比对、风险高，且与"移出 B 组"无依赖 | 低：独立任务 |

---

## 6. 后续工具栏微调（A / C 组，2026-09-25）

B 组移出后，用户继续审查 A 组（缩进 / Minify·Format / Auto-format）与 C 组（批量 / 撤销 / 重做），判断"重复 / 无用"，结论与落地如下。

### 6.1 A 组 — 移除 Auto-format 切换，行为改为常开

- **分析**：Minify / Format 是同一个互斥开关的两端（选"紧凑"或"可读"输出），**并非冗余**；Auto-format 是"输入实时/粘贴美化"另一诉求，与 Format 在"可读化"上概念重叠。
- **决策**：移除 Auto-format 切换按钮，但**保留行为常开**——`onInputPaste` 始终调用 `formatInputInPlace()`，`watch(inputJson)` 始终走 `debouncedFormat + debouncedFormatInPlace`，`watch(indent)` 始终 `formatInputInPlace()`。
- **copy-accuracy 影响**：`Clipboard Workflow` 特性承诺"Pasted JSON is formatted automatically / 粘贴 JSON 会自动格式化"——行为常开后该承诺**仍然成立**，无需改文案。
- **落地**（`JsonEditor.vue`）：删 `#toolbar-left` 的 Auto-format `<label>` 块；删 `const autoFormat = ref(true)`；删全部 `autoFormat.value` 引用（setMinified / setFormatted 的 `if (!autoFormat.value) formatJson()`、onInputPaste 的 `if (autoFormat.value)`、两个 watcher 的 `if (autoFormat.value)` 包裹）。已 grep 确认无 `autoFormat` 残留。

### 6.2 C 组 — 撤销/重做仅"可点时"才显示

- **分析**：批量多选改值是 niche（数组批量设同值）但真实有用；撤销/重做是树形编辑的基础安全网，不应删。原实现把 undo/redo 一直渲染为**灰色 disabled**，显得"无用"。
- **决策**：undo / redo 改为 `v-if="viewMode === 'rich' && nodeEditing.canUndo.value"` / `canRedo.value`——只有在树形视图且确有可撤销/重做操作时才出现；批量按钮保留为树形模式切换（进入多选模式始终可点），其操作条（`batchValue` 输入 + Apply）本就在选中节点后才出现。
- **copy-accuracy 影响**：`Edit JSON in the Tree` 特性仍承诺"undo or redo any change / 支持撤销与重做"——能力仍在、只是按钮按需出现，**承诺仍成立**，无需改文案。

### 6.3 决策记录（追加）

| 日期 | 决策 | 备选 | 理由 | 反悔成本 |
|---|---|---|---|---|
| 2026-09-25 | 移除 Auto-format 切换，行为常开 | 三按钮全留 / 仅移除切换改行为常关 | Minify·Format 是单开关不冗余；Auto-format 与 Format 概念重叠且为最可删项；常开保住"粘贴美化"且文案承诺仍在 | 低：纯组件内 |
| 2026-09-25 | 撤销/重做改为可点时才显示（canUndo/canRedo） | 全删 / 全留（含灰色 disabled） | 撤销重做是基础安全网不该删；灰色 disabled 显得无用，按需显隐既精简又不丢能力 | 低：纯组件内 |

