# JSON 常规功能升级 — 实施计划

> 配套文档：`docs/upgrade/json常规功能.md`
> 主战场：`app/components/universal/JsonEditor.vue`
> 原则：**能复用绝不重写**；每阶段收尾跑 copy-accuracy 审计（§3 表格，en/zh 同步）。

---

## 0. 目标与硬约束

1. **纯前端 / 客户端**：所有处理留在浏览器，不新增任何网络请求（与隐私卖点一致）。
2. **大文件闸口**：`JsonEditor` 只处理 `< LARGE_FILE_MAX_BYTES` 的文档（`useLargeFileGate` 已接管超限 → 转交 `LargeJsonViewer`）。本计划所有新能力都只作用于主线程小文档；Diff / 转换不绕过此闸。
3. **copy-accuracy（阻断级）**：每个写在 UI / `json-editor.json` 里的能力断言，必须能指认 `file:line`；新增能力必须同步更新 `app/assets/data/format/json-editor.json`（`features` / `guide` / `faq` / `article` 的 `en` + `zh`），并在合入前跑审计。
4. **i18n 双语**：界面 key 落在 `i18n/locales/en.json` + `zh-CN.json`；工具文案 key 落在 `app/assets/data/**` 的 `en` / `zh`（**不是** `zh-CN`）。任何 `?? 'English'` 兜底在 zh 页会漏英文，新增时一律双边提供。

---

## 1. 现状与可复用资产（带锚点）

| 资产 | 位置 | 可复用点 |
|---|---|---|
| 复制路径 | `JsonTreeNode.vue:697` `selectAndCopy` | 已能在点击叶子时复制 path；F1 在其上扩展菜单 |
| 路径拼接 | `JsonTreeNode.vue:669` `getFullPath` | 产出 `a.b[0].c` 形式，JSONPath 只需加 `$` 前缀 |
| 值着色 / 颜色 | `JsonTreeNode.vue:720` `valueColorClass` + `useSmartJsonValue.ts` `isColorValue`/`getColorStyle` | F6/F7 颜色预览直接复用 |
| 图片预览 | `JsonTreeNode.vue:80,154` + `useImagePreview.ts` | F6 图片/Base64 图片起步点 |
| 搜索核心 | `useTreeSearch.ts` | key/value/path 三模式 + 匹配计数 + 上下跳转 + 祖先展开；F8 增强在此之上加 regex/大小写/整词/范围/列表/导出/历史 |
| 搜索 UI | `JsonOutputPanel.vue:52-126` | 搜索框/模式下拉/计数/上下按钮；F8/F9 接管此区块 |
| 表格视图 | `JsonTableView.vue` | 列合并 + 排序 + hover popover（嵌套对象）；F2 加列隐藏/列宽/表内搜索/复制行/CSV 导出/分页 |
| 字段错误高亮 | `JsonOutputPanel.vue:441` `errorMap` + `provide('jsonErrors')` + `JsonTreeNode.vue:539` `getNodeErrors` | F3 差异、F4 Schema 错误都走这条通道上树 |
| 定位/闪烁 | `JsonOutputPanel.vue:497` `locateTarget`→`locatePath`；`JsonTreeNode.vue:443` watch `locatePath` 展开祖先+滚动+flash | F8 结果跳转、F3/F4 错误定位直接复用 |
| Schema 校验 | `useSchemaValidation.ts`（Ajv） | F4 直接复用 `validateWithSchemaText` |
| JSONPath 求值 | `JsonPathTester.vue:160` `getByPath` + `evaluate` | F9 抽成共享 `useJsonPath` |
| 代码生成 | `JsonToCode.vue:161-280` `generateTypeScript/Python/Go/.../generate` | F10 抽成共享 `app/utils/codegen.ts` |
| Diff 内核 | `jsondiffpatch`（依赖） | F3 结构化 diff |
| YAML | `js-yaml`（依赖） | F10 YAML 输出 |
| 扁平化/CSV | `useJsonFlatten.ts:14` `flattenObject`/`:62` `flattenArray`；`useTablePreview.ts` | F2 导出 CSV、F10 CSV 复用 |
| 剪贴板 | `app/utils/index.ts:20` `copyToClipboard`；`useClipboard.ts:18` 包一层带 toast | F12 统一收口 |
| 树←表联动 | `JsonTableView.vue:231` `onRowSelect`→`onNodeInteraction(path,'click')` | F2 表格行点击已能驱动左侧高亮；补 JSONPath 复制 |

