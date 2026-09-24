下面是基于原始 Semrush 报告和本次真实 SERP 结果升级后的 JSON 配置。

这个页面的关键词方向可以做，但原配置里有几个需要先纠正的技术问题：

- `JSON Escape` 主要处理的是“字符串内容转为 JSON-safe string literal”，不等于把任意 JSON 文档重新序列化。
- `JSON Unescape` 需要区分：输入是带外层双引号的 JSON string literal，还是只包含内部 escaped content。
- “所有 Unicode 字符使用 `\uXXXX`”不是默认 JSON escaping 行为，普通 Unicode 字符可以直接保留。
- `\uXXXX` 只覆盖一个 UTF-16 code unit；emoji 等非 BMP 字符可能涉及 surrogate pair。
- `URL Input` 不建议默认实现，涉及 CORS、远程内容读取和敏感 URL。
- JSONL “逐行处理”不能简单保证，因为引号内换行、嵌套 JSON 字符串和多重转义都可能改变处理边界。
- `Download`、`Swap` 和 `Copy` 是合理功能，但 SEO 核心应放在 `json escape`、`json unescape`、`escaped json string`、`double escaped json` 等明确意图上。

真实 SERP 中，OpenReplay、JSONFiddle、JSON Tools、JSONLint、Jsonic 和 JSONToTable 主要强调：

