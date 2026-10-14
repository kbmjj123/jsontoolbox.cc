# 内容页（博客）第二批清单

> 生成日期：2026-10-15
> 上游：`docs/content-backlog.md`（调研清单）、`docs/left-pages/summary.md`、`docs/upgrade/finish/semrush-summary.md`
> 本文 = **已发布文章核对结果** + **本轮 SERP 检索结论** + **后续可写文章清单**
> 排期依据含 SERP 定性判断；**搜索量 / KD 数字不进文章正文**（copy-accuracy 硬约束，见 `content-backlog.md` §0）

---

## 0. 现状核对

### 0.1 已发布文章（14 篇 EN / 5 篇 ZH）

| # | slug | date | promo | ZH |
|---|---|---|---|---|
| 1 | `what-is-json` | 2026-08-23 | `json-editor` | ✅ |
| 2 | `json-parse-error-debug` | 2026-08-24 | `json-editor` | ✅ |
| 3 | `json-best-practices` | 2026-08-25 | `json-editor` | ✅ |
| 4 | `json-validation-syntax-vs-schema` | 2026-09-03 | `json-schema-validator` | ✅ |
| 5 | `free-realistic-json-test-data` | 2026-09-08 | `json-editor` | ✅ |
| 6 | `json-comments` | 2026-09-29 | `jsonc-to-json` | ❌ |
| 7 | `json-vs-toon` | 2026-09-29 | `json-to-toon` | ❌ |
| 8 | `json-vs-yaml` | 2026-09-29 | `json-to-yaml` | ❌ |
| 9 | `read-json-file-python` | 2026-09-29 | `json-editor` | ❌ |
| 10 | `how-to-create-json-file` | 2026-09-30 | `json-editor` | ❌ |
| 11 | `how-to-create-manifest-json` | 2026-10-01 | `json-editor` | ❌ |
| 12 | `unexpected-end-of-json-input` | 2026-10-04 | `json-repair` | ❌ |
| 13 | `json-vs-jsonl` | 2026-10-13 | `jsonl-to-json` | ❌ |
| 14 | `how-to-open-json-file` | 2026-10-13 | `json-editor` | ❌ |

### 0.2 对 `content-backlog.md` 的覆盖率

| backlog 条目 | 状态 | 落点 |
|---|---|---|
| §1.1 JSON 注释 | ✅ 完成 | `json-comments` |
| §1.2 如何创建 JSON 文件 | ✅ 完成 | `how-to-create-json-file`、`how-to-create-manifest-json` |
| §1.3 JSON vs JSONL | ✅ 完成 | `json-vs-jsonl` |
| §1.4 JSON vs TOON | ✅ 完成 | `json-vs-toon` |
| §2.1 打开/查看/编辑 JSON | ✅ 完成 | `how-to-open-json-file` |
| §2.2 Unexpected end of JSON input | ✅ 完成 | `unexpected-end-of-json-input` |
| §2.3 JSON vs YAML | ✅ 完成 | `json-vs-yaml` |
| §2.4 Python 读写 JSON | ✅ 完成 | `read-json-file-python` |
| §3 第三梯队（7 条） | ❌ **全部未做** | 见 §2 的 E / F / K / L / Q |
| §4 JSONL 系列（6 条） | ⚠️ 仅 1/6 | `json-vs-jsonl` 已做，其余见 §2 的 A / H / O |

**结论：第一、二梯队已 100% 消化。后续排期只剩第三梯队 + JSONL 系列 + 本轮 SERP 新发现的主题。**

### 0.3 核对中发现的遗留问题（建议先修，非新增内容）

| 级别 | 问题 | 位置 |
|---|---|---|
| 🔴 阻断 | `locales` 写了 `'zh'` / `"zh"`，应为 **`"zh-CN"`** | `content/en/blog/free-realistic-json-test-data.md:10`（`["en", 'zh']`）、`content/zh/blog/free-realistic-json-test-data.md:10`（`["zh"]`） |
| 🟡 建议 | 9 篇 EN 文章 `locales: ["en"]`，未与 zh 侧互链 | 上表 #6–#14 |
| 🟡 建议 | `content-backlog.md` §5「当前尚不存在的工具」已**全部过期** | 见下 |
| 🟢 记录 | `docs/blog/` 下有 8 份写稿工作稿，可复用为 ZH 翻译母本 | `docs/blog/` |