---

## 2. 集成架构

`JsonEditor.vue` 维持「左输入 `JsonInputEditor` / 右输出 `JsonOutputPanel`」双栏（`ResizablePanel`）。新能力挂载方式：

- **树节点层**：`JsonTreeNode` 增加右键/「⋯」菜单（`JsonNodeMenu`）+ 值检视器（`JsonValuePreview`/`JsonValueInspector`）→ 承载 F1、F5、F6、F7。
- **输出区模式层**：`JsonOutputPanel` 的 viewMode 增加 `compare` / `schema` / `generate`；搜索条升级支持 `jsonpath` 模式与增强选项 → 承载 F2（per-array 表格在树内切换）、F3、F4、F8、F9、F10、F11。
- **全局交互**：`useClipboardActions` 收口复制/替换 → F12。

新增文件清单：
- `app/components/tool/JsonNodeMenu.vue`
- `app/components/tool/JsonValueInspector.vue`（侧边/弹层检视器）
- `app/components/tool/JsonValuePreview.vue`（值类型芯片 + 操作）
- `app/components/universal/JsonComparePanel.vue`（或 `app/components/tool/`）
- `app/components/tool/JsonSchemaPanel.vue`
- `app/components/tool/JsonGeneratePanel.vue`（含 API 子页）
- `app/composables/useJsonPath.ts`（从 `JsonPathTester` 抽）
- `app/composables/useNodeEditing.ts`
- `app/composables/useJsonDiff.ts`
- `app/composables/useClipboardActions.ts`
- `app/utils/jsonPath.ts`（`toJsonPath` 等）
- `app/utils/codegen.ts`（从 `JsonToCode` 抽共享转换器）
- `app/utils/mediaPreview.ts`（扩展 `useSmartJsonValue` 的类型与解码）

---

## 3. 分阶段实施计划（每条对应文档，无遗漏）

### P0

#### P0-1 复制 JSONPath（文档 F1 全文）
**目标**：树节点支持复制 JSONPath / 当前值 / 当前节点 / 父节点路径，并显示节点类型与数组索引。

**复用**：`JsonTreeNode.vue:697 selectAndCopy`（复制 path）、`:669 getFullPath`（拼路径）、`useClipboard.ts`（带 toast 复制）、`:720 valueColorClass`（类型着色）。

**实施步骤**：
1. 新增 `app/utils/jsonPath.ts`：`toJsonPath(path)` —— `path` 为空返回 `'$'`；否则 `'$' + (path[0] === '[' ? path : '.' + path)`（例 `users[0].profile` → `$.users[0].profile`）。供 F1/F9 共用。
2. `JsonTreeNode.vue` 叶子行增加：
   - `@contextmenu.prevent="openNodeMenu(entry)"` 与一个 hover 时出现的「⋯」按钮。
   - 行尾常驻微标：节点类型（`typeof value` 映射：string/number/boolean/null/object/array）+ 数组项显示 `[i]`（行 49/125 已有 `[index]`，补类型标签）。
3. 新增 `JsonNodeMenu.vue`（`<Teleport to="body">`）：接收 `{ path, parentPath, value, key, isArrayIndex }`，菜单项：
   - Copy JSONPath → `copyToClipboard(toJsonPath(path))`
   - Copy value → `copyToClipboard(String(value))`
   - Copy node → `copyToClipboard(JSON.stringify(value, null, 2))`
   - Copy parent path → `copyToClipboard(toJsonPath(parentPath))`
   - 显示类型 / 数组索引（只读信息行）
4. 复制成功反馈走 `useClipboard.ts` 的 `justCopied` 模式（与 `JsonEditor` 的 `copyJustCopied` 一致）。

**文件改动**：新增 `JsonNodeMenu.vue`、`app/utils/jsonPath.ts`；改 `JsonTreeNode.vue`。
**i18n**：`en/zh-CN` 增加 `node.copyJsonPath` / `copyValue` / `copyNode` / `copyParentPath` / `node.type` / `node.arrayIndex`（键名沿用 `JsonOutputPanel` 已存在的 `copyPath`/`copyJsonPath`/`copyNode`/`copyParentPath` 以避免重复）。
**copy-accuracy**：`json-editor.json` 的 `features` 增加「Copy JSONPath, node type, array index」；审计指 `JsonNodeMenu.vue` 各菜单项处理函数。

