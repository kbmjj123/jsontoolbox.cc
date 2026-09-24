# JsonOutputPanel Header 精简 — 实施计划

> 主战场：`app/components/tool/JsonOutputPanel.vue`
> 影响面：16 处调用点（13 个工具页 + `NodeInspector` + `pages/embed/json.vue` 两处）
> 原则：**先删死代码，再反转默认，最后抽结构**；每阶段收尾跑「浮层可见性实测」+ copy-accuracy 审计（`.claude/rules/copy-accuracy.md` §3，en/zh 同步）。
>
> **v2 变更（本次）**：新增 §3.1 设计决策 —— 搜索组从 header 下沉为 **rich 视图内的 sticky 工具行**（在 `absolute` 浮层 / `sticky` 吸顶 / 文档流行内 三个方案中选定 sticky）；§4 的 P2/P3 重写为「共用基座抽取」+「TreeToolbar 下沉」，强制所有浮层/工具条走同一套组件，避免重复实现。决策依据记录在 §9。

---

## 0. 目标与硬约束

1. **不改任何工具的产品语义**：JsonEditor / embed 是「浏览 + 编辑」场景；JsonToCsv / JsonToExcel / CsvToJson 是「转换 + 预览」场景；其余转换器只出文本结果。控件必须跟着场景走，而不是跟着默认值走。
2. **纯前端约束不变**：本次只动 UI 可见性与 API 形状，不引入网络请求、不改 JSON 处理链路。
3. **copy-accuracy 阻断级**：任何一个控件从某页消失，必须先确认该页 `app/assets/data/{category}/{slug}.json` 的 `features` / `guide` / `faq` / `article` / `meta` / `ui` **没有承诺过对应能力**。结论见 §2.6，可直接引用。
4. **i18n 双语**：面板内文本来自 `i18n/locales/en.json` 与 `zh-CN.json`（`tree.*`、`search.*`、`system.*`、`largeViewer.*`）；删除控件后不要顺手删 i18n key——先 grep 确认无其他使用方。
5. **浮层必须实测**：任何下拉/弹出层都要用 `elementFromPoint` 命中判定验证，肉眼"看起来能点"不算通过（见 §8.2）。
6. **统一性约束（本次新增，硬性）**：
   - 同一类 UI 只允许有一份实现。判定标准：一个新抽象只有 **≥2 个使用方**才允许创建。
   - 浮层（下拉/历史/菜单）一律走 `ToolFloatingPanel`；工具条一律走 `ToolPanelBar`。**不允许再手写 `absolute top-full`、`Teleport to="body"`、`getBoundingClientRect` 这段逻辑。**
   - 现存 3 处手写浮层（`JsonOutputPanel.vue:72`、`:123`，`JsonTableView.vue:18-31`），全部要在 P2 收口。
   - **已知例外**（不纳入 `ToolFloatingPanel`）：全屏遮罩类（Modal / Drawer / Preview / JsonNodeMenu / JsonValueInspector / ToastContainer 等）本就是 body 级浮层；`JsonTableView.vue:194-208` 的 hover popover 跟随鼠标坐标而非锚点元素，两者都不属于"被祖先裁切"的问题域。

---

## 1. 背景与动机

两条线索汇到一起：

1. **浮层 bug**：header 容器 `JsonOutputPanel.vue:4` 带 `overflow-x-auto scrollbar-hide`。按 CSS 规范，当 `overflow-x` 非 `visible` 时 `overflow-y` 的计算值被强制成 `auto` → 容器成为滚动盒 → 任何 `absolute + top-full` 的浮层被裁掉。
2. **按钮蔓延**：排查 header 时发现"太多按钮"，且相当一部分是**为 JsonEditor 做的树浏览能力**，因默认值放宽（`enableTreeSearch` 默认 `true`）泄漏到所有传 `parsed-data` 的页面；同时 header 横向溢出（JsonEditor 实测 6 个控件已需要左右滚动）。

### 1.1 已完成的浮层修复（基线，勿回退）

