# JsonOutputPanel Header 精简 — 实施计划

> 主战场：`app/components/tool/JsonOutputPanel.vue`
> 影响面：16 处调用点（13 个工具页 + `NodeInspector` + `pages/embed/json.vue` 两处）
> 原则：**先删死代码，再反转默认，最后抽结构**；每阶段收尾跑「浮层可见性实测」+ copy-accuracy 审计（`.claude/rules/copy-accuracy.md` §3，en/zh 同步）。

---

## 0. 目标与硬约束

1. **不改任何工具的产品语义**：JsonEditor / embed 是「浏览 + 编辑」场景；JsonToCsv / JsonToExcel / CsvToJson 是「转换 + 预览」场景；其余转换器只出文本结果。控件必须跟着场景走，而不是跟着默认值走。
2. **纯前端约束不变**：本次只动 UI 可见性与 API 形状，不引入网络请求、不改 JSON 处理链路。
3. **copy-accuracy 阻断级**：任何一个控件从某页消失，必须先确认该页 `app/assets/data/{category}/{slug}.json` 的 `features` / `guide` / `faq` / `article` / `meta` / `ui` **没有承诺过对应能力**。结论见 §2.6，可直接引用。
4. **i18n 双语**：面板内文本来自 `i18n/locales/en.json` 与 `zh-CN.json`（`tree.*`、`search.*`、`system.*`、`largeViewer.*`）；删除控件后不要顺手删 i18n key——先确认无其他使用方（否则合入后跑一遍全站 grep）。
5. **浮层必须实测**：header 是横向滚动容器，任何「下拉兜不稳」的修南北都要用 `elementFromPoint` 命中判定验证，肉眼"看起来能点"不算通过（见 §8 附录）。

---

## 1. 背景与动机

两个线索汇到一起：

1. **浮层 bug**：header 容器 `JsonOutputPanel.vue:4` 带 `overflow-x-auto scrollbar-hide`。按 CSS 规范，当 `overflow-x` 非 `visible` 时，`overflow-y` 的计算值会被强制成 `auto` → 容器成为滚动盒 → 任何 `absolute + top-full` 的浮层被裁掉。
   - 受影响：(a) 搜索模式下拉、(b) 最近搜索列表、(c) `Invalid JSONPath expression.` 红条。
   - 已修（本轮提交）：三者改 `<Teleport to="body">` + `fixed` 定位，用 `measureAnchor()`（`JsonOutputPanel.vue:620`）按触发器的 `getBoundingClientRect()` 计算坐标。
2. **按钮蔓延**：排查 header 时发现"太多按钮"，且相当一部分是**为 JsonEditor 做的树浏览能力**，因为默认值放宽而泄漏到了所有传了 `parsed-data` 的页面。

本计划解决第 2 条；第 1 条的修复记录见 §1.1，作为后续工具的基线。

### 1.1 已完成的浮层修复（基线，勿回退）

| 浮层 | 原位置 | 现方案 | 锚点 |
|---|---|---|---|
| 搜索模式下拉 | `.absolute.top-full` | `<Teleport to="body">` + `fixed`，`dropdownStyle` / `measureDropdown` / `toggleModeDropdown` | `JsonOutputPanel.vue:61-90`、`618-651` |
| 最近搜索列表 | `.absolute.top-full` | 与红条合并为一个 teleport 容器，`searchPanelStyle` / `measureSearchPanel` | `JsonOutputPanel.vue:93-158`、`653-663` |
| JSONPath 非法提示 | `.absolute.top-full` | 同上容器内，`bg-red-600` 条，`self-end` 右对齐 | `JsonOutputPanel.vue:123-136` |

容器统一 `pointer-events-none`，子项 `pointer-events-auto`，避免遮挡下方内容；打开期间监听 `scroll`（capture）/ `resize` 跟随定位，`onUnmounted` 摘除（`JsonOutputPanel.vue:665-689`）。

---

## 2. 现状盘点

### 2.1 header 控件清单

