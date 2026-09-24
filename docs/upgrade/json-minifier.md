下面是基于原始 Semrush 报告和本次真实 SERP 结果升级后的 JSON 配置。

这个页面的核心方向成立，但原配置需要做几项客观修正：

- JSON minification 不是传统意义上的压缩算法，不一定像 gzip、Brotli 那样显著减少体积。
- 不能笼统使用 `JSON compressor`、`JSON compression tool`，否则容易让用户误以为支持 gzip/Brotli。
- `URL Input` 不是核心功能，而且涉及 CORS、远程数据读取和隐私风险。
- “preserving the original data and structure”需要限定为：解析后的 JSON 值和结构保持不变；原始文本格式不会保留。
- 仅显示字符数不够，真实 SERP 中已经有工具显示 bytes、saved bytes 和 savings percentage。
- `Beautify First` 不一定需要，因为标准 minifier 本身应直接解析并重新序列化合法 JSON。
- 是否删除 comments 需要单独区分标准 JSON 与 JSONC/JSON5 输入。

真实 SERP 中，DebugBear、JSONLint、DevKits、JSON Tools、CodeLint、Static.app 等页面普遍强调：

- 解析后再重新序列化。
- 只移除 token 之间的无意义空白。
- 不改变字符串内部空格。
- 显示原始/压缩后的字节数。
- 语法错误定位。
- 本地处理。
- 部分工具支持 JSONC comments、key sorting 或 multi-line compact mode。

 [debugbear](https://www.debugbear.com/tool/minify-json)

Semrush 报告中相关关键词包括：

- `json minify`：480，KD 34。
- `json minifier`：报告中有相关工具意图。
- `compress json online`：报告中有明确搜索需求。
- `json compressor`：属于高意图但语义较泛的词。
- `json compact`：480，KD 29。
- `json size reducer`：低量长尾。
- `json to one line`：低量但意图非常明确。 [ppl-ai-file-upload.s3.amazonaws](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/47793863/cead9249-d099-47e8-9ae3-ab6c9d646078/kd-json-1.md?AWSAccessKeyId=ASIA2F3EMEYEXTG235J2&Signature=1GtA2ZjC4mb4xk8kMOGCLiM9aEE%3D&x-amz-security-token=IQoJb3JpZ2luX2VjEHYaCXVzLWVhc3QtMSJHMEUCIQCthX91YE40m6Qf0b6r3qANGB9wpMfCBcX1Tn%2FDhib1NgIgajlPa%2B%2B7e6W58vV4X2sHfMa3ylNrQfZjz7ID06FZ1d8q8wQIPhABGgw2OTk3NTMzMDk3MDUiDF3yjNVZ322RVD4kGirQBAQx0rYMO91qNhVnE120TQw5SVmiuoEEgxusfqwPVVQVeCtz05Mltn%2BxQtusgnrCaVQ3cm0cGHOsxEH25NMRjsa4Pn4QphnV5uTQ7dUgtHTVV5yg7%2FWUEYCR2ImjziMcPdQJ4BSs2b4x32YBfjxZPOK15IW30utRDCGW5HDqP1sWOSYCXQrBvSvCycrte6KuN6yDaexmjqsdWfxWwIEqyaAQF90YIBdYCTtzprkbUsXZxzgGIlbZjASbL%2FnTxAZvj1mG1nemyCRw3VIui%2F8RCFi1KTkjJKRhjisIMSiRgio8R1QLhyrG%2FVeRrbNJbc5zM%2BCY4w5E56eM94tYXcDYaC1JcSHJfyDDEryH3L2UD8QKv34TTxR3c8WX81M6WkUVI0gOS7ub5yVIEFGKTTBnvHq1r0hdmhRcjVcu5ZRO4jbt5TB%2BMgi5BpCdzckFXf1rHdmCYDw7Bb7u48CmHQKClSuV3BWpmOlG0cshZaSJBCL7wXc07vFuzcaSt4sHcW7E5ARLzzW6Skt816KCiV%2F7lH88%2FeJ6tYFiiEe3NC48zpheEyHLJiyeQGx7USkRiLjtrGJsfRCn0fFWm3%2FKqLS2JInJ606t124xMo3kLYco7mj6sNk6YOLp5Ex17OD6NidxO%2BBDHspkrBuCkFTdhymN2DKijHVlUzmDJfPd%2FS3h5wRxbOqFEypl3en4rZMDn3DdlxcUR%2FxnHa%2FZhkgoPSjuslZoBbPzfoqzXAP6gXgS65cgH4pcnkRARjUHqWA%2Bd1YONrLnYCoPgaTfWMLToiCtp2MwhqCz1QY6mAG4Mi0bRPTf0JwwJ%2BLzFpZO%2F5k8u6PKzy256%2FtkUHeboJwBIgIm8r3bpVYhrmRdDIXGUNNzs0RfsjLgrwQDbvYcpuUwVupltMl%2FvuZ%2Bapn2%2F0wiqC60CsS10Yy4V2q8eWYY1vkT99XqIm6QIWtI0zj%2BiAWeiulrqHVDzAQm0EDKDTHgGT93MIJqZ8a06uaeY1koS6P3JW%2FENA%3D%3D&Expires=1789713881)

下面版本保留原有数据架构，同时将 SEO 和产品描述改得更准确。

```json
{
  "name": "JSON Minifier",
  "description": "Minify valid JSON by removing insignificant whitespace between JSON tokens. Create compact, single-line output without changing parsed values or structure, compare character and byte sizes, and copy or download the result directly in your browser.",
  "hero": {
    "trustHtml": "Runs in your browser. Your JSON is not uploaded by this tool."
  },
  "meta": {
    "title": "JSON Minifier – Minify JSON Online for Free",
    "description": "Minify valid JSON online by removing indentation, line breaks, and unnecessary whitespace. Compare original and minified sizes, then copy or download compact JSON in your browser.",
    "keywords": [
      "json minifier",
      "json minify",
      "minify json",
      "minify json online",
      "compress json online",
      "json compact",
      "json to one line",
      "free json minifier"
    ]
  },
  "features": [
    {
      "icon": "lucide:minimize-2",
      "title": "Compact JSON Output",
      "description": "Parse valid JSON and serialize it without unnecessary whitespace between tokens. The result is usually a compact single-line representation."
    },
    {
      "icon": "lucide:check-circle-2",
      "title": "Validate Before Minifying",
      "description": "The input is parsed before output is generated. Invalid JSON produces an error instead of silently creating an unreliable minified result."
    },
    {
      "icon": "lucide:bar-chart-3",
      "title": "Size Comparison",
      "description": "Compare the original and minified character counts or byte sizes, then review the absolute and percentage reduction for the current input."
    },
    {
      "icon": "lucide:copy",
      "title": "One-Click Copy",
      "description": "Copy the compact JSON to your clipboard for API payloads, configuration files, browser storage, test fixtures, or other development workflows."
    },
    {
      "icon": "lucide:download",
      "title": "Download Minified JSON",
      "description": "Download the compact result as a .json file for local storage, deployment assets, testing, or build-related workflows."
    },
    {
      "icon": "lucide:file-json-2",
      "title": "Preserve JSON Values",
      "description": "Whitespace between JSON tokens is removed, while meaningful spaces inside string values remain part of the data. Keys, values, types, and structure are preserved after parsing."
    },
    {
      "icon": "lucide:upload",
      "title": "Paste or Open JSON",
      "description": "Paste formatted JSON or open a local .json file if file input is available. The source is parsed in the browser before minification."
    },
    {
      "icon": "lucide:shield-check",
      "title": "Browser-Based Processing",
      "description": "Parsing, size calculation, and minification happen in your browser. The page does not require an account or upload the source JSON to a remote service."
    }
  ],
  "ui": {
    "label_input": "Input JSON",
    "label_output": "Minified Output",
    "placeholder_output": "Minified JSON will appear here...",
    "unit_chars": "characters",
    "unit_bytes": "bytes",
    "unit_saved": "saved",
    "unit_smaller": "smaller",
    "label_original_size": "Original size",
    "label_minified_size": "Minified size",
    "label_savings": "Savings",
    "btn_minify": "Minify JSON",
    "btn_copy": "Copy",
    "btn_download": "Download JSON",
    "btn_beautify": "Beautify",
    "error_empty_input": "Enter JSON or open a file first",
    "error_invalid_json": "Input is not valid JSON",
    "error_processing": "The JSON could not be minified"
  },
  "guide": [
    {
      "title": "Enter valid JSON",
      "description": "Paste formatted or partially compact JSON into the input field, or open a local .json file. Standard JSON syntax is required unless a separate JSONC or JSON5 mode is available."
    },
    {
      "title": "Validate and minify",
      "description": "Click Minify JSON to parse the input and serialize it without insignificant whitespace. If parsing fails, fix the reported syntax error before trying again."
    },
    {
      "title": "Review the size difference",
      "description": "Compare the original and minified character or byte counts. The savings depend on the amount of indentation, spacing, and line breaks in the source."
    },
    {
      "title": "Copy or download",
      "description": "Copy the compact result or download it as a .json file. Keep a formatted source version for future maintenance and review."
    }
  ],
  "example": {
    "title": "JSON Minification Example",
    "description": "Remove formatting whitespace from valid JSON while preserving the parsed data.",
    "inputLabel": "Formatted JSON",
    "input": "{\n  \"name\": \"Alice\",\n  \"age\": 28,\n  \"active\": true\n}",
    "inputExplanation": "The source contains indentation and line breaks that improve readability but add characters outside the actual JSON values.",
    "outputLabel": "Minified JSON",
    "output": "{\"name\":\"Alice\",\"age\":28,\"active\":true}",
    "outputExplanation": "The minified result removes insignificant whitespace between JSON tokens. The property names, values, types, and structure remain the same.",
    "note": "Minification is not the same as gzip or Brotli compression. Use an HTTP compression layer when you need network-level compression.",
    "useCase": "Create a compact JSON payload or asset for a production workflow while keeping a formatted source file for editing."
  },
  "faq": [
    {
      "question": "What does JSON minification do?",
      "answer": "JSON minification parses valid JSON and serializes it with insignificant whitespace removed. It removes formatting spaces, indentation, tabs, and line breaks between tokens while keeping meaningful whitespace inside string values."
    },
    {
      "question": "Does minifying JSON change the data?",
      "answer": "For valid JSON and a standard minification process, the parsed values and structure remain equivalent. The original text formatting, property order choices, and whitespace outside string values may change."
    },
    {
      "question": "Does minification remove spaces inside strings?",
      "answer": "No. A space inside a JSON string is data and must be preserved. For example, the value \"New York\" must remain \"New York\" after minification."
    },
    {
      "question": "How much smaller will minified JSON be?",
      "answer": "The reduction depends on the original formatting. Heavily indented JSON with many line breaks can shrink noticeably, while already compact JSON may produce little or no reduction. Check the displayed character or byte counts for the current input."
    },
    {
      "question": "Is JSON minification the same as compression?",
      "answer": "No. Minification removes formatting characters from the JSON text. Compression algorithms such as gzip and Brotli reduce data further during storage or network transfer and are configured separately from JSON minification."
    },
    {
      "question": "Can I minify invalid JSON?",
      "answer": "A standard JSON minifier should reject invalid JSON rather than guess how to repair it. Fix missing commas, invalid quotes, trailing commas, unmatched brackets, or other syntax errors first, unless a separate repair or JSONC mode is provided."
    },
    {
      "question": "Does it support comments in JSON?",
      "answer": "Standard JSON does not support comments. If the input contains comments, it is JSONC, JSON5, or another JSON-like format and requires an explicit parser mode. Do not remove comments automatically unless the page clearly labels and implements that behavior."
    },
    {
      "question": "Can I minify a JSON file?",
      "answer": "Yes, if local file input is implemented. Open a .json file, validate it, and download the minified result as another JSON file. Keep the original file as a backup."
    },
    {
      "question": "Can I minify large JSON files?",
      "answer": "The practical limit depends on browser memory, file size, parsing time, and the way the output is rendered. Very large files may slow down the page or require a local streaming or command-line workflow."
    },
    {
      "question": "Can I load JSON from a URL?",
      "answer": "The recommended input is pasted JSON or a local file. URL loading can fail because of CORS and may expose remote or private data to the browser. Add URL input only with URL validation, response-size limits, and appropriate privacy controls."
    },
    {
      "question": "Can I restore minified JSON?",
      "answer": "Yes. Use a JSON formatter or beautifier to parse the minified document and add indentation and line breaks. Formatting restores readability but does not necessarily reproduce the original whitespace or presentation order."
    },
    {
      "question": "Is minified JSON always better?",
      "answer": "No. Minified JSON is useful for compact delivery and storage, but formatted JSON is easier for people to inspect, review, and edit. Keep readable source files and minify during a build or delivery step when appropriate."
    },
    {
      "question": "Is this a free JSON minifier?",
      "answer": "Yes. You can validate and minify JSON, compare sizes, copy the result, or download it without creating an account."
    }
  ],
  "article": {
    "title": "How to Minify JSON Online",
    "content": "<h2>What Is JSON Minification?</h2><p>JSON minification removes insignificant whitespace from valid JSON and produces a compact representation. The output commonly appears on one line, but the important property is that whitespace between JSON tokens is removed without changing the parsed data.</p><p>A standard minifier parses the input and serializes it again. This is safer than deleting every space character because spaces inside JSON string values are meaningful and must remain unchanged.</p><h2>How to Minify JSON</h2><ol><li><strong>Enter JSON:</strong> Paste formatted JSON or open a local .json file.</li><li><strong>Validate the input:</strong> Confirm that the source is valid standard JSON.</li><li><strong>Minify:</strong> Parse and serialize the document without indentation or unnecessary token spacing.</li><li><strong>Compare sizes:</strong> Review original and minified character or byte counts.</li><li><strong>Copy or download:</strong> Use the compact output in an API, application asset, configuration workflow, or local file.</li></ol><h2>What Does a JSON Minifier Remove?</h2><p>It normally removes whitespace between JSON tokens, including indentation, line breaks, and spaces around structural punctuation. For example:</p><pre><code>{\n  \"name\": \"Alice\",\n  \"active\": true\n}</code></pre><p>can become:</p><pre><code>{\"name\":\"Alice\",\"active\":true}</code></pre><p>The space inside a value such as <code>\"New York\"</code> is not removed because it is part of the string data.</p><h2>JSON Minification vs Compression</h2><p>Minification and compression are different operations. Minification changes the JSON text by removing formatting overhead. Network compression such as gzip or Brotli encodes the resulting bytes using a compression algorithm. Many HTTP servers can apply gzip or Brotli automatically even when the source JSON is formatted or minified.</p><p>Minification may still be useful for static assets, embedded payloads, storage, or workflows where the raw JSON text itself is transmitted or measured. Do not assume that minification alone provides the same benefit as HTTP compression.</p><h2>How to Measure Savings</h2><p>Character count and byte count are not always identical. For ASCII-only JSON they may be similar under common encodings, but non-ASCII text can occupy multiple bytes in UTF-8. A useful size comparison should identify whether it measures JavaScript string length, encoded UTF-8 bytes, or file bytes.</p><p>Percentage savings can be calculated as:</p><pre><code>savings = (originalSize - minifiedSize) / originalSize × 100</code></pre><p>Always compare the same measurement unit before interpreting the percentage.</p><h2>Minification Does Not Change String Content</h2><p>A safe minifier must preserve whitespace and escape sequences inside quoted strings. Consider:</p><pre><code>{\"message\":\"Line one\\nLine two\",\"title\":\"New York\"}</code></pre><p>The newline escape and the space inside <code>New York</code> are data. Removing them would change the value and make the operation incorrect.</p><h2>JSON, JSONC, and JSON5</h2><p>Standard JSON does not permit comments or trailing commas. JSONC and JSON5 are related formats that add features such as comments, single-quoted strings, or relaxed syntax. A strict JSON minifier should reject those inputs unless it explicitly supports a JSONC or JSON5 parsing mode.</p><p>Some specialized minifiers remove comments from JSON-like content, but that is a transformation beyond standard JSON minification. It should be clearly labeled because comments may contain important documentation.</p><h2>When to Minify JSON</h2><ul><li><strong>Production assets:</strong> Reduce raw file size for static JSON resources.</li><li><strong>Embedded data:</strong> Place compact JSON inside generated code or templates.</li><li><strong>Storage:</strong> Store a compact representation when human readability is not needed.</li><li><strong>Fixtures:</strong> Create one-line test data when that format is useful for a test harness.</li><li><strong>Build pipelines:</strong> Automate minification during deployment while preserving a readable source file.</li></ul><h2>When Not to Minify JSON</h2><p>Keep formatted JSON when people need to review or edit it, when it is maintained in version control, or when clear diffs are more valuable than raw text size. A common workflow is to keep a readable source version and generate minified output as a build artifact.</p><h2>Browser-Based Privacy</h2><p>This minifier is designed to parse and serialize JSON in the browser instead of sending the input to a remote service. That is convenient for development data and configuration snippets, but it is not a secret-management system. Avoid entering credentials, tokens, private customer data, or confidential production information into any online tool.</p><h2>Production Alternatives</h2><p>For repeatable builds, use a local formatter, a CI step, or a command-line tool such as <code>jq -c</code>. A production workflow should validate the output, retain a readable source copy, and test the minified file in the target application.</p>"
  }
}
```

## 主要调整说明

### 1. 不再把 Minify 等同于 Compression

原配置同时使用：

```text
JSON Minifier
JSON Compressor
Compress JSON
JSON compression tool
```

实际需要区分：

```text
Minification:
删除 JSON token 之间的无意义空白。

Compression:
gzip、Brotli、zstd 等算法压缩字节。

Serialization:
重新生成 JSON 文本。
```

DebugBear 和 JSONLint 的 SERP 描述都明确将 minification定义为解析后重新序列化，并强调功能等价、空白删除，而不是 gzip/Brotli 压缩。 [debugbear](https://www.debugbear.com/tool/minify-json)

因此新版保留 `compress json online` 作为辅助关键词，但删除了更容易造成误解的 `json compression tool`。

### 2. 不能直接删除所有空格

原文虽然提到“unnecessary whitespace”，但应该更明确：

```json
{
  "message": "Hello World"
}
```

压缩后：

```json
{"message":"Hello World"}
```

`Hello World` 中的空格必须保留。

实际实现应该使用：

```js
JSON.stringify(JSON.parse(input))
```

而不是：

```js
input.replace(/\s+/g, '')
```

JSONLint 的 SERP 直接给出了 `JSON.stringify(JSON.parse(jsonString))` 的实现方式。 [jsonlint](https://jsonlint.com/json-minify)

### 3. 增加 byte size，而不是只显示 character count

原配置显示：

```text
original and minified character counts
```

这不够严谨，因为：

- JavaScript `.length` 是 UTF-16 code unit 数量。
- UTF-8 文件大小是 byte 数。
- 中文、emoji 等非 ASCII 字符会影响 byte size。
- 不同编码的文件大小可能不同。

因此新版 UI 增加：

```text
unit_chars
unit_bytes
label_original_size
label_minified_size
label_savings
```

并在文章中说明：

> character count and byte count are not always identical.

DevKits、JSON Tools 和 CodeLint 等竞争页面都强调 exact bytes、bytes saved 或 percentage saved。 [devkits](https://devkits.vip/tools/json-minifier)

实际实现建议同时显示：

```text
Characters: 128 → 73
UTF-8 bytes: 134 → 79
Saved: 55 bytes / 41.0%
```

### 4. 删除 URL Input feature

原配置中 URL Input 是一个明显的复用型功能，但对于 JSON Minifier 来说不是必要核心能力。

真实 SERP 中 Code Beautify、JSON Formatter 和 Minifier.org 确实提供 URL 输入，但这类功能涉及：

- CORS。
- 远程文件大小。
- URL 中的 token。
- 私有资源意外暴露。
- 重定向。
- 非 JSON 响应。
- 页面被滥用读取远程地址。

 [codebeautify](https://codebeautify.org/jsonminifier)

因此新版从 features 和 guide 中删除 URL Input，只在 FAQ 中保留谨慎说明。如果未来加入，应增加：

- HTTPS only。
- URL 长度限制。
- 响应大小限制。
- Content-Type 检查。
- CORS 错误。
- 不携带 credentials。
- 禁止 localhost、私有 IP、内网地址。
- 不将 URL 写入 analytics。

### 5. `Beautify First` 不是必须步骤

原 guide：

> If the input is formatted or difficult to read, use Beautify First to normalize it before minifying.

这对 minify 没有必要。合法 JSON 无论是否格式化，都可以直接：

```js
JSON.parse(input)
JSON.stringify(value)
```

如果输入无效，Beautify 也不能解决所有问题。

新版将其改成独立的 `btn_beautify`，作为可选相关操作，而不是 minify 的前置步骤。

### 6. 标准 JSON 与 JSONC/JSON5 分开

真实生态中存在两类输入：

```json
{
  // comment
  "name": "Alice",
}
```

这不是标准 JSON，而是 JSONC/JSON5 或类似扩展格式。

GitHub 上的 JSON.minify 工具专门支持移除 comments 和 whitespace，但这不是普通 JSON minifier 的标准行为。 [github](https://github.com/getify/JSON.minify)

因此新版明确：

- 标准 JSON minifier 应拒绝 comments 和 trailing commas。
- 如果支持 JSONC/JSON5，应单独显示模式。
- “remove comments”不能悄悄发生。
- 删除 comments 是数据内容变换，不只是 whitespace minification。

建议未来 UI 增加：

```text
Input mode:
- Strict JSON
- JSONC
- JSON5
```

而不是默认兼容所有语法。

## 真实 SERP 下的竞争情况

当前 JSON Minifier SERP 的竞争页面大多已具备基础功能：

| 竞争能力 | SERP 表现 |
|---|---|
| 解析并重新序列化 | DebugBear、JSONLint、JSON Tools |
| 上传文件 | Code Beautify、Minifier.org、Static.app |
| URL 输入 | Code Beautify、JSONFormatter、Minifier.org |
| 字符/字节大小 | DevKits、JSON Tools、CodeLint |
| 错误定位 | DevKits、CodeLint |
| JSONC/comment removal | JSON.minify、JSON Tools |
| key sorting | JSON Tools |
| local/no upload | Chrome extension、DevKits、Static.app |
| 自动输出 | CodeLint、部分编辑器工具 |

 [debugbear](https://www.debugbear.com/tool/minify-json)

因此第一版至少应具备：

1. Strict JSON parsing。
2. Correct token whitespace removal。
3. Preserve spaces inside strings。
4. Invalid JSON error。
5. Copy/download。
6. Original/minified size comparison。
7. UTF-8 byte measurement。
8. Local file input。
9. Clear distinction between minify and compression。
10. Keep formatted source recommendation。

## SEO 关键词和落地页策略

建议主页面：

```text
/tools/json-minifier
```

主关键词：

```text
json minifier
json minify
minify json
minify json online
free json minifier
```

辅助关键词：

```text
compress json online
json compact
json to one line
json size reducer
```

不建议将下列词作为核心关键词：

```text
json compressor
json compression tool
json optimizer
```

原因是这些词可能引导用户寻找：

- gzip/Brotli。
- 网络压缩。
- API payload optimization。
- JSON key shortening。
- 删除 null/empty fields。
- 数据重编码。

如果未来支持“remove nulls”“remove empty strings”“sort keys”“shorten keys”，那已经不再只是标准 JSON minification，应单独命名和说明。

## 建议的未来产品规划

### 第一阶段：正确的标准 Minifier

- Strict JSON parse。
- `JSON.stringify(JSON.parse(input))`。
- 保留 string 内部空格。
- Copy/download。
- Invalid syntax error。
- Original/minified characters。
- UTF-8 bytes。
- Savings percentage。
- Local file input。
- Beautify 反向操作。

### 第二阶段：开发者效率功能

- 行列错误定位。
- 自动输出。
- 大文件 Web Worker。
- 虚拟化预览。
- 文件大小限制提示。
- JSONL/NDJSON 单独模式。
- JSONC/JSON5 明确模式。
- key sorting。
- deterministic output。
- hash/checksum。

### 第三阶段：构建与部署能力

- CLI 命令生成。
- npm script 示例。
- `jq -c` 示例。
- CI/CD 集成。
- gzip/Brotli 对比。
- minify + gzip size comparison。
- source/output 下载包。
- build pipeline 文档。

## 页面优先级判断

| 维度 | 评价 |
|---|---|
| 搜索需求 | 中高 |
| 工具意图 | 很强 |
| 主词竞争 | 中等 |
| 实现难度 | 低—中等 |
| 产品匹配度 | 很高 |
| 初期流量难度 | 中等 |
| 长尾扩展空间 | 高 |
| 与 Editor/Formatter 复用度 | 极高 |

这个页面适合作为 JsonToolBox 的基础工具之一，因为实现成本低、使用意图明确，而且可以和以下页面互相导流：

```text
/tools/json-editor
/tools/json-formatter
/tools/json-validator
/tools/json-escape
/tools/json-size
/tools/json-to-csv
```

最终判断是：**JSON Minifier 值得做，而且比 JSON Editor 更容易快速上线并获取长尾流量；但文案必须清楚区分 minification、compression、JSONC comment removal 和删除数据字段。** 最有价值的差异化不是简单生成一行 JSON，而是提供可靠的 byte size 对比、错误定位、严格语法处理和可解释的压缩结果。