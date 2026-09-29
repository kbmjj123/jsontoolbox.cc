# 内容页（博客）待办清单

> 来源：`docs/left-pages/summary.md`、`docs/upgrade/finish/semrush-summary.md`
> 本清单只记录两份调研**明确提出**的页面、关键词数据、内容要点与优先级判断，不新增调研之外的主题。
> 「执行层信息」（路由映射、promo 目标工具、去重提醒）是本站落地所需的补充，已单独标注。

---

## 0. 落地机制（执行层，非调研内容）

| 项 | 说明 |
|---|---|
| 路由 | 站内**没有 `/guides` 路由**，`app/pages/` 下只有 `blog`。调研里的 `/guides/*` 一律落到 `/blog/{slug}`，zh 侧 `/zh/blog/{slug}` |
| 文件 | `content/en/blog/{slug}.md` 与 `content/zh/blog/{slug}.md` |
| frontmatter 必填 | `title` / `description` / `category` / `date` / `locales` |
| frontmatter 可选 | `h1` / `image` / `tags` / `lastmod` / `promo{slug,text,btn}` |
| promo.slug | 填**工具 slug**（不带 category），会在正文末尾渲染成内链按钮 |
| 正文内链 | 直接写 `/tools/{category}/{slug}`，现有文章即如此 |
| ⚠️ 命名坑 | 博客 frontmatter 的 `locales` 写 `["en","zh-CN"]`（**zh-CN**）；工具 JSON 里语言键是 `zh`。两套别写反 |
| 硬约束 | copy-accuracy 同样管博客：文中提到的本站工具能力必须能指到 `file:line`；**调研里的 KD / 搜索量数字不得写进文章**（那是决策依据，不是用户内容） |
| promo 目标 | 只能填真实存在的 slug，否则变死链（见 §5 当前不存在、需先建工具的条目） |

---

## 1. 第一梯队：先写

### 1.1 JSON 注释 / 如何在 JSON 里写注释

- 调研来源：`left-pages/summary.md` §八.2、§十 B 类；`semrush-summary.md`「推荐的站点架构」
- 调研给出的 URL：`/guides/json-comments`、`/guides/json-vs-jsonc`、`/guides/how-to-add-comments-to-json`
- 关键词（原文数据）：
  - `comment in json file` 480 / KD 36
  - `comments in json file` 390 / KD 39
  - `comments in json files` 390 / KD 36
  - `commenting in json file` 390 / KD 33
  - `how to comment in json` 390 / KD 32
  - `json file comments` 260 / KD 38
  - `jsonc` 590 / KD 35
  - `can you make comments outside the brackets in json` 390 / KD 24
- 调研指定的内容要点（原文）：
  - 标准 JSON 不支持 comments
  - JSONC、JSON5、HJSON 的区别
  - VS Code settings.json 为什么可以写注释
  - 如何将 JSONC 转为 JSON
  - 为什么不能用正则简单删除注释
- 执行层：按 `semrush-summary.md` 的规范化原则（同义词合并到一个 canonical 页），三个 URL 合并为一篇 `/blog/json-comments`，用 H2 覆盖其余变体
- 执行层：promo → `jsonc-to-json`（已落地，配套最强）
- 执行层：提到 `jsonc-to-json` 时必须按该页已写死的边界描述——不解析 JSON5、不做 colspan 式网格展开等

### 1.2 如何创建 JSON 文件

- 调研来源：`left-pages/summary.md` §八.1、§十 B 类；`semrush-summary.md`「推荐的站点架构」
- 调研给出的 URL：`/guides/how-to-create-json-file`、`/guides/how-to-create-manifest-json`
- 关键词（原文数据）：
  - `how to create json file` 590 / KD 13
  - `create json file` 390 / KD 11
  - `how to make a .json file` 1.3K / KD 36
  - `how to create a json file` 1.0K / KD 39
  - `how to generate a json file` 170 / KD 36
  - `how to create a manifest.json file` 390 / KD 31
- 调研判断（原文）：「不建议先做 `/tools/create-json`，因为用户多数是寻求教程，而不是需要一个『创建空 JSON 文件』的工具」；可行性高、开发成本低，`create json file` KD 11 是很好的内容入口
- 调研建议顶部嵌入的工具：JSON Editor、JSON Validator、JSON Formatter、JSON Schema Generator、JSON Array Generator
- 执行层：promo → `json-editor`；正文可内链 `json-schema-generator`
- 执行层：`json-array-generator` 工具尚未建，写文时不要当作已存在

