---
title: "How to Create a JSON File: Step-by-Step Guide"
description: "Create a JSON file on Windows, macOS, or Linux: write valid JSON, avoid the .json.txt trap, validate the result, and generate files from code."
h1: "How to Create a JSON File: Step-by-Step Guide for Beginners"
category: "json_tools"
date: 2026-09-30
lastmod: 2026-09-30
image: "/blog/cover/en/how-to-create-json-file-cover.svg"
tags:
  - "JSON"
  - "Beginners"
  - "JSON Editor"
  - "File Format"
  - "Tutorial"
author: "JSON Toolbox Team"
promo:
  slug: "json-editor"
  text: "Want to write, format, and validate JSON without installing anything?"
  btn: "Open JSON Editor"
locales: ["en"]
---

# How to Create a JSON File: Step-by-Step Guide for Beginners

A JSON file is just a text file with the `.json` extension. You do not need special software, a paid tool, or an account — Notepad, TextEdit, and VS Code can all create one.

What trips people up is rarely the writing. It is the saving: Windows silently appending `.txt`, macOS TextEdit saving rich text instead of plain text, and a missing comma that makes the file unreadable to every JSON parser.

This guide covers what a JSON file is, how to create one on each operating system, the syntax rules that decide whether your file is valid, how to validate it, and how to generate JSON files from code.

## What is a JSON file?

JSON (JavaScript Object Notation) is a plain-text data format built from two structures — objects and arrays — and six value types: string, number, boolean, null, object, and array.

A JSON file is a text file that contains JSON and uses the `.json` extension:

```json
{
  "name": "Ada Lovelace",
  "role": "engineer",
  "active": true,
  "projects": ["analytical-engine", "bernoulli-numbers"]
}
```