| 浮层 | 原位置 | 现方案 | 锚点 |
|---|---|---|---|
| 搜索模式下拉 | `.absolute.top-full` | `<Teleport to="body">` + `fixed`，`dropdownStyle` / `measureDropdown` | `JsonOutputPanel.vue:61-90`、`631-651` |
| 最近搜索列表 | `.absolute.top-full` | 与红条合并为一个 teleport 容器，`searchPanelStyle` / `measureSearchPanel` | `JsonOutputPanel.vue:93-158`、`653-663` |
| JSONPath 非法提示 | `.absolute.top-full` | 同上容器内，`bg-red-600` 条，`self-end` 右对齐 | `JsonOutputPanel.vue:123-136` |

这轮临时引入的定位工具（`measureAnchor` `:620`、`anchorStyle` `:626`）是**手工版**，属于要被 P2 的 `useAnchoredPanel` 替换的临时实现。

---

## 2. 现状盘点

### 2.1 header 控件清单

| # | 控件 | 模板锚点 | 显示条件 | 今天谁真的看得到 | P3 之后的归属 |
|---|---|---|---|---|---|
| 1 | 标题 label | `:6` | 总是 | 16 处全部 | 留在 header |
| 2 | 视图切换 Rich / Text / Table | `:7-34` | `parsedData !== null && showViewToggle` | 传了 `parsed-data` 的 7 处 | 留在 header |
| 3 | 敏感字段遮罩（眼/眼-off） | `:36-49` | `sensitivePaths.size > 0` | 仅 `JsonEditor.vue:61` | 留在 header |
| 4 | Expand / Collapse All | `:53-59` | `rich && parsedData !== null && enableTreeSearch` | 6 处 | **下沉到 `TreeToolbar`** |
| 5 | 搜索模式下拉 | `:61-90` | 同上 | 同上 | **下沉** |
| 6 | 搜索输入框 + 计数 + 历史 | `:93-158` | 同上 | 同上 | **下沉** |
| 7 | 结果抽屉 / 上一个 / 下一个 | `:160-183`，抽屉本体 `:221-269` | 同上 && query 非空 | 同上 | **下沉** |
| 8 | Format / Minify / Validate / Fix | `:186-200` | `showEditActions === true` | **0 处**（死代码） | **P0 删除** |
| 9 | `#actions` 插槽 | `:202` | 有传入 | **0 处**（死代码） | **P0 删除** |
| 10 | Copy | `:204-210` | `showCopy`（默认 true） | 12 处 | 留在 header |
| 11 | Download | `:211-217` | `showDownload`（默认 true） | 同上 | 留在 header |

抽屉里的结果导出按钮（模板 `:232` `:239` `:246`，实现 `exportResults` `:575`）属于控件 7 的二级 UI，跟随 7 一起下沉。

### 2.2 调用点矩阵（16 处）

| 调用点 | parsed-data | view-mode 初值 | show-view-toggle | enable-tree-search | copy / download | 现状 header 渲染 | P1 建议 |
|---|---|---|---|---|---|---|---|
| `JsonEditor.vue:61` | ✅ | 变量（`defaultViewMode`） | ✅ 变量 | 默认 true | false / false | 2,3,4,5,6,7 | **显式 true** |
| `pages/embed/json.vue:322` | ✅ | 变量 | ✅ true | 默认 true | false / false | 2,4,5,6,7 | **显式 true** |
| `pages/embed/json.vue:429` | ✅ | 变量 | ✅ true | 默认 true | true / true | 2,4,5,6,7,10,11 | **显式 true** |
| `NodeInspector.vue:71` | ✅ | 变量 | ✅ | **false** | true / true | 2,10,11 | 保持 false |
| `CsvToJson.vue:18` | ✅ | `rich` + `v-model`（冲突，见 §2.5） | 未传（默认 true） | 默认 true | true / true | 2,4,5,6,7,10,11 | **false** |
| `JsonToCsv.vue:19` | ✅ | ref `'rich'` | 未传（默认 true） | 默认 true | false / false | 2,4,5,6,7 | **false** |
| `JsonToExcel.vue:17` | ✅ | ref `'rich'` | 未传（默认 true） | 默认 true | false / false | 2,4,5,6,7 | **false** |
| `JsonEscape.vue:20` | ❌ | `'text'` | false | 未传 | true / true | 1,10,11 | 无需改动 |
| `JsonMinifier.vue:21` | ❌ | `'text'` | false | 未传 | true / true | 1,10,11 | 无需改动 |
| `JsonSchemaGenerator.vue:22` | ❌ | 默认 `'text'` | 未传 | 未传 | true / true | 1,10,11 | 无需改动 |
| `JsonToCode.vue:22` | ❌ | 默认 `'text'` | 未传 | 未传 | true / true | 1,10,11 | 无需改动 |
| `JsonToTypescript.vue:22` | ❌ | 默认 `'text'` | 未传 | 未传 | true / true | 1,10,11 | 无需改动 |
| `JsonToXml.vue:22` | ❌ | 默认 `'text'` | 未传 | 未传 | true / true | 1,10,11 | 无需改动 |
| `JsonToYaml.vue:22` | ❌ | 默认 `'text'` | 未传 | 未传 | true / true | 1,10,11 | 无需改动 |
| `XmlToJson.vue:22` | ❌ | 默认 `'text'` | 未传 | 未传 | true / true | 1,10,11 | 无需改动 |
| `YamlToJson.vue:22` | ❌ | 默认 `'text'` | 未传 | 未传 | true / true | 1,10,11 | 无需改动 |

