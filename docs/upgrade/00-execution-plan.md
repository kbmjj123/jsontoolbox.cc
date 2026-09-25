# 落地页升级执行计划（Stage 0 已定案）

> 依据：`docs/upgrade/*.md`（16 份页面升级文档）+ `docs/upgrade/first-landing.md`（SERP 优先级总纲）
> 目标对象：`app/assets/data/{category}/{slug}.json` + `app/components/universal/*.vue`
> 工作方式：**一页一收口（en 校准 → 代码兑现 → zh 同步 → 审计）**，不做全站横切

---

## 执行进度（本轮已落地）

**Stage 1 止血：已完成**
- 删除 `csv-to-json` / `json-path-tester` 中重复的 `features` 键
- `JsonInputEditor.vue` `showLoadUrl` 默认 `false`，15 个组件移除 `show-load-url`（URL 白名单 = 暂不启用）
- 全站 `hero.trustHtml` 统一为 "Runs in your browser. … is not uploaded by this tool."，18 页 zh 同步
- `XmlToJson.vue` 修 `tool` 未定义；ui 键 camelCase → snake_case；补缩进/元素数量接线

**逐页收口：17 页全部完成，en/zh 已对齐（features、guide、faq、ui 键集合、article）**

| 页面 | 关键变化 |
|---|---|
| yaml-to-json | 无文档→自撰 en；`loadAll` 多文档、错误行列、minified 输出 |
| json-to-table | en 重写回"表格预览"定位；HTML 转义、ui 接线、`example-slug=tool.slug` |
| json-to-html | **新建页面** + example 文件，复用 `JsonToTable` |
| json-to-pdf | 文本渲染（Latin-1 真实文本）+ CJK 图像回退并明示；jspdf 懒加载 |
| json-to-csv | 文件上传、字段选择、分隔符/编码、表格预览、错误分类 |
| json-to-excel | **保留真实 XLSX**，en/zh 反向修订为 XLSX 口径；展平/表头/全字段收集/行数 |
| xml-to-json | ui 键统一、元素数量、错误提示 |
| json-to-xml | 数组元素名、declaration 开关、UTF-8 一致、完整转义、名称校验 |
| json-to-yaml | 缩进 ui 接线、js-yaml quoting 配置、删 URL 输入 |
| json-compare | zh article 补"常见使用场景" |
| json-minifier | UTF-8 字节/节省量、ui 接线、minify≠compression |
| json-escape | 改用 `JSON.stringify/parse`、引号与层数选项、Swap 兼容 |
| json-path-tester | 复用 `useJsonPath`、JSON Pointer/类型、三态错误、参考表只列受支持语法 |
| json-to-typescript | interface/type、optional/null、union、非法标识符 |
| json-to-code | 语言与选项收敛、错误提示、zh article 补写 |
| json-schema-generator | draft 切换、formats/examples 开关、anyOf 合并、样本提示 |
| json-editor | ui 键对齐、features 逐条指认（删 1 条无法指认的） |

**遗留 / 待决策**
- PDF 的 CJK 文本渲染需要嵌入字体（当前为图像回退）；如要纯文本需 vendor 一份子集 TTF
- JSONPath 仍是子集（无切片/并集/正则/函数），全量 RFC 9535 需新增依赖
- `json-schema-validator`、`large-json-viewer` 无升级文档，本轮未纳入
- `jsonl-viewer`、`how-to-open-json-file` 属新页面，未建

---

## 0. Stage 0 决策记录（已定）

| # | 议题 | 决策 | 直接影响 |
|---|---|---|---|
| 1 | JSON to Excel | **保留真实 XLSX 实现**，反向修订文案 | `json-to-excel.json` en 的 name/features/faq/meta 需回改为 XLSX 口径 |
| 2 | JSON to PDF | **改为文本渲染**（去掉 html2canvas 位图方案） | `JsonToPdf.vue` 重写导出；CJK 字体方案需先 spike |
| 3 | URL Input | **逐页白名单**，默认关闭 | `JsonInputEditor.vue:298` `showLoadUrl` 默认改 `false` |
| 4 | JSON to HTML | **单独建页** `/tools/convert/json-to-html` | 新建 JSON 配置 + example；与 `json-to-table` 做内容差异化 |