### 1.3 JSON vs JSONL

- 调研来源：`left-pages/summary.md` §八.4、§十 B 类；`semrush-summary.md` 第四梯队、第七梯队
- 调研给出的 URL：`/guides/json-vs-jsonl`
- 关键词（原文数据）：`json vs jsonl` 480 / KD 17；`.jsonl` 480 / KD 27（CPC 11.58）；`jsonl file` 590 / KD 22；`jsonl format` 480 / KD 38（CPC 6.53）；`what is jsonl` 480 / KD 30
- 调研判断（原文）：可行性 7.5/10；优势是与 AI、日志、数据管道、机器学习相关，CPC 较高，`json vs jsonl` 的 KD 只有 17；差异化点是大文件处理（Web Worker、流式读取、虚拟列表）
- 执行层：promo 目标依赖 JSONL 工具，见 §5

### 1.4 JSON vs TOON

- 调研来源：`left-pages/summary.md` §八.4；`semrush-summary.md` 第七梯队
- 调研给出的 URL：`/guides/json-vs-toon`
- 关键词（原文数据）：`toon vs json` 590 / KD 35；`json to toon` 880 / KD 34
- 执行层：promo → `json-to-toon`（已落地，配套价值高）
- 执行层：必须沿用 `json-to-toon` 页已确立的口径——**不得写死「省 30%–60% token」**，token 数是 `ceil(chars/4)` 的估算、非模型分词器计数，对比基准是压缩 JSON 而非缩进 JSON

---

## 2. 第二梯队

### 2.1 如何打开 / 查看 / 编辑 JSON 文件（工具 + 教程混合页）

- 调研来源：`semrush-summary.md` 第二梯队（整节）
- 调研给出的 URL：`/guides/how-to-open-json-file`、`/guides/how-to-view-json-file`、`/guides/how-to-edit-json-file`
- 关键词（原文数据）：
  - `how to open json file` 2.4K / KD 32
  - `how do i open a json file` 1.6K / KD 38
  - `how do you open a json file` 1.6K / KD 25
  - `how to make a .json file` 1.3K / KD 36
  - `view json file` 590 / KD 32
  - `how to edit json files` 480 / KD 24
  - `json file reader` 390 / KD 33
  - `edit json file` 390 / KD 39
  - `how to view json file` 320 / KD 20
- 调研的关键判断（原文）：**不要只写文章**——单纯教程容易被 Microsoft、GeeksforGeeks、VS Code 帮助页和论坛占据；应做「页面顶部直接放工具 + 下面覆盖教程内容」的混合页
- 调研给的标题：> How to Open, View, and Edit a JSON File Online
- 调研给的 tagline：> Open and edit JSON files in your browser with instant formatting, validation, and tree view. No upload or sign-up required.
- 调研指定的顶部工具：Upload JSON File、Paste JSON、Tree View、Code View、Format、Validate、Edit、Download
- 调研指定的教程大纲：Windows 如何打开、macOS 如何打开、Chrome/Edge/Firefox 如何查看、VS Code 如何打开和格式化、手机如何查看、打不开时如何排查、如何把编辑后的内容重新保存为 .json
- 调研给的合并范围：同时覆盖 `how to open json file` / `how to view json file` / `how to edit json file` / `json file reader` / `json file viewer` / `how to open or extract .json files`
- 可行性评分（原文）：8/10，**前提是必须是「可用工具 + 教程」而非普通博客文章**
- 执行层：三个 URL 合并为一篇；promo → `json-editor`（或 `large-json-viewer`）
- 执行层：调研原文强调「这里的『无需上传』必须真实实现」——本站确实纯客户端，可如实表述

### 2.2 Unexpected end of JSON input

- 调研来源：`left-pages/summary.md` §八.3；`semrush-summary.md` 第五梯队、第七梯队
- 调研给出的 URL：`/guides/unexpected-end-of-json-input`
- 关键词（原文数据）：`unexpected end of json input` 590 / KD 14；`json parse error` 590 / KD 29；`missing error json structure` 880 / KD 23
- 调研判断（原文）：`unexpected end of JSON input` KD 14，非常适合做教程页，顶部直接嵌入 JSON Validator / Repair 工具
- 执行层：站内已有 `content/{en,zh}/blog/json-parse-error-debug.md`（标题为「JSON Parse Failed: 10 Common API Errors and How to Debug Them」），已部分覆盖 `json parse error` 意图——本条应聚焦 `unexpected end of json input` 这一具体报错，避免与既有文章重复
- 执行层：promo → `json-editor`（当前承接校验/修复能力）；`json-repair` 独立页建成后应改为指向它