### 2.3 死代码清单（P0 直接删）

| 类型 | 名称 | 位置 | 证据 |
|---|---|---|---|
| prop | `showEditActions` | 声明 `:422-423`，默认 `:451`，模板 `:187` | 16 处调用点无一传入 |
| emit | `format` | `:466` | 全仓库无 `@format=` 监听方 |
| emit | `minify` | `:467` | 同上 |
| emit | `validate` | `:468` | 同上 |
| emit | `fix` | `:469` | 同上 |
| emit | `paste` | `:470` | 同上（可编辑 textarea `:286`） |
| emit | `update:content` | `:461` | 无监听方 → 见 §2.5 bug B |
| slot | `#actions` | `:202` | 无 `<template #actions>` 调用方 |
| provide | `treeViewport` | `:400` | `JsonTreeNode` 已移除虚拟滚动，不再 inject |

> 反向核对：正在被监听的 emit 有 `copy`(10) / `download`(10) / `update:view-mode`(4) / `locate-error`(2) / `load-example`(2) / `copy-path`(1) / `update:masked`(1) —— **一个都别动**。

### 2.4 泄漏实证（要解决的真问题）

实测：打开 `/tools/convert/json-to-csv` → Example → Convert to CSV → 读输出面板 header DOM：

```
Rich | Text | Table | Collapse | Key | Search by key name..
```

一个「JSON → CSV 转换」工具的输出区挂了整套树浏览 + 搜索工具栏（控件 4-7），而该页文案从未承诺过这些能力。根因：`enableTreeSearch` 默认 `true`（`:456`）。

### 2.5 顺带发现的 bug（P1 顺手修）

- **bug A｜`CsvToJson.vue:19` 与 `:24` 重复绑定**：同一元素同时写了 `v-model:view-mode="outputViewMode"` 和静态 `view-mode="rich"`，props 合并后谁生效取决于顺序。→ 删静态 `view-mode="rich"`，保留 `v-model`（ref 初值已是 `'rich'`，`CsvToJson.vue:75`）。
- **bug B｜可编辑输出面板改动被丢弃**：只有 `pages/embed/json.vue:429` 传了 `editable`，emit `update:content` 无监听方（可编辑区 `:273-295`）。→ **推荐** embed 页面补 `@update:content`；或整条删掉 `editable` / `update:content` / `placeholder`。二者取其一并在 PR 写明。
- **bug C｜`JsonTableView` 的 Columns 下拉疑似同样被裁**（待复测）：根容器 `JsonTableView.vue:2` 是 `overflow-hidden`，而下拉 `:18-31` 是 `absolute top-full` —— 与 §1.1 同一类缺陷。P1 先复测确认，P2 统一走 `ToolFloatingPanel` 修掉。

### 2.6 文案承诺核对结论（copy-accuracy 前置结论）

对 4 个相关页面 `en` / `zh` 全字段（含 `article`）做过 tree / search / JSONPath / collapse 关键词扫描：

| 页面 | 命中 | 结论 |
|---|---|---|
| `app/assets/data/format/json-editor.json` | en: tree / search / JSONPath；zh: search / JSONPath | **承诺了树与搜索** → 必须保留控件 4-7 |
| `app/assets/data/convert/json-to-csv.json` | 无命中 | 只承诺 Table Preview → **可关 4-7**，保留 Rich/Text/Table |
| `app/assets/data/convert/csv-to-json.json` | 无命中 | 同上 |
| `app/assets/data/convert/json-to-excel.json` | 仅 `"Many people search for a JSON to Excel converter"`（行文，非能力承诺） | 同上 |

