# 新增工具落地页实操手册

> 作用：把「新增/改造一个工具落地页」所需的**代码库事实**集中在这里，避免每次重新探索。
> 适用：`app/assets/data/{category}/{slug}.json` + `app/components/universal/*.vue` 的新增或收口。
> 与 `.claude/rules/` 的关系：规则文件讲**规范**，本文讲**当前代码库的实际行为**（含既有缺陷）。冲突时以实现为准。

---

## 1. 注册机制：改哪些文件

### 必做（2 个文件）

| # | 文件 | 说明 |
|---|---|---|
| 1 | `app/assets/data/{category}/{slug}.json` | 工具定义。文件名必须等于 `slug` |
| 2 | `app/components/universal/{ComponentName}.vue` | 组件。文件名小写全等匹配 JSON 的 `component` 字段 |

匹配逻辑在 `app/pages/tools/[category]/[slug].vue:66-106`：把 `component` 小写后，剥掉 `universal` 前缀，与 `components/universal/*.vue` 文件名小写全等比较。**匹配失败只在浏览器 console 打 `[Loader] 404`，构建期不报错**，页面显示 "Tool component not found."

所以 `component: "TxtToJson"` → 必须有 `app/components/universal/TxtToJson.vue`。

### 自动生成（不用改）

- 路由：纯 `[category]/[slug].vue` 动态路由，无工具清单文件
- `/tools` 全站网格：`app/pages/tools/index.vue:28-59`
- `/tools/{category}` 分类页：`app/pages/tools/[category]/index.vue:16-37`
- 页脚：`app/components/app/Footer.vue:50-71`（每类只取 `sort` 升序前 5 个）
- 首页搜索弹窗（⌘K）：`app/components/home/ToolSelectorModal.vue:61`
- sitemap：`server/api/sitemap-urls.ts:22-42` + `nuxt.config.ts:72-80`
- `llms.txt` / `llms-full.txt`：`server/routes/llms.txt.ts:16-26`
- canonical / OG image / FAQ schema：`app/pages/tools/[category]/[slug].vue:112-192`、`app/app.vue:11-16`

### 手工要改（不改就不出现）

| 位置 | 不改的后果 |
|---|---|
| `app/composables/useTools.ts:5-51` `FEATURED_CONFIG` | **不上首页**（`app/pages/index.vue:77-98` 只渲染 `featuredTools`） |
| 上游工具 JSON 的 `nextSteps` / `recommends` | 没有入口内链 |
| `app/assets/data/examples/{slug}.json` | `JsonInputEditor` 的示例下拉为空 |

---

## 2. 工具 JSON 字段结构

### 顶层（语言无关）

`slug` / `category` / `component` / `icon` / `sort` / `applicationCategory` / `nextSteps[]` / `recommends[]` / `en` / `zh`

- `component` **必填**，缺失直接 Null
- `slug` / `category` 缺失时由 `useTools.ts:91-92` 用文件名、目录名兜底
- `sort` 只影响页脚前 5 与网格顺序；`applicationCategory` **无任何代码读取**
- `nextSteps` / `recommends` 填**纯 slug**（不带 category），由 `getToolBySingleSlug`（`useTools.ts:179-184`）跨分类查找。**只能填真实存在的 slug**，否则变死链

### 语言层：`en` / `zh`

⚠️ 两套命名别写反：

| 位置 | 键名 |
|---|---|
| `app/assets/data/**/*.json` | **`en` / `zh`** |
| `i18n/locales/` 文件名 | `en.json` / `zh-CN.json`（但 i18n 内部 locale code 仍是 `zh`，见 `nuxt.config.ts:130-134`） |

写反不会报错，只会**整块静默为空**。

字段清单与渲染位置：

