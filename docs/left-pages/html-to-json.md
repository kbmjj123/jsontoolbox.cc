# HTML to JSON Converter

这个页面适合作为补充落地页，但实际 SERP 显示，`HTML to JSON` 不是单一意图，而是两个不同工具方向：

1. **HTML Table → JSON Array**  
   将网页表格转换成 JSON 数组对象。

2. **HTML DOM → JSON Tree**  
   将 HTML 标签、属性、文本和子节点序列化为 JSON 树。

Semrush 报告中：

- `html to json converter`：110，KD 15。
- `convert html to json`：110，KD 16。
- `convert html into elementor json`：320，KD 16。 [ppl-ai-file-upload.s3.amazonaws](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/47793863/ec2e382e-117d-4dfa-9dd8-1b29a33f6f6a/kd-json-convert-3.md?AWSAccessKeyId=ASIA2F3EMEYEVE6CGAYG&Signature=Qa6HPeImJTlfdH3y4fPDB5GmC3w%3D&x-amz-security-token=IQoJb3JpZ2luX2VjEHgaCXVzLWVhc3QtMSJHMEUCIB8FQGOHuUZeg3dzeyJ8Y3ZJk9PaYfEa%2FQSal%2BuLld11AiEAw2uDQ8UGq543ZyiqcLfZPZuoN3wWIWgFn7qTrNl5eWwq8wQIQRABGgw2OTk3NTMzMDk3MDUiDHUGxJY7vP86mJ4RjSrQBNWFGa4v0jErjE%2FiFeV6UfvIyG15sQ727ba7bRQOtWdub6ks8mwaFfw03RYIa%2BRkFdnqPGpxKpYTp%2FMZv7IR1X%2BqwfMpXJkPoKs3UG8ZQ4g3iS%2FBZgTo9JOr9XfrH8igib8ztfbsDDM6XZtpVEg7g2zG4UOvr1aAfUw64TR0VK1YbBolZ4uGxCRqAsCZykahyCLMC40wH0Q4DppoipSYAL34bzIw9afZeYCAFflDxsHc260zICDnCKgJ2bWWcQdVWbs1nCLhQSynLTN7go3pl%2F0BkYB2MvP%2FZHCE5VQbNwYNOioI9mu%2B7olDxXXK56W3Di4yDp8xeA53tK1uXsH%2FXCRKKa91MnuA%2FSCx18eC0hrd2tu859PmlY5XegpX8uXgIFM%2BBfaF8LJkW9qIb4Bpc2qTn5ZNalX3NuYHFsfio4UyZAdRxricRxrVwQiOS%2FRwwicFK8MKyt%2B9z6EBvA4VrKAdsvpx2kiqLAtNeRtdlBq%2F6GgDOKCI8LwcmJv1G5Q01n08axpeevzpePRhJCeIXcyaS3P70PARp6ybNkbO5qXkp1dnAHoe%2FtEe6MZlpz%2FSqVDC0j%2BZg0Wz0NZff3Zkm50oB7RCA%2FfJ4sprnEnQGpnlNFRW2b3wlzNhNpe6rTveNTzlRCbpqwMJAQ9izYC5vQ7Fqxa6bscuLvSYrxWmB7jjv%2BiScAdLH7gr6QWzTFmeV3MnwbIfvp7lhvu1HcQTVbPxzLmsvZwgOJ2tGZvUHjGX1wtYJC4p4OiylWLjsTxbUqG%2BAjrduivJHWQN7ks7etgwgt%2Bz1QY6mAGuWdSX6a%2FGx7AgLNZzPR9aoXuA5ctZtDMVGx1elbL0oDxz7SEP2WkxRzBnWK8WDV0TEWDTaZTAVFCdcnbfwkzd7LqmErKH7Iel3jLa2KMTEtqTy2%2FYP1uhXpjb1DxFYhJRGWE82Aju1Gzu0RyluKb2BAwEPPuQoIDQTCzSszdgZx0KTA%2Fbw3v2piBwXxo7NUjb65vgi7j30Q%3D%3D&Expires=1789721941)