---

## 1. 全局前置（Stage 1 止血，先于一切）

### 1.1 数据缺陷修复
- [ ] `app/assets/data/convert/csv-to-json.json` — 删除重复的 `features` 键（保留后者，逐条核对差异）
- [ ] `app/assets/data/format/json-path-tester.json` — 同上

### 1.2 i18n 键规范与兜底
- [ ] 全站 ui 键统一 **snake_case**（现状：`xml-to-json` 用 camelCase 而组件读 snake_case，13/13 个键全部失效）
- [ ] 组件内 `tool.ui?.x || 'English'` 兜底改为不兜底或 zh 兜底（避免 zh 页漏英文）
- [ ] 缩进/按钮文案不得硬编码：已知 `JsonToYaml.vue:41-45`、`XmlToJson.vue:44-45`、`JsonToXml.vue:53`、`JsonEditor.vue:139-148`

### 1.3 URL 白名单（决策 3）
- [ ] `app/components/tool/JsonInputEditor.vue:298` — `showLoadUrl` 默认值 `true` → `false`
- [ ] 白名单：默认**全部关闭**；需要 URL 输入的页必须显式传 `show-load-url` 并在 FAQ 说明 CORS/隐私限制
- [ ] 说明：`JsonCompare.vue:241-250` 的 `?left=`/`?right=` 是**链接内携带数据**（`useUrlParams`），非远程抓取，可保留；但如页面仍渲染远程 "Load from URL" 按钮，需与 en FAQ "does not fetch remote URLs" 对齐
- [ ] zh 侧 6 个页面 features 仍在写"URL 输入"，必须清掉：`json-to-yaml`、`json-editor`、`json-escape`、`json-minifier`、`json-path-tester`、`json-schema-validator`

### 1.4 隐私话术统一
- [ ] 口径统一为 `Runs in your browser. Your JSON is not uploaded by this tool.`
- [ ] zh hero 仍为旧口径"100% 本地转换"的页面：`json-to-csv.json:179`、`json-to-excel.json:190`、`json-to-pdf.json:174`、`json-to-table.json:166`（其余页面一并扫）

### 1.5 阻塞项修复
- [ ] `app/components/universal/XmlToJson.vue:139` — script 内引用未定义的 `tool`（只有 `props`），XML 非法时报 ReferenceError，错误提示永不显示

---

## 2. 逐页收口顺序

顺序 = `first-landing.md` 流量优先级；`json-to-html` 紧随 `json-to-table`（共用组件）。

```
01 yaml-to-json        02 json-to-table        03 json-to-html（新）
04 json-to-pdf         05 json-to-csv          06 json-to-excel
07 xml-to-json         08 json-to-xml          09 json-to-yaml
10 json-compare        11 json-minifier        12 json-escape
13 json-path-tester    14 json-to-typescript   15 json-to-code
16 json-schema-generator                        17 json-editor
```

---

## 3. 逐页任务

### 01 `convert/yaml-to-json`（无升级文档，按 first-landing P1 补齐）
**en**：无文档 → 需自撰（参考 `first-landing.md` §1 + `json-to-yaml.md` 双向章节）。覆盖：nested、anchors/aliases、多文档、安全引号、双向切换、错误行号、文件输入、pretty/minified、copy/download。
**代码**（`YamlToJson.vue`）：
- [ ] `:85` `yaml.load` 只取首个文档 → 多文档需 `loadAll`（或明确文案只支持单文档）**[必须实现功能]**
- [ ] `:88-91` 错误直接用原生 message，未取 `e.mark.line/column` → 补行列定位 **[必须实现功能]**
- [ ] `:42-46` 缩进标签/选项硬编码英文，未读 `ui.option_indent*` **[纯文案]**
- [ ] `:11` `show-load-url` → 按白名单关闭 **[纯文案]**
- [ ] 输出无 minified 切换；copy/download 走 `JsonOutputPanel` 已具备 ✓
- [ ] anchors/aliases：js-yaml 默认支持，需在文案中如实表述（不承诺"忠实还原"）
**zh**：faq 8 → 对齐 en；features/guide/article 全量核对（现有 zh 对 anchors 的表述过强，需弱化）