**§5 过期项核对（现已全部落地，可放心内链）：**

| backlog 说未建 | 实际 | 证据 |
|---|---|---|
| `json-array-generator` | ✅ 已建 | `app/assets/data/convert/json-array-generator.json` |
| `jsonl` 相关 | ✅ 已建 | `app/assets/data/convert/jsonl-to-json.json`、`json-to-jsonl.json` |
| `json-repair` | ✅ 已建 | `app/assets/data/format/json-repair.json` |
| `excel-to-json` | ✅ 已建 | `app/assets/data/convert/excel-to-json.json` |

→ `content-backlog.md` §5 整节应标记为「已全部落地」。

---

## 1. 本轮 SERP 检索结论

### 1.1 方法

对候选主题逐个跑英文 SERP（每次 8–10 条结果），观察三件事：
1. **结果类型构成**：是教程/文档占坑，还是清一色工具页（工具页多 = 教程内容空缺）
2. **权威站占位**：官方文档、MDN、RFC、Stack Overflow、云厂商是否在首页
3. **同行同质度**：竞品是否在写一模一样的通用对比文（同质 = 必须差异化，否则无意义）

### 1.2 关键发现（按机会大小排序）

| 主题 | SERP 构成 | 判断 |
|---|---|---|
| **JSON escape / unescape** | 结果 100% 是工具页（`unescapejson.com`、`jsonescape.com`、`jsonlint.com/json-stringify`、`lambdatest`、`wtools`、`onlinejsontools`），**几乎无教程内容** | 🟢 **强机会**——有工具、无解释，正好是本站能补的空档 |
| **JSON → CSV（嵌套展平）** | 清一色转换器（`json-to-csv.utils.com`、`retool`、`becsv`、`jsonflatten`、`jsoncsvonline`）；教程只在中文站（CSDN、文心快码） | 🟢 **强机会**——英文侧教程缺位 |
| **JSON → TypeScript** | 全工具页（`jsonts.com`、`jsontotypes`、`jsonblitz.dev`、`lambdatest`） | 🟢 机会 |
| **JSON → Excel** | 全工具页（`jsontoexcel.pro`、`jsonlint.com/json-to-excel`、`json2excel`、`jsontoexcel.org`） | 🟢 机会 |
| **JSONPath** | 权威占位明确：**RFC 9535**（rfc-editor.org）、Redis 文档、howtodoinjava、Go pkg.go.dev；缺"面向使用者的中层教程" | 🟢 机会，但**必须锚定 RFC 9535**，否则打不过权威源 |
| **What is JSONL** | 已有垂直小站占位：`jsonlkit.com`（含 /jsonl-specification、/jsonl-faq）、`jsonl.help`、`whatthisfile.com`、`powerdrill.ai` | 🟡 有专门玩家，**靠工具 + 可验证细节取胜** |
| **JSON merge 多文件** | 工具页极少（`merge-json-files.com`），多为 CLI/库（`jsonmerge` PyPI、`aux4/json`、Stack Overflow） | 🟡 中等，意图偏"怎么做" |
| **JSON 大数精度 / BigInt** | 英文结果稀薄，**中文内容密集**（腾讯云、CSDN、OSCHINA、php.cn） | 🟡 英文侧有缺口，但需自证需求 |
| **JSON UTF-8 / BOM 报错** | 英文弱，中文密集（51CTO、CSDN、文心快码）；`php.net/json_last_error` 占位 | 🟡 与 `json-repair` 强相关，可做长尾 |
| **Mock JSON from schema** | 已有 `jrji.com`、`jsontools.deckend.io`、`mock-data.utils.com` 占位 | 🟡 中等 |
| **jq / 命令行美化 JSON** | `shapeshed.com/jq-json`（2016 老文）、DigitalOcean Python 篇、大量中文站 | 🟡 中等，老文好打 |
| **JSON vs XML** | **AWS 排第 1**；其余 9 条全是同行工具站的同质对比页（jsonvalidators、jsonkithub、jsonkit、datatoolkit、tryutilix、devessentials、thedevtools、codetidy、jsondevtools） | 🔴 **红海 + 同质**——通用对比文已泛滥，必须靠"转换实现细节"差异化 |
| **PHP json_decode** | `php.net` 官方手册第 1，其余为 CSDN / php.cn / 腾讯云 | 🔴 官方手册占死，转化差 |
| **package.json 字段** | Node.js 官方文档 + npm 文档 + 中文博客 | 🔴 官方占死，且非本站核心 |