| 字段 | 渲染者 | 备注 |
|---|---|---|
| `name` / `description` | `[slug].vue:13,16`（H1 + 描述） | |
| `hero.trustHtml` | **无人渲染**（死字段） | 全站 18 页都写了但 `grep trustHtml` 在 `app/` 零命中。隐私文案实际来自 `<PrivacyNotice />` → `$t('privacy_notice.*')` |
| `meta.title` / `meta.description` | `[slug].vue:112-115` `useSeoMeta` | ✅生效 |
| `meta.keywords` | **不进 HTML** | 只服务于 `seo-workflow.md` ⑤-bis 的覆盖自检 |
| `ui.*` | 各 universal 组件 `props.tool.ui?.xxx` | 见 §4 |
| `features[]` | `ToolSeoContent.vue:4-9` → `ToolFeatures.vue` | `{icon,title,description}` |
| `guide[]` | `ToolSeoContent.vue:12-17` → `ToolGuide.vue` | `{title,description}` |
| `example` | `ToolSeoContent.vue:20-54`（内联，无子组件） | 见 §3 |
| `faq[]` | `ToolSeoContent.vue:84-89` → `ToolFaq.vue` | `{question,answer}` |
| `article` | `ToolSeoContent.vue:57-72`，**`v-html`，无 sanitize** | 实为对象 `{title,content}`（`index.d.ts:71-74` 声明成数组，是错的） |

区块顺序固定：Features → How to Use → Example → Article（含末尾内链）→ Related Tools → FAQ。

---

## 3. `example` 必须用形状 B

渲染只读这 9 个键：`title` / `description` / `inputLabel` / `input` / `inputExplanation` / `outputLabel` / `output` / `outputExplanation` / `note`。

- **缺 `title` 会渲染出一个空 `<h2>`**（`ToolSeoContent.vue:22`），现有 `csv-to-json.json:122` 就是这个缺陷
- `useCase` / `expression` / `schema` / `inputLeft` / `inputRight` **不显示**
- 形状 A（只有 `input/output/useCase`）是 convert 分类的历史遗留，新页面一律用形状 B
- 规范范例：`app/assets/data/format/json-minifier.json`

另有一套**交互式示例**，与静态 `example` 无关：`JsonInputEditor` 的 `example-slug` prop → `app/assets/data/examples/{slug}.json`，结构 `[{id, label_en, label_zh, input, input2?}]`（`useToolExample.ts:6-12`，按文件名索引）。

---

## 4. `ui.*` 文案接线规范

### 写法

```ts
// 推荐（JsonToTable.vue:107）
const ui = computed<Record<string, string>>(() => props.tool?.ui ?? {})
```

```vue
<!-- 或 CsvToJson.vue 风格 -->
{{ props.tool.ui?.label_input }}
```

❌ **禁止** `tool.ui?.x || 'English fallback'` —— zh 页会漏英文。`XmlToJson.vue:8,23,26` 是现存反例。
✅ 数字兜底可以（语言无关），如 `CsvToJson.vue:325` 的 `${shown} / ${total}`。

键名一律 **snake_case**。`{key}` 占位符填充参考 `JsonToTable.vue:132-135` 的 `fill()`。

### 组件用不到的键必须删掉

`ui` 里留悬空键 = 文案承诺了不存在的控件，违反 copy-accuracy。收口时逐个判定「接线 / 删除」。

### en/zh 键集合必须严格一一对应

`csv-to-json.json` 是范本：en 28 键 ↔ zh 28 键。可用脚本自检：

```bash
node -e "const d=require('./app/assets/data/convert/<slug>.json');const a=Object.keys(d.en.ui),b=Object.keys(d.zh.ui);console.log('missing',a.filter(k=>!b.includes(k)),'extra',b.filter(k=>!a.includes(k)))"
```

---

## 5. 可复用资产清单

### 共享组件（`app/components/tool/`）

| 组件 | 用途 | 关键 props |
|---|---|---|
| `ResizablePanel.vue` | 布局外壳 | `initial-ratio`、`responsive`、`v-model:fullscreen`；slots: `first`/`second`/`toolbar-left`/`toolbar-right`/`below` |
| `JsonInputEditor.vue` | 输入 + 上传 + 示例 + 粘贴 | `modelValue`/`label`/`placeholder`/`accept`/`show-upload`/`example-slug`/`tool`；emits: `clear`/`example-loaded`/`file-size` |
| `JsonOutputPanel.vue` | 输出 + 复制 + 下载 + rich/table 视图 | `content`/`parsed-data`/`error`/`highlight`/`empty-text`/`download-filename`；slots: `actions`/`footer` |
| `ToolPanelBar.vue` | 面板内 sticky 工具条 | `sticky` |
| `PrivacyNotice.vue` | 隐私声明 | 页面已自动渲染，**组件内不要重复加** |