### 02 `convert/json-to-table`（en 已被 json-to-html 文档占用，需重新定位）
**en**：当前 en name="JSON to HTML Table"，即 html 文档内容 → **需重写为表格视角**：表格预览、自动识别字段、CSV 导出、语义表格、不承诺 sort/filter/pagination/edit；主词保留 `json to table`（KD 8）。
**代码**（`JsonToTable.vue`）：
- [ ] `:149-160` `generateHtmlTable()` 模板串拼接**未做 HTML 转义** → XSS + 与"HTML Safety"文案冲突 **[必须实现功能]**
- [ ] `:57-58` `rows`/`columns` 硬编码英文 → 用 `ui.statusRows`/`statusColumns` **[纯文案]**
- [ ] `:8` 用 `label_input`，JSON 提供 `labelInputJson` → 键名统一 **[纯文案]**
- [ ] `:140` 仅校验 `Array.isArray`，未校验每项为 object → 与 `errorInvalidInput` 文案不符 **[必须实现功能]**
- [ ] `btnExample`/`errorInvalidRow`/`errorNoColumns` 未接线 **[必须实现功能]**
- [ ] `:150` `border/cellpadding` 表现属性 vs "semantic HTML" **[需确认]**
- [ ] `:12` `example-slug` 硬编码 → 改为 `tool.slug`（为 json-to-html 复用）**[必须实现功能]**
**zh**：ui 11 键已对齐需按新语义复核；features 6 / guide 4 / faq ~9 重翻；**article 缺失**需新译 1 篇

### 03 `convert/json-to-html`（新建，决策 4）
- [ ] 新建 `app/assets/data/convert/json-to-html.json`：`slug/json-to-html`、`category/convert`、`component: JsonToTable`、`icon`、`sort: 7`、`nextSteps: ['json-to-table','json-editor']`、`recommends: ['json-to-csv']`
- [ ] 新建 `app/assets/data/examples/json-to-html.json`（结构参照 `examples/json-to-table.json`：`{id,label_en,label_zh,input}`）
- [ ] en 内容 = `docs/upgrade/json-to-html.md` 的配置块（name/ui/description/hero/meta/features 6/guide 4/example/faq 11/article 全字段）
- [ ] **与 json-to-table 做差异化**：本页主打"生成可嵌入的 HTML table 代码 + 转义安全 + 复制/下载 .html"，不重复表格预览卖点（避免自竞争与重复内容）
- [ ] `json-to-table.json` 的 `nextSteps` 追加 `json-to-html`
- [ ] zh 全量新翻（含 article 1 篇）

### 04 `convert/json-to-pdf`（决策 2：改文本渲染）
**en 校准**：`json-to-pdf.json:34` meta 现写 "download a searchable PDF" → 改造成功后可保留；失败则改为 "print-ready PDF"。
**代码**（`JsonToPdf.vue`）：
- [ ] **Spike（先做）**：文本渲染 + CJK 字体方案验证，三选一
  - A. jsPDF `setFont(courier)` + `doc.text()`，纯 ASCII 正确；CJK 需 `addFileToVFS/addFont` 嵌 TTF（全量 ~10MB，需子集化或懒加载）
  - B. 换 `pdf-lib` + `@pdf-lib/fontkit`，运行时按实际字符子集嵌入（体积可控，推荐优先验证）
  - C. 混合：ASCII 走文本模式，含 CJK 时回退 html2canvas 快照并在 UI 明示"该页为图像、文本不可选中"
  - 验收标准：A4/Letter、横竖、字号、分页不裁切、CJK 不乱码、文本可在 PDF 阅读器选中搜索、导出耗时可接受