| # | 控件 | 模板锚点 | 显示条件 | 今天谁真的看得到 |
|---|---|---|---|---|
| 1 | 标题 label | `:6` | 总是 | 16 处全部 |
| 2 | 视图切换 Rich / Text / Table | `:7-34` | `parsedData !== null && showViewToggle` | 传了 `parsed-data` 的 7 处 |
| 3 | 敏感字段遮罩（眼/眼-off） | `:36-49` | `sensitivePaths.size > 0` | 仅 `JsonEditor.vue:61` |
| 4 | Expand / Collapse All | `:53-59` | `rich && parsedData !== null && enableTreeSearch` | 6 处（NodeInspector 已关） |
| 5 | 搜索模式下拉 | `:61-90` | 同上 | 同上 |
| 6 | 搜索输入框 + 计数 + 历史 | `:93-158` | 同上 | 同上 |
| 7 | 结果抽屉 / 上一个 / 下一个 | `:160-183`、抽屉本体 `:221-269` | 同上 && query 非空 | 同上 |
| 8 | Format / Minify / Validate / Fix | `:186-200` | `showEditActions === true` | **0 处**（死代码） |
| 9 | `#actions` 插槽 | `:202` | 有传入 | **0 处**（死代码） |
| 10 | Copy | `:204-210` | `showCopy`（默认 true） | 12 处（JsonToCsv / JsonToExcel 关闭） |
| 11 | Download | `:211-217` | `showDownload`（默认 true） | 同上 |

抽屉里的结果导出按钮（txt / json / csv，模板 `:232` `:239` `:246`，实现 `exportResults` `:575`）属于控件 7 的二级 UI，跟随 7 一并开关。

### 2.2 调用点矩阵（16 处）

| 调用点 | parsed-data | view-mode 初值 | show-view-toggle | enable-tree-search | copy / download | 现状 header 渲染 | P1 建议 |
|---|---|---|---|---|---|---|---|
| `JsonEditor.vue:61` | ✅ | 变量（`defaultViewMode`） | ✅ 变量 | 默认 true | false / false | 2,3,4,5,6,7 全量 + 无复制下载 | **显式 true** |
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
| prop | `showEditActions` | 声明 `:422-423`，默认 `:451`，模板 `:187` | 16 处调用点无一传入（脚本统计 0 次） |
| emit | `format` | `:466` | 全仓库无 `@format=` 监听方 |
| emit | `minify` | `:467` | 同上 |
| emit | `validate` | `:468` | 同上 |
| emit | `fix` | `:469` | 同上 |
| emit | `paste` | `:470` | 同上（text 模式 textarea 的 `@paste`，模板 `:286`） |
| emit | `update:content` | `:461` | 无监听方 → 见 §2.5 bug B |
| slot | `#actions` | `:202` | 无 `<template #actions>` 调用方 |
| provide | `treeViewport` | `:400` | `JsonTreeNode` 已移除虚拟滚动，不再 inject |

> 反向核对：正在被监听的 emit 有 `copy`(10) / `download`(10) / `update:view-mode`(4) / `locate-error`(2) / `load-example`(2) / `copy-path`(1) / `update:masked`(1) —— **一个都别动**。

### 2.4 泄漏实证（这是要解决的真问题）

实测步骤：打开 `/tools/convert/json-to-csv` → 点 Example → 点 Convert to CSV → 读输出面板 header DOM：

```
Rich | Text | Table | Collapse | Key | Search by key name..
```

一个「JSON → CSV 转换」工具的输出区，挂了整套树浏览 + 搜索工具栏（对应控件 4/5/6/7），而该页文案从未承诺过这些能力。根因：`enableTreeSearch` 默认 `true`（`:456`），只有 NodeInspector 显式传了 `false`。

### 2.5 顺带发现的两个 bug（P1 顺手修）