真实 SERP 中，Code Beautify、TableConvert、UtilityKit、JSONSwitcher、JSONToTable 和 Uptimia 主要强调 HTML 表格提取；而 `html-json-converter` 等库则强调完整 DOM 结构转换。 [uptimia](https://www.uptimia.com/html-to-json)

因此建议首版优先定位为：

> Extract HTML tables into JSON arrays, with an optional DOM-to-JSON mode later.

不建议首版同时把“网页抓取、完整 DOM 树、HTML metadata、Elementor JSON”全部放在一个页面中。

***

## 页面定位

### 推荐 URL

```text
/tools/html-to-json
```

### 首期主意图

```text
HTML table → JSON array of objects
```

### 后续扩展意图

```text
HTML DOM → JSON tree
HTML metadata → JSON
HTML → Elementor JSON
```

### 推荐标题

```text
HTML Table to JSON Converter – Free Online Tool
```

### 推荐 tagline

```text
Convert HTML tables into JSON arrays in your browser.
```

### 初期流量难度

| 维度 | 评价 |
|---|---|
| 搜索量 | 中低 |
| KD | 低 |
| 工具意图 | 很强 |
| SERP 竞争 | 中等 |
| 实现难度 | 低—中 |
| 初期流量难度 | 低—中 |
| 与 CSV/JSON 工具复用 | 很高 |
| 扩展价值 | 高 |

***

## 首期功能建议

### 1. HTML Table to JSON

输入：

```html
<table>
  <thead>
    <tr>
      <th>Name</th>
      <th>Age</th>
      <th>City</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Alice</td>
      <td>30</td>
      <td>New York</td>
    </tr>
  </tbody>
</table>
```

输出：

```json
[
  {
    "Name": "Alice",
    "Age": 30,
    "City": "New York"
  }
]
```

### 2. 多表选择

HTML 可能包含多个 `<table>`：

```text
Table 1
Table 2
Table 3
```

建议支持：

- Select table index。
- Extract selected table。
- Extract all tables。
- All tables output as an array of table results。

### 3. 表头策略

支持：

- `<thead><th>` 自动识别。
- 第一行作为 header。
- 不使用 header，生成 `column1`、`column2`。
- 重复 header 检测。
- 空 header 自动命名。

### 4. 类型推断

可选：

- `"30"` → `30`。
- `"true"` → `true`。
- 空值 → `null` 或 `""`。
- 保留字符串模式。
- 保留前导零。

默认建议关闭类型推断，避免：

```text
00123 → 123
```

### 5. 复杂表格警告

需要明确提示：

- `rowspan`。
- `colspan`。
- 缺失单元格。
- 多级表头。
- 嵌套 table。
- 表格中包含 HTML 标签。
- `th` 和 `td` 数量不一致。

第一版可以支持基础表格，并对复杂结构提示：

```text
This table contains colspan or rowspan. Review the output carefully.
```

***

## SEO 配置

```json
{
  "name": "HTML Table to JSON Converter",
  "description": "Convert HTML tables into JSON arrays online. Paste HTML table markup or open an HTML file, select a table, detect headers, preview rows, optionally infer basic types, and copy or download the JSON output in your browser.",
  "hero": {
    "trustHtml": "Runs in your browser. Your HTML is not uploaded by this tool."
  },
  "meta": {
    "title": "HTML Table to JSON Converter – Free Online Tool",
    "description": "Convert HTML tables to JSON arrays online. Paste HTML or open a file, detect table headers, preview rows, and copy or download structured JSON. Free and browser-based.",
    "keywords": [
      "html to json converter",
      "html table to json",
      "convert html to json",
      "html table to json converter",
      "html to json online",
      "html table json",
      "convert html table to json",
      "free html to json converter"
    ]
  },
  "ui": {
    "label_input": "Input HTML",
    "label_output": "JSON Output",
    "label_mode": "Conversion mode:",
    "option_table": "HTML table to JSON",
    "option_dom_tree": "HTML DOM to JSON tree",
    "label_table": "Table:",
    "option_first_table": "First table",
    "option_all_tables": "All tables",
    "option_header": "Header handling:",
    "option_detect_header": "Detect header row",
    "option_first_row_header": "First row is header",
    "option_no_header": "No header row",
    "option_infer_types": "Infer basic types",
    "option_empty_as_null": "Convert empty cells to null",
    "option_trim_text": "Trim cell text",
    "option_include_attributes": "Include cell attributes",
    "option_preserve_html": "Preserve cell HTML",
    "option_indent": "Indent:",
    "option_indent_2": "2 spaces",
    "option_indent_4": "4 spaces",
    "btn_convert": "Convert to JSON",
    "btn_example": "Load Example",
    "btn_copy": "Copy JSON",
    "btn_download": "Download JSON",
    "label_preview": "Table Preview",
    "label_rows": "Rows:",
    "label_columns": "Columns:",
    "label_tables": "Tables found:",
    "label_warnings": "Warnings:",
    "placeholder_input": "Paste HTML or open an .html file...",
    "placeholder_output": "JSON output will appear here...",
    "error_empty_input": "Enter HTML or open a file first",
    "error_no_table": "No HTML table was found",
    "error_invalid_html": "The HTML could not be parsed",
    "error_inconsistent_cells": "Some rows have a different number of cells",
    "warning_colspan": "The table contains colspan or rowspan",
    "warning_duplicate_headers": "Duplicate or empty headers were found"
  },
  "features": [
    {
      "icon": "lucide:table-2",
      "title": "HTML Table to JSON",
      "description": "Extract table headers and rows from HTML and convert them into a JSON array of objects."
    },
    {
      "icon": "lucide:layers-2",
      "title": "Select One or Multiple Tables",
      "description": "Detect all tables in the HTML input and choose one table or export multiple tables according to the selected output mode."
    },
    {
      "icon": "lucide:heading",
      "title": "Header Detection",
      "description": "Use table header cells, the first row, or generated column names to create JSON object properties."
    },
    {
      "icon": "lucide:eye",
      "title": "Preview Rows and Columns",
      "description": "Preview detected tables, headers, rows, and warnings before generating the final JSON."
    },
    {
      "icon": "lucide:badge-check",
      "title": "Optional Type Inference",
      "description": "Convert clear numeric, boolean, or null-like cell values when enabled. Disable inference when IDs, postal codes, or formatted strings must remain text."
    },
    {
      "icon": "lucide:settings-2",
      "title": "Text and Attribute Options",
      "description": "Choose whether to trim cell text, preserve cell HTML, or include selected HTML attributes when those options are supported."
    },
    {
      "icon": "lucide:copy",
      "title": "Copy JSON Output",
      "description": "Copy the generated JSON array to the clipboard for use in scripts, APIs, databases, or data-processing workflows."
    },
    {
      "icon": "lucide:download",
      "title": "Download JSON",
      "description": "Download the extracted table data as a .json file for local storage, analysis, testing, or further conversion."
    },
    {
      "icon": "lucide:shield-check",
      "title": "Browser-Based Processing",
      "description": "HTML parsing and JSON generation happen in your browser. The page does not require an account or upload the input HTML to a remote conversion service."
    }
  ],
  "guide": [
    {
      "title": "Enter HTML",
      "description": "Paste HTML containing one or more tables, or open a local .html or .htm file. The first version is optimized for table markup rather than arbitrary page crawling."
    },
    {
      "title": "Choose the table",
      "description": "Select the first table, a specific detected table, or all tables if the input contains multiple table elements."
    },
    {
      "title": "Configure headers and values",
      "description": "Choose whether to use th elements, the first row, or generated column names. Decide whether to trim text, infer basic types, or convert empty cells to null."
    },
    {
      "title": "Review the preview",
      "description": "Check the detected headers, rows, column counts, duplicate headers, missing cells, colspan, rowspan, and other parsing warnings."
    },
    {
      "title": "Convert and export",
      "description": "Click Convert to JSON, then copy the result or download it as a .json file."
    }
  ],
  "example": {
    "title": "Convert an HTML Table to JSON",
    "description": "Extract a basic HTML table with a header row into an array of JSON objects.",
    "input": "<table>\n  <thead>\n    <tr><th>Name</th><th>Age</th><th>City</th></tr>\n  </thead>\n  <tbody>\n    <tr><td>Alice</td><td>30</td><td>New York</td></tr>\n    <tr><td>Bob</td><td>25</td><td>London</td></tr>\n  </tbody>\n</table>",
    "output": "[\n  {\n    \"Name\": \"Alice\",\n    \"Age\": 30,\n    \"City\": \"New York\"\n  },\n  {\n    \"Name\": \"Bob\",\n    \"Age\": 25,\n    \"City\": \"London\"\n  }\n]",
    "useCase": "Extract HTML table data from a saved page or copied markup for use in JSON-based processing."
  },
  "faq": [
    {
      "question": "What does this HTML to JSON converter do?",
      "answer": "The primary mode extracts HTML table rows and columns and converts them into a JSON array of objects. Each table row becomes an object, and the detected headers become property names."
    },
    {
      "question": "Can I convert a complete HTML page to JSON?",
      "answer": "A complete HTML page can contain many elements that do not map naturally to a table. The page should distinguish HTML Table mode from an optional DOM Tree mode. The table mode extracts tabular data; it does not automatically convert every page element into a business data object."
    },
    {
      "question": "How are table headers detected?",
      "answer": "The converter may use th elements inside thead, the first row, or generated column names according to the selected option. Review the header preview when the table has multiple header rows or unusual markup."
    },
    {
      "question": "What if the HTML contains multiple tables?",
      "answer": "Choose one detected table by index or extract all tables when that output mode is supported. Each table may have different headers and row structures."
    },
    {
      "question": "Can I convert an HTML table without a header row?",
      "answer": "Yes. Disable header detection and use generated names such as column1, column2, and column3. Generated names are functional but less descriptive than real headers."
    },
    {
      "question": "Does it support rowspan and colspan?",
      "answer": "Support depends on the table parser. Rowspan and colspan require a grid-expansion algorithm because one cell can occupy several logical positions. If the current implementation does not fully expand them, the tool should show a warning rather than silently produce misleading columns."
    },
    {
      "question": "Does it preserve HTML inside table cells?",
      "answer": "The default output should use cell text content. If Preserve cell HTML is enabled, tags inside cells may be included as strings. HTML content is not automatically safe to render in another application."
    },
    {
      "question": "Does it infer numbers and booleans?",
      "answer": "When type inference is enabled, clear numeric and boolean values may become JSON numbers or booleans. Disable it when values such as 00123, SKU-001, dates, or formatted amounts must remain strings."
    },
    {
      "question": "What happens to empty cells?",
      "answer": "Empty cells can remain empty strings or become null depending on the selected option. Missing cells and empty cells are not always equivalent, especially when the source table has uneven rows."
    },
    {
      "question": "Can I extract HTML table data from a URL?",
      "answer": "URL loading may be available in some tools, but it introduces CORS, remote-content, privacy, and response-size concerns. Pasting HTML or opening a local file is the predictable browser-only workflow. Add URL input only with explicit security controls."
    },
    {
      "question": "Can I convert HTML attributes to JSON?",
      "answer": "In the table mode, cell text is normally extracted. Including attributes such as class, data-* values, links, or image URLs requires explicit attribute mapping and should not be assumed unless the option is implemented."
    },
    {
      "question": "Is HTML to JSON the same as scraping a website?",
      "answer": "No. HTML-to-JSON conversion parses supplied HTML. Website scraping may require fetching a URL, executing JavaScript, handling pagination, respecting access policies, and selecting content. A browser converter should not imply that it can scrape every website."
    },
    {
      "question": "Can I convert HTML to a JSON DOM tree?",
      "answer": "A separate DOM Tree mode can represent elements with properties such as tag, attributes, text, and children. This output is different from table extraction and may be useful for structural inspection or DOM processing."
    },
    {
      "question": "Can I convert JSON back to HTML?",
      "answer": "Use a JSON to HTML or JSON to HTML Table tool for the reverse direction. A table array can be rendered as rows and columns, while a general DOM tree requires an agreed JSON structure for tags, attributes, text, and children."
    },
    {
      "question": "Can I convert a large HTML file?",
      "answer": "The practical limit depends on document size, number of tables, DOM complexity, nested markup, browser memory, and preview rendering. Large pages may be better processed with a local parser."
    },
    {
      "question": "Is my HTML uploaded to a server?",
      "answer": "This page is designed to parse HTML and generate JSON in your browser without requiring a server upload. You should still avoid entering private customer data, authenticated page content, credentials, or confidential HTML into any browser-based tool."
    },
    {
      "question": "Is this a free HTML to JSON converter?",
      "answer": "Yes. You can paste or open HTML, extract table data, review the result, and copy or download JSON without creating an account."
    }
  ],
  "article": {
    "title": "How to Convert an HTML Table to JSON",
    "content": "<h2>What Is HTML to JSON Conversion?</h2><p>HTML to JSON conversion parses HTML markup and represents selected content as JSON. The most practical use case is extracting an HTML table into an array of JSON objects, where each table row becomes an object and each column becomes a property.</p><p>Full HTML documents can also be represented as a JSON DOM tree containing tags, attributes, text, and children. That is a different output model from table extraction and should be selected explicitly.</p><h2>How to Convert an HTML Table to JSON</h2><ol><li><strong>Enter HTML:</strong> Paste HTML containing a table or open a local .html or .htm file.</li><li><strong>Select a table:</strong> Choose the first table, a specific table, or all tables when multiple tables are present.</li><li><strong>Detect headers:</strong> Use th elements, the first row, or generated column names.</li><li><strong>Configure values:</strong> Choose whether to trim text, infer basic types, convert empty cells to null, or preserve cell HTML.</li><li><strong>Review warnings:</strong> Check duplicate headers, missing cells, colspan, rowspan, nested tables, and inconsistent rows.</li><li><strong>Convert:</strong> Generate a JSON array of objects.</li><li><strong>Copy or download:</strong> Copy the result or save it as a .json file.</li></ol><h2>Example HTML Table</h2><pre><code>&lt;table&gt;\n  &lt;tr&gt;&lt;th&gt;Name&lt;/th&gt;&lt;th&gt;Age&lt;/th&gt;&lt;/tr&gt;\n  &lt;tr&gt;&lt;td&gt;Alice&lt;/td&gt;&lt;td&gt;30&lt;/td&gt;&lt;/tr&gt;\n&lt;/table&gt;</code></pre><p>The result can be:</p><pre><code>[\n  {\"Name\":\"Alice\",\"Age\":30}\n]</code></pre><h2>Header Handling</h2><p>Column names can come from an explicit <code>&lt;thead&gt;</code> section, header cells such as <code>&lt;th&gt;</code>, or the first table row. If the source has multiple header rows, grouped headings, blank headers, or duplicate names, the resulting JSON needs a documented naming rule.</p><p>When no header row exists, generated names such as <code>column1</code> and <code>column2</code> can be used. These names are convenient for conversion but may need to be renamed before application use.</p><h2>Rowspan and Colspan</h2><p>HTML tables are not always rectangular. A cell with rowspan or colspan occupies multiple logical grid positions. Converting such a table requires expanding the grid before assigning values to JSON properties. A simple row-by-row parser may shift columns or lose information, so the converter should warn when complex spans are detected.</p><h2>Text, HTML, and Attributes</h2><p>Most table-to-JSON converters extract text content from cells. This is usually the most useful output for data analysis, but it removes links, formatting, images, and nested markup. An optional preserve-HTML mode can retain markup as a string, while attribute extraction requires explicit rules for attributes such as href, src, class, and data-* values.</p><h2>Type Inference</h2><p>HTML cell text is text by default. Optional inference can convert values such as <code>30</code> to a number or <code>true</code> to a boolean, but this may be wrong for postal codes, identifiers, SKUs, dates, and formatted currency. Keep inference disabled when the exact displayed text matters.</p><h2>HTML Table to JSON vs HTML DOM to JSON</h2><ul><li><strong>Table extraction:</strong> Produces an array of records for analysis, APIs, CSV conversion, and structured data workflows.</li><li><strong>DOM tree conversion:</strong> Produces nested objects representing tags, attributes, text, and children.</li><li><strong>Metadata extraction:</strong> Extracts title, meta description, headings, links, JSON-LD, and other page-level information.</li></ul><p>These modes serve different purposes. A page should label them clearly instead of producing an ambiguous JSON result for every kind of HTML input.</p><h2>HTML to JSON Is Not Website Scraping</h2><p>Parsing pasted HTML is different from fetching and scraping a website. URL scraping may be blocked by CORS, require JavaScript execution, involve authentication, or raise access and privacy considerations. A browser-only HTML converter is most predictable when the user supplies the markup or a local file.</p><h2>HTML to JSON and JSON to HTML</h2><p>Converting an HTML table to JSON and converting JSON back to an HTML table can be approximately reversible when the table has simple headers and rows. Formatting, links, attributes, nested markup, rowspan, colspan, and table presentation may not survive the round trip.</p><h2>Browser-Based Privacy</h2><p>This converter is designed to parse supplied HTML and generate JSON in the browser rather than uploading the content to a remote service. Avoid entering authenticated page content, private customer data, credentials, or confidential documents into any online tool.</p><h2>Related JSON Workflows</h2><p>After extracting a table, use a JSON formatter to inspect the result, a JSON validator to check syntax, a JSON to CSV converter for spreadsheets, or a JSON to Table tool for visual review. Use JSONPath when you need to query selected fields from the extracted records.</p>"
  },
  "internal_links": [
    {
      "anchor": "Format the extracted JSON",
      "href": "/tools/json-formatter",
      "context": "Use after conversion to inspect and format the generated JSON."
    },
    {
      "anchor": "Validate the JSON output",
      "href": "/tools/json-validator",
      "context": "Check that the extracted result is valid JSON before using it elsewhere."
    },
    {
      "anchor": "Convert JSON to CSV",
      "href": "/tools/json-to-csv",
      "context": "Export extracted table records for Excel, Google Sheets, and spreadsheet workflows."
    },
    {
      "anchor": "View JSON as a table",
      "href": "/tools/json-to-table",
      "context": "Review the converted records in a table view."
    },
    {
      "anchor": "Query JSON with JSONPath",
      "href": "/tools/jsonpath-tester",
      "context": "Select or inspect specific fields from the extracted JSON."
    },
    {
      "anchor": "Edit JSON online",
      "href": "/tools/json-editor",
      "context": "Modify headers, values, or nested objects after conversion."
    },
    {
      "anchor": "Convert JSON to HTML",
      "href": "/tools/json-to-html",
      "context": "Use for the reverse direction when you need to render JSON records as HTML."
    }
  ]
}
```

## 真实 SERP 结论

当前 SERP 中最明显的是，`HTML to JSON` 实际上被两个意图分开：

### 1. HTML Table → JSON

Code Beautify、Uptimia、UtilityKit、TableConvert、JSONToTable 和 JSONSwitcher 都重点处理：

- 表格识别。
- Header detection。
- Rows and columns。
- 多个 table。
- HTML 文件上传。
- 类型推断。
- Copy/download。
- `rowspan` / `colspan` 相关复杂情况。

 [uptimia](https://www.uptimia.com/html-to-json)

这应当是首版核心。

### 2. HTML DOM → JSON Tree

`html-json-converter` 这类库把 HTML 元素表示为：

```json
{
  "tag": "div",
  "attributes": {
    "class": "test"
  },
  "children": [
    "Hello World"
  ]
}
```



这个方向适合第二阶段，不应和 HTML Table 提取混在一个没有模式选择的工具中。

## 为什么不建议首版加入 URL 抓取

Code Beautify、TableConvert 和 ConvertJSON 等 SERP 结果支持 URL 输入，但这个功能会引入：

- CORS。
- 远程站点拒绝访问。
- JavaScript 动态渲染页面无法获取真实表格。
- 登录态和私有内容风险。
- URL 中的 token。
- 远程文件大小和超时。
- 站点访问政策问题。

 [codebeautify](https://codebeautify.org/html-to-json-converter)

对于 JsonToolBox 的“纯前端、本地处理、隐私优先”定位，首版更适合：

```text
Paste HTML
Upload HTML file
```

而不是直接抓取远程 URL。

## HTML Table 解析的关键风险

### Header 不确定

以下几种结构都很常见：

```html
<thead>
  <tr><th>Name</th><th>Age</th></tr>
</thead>
```

```html
<tr><td>Name</td><td>Age</td></tr>
```

```html
<tr><th colspan="2">Users</th></tr>
<tr><th>Name</th><th>Age</th></tr>
```

因此需要支持：

- `thead + th`。
- 第一行 header。
- 无 header。
- 多级 header 警告。
- 空 header。
- 重复 header。

### `rowspan` / `colspan`

如果不做 grid expansion，复杂表格容易列错位。首版可以不完整支持，但必须显示 warning。

### 类型推断

HTML 表格中的：

```text
00123
```

可能是编号，不应默认转换为数字。建议默认保持字符串，用户手动开启：

```text
Infer basic types
```

### HTML 内容和文本内容

默认建议提取：

```text
cell.textContent
```

而不是：

```text
cell.innerHTML
```

如果保留 HTML，要明确这是字符串输出，并注意后续渲染时的 XSS 风险。

## 内链规划

### 入链

来自：

```text
/tools/csv-to-json
/tools/txt-to-json
/tools/json-editor
/tools/json-to-table
/tools/json-to-csv
```

推荐锚文本：

- Convert HTML tables to JSON。
- Extract table data from HTML。
- Parse HTML table rows。
- Convert HTML markup into structured JSON。

### 出链

当前页面建议链接：

```text
/tools/json-formatter
/tools/json-validator
/tools/json-to-csv
/tools/json-to-table
/tools/jsonpath-tester
/tools/json-editor
/tools/json-to-html
```

推荐用户路径：

```text
HTML Table
→ HTML to JSON
→ JSON Validator
→ JSON to Table
→ JSON to CSV
```

如果用户需要完整 DOM：

```text
HTML to JSON
→ HTML DOM Tree mode
```

如果用户需要反向生成：

```text
JSON to HTML
```

## 功能实现建议

### 第一版

- HTML paste。
- `.html` / `.htm` file input。
- Detect tables。
- Select table。
- Table → JSON array of objects。
- Header detection。
- First row as header。
- No header mode。
- Preview。
- Empty cell handling。
- Optional type inference。
- Copy/download。
- `rowspan` / `colspan` warning。
- Local processing。

### 第二版

- Multiple table extraction。
- Extract all tables。
- Grid expansion for colspan/rowspan。
- Cell links and images。
- `href` / `src` extraction。
- Preserve cell HTML。
- DOM Tree mode。
- CSS selector selection。

### 第三版

- HTML metadata → JSON。
- Title/meta/headings/links/images。
- JSON-LD extraction。
- HTML table normalization。
- Batch HTML files。
- Web Worker large documents。
- JSON to HTML reverse conversion。
- URL input with strict security controls。

## 页面优先级

| 维度 | 评价 |
|---|---|
| 搜索量 | 中低 |
| KD | 低 |
| 工具意图 | 很强 |
| SERP 结构 | 明确但分裂 |
| 实现难度 | 中等 |
| 初期流量难度 | 低—中 |
| 内链价值 | 很高 |
| 长期扩展价值 | 高 |

## 最终判断

**HTML to JSON 值得补充，但首版应明确以 HTML Table to JSON 为主，而不是笼统承诺“完整 HTML 转 JSON”。**

推荐首发产品路径：

```text
Paste/Upload HTML
→ Detect tables
→ Select table
→ Detect headers
→ Preview rows
→ Convert to JSON array
→ Validate/Format
→ Export to CSV or JSON
```

后续再扩展：

```text
HTML DOM → JSON tree
HTML metadata → JSON
HTML → JSON-LD extraction
JSON → HTML
```

这样既能抓住报告中 KD 15–16 的低竞争机会，也能避免页面一开始功能过宽、搜索意图不清和实现质量下降。