### 2.3 JSON vs YAML

- 调研来源：`left-pages/summary.md` §八.4；`semrush-summary.md` 第七梯队
- 调研给出的 URL：`/guides/json-vs-yaml`
- 关键词（原文数据）：`yaml vs json` 880 / KD 32
- 调研排序（原文）：JSON vs JSONL > JSON vs YAML > JSON vs TOON > JSON vs XML（理由：JSONL KD 17、YAML 有稳定开发者需求、TOON 与 AI 趋势相关、XML 更偏信息型且竞争更高）
- 执行层：promo → `json-to-yaml` 或 `yaml-to-json`（均已落地）

### 2.4 用 Python 读写 JSON 文件

- 调研来源：`left-pages/summary.md` §九；`semrush-summary.md` 第六梯队
- 调研给出的 URL：`/guides/read-json-file-python`、`/guides/python-json-load-vs-loads`、`/guides/python-json-dump-vs-dumps`、`/guides/python-read-json`、`/guides/python-parse-json`
- 关键词（原文数据）：
  - `read json file python` 1.3K / KD 19–31
  - `python json dumps` 1.0K / KD 23
  - `python parse json` 1.0K / KD 33
  - `json dump python` 880 / KD 33
  - `json dumps python` 880 / KD 38
  - `python json.loads` 720 / KD 33
  - `python json parser` 590 / KD 36
  - `python json load` 590 / KD 32
  - `python json pretty print` 590 / KD 40
  - `read json file in python` 590 / KD 29
- 调研判断（原文）：可行性 6/10；意图偏代码学习与 API 使用，SERP 常被官方文档、Stack Overflow、Real Python、GeeksforGeeks 占据；**不要为每个变体创建页面**（原文列举了 `python read json file` / `read json file python` / `read json file in python` / `python read a json file` 应合并）
- 调研建议的合并标题：> How to Read and Write JSON Files in Python
- 调研指定的覆盖点：`json.load()`、`json.loads()`、`json.dump()`、`json.dumps()`、编码处理、pretty print、异常处理、大文件、JSON Lines、Python dict 与 JSON 的区别
- 调研建议嵌入的工具：Paste JSON and validate it、Convert JSON to Python dict、Generate sample JSON、Pretty-print JSON before copying it into Python
- 执行层：promo → `json-editor`

---

## 3. 第三梯队（调研标为 C 类 / 更后期）

| 主题 | 调研 URL | 关键词（原文） | 调研判断（原文） | promo 目标（执行层） |
|---|---|---|---|---|
| PHP json_decode | `/guides/php-json-decode` | `php json_decode` 590 / KD 18 | 建议文章；**不建议**现在开发 PHP 专用在线工具 | — |
| PHP json_encode | `/guides/php-json-encode` | `php json encode` 590 / KD 24、`php json_encode` 590 / KD 36 | 同上 | — |
| JavaScript JSON.parse | `/guides/javascript-json-parse` | `javascript json parse` 480 / KD 23 | 建议文章并链接 Parse / Stringify / Escape / Formatter 工具 | `json-parse-stringify` |
| JavaScript JSON.stringify | `/guides/javascript-json-stringify` | `javascript json stringify` 390 / KD 33 | 同上 | `json-parse-stringify` |
| PowerShell ConvertTo-Json | `/guides/powershell-convertto-json` | `powershell convertto json` 1.0K / KD 18、`powershell json write to file` 320 / KD 21 | 「不错的低 KD 内容主题，但不是产品工具页」 | — |
| Arduino JSON | `/guides/arduino-json` | `arduino json` 480 / KD 12、`arduino json example` 720 / KD 14、`arduino json jsonarray` 590 / KD 13 | 垂直场景，与通用工具定位关联一般，**优先级低于 Python 和 JSONC** | — |
| JSON vs XML | `/guides/json-vs-xml` | `json or xml` 720 / KD 39、`xml and json` 480 / KD 37 | 更偏信息型，KD 和权威站竞争更高，排最后 | `json-to-xml` / `xml-to-json` |

---

## 4. 与 JSONL 工具配套的系列文章（依赖工具先落地）

调研来源：`semrush-summary.md` 第四梯队

调研给出的配套文章清单（原文）：

- What is JSONL?
- JSON vs JSONL
- How to open a JSONL file
- JSONL format examples
- Convert JSON to JSONL
- Convert JSONL to CSV