没有 `Select`/`Toggle`/`CopyButton`/`StatsBar` 之类的小组件 —— 选项控件一律在各 universal 内内联写 `<select>` + `<input type="checkbox">`。

`JsonOutputPanel` 的 copy/download 按钮已走 i18n（`system.copy` / `system.download`）。若要用 `tool.ui.btn_copy` 自定义，需 `:show-copy="false" :show-download="false"` + `#actions` 插槽（`JsonEscape.vue:20-47` 是范例）。**默认直接用内置按钮，就不要在 JSON 里留 `btn_copy`/`btn_download`。**

### 统计条样式

`.stat-chip`（`app/assets/css/tailwind.css:69-71`），用法见 `JsonToTable.vue:77-81`。

### 常用 composable / util

| 名称 | 位置 | 用途 |
|---|---|---|
| `useToast()` | `app/composables/useToast.ts:26` | `success/error/info/warning` |
| `useJsonInbox().consumeInbox()` | `app/composables/useJsonInbox.ts:22` | 首页工具选择器传入的待处理文本，每个 universal 在 `onMounted` 消费 |
| `useToolExample(slug)` | `app/composables/useToolExample.ts:26` | 示例列表 |
| `copyToClipboard` / `downloadFile` | `app/utils/index.ts:20,41` | 剪贴板 / 下载 |
| `useClipboard()` | `app/composables/useClipboard.ts:8` | 带 copied 状态 + 编码下载 |
| `useExcelCompat()` | `app/composables/useExcelCompat.ts:51` | `generateCsv` / `addUtf8Bom` / `prepareForExcel` |
| ~~`toGbk()`~~ | `useExcelCompat.ts:87` | 已废弃，实为 UTF-8 回退，**任何页面不得当作 GBK 输出** |
| `useDebounceFn` | `@vueuse/core` | 静默自动转换 |
| `~/utils/csv.ts` | `app/utils/csv.ts` | `parseCsv` / `detectDelimiter` / `countOutsideQuotes` / `splitHeaderRow` / `convertValue` |

### 通用代码骨架（照抄）

```ts
const ui = computed<Record<string, string>>(() => props.tool?.ui ?? {})
const outputJson = ref(''); const parsedOutputData = ref<unknown>(null); const error = ref('')
const indent = ref(2); const fullscreen = ref(false)

// 输入时静默转换，点按钮才提示 —— 全项目约定
const convert = (silent = false) => { /* ...; if (!silent) toast.success(t('toast.converted')) */ }
const debouncedConvert = useDebounceFn(() => convert(true), 300)
watch(input, () => debouncedConvert())
// 缩进只影响格式化，不重新解析（CsvToJson.vue:397-402）
watch(indent, () => { if (parsedOutputData.value !== null) outputJson.value = JSON.stringify(parsedOutputData.value, null, indent.value) })

onMounted(() => {                                  // inbox 优先
  const text = useJsonInbox().consumeInbox()
  if (text != null) { input.value = text; inboxApplied.value = true }
})
onMounted(() => { if (!inboxApplied.value) inputEditorRef.value?.loadDefaultExample() })
```

---

## 6. 已知缺陷（新增页面会同步命中，别当 bug 修）

| # | 缺陷 | 位置 | 影响 |
|---|---|---|---|
| 1 | `hero.trustHtml` 不渲染 | 无消费方 | 写了不显示，只作全站口径统一 |
| 2 | Related Tools 卡片区恒空 | `ToolSeoContent.vue:75-81` 传 `next-steps`/`recommends`，但 `ToolRelated.vue:27-30` 只声明 `tools` | `nextSteps`/`recommends` **只在 `ToolSeoContent.vue:101-107` 渲染成正文下方内链** |
| 3 | `meta.keywords` 不进 `<meta>` | `[slug].vue:112-115` 只传 title/description | 只用于 SEO 自检 |
| 4 | FAQ 拿不到富摘要 | `[slug].vue:178-192` 只 `defineQuestion`，无人声明 `FAQPage` | 产出孤儿 Question 节点 |
| 5 | sitemap 混入 `/tools/examples/*` | `server/api/sitemap-urls.ts:23-30` 未排除 `examples/`（`server/utils/tools.ts:65` 有排除） | en-US sitemap 多 18 条幽灵 URL |
| 6 | `JsonOutputPanel` 视图切换按钮硬编码英文 | `:17,23,31` `Rich`/`Text`/`Table` | 用 `show-view-toggle=false` 或接受 |
| 7 | 缺 `_meta.json` 的分类不显示 | `useTools.ts:66-75,124-145` | 新增目录必须配 `_meta.json` |

