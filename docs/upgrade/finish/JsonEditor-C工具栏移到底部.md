# JsonEditor — C 组（批量/撤销/重做）移到底部

> 战场：`app/components/tool/JsonOutputPanel.vue`（加通用 `#footer` 插槽）+ `app/components/universal/JsonEditor.vue`（搬按钮）
> 姊妹项：`JsonEditor-B组外移计划.md`（B 组已移出）、`JsonEditor-toolbar分组计划.md`
> 目标：把批量/撤销/重做从顶部 `#toolbar-left` 搬到右输出面板底部，仅 rich（树形）视图显示；顺手把散落的全宽"批量赋值条"收进同一底部区。

---

## 0. 结论与硬约束

1. **范围（已与用户确认）**：底部条只在**右侧输出/树面板**底部，分屏时仅占右半。语义最准——批量/撤销只作用于右侧的树。
2. **`JsonOutputPanel` 被 ~17 个工具共用**（JsonToCsv / JsonToYaml / JsonMinifier / embed/json / NodeInspector 等）→ **绝不能**硬编码编辑器逻辑进去。正确做法：给它加一个**通用的 `#footer` 插槽**，其它消费者不用即不受影响。
3. **零耦合**：插槽内容定义在 `JsonEditor.vue` 模板里，天然访问 `nodeEditing` / `viewMode` / `batchValue` / `applyBatch` / `t`，不往共享组件塞任何编辑器状态。
4. **copy-accuracy**：按钮只是挪位，能力不变；`Edit JSON in the Tree` 特性承诺（撤销/重做/多选设值）仍成立，**无需改文案**。

---

## 1. 现状

- 顶部 `#toolbar-left` 现含 A 组（缩进 / 压缩·格式化）+ C 组（批量/撤销/重做，`v-if="viewMode==='rich'"` 且 undo/redo 仅 `canUndo/canRedo` 时）。
- 另有一处**全宽**"批量赋值条"在 `ResizablePanel` 下方（`v-if="batchMode && batchSelected.size>0"`），与顶部按钮割裂。
- `JsonOutputPanel` 根：`<div class="flex-1 min-h-0 flex flex-col relative">`，内含 Header + 三个视图（text/rich/table，各 `flex-1 min-h-0` `v-show`）+ `relative`。rich 视图顶部已有 sticky 树搜索栏（`ToolPanelBar`，line 140）。

---

## 2. 实施步骤

### P1 — `JsonOutputPanel.vue` 加通用 `#footer` 插槽

根 `flex flex-col` 末位（三个视图块之后、`</div>` 之前）插入：
```html
<slot name="footer" />
```
仅当调用方提供时才有内容（用 `v-if="$slots.footer"` 包一层带顶边框/背景的 `shrink-0` 容器，使其钉在面板底部、不随树滚动）。其它 16 个消费者不传该插槽 → 布局不变。

### P2 — `JsonEditor.vue`：把 C 组搬进 `#footer`

1. `#second` 的 `<JsonOutputPanel ... />` 改为带 `#footer` 插槽的闭合标签，插槽内容：
   - 外层 `v-if="viewMode === 'rich'"` 的 `flex flex-wrap items-center gap-2` 容器；
   - 批量按钮（toggle batchMode）、撤销（`v-if="canUndo"`）、重做（`v-if="canRedo"`）——复用现有样式；
   - 批量赋值行（`v-if="batchMode && batchSelected.size>0"`）：selectedCount + input(`batchValue`,@keydown.enter=applyBatch) + Apply + Clear。
2. 从 `#toolbar-left` 删除原 3 个按钮（C 组）。
3. 删除 `ResizablePanel` 下方原全宽批量条（`v-if="nodeEditing.batchMode.value && ...size>0"` 那块）。

### P3（无代码）— 回归（用户自验，dev `:3333`）

1. rich 视图：右侧面板底部出现 [批量][撤销][重做]；text/table 视图不出现。
2. 撤销/重做仅"可点时"出现（编辑树后出现，重做需先撤销）。
3. 批量：进多选模式→选中节点→底部出现输入+Apply，填值回车/Apply 生效；Clear 清空。
4. 分屏 / 全屏 / 窄屏（375）底部条 `flex-wrap` 无横向溢出；零控制台错误。
5. 其它工具（如 json-minifier）页面底部无多余条（插槽未用）。

---

## 3. 决策记录

| 日期 | 决策 | 备选 | 理由 | 反悔成本 |
|---|---|---|---|---|
| 2026-09-25 | C 组移右侧面板底部（footer 插槽），非整宽 | 整宽底栏 / 留顶部 | 批量撤销只作用于右侧树，面板底部语义最准；整宽跨分屏且语义牵强；留顶部则工具栏仍乱 | 低：纯组件内 + 插槽 |
| 2026-09-25 | 用通用 `#footer` 插槽而非硬编码 | 直接在 JsonOutputPanel 写按钮 | 该组件被 ~17 工具共用，硬编码会污染全部消费者 | 低 |
| 2026-09-25 | 把散落的全宽批量赋值条并入同一 footer | 保留全宽条独立 | 避免 UI 分裂，批量"按钮+输入"集中在一处 | 低 |

## 4. 落地状态（2026-09-25 完成）

- P1 已落地：`JsonOutputPanel.vue` 根 `flex flex-col` 末位加 `<slot name="footer" />`，外套 `v-if="$slots.footer"` 的 `shrink-0` 带顶边框/背景容器，钉在面板底部、不随树滚动。其它 16 个消费者不传该插槽 → 布局不变（已 curl 验证 json-minifier / json-to-yaml 仍 200）。
- P2 已落地：`JsonEditor.vue` 把批量/撤销/重做 + 批量赋值条整体搬进 `<JsonOutputPanel>` 的 `#footer` 插槽；插槽用 `v-if="viewMode === 'rich'"` 门控（避免 text/table 出现空边框条）；从 `#toolbar-left` 删 3 按钮；删 `ResizablePanel` 下方全宽批量条。顶部工具栏现仅剩 A 组（缩进 + 压缩/格式化）。
- copy-accuracy：按钮仅挪位、能力不变；`Edit JSON in the Tree` 承诺仍成立，无需改文案。
- 验证：json-editor 页 200；json-minifier / json-to-yaml 200（共享组件无回归）。窄屏/全屏溢出与交互手感由用户自验。