#### P0-2 数组表格视图（文档 F2 全文）
**目标**：对任意「结构较一致的对象数组」启用表格；列排序（已有）、列隐藏、列宽拖拽、表内搜索、复制行、导出 CSV、分页、嵌套对象显示路径/折叠。

**复用**：`JsonTableView.vue`（列合并 `:92`、排序 `:126`、虚拟滚动 `:178`、hover popover `:188` 已覆盖嵌套对象）；`useJsonFlatten.ts:62 flattenArray` + CSV 序列化（F10 共用）；`JsonTreeNode.vue` 数组行（新增「表格」入口）。

**实施步骤**：
1. 一致性判定（新增于 `JsonTableView` 或 `useTablePreview`）：当数组元素皆为对象且 key 集合交集占比 ≥ 阈值（如 70%）才展示表格视图；否则退化为树（满足文档「不强行转换」）。
2. `JsonTableView.vue` 增强：
   - 列隐藏：表头加「⋯」→ 勾选显隐列（维护 `hiddenCols: Set`）。
   - 列宽：`gridTemplateColumns` 改为可拖拽（`resizing` 状态 + `mousedown` 改 `minmax` 宽度）。
   - 表内搜索：表头下方输入框，按当前可见列过滤 `sortedRows`（复用 `useTreeSearch` 思路但限表内）。
   - 复制当前行：行右键/「⋯」→ 复制整行 JSON + 复制该行 JSONPath（`toJsonPath(parentPath+[i])`）。
   - 导出 CSV：把 `sortedRows` 经 `flattenArray` 后序列化为 CSV（复用 `JsonToCsv` 逻辑），`downloadFilename` 取父路径。
   - 分页：增加「虚拟滚动 / 分页」切换；分页模式按 `pageSize` 切片（导出仍用全量）。
3. `JsonTreeNode.vue`：数组节点行（非叶）加「表格」按钮，点后将 `viewMode` 切到 `table` 并传 `parentPath`（需 `JsonOutputPanel`/`JsonEditor` 支持「非根数组表格」——当前 `JsonOutputPanel.vue:370 isArrayData` 只认根数组，改为：表格数据源优先「当前选中的数组节点」）。
4. 嵌套对象单元格（已有 hover popover）补「复制此单元格 JSONPath」。

**文件改动**：改 `JsonTableView.vue`、`JsonOutputPanel.vue`（表格数据源支持 `selectedArrayPath`）、`JsonTreeNode.vue`、`useTablePreview.ts`（一致性判定）。
**i18n**：`table.hideColumn` / `table.resize` / `table.search` / `table.copyRow` / `table.exportCsv` / `table.pageSize` / `table.consistentOnly`。
**copy-accuracy**：`features` 增加「Array table view: sort, hide/resize columns, in-table search, copy row, export CSV, pagination」；逐项指 `JsonTableView.vue` 对应函数。

#### P0-3 结构化 JSON Diff（文档 F3 全文）
**目标**：并排比较两个 JSON；新增/删除/修改字段、数组增删、类型变化、路径定位、只显示变化、忽略字段顺序、忽略指定字段、复制变化路径。

**复用**：`jsondiffpatch`（依赖）；`JsonOutputPanel` 的 `errorMap`/`jsonErrors` provide（差异当「错误点」上树高亮）；`locatePath` 定位机制；`JsonInputEditor` 作第二输入。

**实施步骤**：
1. 新增 `useJsonDiff.ts`：包 `jsondiffpatch.diff(a, b)` → 归一化成 `{ path, kind: added|removed|changed|typeChanged, before, after }[]`；支持 `ignoreOrder`（比较前对数组/对象 key 排序）、`ignorePaths: string[]`（如 `updatedAt`/`requestId`）。
2. 新增 `JsonComparePanel.vue`：
   - 双栏 `JsonInputEditor`（左 A / 右 B），复用现有组件 props。
   - 工具栏：只显示变化（开关）、忽略顺序（开关）、忽略字段（逗号分隔输入）。
   - 结果区：结构化列表（路径 + 变化类型 + before→after），每条可「定位」→ 复用 `locatePath` 在树上展开闪烁；「复制全部变化路径」按钮。
   - 把差异 map 注入 `provide('jsonErrors')`（绿/红/黄用现有 `hasError` 红点样式，或新增 diff 配色）。
