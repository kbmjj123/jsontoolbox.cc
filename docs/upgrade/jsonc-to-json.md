# JSONC to JSON Converter

这是一个值得补充的独立落地页，重点覆盖：

- `jsonc`
- `jsonc to json`
- `how to comment in json`
- `comment in json file`
- `comments in json files`
- `json with comments`

Semrush 报告中：

- `jsonc`：590，KD 35。
- `how to comment in json`：390，KD 32。
- `comment in json file`：480，KD 36。
- `commenting in json file`：390，KD 33。
- `comments in json file`：390，KD 39。
- `can you make comments outside the brackets in json`：390，KD 24。 [ppl-ai-file-upload.s3.amazonaws](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/47793863/cead9249-d099-47e8-9ae3-ab6c9d646078/kd-json-1.md?AWSAccessKeyId=ASIA2F3EMEYE6OI2HMZ4&Signature=BoiiZC5OkoL7fSOq%2BI5BUi9TDdQ%3D&x-amz-security-token=IQoJb3JpZ2luX2VjEHkaCXVzLWVhc3QtMSJIMEYCIQCbqLkiqpnJc3eRsfFkZXVYH7eri%2Fo1aDnvYfFYgM5i6AIhANt8v3XRl9n0IFU88BUhQcQstQMtetNV1lHcRAZKoyvKKvMECEEQARoMNjk5NzUzMzA5NzA1IgzHqba3LobcQaipcGMq0ARZAAVCz6m2DowB6MnyF1YuMVs8sprWoFFL3VM%2Bbsszg1g3d23RpivwMjupygKlKiFKGcGvHaBOUJz81dKsh6c%2BOtaITEwUfwalSSvQv%2BD6w3rFWecb9XmAx5Gb%2FIRF3x%2BV2rnvRSp62fjhLq1eyFYBJvpRRWNUxSQ%2FitYAtuvVs%2FCjQkDIzjJkLyry3%2FuXen8%2FuDvXTljDagvDo%2B9xF676V6Zm%2BkOITvtryZXGsFNwRbFBMOOe8wx7tZeEsPTswkna1KSfag2Zn29O4EXMbbCMPEcS4pV9d5dZDSjkosTOvirgIWnTv1vGfIh7b0ZkQZO%2BKt50D3h9hPzLb1vXwf8KCoqA%2FWCHiC8RWAXKBji3r2c3Xko9vpXB%2FiouSqsW%2B4vN4KqoKPGrkZ5eQYzu%2BGunH%2FtjcDnXFxbAJxK%2BQd14qZSmDGxNPb5ptIEX%2FZqQoyl%2BXkPi3eVeJ8Klny42SwmrqUb%2FIkozDq1W4ImtRtce4n35JN%2FryXZNWEGmRNiHB9HsTzzBGSGjZC%2B%2BlcnubHUrIjX9pvYWYSRhE3TIA1%2FQkGbQtF2gW5bPabnHGkMw%2FWuJN1Hlf3JcE90X397pJEz7x5%2B3wdor3UPiJ1ugMDKdE1vtMphWEt3h9%2BgXE2b78MTovfgK4MbTwwCFic%2F4psN8zaO3LEoSGylMWCiYhJbvnTts4Z8Kmukw482zOW6v4Pxjc8P0rGZPY33fAEEm4AhZ05NYUnrr%2FPmWR3Vc3FSxJTKNyvGUInzbqLxm2QIhqOz3VIuu0Z7O4iBS10V%2FXJcoMNbms9UGOpcBElX6jnvEWI93qOunwVF3rdEY2FSt6g2zOYL0UVrs%2FTpDBH69IVLfUGJ7yI2B%2BUxrSfwTSnuG9n%2B44aobOVdk5c142fGAFRdozoe7%2BPE28RyVxYQg3I8lrz1sj9Hz7eMtmlMgj5VosE0tAcEoW%2BTjbrHK%2FgR2slcz02wBe0CnKF0GDHLLY7GYu9cS0x3IBn2M1rpOr8ZdPQ%3D%3D&Expires=1789722921)