---

## 3. 目标形态

header 收敛成三个语义区，搜索组下沉到 rich 视图内部：

```
[ A 标题 ]  [ B 视图切换（需 parsedData） ]            → [ D 复制 / 下载 ]
                                                      （C 组不再出现在 header）

rich 视图内部：
┌ 滚动容器 ─────────────────────────────┐
│ ▓ C 组 sticky 工具行（搜索组）▓        │ ← 吸顶，滚动时常驻手边
│ JSON 树内容                            │
└───────────────────────────────────────┘
```

- **A / B / D** 留在 header；`D` 由现有 `showCopy` / `showDownload` 独立控制（转换类工具已会用 `false` 关掉并换成自己的「Copy CSV / Download」）。
- **C 组 = 树浏览 + 搜索**：Expand/Collapse、模式下拉、搜索输入框 + 计数 + 历史、上一个/下一个、结果抽屉（含导出）。整组由 `enableTreeSearch` 显式控制，位置在 rich 视图内。

### 3.1 设计决策：为什么是 sticky，而不是 `absolute` 浮层

| 方案 | 语义 | 垂直空间 | 遮挡 | 项目内先例 |
|---|---|---|---|---|
| A `absolute` 浮层盖在内容顶部 | 钉住不动，内容从下方流过 | 真省一行 | **永久遮住顶部若干树节点** | 结果抽屉 `JsonOutputPanel.vue:221-269` |
| **B `sticky top-0`（选定）** | 滚动时吸顶，静止时占文档流一行 | 静止占一行，滚动时不占 | 滚动时遮经过的行，停手不遮 | `JsonToTable.vue:38`、`app/Header.vue:3` |
| C 文档流独立工具行 | 正常一行 | 占一行 | 无 | `JsonTableView.vue:5` |

选定 B 的理由：

1. **不产生新的遮挡问题**。A 唯一能"省空间"的代价，是把树最顶上几行永久挡住——JSON 树首行往往是根对象的关键字段，遮挡收益为负。
2. **滚动时工具条在手边**。长文档里连续点「下一个」比现状（工具框在 header，视线上下跳）更好用。
3. **和 `JsonTableView` 的语言一致**。表格视图已有自己的工具行（`JsonTableView.vue:5`），rich 用 sticky 行、table 用行内行，视觉位置基本对齐，切换模式时不"跳"。
4. **先例充分**，`backdrop-blur` 半透明 semantics 与站点 header 一致。

**必须澄清的一点**：把控件从 header 挪出去，核心收益是 **header 不再横向溢出**（现在 6 个控件已经需要左右滚），而不是"内容不拥挤"。选 B 后垂直高度不变（静止时工具条仍占一行）。

**三个连带结论（写进 P3 验收）**：

- **滚动补偿**：命中跳转用 `scrollIntoView({ block: 'center' })`（`JsonTreeNode.vue:471`），中间命中不受影响；若后续改成顶部对齐，需给滚动容器加 `scroll-padding-top`（项目同类手法：`LargeJsonViewer.vue:393` 的 `scroll-mt-20`）。
- **抽屉锚点要改**：结果抽屉定位现在写死 `top-11`（相对 header，`:222`），改成相对新工具行下边缘，否则与工具行重叠。
- **显式开关仍然必要**：C 组下沉后天然只在 rich 模式出现，但转换类工具切到 Rich 照样看得到，所以 P1 的 `enableTreeSearch` 是"给不给"，P3 的 sticky 是"放哪里"，两个维度并行不冲突。

### 3.2 目标 DOM 结构草案

```vue
<!-- rich 视图（JsonOutputPanel.vue，P3 落地后的真实结构） -->
<!-- 滚动容器自身不带 padding：sticky 工具条需要贴边吸顶，
     不能让容器的 padding-top 把它往下推 -->
<div
  class="flex-1 min-h-0 overflow-auto rounded-xl border border-surface-200 bg-surface-50 dark:border-surface-700 dark:bg-surface-800"
  :class="showTreeToolbar ? 'scroll-pt-12' : ''"
>
  <!-- C 组：sticky 工具行（仅 rich + 有数据 + enableTreeSearch 时出现） -->
  <ToolPanelBar v-if="showTreeToolbar" sticky>
    <TreeToolbar :tree-search="treeSearch" @toggle-expand-all="toggleExpandAll" />
  </ToolPanelBar>

  <!-- 树内容单独包一层 p-4：padding 从「滚动容器」挪到「内容」，
       这样 sticky 工具条上方没有父级 padding 可对抗 -->
  <div v-if="parsedData !== null" class="p-4">
    <JsonTreeNode :data="parsedData" :path="''" />
  </div>
  <div v-else-if="error" class="… h-full 居中错误态 …">…</div>
  <div v-else class="… h-full 居中空态 …">…</div>
</div>
```