3. `JsonEditor.vue`：工具栏加「Compare」模式开关，激活时把右侧 `JsonOutputPanel` 换为 `JsonComparePanel`（或叠加第二输入）。注意仍受 `useLargeFileGate` 限制。

**文件改动**：新增 `useJsonDiff.ts`、`JsonComparePanel.vue`；改 `JsonEditor.vue`（模式开关）、`JsonOutputPanel.vue`（接受 diff map）。
**i18n**：`diff.*`（added/removed/changed/typeChanged/onlyChanges/ignoreOrder/ignoreFields/copyPaths）。
**copy-accuracy**：`features` 增加「Structured JSON diff: added/removed/changed fields, array diff, type changes, ignore order/fields, copy paths」；指 `useJsonDiff.ts` 与 `JsonComparePanel.vue`。

#### P0-4 搜索结果路径与跳转增强（文档 F8 子集）
**目标**：搜索结果列表（内容+路径+类型+所在数组），点击跳转并 flash；搜索范围补「全部」。

**复用**：`useTreeSearch.ts`（已有 `matches`/`currentIndex`/`searchExpandedPaths`）、`JsonOutputPanel.vue` 搜索 UI、树 `locatePath` 跳转、`JsonTreeNode` `flashPath`。

**实施步骤**：
1. `useTreeSearch.ts`：新增 `mode: 'all' | 'key' | 'value' | 'path'`（'all' = key∪value∪path 并集）；`matches` 已含 path，`walkTree` 在 `all` 下对三种各判定一次。
2. `JsonOutputPanel.vue` 搜索条：模式下拉加「All」；结果计数旁加「结果列表」按钮 → 展开一个抽屉（`JsonSearchResults.vue` 或内联），列出每条 `{ path, snippet, type, parentArray }`，点击 `emit('locate', path)` → `locateTarget`/`locatePath`（已有机制）展开祖先+滚动+flash。
3. 类型与所在数组信息：遍历 `matches` 时用 `parsedData` 取 `typeof` 值与父数组名。

**文件改动**：改 `useTreeSearch.ts`、`JsonOutputPanel.vue`。
**i18n**：`search.modeAll` / `search.results` / `search.resultCount` / `search.inArray`。
**copy-accuracy**：`features` 已有「Key/Value 搜索」；补「All scope + result list with path/type」；指 `useTreeSearch.ts` + 结果抽屉。

### P1

#### P1-1 JSON Schema 校验（文档 F4 全文）
**目标**：粘贴 Schema / 从 JSON 生成基础 Schema / 错误路径 / 期望与实际类型 / 定位错误节点 / 常见 Draft / Schema 与 JSON 并排。

**复用**：`useSchemaValidation.ts`（`validateWithSchemaText`）、`JsonOutputPanel` 的 `fieldErrors`→`errorMap`→树红点、`locatePath` 定位、`JsonSchemaGenerator.vue`（生成 Schema 逻辑）。

**实施步骤**：
1. 新增 `JsonSchemaPanel.vue`：
   - 左：粘贴 Schema 的 `JsonInputEditor`（或从 JSON 生成按钮，复用 `JsonSchemaGenerator` 的生成函数，抽成 `useSchemaGenerate.ts`）。
   - 右：实时 `useSchemaValidation.validateWithSchemaText(parsedData, schemaText)` → `fieldErrors`。
   - 把 `fieldErrors` 注入树（`provide('jsonErrors')`）；tooltip 显示「期望 type / 实际 type」（在 `JsonTreeNode` 的 `getNodeErrors` tooltip 增加 `expected`/`actual`，由 `FieldError.params` 取 `type`）。
   - 红点点击 → 复用 `locatePath` 定位。
   - 声明支持 Draft-07 / 2020-12（Ajv 默认）。
2. `JsonEditor.vue` 工具栏加「Schema」模式；Schema 与 JSON 并排（面板内双栏）。