Per [RFC 8259](https://www.rfc-editor.org/rfc/rfc8259), the registered media type is `application/json` and the file extension is `.json`. Because it is plain text, you can read and edit it anywhere — and any programming language can parse it.

JSON files are used for:

- **Configuration:** `package.json`, `tsconfig.json`, `manifest.json`.
- **Data exchange:** API request and response bodies.
- **Saved data:** exports, fixtures, and test datasets.
- **Logs:** structured one-line records.

A JSON file has one root value. It is either an object (`{ }`) or an array (`[ ]`) in practice, and everything else nests inside it. If you are new to the format itself, start with [What Is JSON? Structure, Syntax, and Common Mistakes](/blog/what-is-json).

## How to create a JSON file with a text editor

Every operating system follows the same three steps: write the JSON, save the file with a `.json` extension as UTF-8, then validate it. The default editors differ, and each has one trap.

### Windows: Notepad or VS Code

**Notepad:**

1. Open Notepad and paste or type your JSON.
2. Choose **File → Save As**.
3. Set **Save as type** to **All Files (\*.\*)** — this is the step people skip. If it stays on "Text Documents (\*.txt)", Notepad appends `.txt` and you get `data.json.txt`.
4. Enter the full file name including the extension: `data.json`.
5. Set **Encoding** to **UTF-8**, then save. Recent versions of Notepad default to UTF-8, but check the dropdown — it is the difference between `café` and `cafÃ©`.

**VS Code** is easier: create a new file, select **JSON** as the language mode, paste the content, and save as `data.json`. VS Code validates as you type and can format the document with **Format Document**.

### macOS: TextEdit or VS Code

**TextEdit:**

1. Open TextEdit and choose **Format → Make Plain Text** (**Shift + Cmd + T**) before typing. TextEdit defaults to rich text, and saving rich text produces RTF, not JSON.
2. Paste or type your JSON.
3. In the save dialog, type the full name with the extension — `data.json` — and make sure the option to append `.txt` when no extension is given is not active.
4. Save.

**VS Code** avoids both problems and is the better default on macOS too.

### Linux: nano, gedit, or VS Code

```bash
nano data.json
```

Type or paste the JSON, then press **Ctrl + O** and **Enter** to save, **Ctrl + X** to exit. Desktop editors such as gedit and VS Code work the same way — just make sure the file name ends in `.json`.

### The saving checklist

Whatever editor you use, confirm three things before you trust the file:

| Check | Why it matters |
|---|---|
| The name ends in `.json` | The extension tells editors, servers, and tools how to treat the file. |
| It is plain text, not rich text | Word, Google Docs, and TextEdit's rich-text mode add formatting that is not JSON. |
| The encoding is UTF-8 | Non-UTF-8 files produce garbled characters; a UTF-8 BOM makes some parsers throw. |

If your file might actually be `data.json.txt`, check from a terminal (`dir` on Windows, `ls` on macOS and Linux) rather than trusting File Explorer or Finder — both hide known extensions by default.

## Step-by-step: create your first JSON file

Here is a complete first file. It is an object with four keys and one nested array:

```json
{
  "project": "json-toolbox",
  "version": "1.0.0",
  "author": "Ada",
  "tags": ["json", "config"]
}
```

Save it as `project.json`. An array of objects is equally valid as the root value:

```json
[
  { "id": 1, "name": "Ada", "active": true },
  { "id": 2, "name": "Lin", "active": false }
]
```

### Syntax rules that decide whether the file works

JSON is strict. These are the rules that cause most first-file failures:

| Rule | Valid | Invalid |
|---|---|---|
| Strings use double quotes | `"name"` | `'name'` |
| Keys are quoted | `{ "name": "Ada" }` | `{ name: "Ada" }` |
| No trailing comma | `{ "a": 1, "b": 2 }` | `{ "a": 1, "b": 2, }` |
| Members separated by commas | `{ "a": 1, "b": 2 }` | `{ "a": 1 "b": 2 }` |
| No comments | — | `{ "a": 1 } // note` |
| Numbers have no leading zeros or hex | `42`, `3.14` | `042`, `0x1F` |
| No `undefined`, `NaN`, or `Infinity` | `null` | `NaN` |
| Escape newlines inside strings | `"line1\nline2"` | a literal line break inside a string |

Two of these deserve a note. **Comments are not part of JSON** — `//` and `/* */` make the file invalid, and only tools that explicitly accept JSONC will read it; see [Comments in JSON](/blog/json-comments). And **trailing commas are invalid** even though they are fine in JavaScript object literals, which is why copied-and-pasted config so often fails to parse.

## Common mistakes and how to fix them

| Symptom | Likely cause | Fix |
|---|---|---|
| File is named `data.json.txt` | Save dialog type was "Text Documents", or the extension is hidden | Re-save with **Save as type: All Files** and type `data.json` |
| Parser reports an error at line 1, column 1 | UTF-8 BOM at the start of the file | Save as UTF-8 without BOM |
| `café` becomes `cafÃ©` | File saved as ANSI / non-UTF-8 | Re-save with UTF-8 encoding |
| Editor shows formatting or fonts | File was saved as rich text (RTF/DOCX) | Use a plain-text editor and save as `.json` |
| `SyntaxError: Unexpected token }` | Trailing comma before `}` or `]` | Remove the last comma in the object or array |
| `SyntaxError: Unexpected token /` | A `//` or `/* */` comment | Remove comments, or convert with [JSONC to JSON](/tools/convert/jsonc-to-json) |
| `Unexpected token '` in JSON` | Single-quoted strings | Replace with double quotes |
| Error mentions an unexpected string or colon | Unquoted key | Quote the key: `{ "name": "Ada" }` |

When several of these are present at once, fixing them by hand is slow. Paste the file into [JSON Repair](/tools/format/json-repair), which fixes trailing commas, single quotes, unquoted keys, missing brackets, comments, and Python-style constants, then copy or download the valid result.

## How to validate a JSON file

"Valid" has one meaning for a JSON file: a strict parser can read it without error. Four ways to check:

**1. Editor feedback.** VS Code underlines syntax errors as you type and shows the message on hover. This catches most problems before you save.

**2. In the browser.** Paste or open the file in the [JSON Editor](/tools/format/json-editor). It validates live, highlights syntax, and lets you format or minify the document before you copy or download it — no account and no upload, because it runs in your browser.

**3. Command line.** Both of these parse the file and print it, so a parse error means the file is invalid:

```bash
jq . data.json
python -m json.tool data.json
```

**4. Schema validation.** Syntax is only the first layer. If the file has to match an expected structure — required fields, types, ranges — validate it against a JSON Schema. Generate a starting schema from a representative file with the [JSON Schema Generator](/tools/convert/json-schema-generator), then check data against it with the [JSON Schema Validator](/tools/format/json-schema-validator). See [JSON Validation Explained](/blog/json-validation-syntax-vs-schema) for how the layers differ.

If a file fails to parse and you are not sure why, [JSON Parse Failed: 10 Common API Errors and How to Debug Them](/blog/json-parse-error-debug) walks through the error messages one by one.

## Create a JSON file online

If you would rather not deal with Save As dialogs, a browser-based editor does the same job and hands you a downloadable file:

- **[JSON Editor](/tools/format/json-editor)** — paste or open JSON, edit it in a syntax-highlighted editor with live validation, format or minify it, then copy or download the `.json` file. This is the closest equivalent to "create a JSON file online" and works on any OS, including Chromebooks and tablets.
- **[JSON Array Generator](/tools/convert/json-array-generator)** — if you need a file full of sample records rather than one hand-written object, set the number of items and the field names and download a pretty-printed array. Useful for test fixtures and demos.

Both run entirely in your browser, so nothing you paste is sent to a server.

## Generate JSON files from code

When data already lives in your program, do not hand-write the file — let the code write it.

### Python

```python
import json

data = {
    "project": "json-toolbox",
    "version": "1.0.0",
    "author": "Ada",
    "tags": ["json", "config"],
}

with open("project.json", "w", encoding="utf-8") as f:
    json.dump(data, f, indent=2, ensure_ascii=False)
    f.write("\n")
```

`indent=2` produces readable output; drop it for a compact file. `ensure_ascii=False` keeps non-ASCII characters readable instead of escaping them, which is why opening the file with `encoding="utf-8"` matters. Use `json.dumps(data)` when you want the JSON as a string rather than a file.

### Node.js

```js
import { writeFile } from 'node:fs/promises'

const data = {
  project: 'json-toolbox',
  version: '1.0.0',
  author: 'Ada',
  tags: ['json', 'config'],
}

await writeFile('project.json', JSON.stringify(data, null, 2) + '\n', 'utf8')
```

`JSON.stringify(value, null, 2)` adds two-space indentation; omit the last two arguments for minified output.

### In the browser

To let a user download a file your page generated:

```js
const text = JSON.stringify(data, null, 2)
const blob = new Blob([text], { type: 'application/json' })
const url = URL.createObjectURL(blob)

const a = document.createElement('a')
a.href = url
a.download = 'project.json'
a.click()

URL.revokeObjectURL(url)
```

This never touches a server — the file is assembled in the page and downloaded from memory.

## What is a manifest.json file?

A `manifest.json` is not a different format. It is an ordinary JSON file whose contents are defined by whichever platform reads it — so "how do I create one" really means "what fields does this platform expect".

Three common cases:

**Progressive Web App (web app manifest)** — describes how your app appears when installed: name, icons, start URL, and display mode. Referenced from HTML with `<link rel="manifest" href="/manifest.json">`.

```json
{
  "name": "JSON Toolbox",
  "short_name": "JSON Toolbox",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#0284c7",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

The specification is the [W3C Web Application Manifest](https://www.w3.org/TR/appmanifest/), and [web.dev](https://web.dev/articles/add-manifest) has a practical walkthrough.

**Chrome extension** — every extension has a `manifest.json` declaring its name, version, and permissions. The current version is [Manifest V3](https://developer.chrome.com/docs/extensions/develop/migrate/what-is-mv3); see MDN's [`manifest.json` reference](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json) for the key list.

**Framework manifests** — frameworks generate or consume their own. Next.js, for example, supports `app/manifest.json` (or `manifest.ts`) and serves the file for you.

The syntax rules in this guide apply to all of them: valid JSON first, correct fields second. Many editors accept comments in these files because they read them as JSONC — but the platform that consumes the file may not, so check before shipping comments.

For step-by-step examples with the required fields for each spec — PWA web app manifests and Chrome extension Manifest V3 — see [How to Create a manifest.json File](/blog/how-to-create-manifest-json).

## FAQ

### Can I create a JSON file in Notepad?

Yes. Write the JSON, choose **File → Save As**, set **Save as type** to **All Files (\*.\*)**, type the name as `data.json`, and pick **UTF-8** as the encoding. Skipping "All Files" is what produces `data.json.txt`.

### Do I need special software to create a JSON file?

No. Any plain-text editor works — Notepad, TextEdit, nano, VS Code. A code editor adds syntax highlighting and live validation, which is why it is recommended, but it is not required.

### How do I make a `.json` file on a Mac?

Use TextEdit with **Format → Make Plain Text** (**Shift + Cmd + T**) first, then save with the full name `data.json`. Or use VS Code, which saves plain text with the extension you type and validates as you go.

### Why does my JSON file not work even though it looks correct?

Most often it is one of four things: the file is actually `data.json.txt`, it was saved as rich text or with a BOM, it contains a trailing comma, or it has comments. Validate the file — an error message with a line and column points straight at the problem.

### Can a JSON file have comments?

No. Standard JSON has no comment syntax, so `//` and `/* */` make the file invalid. Use a `_comment` key, keep documentation outside the file, or work in JSONC and strip comments before shipping. Full details in [Comments in JSON](/blog/json-comments), and the [JSONC to JSON Converter](/tools/convert/jsonc-to-json) removes them for you.

### Is a JSON file the same as a JavaScript object?

No. A JSON file is text; a JavaScript object literal is code. JavaScript allows unquoted keys, trailing commas, single quotes, and comments — none of which are valid JSON. That is why an object copied out of a `.js` file often fails `JSON.parse()`.

### What is the difference between `.json` and `.webmanifest`?

Both contain JSON; only the convention differs. `.webmanifest` is the file extension recommended by the W3C for a web app manifest, served as `application/manifest+json`, while `.json` is the general extension for any JSON document. Many projects still use `manifest.json` with no issue.

### How large can a JSON file be?

JSON itself sets no size limit. Practical limits come from the tool reading the file: editor memory, parser configuration, and server upload caps. For testing how your own tools behave, the [free realistic JSON test datasets](/blog/free-realistic-json-test-data) range from small demos to large files.

## What's Next?

- **Ready to write one?** Open the [JSON Editor](/tools/format/json-editor) — paste, validate, format, and download a `.json` file without installing anything.
- **Need sample records?** Generate an array with the [JSON Array Generator](/tools/convert/json-array-generator).
- **File already broken?** Fix trailing commas, quotes, and comments with [JSON Repair](/tools/format/json-repair).
- **Wondering about comments?** Read [Comments in JSON: Why They're Not Allowed and What to Use Instead](/blog/json-comments).
- **Debugging a parse error?** See [JSON Parse Failed: 10 Common API Errors and How to Debug Them](/blog/json-parse-error-debug).

---

*All tools on JSON Toolbox run entirely in your browser. Your data never leaves your device.*