> **实现要点（与早期草案的差异，已据实测修正）**：
> 早期草案让滚动容器保留 `p-4`、由 `ToolPanelBar` 用 `-mx-4 -mt-4` 把工具条「拉」回贴边。
> 该写法在 **静止态**没问题，但一旦 `sticky top-0` 吸顶，浏览器约束的是工具条的 **margin box**，
> 于是 `-16px` 的负 margin 会把**可见的 border box 顶到容器顶边框下方 16px**，吸顶时出现缝隙。
> 因此落地版改为：**滚动容器去掉 `p-4`，把 `p-4` 下移到树内容的内衬 `div`**，`ToolPanelBar` 的 sticky 分支只保留
> `sticky top-0 z-20` + `border-b` + `bg-surface-50/90 backdrop-blur` + `rounded-t-xl`（不再用负 margin）。
> 工具条在静止与吸顶两种状态都贴着容器顶边（实测 `barTop − containerTop ≈ 1px`，即 1px 边框）。
> `scroll-pt-12` 仍负责滚动时给吸顶工具条留出 48px 余量，避免命中行被遮。

`ToolPanelBar` 的 `sticky` 分支职责：`sticky top-0 z-20`、底部分隔线、`bg-surface-50/90 backdrop-blur`（半透明，滚动时树透出）、`rounded-t-xl`（与容器圆角对齐）；内容由 slot 提供。非 `sticky` 分支（如 `JsonTableView` 工具行）保持普通文档流行，不受影响。

---

## 4. 执行计划

> 顺序不可乱：P0 删 → P1 开关 → P2 抽共用基座 → P3 下沉 + sticky。P2 必须先于 P3，否则 sticky 工具条里会再写一遍浮层逻辑。

### P0 — 删死代码（零行为变更，先合）

1. 删模板 `:186-200`（4 个编辑动作按钮）与 `:202`（`#actions` 插槽）。
2. 删 props：`showEditActions`（`:422-423`、`:451`）。
3. 删 emits：`format` `minify` `validate` `fix` `paste`（`:466-470`）。
4. 删 `provide('treeViewport', richRef)`（`:400`）；`richRef` 若仅为 provide 存在则一并删除。
5. **验收**：SFC 编译通过（§8.1）；`grep -rn "showEditActions\|show-edit-actions\|treeViewport"` 全仓库 0 处；13 个工具页 + embed 两处 UI 无变化。

### P1 — 默认反转 + 显式开启 + 修 bug

1. `enableTreeSearch` 默认改 `false`（`:456`），注释同步（`:432`）："必须显式开启"。
2. 按 §2.2「P1 建议」列逐个调用点补 prop：
   - `JsonEditor.vue:61`、`pages/embed/json.vue:322`、`pages/embed/json.vue:429` → `:enable-tree-search="true"`。
   - `JsonToCsv.vue:19`、`JsonToExcel.vue:17`、`CsvToJson.vue:18` → `:enable-tree-search="false"`。
   - `NodeInspector.vue:71` 保持 `false`；其余 8 处无 `parsed-data`，无需改。
3. 修 bug A（`CsvToJson.vue` 静态 `view-mode`）、bug B（embed 的 `@update:content` 或删链路）。
4. 复测 bug C：`JsonTableView` Columns 下拉是否真的被裁（判定 §8.2，结论进 PR 描述）。
5. **验收**：
   - `/tools/convert/json-to-csv` 转换后 header 只剩 `Rich Text Table`；
   - `/tools/format/json-editor`、`/embed/json` 控件 4-7 仍在（此时仍在 header，位置到 P3 才变）；
   - `/tools/convert/csv-to-json` 视图切换正常、`v-model` 双向生效；
   - copy-accuracy：按 §2.6 结论写 PR 说明。

