# JSON 工具站的 SEO 策略与长尾落地页设计

## 1. 总体策略

- **核心理念**：
  - 工具本身相对基础，但要稳定、好用、加载快。
  - 流量主要来自大量长尾落地页 + 多语言版本，而不是单一主页。
- **关键词类型**：
  - 工具类（format/validate/convert/extract/compare）。
  - 场景类（for Excel / for API / for logs / for TypeScript）。
  - 问题类（how to / what is / best way to）。

## 2. 关键词维度拆解

### 2.1 操作维度

- Format / Beautify / Pretty print.
- Minify / Compress / One line.
- Validate / Check / Lint.
- Convert A ↔ B（JSON ↔ CSV/YAML/XML/Types）。
- Compare / Diff.
- Extract / Filter / Group / Flatten.
- Generate / Mock / Sample / Fake.

### 2.2 场景维度

- for API response.
- for Excel / Google Sheets.
- for logs / ELK / CloudWatch.
- for TypeScript / Go / Python / Swift / Kotlin / Dart。
- for i18n files / config。

### 2.3 修饰词维度

- online / free / no signup / no upload / in browser / client-side / secure / privacy-friendly。

## 3. 长尾落地页的 URL 与结构设计

### 3.1 URL 设计

- 基础工具页：
  - `/tools/json-formatter`
  - `/tools/json-validator`
  - `/tools/json-to-csv`
- 场景化页：
  - `/tools/json-array-to-csv-for-excel`
  - `/tools/flatten-nested-json-to-csv`
  - `/tools/generate-mock-json-from-schema`
  - `/tools/json-to-typescript-api-response`
- 多语言：
  - `/en/tools/json-formatter`
  - `/es/tools/json-formatter`
  - `/pt/tools/json-to-csv`
  - 统一前缀便于管理。

### 3.2 落地页内容结构模板

以「JSON Array to CSV for Excel」为例：

- H1：
  - `JSON Array to CSV for Excel – Free Online Converter (No Upload)`
- 简短介绍（2–3 句）：
  - 描述用户场景（从 API 拿到 JSON array，想在 Excel 打开）。
  - 强调纯前端、不上传。
- 使用步骤：
  1. Paste your JSON array or upload a `.json` file.
  2. (Optional) Select fields to include as CSV columns.
  3. Click "Convert to CSV" and download the file.
- 功能亮点：
  - Auto-detect fields.
  - Handles large arrays (up to X records).
  - Client-side only, safe for sensitive data.
- 示例：
  - 给出一个订单列表 JSON 和对应的 CSV 示例。
- FAQ（3–5 条）：
  - 支持什么结构？
  - 是否支持嵌套？
  - 是否有大小限制？
  - 是否会上传数据？

所有场景页都按这个结构，仅更换：
- H1 文案。
- 场景说明。
- 示例 JSON 和输出。

## 4. 文章内容策略（辅助 SEO）

### 4.1 文章主题建议（英文）

- `What Is JSON? A Beginner-Friendly Guide With Examples`
- `How to Format and Validate JSON Online – Tools and Best Practices`
- `How to Convert JSON to CSV for Excel and Google Sheets`
- `How to Generate TypeScript Interfaces From JSON Data`
- `Common JSON Mistakes and How to Fix Them Quickly`

### 4.2 文章结构模板

- 引言：
  - 描述问题场景。
- 背景知识：
  - 简要解释 JSON 格式和相关概念。
- 实操步骤：
  - 引导用户使用你的工具。
- 示例代码 / 数据：
  - 包含具体 JSON 示例。
- 内链：
  - 链接到对应工具页。
- 结尾：
  - 小结 + 推荐其他相关工具。

## 5. 搜索框联想的使用方法（真实需求挖掘）

### 5.1 操作方法

- 将场景词（如 `generate mock json from schema`）输入搜索引擎搜索框。
- 观察下拉联想建议：
  - `generate sample json from schema`
  - `generate fake json from schema`
  - `generate sample payload from json schema`
  - `generate sample json from avro schema online`
- 将这些联想词视为真实用户搜索的变体。

### 5.2 如何从联想词筛选落地页

- 看是否有：
  - 多个动作词变体（mock/sample/fake）。
  - 不同对象（json schema / avro schema / openapi schema）。
  - online/no upload 等意图词。
- 为每个具有明显意图的联想词设计一个具体工具页或场景页：
  - 例如：
    - `/tools/generate-sample-json-from-schema`
    - `/tools/generate-sample-json-from-avro-schema-online`
    - `/tools/generate-fake-data-from-json-schema`

## 6. 多语言策略

- 英文作为主语言。
- 观察现有工具站在不同语言市场的覆盖情况（如西班牙语、葡语、俄语等）。
- 选择你熟悉且有流量潜力的语言扩展：
  - 优先：es、pt、id、vi。
- 每个工具页和部分文章进行翻译：
  - 保持 URL 结构一致，使用语言前缀区分。