---

## 7. Ship Gate：copy ↔ 实现审计

由 `.claude/rules/copy-accuracy.md` §5 强制触发（新增/重写工具页、改 `features`/`guide`/`faq`/`article`/`meta`/`hero`/`ui`、改 universal 可观测行为）。输出表格：

| 文案断言 | 来源（文件:行） | 实现位置（文件:行） | 结论 |
|---|---|---|---|

必查 9 项：收集双语文案 → 拆原子断言 → 找实现 → 核方向（数量/顺序/范围/默认值/上限）→ 核双语 → 核键名（`zh` vs `zh-CN`）→ 核兜底（`?? 'English'`）→ 反问测试（是否会静默降级）→ 记录未修正项。

自动化扫描（无 lint/test/CI，全靠手动）：

```bash
# 组件内英文硬编码
grep -n "'[A-Z][a-z]" app/components/universal/<Component>.vue | grep -v "import\|from\|const \|ref(\|computed\|Icon\|lucide:"
# 英文兜底（应为 0）
grep -nE "ui\?\.[a-z_]+ *\|\| *'" app/components/universal/<Component>.vue
```

构建与产物验证：

```bash
pnpm build
ls .output/public/tools/{category}/{slug}.html
ls .output/public/zh/tools/{category}/{slug}.html
grep -c "Tool component not found" .output/public/tools/{category}/{slug}.html   # 应为 0
grep -o '<h2[^>]*>[^<]*</h2>' .output/public/tools/{category}/{slug}.html        # 无空 <h2>
grep -c "{slug}" .output/public/__sitemap__/en-US.xml
```

⚠️ 无 `lint` / `typecheck` / `test` 脚本，无 CI（`package.json:6-13` 只有 6 条 script）。`npx nuxi typecheck` 可手动跑（`vue-tsc` 未装，覆盖有限）。

---

## 8. 已落地实例

### 8.1 TXT to JSON（2026-09-28）

### 决策

| 议题 | 结论 |
|---|---|
| URL | `/tools/convert/txt-to-json`。文档 `docs/upgrade/txt-to-json.md` 建议的扁平 `/tools/txt-to-json` 与 `[category]/[slug].vue` 路由不兼容 |
| CSV parser | 抽到 `app/utils/csv.ts`，`CsvToJson.vue` 改为 import，行为零变更 |
| 模式范围 | 3 种：lines / key-value / delimited。indented-nested 不实现，FAQ 明说不支持 |
| 类型推断 | 复用 `convertValue`，默认关闭 |

### 新增/改动文件

```
新建  app/utils/csv.ts
新建  app/components/universal/TxtToJson.vue
新建  app/assets/data/convert/txt-to-json.json
新建  app/assets/data/examples/txt-to-json.json
改    app/components/universal/CsvToJson.vue        （抽函数）
改    app/composables/useTools.ts:5-51              （FEATURED_CONFIG）
改    app/assets/data/convert/csv-to-json.json      （recommends 回填）
改    app/assets/data/convert/json-to-csv.json      （recommends 回填）
```

### 三种模式的实现边界（文案必须与之一致）

| 模式 | 规则 |
|---|---|
| **lines → array** | 按输入顺序；`skip_empty` 跳空行（默认开）；`unique` 稳定去重，**保留首次出现位置**；0 行 → 阻断 |
| **key-value → object** | `:` 或 `=`；**只在第一个分隔符处切**（`url: https://example.com/a:b` 保住完整 URL）；无分隔符/空 key 的行**跳过并计数警告**（不阻断）；重复 key **warn + keep last**，键位置保持首次出现 |
| **delimited → objects** | `parseCsv` 真 CSV 解析（quoted fields、`""` 转义、引号内换行）；分隔符 auto / `,` / `;` / `\t` / `\|`；无表头时列名 **`column_1` 起**（不是 column_0）；列数不一致 **只警告不阻断**（缺值 `''`，多余值忽略）；空行由 `parseCsv` 内部丢弃 → **该模式不显示 `skip_empty`** |