### 1.3 三条全局结论

1. **"有工具、没解释"是本站最大的空档。** escape、json-to-csv、json-to-typescript、json-to-excel 四条 SERP 结果全是工具页，说明用户搜这些词时拿到的全是"按钮"，没人告诉他规则是什么（哪些字符必须转义、嵌套如何决定列名、数组如何推断类型）。这是本站唯一能靠"工具 + 规则解释"同时吃下的位置。
2. **通用对比文已经泛滥。** `json vs xml` 的 SERP 里 9 条是同行工具站写的同一篇文章。再写一遍通用对比没有价值——只有把"转换时会丢失什么"讲透才有差异化。
3. **官方文档占死的词不要硬碰。** php.net、nodejs.org、RFC 9535 这类源在首页时，本站只能做"官方不讲的那部分"（实操坑、报错排查、与本站工具联动），不能做"完整参考手册"。

---

## 2. 后续文章清单

### P0 — 优先写（4 篇）

---

#### A. `what-is-jsonl`

- **标题**：What Is JSONL? The JSON Lines Format, Explained
- **承接词簇**：`what is jsonl` / `jsonl format` / `jsonl file` / `.jsonl` / `ndjson vs jsonl` / `json lines format`
- **来源**：`content-backlog.md` §4 第 1 条；工具已落地，阻塞已解除
- **SERP 判断**：有 `jsonlkit.com`、`jsonl.help` 等垂直小站占位，但它们只做"解释"，**没有可交互工具**。本站 `jsonl-to-json` / `json-to-jsonl` 已上线，可做到"解释 + 立刻验证"
- **差异化要点（必须写到）**：
  - 一行一个完整 JSON 值；无外层数组、无逗号分隔
  - 与 NDJSON 的关系（同一格式的两种叫法，`.jsonl` 偏数据科学/ML，`.ndjson` 偏流式协议）
  - **为什么 Excel / 表格软件打不开它**（这是 `powerdrill.ai` 唯一讲透的点，SERP 其它结果都没讲）
  - 空行、末尾换行、单行内嵌换行的处理差异
  - 与 JSON 数组的本质差异：一个百万条记录的数组是**1 个值**，JSONL 是**100 万个独立值** → 这决定了能否流式/追加/部分读取
- **promo**：`jsonl-to-json`
- **正文内链**：`/tools/convert/json-to-jsonl`、`/blog/json-vs-jsonl`
- **⚠️ 边界**：不要宣称支持"任意大小文件"或"流式分块读取"，除非能在代码里指到实现（`file:line`）

---

#### B. `json-escape-unescape`

