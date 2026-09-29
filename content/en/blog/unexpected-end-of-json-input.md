---
title: "Unexpected End of JSON Input: Causes and Fixes"
description: "Unexpected end of JSON input: the parser ran out of text too early. Diagnose empty, truncated, or unclosed JSON, then fix it in fetch, Node, and files."
h1: "Unexpected End of JSON Input: What It Means and How to Fix It"
category: "json_tools"
date: 2026-09-29
lastmod: 2026-09-29
image: "/blog/cover/en/unexpected-end-of-json-input-cover.svg"
draft: true
tags:
  - "JSON"
  - "JSON.parse"
  - "Debugging"
  - "JavaScript"
  - "API"
author: "JSON Toolbox Team"
promo:
  slug: "json-repair"
  text: "Paste the broken JSON and repair it in your browser:"
  btn: "Open JSON Repair"
locales:
  - "en"
---

# Unexpected End of JSON Input: What It Means and How to Fix It

```text
SyntaxError: Unexpected end of JSON input
    at JSON.parse (<anonymous>)
```

This error says one thing: **the parser reached the end of the string while it was still expecting more.** It never found the closing piece it needed, so it gave up at the last character.

The useful part is that the message narrows the cause considerably. An empty API response, a truncated download, and a missing `}` are three different problems that need three different fixes — and on modern JavaScript engines they do not even produce the same message. This guide shows how to tell them apart in about a minute, and how to fix each one in `fetch()`, Node.js, React, and file reads.

> **Paste it and see where it breaks:** the [JSON Repair](/tools/format/json-repair) tool fixes missing brackets, trailing commas, and quoting problems in your browser, and reports an error instead of guessing when a document cannot be recovered.

For the wider picture — ten parse errors, not just this one — see [JSON Parse Failed: 10 Common API Errors and How to Debug Them](/blog/json-parse-error-debug).

## What does "Unexpected end of JSON input" mean?