- [ ] `:203-263` 移除 `html2canvas` 依赖路径（若采用 A/B，可从 `package.json` 移除 `html2canvas`）
- [ ] `:110-111` jspdf 顶层静态 import → 改为点击导出时 `await import()`（首屏体积）**[必须实现功能]**
- [ ] `:234` 标题 `'JSON Output'` 硬编码 → 新增 ui 键 **[纯文案]**
- [ ] `btn_example`/`error_invalid_json`/`error_empty_input`/`error_pdf_generation` 未接线；导出无 try-catch 兜底 **[必须实现功能]**
- [ ] `:149-170` 分页按行高估算 → 改用 `doc.splitTextToSize` 实测宽度分页 **[必须实现功能]**
**zh**：features 6→7、guide 3→4、faq 8→11（其中"PDF 可搜索吗"必须按最终实现改写）、ui 11→13、**article 缺失**需新译 1 篇

### 05 `convert/json-to-csv`
**en**：已与文档一致，无需改。
**代码**（`JsonToCsv.vue`）：
- [ ] `:5-14` 未传 `show-upload` → features "Paste or Open JSON" 未兑现 **[必须实现功能]**
- [ ] `:126` flatten 强制开启 → `ui.option_flatten` 需做成复选框 **[必须实现功能]**
- [ ] `:130` 分隔符硬编码 `,`；`:147` 编码/BOM 硬编码 → `option_delimiter`/`option_encoding` **[必须实现功能]**
- [ ] `:129` 无字段选择 → `option_field_selection` **[必须实现功能]**
- [ ] `:19-31` 无表格预览；`preview_title`/`statusRows`/`statusColumns` 未用 **[必须实现功能]**
- [ ] `:123` 空数组未区分错误 → `error_empty_array`/`error_invalid_row`/`error_no_columns` **[必须实现功能]**
- [ ] `useExcelCompat.ts:82-86` `toGbk()` 实为 UTF-8 回退 → 删除 GBK 文案或真实现编码转换 **[需确认]**
**zh**：name/description/hero/meta 各 1、features 6→8、guide 4、faq 10→14、ui 5→13、article 整篇重写（现仍写 GBK）；zh FAQ 承诺 5MB 属超前，需与 en 对齐

### 06 `convert/json-to-excel`（决策 1：保留 XLSX → 反向修文案）
**en 校准（本页重点）**：
- [ ] `name` "JSON to CSV for Excel" → 回改为 XLSX 口径（如 `JSON to Excel Converter – Export JSON to XLSX Online`）
- [ ] `description`、`features`（"Download CSV"）、`faq`（"This page generates CSV"）、`meta.keywords`（恢复 `json to xlsx converter`，KD 16）全部改回真实能力
- [ ] 回注 `docs/upgrade/json-to-excel.md`：标注"文档前提与实现相反，已按实现反向修订"
**代码**（`JsonToExcel.vue`）：
- [ ] `:107` 表头硬编码输出 → `option_include_header` **[必须实现功能]**
- [ ] `:109,121-127` `escapeCsvField` 硬编码逗号 → `option_delimiter_*` **[必须实现功能]**
- [ ] `:103` flatten 强制 → `option_flatten` 复选框 **[必须实现功能]**
- [ ] `:19` 用 `label_output`，JSON 只有 `label_preview` → 键名统一 **[纯文案]**
- [ ] `:106` 只取首行 `Object.keys` → 应收集所有行字段 **[必须实现功能]**
- [ ] `btn_example`/`status_rows`/`placeholder_preview`/`error_*` 未接线 **[必须实现功能]**
- [ ] `:62` `xlsx` 顶层静态 import → 改为点击导出时 `await import()` **[必须实现功能]**
- [ ] `aoa_to_sheet` 不保留数字/日期类型 → 属类型保真问题，文案需如实表述或改用 `json_to_sheet` **[需确认]**
**zh**：name/description/hero/meta/article 全改；features 6→8、guide 4、faq 9→12、ui 15 键按新语义复核

