# Large JSON Viewer 重设计

日期：2026-09-22
状态：已确认（用户评审通过，含"不做 301 兼容层"的修订）
依据：`docs/upgrade/json大文件升级计划.md`、`CLAUDE.md` → `.claude/rules/copy-accuracy.md`

---

## 1. 背景与问题

大文件页是全站超大 JSON 的统一去处（编辑器、JSON→CSV、embed 超过 `LARGE_FILE_MAX_BYTES` 都会带内容跳转过来），但当前实现只做「记录集合 → 选列 → 导出 CSV」。观测到三个问题：

1. **没复用公共组件、样式不一致**：自写容器 `max-w-5xl`（站内是 `max-w-[1200px]`）、另一套色板词表（`border-border`/`text-muted` vs 站内 `border-surface-200`/`text-surface-500`）、emoji `📂` 代替 `<Icon>`、没用 `ResizablePanel`。
2. **上下布局难用**：7 个 section 串成一张长表单，页面级滚动，搜索与结果隔着一屏。
3. **功能定位错位**：被引导来「看大 JSON」的用户落到 CSV 转换器；对 `labels`/`components` 这类结构没有可导出的记录集合，整页无可用产出。

根因：实现偏离了 `docs/upgrade/json大文件升级计划.md` 早已确定的定位。

## 2. 定位（来自既有文档，非本次新发明）

> A privacy-first large JSON and text file searcher for fast local inspection.
> 面向大型 JSON 和文本文件的本地搜索与定位工具

核心是 **看 / 搜 / 跳 / 取**，不是「改」。

### 2.1 做

本地打开 → 校验（含行号列号与失败行预览）→ 只读文本视图 → Worker 全文搜索（key / value / path、大小写、进度、可取消）→ 跳转（行 / 列 / 字符偏移、上一个 / 下一个、第 N / 总数）→ 上下文（前 N 行 / 当前行 / 后 N 行）→ 复制匹配与上下文 → 导出匹配结果（TXT / JSON / CSV）

### 2.2 不做（文档明确排除）

大文件实时编辑、全文件格式化、全文件压缩、**完整树形展开与全节点索引**、全文件 diff、全文件 Schema 校验、完整 jq、无限结果高亮、Monaco 全量编辑模型。

### 2.3 降级

现有「记录集合 → 选列 → 预览 50 行 → 导出 CSV」保留实现，但从主流程收进二级「导出」菜单，不再占主屏。

## 3. 信息架构变更

| 项 | 旧 | 新 |
|---|---|---|
| slug | `large-json-csv` | `large-json-viewer` |
| category | `convert` | `view`（新建） |
| 路径 | `/tools/convert/large-json-csv` | `/tools/view/large-json-viewer` |
| 组件 | `LargeJsonExplorer.vue` | `LargeJsonViewer.vue`（JSON 的 `component` 字段同步改为 `"LargeJsonViewer"`） |
| JSON 配置 | `app/assets/data/convert/large-json-csv.json` | `app/assets/data/view/large-json-viewer.json` |
| 分类元数据 | — | `app/assets/data/view/_meta.json`（新建） |

理由：slug 直写 `csv`、name 为 "Large JSON to CSV"、keywords 全为 `json to csv` 系词，与新实现不符，按 `copy-accuracy.md` 铁律第 1/2 条必须一致。分类放 `convert` 同样与「查看器」定位矛盾；`view` 分类在 `[slug].vue` 的 `ogAccent`（purple）与 `ogIcon`（tree）里已被代码预期，属于补齐而非新造。

**无历史包袱**：该页上线不久、未被搜索引擎收录、无外部链接（已确认），因此 slug 与分类可以一次性改到位，不需要为旧 URL 保留兼容层。

### 3.1 需要同步更新的引用

- `app/composables/useLargeFile.ts` → `LARGE_FILE_EXPLORER_PATH`
- `app/assets/data/convert/json-to-csv.json` → `recommends`
- 新 `view/large-json-viewer.json` 自身的 `recommends`
- 站内所有指向旧路径的硬编码链接（改前全仓 grep）