### P2 — 抽共用基座（**有 ≥2 个使用方才动这一步**）

新增 1 个 composable + 2 个组件，收口全仓库浮层/工具条：

| 新增 | 职责 | 使用方（≥2） |
|---|---|---|
| `app/composables/useAnchoredPanel.ts` | 锚点测量 + `scroll`(capture)/`resize` 跟随 + 生命周期自动摘除 | 被 `ToolFloatingPanel` 内部使用；替代 `JsonOutputPanel` 的临时 `measureAnchor`(`:620`) / `anchorStyle`(`:626`) / 定位 `watch`(`:665-689`) |
| `app/components/tool/ToolFloatingPanel.vue` | `<Teleport to="body">` + `fixed` 浮层容器；props：`anchorEl`（元素，非 ref）、`align`（`stretch` / `end`）；挂载即测量并跟随，卸载自动清理 | ① 模式下拉 ② 最近搜索 ③ `JsonTableView` Columns 菜单（修 bug C）④ 后续任何新浮层 |
| `app/components/tool/ToolPanelBar.vue` | 工具条容器：`sticky` / `-mx/-mt` 贴边 / backdrop-blur / 窄屏溢出 | ① rich 搜索工具行（P3）② `JsonTableView.vue:5` 的现有工具行 |

```ts
// useAnchoredPanel.ts 建议签名（唯一实现，禁止在组件内再写一遍）
export function useAnchoredPanel(
  anchorEl: () => HTMLElement | null | undefined,
  options?: { offset?: number },   // 默认 4px
): {
  pos: Ref<{ top: number; left: number; width: number } | null>
  style: ComputedRef<Record<string, string>>   // { top, left, minWidth }
  measure: () => void
  startTracking: () => void
  stopTracking: () => void
}
```

迁移顺序：

1. 新建 `useAnchoredPanel` + `ToolFloatingPanel`，把 `JsonOutputPanel` 的两处浮层（`:72`、`:123`）迁过去，删除临时函数与定位 `watch`。
2. `JsonTableView.vue:18-31` 的 Columns 菜单迁到 `ToolFloatingPanel`，顺手修 bug C。
3. 新建 `ToolPanelBar`，先把 `JsonTableView.vue:5` 的现有工具行换掉（第二个使用方落地，抽象才算站住）。
4. **验收**：三处浮层全部通过 §8.2 命中判定；`grep -rn "Teleport to=\"body\"\|absolute top-full"` 在 `app/components/**` 只剩 `ToolFloatingPanel` 内部一处。

### P3 — TreeToolbar 下沉 + sticky

1. 新建 `app/components/tool/TreeToolbar.vue`，把控件 4-7 整体搬进去：Expand/Collapse、模式下拉（内含 `ToolFloatingPanel`）、输入框 + 计数 + 最近搜索（`ToolFloatingPanel`）、上一个/下一个、结果抽屉触发器。
   - props：`treeSearch`（复用 `JsonOutputPanel.vue:530` 已有的 `useTreeSearch` 实例），内部不重复创建 search 实例。
   - emits：`toggle-expand-all`（由 `JsonOutputPanel.toggleExpandAll` `:808` 处理，因为要发 `expandAllSignal` provide）。
   - 结果抽屉保留在 `TreeToolbar` 内（只有一个使用方，不单独抽组件），定位改成相对工具行下边缘。
2. `JsonOutputPanel` header 删掉 `:52-158` 整段搜索组；rich 容器（`:334`）内按 §3.2 挂 `<ToolPanelBar sticky><TreeToolbar/></ToolPanelBar>`。
3. 窄屏优先级（375px 必须不溢出）：`模式下拉 > 输入框(flex-1) > n/m 计数 > 上一个/下一个 > 抽屉图标`；Expand/Collapse 移回 header（与 Copy/Download 同排）或并入 `⋯` 溢出菜单。
4. **验收**：
   - 滚动 rich 容器时工具行 `getBoundingClientRect().top` 保持等于容器 top（真 sticky，脚本 §8.4）；
   - `scrollTop = 0` 时工具行独占一行，不覆盖第一行树内容；
   - 三个宽度（1440 / 768 / 375）header 无横向滚动条；
   - 搜索 → 下一个 → 命中行真的在可视区；第一个命中不被工具行遮住；
   - Table 模式工具条与 Rich 工具行视觉位置对齐。