- quotes、backslashes、newlines、tabs、Unicode。
- 外层引号可有可无。
- 双重转义。
- JSON.stringify / JSON.parse 语义。
- 日志、数据库字段、API response 中嵌套 JSON 字符串。
- 与 HTML encoding、JavaScript string escaping 的区别。

 [openreplay](https://openreplay.com/tools/json-escape/)

Semrush 报告中相关关键词包括：

- `json string to json object`：480，KD 15。
- `convert string to json`：480，KD 29。
- `json stringify online`：590，KD 34。
- `convert json to string`：390，KD 30。
- `string json to json`：480，KD 23。
- `escaped json`：480，KD 32。
- `json encode`：390，KD 33。
- `json stringify to json`：590，KD 35。 [ppl-ai-file-upload.s3.amazonaws](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/47793863/cead9249-d099-47e8-9ae3-ab6c9d646078/kd-json-1.md?AWSAccessKeyId=ASIA2F3EMEYE3WQ3OVAW&Signature=uDzfhO9l3E9J1ig8szVxqcwE4MY%3D&x-amz-security-token=IQoJb3JpZ2luX2VjEHYaCXVzLWVhc3QtMSJHMEUCIQCeEFF%2FLnAtgBBBcnrwP1QimZawKb1G0Pt5fzqVxwZBegIgEpibMx8MiWlW4wYmLkk0pNFc3kC4Drqh0Zj7rjX6644q8wQIPhABGgw2OTk3NTMzMDk3MDUiDJjJEEZMemrCDriaSyrQBKFBfrwaogiX%2FqfEmWsyG1j4wFi%2FSyosmLyROtU%2FhBV2c5LATDPIqcRc9IzYei6VgHnwwNxA7wVqV%2FDgZ1nUqeuppCs%2F4fIMC9fY%2BCAy6oOfWUaO5xL8gZEiShChGjpwyTRzw%2BAjv%2FYv6HIglw4J5V%2F467qsHqKZNEwHyO5ktQ%2Boqo%2BaUUnoxReEsf%2FlOeCfq%2BaB2E9KhENPacn%2F6nC1xhE0qZkoh8nO8tPlq%2BdImHxM8TpImw0dW7oPMpoEwNkA8550YRZS3KBl8u8nP7J%2Bo68Dawu2T0pPAK%2BLxSASHZ9OiT7UGpiw7nD5O9dg0mITvtenkWZw3%2FlSzeVKA1diAV%2BygvamhXP8FWcYki2r9CzuPNSp7Xq%2BV1r4k1ExIOawXqwGHVfuikKIq8EHQRrWU4JPteng8GsLhxile3iRKzLUYTqVDlO9TppYOQCFNZh32rB8TcQ3v1Z4J6R%2F7KoYoKmHyDV7188ZYzrH53P1Vk4szAvZg3RBq4ZjE%2FMkDC7bK1TZ0E%2BUp7UV2F7mPUU1fmehk%2BamGowN%2BDVrrzo3AIpz0XPs7UoSWQpIjLxJ1ybuFOmUj2N9wDWVAzo1fwPYVgpqewqVofrdxWUT3CWcrFT9qxbuPwDVTOOIkxl6nHvaPlLjnt9xsxeR8Dhhy%2FSniR1C48c0SeiTUWgx%2B%2B%2F%2F%2BoPmhbKBvh0IklQ05iGgdj71CET6tihatX71zRd75IjxvLL2LSIzLyGD6dKSBZHXcuKm1P827OKnRXaTucmY3931ThrLq606JE34OgNWJpui2FgwvqWz1QY6mAHr%2FB9djWsCKRNY5Nt9lf9cprbpIR4o2RdiPbjwGRAtULwrHutiMbHtOFFdfu8xby4Taixh4KgHyZDCh0sTKQC5J1mybA9ocBNm%2B3QR5kk5HQLNM6ISU5O9nQUNn1jbw1yk9MH%2FDn9iarFT%2Bx0cPoGM%2F6XtFouSpcfWzthfQK%2FoXN4CtEsMfDdinMR39fRYI2j1%2B5P3gpT%2Biw%3D%3D&Expires=1789714577)

这说明用户需求不只是“escape/unescape”两个动作，还包括：

- escaped JSON string → JSON object。
- JSON object → escaped string。
- double escaping。
- JSON.stringify / JSON.parse 调试。
- 日志和 API 字段中的嵌套 JSON。

```json
{
  "name": "JSON Escape & Unescape",
  "description": "Escape raw text or JSON content into a JSON-safe string and unescape JSON string literals back to readable text. Handle quotes, backslashes, line breaks, tabs, control characters, and Unicode escapes directly in your browser.",
  "hero": {
    "trustHtml": "Runs in your browser. Your input is not uploaded by this tool."
  },
  "meta": {
    "title": "JSON Escape and Unescape – Free Online Tool",
    "description": "Escape or unescape JSON strings online. Convert quotes, backslashes, newlines, tabs, control characters, and Unicode escapes for nested JSON, logs, API fields, and code. Free and browser-based.",
    "keywords": [
      "json escape",
      "json unescape",
      "escape json",
      "unescape json",
      "json string escape",
      "json string unescape",
      "escaped json",
      "json escape tool"
    ]
  },
  "features": [
    {
      "icon": "lucide:shield",
      "title": "Escape JSON Strings",
      "description": "Convert raw text or JSON content into a JSON-safe string representation with escaped quotes, backslashes, line breaks, tabs, and other required control characters."
    },
    {
      "icon": "lucide:undo-2",
      "title": "Unescape JSON Strings",
      "description": "Decode valid JSON string escape sequences such as \\\" , \\\\, \\n, \\t, \\r, and \\uXXXX back into readable text or JSON content."
    },
    {
      "icon": "lucide:layers-2",
      "title": "Handle Nested JSON Strings",
      "description": "Work with JSON stored inside another JSON string, log field, database column, environment variable, or API response. Review the escaping depth before applying the operation again."
    },
    {
      "icon": "lucide:braces",
      "title": "JSON String and Document Modes",
      "description": "Distinguish between escaping a string value and serializing an entire JSON document. The output mode should make clear whether surrounding JSON string quotes are included."
    },
    {
      "icon": "lucide:copy",
      "title": "Copy the Result",
      "description": "Copy the escaped or unescaped output to your clipboard for use in JSON payloads, code, logs, tests, configuration files, and debugging workflows."
    },
    {
      "icon": "lucide:download",
      "title": "Download Text",
      "description": "Download the result as a plain text file when the escaped content is large or needs to be reused in another tool."
    },
    {
      "icon": "lucide:refresh-cw",
      "title": "Swap Directions",
      "description": "Move the output back into the input area to inspect the reverse operation. Repeated escaping increases the escaping depth, so use this only when another serialization layer is intentional."
    },
    {
      "icon": "lucide:shield-check",
      "title": "Browser-Based Processing",
      "description": "Escaping and unescaping happen in your browser. The page does not require an account or upload the input to a remote service."
    }
  ],
  "guide": [
    {
      "title": "Enter text or an escaped string",
      "description": "Paste raw text, a JSON string literal, escaped JSON from a log, or a field copied from an API response. Choose the operation that matches the current representation."
    },
    {
      "title": "Choose Escape or Unescape",
      "description": "Use Escape to encode text for use inside a JSON string. Use Unescape to decode valid JSON escape sequences and recover the represented text."
    },
    {
      "title": "Check the quoting mode",
      "description": "Confirm whether the output should include the surrounding JSON string quotes or only return the inner escaped content. This distinction affects how the result is embedded."
    },
    {
      "title": "Review nested escaping",
      "description": "If the input already contains sequences such as \\\\\" or \\\\\\\\, it may be escaped more than once. Do not apply Escape repeatedly unless another JSON or string serialization layer is required."
    },
    {
      "title": "Copy or download",
      "description": "Copy the processed result or download it as text. Test the output with the parser or programming language that will consume it."
    }
  ],
  "example": {
    "title": "JSON Escape Example",
    "description": "Escape a JSON document so it can be stored as the value of another JSON string.",
    "input": "{\"name\":\"Alice\",\"message\":\"She said \\\"OK\\\"\",\"path\":\"C:\\\\Users\\\\test\"}",
    "output": "\"{\\\"name\\\":\\\"Alice\\\",\\\"message\\\":\\\"She said \\\\\\\"OK\\\\\\\"\\\",\\\"path\\\":\\\"C:\\\\\\\\Users\\\\\\\\test\\\"}\"",
    "inputLabel": "JSON Text",
    "outputLabel": "JSON String Literal",
    "note": "The output includes surrounding quotes because the entire JSON document is represented as one JSON string value. If your application expects only the inner content, use the output mode implemented by the page.",
    "useCase": "Embed a JSON payload as a string inside another JSON document, log record, test fixture, or API field."
  },
  "faq": [
    {
      "question": "What does JSON escaping do?",
      "answer": "JSON escaping encodes text so it can safely appear inside a JSON string. It adds escape sequences for characters that would otherwise change the string syntax, including double quotes, backslashes, line breaks, tabs, carriage returns, backspace, and form feed."
    },
    {
      "question": "What does JSON unescaping do?",
      "answer": "JSON unescaping decodes valid JSON escape sequences back into the characters they represent. For example, \\\" becomes a double quote, \\\\ becomes one backslash, and \\n becomes a line break."
    },
    {
      "question": "Does Escape add surrounding double quotes?",
      "answer": "There are two common outputs: a complete JSON string literal includes surrounding double quotes, while string content mode returns only the escaped characters inside the string. Check the selected mode or output description before embedding the result."
    },
    {
      "question": "What is the difference between escaping a JSON string and escaping a JSON document?",
      "answer": "A JSON string contains text and must escape characters that conflict with string syntax. A JSON document is already structured JSON. To embed the whole document inside another JSON string, serialize the document as text first and then escape or stringify that text."
    },
    {
      "question": "Which characters must be escaped in a JSON string?",
      "answer": "Double quotes and backslashes must be escaped. JSON also defines escapes for control characters including backspace, form feed, line feed, carriage return, and tab. A Unicode escape such as \\uXXXX may be used for characters when needed. Escaping the forward slash is optional in standard JSON."
    },
    {
      "question": "Can Unicode characters appear directly in JSON?",
      "answer": "Yes. Valid Unicode characters such as Chinese text, accented letters, and emoji can generally appear directly in a JSON string. They do not need to be converted to \\uXXXX unless a downstream system requires escaped Unicode or the output mode is configured to do so."
    },
    {
      "question": "Why does my output contain too many backslashes?",
      "answer": "The input may already be escaped, or the value may be nested inside more than one string serialization layer. Each additional JSON string layer adds another level of escaping. Inspect the actual representation and unescape one layer at a time."
    },
    {
      "question": "How do I unescape JSON from an API response or log?",
      "answer": "Copy the field containing the escaped JSON string, choose Unescape, and review whether the result becomes readable text or a valid JSON document. If it is still escaped, the value may contain multiple serialization layers."
    },
    {
      "question": "Does this tool parse escaped JSON into an object?",
      "answer": "Escaping and parsing are different operations. An unescape operation can recover the JSON text, but converting that text into an object requires JSON parsing. Use a JSON viewer or parser after unescaping when you need to inspect the structure."
    },
    {
      "question": "What is the difference between JSON escaping and HTML encoding?",
      "answer": "JSON escaping uses backslash sequences such as \\\" and \\\\ inside JSON strings. HTML encoding uses entities such as &quot; and &amp;. They solve different syntax and context problems and are not interchangeable."
    },
    {
      "question": "Is JSON escaping the same as JavaScript string escaping?",
      "answer": "They overlap but are not identical in every detail. JSON supports a specific set of escape sequences, while JavaScript string literals may support additional syntax such as single-quoted strings, hexadecimal escapes, or other language-specific forms. Use the escaping rules required by the target context."
    },
    {
      "question": "Can I use this tool for JSONL?",
      "answer": "Only when the input is processed as independent lines and each line is valid for the selected operation. JSONL may contain escaped newlines or multiline quoted content, so line-by-line processing is not always equivalent to parsing one JSON document."
    },
    {
      "question": "Can I load input from a URL?",
      "answer": "The recommended input is pasted text or a local file. Arbitrary URL loading can fail because of CORS and can expose remote or private data to the browser. Add URL input only if it is explicitly implemented with URL validation, size limits, and appropriate security controls."
    },
    {
      "question": "Is there a size limit?",
      "answer": "The practical limit depends on browser memory, input length, rendering, and the number of escaping layers. Small and medium strings should process quickly, while very large files may slow down the page or require local streaming tools."
    },
    {
      "question": "Is my input uploaded to a server?",
      "answer": "This page is designed to process the input in your browser without requiring a server upload. You should still avoid entering passwords, API keys, access tokens, private customer data, or confidential production logs into any browser-based tool."
    }
  ],
  "article": {
    "title": "How to Escape and Unescape JSON Strings",
    "content": "<h2>What Is JSON String Escaping?</h2><p>JSON string escaping converts text into a representation that can safely appear inside a JSON string. Double quotes, backslashes, and control characters have special meaning in JSON, so they must be represented with escape sequences when they occur as content.</p><p>For example, the text <code>She said \"hello\"</code> contains double quotes. As JSON string content, it can be represented as <code>She said \\\"hello\\\"</code>. The escaping changes the representation, not the intended text.</p><h2>JSON Escape Sequences</h2><p>Standard JSON defines a limited set of escape sequences for string values:</p><ul><li><strong><code>\\\"</code>:</strong> double quote</li><li><strong><code>\\\\</code>:</strong> backslash</li><li><strong><code>\\n</code>:</strong> line feed</li><li><strong><code>\\r</code>:</strong> carriage return</li><li><strong><code>\\t</code>:</strong> horizontal tab</li><li><strong><code>\\b</code>:</strong> backspace</li><li><strong><code>\\f</code>:</strong> form feed</li><li><strong><code>\\uXXXX</code>:</strong> a Unicode escape using four hexadecimal digits</li></ul><p>Escaping the forward slash as <code>\\/</code> is allowed but not generally required. JSON does not support every escape syntax accepted by programming languages, so sequences such as <code>\\a</code>, <code>\\v</code>, and <code>\\0</code> should not be assumed to be valid JSON escapes.</p><h2>Escaping a String vs Escaping a JSON Document</h2><p>A raw text string and a complete JSON document are related but different inputs. If you want to embed a JSON document inside another JSON string, the document must become string content:</p><pre><code>{\"event\":\"created\"}</code></pre><p>may become a JSON string literal similar to:</p><pre><code>\"{\\\"event\\\":\\\"created\\\"}\"</code></pre><p>The outer quotes indicate that the entire document is now one JSON string value. If you only need the inner escaped content, the surrounding quotes may be omitted depending on the target context.</p><h2>How to Escape JSON</h2><ol><li><strong>Enter raw text or JSON:</strong> Paste the content you need to embed or serialize.</li><li><strong>Choose the output mode:</strong> Decide whether the result should include the complete JSON string literal or only its inner content.</li><li><strong>Escape once:</strong> Convert quotes, backslashes, and control characters according to JSON string rules.</li><li><strong>Review the output:</strong> Check the number of escaping layers and confirm that the destination expects a JSON string.</li><li><strong>Test with a parser:</strong> Use the target language or JSON parser to confirm that the result decodes to the intended value.</li></ol><h2>How to Unescape JSON</h2><ol><li><strong>Paste the escaped value:</strong> Use a string copied from a log, database field, environment variable, or API response.</li><li><strong>Identify the layer:</strong> Check whether the value includes outer quotes and whether it has been escaped more than once.</li><li><strong>Unescape one layer:</strong> Decode the JSON string representation.</li><li><strong>Inspect the result:</strong> Determine whether it is readable text or valid JSON that should be parsed next.</li><li><strong>Repeat only when necessary:</strong> Decode another layer only if the data was intentionally serialized multiple times.</li></ol><h2>Nested JSON and Double Escaping</h2><p>Nested JSON is common when one JSON field contains another JSON document as a string:</p><pre><code>{\"payload\":\"{\\\"id\\\":1,\\\"status\\\":\\\"ok\\\"}\"}</code></pre><p>The outer document contains a string, and the string's content happens to be JSON text. To inspect the inner object, decode the string value and then parse the resulting JSON. Removing backslashes manually without respecting the serialization layers can corrupt the data.</p><h2>Use JSON.stringify and JSON.parse When Coding</h2><p>When writing application code, prefer the standard JSON library instead of manually replacing characters. In JavaScript, <code>JSON.stringify(value)</code> produces a JSON representation with the required escaping, and <code>JSON.parse(text)</code> parses JSON and decodes valid string escapes. Similar standard-library functions exist in Python, Java, C#, Go, and other languages.</p><p>An online escape tool is useful for inspection and one-off transformations, but application code should rely on a tested serializer and parser.</p><h2>JSON Escaping Is Not HTML Encoding</h2><p>JSON escaping and HTML encoding target different contexts. JSON uses backslash sequences inside string values, while HTML uses entities such as <code>&amp;quot;</code> and <code>&amp;amp;</code>. Escaping a value for JSON does not automatically make it safe for HTML, JavaScript, SQL, URLs, or shell commands.</p><h2>Unicode and Surrogate Pairs</h2><p>Unicode characters can normally appear directly in JSON. A serializer may choose to leave them readable or emit Unicode escapes. Characters outside the Basic Multilingual Plane, including many emoji, may be represented using surrogate-pair escapes in UTF-16-based environments, so do not assume every visible character maps to one <code>\\uXXXX</code> sequence.</p><h2>Common Mistakes</h2><ul><li><strong>Double escaping:</strong> Applying Escape to content that is already escaped.</li><li><strong>Manual backslash removal:</strong> Deleting backslashes without parsing the JSON string.</li><li><strong>Wrong context:</strong> Using JSON escaping where HTML, SQL, URL, or JavaScript-specific encoding is required.</li><li><strong>Confusing text with an object:</strong> Unescaping a JSON string does not automatically parse the resulting text into an object.</li><li><strong>Invalid escape sequences:</strong> Using language-specific escapes that are not valid in JSON.</li><li><strong>Incorrect outer quotes:</strong> Embedding inner escaped content where the target expects a complete JSON string literal, or the reverse.</li></ul><h2>Browser-Based Privacy</h2><p>This tool is designed to escape and unescape input in the browser rather than sending it to a remote service. That is convenient for development data, logs, and test fixtures, but it is not a secret-management system. Avoid entering credentials, access tokens, private keys, customer information, or confidential production logs into any online tool.</p>"
  },
  "ui": {
    "label_input": "Input Text",
    "label_output": "Output",
    "btn_escape": "Escape",
    "btn_unescape": "Unescape",
    "btn_swap": "Swap",
    "btn_copy": "Copy",
    "btn_download": "Download TXT",
    "option_include_quotes": "Include surrounding quotes",
    "option_decode_layers": "Decode one layer",
    "status_escaped": "Escaped JSON string",
    "status_unescaped": "Unescaped text",
    "status_invalid": "Input is not a valid JSON string representation",
    "placeholder_output": "Output will appear here..."
  }
}
```

## 主要调整说明

### 1. 重新定义“escape”对象

原配置中：

> Escape or unescape JSON strings

这个方向对，但需要进一步区分：

```text
Raw text
```

和：

```text
JSON string literal
```

例如原始文本：

```text
She said "OK"
```

JSON string literal：

```json
"She said \"OK\""
```

如果输出只包含：

```text
She said \"OK\"
```

它是“escaped string content”，但还不是一个完整 JSON string literal，因为缺少外层双引号。

OpenReplay 的实际工具明确支持两种输入形式：带外层引号的完整 literal，以及不带外层引号的内部 content。 因此新版增加： [openreplay](https://openreplay.com/tools/json-escape/)

```text
option_include_quotes
```

这是该页面非常值得加入的功能。

### 2. 修正 JSON 转义字符说明

原配置中的字符列表基本正确，但需要补充：

- `\/` 是可选转义，不是必须转义。
- 普通 Unicode 字符通常可以直接出现。
- `\uXXXX` 不是所有 Unicode 字符的唯一表示方式。
- emoji 可能需要 surrogate pair。
- JSON 不支持 JavaScript、Python 或 C 风格的所有 escape sequence。

Jsonic 的参考页面明确列出 JSON 支持的转义，包括 `\"`、`\\`、`\/`、`\b`、`\f`、`\n`、`\r`、`\t` 和 `\uXXXX`，并说明 `JSON.stringify()` 会自动处理这些规则。 [jsonic](https://jsonic.io/guides/json-string-escaping)

因此新版将原来的：

> any character using the `\uXXXX` Unicode escape

改成：

> A Unicode escape such as `\uXXXX` may be used when needed.

### 3. 增加“unescape 一层”的概念

现实中经常出现多重嵌套：

```json
{
  "payload": "{\"id\":1,\"status\":\"ok\"}"
}
```

甚至：

```text
"{\\\"id\\\":1}"
```

这时用户不能简单点击一次 unescape 就期望直接得到 object。JSON Tools 和 JSONFiddle 的真实 SERP 内容已经把：

- outer quotes。
- double-escaped strings。
- one layer / multiple layers。
- database column。
- logs。
- API response。

作为明确场景。 [jsonfiddle](https://www.jsonfiddle.com/tools/escape)

因此新版增加：

```text
option_decode_layers
```

并将操作描述为：

> Decode one layer

而不是承诺一次处理所有多重转义。

### 4. 删除 URL Input feature

原配置中：

```text
Load JSON from URL using ?url= parameter
```

对于 Escape/Unescape 工具而言价值较低，风险较高：

- URL 可能带 token。
- URL 内容可能很大。
- CORS 可能失败。
- 远程内容可能不是 JSON。
- 页面可能被误用来读取私有数据。

新版将其删除，并保留 FAQ 解释。如果以后确实支持 URL，应至少加入：

- URL scheme 校验。
- 响应大小限制。
- Content-Type 检查。
- CORS 失败提示。
- 不携带 credentials。
- 禁止本地或私有网络地址。
- 不把 URL 参数写入日志。

### 5. JSONL 支持不能直接承诺

原 FAQ：

> Each line will be processed with the same escaping rules.

这可能不准确，因为 JSONL 可能包含：

- escaped newline。
- quoted multiline field。
- 一个 JSON object 中含有嵌套 JSON string。
- 不是每一行都合法。
- 文件末尾空行。
- 不同层级的 escaping。

因此新版改为：

> Only when the input is processed as independent lines and each line is valid for the selected operation.

如果要真正支持 JSONL，建议单独增加 UI：

```text
Input mode:
- Text/String
- JSON document
- JSONL / NDJSON
```

并逐行报告：

```text
Line 17: invalid JSON string
```

### 6. 增加 `JSON.stringify()` / `JSON.parse()` 说明

这是非常重要的技术边界。

开发者不应该在生产代码中手工做：

```js
text.replaceAll('"', '\\"')
```

而应该使用：

```js
JSON.stringify(value)
JSON.parse(text)
```

OpenReplay、JSONFiddle 和 Jsonic 的 SERP 内容都将标准库序列化/解析作为正确实现方式。 [openreplay](https://openreplay.com/tools/json-escape/)

因此新版文章专门加入：

> Use JSON.stringify and JSON.parse When Coding

这个内容既有教育价值，也避免把在线工具包装成生产编码替代品。

## 真实 SERP 下的竞争情况

当前 SERP 已经不是简单的“加反斜杠工具”，主要竞争方向包括：

| 竞争方向 | 典型能力 |
|---|---|
| 基础 Escape/Unescape | quotes、backslashes、newlines、tabs |
| JSON string literal | outer quotes 可选 |
| Double escaping | 多重序列化层处理 |
| JSON parsing | unescape 后直接解析为 object |
| Unicode | `\uXXXX`、surrogate pairs |
| Logs/API | 嵌套 JSON 字符串 |
| 双向操作 | Escape/Unescape toggle |
| 本地处理 | browser-only/no upload |
| 编程参考 | JSON.stringify / JSON.parse 示例 |

 [openreplay](https://openreplay.com/tools/json-escape/)

因此，基础功能最低应包括：

1. Escape raw text。
2. Unescape valid JSON string。
3. 外层引号可选。
4. 正确处理 quotes/backslashes/control characters。
5. Unicode 不被无意义地破坏。
6. 明确区分 string content 和 JSON document。
7. 一层一层处理 double escaping。
8. 错误提示。
9. Copy/download。
10. 浏览器本地处理。

## SEO 关键词和落地页策略

这个页面的主词较具体，适合做独立工具页：

```text
/tools/json-escape
```

建议主关键词：

```text
json escape
json unescape
escape json
unescape json
json string escape
json string unescape
escaped json
```

报告中的其他词适合做相关内容或 FAQ：

```text
convert string to json
json string to json object
json stringify online
convert json to string
json stringify to json
json encode
```

不建议把这些词全部放进当前页面的 meta keywords，因为它们对应不同的操作：

- `json stringify online`：用户可能想把 object stringify 成 string。
- `json string to json object`：用户想 parse，而不只是 unescape。
- `convert json to string`：可能需要普通序列化或 JSON.stringify。
- `json encode`：可能涉及 URL encoding、Base64 或 HTML encoding。

更好的页面集群是：

```text
/tools/json-escape
/tools/json-unescape
/tools/json-stringify
/tools/json-parse
/tools/json-encode
```

其中 Escape/Unescape 可以先合并，Stringify/Parse 则建议以后单独建立页面，因为用户意图不同。

## 建议的未来产品规划

### 第一阶段：正确实现基础语义

- Escape raw text。
- Unescape JSON string literal。
- 选项：是否包含外层引号。
- 处理 quotes、backslashes、`\n`、`\r`、`\t`、`\b`、`\f`。
- 正确处理 Unicode。
- Copy/download。
- 输入错误提示。
- 处理一个 escape layer。

### 第二阶段：开发者常见场景

- Double escaping detection。
- Decode one layer / multiple layers。
- Unescape 后自动检测是否为 JSON document。
- Unescape → Parse → Format。
- `JSON.stringify` 模式。
- `JSON.parse` 模式。
- JSONL / NDJSON 模式。
- 输入文件。
- 多行错误定位。

### 第三阶段：上下文编码工具

- JSON string escape。
- JavaScript string escape。
- Python string literal。
- SQL string escaping。
- HTML attribute escaping。
- URL encoding。
- Base64 encode/decode。
- CSS/Regex escaping。

这些功能必须拆成明确的 context，因为 JSON escaping、HTML encoding、URL encoding、SQL escaping 并不可互换。不能将它们全部统称为“escape”。

## 页面优先级判断

| 维度 | 评价 |
|---|---|
| 搜索需求 | 中等 |
| 工具意图 | 很强 |
| 主词竞争 | 中等 |
| 技术实现难度 | 中等 |
| 产品匹配度 | 很高 |
| 初期流量难度 | 中等 |
| 长尾扩展空间 | 高 |
| 与其他 JSON 工具复用度 | 很高 |

这个页面的初期流量难度低于 JSON Editor、JSON Formatter 和 JSON Schema Generator，但单个关键词的搜索量通常不如 JSON to CSV、JSON Viewer 等大词。它的价值在于：

- 需求非常明确。
- 用户通常立即使用工具。
- 页面容易实现。
- 可以与 JSON Parser、Formatter、Viewer、Stringify 形成内部工具链。
- 多重转义和 API/log 场景有较好的长尾扩展空间。

最终判断是：**JSON Escape & Unescape 值得做，但页面必须严格区分字符串转义、JSON 文档序列化、JSON 解析和其他上下文编码。** 真实竞争者已经开始支持外层引号、多重转义和 JSON parse 联动；如果只做简单的字符串替换，能覆盖基础关键词，但很难建立长期竞争力。