- **bug A｜`CsvToJson.vue:19` 与 `:24` 重复绑定**：同一元素同时写了 `v-model:view-mode="outputViewMode"` 和静态 `view-mode="rich"`，props 合并后谁生效取决于顺序，属于隐式行为。→ 删掉静态 `view-mode="rich"`，保留 `v-model`（初值已在 `CsvToJson.vue:75` 的 ref 里是 `'rich'`）。
- **bug B｜可编辑输出面板改动被丢弃**：只有 `pages/embed/json.vue:429` 传了 `editable`，而它 emit `update:content` 时没有任何监听方 → 在该面板里编辑的内容不会回到数据源。→ 二选一：**(推荐)** embed 页面补 `@update:content` 处理；或删掉 `editable` / `update:content` / `placeholder` 这条链路（可编辑 textarea `:273-295`）。**不要让现状留在仓库里**。

### 2.6 文案承诺核对结论（copy-accuracy 前置结论）

对 4 个相关页面的 `en` / `zh` 全字段（含 `article`）做过 tree / search / JSONPath / collapse 关键词扫描：

| 页面 | 命中 | 结论 |
|---|---|---|
| `app/assets/data/format/json-editor.json` | en: tree / search / JSONPath；zh: search / JSONPath | **承诺了树与搜索** → 必须保留控件 4-7 |
| `app/assets/data/convert/json-to-csv.json` | 无命中 | 只承诺 Table Preview → **可关 4-7**，保留 Rich/Text/Table |
| `app/assets/data/convert/csv-to-json.json` | 无命中 | 同上 |
| `app/assets/data/convert/json-to-excel.json` | 仅一处 `"Many people search for a JSON to Excel converter"`（行文，非能力承诺） | 同上 |

> 结论：P1 关闭这三个转换工具的搜索组**不违反 copy-accuracy**。执行前建议在 PR 描述里附上这三条收割结果。

---

## 3. 目标形态

header 收敛成四个语义区，**默认最小，按需叠加**：

```
[ A 标题区 ]  [ B 视图切换（需 parsedData） ]  [ C 树浏览+搜索组（显式开启） ]   →   [ D 复制 / 下载 ]
```

- **A** 永远在。
- **B** 保持现状的逻辑（`parsedData !== null && showViewToggle`），不引入新开关。
- **C** 是整组开关：**必须显式 `enableTreeSearch`**，包含 Expand/Collapse、模式下拉、搜索框、上一个/下一个、结果抽屉（含导出）。
- **D** 保持现有两个独立 prop（转换类工具已会用 `false` 关掉并换成自己的「Copy CSV / Download」）。

---

## 4. 执行计划

### P0 — 删死代码（零行为变更，先合）

1. 删模板 `:186-200`（`showEditActions` 的 4 个按钮）与 `:202`（`<slot name="actions" />`）。
2. 删 props 声明与默认值：`showEditActions`（`:422-423`、`:451`）。
3. 删 emits：`format` `minify` `validate` `fix` `paste`（`:466` `:467` `:468` `:469` `:470`）。
4. 删 provide `treeViewport`（`:400`），连带清理 `richRef` 是否还有其他用途——它仍作为滚动容器 ref 使用则保留 `ref` 绑定，仅删 `provide`。
5. **验收**：`node` 侧 SFC 编译无错（见 §8.1）；全仓库 `grep -rn "showEditActions\|show-edit-actions\|treeViewport"` 仅剩 0 处；13 个工具页 + embed 两处手动过一遍，UI 无变化。

### P1 — 默认反转 + 显式开启 + 修两个 bug

1. `JsonOutputPanel.vue:456` 的 `enableTreeSearch` 默认改 `false`；同步改 props 注释（`:432`）说明"必须显式开启"。
2. 按 §2.2 的「P1 建议」列逐个调用点补 prop：
   - `JsonEditor.vue:61`、`pages/embed/json.vue:322`、`pages/embed/json.vue:429` → 加 `:enable-tree-search="true"`。
   - `JsonToCsv.vue:19`、`JsonToExcel.vue:17`、`CsvToJson.vue:18` → 加 `:enable-tree-search="false"`。
   - `NodeInspector.vue:71` 已是 `false`，保持。
   - 其余 8 处无 `parsed-data`，本就渲染不出 C 区，无需改。