### P4 — 全量回归清单（每轮改动后都跑）

| 页面 | 检查项 |
|---|---|
| `/tools/format/json-editor` | 遮罩开关、Expand/Collapse、搜索下拉、历史、上一个/下一个、结果抽屉导出、复制路径、错误定位闪烁 |
| `/tools/convert/json-to-csv` | Rich/Text/Table 切换；**搜索组不可见**；自有 Copy/Download；Table 模式 Columns 菜单可弹出并通过命中判定 |
| `/tools/convert/json-to-excel` | 同上 |
| `/tools/convert/csv-to-json` | 同上 + `v-model` 切换不失效 |
| `/tools/format/json-minifier`、json-escape（按实际分类） | 仅 Copy/Download，无视图切换 |
| `json-to-yaml` / `json-to-xml` / `xml-to-json` / `json-to-code` / `json-to-typescript` / `json-schema-generator` | 同上 |
| `/embed/json`（viewer 模式） | 可编辑输出区改动能被保存（bug B 修复验证）；其余控件全在 |

---

## 5. 每阶段 DoD（完成的定义）

- [ ] SFC 编译通过（§8.1）、控制台 0 error。
- [ ] 变更页 DOM 快照对比符合 §2.2「P1 建议」列。
- [ ] 所有浮层通过 §8.2 的 `elementFromPoint` 命中判定。
- [ ] sticky 行为通过 P3 验收 4 项（吸顶 / 首行不遮 / 三宽度不溢出 / 命中可见）。
- [ ] 新增抽象 ≥2 个使用方，且旧的手写实现已删除（§0.6）。
- [ ] copy-accuracy 审计表落地（断言 / 文案 file:line / 实现 file:line / 结论）。
- [ ] en、zh 双语各验一次（`app/assets/data/**` 用 `en`/`zh`，`i18n/locales/` 用 `en.json`/`zh-CN.json`）。
- [ ] 无残留未使用的 i18n key。

---

## 6. 风险与回滚

| 风险 | 触发场景 | 对策 |
|---|---|---|
| 某转换页其实靠搜索框干活 | 用户反馈"少了搜索" | P1 是单点 prop 改动，加回 `:enable-tree-search="true"` 即可，同时补写进该页 JSON 的 `features` |
| sticky 导致命中滚动位置偏移 | 测出第一行被遮 | 给滚动容器加 `scroll-padding-top`；或把 `scrollIntoView` 的 `block` 固定为 `center`（现状已是 center） |
| `ToolFloatingPanel` 抽象过度 | 只有 1 个使用方 | §0.6 硬约束：P2 开工前先确认第 2、3 个使用方到位（模式下拉 + 最近搜索 + JsonTableView Columns） |
| P2/P3 混在同一个 commit | 回滚困难 | P2 只搬家不改位置，P3 只改位置不碰浮层逻辑，分两个改动批次 |
| 删除 i18n key 导致 zh 页漏 key | 顺手删 key | 删 key 前 grep 全仓库；有疑问就保留 key |

---

## 7. 未纳入本次范围

- `LargeJsonViewer` / `LargeFile*` 系列的 header 与浮层（另一条链路，独立议题）。
- `JsonTreeNode` 已移除虚拟滚动（数组/对象全量渲染），接近 `LARGE_FILE_MAX_BYTES`（5MB）文档的性能表现需要在 P1 之后单独观察。
- 已无使用方的 `app/composables/useVirtualList.ts`、`useLazyTree.ts`、`useWorkerParser.ts` —— 是否删除待定。

---

## 8. 附录：实测脚本

### 8.1 SFC 编译校验（不需要 dev server）

```bash
node -e "
const p='./node_modules/.pnpm/@vue+compiler-sfc@3.5.41/node_modules/@vue/compiler-sfc';
const { parse, compileTemplate } = require(p);
const fs=require('fs');
for (const f of ['app/components/tool/JsonOutputPanel.vue','app/components/tool/TreeToolbar.vue']) {
  const { descriptor, errors } = parse(fs.readFileSync(f,'utf8'), { filename: f });
  if (errors.length) { console.log(f,'PARSE', errors.map(e=>e.message)); continue }
  const r = compileTemplate({ source: descriptor.template.content, filename: f, id: 'x' });
  console.log(f, '→ template errors:', r.errors.length ? r.errors.map(String) : 'none');
}
"
```