对应关键词（原文）：`.jsonl` 480 / KD 27、`jsonl file` 590 / KD 22、`jsonl format` 480 / KD 38、`what is jsonl` 480 / KD 30、`json vs jsonl` 480 / KD 17

调研建议的工具能力（原文）：一行一个 JSON 对象的解析、错误行号提示、JSONL → JSON Array、JSON Array → JSONL、JSONL → CSV、大文件分块读取、行数统计、搜索和过滤、本地浏览器处理

执行层：这一组的 promo 与正文内链都依赖 JSONL 工具页，排在工具落地之后。

---

## 5. 当前尚不存在、清单里会引用到的工具

写文前必须确认，避免内链死链（copy-accuracy + playbook §1 死链约束）：

| slug | 状态 | 影响的条目 |
|---|---|---|
| `json-array-generator` | **未建**（调研 A 的 B 类，工具队列第 4 位） | §1.2 顶部嵌入工具清单里提到了它 |
| `jsonl` 相关（viewer / converter） | **未建**（工具队列第 3 位） | §1.3、§4 整组 |
| `json-repair` | **未建**（能力已有：`useJsonFixer.ts` 用 `jsonrepair`，被 `JsonEditor.vue` 使用；工具队列第 1 位） | §2.2 |
| `excel-to-json` | **未建**（工具队列第 2 位） | 与内容线无直接依赖 |

已存在、可直接作为 promo 目标的工具：
`json-editor`、`json-escape`、`json-minifier`、`json-path-tester`、`json-schema-validator`、`json-compare`、`json-schema-generator`、`json-to-code`、`json-to-csv`、`json-to-excel`、`json-to-html`、`json-to-pdf`、`json-to-table`、`json-to-text`、`json-to-toon`、`json-to-typescript`、`json-to-xml`、`json-to-yaml`、`jsonc-to-json`、`txt-to-json`、`html-to-json`、`json-parse-stringify`、`csv-to-json`、`xml-to-json`、`yaml-to-json`、`large-json-viewer`

---

## 6. 调研明确「不建议做」的（防止误列入排期）

来源：`semrush-summary.md`「不建议优先做的关键词」表 + `left-pages/summary.md` §十 C 类

| 类型 | 示例（原文） | 原因（原文） |
|---|---|---|
| 品牌 / 产品词 | `analog lab default app for .json files`、`dadroit json viewer` | 用户已有明确产品目标 |
| 游戏 / 插件问题 | `5.json file minecraft`、`daisy seed json file plugdaisy` | 主题不稳定，与产品关联弱 |
| 软件配置词 | `claude settings json`、`vscode settings json`、`launch.json` | 适合写教程，不适合做核心工具 |
| 特定项目词 | `openclaw.json`、`mta json api`、`org.json` | 短期热度，生命周期和意图不稳定 |
| 拼写错误词 | `jason file` | 可自然覆盖，不专门建页 |
| 泛概念词 | `json blob`、`json list`、`json encode` | 搜索意图不够集中 |
| 高权威编程词 | `python json module`、`javascript json parse` | 内容竞争强，工具匹配度一般 |
| 特定服务错误 | `failed to download file. name: 5.json` | 不适合长期产品定位 |

`left-pages/summary.md` §十 C 类（暂只做内容、不做产品页）原文列举：
Python `json.load`/`json.loads`、Python `json.dump`/`json.dumps`、JavaScript `JSON.parse`/`JSON.stringify`、PHP `json_decode`/`json_encode`、PowerShell `ConvertTo-Json`、ArduinoJson、VS Code `settings.json`/`launch.json`/`tasks.json`、Claude settings.json、package.json vs package-lock.json、`manifest.json`、`json placeholder`、`application/json`、`json web signature`、`json api`

---

## 7. 调研反复强调的规范化原则

来源：`semrush-summary.md`「重要的规范化原则」、`left-pages/summary.md` 各节

- **不要为每个相似关键词创建一篇页面**。同义词应由同一个 canonical 页承接，近似词自然放入标题、H2、FAQ 和正文
- 报告给出的合并示例：
  - `how to open json file` / `how do i open json file` / `how do you open json file` / `how to open .json file` / `how to view json file` → 一个页面
  - `json to csv converter` / `convert json to csv` / `convert json into csv` / `online json to csv converter` → 一个页面（`/tools/json-to-csv`）
- Python 那一组同理，合并为一篇高质量教程
- 关键词报告中的总搜索量**不能简单相加**，同一意图存在大量近似变体