3. 修 bug A：`CsvToJson.vue` 删静态 `view-mode="rich"`，保留 `v-model:view-mode`。
4. 修 bug B：embed 页面补 `@update:content`（推荐），或整条删掉 `editable` 链路 —— **两者取其一并在 PR 里写明**。
5. **验收**：
   - `/tools/convert/json-to-csv` 转换后 header 只剩 `Rich Text Table`（+ 该页自有的 Copy/Download 在 toolbar）。
   - `/tools/format/json-editor`、`/embed/json` 控件 4-7 仍在。
   - `/tools/convert/csv-to-json` 视图切换仍能正常切换、`v-model` 双向生效。
   - copy-accuracy：按 §2.6 结论写 PR 说明；若某页要保留搜索，必须先把能力写进该页 JSON 的 `features`（en + zh）。

### P2 — API 收敛：`features` 白名单（可选，但建议在 P3 之前做）

6 个布尔 prop（`showViewToggle` / `showEditActions`(已删) / `showCopy` / `showDownload` / `enableTreeSearch` / `editable`）散落各处，建议收敛成单个对象，减少"忘了传就默认给"的概率：

```ts
features?: {
  viewToggle?: boolean   // 默认 parsedData 存在时 true
  treeSearch?: boolean   // 默认 false（必须在调用点显式写 true）
  copy?: boolean         // 默认 true
  download?: boolean     // 默认 true
  editable?: boolean     // 默认 false
}
```

迁移顺序：新增 `features` 的同时保留旧 prop 一个版本<｜hy_place▁holder▁no▁813｜>警告 → 迁完删除。
> 注意：这一步是纯重构，**不要**与 P1 的开关调整混在一个 commit 里，否则回滚困难。

### P3 — 结构瘦身（最后做）

1. 把控件 4-7 抽成内部子组件 `app/components/tool/ToolSearchToolbar.vue`（接收 `treeSearch` 实例 + `richExpanded` 信号），header 只留 `<ToolSearchToolbar v-if="enableTreeSearch" ... />`。
2. 窄屏溢出：把 C 区（或 C+D）收进 `⋯` 溢出菜单，替换现在的横向滚动溢出；溢出菜单同样要 teleport + `fixed`（复用 `measureAnchor`）。
3. 抽屉本体（`:221-269`）一并移入 `ToolSearchToolbar` 或独立 `JsonSearchResultsDrawer.vue`。
4. **验收**：1440 / 768 / 375 三个宽度下 header 不出现横向滚动条；所有浮层通过 §8.2 命中判定。

### P4 — 全量回归清单（每轮改动后都跑）

| 页面 | 检查项 |
|---|---|
| `/tools/format/json-editor` | 遮罩开关、Expand/Collapse、搜索下拉、历史、上一个/下一个、结果抽屉导出、复制路径、错误定位闪烁 |
| `/tools/convert/json-to-csv` | Rich/Text/Table 切换；**搜索组不可见**；自有 Copy/Download 正常 |
| `/tools/convert/json-to-excel` | 同上 |
| `/tools/convert/csv-to-json` | 同上 + `v-model` 切换不失效 |
| `/tools/format/json-minifier`、`/tools/security/json-escape`(按实际分类) | 仅 Copy/Download，无视图切换 |
| `/tools/convert/json-to-yaml`、`json-to-xml`、`xml-to-json`、`json-to-code`、`json-to-typescript`、`json-schema-generator` | 同上 |
| `/embed/json`（viewer 模式） | 可编辑输出区改动能被保存（bug B 修复验证）；其余控件全在 |

---

## 5. 每阶段 DoD（完成的定义）