[`JSON.parse()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/parse) reads a string and expects exactly one complete JSON value. If the string ends before that value is finished, parsing fails.

On current V8 (Node 20+, Chrome, Edge), these all produce the message:

```js
JSON.parse('')        // SyntaxError: Unexpected end of JSON input
JSON.parse('   ')     // SyntaxError: Unexpected end of JSON input
JSON.parse('[1,')     // SyntaxError: Unexpected end of JSON input
JSON.parse('{"a":')   // SyntaxError: Unexpected end of JSON input
JSON.parse('tru')     // SyntaxError: Unexpected end of JSON input
```

The pattern: in every case the parser was **expecting a value** and the input ran out — the string was empty, it was only whitespace, or it ended right after a comma, a colon, or mid-literal.

### When you get a different message instead

A document that is cut off *after* a complete value produces a different, more specific error with a position:

```js
JSON.parse('{"a": 1')      // SyntaxError: Expected ',' or '}' after property value in JSON at position 7
JSON.parse('[1, 2')        // SyntaxError: Expected ',' or ']' after array element in JSON at position 5
JSON.parse('{"a": "bc')    // SyntaxError: Unterminated string in JSON at position 9
JSON.parse('{"a":1,')      // SyntaxError: Expected double-quoted property name in JSON at position 7
```

So if you are looking at exactly `Unexpected end of JSON input` on a current engine, suspect **empty input** first, not a missing brace. Two caveats:

- **Older engines differ.** Before V8's improved JSON errors, a truncated document like `{"a": 1` also reported "Unexpected end of JSON input". If you are on an older runtime or see this message in a library's logs, a missing bracket is still a candidate.
- **Other engines word it differently.** Firefox reports its own message, along the lines of `JSON.parse: unexpected end of data at line 1 column 1`.

## Common causes at a glance

| Cause | Typical symptom | How to confirm |
|---|---|---|
| **Empty response body** | `204 No Content`, or an endpoint that returns nothing after a successful `DELETE`/`POST` | `text.length === 0`; status is 204/205 |
| **Whitespace-only body** | Body is `" "` or `"\n"` | `text.trim().length === 0` but `text.length > 0` |
| **Truncated response** | Timeout, proxy buffer limit, body-size cap killed the transfer | Received bytes < `Content-Length`; ends mid-value |
| **Unclosed structure in hand-written JSON** | Missing `}`, `]`, or closing `"` | Ends with `{`, `[`, `"`, `,`, or `:` |
| **File read before the write finished** | Non-atomic write, or reading a streamed file too early | Retry the read and it works; file grows between reads |
| **Parsing `undefined`** | Value came from a missing variable or an unset field | Message is `"undefined" is not valid JSON`, not this one |

One counter-intuitive case worth knowing: `JSON.parse(null)` does **not** throw — `null` is coerced to the string `"null"` and parses to `null`. `JSON.parse(undefined)` throws, but with a different message.

## How to debug: empty vs truncated vs unclosed

Work through these in order. Each step eliminates one of the three causes.

### Step 1: Read the text, not the parsed value

Never debug this error through `res.json()` — it parses before you can look at anything. Read the body as text first:

```js
const res = await fetch(url)
const text = await res.text()
console.log('status:', res.status, '| length:', text.length)
```

### Step 2: Is it empty?

```js
if (text.trim().length === 0) {
  // Empty or whitespace-only: this is the classic cause of the message.
  console.log('empty body, status', res.status)
}
```

`length === 0` means no body at all. `trim().length === 0` with a non-zero length means whitespace only — a surprisingly common outcome when a server writes a newline.

### Step 3: Inspect the tail

The last characters tell you which failure you have:

```js
console.log(JSON.stringify(text.slice(-80)))
```

| Ends with | What it means |
|---|---|
| `{`, `[` | The structure was opened and never closed |
| `"a` (an odd number of unescaped quotes) | A string was left unterminated |
| `,` or `:` | A value was expected and never arrived |
| A complete value but no closing bracket | Missing `}` or `]` — usually a different error message with a position |
| Mid-token, e.g. `tru` or `12.` | The document was cut off mid-value |

### Step 4: Compare received bytes with Content-Length

```js
const declared = res.headers.get('content-length')
console.log('declared:', declared, '| received:', new TextEncoder().encode(text).length)
```

If you received fewer bytes than declared, the response was truncated in transit — a timeout, a proxy buffer limit, or a body-size cap. Re-fetch; do not try to parse half a document.

### Step 5: Classify it automatically

Run this only after `JSON.parse()` has already failed — it classifies the tail of a broken string, it does not tell you whether a document is valid.

```js
function inspectJsonFailure(text) {
  const trimmed = text.trim()

  if (trimmed.length === 0) {
    return { kind: 'empty', detail: 'The input is empty or whitespace only.' }
  }

  const last = trimmed[trimmed.length - 1]
  if ('{[",:'.includes(last)) {
    return { kind: 'unclosed', detail: `Input ends with "${last}" — a value or closing bracket is missing.` }
  }

  return { kind: 'truncated', detail: 'Input ends mid-value. Compare received bytes with Content-Length.' }
}
```

## How to fix it in fetch()

The fix is to stop calling `.json()` blindly. Read the text, handle the empty case, check the content type, then parse:

```js
async function fetchJson(url, init) {
  const res = await fetch(url, init)
  const text = await res.text()

  // 204 No Content and 205 Reset Content have no body by definition.
  if (res.status === 204 || res.status === 205 || text.trim() === '') {
    return null
  }

  const type = res.headers.get('content-type') || ''
  if (!type.includes('application/json')) {
    throw new Error(`Expected JSON from ${url}, got "${type || 'no content-type'}"`)
  }

  try {
    return JSON.parse(text)
  } catch (err) {
    throw new Error(`Invalid JSON from ${url} (${text.length} bytes): ${err.message}`)
  }
}
```

Three details that matter:

1. **`res.text()` then `JSON.parse()`**, not `res.json()`. You cannot inspect a body you already parsed — and [`Response.json()`](https://developer.mozilla.org/en-US/docs/Web/API/Response/json) throws before you get a chance.
2. **A 204 is a success.** Do not treat it as an error; return `null` (or whatever your code uses for "no content").
3. **Check the content type.** An HTML error page from a proxy returns 200 and parses as neither JSON nor an empty string — it fails with a different message, and this check makes the real problem obvious.

For truncated responses, the fix is not parsing: it is raising timeouts, lifting proxy body limits, or paginating the endpoint.

## How to fix it in Node.js

Reading a file:

```js
import { readFile } from 'node:fs/promises'

const text = await readFile('data.json', 'utf8')

if (text.trim() === '') {
  throw new Error('data.json is empty — the write did not complete')
}

const data = JSON.parse(text)
```

Parsing a request body — note that an empty body arrives as an empty string, not as `undefined`:

```js
// Express
app.post('/webhook', express.json(), (req, res) => {
  // req.body is {} when the body is empty, not undefined
  if (!req.body || Object.keys(req.body).length === 0) {
    return res.status(400).json({ error: 'EMPTY_BODY' })
  }
  // ...
})
```

Reading JSON that another process is still writing is the subtle version of this bug. Write atomically so a reader never sees a half-written file:

```js
import { writeFile, rename } from 'node:fs/promises'

const target = 'data.json'
const tmp = `${target}.tmp`

await writeFile(tmp, JSON.stringify(data, null, 2), 'utf8')
await rename(tmp, target) // atomic on the same filesystem
```

`rename` is atomic within a filesystem, so a concurrent reader sees either the old file or the new one — never a partial one.

## How to fix it in React and other frontend code

The usual cause in a component is parsing during the first render, before data exists — or parsing an empty response from an endpoint that returns nothing:

```jsx
function ItemList() {
  const [items, setItems] = useState([])
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    ;(async () => {
      try {
        const res = await fetch('/api/items')
        const text = await res.text()

        if (cancelled) return

        if (text.trim() === '') {
          setItems([])          // no content is a valid outcome, not an error
          return
        }

        setItems(JSON.parse(text))
      } catch (err) {
        if (!cancelled) setError(err)
      }
    })()

    return () => { cancelled = true }
  }, [])

  if (error) return <p>Failed to load: {error.message}</p>
  return <ul>{items.map((i) => <li key={i.id}>{i.name}</li>)}</ul>
}
```

Two habits prevent most of these: **never call `JSON.parse` on a value that might be `undefined`**, and **never parse during render** — parse inside the effect or the loader, after you have confirmed the text exists.

If the JSON comes from `localStorage`, the same rule applies: `localStorage.getItem(key)` returns `null` when the key is missing, and `JSON.parse(null)` quietly returns `null` instead of the object you expected.

## Validate and repair the JSON in your browser

When you have the text in front of you, two tools finish the job:

**[JSON Repair](/tools/format/json-repair)** — fixes trailing commas, single quotes, unquoted keys, **missing closing brackets**, comments, and Python/JS constants such as `True` or `NaN`. It applies best-effort fixes, then parses the result to confirm it is valid before showing it.

Two limits to keep in mind, both stated on the tool page:

- It **cannot invent missing data**. Closing a bracket is recoverable; a document whose middle was cut off is not.
- If the structure cannot be recovered, it **reports an error instead of returning partial output**. That is the correct outcome for a truncated response — get the full data instead.

**[JSON Editor](/tools/format/json-editor)** — paste or open the file to get live syntax validation with the error position, then format or minify. Use it to confirm a hand-written file is complete before your application reads it.

Both run in your browser, so the payload is not uploaded — which matters when the broken JSON is a production API response.

## How to prevent the error

**Server side:**

- **Always return valid JSON, including errors.** `{"error": {...}}` is far easier to debug than an empty 500.
- **Do not set `Content-Type: application/json` on a 204.** If there is no body, say so with the status code and no content type.
- **Set explicit timeouts and body-size limits** so a truncation fails loudly with a status code instead of silently cutting a document in half.
- **Write files atomically** (temp file + rename) so no reader ever sees a partial file.

**Client side:**

- **Guard before parsing:** `if (text && text.trim() !== '') { JSON.parse(text) }`.
- **Wrap `JSON.parse()` in try/catch** and include the length and the tail of the string in the error message — that is the information you will need later.
- **Treat "no content" as a normal outcome** for endpoints that can legitimately return nothing.
- **Log the offending payload safely:** log length, status, and a truncated tail, not the whole body, which may contain tokens or personal data.

## FAQ

### What does "Unexpected end of JSON input" mean?

`JSON.parse()` reached the end of the string while still expecting more content. On current engines that most often means the input was empty or whitespace-only, or ended right after a comma, colon, or mid-literal.

### Is this error always caused by an empty response?

No, but on modern V8 an empty or whitespace-only string is the most common cause of this exact wording. A document with a missing closing bracket usually produces a different message that includes a character position — unless you are on an older engine, which reported the same message for both.

### How do I know if the response is truncated?

Compare the bytes you received with the `Content-Length` header, and look at the last ~80 characters. If the document stops mid-value, or you received fewer bytes than declared, it was truncated — re-fetch rather than trying to parse it.

### Can this error happen with otherwise valid JSON?

Yes — if only part of a valid document arrived. A 400 KB response cut off at 300 KB is "valid JSON" that was never fully delivered. The other case is a file you read while it was still being written.

### How do I fix it in fetch?

Do not call `res.json()` directly. Read `res.text()`, return early for `204`, `205`, or an empty body, verify the content type, then `JSON.parse()` inside a try/catch that reports the length and tail of the text.

### How do I fix it in React?

Parse inside the effect or loader, not during render, and only after confirming the text exists. Handle the empty-body case explicitly instead of letting `JSON.parse('')` throw on every render.

### How do I fix it in Node.js?

Check for an empty string after `fs.readFile`, and write files atomically (temp file + `rename`) so a concurrent read never sees half a file.

### Can an online tool repair truncated JSON?

It can repair documents with recoverable syntax problems — missing closing brackets, trailing commas, quoting issues. It cannot restore data that never arrived. For a truncated response, re-fetch from the source.

### Why does `JSON.parse(null)` not throw?

Because `null` is coerced to the string `"null"`, which is valid JSON. It returns `null`. This silently masks missing values, so check for `null` before parsing values from `localStorage` or optional fields.

## What's Next?

- **Have the broken text?** Paste it into [JSON Repair](/tools/format/json-repair).
- **Need the error position?** Validate it in the [JSON Editor](/tools/format/json-editor).
- **Other parse errors?** Read [JSON Parse Failed: 10 Common API Errors and How to Debug Them](/blog/json-parse-error-debug).
- **Suspect the file itself?** See [How to Open, View, and Edit a JSON File](/blog/how-to-open-json-file) and [How to Create a JSON File](/blog/how-to-create-json-file).

---

*All tools on JSON Toolbox run entirely in your browser. Your data never leaves your device.*