### 07 `convert/xml-to-json`
**en**：已一致（ui 键为 camelCase，需按 1.2 统一为 snake_case 或改组件）。
**代码**（`XmlToJson.vue`）：
- [ ] `:8/23/42/49/58/139` camelCase → snake_case 对齐（当前 13/13 键失效）**[必须实现功能]**
- [ ] `:139` `tool` 未定义 ReferenceError **[必须实现功能]**
- [ ] `:44-45` 缩进选项硬编码 → `optionSpaces2/4` **[纯文案]**
- [ ] `statusElements` 未渲染 **[必须实现功能]**
- [ ] 错误行列仅靠 `parsererror` 拼接 → 精度需确认 **[需确认]**
- [ ] 已一致项（无需改）：attr 前缀 `@`、`#text`、重复元素转数组
**zh**：features 6→7、guide 4、faq 9→13（缺 lossless/CDATA/SOAP/Why-fails）、ui 随键名修正、article 重写（缺 namespace/CDATA/mixed content/错误排查）

### 08 `convert/json-to-xml`
**en**：已一致。
**代码**（`JsonToXml.vue`）：
- [ ] `:115` 数组 item 名硬编码 `<item>` → `option_array_item`/`placeholder_array_item` **[必须实现功能]**
- [ ] `:152` declaration 恒定输出 → `option_declaration` 开关 **[必须实现功能]**
- [ ] `:56-63` 编码下拉只改 declaration 文本，Blob 未真正转码 → 固定 UTF-8 或真转码 **[必须实现功能]**
- [ ] `:133` 只转义 `& < >` → 补 `" '`（与 FAQ 不符）**[必须实现功能]**
- [ ] `:121/:151` 非法名静默替换为 `_` → 加 `error_invalid_root`/`error_invalid_array_item` **[必须实现功能]**
- [ ] `:53` 有 "Tab" 选项但 en ui 只有 2/4 → 二选一 **[纯文案]**
**zh**：features 6→7、guide 4、faq 8→15、ui 补 3 键、article 重写（缺 attributes/encoding/SOAP/不可逆）、meta 去 `api` 词

### 09 `convert/json-to-yaml`
**en**：已一致。
**代码**（`JsonToYaml.vue`）：
- [ ] `:11` `show-load-url` → 白名单关闭（en features 已删 URL 输入，页面仍有按钮）**[必须实现功能]**
- [ ] `:41-45` 缩进硬编码英文 → `option_indent/option_indent_2/option_indent_4` **[纯文案]**
- [ ] `:96-100` `yaml.dump` 无显式 quoting → 实测 `yes/no/on/off`、date-like、`null` 是否加引号，确保"标量安全"承诺成立 **[必须实现功能]**
- [ ] `nextSteps` 建议补 YAML 校验内链（站内暂无 `/validate/yaml`，需确认）**[需确认]**
**zh**：features 7（删 URL、改 3 条 K8s/缩进）、guide 4（2 条含"2 空格是标准"）、faq 9→13、ui 5→11、article 重写（缺 quoting/YAML 1.1/round-trip/URL 安全）、meta 移除 `json转kubernetes配置` 类主词

### 10 `convert/json-compare`
**en**：已超出文档（features 9、faq 17、ui 27），无需改；核对 article 是否含 Difference Types / Best Practices 两节。
**代码**（`JsonCompare.vue`）：
- [ ] `:69/76/93/107` `show-load-url` 与 en FAQ "does not fetch remote URLs" 冲突 → 关闭 **[必须实现功能]**
- [ ] `:241-250` `?left=`/`?right=` 链接内数据（非远程抓取）→ 保留，FAQ 说明清楚 **[纯文案]**
- [ ] Ignore array order 的配对规则（重复元素、部分修改对象）行为未定义 → 需在 FAQ 写清或实现明确规则 **[需确认]**
- [ ] `RENDER_CAP=500` 与 FAQ "large JSON" 表述对齐 **[纯文案]**
- [ ] `exportResult` 导出 `.txt`，en 已写明格式，zh 待同步 **[纯文案]**
**zh**：features/guide/faq 已同步，主要核 ui 与 article