**文件改动**：新增 `JsonSchemaPanel.vue`、`useSchemaGenerate.ts`（抽自 `JsonSchemaGenerator.vue`）；改 `JsonEditor.vue`、`JsonTreeNode.vue`（tooltip 加 expected/actual）。
**i18n**：`schema.*`（paste/generateFromJson/errors/draft7/expected/actual/sideBySide）。
**copy-accuracy**：`features` 增加「JSON Schema validation (Draft-07/2020-12): paste or auto-generate, error path + expected/actual type, locate node」；指 `useSchemaValidation.ts` + `JsonSchemaPanel.vue`。

#### P1-2 节点级编辑（文档 F5 全文）
**目标**：树中直接增删字段、重命名、改值类型、数组项增删/上下移、复制/移动节点、批量编辑、撤销重做、修改后即时验证。

**复用**：`JsonEditor` 的 `parsedData`/`inputJson`（`formatInputInPlace` 风格）；`getJsonError`（修改后即时验证）；`useClipboardActions`（复制/替换节点）。

**实施步骤**：
1. 新增 `useNodeEditing.ts`：基于 `parsedData` 的不可变更新工具集——`setValue(path,val)`、`renameKey(path,newKey)`、`setType(path,newType)`、`addField(path,key,val)`、`removeField(path)`、`addArrayItem(path,val)`、`removeArrayItem(path,index)`、`moveArrayItem(path,i,j)`、`copyNode/moveNode(path,target)`。每次变更后 `JSON.stringify` 写回 `inputJson` 并触发 `formatInputInPlace`，随后 `JSON.parse` 校验（失败则 toast 错误，不破坏原值）。
2. 撤销/重做：在 `useNodeEditing` 内维护命令栈（`past[]`/`future[]`），`undo()/redo()` 恢复 `inputJson` 快照。
3. `JsonNodeMenu.vue` 扩展菜单项（增/删/重命名/改类型/上移/下移/复制/移动）；批量编辑：多选（树 `selectedPath` 已存在）→ 批量设值。
4. 即时验证：每次编辑后调用 `getJsonError(inputJson)` 复用现有错误条。

**文件改动**：新增 `useNodeEditing.ts`；改 `JsonNodeMenu.vue`、`JsonTreeNode.vue`、`JsonEditor.vue`。
**i18n**：`edit.*`（addField/deleteField/rename/changeType/addItem/removeItem/moveUp/moveDown/copyNode/moveNode/batch/undo/redo）。
**copy-accuracy**：`features` 增加「In-tree editing: add/delete/rename fields, change type, array item ops, undo/redo, live validation」；指 `useNodeEditing.ts`。

#### P1-3 值类型智能识别（文档 F7，优先项）
**目标**：对字符串值识别并给操作：URL 打开/复制、图片 URL 预览/放大、时间戳（本地/UTC/ISO）、JWT 解码、Base64 解码、十六进制颜色、UUID、邮箱、IP、Markdown 预览。优先：时间戳、JWT、Base64 图片、URL、颜色。

**复用**：`useSmartJsonValue.ts`（`isColorValue`/`getColorStyle`/`isImageUrl`/`detectValueType`）、`JsonTreeNode.vue:188` 颜色块 + `:154` 图片预览。

**实施步骤**：
1. 扩展 `useSmartJsonValue.ts` 或新 `app/utils/mediaPreview.ts`：增加 `detectExtended(value)` 返回更细类型 `url|image|email|date|color|timestamp|jwt|base64|uuid|ip|markdown|regex`，各自带 `isX()` 判定函数。
   - 时间戳：纯数字 10/13 位或 ISO 字符串 → `toLocal/toUTC/toISO`。
   - JWT：`/^[\w-]+\.[\w-]+\.[\w-]*$/` 三段 → 解码 Header/Payload（base64url decode）。
   - Base64：宽松判定 → 尝试 `atob` 解码文本或图片（`data:` 前缀）。
   - UUID / email / ip / markdown / regex：正则。
2. 新增 `JsonValuePreview.vue`：在 `JsonTreeNode` 叶子值旁渲染「类型芯片 + 操作按钮」（复用 `getTypeIcon`）；点击打开 `JsonValueInspector.vue` 展示解码详情（JWT 两段 JSON、时间戳三态、Base64 文本/图片）。
3. 颜色（已有）与 URL（打开/复制）直接接入菜单/芯片。