- [ ] SFC 编译通过（§8.1）、控制台 0 error。
- [ ] 变更页 DOM 快照对比符合 §2.2「P1 建议」列。
- [ ] 所有浮层通过 §8.2 的 `elementFromPoint` 命中判定（不是"看起来能点"）。
- [ ] copy-accuracy 审计表落地（断言 / 文案 file:line / 实现 file:line / 结论）。
- [ ] en、zh 双语各验一次（`apps/assets/data/**` 用 `en`/`zh`，`i18n/locales/` 用 `en.json`/`zh-CN.json`）。
- [ ] 无残留未使用的 i18n key（若删控件，先 grep 再删 key）。

---

## 6. 风险与回滚

| 风险 | 触发场景 | 对策 |
|---|---|---|
| 某转换页其实靠搜索框干活 | 用户反馈"少了搜索" | P1 是单点 prop 改动，加回 `:enable-tree-search="true"` 即可；同时补写到该页 JSON 的 `features` |
| P2 的 `features` 迁移引入隐性默认值差异 | 迁移表漏项 | P2 单独一个 PR，旧 prop 并行一个版本，逐页迁移并跑 §4 P4 回归清单 |
| P3 抽组件后浮层再次被裁 | 新父容器带 `overflow-x-auto` | 任何新浮层一律 `<Teleport to="body">` + `measureAnchor`，进必检列表 |
| 删除 i18n key 导致 zh 页漏 key | 顺手删 key | 删 key 前 grep 全仓库；有疑问就保留 key |

---

## 7. 未纳入本次范围

- `LargeJsonViewer` / `LargeFile*` 系列的同类 header 与浮层问题（另一条链路，独立议题）。
- `JsonTreeNode` 已移除虚拟滚动（数组/对象现在全量渲染），接近 `LARGE_FILE_MAX_BYTES`（5MB）文档的性能表现需要在 P1 之后单独观察。
- 现在已无使用方的 `app/composables/useVirtualList.ts`、`useLazyTree.ts`、`useWorkerParser.ts` —— 是否删除待定，不在本计划改造范围内。

---

## 8. 附录：实测脚本

### 8.1 SFC 编译校验（不需要 dev server）

```bash
cd /path/to/jsontoolbox.cc
node -e "
const p='./node_modules/.pnpm/@vue+compiler-sfc@3.5.41/node_modules/@vue/compiler-sfc';
const { parse, compileTemplate } = require(p);
const fs=require('fs');
for (const f of ['app/components/tool/JsonOutputPanel.vue']) {
  const { descriptor, errors } = parse(fs.readFileSync(f,'utf8'), { filename: f });
  if (errors.length) { console.log(f, 'PARSE', errors.map(e=>e.message)); continue }
  const r = compileTemplate({ source: descriptor.template.content, filename: f, id: 'x' });
  console.log(f, '→ template errors:', r.errors.length ? r.errors.map(String) : 'none');
}
"
```

### 8.2 浮层可见性判定（关键，不能只看 DOM 存在）

浮层存在不等于可见——header 的 `overflow` 会裁掉它。用命中判定：

```js
// 打开浮层后执行
() => {
  const drop = document.querySelector('body > div.fixed.z-\\[100\\]')
  if (!drop) return { found: false }
  const r = drop.getBoundingClientRect()
  const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2)
  return { found: true, rect: { top: r.top, left: r.left, w: r.width, h: r.height }, hitInside: drop.contains(hit) }
}
```

`hitInside: true` 才算通过。对照修复前的实测数据：`json-editor` 页面上 dropdown 的 rect 是 `top=348 / height=142`，而 header 是 `top=314 / bottom=344` —— 面板整体位于容器之外，`hitInside: false`，即"渲染了但看不见"。

### 8.3 header 控件收割（用于逐页比对）

```js
() => {
  const out = [...document.querySelectorAll('label')].find(l => l.textContent.includes('CSV Output'))
  const header = out.closest('.flex.flex-col').querySelector(':scope > div')
  return [...header.querySelectorAll('button, input[type=text]')]
    .map(el => el.tagName + ':' + (el.textContent || el.getAttribute('placeholder') || '').trim().slice(0, 20))
}
```