### 11 `format/json-minifier`
**en**：已一致。
**代码**（`JsonMinifier.vue`）：
- [ ] `:50-59` 只有字符数 → 加 `TextEncoder` UTF-8 bytes、节省量与百分比，接 `unit_bytes`/`unit_saved`/`label_*_size`/`label_savings` **[必须实现功能]**（注意 SSR：`TextEncoder` 仅 client）
- [ ] `:27` `empty-text` 硬编码 → `placeholder_output`；`:36` 用 `$t('system.minify')` → `btn_minify` **[纯文案]**
- [ ] `:40` 兜底 `'Beautify First'` 与"不再是前置步骤"冲突 → `'Beautify'` **[纯文案]**
- [ ] `:85-93` 错误未用 `error_empty_input`/`error_invalid_json`/`error_processing` **[纯文案]**
- [ ] `:13` `show-load-url` → 白名单关闭 **[纯文案]**
**zh**：features 6→8（删 URL、增 3）、guide 4、faq 10→13、ui 补 12 键、article 重写（现仍写"压缩"语义）；**zh name「JSON 压缩器」与 minify≠compression 冲突，需产品定名**

### 12 `format/json-escape`
**en**：已一致。
**代码**（`JsonEscape.vue`）：
- [ ] `:62-72` escape 用正则链且不处理 `\b`/`\f`/`\u`、不幂等 → 改用 `JSON.stringify` **[必须实现功能]**
- [ ] `option_include_quotes`/`option_decode_layers` 完全未实现（恒不加外层引号、无层数控制）**[必须实现功能]**
- [ ] `:77` `JSON.parse('"'+input+'"')` 假定无外层引号，Swap 后再 Unescape 必失败 → 兼容带/不带引号两种输入 **[必须实现功能]**
- [ ] `btn_copy`/`btn_download`/`status_escaped`/`status_unescaped`/`status_invalid` 未接线 **[必须实现功能]**
- [ ] `:9` placeholder 硬编码英文 **[纯文案]**
**zh**：features 8（含必须删除的 URL 输入）、guide 3→5、faq 12→15（3 处为纠错：JSONL 逐行、100MB+、URL）、ui 补 7 键、article 补 stringify/parse 与 surrogate pair 章节

### 13 `format/json-path-tester`
**en**：已一致（需删重复 `features` 键）。
**代码**（`JsonPathTester.vue`）：
- [ ] `:158-178` 自研 `getByPath` 不支持 `..`/slice/引号 bracket/filter → 复用 `app/composables/useJsonPath.ts`（已声明支持 `$ / .key / ['key'] / [n] / * / $..key / 简单 filter`，不支持 slice/union/`=~`/functions）**[必须实现功能]**
- [ ] `:186-189` 解析失败与无匹配同为 `errorNoMatches` → 拆成 `statusInvalidExpression`/`statusNoMatches` 两态 **[必须实现功能]**
- [ ] `:51-57` 结果补 JSON Pointer（RFC 6901）与 node type（`labelJsonPointer`/`labelValue` 已声明未用）**[必须实现功能]**
- [ ] `:126-145` `operators`/`filterOperators` 硬编码英文且宣称 slice/`=~`/`[?(expr)]`（实现不支持）→ 按实际方言收敛 **[必须实现功能]**
- [ ] `:45` 硬编码 `match(es)` → `statusMatches`（含 `{count}`）；`:31-35,64` `labelCommonPaths`/`btnExample` **[纯文案]**
- [ ] `btnCopyResults`/`btnCopyExpression` 缺失 **[必须实现功能]**
- [ ] en FAQ "Which JSONPath specification" 答非所问 → 按实际 evaluator 改写 **[纯文案]**
**zh**：features 7（删 URL）、guide 4→5、faq 10→15、ui 11→22、article 重写（现仍含 `$..[*]` 示例，文档要求删除）
**风险**：未装 JSONPath 库；RFC 9535 全量支持需新增依赖，建议按现有 `useJsonPath` 子集如实表述