**文件改动**：新增 `mediaPreview.ts`、`JsonValuePreview.vue`、`JsonValueInspector.vue`；改 `JsonTreeNode.vue`（叶子值旁挂芯片）、`useSmartJsonValue.ts`。
**i18n**：`value.*`（timestamp.local/utc/iso、jwt.decode、base64.decode、openUrl/copyUrl、mailto、uuid、ip、markdown）。
**copy-accuracy**：`features` 增加「Smart value detection: timestamp/JWT/Base64/URL/color/email/UUID/IP/Markdown with one-click actions」；指 `mediaPreview.ts` + `JsonValuePreview.vue`。

#### P1-4 媒体与常见值预览扩展（文档 F6 全文）
**目标**：图片 URL / Base64 图片 / 音频 URL / 视频 URL / PDF URL / 颜色 / 日期时间 / URL / 邮箱 / JWT / 正则 / Markdown 的内联预览；并施加安全限制。

**复用**：P1-3 的类型识别；`useImagePreview.ts`（图片 lightbox）；`Preview.vue`（已有 lightbox 组件，`JsonTreeNode.vue:210` 在用）。

**实施步骤**：
1. 在 `JsonValueInspector.vue` 中按类型渲染内联预览：
   - 音频/视频：`<audio controls>`/`<video controls>`，**手动播放**（不自动 `autoplay`），且默认不加载直到用户展开节点/点击（满足文档「仅展开节点加载」）。
   - PDF：`<iframe>`/`<embed>`，标注「远程资源可能包含第三方请求」。
   - Base64 图片：超阈值（如 > 1MB 解码后）不立即解码，显示「点击解码」。
2. 安全提示条：预览远程资源时显示「Remote resource may trigger third-party requests」常驻提示。
3. 大图：已有 `max-w-[160px]`，扩展为点击放大走 `Preview.vue`（lightbox）——已支持，补 Base64 源。

**文件改动**：改 `JsonValueInspector.vue`、`JsonTreeNode.vue`（钩子）、`useSmartJsonValue.ts`。
**i18n**：`media.*`（audio/video/pdf/remoteWarning/decodeOnClick）。
**copy-accuracy**：`features` 增加「Media preview: image/Base64/audio/video/PDF with safety limits」；指 `JsonValueInspector.vue` 与提示条。

#### P1-5 CSV/YAML/TypeScript 转换与代码生成（文档 F10 优先项）
**目标**：TS interface / TS type / YAML / CSV / JSON Schema；选项：可选字段、使用 null、展开嵌套、保留注释、camelCase、数组单数类型。

**复用**：`JsonToCode.vue:161-280` 的各 `generateXxx` 函数（抽成 `app/utils/codegen.ts`）、`js-yaml`（YAML）、`useJsonFlatten.ts`（CSV）、`useSchemaGenerate.ts`（JSON Schema，P1-1）。

**实施步骤**：
1. 抽 `app/utils/codegen.ts`：`generateTypeScript(obj, {optional, useNull, expand, comments, camelCase, singularArray})`、`generateTsType(...)`、`toYaml(obj)`、`toCsv(arr)`、`toJsonSchema(obj)`。
2. 新增 `JsonGeneratePanel.vue` 的「Convert」页：左侧选项，右侧输出（复用 `JsonSyntaxBlock` 高亮），复制/下载。
3. `JsonEditor.vue` 工具栏「Generate」抽屉挂载此面板。

**文件改动**：新增 `codegen.ts`、`JsonGeneratePanel.vue`；改 `JsonEditor.vue`、`JsonToCode.vue`（改为 import `codegen.ts`，消除重复）。
**i18n**：`generate.*`（tsInterface/tsType/yaml/csv/jsonSchema/optional/null/expand/comments/camelCase/singular）。
**copy-accuracy**：`features` 增加「Convert to TypeScript/YAML/CSV/JSON Schema with options」；指 `codegen.ts`。

#### P1-6 搜索结果导出（文档 F8 子集）
**目标**：搜索结果导出 .txt / .json / .csv（i18n 键已存在于 `en.json:473-477`），加搜索历史。

**复用**：`en.json` 既有 `exportTxt/exportJson/exportCsv/exportRecordsCsv`；`useClipboard`/`Blob` 下载（参考 `JsonEditor` 的 `downloadOutput`）。