### 3.2 旧路径处理：不做兼容层

页面未被收录、无外部链接，直接删除旧的 `convert/large-json-csv.json` 与 `LargeJsonExplorer.vue`，旧 URL 自然 404。不配置 301、不保留迁移提示。

站内引用（§3.1）全部改为新路径后，站内不存在指向旧 URL 的链接。若日后发现确有外部引用，补一行 `routeRules` 即可，不在本次范围内。

## 4. 布局

不复用 `ResizablePanel` 整体：`.rp-panels` 硬编码 `min-height/max-height: 25rem`，撑不起视口级工作区；且 `.rp-responsive` 在移动端隐藏全屏按钮。

```
┌────────────────────────────────────────────────────────────┐
│ 工具条：文件名 · 12.4 MB · JSON │ [搜索__] [Aa] [范围▾] [↑↓] [导出▾] │  ← 常驻，全屏按钮在右
├────────────────────────────────────────────────────────────┤
│ 只读文本视口（全宽、独立滚动、虚拟滚动）                       │  ← 主视图，占大部分高度
│ 行号 │ 当前行高亮 │ 命中高亮 │ 换行开关 │ 超长行保护             │
├────────────────────────────────────────────────────────────┤  ← 可垂直拖拽 / 可折叠
│ 结果面板：#12/438 · 行 182,430 列 17 · 上下文前后 3 行           │
└────────────────────────────────────────────────────────────┘
```

仍是纵向，但性质与现状不同：**视口内固定工作区 + 各区域独立滚动**，无页面级长滚动。

移动端：结果面板默认折叠，文本视口全屏。

### 4.1 全屏按钮同步

`ResizablePanel` 的全屏行为抽成 `app/composables/useFullscreen()`：状态、ESC 提示胶囊、ESC 退出、`document.body` 滚动锁定。`ResizablePanel` 与新页面共用该 composable 与同一套按钮标记（`lucide:maximize` / `lucide:minimize`），由构造保证一致，禁止复制粘贴。

## 5. 组件结构

| 组件 | 位置 | 职责 |
|---|---|---|
| `LargeJsonViewer.vue` | `components/universal/` | 只做编排：状态机 + 布局，不含解析逻辑 |
| `LargeFileDropzone.vue` | `components/tool/` | 上传 + 格式选择 + 文件元信息（公共，供将来其他大文件页复用） |
| `LargeFileTextViewer.vue` | `components/tool/` | 只读文本视口：虚拟滚动、行号、换行开关、超长行保护、命中高亮、当前行 |
| `LargeFileSearchBar.vue` | `components/tool/` | 查询 + 范围 + 大小写 + 进度 + 取消 + 上/下一个 |
| `LargeFileResults.vue` | `components/tool/` | 虚拟列表 + 上下文 + 复制 + 导出 |

状态机：`idle → loading（读文件）→ scanning（Worker 扫描）→ ready | invalid → searching → ready`

## 6. Worker 契约改造（工作量最大）

现有 `recordStream.worker` 的 search 按「记录集合」组织，只返回 `{ recordIndex, path, preview }`，无行号 / 列号 / 偏移 / 进度，达不到文档要求。新增一条全文搜索路径，现有记录 / CSV 能力原样保留。

```
// 请求
{ id, mode: 'searchText', query, searchMode: 'key'|'value'|'path',
  caseSensitive: boolean, limit = 5000, maxMatches = 5000 }

// 进度
{ id, type: 'searchProgress', scanned, total, matches }

// 完成
{ id, type: 'searchTextResult', hits: SearchTextHit[], truncated }

SearchTextHit = { index: number, line: number, column: number,
                  offset: number, path?: string, preview: string }
```

- 行号列号由 Worker 内已有的 `buildLineOffsets` 计算
- 取消沿用现有 `terminate()`
- 加载完成时额外回传 `lineOffsets`（`Uint32Array`，transferable），供视口虚拟滚动与跳转使用；1M 行约 4MB，可接受

## 7. 文本视口要点

