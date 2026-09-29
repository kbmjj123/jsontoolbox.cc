---
title: "Comments in JSON: Why Not Allowed & What to Use"
description: "JSON doesn't allow comments. Learn why, plus safe workarounds: JSONC, JSON5, `_comment` keys, and converting JSONC to standard JSON in your browser."
h1: "Comments in JSON: Why They're Not Allowed and What to Use Instead"
category: "json_tools"
date: 2026-09-29
lastmod: 2026-09-29
image: "/blog/cover/en/json-comments-cover.svg"
tags:
  - "JSON"
  - "JSONC"
  - "JSON5"
  - "Configuration"
  - "Best Practices"
author: "JSON Toolbox Team"
promo:
  slug: "jsonc-to-json"
  text: "Need to strip comments from a JSONC file?"
  btn: "Open JSONC to JSON Converter"
locales:
  - "en"
---

# Comments in JSON: Why They're Not Allowed and What to Use Instead

You paste a config file into your code, call `JSON.parse()`, and get `SyntaxError: Unexpected token /`. Everything looks correct — except for the `// TODO: bump this after launch` line at the top.

Standard JSON has no comment syntax. Not `//`, not `/* */`, not `#`. This guide explains why, what actually happens when you add comments, the workarounds that keep your file valid, and how JSONC, JSON5, and HJSON fit in.

## Can you put comments in a JSON file?

**No.** Standard JSON does not allow comments anywhere in the document — not inside the top-level object or array, and not outside it either.

Both current JSON specifications define a grammar with no comment tokens:

- [RFC 8259](https://www.rfc-editor.org/rfc/rfc8259) (The JavaScript Object Notation Data Interchange Format)
- [ECMA-404](https://www.ecma-international.org/publications-and-standards/standards/ecma-404/) (The JSON Data Interchange Syntax)

A file that contains comments is not valid JSON, even when every other character is perfect:

```jsonc
{
  // Display name shown in the UI
  "name": "Ada",
  "age": 30
}
```

`JSON.parse()` on that string throws:

```text
SyntaxError: Unexpected token / in JSON at position 4
```

## Why doesn't JSON allow comments?

JSON was designed as a **data interchange format**, not as a configuration language or a programming language. Keeping the grammar tiny was a deliberate goal: a smaller grammar means more parsers, in more languages, that all agree on what a document means.

Douglas Crockford, who popularized JSON, has described removing comments from an early draft after seeing people use them to carry parsing directives — instructions that changed how a document should be interpreted. Different implementations then read the same file differently, which defeated the point of a shared interchange format. Dropping comments removed the ambiguity.

The trade-off is intentional and still visible today:

- **Gained:** a format that is trivial to parse, easy to implement, and highly interoperable.
- **Lost:** any way to document a JSON file inline.

That trade-off is why comments are the single most-requested JSON "missing feature", and why the practical answers are all workarounds or supersets.

## What happens if you add comments to a JSON file?

Every strict parser rejects the file. The error differs by tool, but the outcome is the same:

```jsonc
// Leading comment (invalid)
{
  "name": "Ada", // inline comment (invalid)
  "users": [
    /* { "id": 1, "name": "Ada" } */
    { "id": 2, "name": "Lin" }
  ]
}
```

| Parser | Typical result |
|---|---|
| `JSON.parse()` (JavaScript) | `SyntaxError: Unexpected token /` |
| `json.loads()` (Python) | `json.decoder.JSONDecodeError` |
| `jq` (CLI) | `parse error: Invalid literal` |
| `JsonDocument.Parse()` (.NET) | `JsonException` |

The moment comments go in, the file stops being JSON in the RFC sense. Depending on which extra syntax you used, it is now JSONC, JSON5, HJSON, or an unnamed custom variant — and only a parser for that variant can read it.

If your JSON is failing to parse for reasons beyond comments, see [JSON Parse Failed: 10 Common API Errors and How to Debug Them](/blog/json-parse-error-debug).

## How to comment in a JSON file: workarounds that stay valid

If the file must remain strict JSON — because an API, a package manager, or a third-party tool reads it — you have two realistic options.

### Option 1: Use a dedicated comment key

Reserve a key for documentation and put your notes in it:

```json
{
  "_comment": "Event schema for the analytics pipeline. Versioned separately from the API.",
  "version": "1.2.0",
  "fields": [
    {
      "name": "user_id",
      "type": "string",
      "_comment": "Primary key. Must be unique per tenant."
    }
  ]
}
```

Common key names include `_comment`, `__comment__`, `//`, `description`, and `doc`.

**Pros:**

- The file stays valid standard JSON; nothing special is required to read it.
- Comments travel with the data, which is useful for example payloads and self-describing schemas.

**Cons:**

- Comments become part of the data model. Anything iterating over keys will see them.
- Consumers must ignore the key. If you serve this JSON from an API, the key ships to clients.
- Heavy use clutters the structure.

This pattern works well for fixtures, sample payloads, and schema-ish documents. It is a poor fit for hot paths where payload size matters, and for documents validated with `additionalProperties: false`.

### Option 2: Keep the documentation outside the file

Keep `config.json` strict and describe it elsewhere — a `README.md`, a JSON Schema file, or your docs site.

**Pros:**

- The runtime file stays minimal and strictly valid.
- Documentation can be richer: Markdown, examples, diagrams, change history.

**Cons:**

- Documentation can drift from the data unless something enforces the link.
- Requires discipline to keep both in sync.

For public APIs and shared data pipelines, this is usually the right choice. A [JSON Schema](https://json-schema.org/docs) is the strongest version of this approach: it documents required fields, types, and ranges in a machine-checkable format. See [JSON Validation Explained: Syntax Checks vs JSON Schema Validation](/blog/json-validation-syntax-vs-schema) for how the layers fit together.

## JSONC, JSON5, and HJSON: formats that allow comments

When you need real comments, switch to a superset. Three come up in practice.

### JSONC — JSON with Comments

**JSONC** is the smallest step away from strict JSON: it adds `//` line comments and `/* */` block comments and leaves everything else alone. Keys are still quoted, strings still use double quotes, and numbers still follow the JSON grammar.

There is no formal JSONC specification — the name is a convention used by tools that accept "JSON with comments". Trailing commas are not part of the definition, but some parsers tolerate them.

Typical use: editor and tool configuration, where humans edit the file by hand and comments explain non-obvious choices.

```jsonc
{
  // Matches the deploy target in CI
  "region": "eu-central-1",
  /* Raise together with the API gateway timeout */
  "timeoutMs": 30000
}
```

### JSON5 — JSON for Humans

**JSON5** is a much more relaxed superset aimed at hand-written files. It supports:

- `//` and `/* */` comments
- Trailing commas in objects and arrays
- Unquoted keys (when they are valid identifiers)
- Single-quoted strings
- Extra number forms: hexadecimal, leading `+`, `NaN`, `Infinity`, leading and trailing decimal points
- Line continuations in strings

```json5
{
  // User profile in JSON5
  name: 'Ada',
  age: 30,
  roles: [
    'admin',
    'editor', // trailing comma is fine
  ],
}
```

JSON5 is comfortable to write and further from strict JSON than JSONC. Nothing that reads strict JSON is guaranteed to read JSON5.

### HJSON — Human JSON

**HJSON** pushes furthest toward human readability:

- Comments with `#`, `//`, and `/* */`
- Quoteless keys and string values in most cases
- Commas are optional — a newline is usually enough to separate members

It has the smallest ecosystem of the three and shows up mostly in niche configuration tooling.

### Comparison

| Feature | JSON (RFC 8259) | JSONC | JSON5 | HJSON |
|---|---|---|---|---|
| `//` comments | No | Yes | Yes | Yes |
| `/* */` comments | No | Yes | Yes | Yes |
| `#` comments | No | No | No | Yes |
| Trailing commas | No | Depends on the parser | Yes | Not applicable — commas are optional |
| Unquoted keys | No | No | Yes | Yes |
| Single-quoted strings | No | No | Yes | Yes |
| Extra number forms | No | No | Yes | Limited |
| Specification | RFC 8259 / ECMA-404 | De facto convention | [json5.org](https://json5.org/) spec | [hjson.github.io](https://hjson.github.io/) spec |
| Main goal | Data interchange | Config with comments | Human-friendly config | Human-friendly config |
| Typical use | APIs, data files | Editor configs | Hand-written configs | Niche configs |

**Rule of thumb:** if you only need comments, use JSONC. It keeps the file one comment-strip away from strict JSON. Reach for JSON5 when you also want a JavaScript-like syntax, and HJSON only when its specific readability rules are what you want.

## Why VS Code's settings.json allows comments

Open VS Code's `settings.json` and comments work fine:

```jsonc
// settings.json — this file is JSONC, not strict JSON
{
  "editor.fontSize": 14,
  // The minimap is distracting on wide screens
  "editor.minimap.enabled": false
}
```

The file is not being read as strict JSON. VS Code treats `settings.json`, `keybindings.json`, and similar files as **JSON with comments**, and its JSON language service parses them in a mode that allows comments. TypeScript does the same for `tsconfig.json`, which is why comments and trailing commas are accepted there too.

The confusing part is naming: the extension is `.json`, the docs say "JSON", and comments still work — because the consumer opted into a superset. Copy that same content into a strict parser and it fails immediately.

This is the general pattern: **comments are a property of the reader, not of the file.** A file with comments parses only when the tool on the other end agreed to accept them.

## Converting JSONC to JSON: why a regex is not enough

Eventually a JSONC file has to become strict JSON — a CI tool that rejects comments, an API request body, or a library that only accepts `application/json`. The tempting one-liner is a regular expression that deletes `//…` and `/*…*/`.

It works until it doesn't:

```jsonc
{
  "url": "https://example.com//assets",
  "pattern": "/* match everything */",
  "note": "Use // for comments in code, never in JSON"
}
```

A regex that removes `//` to end of line turns the URL into `"https://example.com"` and empties the note. A regex that removes `/* … */` destroys the pattern. The output is silently wrong, and it may still parse — which makes it worse than an error.

The root problem: **comment markers and string content can be the same characters.** Only a scanner that tracks whether it is inside a quoted string can tell them apart.

The safe procedure is:

1. Walk the input character by character (or parse it into an AST), copying quoted strings verbatim.
2. Drop comment tokens and, if you want them gone, trailing commas before `}` or `]`.
3. Parse the cleaned text with a strict JSON parser to confirm the result is valid.
4. Report a line and column for anything that is not valid.

## Practical options for working with JSON with comments

### 1. Parse JSONC directly in your own code

If you control the runtime, the cleanest fix is to let the reader accept comments, and keep comments in the source file:

```js
import { parse } from 'jsonc-parser'

// Throws on JSONC syntax errors, returns a normal JS object otherwise.
const config = parse(await fs.readFile('config.jsonc', 'utf8'))
```

```python
import json5

with open("config.json5", "r", encoding="utf-8") as f:
    config = json5.load(f)
```

Best for configs that humans edit and your own application consumes.

### 2. Strip comments as a build step

Keep JSONC in the repository and emit `.json` during the build, so the runtime never sees comments:

```bash
npm install --save-dev strip-json-comments
```

Then convert before packaging or deploying. Developers get comments; deployments get strict JSON. This is the most robust setup for pipelines with mixed tooling.

### 3. Convert JSONC to JSON in your browser

For one-off conversions, use the [JSONC to JSON Converter](/tools/convert/jsonc-to-json). Paste JSONC or open a `.jsonc`, `.json`, or `.txt` file, and it produces standard JSON.

What it does:

- Removes `//` line comments, `/* */` block comments, and trailing commas before `}` or `]`. Each has its own checkbox, and all three are on by default.
- Scans the input character by character and copies quoted strings verbatim, so `//` inside `"https://example.com/a//b"` survives.
- Parses the cleaned result as strict JSON and reports the line and column of any error, including unclosed block comments and commas with no value before them.
- Shows how many comments and trailing commas were removed.
- Outputs JSON with two-space, four-space, or minified indentation; you can copy the result or download it as `.json`.

What it does **not** do:

- **It does not parse JSON5.** Unquoted keys, single-quoted strings, hexadecimal numbers, `NaN`, and `Infinity` are reported as syntax errors.
- **It does not preserve comments.** Standard JSON has no comment syntax, so no tool can keep them in the output. Keep your original file.
- **It does not validate configuration schemas.** Converting a `tsconfig.json` checks JSON syntax only — not TypeScript, ESLint, or Webpack semantics.
- **It is not tuned for very large files.** Rendering depends on browser memory and size; for huge files, a local parser or a build-time conversion is a better fit.

Like every tool on this site, the conversion runs in your browser; the tool does not upload your JSONC.

### 4. Consider YAML or TOML for comment-heavy config

If a file needs extensive explanation, multi-line strings, or anchors and references, JSON is the wrong container.

- **YAML** is the default for CI pipelines, Kubernetes manifests, and many deployment tools, and its `#` comments are first-class.
- **TOML** is designed for hand-edited config and reads clearly, with comments throughout.

Keep JSON for data interchange and APIs, and use YAML or TOML where humans are the primary audience. When you do need to move between them, the [JSON to YAML Converter](/tools/convert/json-to-yaml) handles the JSON-to-YAML direction.

## FAQ

### Can you make comments outside the brackets in JSON?

No. Standard JSON has no comment syntax anywhere in a document — before the top-level `{`, inside it, or after the closing `}`. Any `//`, `/* */`, or `#` makes the file invalid JSON.

### Is JSONC valid JSON?

Strictly, no. All valid JSON is valid JSONC, but JSONC that actually contains comments is not valid JSON under RFC 8259. Tools that advertise JSONC support have opted into a superset.

### How do I remove comments from a JSON file?

Use a parser that understands JSONC rather than a search-and-replace. In a build pipeline, `strip-json-comments` or `jsonc-parser` will do it. For a one-off file, paste it into the [JSONC to JSON Converter](/tools/convert/jsonc-to-json), which removes comments and trailing commas while leaving string content intact, then validates the result.

Avoid regex-based stripping on files you did not write. Corrupting a URL or a pattern silently is worse than an error you can see.

### Can I use `_comment` keys in production JSON?

Yes — they are ordinary keys, so the file stays valid. Just make sure consumers ignore them, that they do not leak into responses or logs where they are noise, and that any schema validation accounts for them. With `additionalProperties: false`, an undeclared `_comment` key is rejected.

### Should I use JSONC or JSON5?

Use **JSONC** if comments are the only thing you need. It stays close to strict JSON, so a comment strip is all that separates your file from something any parser accepts. Use **JSON5** when you also want unquoted keys, trailing commas, and single-quoted strings in hand-written files.

### Will removing comments break my configuration?

Removing comments does not change the values a parser reads, but it does remove information humans need. Keep the original JSONC file and generate strict JSON only where it is required — a CI step, an API call, or a consumer that rejects comments.

### Why does my API reject JSON with comments while my editor accepts it?

Because they are different readers. Editors such as VS Code parse `settings.json` and `tsconfig.json` as JSONC. An API that declares `application/json` is almost always using a strict parser, which rejects comments by design. This applies to request bodies too: never send commented JSON to an endpoint that expects JSON.

## What's Next?

- **Have a JSONC file to clean up?** Strip comments, block comments, and trailing commas with the [JSONC to JSON Converter](/tools/convert/jsonc-to-json).
- **Working with standard JSON?** Format, validate, and minify it in the [JSON Editor](/tools/format/json-editor).
- **Config needs more than comments?** Convert to YAML with the [JSON to YAML Converter](/tools/convert/json-to-yaml).
- **Still hitting parse errors?** Read [JSON Parse Failed: 10 Common API Errors and How to Debug Them](/blog/json-parse-error-debug).
- **Designing an API?** See [JSON Best Practices in Real Projects](/blog/json-best-practices) for response structure, validation, and security.

---

*All tools on JSON Toolbox run entirely in your browser. Your data never leaves your device.*