### 14 `convert/json-to-typescript`
**en**：已一致（含条件式删除项需确认）。
**代码**（`JsonToTypescript.vue`）：
- [ ] `:40-51` 只有 interfaceName + export → 需补 interface/type、optional、null、format 四个控件；**否则删除对应 ui 键与 FAQ**（文档明确条件式删除）**[必须实现功能 或 纯文案]**
- [ ] `:105-114` `getType` 返回字面量 `'null'` 无 union；`:108-111` 只取 `value[0]` → mixed array 需合并/anyOf **[必须实现功能]**
- [ ] `:134-146` key 原样输出 → 需引号/清洗（FAQ L175-177）**[必须实现功能]**
- [ ] `errorInvalidName` 校验、`warningSampleBased` 提示条未渲染 **[需确认]**
- [ ] `:11` `show-load-url` → 白名单关闭 **[纯文案]**
**zh**：ui 8→26 键、features 6→8、guide 4→5、faq 10→17、article 重写、meta 删 `typescript类型生成器`/`在线生成ts`

### 15 `convert/json-to-code`
**en**：已一致。
**代码**（`JsonToCode.vue`）：
- [ ] `:161-265` 仅 TS 递归生成嵌套类型，其余 9 个目标遇嵌套输出 `object` 占位 → 与 FAQ "Nested Models" 冲突。文档建议先收敛到 TS/Python/Go/Rust；若收敛则 en features/meta 需同步收窄 **[必须实现功能 或 纯文案]**
- [ ] `:116-157` 无 integer/float 区分、无 nullable/union、无 optional **[必须实现功能]**
- [ ] `:40-62` 缺 export/optional/null/format/indent 五个选项 **[必须实现功能 或 删文案]**
- [ ] `:273-286` `errorInvalidInput`/`errorEmptyArray`/`errorInvalidName`/`errorUnsupported`/`errorGeneration` 未接线；`warningSampleBased` 未显示 **[纯文案]**
- [ ] `:27` `download-filename="output.txt"` 覆盖 `:298` 的语言扩展名 **[纯文案]**
- [ ] `:256-265` Protobuf field number 每次重生成从 1 递增，无稳定策略 **[需确认]**
- [ ] 与 `app/utils/codegen.ts`（`JsonGeneratePanel.vue:126` 使用）存在双实现 **[需确认]**
**zh**：**工作量最大** — features 6→8、guide 4→6、faq 9→16、ui 6→24、**article 整篇缺失需补写**、description 去"10 种语言/自动生成"

### 16 `convert/json-schema-generator`
**en**：已一致。
**代码**：
- [ ] `useSchemaGenerate.ts:45` 硬编码 `draft-07`，而 en example 输出 `draft/2020-12` → 支持 draft 切换 **[必须实现功能]**
- [ ] `useSchemaGenerate.ts:30-37` format 检测恒开 → 加 `detectFormats` 开关 **[必须实现功能]**
- [ ] `useSchemaGenerate.ts:44-55` 缺 `includeExamples` **[必须实现功能 或 删 option_examples]**
- [ ] `useSchemaGenerate.ts:14-17` 数组 items 只取 `value[0]` → mixed array 需审核/anyOf，与 FAQ 不符 **[需确认]**
- [ ] `JsonSchemaGenerator.vue:41-56` 缺 draft 下拉、formats/examples 复选框 **[必须实现功能]**
- [ ] 输出区缺 `warning_sample_based` 提示条 **[必须实现功能]**
- [ ] `btn_copy`/`btn_download`/`error_*` 未接线；`option_required`/`option_additional` 长文案被短兜底掩盖 **[纯文案]**
- [ ] ⚠️ `generateSchemaText` 被 `JsonEditor` 的 Schema 模式共用 → 改动需回归编辑器
**zh**：features 6→8、guide 3→5、faq 8→15、ui 10→21、article 大幅扩充；**zh example 有 `\\n` 双转义 bug，age 类型与 en 不一致，需修**