- 虚拟滚动，只渲染可视行
- **超长行保护**：单行超过阈值（默认 2000 字符）截断显示 + 「显示完整行」；绝不把整行塞进 DOM
- 行号槽、当前行高亮、命中高亮、换行开关
- 只读（`pre` + 覆盖层，不可编辑）
- JSON 与 NDJSON 共用同一视口（NDJSON 每行独立成行，天然适合行号与跳转）
- 点击结果 → 跳转到行并高亮，同时展开前后 3 行上下文

## 8. 结果面板要点

- 虚拟列表，每条展示 `#12/438 · 行 182,430 列 17 · 预览片段`
- 命中数超上限时明确提示「仅显示前 N 条，可导出全部」而非静默截断
- 复制匹配 / 复制上下文
- 导出：匹配结果 → TXT / JSON / CSV；全量记录 → CSV（现有流程，收在导出菜单内）

## 9. 删除 / 修正项

1. **移除上一轮加入的 Structure tree**：它用流式解析给全部节点建索引，违反文档「不建议完整树形展开 / 一次性生成完整对象树」。这是本次要主动撤回的错误。
2. **页面英文硬编码全部改为 `tool.ui.*` + i18n**：现状在 zh 站整页英文。
3. **`view/large-json-viewer.json` 全部文案按新实现重写**：name、description、meta（title/description/keywords）、features、guide、faq、article、ui，中英双语。
4. **`view/_meta.json` 中英双语内容**：title、description、keywords、h2、pdesc、highlights、faq——内容必须是真实能力，不得照抄 `format/_meta.json`。

## 10. 文案核对（铁律要求）

合并前必须按 `.claude/rules/copy-accuracy.md` 第 3 节跑完核对清单，输出「断言 | 来源 | 实现位置 | 结论」表格，重点：

- 任何提到「编辑 / 格式化 / 任意体积 / 无限制」的断言必须删除
- 体积相关表述必须与 `LARGE_FILE_MAX_BYTES`（5 MB）一致
- `en` 与 `zh` 断言集合一一对应
- 分类页 `/tools/view` 文案与其下唯一工具的实际能力一致

## 11. 分阶段

- **P1**：`view` 分类 + slug 迁移 + 重定向 + dropzone/元信息 + 只读文本视口 + 全文搜索（行/列/偏移）+ 结果列表 + 跳转 + 上下文 + 复制 → 可独立验收
- **P2**：大小写 / 范围切换 / 进度条 / 取消 + 导出匹配结果（TXT / JSON / CSV）+ 全屏 composable
- **P3**：JSONPath 复制、节点局部预览、数组分页

## 12. 验收与测试

手工矩阵：10MB 单行 / 50MB 多行 / NDJSON / 非法 JSON / 0 命中 / 超多命中 / 取消搜索 / 移动端折叠。

一次性探针脚本（同验证扫描器时的方式）：搜索返回的 `line/column/offset` 与 `indexOf` 结果交叉校验，必须一致。

性能门槛（写死，不达标不算完成）：

- 50MB 文件从选择到首屏渲染 ≤ 3s：在开发机 Chrome（M 系列 / SSD）实测并记录基线，后续以该基线做回归，不得出现「主线程被解析阻塞 > 3s」
- 搜索期间主线程无 >50ms 长任务（DevTools Performance 面板确认）
- 搜索内存不随文件线性膨胀（不建全量对象树）

## 13. 风险

| 风险 | 应对 |
|---|---|
| 新 `view` 分类只有 1 个工具，分类页显空旷 | 分类页按 1 个工具也能正常渲染（现有逻辑按 `tools.length > 0`），文案侧补充说明 |
| 日后发现旧 URL 有外部引用 | 补一行 `routeRules` 301，成本极低，本次不做 |
| 文本视口虚拟滚动 + 行号 + 超长行是全新实现，工时不可低估 | P1 先交付可滚动 + 行号 + 命中高亮，超长行截断 P2 |
| `large json to csv` 那批长尾词失去承接页 | FAQ 保留「本页也能导出 CSV」的说明，并在 `recommends` 里双向链接 `json-to-csv`，把该意图导回真正的 CSV 转换页 |
