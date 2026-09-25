# JsonEditor 工具栏分组（短期）

> 战场：`app/components/universal/JsonEditor.vue` 的 `toolbar-left`（89–188 行）
> 目标：**纯呈现层分组 + 情境化显隐**，不动任何能力、不改任何文案、不新增浮层。
> 关联：本计划是 `JsonOutputPanel-header精简计划.md` 的**姊妹项**（那次只动了输出面板 header，没碰编辑器工具栏）。本计划只解决"工具栏 8 组控件混在一起、且 B/C 组不属于格式化核心"的问题。

---

## 0. 当前问题

`toolbar-left` 里 8 组控件平铺（`flex flex-wrap gap-2`），分属三个语义域却毫无视觉分组：

| 组 | 控件（行） | 语义 | 是否格式化核心 |
|---|---|---|---|
| A | 缩进(91–102) / Minify·Format(104–123) / Auto-format(125–139) | 格式化 | ✅ 是 |
| B | Schema 校验(142–150) / Generate(153–161) | 其它工具以"模式"寄生 | ❌ 否（与 `JsonSchemaGenerator`/`JsonToTypescript`/`JsonToYaml`/`JsonToCode` 等独立页重复） |
| C | 批量(164–172) / 撤销(173–179) / 重做(180–186) | 树节点编辑 | ❌ 否（仅 rich 树视图有意义，却常驻） |

代价：① 工具栏越堆越长（"按钮蔓延"同源问题）；② 用户分不清哪些属于"格式化"、哪些是别的工具入口；③ C 组在 text 视图无意义却一直显示。

---

## 1. 方案（短期、低风险）

三条改动，全部呈现层：

1. **A|B|C 三组之间插竖向分隔线**，让"格式化 / 其它工具 / 树编辑"一眼可分。
2. **B 组保持按钮形态**（不收下拉、不移除能力）——短期只做视觉分组，避免触碰与独立页的重复实现（那是中期项）。
3. **C 组改为情境化**：仅 `viewMode === 'rich'` 时显示（撤销/重做/批量只对树节点有意义）。

### 1.1 改动后的 DOM 结构（伪代码）

> **实际实现微调（与初稿等价、更稳妥）**：B 组不额外包 `<div>`（仅靠分隔线做视觉分组），C 组三个按钮各自加 `v-if="viewMode === 'rich'"` 而非包一层 `v-if` div——避免引入嵌套 `div` 闭合平衡风险。外层仍是 `flex flex-wrap items-center gap-2`。

```html
<template #toolbar-left>
  <div class="flex flex-wrap items-center gap-2 shrink-0">
    <!-- 组 A：格式化核心（原 <div class="flex items-center gap-2"> 不变） -->
    <div class="flex items-center gap-2">
      <label>Indent: …</label>
      <select v-model="indent">…</select>
      <!-- Minify / Format 分段按钮 -->
      <!-- Auto-format 开关 -->
    </div>

    <!-- 分隔线 A|B -->
    <span class="h-5 w-px bg-surface-200 dark:bg-surface-700 mx-0.5" aria-hidden="true" />

    <!-- 组 B：其它工具入口（模式切换）—— 不额外包 div，靠分隔线分组 -->
    <button @click="toggleSchema">…</button>
    <button @click="toggleGenerate">…</button>

    <!-- 分隔线 B|C -->
    <span class="h-5 w-px bg-surface-200 dark:bg-surface-700 mx-0.5" aria-hidden="true" />

    <!-- 组 C：树节点编辑（仅 rich 视图，逐按钮 v-if） -->
    <button v-if="viewMode === 'rich'" @click="nodeEditing.batchMode.value = !nodeEditing.batchMode.value">…</button>
    <button v-if="viewMode === 'rich'" @click="nodeEditing.undo()" :disabled="!nodeEditing.canUndo.value">…</button>
    <button v-if="viewMode === 'rich'" @click="nodeEditing.redo()" :disabled="!nodeEditing.canRedo.value">…</button>
  </div>
</template>
```

### 1.2 具体编辑点（`JsonEditor.vue`，已落地）

| 步骤 | 位置 | 操作 |
|---|---|---|
| 1 | 139 `</label>` 后、141 schema 注释前 | 插入 A\|B 分隔线 `<span class="h-5 w-px bg-surface-200 dark:bg-surface-700 mx-0.5" aria-hidden="true" />` |
| 2 | 161 generate `</button>` 后、163 node-editing 注释前 | 插入 B\|C 分隔线（同上） |
| 3 | 164 batch `<button>` 开标签 | 加 `v-if="viewMode === 'rich'"` |
| 4 | 173 undo `<button>` 开标签 | 加 `v-if="viewMode === 'rich'"` |
| 5 | 180 redo `<button>` 开标签 | 加 `v-if="viewMode === 'rich'"` |
| — | B 组 | 不包 div（分隔线已足够分组，免嵌套平衡风险） |