`PREVIEW_ROW_LIMIT = 10`，预览只查看，复制/下载始终全量。

### 草稿文案里必须改写的断言（已改）

| 草稿原文 | 问题 | 已改为 |
|---|---|---|
| "column0, column1, or field_1" | 与实现不符 | `column_1, column_2…`（1 起） |
| "can support … when those options are implemented" | 已实现却 hedge | 肯定句 |
| "Quoted-field support depends on the selected parser" | 含糊 | 肯定：delimited 支持引号内含分隔符/换行 |
| "null-like values" | 实现不认 `NULL` | 写死：仅全小写 `true`/`false` + `-?\d+` / `-?\d+\.\d+`；`NULL`/`TRUE`/`1e5`/`.5`/`+5` 保持字符串；`null` 只由空值+开关产生 |
| 重复 key "should warn … document whether…" | 未定 | 事实：warn + keep last，键位置保持首次出现 |
| "a separate JSONL output mode can…" | 未实现 | 明说无 JSONL 输出 |
| article "Indented hierarchy" `<li>` | 3 模式不含 | 整条删除 |
| article "should show warnings / should document" | 理想态 | 改事实陈述 |
| "The tool can process line lists…" | 悬空措辞 | "Provides three parsing modes" |
| guide 只说 "Click Convert to JSON" | 与静默自动转换不符 | 补「输入时自动更新」 |
| 预览无上限说明 | 不一致 | 统一「前 10 行 / 前 10 条 / 前 10 行数据」 |

### 状态

- ui 键终稿 **44 键**，en/zh 一一对应
- features 9 / guide 5 / faq 20，en/zh 对齐
- `example` 用形状 B，`outputExplanation` 声明 number 需开启类型推断（默认 30 是字符串）
- 英文页已预渲染通过（无 "Tool component not found"、无空 `<h2>`）；zh 页与 sitemap 待构建完成确认

### 8.2 JSON to Text（2026-09-28）

- 文档 `docs/upgrade/json-to-txt.md`，实际 URL `/tools/convert/json-to-text`（文档写的 `/tools/json-to-text` 同样不兼容路由）
- 5 种输出模式：flatten / key-value / values / keys-paths / JSON Lines
- **ASCII tree 与 readable outline 属文档第二版且无输出规范 → 不实现**，删除 `option_ascii_tree` / `option_readable`，并新增 FAQ 明说没有该视图
- 数组开关（`option_array_mode`）只作用于**文档内部**的数组；根文档永远逐层展开，否则会产出空路径行
- 空容器默认跳过，开启后输出 `{}` / `[]`；`formatLeaf` 必须显式处理这两种值，否则 `String({})` 会输出 `[object Object]`
- 与 txt-to-json 互为反向工具，两边 `nextSteps` 互相回填

### 8.3 JSONC to JSON（2026-09-28）

- 文档 `docs/upgrade/jsonc-to-json.md`，URL `/tools/convert/jsonc-to-json`
- 核心：注释剥离用**逐字符状态机**（`stripJsonc`），绝不用正则——否则会破坏 `"https://example.com/a//b"`
- JSON5 模式属第二版 → 删除 `label_mode` / `option_jsonc` / `option_json5` / `option_strict_json` / `warning_json5_feature`，FAQ 明说「本页不解析 JSON5」
- 尾随逗号 vs 非法逗号要区分：`}`/`]` 前的逗号删除并计数；前面无值的逗号（如 `[,1]`）报 `error_invalid_trailing_comma`，不猜结构
- 开关关闭 → 语法留在输出里 → `skipped > 0` → 报 `error_invalid_json`（而非静默成功）
- 错误带行号列号：tokenizer 错误用 `lineColumn(index)`，JSON.parse 错误用 `useJsonParser().getErrorLocation()`（注意它要的是**原始** message，不是清洗过的）
- 依赖里已有 `jsonrepair`，但它会顺带修复 JSON5 风格语法，与「不支持 JSON5」的文案冲突，故未采用

### 8.4 HTML to JSON（2026-09-28）