**实施步骤**：
1. 在 P0-4 的结果抽屉加「Export」菜单：`.txt`（每行 path=value）、`.json`（matches 数组）、`.csv`（path,type,value）。
2. 搜索历史：`useTreeSearch` 或独立 `useSearchHistory` 维护最近 N 条 query（`localStorage`），搜索框下拉展示。

**文件改动**：改 P0-4 结果抽屉、`useTreeSearch.ts`（历史）。
**i18n**：复用既有 `export*` 键；新增 `search.history`。
**copy-accuracy**：`features` 补「Export search results + history」；指导出函数。

### P2

#### P2-1 JSONPath 查询（文档 F9）
**目标**：属性访问、数组索引、通配符 `*`、递归 `$..`、简单过滤 `[?(@.x=="y")]`；结果复制/导出；文案明确「基础子集，非完全兼容」。

**复用**：`JsonPathTester.vue:160 getByPath`（抽成 `useJsonPath.ts`，扩展 `*`/`..`/简单 filter）。

**实施步骤**：
1. `useJsonPath.ts`：从 `getByPath` 抽出并增强——支持 `$..recursive`、`[?(cond)]` 简单 `==`/`!=` 过滤；返回 `{path,value}[]`。
2. `JsonOutputPanel.vue` 搜索模式下拉加「JSONPath」；输入表达式 → 调 `useJsonPath` → 结果列表（值+路径），复制/导出（复用 P1-6 导出）。
3. 不支持的语法给出 `pathInvalid` 提示（键已存在 `en.json:496`）。

**文件改动**：新增 `useJsonPath.ts`；改 `JsonOutputPanel.vue`、`JsonPathTester.vue`（改为共用 `useJsonPath`）。
**i18n**：复用 `jsonPath`/`pathPlaceholder`/`pathInvalid` 等既有键；新增 `search.modeJsonPath`。
**copy-accuracy**：`features` 增加「JSONPath query (basic subset)」并明确「partial compatibility」；指 `useJsonPath.ts`。

#### P2-2 cURL / fetch 生成（文档 F11）
**目标**：方法/URL/Headers + 从 JSON 生成请求体 → 输出 fetch / cURL / Axios / Python requests；**只生成代码不执行**。

**复用**：`JsonGeneratePanel.vue`（P1-5 抽屉）；`codegen.ts` 风格新增 `genFetch/genCurl/genAxios/genPythonRequests`。

**实施步骤**：
1. `JsonGeneratePanel.vue` 加「API」页：方法下拉（GET/POST/…）、URL 输入、Headers（键值编辑）、Body 默认取自当前 `parsedData`。
2. 输出四段代码（各自复制/下载）。边界：无网络请求（避免 CORS/SSRF/隐私风险，符合文档边界）。

**文件改动**：改 `JsonGeneratePanel.vue`、`codegen.ts`。
**i18n**：`api.*`（method/url/headers/body/fetch/curl/axios/pythonRequests）。
**copy-accuracy**：`features` 增加「Generate fetch/cURL/Axios/Python from JSON (code only)」；明确「不发送请求」；指 `codegen.ts` 生成函数。

#### P2-3 音频/视频/PDF 预览（文档 F6 子集）
**目标**：在 P1-4 基础上落地音频/视频/PDF 内联预览。
**实施步骤**：与 P1-4 同组件，本阶段补全三种媒体渲染 + 手动播放 + 远程提示。
**文件改动**：`JsonValueInspector.vue`。
**i18n**：复用 `media.*`。
**copy-accuracy**：随 P1-4 一并审计。

### P3 — 明确不做（写进计划备查，避免返工）
- **图表/关系图可视化**：暂不做；未来可单做「从选中数组生成图表」。
- **在线 API 请求执行**：不做（CORS/SSRF/敏感 Header/Cookie/隐私风险，与产品定位冲突）。
- **自动修复所有非法 JSON**：仅保留现有 `useJsonFixer` 的「安全修复 + 错误定位」，不静默改写原文。

### F12 剪贴板工作流（自 P0 起贯穿）
**目标**：粘贴自动格式化（已有 `onInputPaste`）、复制格式化/压缩 JSON（已有 `copyOutput`，补 minified 变体）、复制当前节点/当前数组行（接 P0-1/P0-2）、从剪贴板替换当前节点（节点菜单）、粘贴自动识别 JSON/URL/Base64（增强 `onInputPaste`）、复制成功提示（已有 `copyJustCopied`，统一到 `useClipboardActions`）。