### 17 `format/json-editor`
**en**：已超出文档（features 16），无需改。
**代码**（`JsonEditor.vue`）：
- [ ] `:139-148` 读 `option_2_spaces`/`option_4_spaces`，en 写 `option_indent_2`/`option_indent_4`/`option_indent_minified` → 键名统一 **[纯文案]**
- [ ] `:159/168` 用 `$t('system.minify')`/`$t('system.format')` → 改 `tool.ui?.btn_*` **[纯文案]**
- [ ] `:528/559/600` 用 `t('errors.lineCol')`，未消费 `ui.status_error_at` **[纯文案]**
- [ ] `status_invalid`/`error_invalid_json`/`error_empty_input`/`placeholder_input`/`btn_validate`/`btn_example`/`btn_copy`/`btn_download`/`option_sort_keys` 组件内 grep 不到 **[需确认]**
- [ ] `:40` `show-load-url` + 分享按钮与"不做 share links/cloud save"冲突 **[需确认]**
- [ ] 16 条 features（Copy Node Path、Search & Jump、Tree Edit、Media Preview、Smart Detection、JSONPath、Array Table View…）需逐条在代码里指认 **[必须实现功能 或 删文案]**
- [ ] 已完成项：`docs/upgrade/finish/JsonEditor-toolbar分组计划.md` 已落地（`#toolbar-left`/`#toolbar-right`）✓
**zh**：guide 4→5、faq 10→13（缺 sort keys 风险 / JSON Schema / repair / JSON5-JSONC）、ui 8→20、article 核对

---

## 4. 每页收口模板（Checklist）

1. **en 校准** — 与升级文档逐字段对齐；若实现强于文档（Excel/PDF/Editor/Compare），反向修文案并回注文档
2. **ui 键接线** — 组件一律 `tool.ui?.snake_case`；组件用不到的键，从 JSON 删除（不留悬空承诺）
3. **功能兑现 or 删文案** — 二选一，禁止"文案先行、实现欠账"
4. **zh 同步** — en 全字段重翻（name/description/hero/meta/features/guide/example/faq/ui/article），按 `i18n-translation-rules.md`
5. **copy-accuracy 审计** — `features`/`guide`/`faq`/`article`/`meta`/`ui` 每条都能指到 `file:line`（数量、顺序、范围、默认值、上限必须与实现同向）
6. **构建** — `pnpm build` 通过 + 该页手工冒烟（粘贴 → 转换 → 复制/下载 → 错误态 → 切 zh 无英文漏出）

---

## 5. 风险与待确认

| 项 | 风险 | 处理 |
|---|---|---|
| PDF 文本渲染 + CJK | 字体体积、导出耗时、字形缺失 | Stage 0 决策 2 前先做 Spike（方案 A/B/C），定验收标准 |
| JSONPath 方言 | 未装库，现有实现为子集 | 按 `useJsonPath.ts` 支持范围如实表述；全量 RFC 9535 另立议题 |
| json-to-code 语言数 | 10 语言深度全靠手写 | 建议收敛 TS/Python/Go/Rust，或分两期 |
| `useSchemaGenerate` 共用 | 改 draft 会影响 JsonEditor 的 Schema 模式 | 改动后回归编辑器 |
| json-to-html 自竞争 | 与 json-to-table 关键词重叠 | 按 §03 做内容差异化；上线后观察收录 |
| xlsx / jspdf 包体 | 顶层静态 import 拖慢首屏 | 全部改为点击导出时 `await import()` |
| 覆盖缺口 | `json-schema-validator`、`large-json-viewer` 无升级文档 | 本轮不纳入；如需请补文档 |
| 未建页面 | `jsonl-viewer`、`how-to-open-json-file`（first-landing 高优先级） | 属新页面，另立议题 |
