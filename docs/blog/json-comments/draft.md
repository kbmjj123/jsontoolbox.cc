## 文章元信息（建议）

**URL**

- `/guides/json-comments`

**Title（≤ 60 字符）**

- Comments in JSON: Why Not Allowed & What to Use

**Meta Description（≤ 155 字符）**

- JSON doesn’t allow comments. Learn why, plus safe workarounds: JSONC, JSON5, `_comment` keys, and converting JSONC to standard JSON in the browser.

**H1**

- Comments in JSON: Why They’re Not Allowed and What to Use Instead

***

## Can you put comments in a JSON file?

**Short answer:** No. Standard JSON does not allow comments of any kind.

If you add `//`, `/* */`, or `#` to a `.json` file and try to parse it with a strict JSON parser (for example `JSON.parse` in JavaScript, `json.loads` in Python, or `jq`), you will get a syntax error.

Example (invalid JSON):

```jsonc
{
  // This is not valid JSON
  "name": "Ada",
  "age": 30
}
```

Trying to parse this with `JSON.parse` will throw:

```text
SyntaxError: Unexpected token / in JSON at position 4
```

According to the official JSON specification (RFC 8259 and ECMA-404), comments are simply not part of the grammar. A file that contains comments is not valid JSON, even if everything else looks correct. [jsonlint](https://jsonlint.com/json-comments)

***

## Why doesn’t JSON allow comments?

JSON was designed as a **data-only** interchange format, not as a configuration or programming language.

Douglas Crockford, who popularized JSON, has explained that he removed comments after seeing people use them for “parsing directives” and other implementation-specific hacks. That broke interoperability: different parsers would interpret the same file in different ways.

To keep JSON:

- easy to implement  
- highly interoperable  
- strictly defined  

comments were intentionally excluded. The result is a very small, well-specified format that is easy to parse in any language, but also one that does not support inline documentation. [formatarc](https://formatarc.com/en/blog/json-comments/)

***

## What happens if you add comments to a JSON file?

If you treat a file as strict JSON, any comment syntax will make it invalid. Common patterns that all fail in standard JSON:

```jsonc
// Single-line comment (invalid)
{
  "name": "Ada"  // inline comment (invalid)
}

/*
  Block comment (invalid)
*/
{
  "users": [
    /* { "id": 1, "name": "Ada" } */
    { "id": 2, "name": "Lin" }
  ]
}
```

Typical errors you will see:

- JavaScript: `SyntaxError: Unexpected token / in JSON`  
- Python: `json.decoder.JSONDecodeError`  
- CLI tools like `jq`: `parse error: Invalid numeric literal`  

In other words: once you add comments, the file is no longer “JSON” in the RFC sense. It becomes JSONC, JSON5, or some custom variant, depending on what extra syntax you use. [jsonlint](https://jsonlint.com/json-comments)

***

## Workarounds: How to “comment” in JSON files

If you must stay within strict JSON but still want some form of documentation, there are a few common workarounds.

### 1. Use a dedicated comment key

A widely used pattern is to reserve a special key for comments:

```json
{
  "_comment": "User schema for internal analytics pipeline",
  "version": "1.2.0",
  "fields": [
    {
      "name": "user_id",
      "type": "string",
      "_comment": "Primary key, must be unique"
    }
  ]
}
```

Variants include:

- `"_comment"`  
- `"__comment__"`  
- `"//"`  
- `"description"` / `"doc"`  

**Pros:**

- Valid standard JSON; any parser can read it.  
- Comments travel with the data, useful for self-describing schemas.  

**Cons:**

- Comments become part of the data model.  
- You must ensure your application ignores these keys in production.  
- Can clutter the structure if overused.  

This approach is common in schema files, example payloads, and documentation-oriented JSON. 

### 2. Keep comments in a separate file

Another pattern is to keep the JSON file pure and store documentation separately:

- `config.json` – strict JSON, used at runtime.  
- `config.schema.json` or `README.md` – describes fields, constraints, and examples.  

**Pros:**

- Runtime JSON stays minimal and strictly valid.  
- Documentation can be richer (Markdown, examples, diagrams).  

**Cons:**

- Documentation can drift from the actual data.  
- Requires discipline to keep both in sync.  

This is often the best choice for APIs and data pipelines where the JSON must be consumed by many systems.

***

## JSONC, JSON5, and HJSON: Extensions that support comments

When you need real comments (not just data fields), the usual solution is to switch to a superset or variant of JSON.

### JSONC – JSON with Comments

**JSONC** (JSON with Comments) is a minimal extension of JSON that adds:

- `// single-line` comments  
- `/* block */` comments  

Everything else remains standard JSON: keys must be quoted, strings use double quotes, no special number formats, etc. 

Typical use cases:

- VS Code configuration files (`settings.json`, `keybindings.json`)  
- TypeScript config (`tsconfig.json`)  
- Other editor / tool configs that benefit from inline notes  

Many tools explicitly say they accept “JSONC” rather than “JSON” when they allow comments.

### JSON5 – JSON for humans

**JSON5** is a more relaxed format designed to be easier for humans to write. It supports:

- `//` and `/* */` comments  
- Trailing commas in objects and arrays  
- Unquoted keys (in many cases)  
- Single-quoted strings  
- Additional number formats (e.g. hexadecimal, `NaN`, `Infinity`)  
- Multi-line strings (in some implementations)  

Example:

```json5
{
  // User profile in JSON5
  name: 'Ada',
  age: 30,
  roles: [
    'admin',
    'editor', // trailing comma is OK
  ],
}
```

JSON5 is useful for config files and human-edited data, but it is further away from strict JSON than JSONC. 

### HJSON – Human JSON

**HJSON** focuses even more on human readability:

- Comments (`#` for single-line, `/* */` for block)  
- Optional quotes for keys and string values (in many cases)  
- More flexible whitespace and line breaks  

It is less widely adopted than JSONC/JSON5, but appears in some tooling and configuration ecosystems where readability is prioritized over strictness. 

### Quick comparison

| Feature                     | JSON (RFC 8259) | JSONC            | JSON5                     | HJSON                  |
|----------------------------|-----------------|------------------|---------------------------|------------------------|
| `//` comments              | ❌              | ✅               | ✅                        | ✅ (also `#`)          |
| `/* */` block comments     | ❌              | ✅               | ✅                        | ✅                     |
| Trailing commas            | ❌              | Sometimes tolerated | ✅                     | ✅                     |
| Unquoted keys              | ❌              | ❌               | ✅ (in many cases)        | ✅ (in many cases)     |
| Single-quoted strings      | ❌              | ❌               | ✅                        | ✅                     |
| Extra number formats       | ❌              | ❌               | ✅ (hex, `NaN`, `Infinity`)| Limited               |
| Primary goal               | Data interchange| Config with comments | Human-friendly config   | Human-friendly config  |
| Typical use                | APIs, data files| VS Code, TS config| Config files, scripts     | Niche configs          |

For most developer workflows that just need comments, **JSONC is the smallest, safest step away from strict JSON**. If you want a more JavaScript-like syntax, JSON5 is the next level. 

***

## Why VS Code’s `settings.json` allows comments

If you’ve edited VS Code’s `settings.json`, you may have noticed that comments work without errors:

```jsonc
// settings.json (actually JSONC)
{
  "editor.fontSize": 14,
  // Disable minimap for large files
  "editor.minimap.enabled": false
}
```

This is possible because VS Code does **not** treat these files as strict JSON. They are **JSONC** files.

Key points:

- VS Code’s JSON language service explicitly enables “comments allowed” mode for files like `settings.json`, `keybindings.json`, and `tsconfig.json`.  
- These files are documented as supporting “JSON with comments”, i.e. JSONC.  
- The same content would be invalid if you tried to parse it with a strict JSON parser outside VS Code.  

So when you see “JSON” in VS Code docs but comments work, what’s really happening is: **the editor is using a JSON superset under the hood**. 

***

## Converting JSONC to JSON: Why regex is not enough

Once you have JSONC (or JSON5) with comments, a common need is to convert it back to standard JSON—for example, before sending it to an API or storing it in a system that only accepts strict JSON.

### The regex temptation

A naive approach is to strip comments with a regular expression, something like:

- Remove `// ...` to end of line  
- Remove `/* ... */` blocks  

This can work for very simple cases, but it is **not safe** for real-world files.

### Where regex breaks

Consider this JSONC:

```jsonc
{
  "url": "https://example.com//path",
  "pattern": "/* match all */",
  "note": "Use // for comments in code, not in JSON"
}
```

A simple regex that removes `//` and `/* */` will:

- Corrupt the `"url"` value, turning it into `"https://example.com"`  
- Destroy the `"pattern"` string, leaving `"pattern": ""` or invalid JSON  
- Potentially break escaping and quotes, producing invalid output  

The core issue: **comments and string literals can contain the same characters**. Only a parser that understands the full JSONC grammar can reliably tell the difference. 

### The correct approach

The safe way to convert JSONC to JSON is:

1. Parse the input with a **JSONC-aware parser** (or a JSON5 parser if needed).  
2. Walk the AST and remove comment nodes.  
3. Serialize the remaining structure back to standard JSON.  

Libraries that follow this pattern include:

- `jsonc-parser` (used by VS Code)  
- `strip-json-comments` (carefully designed, but still regex-based; suitable only when you control the input shape)  
- Language-specific JSONC/JSON5 parsers in Python, Go, etc.  

This ensures that:

- Strings containing `//` or `/*` are preserved.  
- Escaping and Unicode are handled correctly.  
- The output is guaranteed to be valid JSON. 

***

## Practical options for working with JSON with comments

Depending on your use case, there are several practical ways to handle JSON with comments.

### 1. Use a JSONC-aware parser in your code

If you control the runtime, the cleanest solution is to parse JSONC directly:

**Node.js (using `jsonc-parser`):**

```js
import { parse } from 'jsonc-parser';

const jsoncText = await fs.readFile('config.jsonc', 'utf8');
const data = parse(jsoncText);
// `data` is a normal JS object; comments are ignored
```

**Python (using a JSON5 library as a superset):**

```python
import json5

with open("config.json5", "r") as f:
    data = json5.load(f)
```

This is ideal for config files that are edited by humans but consumed by your own code.

### 2. Strip comments as a build step

For pipelines that must consume strict JSON, you can:

- Keep source files as JSONC/JSON5.  
- Run a build step that converts them to `.json` before deployment or distribution.  

Tools you can use:

- `strip-json-comments` (Node.js)  
- Custom scripts using `jsonc-parser`  
- Online converters for one-off files  

This keeps your runtime simple while allowing developers to write commented configs. 

### 3. Use an online JSONC to JSON converter

For quick, one-off conversions, an online tool can be convenient.

**JsonToolBox JSONC to JSON converter**

- URL: `/tools/jsonc-to-json`  
- What it does:  
  - Accepts JSONC input (JSON with `//` and `/* */` comments, optional trailing commas).  
  - Parses it in the browser using a JSONC-aware parser.  
  - Outputs strict, minified or pretty-printed JSON.  
- What it does **not** do:  
  - It does not support full JSON5 syntax (unquoted keys, single quotes, special number formats, etc.).  
  - It does not perform complex transformations or grid-style visualizations; it is a focused converter.  

Typical use cases:

- Converting `settings.json` / `tsconfig.json` snippets to pure JSON for CI tools that don’t accept comments.  
- Cleaning up JSONC examples before pasting them into APIs, validators, or documentation that requires strict JSON.  
- Quickly checking whether a JSONC file can be represented as valid JSON once comments are removed.  

Because the conversion runs entirely in your browser, no data is uploaded to a server, which is useful when working with internal configs or semi-sensitive data. [jsonlint](https://www.jsonlint.com/jsonc-to-json)

### 4. Consider YAML or TOML for complex configs

If your configuration needs:

- extensive comments  
- multi-line strings  
- rich structure  

you might consider using **YAML** or **TOML** instead of JSON/JSONC.

- YAML is widely used for configs (CI, Kubernetes, etc.) and has excellent comment support.  
- TOML is designed to be easy to read and write, with clear comment syntax.  

You can still use JSON for data interchange and APIs, while keeping human-facing configs in YAML/TOML.

***

## FAQ

### Can you make comments outside the brackets in JSON?

No. Standard JSON does not allow comments anywhere in the file, whether inside or outside the top-level `{}` or `[]`. Any `//`, `/* */`, or `#` outside the brackets still makes the file invalid JSON. [jsonlint](https://jsonlint.com/json-comments)

### Is JSONC valid JSON?

Strictly speaking, **no**. JSONC is a superset of JSON. All valid JSON is valid JSONC, but JSONC with comments is not valid JSON according to RFC 8259. Many tools accept JSONC and treat it as “JSON with comments”, but a strict JSON parser will reject it. 

### How do I remove comments from a JSON file?

If your file is actually JSONC:

1. Use a JSONC-aware parser or library to strip comments safely.  
2. Or use an online converter (e.g. JsonToolBox JSONC to JSON) to remove comments and get strict JSON.  

Avoid naive regex-based stripping on untrusted or complex inputs, as it can corrupt strings that contain `//` or `/*`. [jsonlint](https://www.jsonlint.com/jsonc-to-json)

### Can I use `_comment` keys in production JSON?

Yes, `_comment` (or similar) keys are valid JSON. Just ensure:

- Your runtime code ignores these keys.  
- They don’t end up in logs or responses where they’re not needed.  

This pattern is common in schema files and example payloads, but less common in high-performance or minimal data formats. 

### When should I use JSONC vs JSON5?

- Use **JSONC** if you mainly need comments and want to stay close to standard JSON.  
- Use **JSON5** if you want a more JavaScript-like syntax (unquoted keys, trailing commas, single quotes, etc.) for human-edited configs.  

For maximum compatibility with existing tools, JSONC is usually the safer choice. 

***

如果你需要，我可以下一步：  
- 按这个结构直接输出适配 Nuxt 的 Markdown 文件（含 frontmatter、目录、内部链接占位符）。  
- 或者先帮你把中文版完整写出来，再做英文对齐。