这个主题需要严格区分标准 JSON 和 JSONC。标准 JSON 不支持 `//`、`/* ... */` 或 `#` 注释；JSONC 是带 JavaScript 风格注释的扩展格式，常见于 VS Code 配置文件和部分开发工具。FreeCodeCamp、Stack Overflow、ReqBin 和 GeeksforGeeks 都明确说明了这一点。 [freecodecamp](https://www.freecodecamp.org/news/comments-in-json/)

真实工具 SERP 中已经出现：

- JSONC → JSON。
- JSON5 → JSON。
- 删除单行和块注释。
- 删除 trailing commas。
- JSONC pretty/minify。
- JSONC syntax validation。
- 浏览器本地处理。
- 文件上传和下载。

 [jsonlint](https://www.jsonlint.com/jsonc-to-json)

因此页面不应只是一个“删除注释的正则工具”，而应定位为：

> Convert JSONC or JSON5 into valid standard JSON by removing comments and supported non-standard syntax.

***

## 页面定位

### 推荐 URL

```text
/tools/jsonc-to-json
```

### 推荐标题

```text
JSONC to JSON Converter – Remove Comments Online
```

### 推荐 tagline

```text
Remove JSONC comments and trailing commas to create valid standard JSON in your browser.
```

### 初期流量难度

| 维度 | 评价 |
|---|---|
| 搜索需求 | 中等 |
| 工具意图 | 强 |
| KD | 中等 |
| SERP 竞争 | 中等 |
| 实现难度 | 中等 |
| 与 JSON Editor/Formatter 复用 | 很高 |
| 初期流量难度 | 中 |
| 内容扩展价值 | 高 |

***

## 核心功能

第一版建议支持：

```text
JSONC input
→ Remove // comments
→ Remove /* block comments */
→ Remove trailing commas
→ Validate strict JSON
→ Pretty or minified output
→ Copy/download
```

必须正确处理字符串中的注释样式：

```jsonc
{
  "url": "https://example.com/a//b",
  "pattern": "/* not a comment */"
}
```

这里的 `//` 和 `/* */` 都是字符串内容，不能删除。

不要使用简单正则：

```js
text.replace(/\/\/.*$/gm, '')
```

这种方式会破坏 URL、正则样式或文本内容。JSONC 清理必须基于 tokenizer、状态机或成熟 JSONC parser。

***

## SEO 配置

```json
{
  "name": "JSONC to JSON Converter",
  "description": "Convert JSONC or JSON with comments into standard JSON online. Remove line comments, block comments, trailing commas, and other supported JSONC syntax, then validate, format, copy, or download the resulting JSON in your browser.",
  "hero": {
    "trustHtml": "Runs in your browser. Your JSONC is not uploaded by this tool."
  },
  "meta": {
    "title": "JSONC to JSON Converter – Remove Comments Online",
    "description": "Convert JSONC to standard JSON online. Remove comments and trailing commas, validate the result, and copy or download formatted JSON. Free, browser-based, and no upload required.",
    "keywords": [
      "jsonc to json",
      "jsonc converter",
      "convert jsonc to json",
      "json with comments",
      "remove comments from json",
      "json comments converter",
      "jsonc to json online",
      "json comment remover"
    ]
  },
  "ui": {
    "label_input": "Input JSONC",
    "label_output": "Standard JSON Output",
    "label_mode": "Input format:",
    "option_jsonc": "JSONC",
    "option_json5": "JSON5",
    "option_strict_json": "Strict JSON",
    "option_remove_line_comments": "Remove line comments",
    "option_remove_block_comments": "Remove block comments",
    "option_remove_trailing_commas": "Remove trailing commas",
    "option_preserve_comments": "Preserve comments separately",
    "option_indent": "Indent:",
    "option_indent_2": "2 spaces",
    "option_indent_4": "4 spaces",
    "option_minified": "Minified",
    "btn_convert": "Convert to JSON",
    "btn_validate": "Validate",
    "btn_example": "Load Example",
    "btn_copy": "Copy JSON",
    "btn_download": "Download JSON",
    "label_comments_removed": "Comments removed:",
    "label_trailing_commas_removed": "Trailing commas removed:",
    "label_warnings": "Warnings:",
    "placeholder_input": "Paste JSONC or open a .jsonc file...",
    "placeholder_output": "Standard JSON output will appear here...",
    "error_empty_input": "Enter JSONC or open a file first",
    "error_invalid_jsonc": "Input is not valid JSONC",
    "error_invalid_json": "The converted output is not valid standard JSON",
    "error_unclosed_comment": "Unclosed comment",
    "error_invalid_trailing_comma": "Invalid trailing comma",
    "warning_comment_removed": "Comments were removed from the output",
    "warning_json5_feature": "This input uses JSON5 syntax that may not be supported"
  },
  "features": [
    {
      "icon": "lucide:message-square-off",
      "title": "Remove JSONC Comments",
      "description": "Remove JavaScript-style line comments and block comments from JSONC input while preserving comment-like text inside quoted strings."
    },
    {
      "icon": "lucide:brackets",
      "title": "Remove Trailing Commas",
      "description": "Convert supported trailing commas in objects and arrays into strict JSON syntax that standard JSON parsers can read."
    },
    {
      "icon": "lucide:check-circle-2",
      "title": "Validate Standard JSON",
      "description": "Parse the converted output after cleanup and confirm that it is valid standard JSON before copying or downloading it."
    },
    {
      "icon": "lucide:settings-2",
      "title": "Pretty or Minified Output",
      "description": "Choose formatted JSON with indentation or compact JSON output after comments and supported JSONC syntax have been removed."
    },
    {
      "icon": "lucide:scan-search",
      "title": "Conversion Diagnostics",
      "description": "Show comment counts, trailing-comma counts, warnings, and error locations when the input cannot be parsed or contains unsupported syntax."
    },
    {
      "icon": "lucide:copy",
      "title": "Copy Clean JSON",
      "description": "Copy the converted strict JSON to your clipboard for APIs, configuration files, scripts, build pipelines, or other JSON-based workflows."
    },
    {
      "icon": "lucide:download",
      "title": "Download .json",
      "description": "Download the cleaned result as a standard .json file for applications and systems that do not accept JSONC comments."
    },
    {
      "icon": "lucide:upload",
      "title": "Paste or Open JSONC",
      "description": "Paste JSONC text or open a local .jsonc, .json, or supported text file. The source is processed in the browser."
    },
    {
      "icon": "lucide:shield-check",
      "title": "Browser-Based Processing",
      "description": "Comment removal, parsing, validation, and formatting happen in your browser. The page does not require an account or upload the source to a remote service."
    }
  ],
  "guide": [
    {
      "title": "Enter JSONC",
      "description": "Paste JSONC content or open a .jsonc file. JSONC may contain line comments, block comments, and trailing commas that standard JSON does not accept."
    },
    {
      "title": "Choose the input mode",
      "description": "Select JSONC or JSON5 only when the content uses that syntax. Use Strict JSON mode when the source should already conform to standard JSON."
    },
    {
      "title": "Convert and validate",
      "description": "Click Convert to JSON to remove supported extensions, generate standard JSON, and validate the result. Review any warnings about removed comments or unsupported syntax."
    },
    {
      "title": "Format the output",
      "description": "Choose two-space, four-space, or minified output. The output no longer contains comments because standard JSON has no comment syntax."
    },
    {
      "title": "Copy or download",
      "description": "Copy the cleaned JSON or download it as a .json file. Test the result with the application, API, or parser that will consume it."
    }
  ],
  "example": {
    "title": "Convert JSONC to Standard JSON",
    "description": "Remove comments and a trailing comma without touching comment-like text inside strings.",
    "input": "{\n  // User settings\n  \"name\": \"Alice\",\n  \"url\": \"https://example.com/a//b\",\n  \"roles\": [\n    \"admin\",\n    \"editor\",\n  ],\n  /* enabled in production */\n  \"enabled\": true\n}",
    "output": "{\n  \"name\": \"Alice\",\n  \"url\": \"https://example.com/a//b\",\n  \"roles\": [\n    \"admin\",\n    \"editor\"\n  ],\n  \"enabled\": true\n}",
    "useCase": "Convert a commented development configuration into strict JSON for an API or production parser."
  },
  "faq": [
    {
      "question": "What is JSONC?",
      "answer": "JSONC usually means JSON with Comments. It is a JSON-like format that allows JavaScript-style line comments and block comments, and some implementations also allow trailing commas. Standard JSON does not allow these extensions."
    },
    {
      "question": "Does standard JSON support comments?",
      "answer": "No. Standard JSON does not support // comments, /* block comments */, or # comments. If a file contains them, it is JSONC, JSON5, or another extended format rather than strict JSON."
    },
    {
      "question": "What does this JSONC to JSON converter remove?",
      "answer": "It can remove the JSONC features implemented by the page, such as line comments, block comments, and trailing commas. The exact supported syntax should be shown in the input mode and reference documentation."
    },
    {
      "question": "Are comments inside strings preserved?",
      "answer": "They should be preserved. For example, the // inside \"https://example.com/a//b\" is string content, not a line comment. A correct parser must distinguish quoted strings from actual comment tokens."
    },
    {
      "question": "Does it remove trailing commas?",
      "answer": "If the option is enabled and supported, trailing commas before } or ] are removed so the output can be parsed as standard JSON. The converter should not remove commas that are part of a string value."
    },
    {
      "question": "Does JSONC to JSON preserve comments?",
      "answer": "No. Standard JSON has no comment syntax, so comments cannot remain in the strict JSON output. If preserving comments matters, keep the original JSONC file or export the comments separately when that feature is available."
    },
    {
      "question": "Is JSONC the same as JSON5?",
      "answer": "No. JSONC and JSON5 overlap but are not identical. JSON5 may allow additional syntax such as unquoted keys, single-quoted strings, hexadecimal numbers, and other extensions. Use JSON5 mode only when the parser explicitly supports those features."
    },
    {
      "question": "Can I use this for VS Code settings.json?",
      "answer": "You can use it to convert JSONC content into strict JSON, but be careful: VS Code settings.json is commonly JSONC and may rely on comments for human documentation. Keep the original file if you need to continue editing it in VS Code."
    },
    {
      "question": "Can I convert tsconfig.json or other configuration files?",
      "answer": "Yes, when the file uses supported JSONC syntax. The result is only a format conversion; it does not validate TypeScript, ESLint, Webpack, or another application's configuration schema."
    },
    {
      "question": "Can I add comments to standard JSON?",
      "answer": "No, not with // or /* */ while keeping the document valid standard JSON. Use JSONC or JSON5, store comments as ordinary data fields such as _comment when appropriate, or maintain external documentation."
    },
    {
      "question": "Why should I not remove comments with a regular expression?",
      "answer": "A regular expression can mistake comment-like text inside quoted strings for real comments. Values such as URLs, patterns, and descriptions may contain // or /* */. A tokenizer or JSONC-aware parser is safer."
    },
    {
      "question": "Can I format or minify the converted JSON?",
      "answer": "Yes. After supported comments and extensions are removed, the result can be formatted with indentation or minified into compact standard JSON."
    },
    {
      "question": "Can I convert large JSONC files?",
      "answer": "The practical limit depends on file size, comment count, nesting, parser implementation, browser memory, and output rendering. Large files may require a local JSONC parser or a build-time conversion step."
    },
    {
      "question": "Is my JSONC uploaded to a server?",
      "answer": "This page is designed to parse and convert JSONC in your browser without requiring a server upload. You should still avoid entering credentials, access tokens, private customer data, or confidential production configuration into any browser-based tool."
    },
    {
      "question": "Is this a free JSONC to JSON converter?",
      "answer": "Yes. You can paste or open supported JSONC content, remove comments and supported extensions, validate the result, and copy or download standard JSON without creating an account."
    }
  ],
  "article": {
    "title": "How to Convert JSONC to Standard JSON",
    "content": "<h2>What Is JSONC?</h2><p>JSONC commonly means JSON with Comments. It extends standard JSON with JavaScript-style comments, and some implementations also allow trailing commas. JSONC is useful for human-edited configuration because comments can explain settings without requiring a separate document.</p><p>Standard JSON is stricter: it does not allow line comments, block comments, or trailing commas. A JSONC-to-JSON converter removes supported extensions and produces output that ordinary JSON parsers can read.</p><h2>JSON vs JSONC</h2><ul><li><strong>JSON:</strong> Strict data format with objects, arrays, strings, numbers, booleans, and null.</li><li><strong>JSONC:</strong> JSON-like configuration format that commonly allows comments.</li><li><strong>JSON5:</strong> A broader JSON extension with additional syntax such as unquoted keys, single-quoted strings, and other relaxed rules.</li></ul><p>Do not label every JSON-like configuration file as JSONC without checking the parser and syntax it uses.</p><h2>How to Convert JSONC to JSON</h2><ol><li><strong>Enter JSONC:</strong> Paste the content or open a .jsonc or supported text file.</li><li><strong>Select the input mode:</strong> Choose JSONC or JSON5 according to the actual syntax used by the source.</li><li><strong>Remove supported extensions:</strong> Strip comments and trailing commas only when the corresponding options are enabled.</li><li><strong>Parse the output:</strong> Validate the cleaned result as strict JSON.</li><li><strong>Format or minify:</strong> Choose readable indentation or compact output.</li><li><strong>Copy or download:</strong> Save the standard JSON for a parser, API, deployment step, or production workflow.</li></ol><h2>Example JSONC Input</h2><pre><code>{\n  // Display name\n  \"name\": \"Alice\",\n  \"url\": \"https://example.com/a//b\",\n  \"roles\": [\"admin\", \"editor\",],\n  /* Feature flag */\n  \"enabled\": true\n}</code></pre><p>The URL contains <code>//</code> as string content, so it must not be removed. The actual line and block comments can be stripped, and the trailing comma after <code>\"editor\"</code> can be removed.</p><h2>Why Regex-Based Comment Removal Is Dangerous</h2><p>Simple regular expressions cannot reliably distinguish comment markers from text inside quoted strings. This input is valid JSONC:</p><pre><code>{\"url\":\"https://example.com/a//b\",\"pattern\":\"/* keep this text */\"}</code></pre><p>A safe converter should tokenize strings, escape sequences, comments, and structural punctuation separately. This prevents URLs, regular-expression patterns, and descriptions from being damaged.</p><h2>JSONC in VS Code and Configuration Files</h2><p>Files such as VS Code settings.json may use JSONC so that developers can document configuration options. Converting such a file to strict JSON removes the comments, so keep the original JSONC file when those comments are useful during maintenance.</p><p>The converted output is not automatically valid for every application. A valid JSON document can still fail a TypeScript, ESLint, Webpack, or application-specific configuration schema.</p><h2>Can Standard JSON Contain Comments?</h2><p>No. Traditional comments such as <code>// note</code> and <code>/* note */</code> are not part of standard JSON. Workarounds include using JSONC or JSON5, storing notes as ordinary properties such as <code>_comment</code>, or maintaining a separate README or documentation file. A <code>_comment</code> property is data, not a real comment, and applications must decide whether to ignore it.[523][527][528]</p><h2>JSONC, JSON5, and Production Pipelines</h2><p>For development configuration, JSONC or JSON5 may be convenient. Before sending data to a strict API or parser, convert it into standard JSON and validate the output. In repeatable projects, prefer a build-time or local conversion step so the same parser and options are used consistently in development and deployment.</p><h2>Comments and Data Preservation</h2><p>Removing comments is intentionally lossy because standard JSON has nowhere to store them. If comments are part of the documentation, retain the original source or export the removed comment locations separately. Do not assume that converting back from JSON to JSONC can restore the original comments or their positions.</p><h2>Browser-Based Privacy</h2><p>This converter is designed to process JSONC in the browser rather than sending the source file to a remote service. That is convenient for configuration snippets and development files, but it is not a secret-management system. Avoid entering credentials, tokens, private keys, or confidential production configuration into any online tool.</p><h2>When to Use a Local Converter</h2><p>Use a local parser or build step for large files, repeatable deployments, custom JSON5 syntax, external references, confidential configuration, or projects that need exact control over comment and formatting preservation.</p>"
  },
  "internal_links": [
    {
      "anchor": "Edit JSON with syntax highlighting",
      "href": "/tools/json-editor",
      "context": "Use the JSON Editor to review and modify the source before conversion."
    },
    {
      "anchor": "Format standard JSON",
      "href": "/tools/json-formatter",
      "context": "Format the cleaned JSON after comments and trailing commas have been removed."
    },
    {
      "anchor": "Validate JSON syntax",
      "href": "/tools/json-validator",
      "context": "Check that the converted result is valid standard JSON."
    },
    {
      "anchor": "Minify JSON",
      "href": "/tools/json-minifier",
      "context": "Create compact output after converting JSONC to standard JSON."
    },
    {
      "anchor": "Escape and unescape JSON strings",
      "href": "/tools/json-escape",
      "context": "Handle escape sequences when comment-like text appears inside string values."
    },
    {
      "anchor": "Learn how to add comments to JSON",
      "href": "/guides/json-comments",
      "context": "Explain why standard JSON does not support comments and compare JSONC, JSON5, and data-field workarounds."
    },
    {
      "anchor": "Compare JSONC and JSON",
      "href": "/guides/json-vs-jsonc",
      "context": "Explain the syntax differences and when each format is appropriate."
    }
  ]
}
```

## 真实 SERP 结论

当前 SERP 有三个主要竞争方向：

### 1. JSONC 转标准 JSON

JSONLint、OmniConvert 和 VS Code 扩展都直接提供 JSONC → JSON，常见功能是：

- 删除行注释。
- 删除块注释。
- 删除 trailing commas。
- 输出标准 JSON。
- 文件上传和下载。

 [jsonlint](https://www.jsonlint.com/jsonc-to-json)

### 2. “JSON 能不能写注释”教程

FreeCodeCamp、Stack Overflow、ReqBin、GeeksforGeeks 和 Codingem 都明确说明：

- 标准 JSON 不支持注释。
- `//`、`/* */`、`#` 都不是标准 JSON 注释。
- 可以使用 `_comment` 字段，但那是数据，不是真正的注释。
- 也可以使用 JSONC/JSON5 或独立文档。

 [freecodecamp](https://www.freecodecamp.org/news/comments-in-json/)

因此，这个落地页必须同时覆盖工具意图和解释型意图，但首屏仍然应该直接提供转换器。

### 3. JSONC 格式化和验证

SokuTools 的 SERP 已经把 JSONC Formatter、JSONC syntax validation、Pretty、Minify 和标准 JSON 输出结合起来。 [sokutools](https://sokutools.com/en/tools/jsonc-formatter/)

因此，单纯“删除注释”可以上线，但后续应当扩展为：

```text
JSONC → Pretty JSON
JSONC → Minified JSON
JSONC Validate
JSON5 → JSON
```

## 功能边界

### 必须严格保留字符串内容

以下内容不能被删除：

```jsonc
{
  "url": "https://example.com/a//b",
  "text": "/* not a comment */"
}
```

`//` 和 `/* */` 出现在字符串中，属于普通数据。

建议使用：

- tokenizer。
- JSONC parser。
- 状态机。
- 经过测试的 JSON5 parser。

不要使用单纯正则。

### 注释删除是有损操作

转换后：

```jsonc
{
  // user name
  "name": "Alice"
}
```

会变成：

```json
{
  "name": "Alice"
}
```

注释内容无法从标准 JSON 中恢复。因此 UI 应显示：

```text
Comments removed: 1
```

并建议用户保留原始 JSONC 文件。

### `JSONC` 和 `JSON5` 不能混为一谈

JSONC 通常支持：

```text
// line comments
/* block comments */
trailing commas
```

JSON5 可能还支持：

- unquoted keys。
- single-quoted strings。
- hexadecimal numbers。
- leading/trailing decimal points。
- `Infinity`。
- `NaN`。
- 多种转义形式。

如果当前只实现 JSONC，就不要在 title 中写 JSON5。只有真正引入 JSON5 parser 后，才应提供：

```text
option_json5
```

## 内链规划

### 入链

建议从以下页面链接到当前页面：

```text
/tools/json-editor
/tools/json-formatter
/tools/json-validator
/tools/json-minifier
/guides/json-comments
/guides/how-to-edit-json-file
```

推荐锚文本：

- Convert JSONC to standard JSON。
- Remove comments from JSONC。
- Clean commented configuration files。
- Validate JSONC output。

### 出链

当前页面推荐链接：

```text
/tools/json-editor
/tools/json-formatter
/tools/json-validator
/tools/json-minifier
/tools/json-escape
/guides/json-comments
/guides/json-vs-jsonc
```

推荐使用场景：

```text
JSONC → JSON
→ JSON Validator
→ JSON Formatter
→ JSON Editor
```

如果用户需要继续保留注释，则链接到：

```text
/guides/json-comments
```

如果用户只是想修复普通 JSON，则链接到：

```text
/tools/json-repair
```

## 功能建议

### 第一版

- JSONC 粘贴。
- `.jsonc`、`.json`、`.txt` 文件输入。
- `//` 行注释。
- `/* */` 块注释。
- trailing commas。
- 严格 JSON 输出。
- JSON 语法验证。
- Pretty/minified output。
- 删除注释统计。
- 行号和列号错误。
- Copy/download。
- 字符串内注释标记保护。

### 第二版

- JSON5 模式。
- 注释位置导出。
- 删除注释前后 Diff。
- 保留注释到旁车文件。
- 交互式错误定位。
- JSONC Formatter。
- JSONC Minifier。
- VS Code settings.json 示例。

### 第三版

- AST 级别 comment preservation。
- JSONC → JSON + comment map。
- Build script generation。
- npm/Vite/Webpack 配置示例。
- CLI 命令生成。
- JSONC/JSON5/Strict JSON 对比。
- 多文件批量转换。

## SEO 内容策略

主页面不要只写：

```text
Remove comments from JSON
```

应覆盖以下内容层次：

```text
H1: JSONC to JSON Converter

工具区

H2: What Is JSONC?
H2: How to Convert JSONC to JSON
H2: JSON vs JSONC
H2: Why Standard JSON Does Not Support Comments
H2: JSONC in VS Code and Configuration Files
H2: JSONC vs JSON5
H2: Why Regex Comment Removal Can Break URLs
H2: How to Preserve Comments
FAQ
```

最重要的内容点：

- 标准 JSON 不支持注释。
- JSONC 是扩展格式。
- JSONC 转 JSON 是有损的。
- URL 中的 `//` 不能被删除。
- `/* */` 可能出现在字符串中。
- trailing comma 不属于标准 JSON。
- `_comment` 是数据字段，不是真正注释。
- JSONC 不等于 JSON5。
- 转换后还需要目标应用的 schema 验证。

## 页面优先级

| 维度 | 评价 |
|---|---|
| 搜索量 | 中等 |
| 工具意图 | 强 |
| 主词 KD | 中等 |
| 教程长尾空间 | 高 |
| 实现难度 | 中等 |
| 与现有工具复用 | 很高 |
| 初期流量难度 | 中 |
| 长期价值 | 高 |

## 最终判断

**JSONC to JSON 值得做，但不能把它实现成简单的正则替换器。**

首发版本应严格实现：

```text
JSONC input
→ Token-aware comment removal
→ Trailing comma removal
→ Strict JSON parse
→ Pretty/minified output
→ Copy/download
```

页面的核心差异化应放在：

- 不破坏 URL 和字符串。
- 明确显示删除了多少注释。
- 分离 JSONC、JSON5 和标准 JSON。
- 提供准确错误位置。
- 与 JSON Editor、Formatter、Validator、Minifier 形成完整处理链。

它适合作为 JsonToolBox 的**中期补充页面**，优先级低于 TXT to JSON 和 JSON to Text，但高于泛化的 JSON Array Generator。