### 1.3 边界与注意

- **分隔线在 `flex-wrap` 下**：窄屏换行时分隔线可能落在一行末尾，属可接受瑕疵；如想更严谨可给分隔线加 `hidden sm:block`，但短期不强制。
- **C 组 `v-if="viewMode === 'rich'"` 的取舍**：撤销/重做本质是对 `inputJson` 的节点编辑历史，切到 text 视图后理论上仍可"撤销"回退。但节点编辑动作只发生在树（rich）里，text 视图无选择入口，常驻无意义。短期按"情境化"隐藏；若后续发现用户需要在 text 视图撤销节点编辑，再放开（属于增强，非本计划）。
- **不改 `viewMode` 默认值**，不改 `schemaMode`/`generateMode` 逻辑，不改 `useNodeEditing`。
- **不触碰 `JsonSchemaPanel` / `JsonGeneratePanel` / `useNodeEditing` 实现**（中期才考虑移除 B 组并复用独立页）。

---

## 2. 范围（明确不做）

- ❌ 不把 B 组收进下拉菜单（那是中期收敛项，会引入 `ToolFloatingPanel` 依赖，超出短期）。
- ❌ 不移除 B 组能力 / 不删 `JsonSchemaPanel`、`JsonGeneratePanel`（重复实现收敛 = 中期，需同步回扫 `features/guide/faq`）。
- ❌ 不改文案（i18n `schema.toggle` / `generate.title` / `edit.*` 全部保留）。
- ❌ 不动 A 组任何行为。

---

## 3. DoD / 验证（Playwright，仿 P4）

在 `:3333` 用 `channel: 'chrome'` 跑，断言：

1. **分组可见**：json-editor 页 `toolbar-left` 内存在 2 个 `span` 分隔线（`.w-px`）。
2. **B 组仍可用**：点 `Schema` → 右侧切换为 `JsonSchemaPanel`（输出区出现 schema 相关文案/控件）；再点 `Generate` → 切换为 `JsonGeneratePanel`；互斥逻辑不变。
3. **C 组情境化**：
   - rich 视图（默认）：批量 / 撤销 / 重做 三个按钮存在。
   - 点 `Text` 切换视图后：C 组三个按钮 `v-if` 隐藏（DOM 中不存在该组）。
   - 切回 `Rich`：C 组重新出现。
4. **撤销/重做可用**：rich 视图下连续节点编辑后，撤销按钮可点（`canUndo` 为真），点击后 `inputJson` 回退。
5. **无横向溢出**：宽度 1440 / 768 / 375 下 `document.documentElement.scrollWidth - innerWidth ≤ 1`。
6. **零控制台错误**。

> 因本计划不动能力、不动文案，**无需跑 copy-accuracy 审计**（§3 铁律只在"增删能力或改文案"时触发；纯显隐/分隔线不在此列）。

---

## 4. 决策记录

| 日期 | 决策 | 备选 | 理由 | 反悔成本 |
|---|---|---|---|---|
| 2026-09-24 | 短期只做"分隔线分组 + C 组 rich 情境化"，B 组保留按钮不收下拉、不移除 | 把 B 组直接收进下拉 / 直接移除 B 组 | 短期目标是"视觉分组 + 减常驻噪音"，非"去重"；收下拉会引入浮层依赖、移除 B 组需同步改独立页与文案，超出短期边界 | 低：分隔线/ v-if 纯 DOM，回退即删两行 |
| 2026-09-24 | C 组 `v-if="viewMode === 'rich'"` 而非始终显示 | 始终显示 / 仅 batch 模式时显示 | 节点编辑动作只发生在树视图，text 视图无入口却常驻是噪音；rich 视图即"树在"的充要条件 | 低：如需 text 视图撤销，去掉 v-if 即可 |
| 2026-09-24 | **实现已完成**（5 处编辑：2 分隔线 + C 组 3 按钮 `v-if`） | — | Playwright DoD 11/11 通过：2 分隔线存在、rich 默认 C 组可见、Text 视图 C 组隐藏/Rich 复现、B 组 Schema 切换无报错、1440/768/375 无横向溢出、零控制台错误；B 组改为"不包 div、仅分隔线分组"以规避嵌套 `div` 平衡风险 | 低 |