**复用**：`useClipboard.ts`、`copyToClipboard`、`JsonEditor.copyOutput`、`JsonNodeMenu`（P0-1）。
**实施步骤**：
1. 新增 `useClipboardActions.ts` 收口：复制格式化 JSON、复制压缩 JSON（基于 `outputJson` 或重新 `JSON.stringify`）、复制节点/行（调 P0-1/P0-2）、替换节点（写回 `inputJson` 指定 path）。
2. `onInputPaste` 增强：检测剪贴板文本为 URL/Base64/JSON，分别给出「作为 URL 打开 / 解码 Base64 / 格式化 JSON」的轻提示或自动处理（不静默改写用户数据）。
3. 复制成功 toast 统一走 `useClipboard.ts` 的 `justCopied`。

**文件改动**：新增 `useClipboardActions.ts`；改 `JsonEditor.vue`、`JsonNodeMenu.vue`。
**i18n**：`clipboard.*`（copiedFormatted/copiedMinified/copiedNode/replacedNode/pasteAsJson/pasteAsUrl/pasteAsBase64）。
**copy-accuracy**：`features` 增加「Clipboard workflow: auto-format on paste, copy formatted/minified/node/row, replace node」；指 `useClipboardActions.ts`。

---

## 4. 覆盖核对表（文档条目 → 任务）

| 文档条目 | 计划任务 |
|---|---|
| F1 复制 JSONPath / 值 / 节点 / 父路径 / 类型 / 索引 | P0-1 |
| F2 转表格 / 排序 / 隐藏 / 列宽 / 表内搜索 / 分页 / 复制行 / 导出 CSV / 嵌套路径 / 一致性限定 | P0-2 |
| F3 增删改 / 数组增删 / 类型变化 / 路径 / 只显变化 / 忽略顺序 / 忽略字段 / 复制路径 | P0-3 |
| F4 粘贴 / 生成 Schema / 错误路径 / 期望实际类型 / 定位 / Draft / 并排 | P1-1 |
| F5 增删 / 重命名 / 改类型 / 数组项 / 上下移 / 复制 / 移动 / 批量 / 撤销重做 / 即时校验 | P1-2 |
| F6 图片 / Base64 / 音 / 视 / PDF / 颜色 / 日期 / URL / 邮箱 / JWT / 正则 / MD + 安全限制 | P1-4, P2-3 |
| F7 URL / 图片 / 时间戳 / JWT / Base64 / 颜色 / UUID / 邮箱 / IP / MD 识别 | P1-3 |
| F8 范围 / 正则 / 大小写 / 整词 / 上下 / 数量 / 列表 / 路径 / 当前节点 / 导出 / 历史 | P0-4, P1-6 |
| F9 属性 / 索引 / 通配 / 递归 / 过滤 / 复制 / 导出 | P2-1 |
| F10 TS / type / JS / Py / Go / Java / C# / Kotlin / YAML / CSV / XML + 选项 | P1-5 |
| F11 fetch / cURL / Axios / Py / 方法 URL / 导入 / 导出 + 边界 | P2-2 |
| F12 粘贴格式化 / 复制格式化压缩 / 节点 / 行 / 替换 / 识别 / 提示 | F12 贯穿 |
| 图表 / API 执行 / 全量修复 | P3 不做 |

---

## 5. 交付节奏与每阶段审计

1. **P0-1 + P0-4**（最低成本、最高收益）→ 同步 i18n + `json-editor.json` 文案 + 审计。
2. **P0-2**（表格增强，复用度最高）。
3. **P0-3**（Diff，最重）。
4. **P1 批**（Schema / 编辑 / 值识别 / 媒体 / 转换）按依赖：值识别 → 媒体预览；表格 → CSV 导出。
5. **P2**（JSONPath 查询 / API 生成 / 音视频）。
6. **F12** 随 P0 起即并入。

**每阶段收尾必做（阻断级）**：
- 更新 `app/assets/data/format/json-editor.json` 的 `features`/`guide`/`faq`/`article`（`en` + `zh`）。
- 跑 copy-accuracy 审计 §3 表格：每条 UI 断言 → `file:line`；en/zh 断言一一对应；核对 `?? '英文'` 兜底无 zh 漏出。
- `pnpm build` 通过（静态预设）。