### 8.2 浮层可见性判定（关键）

浮层存在不等于可见——祖先的 `overflow` 会裁掉它：

```js
() => {
  const drop = document.querySelector('body > .tool-floating-panel')   // 统一 class，便于收割
  if (!drop) return { found: false }
  const r = drop.getBoundingClientRect()
  const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2)
  return { found: true, rect: { top: r.top, h: r.height }, hitInside: drop.contains(hit) }
}
```

`hitInside: true` 才算通过。修复前对照数据：json-editor 页面 dropdown rect `top=348 / height=142`，header 是 `top=314 / bottom=344` → 面板整体位于容器外，`hitInside: false`（渲染了但看不见）。

### 8.3 header / 工具条控件收割（逐页比对用）

```js
() => {
  const out = [...document.querySelectorAll('label')].find(l => l.textContent.includes('CSV Output'))
  const header = out.closest('.flex.flex-col').querySelector(':scope > div')
  return [...header.querySelectorAll('button, input[type=text]')]
    .map(el => el.tagName + ':' + (el.textContent || el.getAttribute('placeholder') || '').trim().slice(0, 20))
}
```

### 8.4 sticky 行为验证

```js
() => {
  const bar = document.querySelector('[data-tool-bar="tree"]')
  const scroller = bar.closest('.overflow-auto')
  const before = bar.getBoundingClientRect().top - scroller.getBoundingClientRect().top
  scroller.scrollTop = 400
  requestAnimationFrame(() => {
    const after = bar.getBoundingClientRect().top - scroller.getBoundingClientRect().top
    console.log({ stuckAtTop: Math.abs(after) < 2, before, after })
  })
}
```

---

## 9. 决策记录

| 日期 | 决策 | 备选 | 理由 | 反悔成本 |
|---|---|---|---|---|
| 2026-09-24 | 搜索/历史/上一个下一个等控件**不再留在 header**，下沉到 rich 视图内的 **`sticky` 工具行** | A `absolute` 浮层盖内容顶部 / C 文档流独立一行 | A 会永久遮住树首行；C 无法吸顶、长文档里按钮离视线远；B 兼顾吸顶与不永久遮挡，项目内已有 `sticky` 先例 | 中：控件只是挪位置，`TreeToolbar` 内部 API 不变时可整块搬回 header |
| 2026-09-24 | 浮层统一走 `ToolFloatingPanel` + `useAnchoredPanel`，工具条统一走 `ToolPanelBar` | 各组件自己写 `Teleport` + `getBoundingClientRect` | 同一 bug（被祖先 `overflow` 裁切）已在 3 处重复出现；抽一次成本 < 修第三次 | 低：单一实现，改一处全站生效 |
| 2026-09-24 | `enableTreeSearch` 默认反转为 `false`，由调用点显式开启 | 保持默认 true，逐个关掉 | 默认值应属于"最小能力"，新增页面不该被动获得树浏览能力 | 低：prop 单点 |
| 2026-09-24 | sticky 工具条贴边改用「滚动容器去 `p-4` + 树内容内衬 `p-4`」，放弃 `-mx-4 -mt-4` 负 margin 方案 | 容器保留 `p-4` + 工具条负 margin 拉回贴边 | 负 margin 在 `sticky top-0` 吸顶时约束的是 margin box，会把可见 border box 顶到边框下 16px，产生缝隙；实测容器去 padding 后吸顶 `gap≈1px` | 低：纯 DOM/CSS，回退只需把 `p-4` 挪回容器并恢复负 margin |
| 2026-09-24 | P4 全量回归 **31/31 通过，0 控制台错误**（Playwright `channel:chrome` + `elementFromPoint` 命中判定） | — | 转换器三页曾报"Rich 视图无搜索组"失败，经排查为**测试脚本缺陷**而非代码缺陷：`JsonTreeNode` 根节点类是 `.font-mono.text-sm`（无 `.json-tree-node`），且 `JsonTableView` 的 `ToolPanelBar` 经 `v-show` 始终留于 DOM，致 `[data-tool-bar]` 计数恒 ≥1；改用「可见 `[data-tool-bar]`」判定后三页均 `visibleToolbar=0、treeRendered=true`，确认 Rich 视图无搜索组、树正常渲染 | 低：回归脚本已修正，复跑即得一致结论 |