- **标题**：JSON Escape and Unescape: Which Characters and Why
- **承接词簇**：`json escape` / `json unescape` / `escape json string` / `json stringify escape` / `remove escape characters from json`
- **来源**：本轮 SERP 新发现（**不在 backlog 里**）
- **SERP 判断**：🟢 最强机会。10 条结果全是工具页（`unescapejson.com`、`jsonescape.com`、`jsonlint.com/json-stringify`、`lambdatest`、`wtools.io`、`onlinejsontools`、`convertcase.net`、`bharatdevtool`、`konnexai`），**没有一篇讲清规则**
- **差异化要点**：
  - 必须转义的 8 个字符：`"` `\` `/`（可选）与 `\b \f \n \r \t`
  - `\uXXXX` 与代理对（emoji 为什么变成两个 `\u`）
  - **双重编码**：为什么日志里会出现 `"{\"a\":1}"`，如何判断自己已经 escape 了几层
  - escape ≠ stringify：`JSON.stringify` 会加外层引号，escape 不会
  - 常见坑：从 HTML 属性 / shell 参数 / URL 里拷贝出来的 JSON 为什么解析失败
- **promo**：`json-escape`
- **正文内链**：`/tools/format/json-parse-stringify`、`/blog/json-parse-error-debug`
- **⚠️ 与既有文章去重**：`json-parse-error-debug` 已讲 "10 类错误"，本文**只讲字符转义这一层**，不重复列错误清单

---

#### C. `how-to-convert-json-to-csv`

- **标题**：How to Convert Nested JSON to CSV (Without Breaking Your Columns)
- **承接词簇**：`json to csv` / `convert json to csv` / `nested json to csv` / `flatten json to csv` / `json array to csv for excel`
- **来源**：本轮 SERP 新发现
- **SERP 判断**：🟢 强机会。英文结果全是转换器（`json-to-csv.utils.com`、`retool`、`becsv`、`jsonflatten`、`jsoncsvonline`），教程只在中文站
- **差异化要点**：
  - **列名如何决定**：`user.name` 点号路径 vs 嵌套原样字符串化，各自的适用场景
  - **数组如何处理**：是展开成多行、还是合并成 `a|b|c`、还是丢弃——这是所有工具都不解释的地方
  - **字段不一致**：第一条记录没有 `email`、第五条才出现时会发生什么（列补齐规则）
  - CSV 注入 / 逗号与引号转义 / Excel 打开乱码（BOM）
- **promo**：`json-to-csv`
- **正文内链**：`/tools/convert/json-to-excel`、`/tools/convert/csv-to-json`
- **⚠️ 边界**：写的列名规则、数组处理方式必须与 `JsonToCsv.vue` 实际行为一致，逐条指到 `file:line`

---

#### D. `jsonpath-tutorial`

- **标题**：JSONPath in Practice: A Tutorial Based on RFC 9535
- **承接词簇**：`jsonpath` / `jsonpath syntax` / `jsonpath examples` / `jsonpath filter` / `jsonpath online tester`
- **来源**：本轮 SERP 新发现
- **SERP 判断**：🟢 机会，但权威占位明确——**RFC 9535**（rfc-editor.org）在首页，另有 Redis 文档、`howtodoinjava`（Jayway JsonPath，Java 向）、Go `pkg.go.dev`
- **差异化要点**：
  - **锚定 RFC 9535**（2024 年正式标准化），明确指出"网上大量教程还在用 Goessner 2007 草案语法，两者在 filter / 数组切片上不一致"——这是最有价值的切入点
  - `$` / `@` / `.name` / `['name']` / `[*]` / `[0]` / `[start:end:step]` / `?()` filter / `..` 递归下降（RFC 中已废弃，需说明）
  - filter 表达式里 `@` 的含义、`length()` / `count()` 等函数扩展
  - 各大实现差异：Jayway（Java）、`jsonpath-plus`（JS）、Python `jsonpath-ng` 对 RFC 的支持度
- **promo**：`json-path-tester`
- **⚠️ 硬约束**：文中示例必须先在 `json-path-tester` 上跑通；`jsonpath-tester` 支持哪些语法要在实现里指到 `file:line`，**不支持的语法不要写在教程里**

---

### P1 — 第二波（6 篇）

---

#### E. `json-vs-xml`

- **来源**：`content-backlog.md` §3 最后一行
- **调研排序**（原文）：JSONL > YAML > TOON > XML，XML「更偏信息型，KD 和权威站竞争更高，排最后」
- **SERP 判断**：🔴 **本轮检索下调优先级**。AWS 排第 1；其余 9 条全是同行工具站的同质对比页（jsonvalidators / jsonkithub / jsonkit.in / datatoolkit / tryutilix / devessentials / thedevtools / codetidy / jsondevtools），都在写"JSON 轻量、XML 冗长、XML 有属性和命名空间"
- **必须差异化，否则不值得写**。切入角度改为**"转换时会丢失什么"**：
  - XML 属性（`@attr`）在 JSON 里怎么表示（前缀约定）
  - 混合内容（`<p>Hello <b>world</b></p>`）为什么无法无损映射
  - 单元素数组问题：`items` 下有 1 个 `item` 时解析成对象还是数组
  - CDATA、实体引用（`&amp;`）、命名空间 `xmlns`、注释、处理指令
  - 顺序敏感性：XML 元素有序、JSON 对象无序
- **promo**：`json-to-xml`（或 `xml-to-json`）
- **⚠️ 边界**：每一条"转换规则"必须与 `JsonToXml.vue` / `XmlToJson.vue` 的实际实现一致，指到 `file:line`

---

#### F. `javascript-json-parse`

- **来源**：`content-backlog.md` §3（`javascript json parse` 480 / KD 23、`javascript json stringify` 390 / KD 33）
- **调研原文**：建议文章并链接 Parse / Stringify / Escape / Formatter 工具；另在 §6 里又被列为「高权威编程词，内容竞争强」——**两处判断有冲突，按后者降低预期**
- **SERP 判断**：🟡 与 PHP 同理，MDN 会占位
- **合并策略**：`JSON.parse` 与 `JSON.stringify` **合并为一篇**（`content-backlog.md` §7 规范化原则），标题可用 *JSON.parse and JSON.stringify in JavaScript: The Parts That Surprise People*
- **差异化要点**：reviver / replacer 参数、`toJSON()` 方法、`space` 参数、键顺序、`undefined`/`Symbol`/`NaN`/`Infinity` 的丢失、`Date` 变字符串、循环引用报错、大数精度（可内链 J）
- **promo**：`json-parse-stringify`
- **正文内链**：`/tools/format/json-escape`、`/blog/json-parse-error-debug`

---

#### G. `json-to-typescript-guide`

- **标题**：Generate TypeScript Types from JSON: What the Generator Can and Can't Infer
- **承接词簇**：`json to typescript` / `json to interface` / `generate typescript from json` / `json to ts types`
- **来源**：本轮 SERP 新发现
- **SERP 判断**：🟢 结果全是工具页（`jsonts.com`、`jsontotypes.avipilcer.com`、`jsonblitz.dev`、`lambdatest`、`json2ts.sharkyzh.cn`、JetBrains 插件），无教程
- **差异化要点**：
  - 类型推断规则：整数 vs 浮点、`number` 何时拆成 `int`/`float`、空数组推成什么
  - **数组合并推断**：多条记录字段不一致时如何生成可选属性 `?`
  - `null` 如何推断（`null` vs `string | null` vs `unknown`）
  - 命名转换：snake_case → camelCase，非法标识符如何加引号
  - 生成的类型**不等于**校验——需配合运行时校验（可内链 `json-schema-validator`）
- **promo**：`json-to-typescript`
- **正文内链**：`/tools/convert/json-to-code`、`/tools/format/json-schema-validator`

---

#### H. `how-to-open-jsonl-file`

- **来源**：`content-backlog.md` §4 第 3 条
- **SERP 判断**：🟡 英文结果**很弱**——前 8 条里大半是中文站（腾讯云、百度知道、文心快码、CSDN、搜狐）和 Python 向内容，没有一篇英文教程。机会存在，但**英文搜索需求可能已被 `json-vs-jsonl` / `what-is-jsonl` 分流**
- **合并策略**：与 §4 的 `jsonl-format-examples` **合并**，标题 *How to Open, View, and Convert a JSONL File*
- **覆盖点**：Windows/macOS 用什么打开、VS Code（含 Zed 的表格化预览新特性）、为什么不要用 Excel、Python 逐行读取、如何用 `jsonl-to-json` 转成数组再看
- **promo**：`jsonl-to-json`
- **正文内链**：`/blog/what-is-jsonl`、`/blog/json-vs-jsonl`

---

#### I. `json-to-excel-guide`

- **承接词簇**：`json to excel` / `json to xlsx` / `convert json to excel`
- **来源**：本轮 SERP 新发现
- **SERP 判断**：🟢 全工具页（`jsontoexcel.pro`、`minifier.org`、`jsonlint.com/json-to-excel`、`json2excel.com`、`jsontoexcel.org`、`jsontables.com`）
- **差异化要点**：嵌套对象如何决定工作表列、数组如何展开、多 sheet 何时生成、Excel 的行数上限（1,048,576）与单元格字符上限（32,767）、大整数被 Excel 转成科学计数法的问题（**与 J 联动**）、CSV 与 XLSX 何时选哪个
- **promo**：`json-to-excel`
- **正文内链**：`/tools/convert/json-to-csv`、`/blog/how-to-convert-json-to-csv`

---

#### J. `json-number-precision`

- **标题**：Why Your Large JSON Numbers Change Value (and How to Fix It)
- **承接词簇**：`json bigint precision` / `json large number precision loss` / `json parse bigint` / `json number precision`
- **来源**：本轮 SERP 新发现
- **SERP 判断**：🟡 英文结果稀薄（Apache Drill、Beam、PostgreSQL 是**不相关**的技术文档），**中文内容密集**（腾讯云、CSDN、OSCHINA、php.cn）→ 英文侧有真实缺口
- **差异化要点**：IEEE 754 与 `Number.MAX_SAFE_INTEGER`（2^53-1）、为什么 `JSON.parse("1234567890123456789")` 会变、`JSON.parse` 的 reviver 保留字符串方案、`json-bigint` 方案、后端改字符串传 ID 的取舍、Excel 打开时再次失真（内链 I）
- **promo**：`json-editor`（需先确认编辑器是否保留大整数原文，若保留则可作为卖点并指到 `file:line`）
- **⚠️ 边界**：若本站工具**不**保留大整数精度，本文不得暗示它能解决该问题

---

### P2 — 补充（4 篇）

| slug | 来源 | SERP 判断 | promo | 备注 |
|---|---|---|---|---|
| `php-json-decode-encode` | backlog §3 | 🔴 `php.net` 官方手册第 1，其余 CSDN / php.cn | — | `json_decode` 与 `json_encode` **合并一篇**；只写官方手册不讲的：`JSON_THROW_ON_ERROR`、深度限制 512、UTF-8 强制要求、`JSON_BIGINT_AS_STRING`、对象 vs 关联数组 |
| `powershell-convertto-json` | backlog §3 | 🟡 调研称"不错的低 KD 内容主题" | — | 调研明确「不是产品工具页」，纯内容页；`-Depth` 默认值 2 的坑是核心卖点 |
| `json-merge-files` | 本轮新发现 | 🟡 工具页极少，多为库/CLI | `json-editor` | 数组拼接 vs 对象深合并的区别是关键；需确认编辑器能否承接，否则不写 |
| `json-utf8-bom-encoding-errors` | 本轮新发现 | 🟡 英文弱、中文密集 | `json-repair` | RFC 8259 明确禁止 BOM；`utf-8-sig`；`json_last_error` 的 `JSON_ERROR_UTF8`；与 `unexpected-end-of-json-input` 有重叠，**写法上要划清：那篇讲截断，这篇讲编码** |

---

### P3 — 观察 / 暂不排期

| slug | 来源 | 不排期原因 |
|---|---|---|
| `arduino-json` | backlog §3 | 调研原文：「与通用工具定位关联一般，优先级低于 Python 和 JSONC」 |
| `package-json-explained` | backlog §6 | `nodejs.org` / npm 官方文档占死，且非本站核心场景 |
| `jq-command-line-json` | 本轮新发现 | 有 `shapeshed.com`（2016）与 DigitalOcean 占位；与本站「浏览器内工具」定位弱相关，可作外链内容而非主推 |
| `mock-json-from-schema` | 本轮新发现 | `jrji.com` 等已占位；需先看 `json-schema-generator` 实际能力再定 |
| `jsonl-to-csv` | backlog §4 | 依赖 JSONL + CSV 双侧能力已通；排在 A / H 之后再看 |

---

## 3. 与写作并行的翻译任务

9 篇 EN 文章缺 ZH 版本，`docs/blog/` 下已有 `json-comments`、`how-to-create-json-file`、`how-to-open-json-file`、`json-vs-jsonl`、`json-vs-toon`、`json-vs-yaml`、`read-json-file-python`、`unexpected-end-of-json-input` 的工作稿，可直接作为母本。

**建议顺序**（按工具配套强度 + 长尾价值）：

1. `json-comments` — 配套 `jsonc-to-json`，且是 backlog 第一梯队，zh 侧 `comments in json` 类词同样有需求
2. `how-to-open-json-file` — 调研标 8/10 可行性，强入门流量
3. `json-vs-yaml` / `json-vs-jsonl` / `json-vs-toon` — 对比类，翻译成本低
4. `unexpected-end-of-json-input` — 报错类，长尾稳定
5. `how-to-create-json-file` / `how-to-create-manifest-json`
6. `read-json-file-python` — 中文技术圈竞争更激烈，**最后做**

**翻译时的硬约束**（`content-backlog.md` §0）：

- EN 侧 `locales` 补成 `["en", "zh-CN"]`，ZH 侧写 `["zh-CN", "en"]`
- ZH 侧 `promo.slug` 用**同一个工具 slug**（工具页按路径接语言，不带语言前缀）
- ZH 正文里引用本站工具时写 `/zh/tools/{category}/{slug}` 还是 `/tools/{category}/{slug}`，**以现有 5 篇 ZH 文章的写法为准**，不要自创
- ZH 侧同样受 copy-accuracy 约束：文中提到的工具能力必须能指到 `file:line`

---

## 4. 明确不做（沿用 `content-backlog.md` §6，本轮不新增豁免）

- 品牌 / 产品词：`dadroit json viewer`、`analog lab default app for .json files`
- 游戏 / 插件问题：`5.json file minecraft`、`daisy seed json file`
- 软件配置词：`claude settings json`、`vscode settings json`、`launch.json`
- 特定项目词：`openclaw.json`、`mta json api`
- 拼写错误词：`jason file`
- 泛概念词：`json blob`、`json list`、`json encode`
- 特定服务错误：`failed to download file. name: 5.json`

本轮追加一条：**官方文档已在 SERP 首页占死、且本站无工具配套的纯参考手册类主题**（如 `package.json` 全字段、`php json_decode` 完整参数表）不作为独立页，只作为其它文章里的一个 H2。

---

## 5. 落地提醒（写每一篇之前必读）

1. **路由**：没有 `/guides`，一律 `/blog/{slug}`，zh 侧 `/zh/blog/{slug}`
2. **frontmatter**：`title` / `description` / `category` / `date` / `locales` 必填；`h1` / `image` / `tags` / `lastmod` / `promo{slug,text,btn}` 可选
3. **语言键**：博客 `locales` 写 `zh-CN`；工具 JSON 里写 `zh`。两套别混
4. **promo.slug** 只填真实存在的工具 slug（不带 category）。当前可用全集见 `app/assets/data/{convert,format,view}/`
5. **copy-accuracy**：文中每一处对本站工具的能力描述，必须能在代码里指到 `file:line`；指不出就删文案
6. **数字不进正文**：调研里的搜索量 / KD 只用于排期，不写进文章
7. **去重**：写之前先 `grep` 既有 14 篇，避免与 `json-parse-error-debug`、`unexpected-end-of-json-input`、`json-validation-syntax-vs-schema` 撞车