- 文档 `docs/upgrade/html-to-json.md`，URL `/tools/convert/html-to-json`
- 首版只做 **HTML Table → JSON**；DOM Tree 模式属第二版 → 删除 `label_mode` / `option_table` / `option_dom_tree`，FAQ 明说没有该模式
- 未实现的第二版项：`option_all_tables`（提取所有表）、`option_preserve_html`、`option_include_attributes`、colspan/rowspan 网格展开
- 解析用 `DOMParser`（仅客户端；SSR 时输入为空不会触发，无需额外守卫），两个坑：
  - `table.querySelectorAll('tr')` 会把**嵌套 table** 的行也算进来 → 必须 `.filter(tr => tr.closest('table') === table)`
  - 取单元格用 `row.children` 过滤 th/td，不要用 `row.querySelectorAll('th,td')`（同样会穿透嵌套表）
- 表头行参与「列数不一致」判定：`headerRow.length !== columnCount` 也要报 `error_inconsistent_cells`，否则表头比数据行少列时只会静默生成 `column_N`
- 列名生成用 `column_1`（与 csv-to-json 一致），文档草稿写的是 `column1`，已按站内统一口径改
- 重复表头加数字后缀（`Name_2`）、空表头回落 `column_N`，两者共用一个 warning

### 8.5 JSON Parse and Stringify（2026-09-28）

- 文档 `docs/upgrade/json-stringify.md`。文档推荐 URL `/tools/json-parse-stringify`（首期双模式页面，后续再按 GSC 拆成 json-parse / json-stringify 两页）→ 实际 `/tools/convert/json-parse-stringify`
- 与站内已有 `json-escape` 的分工（文档给的边界表，必须守住）：
  | 页面 | 行为 |
  |---|---|
  | 本页 | JSON 文本 ↔ JSON 值（parse / stringify） |
  | json-escape | 字符串内部的转义序列 |
  | json-to-text | 面向阅读的文本提取 |
- 未实现（文档第二版）→ 删除 `option_escape_unicode` / `option_escape_slash`，并新增 FAQ 明说「不转义非 ASCII 与正斜杠」
- `error_stringify_failed` 删掉了：输入先过 `JSON.parse`，之后 `JSON.stringify` 不可能抛错，留着就是死键
- 结果类型值（object / array / string…）**不能**直接输出 JS 的 `typeof` 字符串，zh 页会漏英文 → 加 `type_object`/`type_array`/`type_string`/`type_number`/`type_boolean`/`type_null` 六个键做映射
- auto-detect 的判定写死在 FAQ 里：解析一次 → 结果是字符串且以 `{`/`[` 开头且能再解析 → 只解一层；否则该字符串就是目标值

### 8.6 JSON to TOON（2026-09-28）

- 文档 `docs/upgrade/json-to-toon.md`，URL `/tools/convert/json-to-toon`
- **这页不能凭记忆编格式**。实现前先读规范 `https://raw.githubusercontent.com/toon-format/spec/main/SPEC.md`（v4.1），编解码器落在 `app/utils/toon.ts`
- 实现子集（FAQ 里逐条列明）：对象/嵌套对象、基本类型数组内联形式、统一对象数组表格形式、非统一数组列表形式、空数组 `key: []`、空对象 `key:`、根基本类型/根对象/根数组、逗号/制表符/竖线分隔符
- 未实现（FAQ 明说）：键式表格根形式 `[N:]{...}`、嵌套字段组 `field{sub1,sub2}`、键折叠、路径展开
- **必须有 round-trip 测试**：`node --experimental-strip-types` 可直接跑 `.ts`（类型会被剥离）。52 个用例覆盖 17 个规范原文示例 + 3 种分隔符 + 往返一致 + 4 类畸形输入必须报错
- 解码器会校验声明的数组长度与实际行/条目数一致，不一致就报错（不静默接受）
- token 估算用 `ceil(chars / 4)`，**两侧同公式**，并在 UI 与 FAQ 明说「不是模型分词器计数」——文档明确禁止写死「省 30%–60%」
- 对比基准永远是**压缩 JSON**，不是带缩进的 JSON

### 后续可做（本文档不覆盖）

- 上游回填：`json-escape`、`large-json-viewer`
- 文档提到的 `jsonl-viewer`、`json-prompt-generator`、`json-diff` 站内不存在，**不要引用**
- 文档其他位置还提到 `json-to-text`、`jsonc-to-json`，现已存在，可以正常引用
- 独立议题（跨页横切，勿夹带）：修 `ToolRelated` props、修 FAQPage、修 sitemap 排除 `examples/`
