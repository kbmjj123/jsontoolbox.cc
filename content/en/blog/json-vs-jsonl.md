---
title: "JSON vs JSONL: What's the Difference and When to Use Each"
description: "JSONL stores one JSON value per line. Compare JSON and JSONL, learn when each format fits, and convert or inspect JSONL files in your browser."
h1: "JSON vs JSONL: When to Use Each and Why It Matters"
category: "json_tools"
date: 2026-09-30
lastmod: 2026-09-30
image: "/blog/cover/en/json-vs-jsonl-cover.svg"
draft: true
tags:
  - "JSON"
  - "JSONL"
  - "NDJSON"
  - "Data Format"
  - "Big Data"
author: "JSON Toolbox Team"
promo:
  slug: "jsonl-to-json"
  text: "Got a .jsonl file? Turn it into a readable JSON array:"
  btn: "Open JSONL to JSON Converter"
locales:
  - "en"
---

# JSON vs JSONL: When to Use Each and Why It Matters

A 400 MB export will not open in your editor. A log file that grows all day cannot be rewritten every time a new event arrives. And a training dataset is easier to stream than to load.

Those are the problems JSONL solves. It is not a new format — it is the same JSON values, arranged one per line, which turns out to change what you can do with a file.

This guide covers what JSONL is, how it differs from JSON structurally, when each format is the right choice, how to read and write it in Python, Node.js, and the shell, and how to handle large JSONL files in a browser without freezing the page.

## What is JSONL (JSON Lines)?

**JSONL** (JSON Lines) is a format where each line of a file is a complete, independent JSON value. There is no wrapping array and no commas between records.

```jsonl
{"id": 1, "event": "signup", "plan": "free"}
{"id": 2, "event": "purchase", "amount": 29.00}
{"id": 3, "event": "logout"}
```

Three rules define it:

1. **One JSON value per line**, usually an object.
2. **Lines are separated by `\n`.** No commas, no enclosing `[ ]`.
3. **Every line is valid JSON on its own.**

Common file extensions are `.jsonl` and `.ndjson`. The format is described at [jsonlines.org](https://jsonlines.org/), and it is also known as newline-delimited JSON.

The consequence that surprises people first: **a JSONL file is not valid JSON.** Paste the block above into `JSON.parse()` and it throws. Each *line* parses fine; the file as a whole does not, because there is no single top-level value.

## JSON vs JSONL: structural differences

| | JSON | JSONL |
|---|---|---|
| Shape | One document: an object, an array, or a value | A sequence of JSON values, one per line |
| Valid as a file | Yes | No — each line is valid JSON, the file is not |
| Extensions | `.json` | `.jsonl`, `.ndjson` |
| Read model | Parse the whole document, then navigate | Read one line, parse it, move on |
| Memory | The full structure is built before you can use it | Bounded by the largest single line |
| Appending a record | Rewrite the document | Append one line |
| Partial failure | One bad byte fails the whole parse | One bad line fails one record |
| Streaming | Not native | Native |
| Splitting / sharding | Requires parsing | Split by lines — any line count works |
| Pretty-printing | Standard practice | Breaks the format (see below) |

The mental model: **JSON is a document; JSONL is a stream of records.** Everything else follows from that.

The trade-off is real in both directions. JSON gives you one parseable tree, nesting, and a format every tool understands. JSONL gives you append-only writes, per-record error isolation, and constant-memory reads — but you lose the ability to treat the file as a single value, and you cannot pretty-print it without breaking the one-line-per-record contract.

## When to use JSON

JSON is the right default when the data is one thing, not many records:

- **API requests and responses** — a payload is a single document, and `application/json` is what clients expect.
- **Configuration** — `package.json`, `tsconfig.json`, `manifest.json` are documents that humans read and tools load whole.
- **Small datasets that fit comfortably in memory** — the parsing cost is irrelevant and you get a real tree to navigate.
- **Deeply nested structures** — a configuration or a document where nesting is the point, not a list of rows.
- **Interchange with tools that expect JSON** — anything that calls `JSON.parse()` on the file.

Two practical notes. If you are creating JSON files by hand, the syntax rules and saving steps in [How to Create a JSON File](/blog/how-to-create-json-file) cover the usual traps. And JSON has no comment syntax — if you need inline documentation, see [Comments in JSON](/blog/json-comments) before you reach for a workaround.

## When to use JSONL

Reach for JSONL when the file is a **collection of independent records** and at least one of these is true:

- **You append constantly.** Logs and event streams grow one record at a time. Appending a line is O(1); rewriting a JSON array is O(n) every time.
- **The file is too large to hold in memory.** Reading line by line keeps peak memory bounded by the longest line, not the file size.
- **You process records independently.** Map-style work — filtering, transforming, embedding, training — does not need the whole dataset in one structure.
- **One bad record must not stop the batch.** With JSONL you can skip the failing line and keep going.
- **You need to shard or resume.** Splitting a 10-million-line file into ten chunks is a line count, not a parse. Interrupted jobs can resume from a line offset.
- **A downstream tool expects it.** BigQuery, Spark, and most ML pipelines ingest newline-delimited JSON natively.

If none of these apply and the data is a single structured document, use JSON.

## Real-world use cases for JSONL

**Logs.** The Docker `json-file` logging driver writes one JSON object per line, and most structured logging setups do the same. Appending is cheap, `grep` and `tail -f` work, and log shippers read line by line.

**Data pipelines.** BigQuery loads newline-delimited JSON directly. Spark's JSON reader expects one JSON object per line by default. Snowflake, Hadoop, and most ETL tooling follow the same convention, which is why "export as NDJSON" is a standard option.

**Machine learning and AI.** This is where JSONL became unavoidable:

- **OpenAI fine-tuning** files are JSONL, one training example per line.
- **Hugging Face datasets** commonly ship as JSON Lines.
- **RAG pipelines** store chunks or documents one per line so they can be streamed into an embedding or indexing job without loading everything at once.

The pattern is the same in all three: the dataset is a list of independent examples, it is too big to load casually, and processing is per-example.

**Streaming APIs.** A server that emits one JSON object per line lets the client start processing the first record before the last one arrives — no waiting for a closing bracket that may never come for a long-running job.

## How to read and write JSONL files

### Python

Write — one compact JSON value per line:

```python
import json

records = [
    {"id": 1, "event": "signup", "plan": "free"},
    {"id": 2, "event": "purchase", "amount": 29.00},
]

with open("events.jsonl", "w", encoding="utf-8") as f:
    for record in records:
        f.write(json.dumps(record, ensure_ascii=False) + "\n")
```

Read — one line at a time, with per-line error handling:

```python
import json

with open("events.jsonl", "r", encoding="utf-8") as f:
    for number, line in enumerate(f, start=1):
        line = line.strip()
        if not line:
            continue
        try:
            record = json.loads(line)
        except json.JSONDecodeError as e:
            print(f"skipping line {number}: {e}")
            continue
        process(record)
```

The `strip()` matters: it removes a trailing `\r` from CRLF files and skips blank lines.

### Node.js

Write:

```js
import { appendFile } from 'node:fs/promises'

await appendFile('events.jsonl', JSON.stringify(record) + '\n', 'utf8')
```

Read with `readline` over a stream, so the file is never loaded as one string:

```js
import { createReadStream } from 'node:fs'
import { createInterface } from 'node:readline'

const rl = createInterface({
  input: createReadStream('events.jsonl', 'utf8'),
  crlfDelay: Infinity,
})

for await (const line of rl) {
  if (!line.trim()) continue
  try {
    const record = JSON.parse(line)
    // process(record)
  } catch (err) {
    console.error(`skipping bad line: ${err.message}`)
  }
}
```

### Command line with jq

```bash
# JSON array -> JSONL
jq -c '.[]' data.json > data.jsonl

# filter, transform, or project JSONL records
jq -c 'select(.status == "error") | {id, message}' app.jsonl

# JSONL -> JSON array (-s slurps all inputs into one array)
jq -s '.' data.jsonl > data.json
```

`-c` is the flag that matters for output: compact, one value per line.

## Converting between JSON and JSONL

If you just need the conversion, both directions are one step in the browser:

- **[JSON to JSONL](/tools/convert/json-to-jsonl)** — turns a JSON array into one JSON value per line (a single object becomes a single line). The input is parsed as JSON first, so invalid input produces an error rather than a broken JSONL file. Copy the result or download it as `.jsonl`.
- **[JSONL to JSON](/tools/convert/jsonl-to-json)** — parses each non-empty line into a value and collects them into a pretty-printed JSON array. Blank lines are skipped, and if a line is not valid JSON the tool reports which line failed, so you can fix the source instead of guessing.

Both run in your browser: the file is parsed locally and is not uploaded, which matters when the JSONL is production log data or a customer export.

## Handling large JSONL files in the browser

This is where JSONL earns its keep, and where browsers need care.

**Why the naive approach fails.** `JSON.parse(await file.text())` on a large file does three expensive things at once on the main thread: allocate a string the size of the file, parse it into a complete object graph, and then render it. The page stops responding — often for long enough that the browser offers to kill the tab. And JSONL cannot be parsed that way at all, because the file is not a single JSON value.

**Stream and parse incrementally.** Read the file as a stream and yield one line at a time:

```js
async function* readLines(file) {
  const decoder = new TextDecoder()
  const reader = file.stream().getReader()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })

    let index
    while ((index = buffer.indexOf('\n')) >= 0) {
      yield buffer.slice(0, index)
      buffer = buffer.slice(index + 1)
    }
  }
  if (buffer) yield buffer
}

for await (const line of readLines(file)) {
  if (!line.trim()) continue
  const record = JSON.parse(line) // one record in memory at a time
}
```

**Move it off the main thread.** Run that loop in a Web Worker and post results back as they arrive. Parsing and searching stay off the UI thread, so scrolling and input keep working while the file is processed.

**Render only what is visible.** A virtual list renders the rows in the viewport instead of all 500,000 of them. This is usually the difference between a usable viewer and a frozen page — the data can be in memory and the page can still die on DOM nodes.

**Or use a viewer that already does this.** The [Large JSON Viewer](/tools/view/large-json-viewer) opens large JSON and NDJSON (`.jsonl`, `.jsonlines`) files read-only, with line numbers and a viewport that only renders visible rows. Search by key, value, or path runs in a Web Worker with a progress bar and a cancel button; matches report line, column, and offset and can be exported as TXT, JSON, or CSV — for NDJSON, the records can be exported as a CSV table. There is also a pager for stepping through NDJSON items, and JSONPath copy plus a local preview of the matched node. It is read-only by design: it does not edit, pretty-print, or minify. Files above 5 MB are handed to it automatically by the other tools on this site, and everything happens locally with no upload.

That last point is the practical summary: **JSONL is what makes browser-side handling of large record files feasible at all.** One line at a time, in a worker, rendered virtually.

## JSONL vs NDJSON: are they the same?

In practice, yes. Both describe one JSON value per line, separated by `\n`, with no enclosing array.

The names come from two specification efforts — [JSON Lines](https://jsonlines.org/) and the [NDJSON spec](https://github.com/ndjson/ndjson-spec) — which converged on the same rules. Differences you may still meet in the wild are conventions, not format:

| | JSON Lines | NDJSON |
|---|---|---|
| Common extension | `.jsonl` | `.ndjson` |
| Line separator | `\n` | `\n` |
| Trailing newline | Recommended | Recommended |
| Parsers | Interchangeable in practice | Interchangeable in practice |

Use `.jsonl` unless a tool asks for `.ndjson`. Any parser that reads one will read the other.

## Common mistakes and pitfalls

| Mistake | What happens | Fix |
|---|---|---|
| Adding a comma after each line | Every line after the first fails to parse | No commas between records — each line is complete on its own |
| Wrapping records in `[ ]` | The file is one JSON array, not JSONL | Remove the brackets and commas |
| Pretty-printing the records | One record now spans many lines, breaking "one line, one record" | Keep each record on a single compact line |
| Blank lines in the middle | Many parsers skip them, some error | Skip empty lines when writing; strip before parsing |
| Comments between records | The line is not valid JSON | No comments — see [Comments in JSON](/blog/json-comments) |
| CRLF line endings | A trailing `\r` ends up inside the parsed value | Strip each line before `JSON.parse()` |
| No trailing newline | Some tools ignore the last record, others warn | End every line with `\n`, including the last |
| Mixed record shapes | Valid JSONL, but downstream schemas and loaders break | Keep one shape per file, or one shape per dataset version |
| Treating the file as JSON | `JSON.parse()` on the whole file throws | Parse line by line, or convert with [JSONL to JSON](/tools/convert/jsonl-to-json) |

## FAQ

### Is JSONL valid JSON?

Not as a file. Each line is a valid JSON value, but the file has no single top-level value, so `JSON.parse()` on the whole text throws. Parse it line by line, or convert it with [JSONL to JSON](/tools/convert/jsonl-to-json).

### Can JSONL have comments?

No. Every line must be valid JSON, and standard JSON has no comment syntax — a `//` line makes that record unparseable. See [Comments in JSON](/blog/json-comments) for the workarounds.

### What is the difference between JSONL and NDJSON?

Nothing that affects parsing. They are the same line-delimited format from two specification efforts; `.jsonl` and `.ndjson` are both common extensions. Use whichever your tooling expects.

### When should I use JSONL instead of JSON?

When the file is many independent records and you need to append to it, stream it, process it record by record, or handle files too large to load whole. Use JSON when the data is one document — an API payload, a config file, or a nested structure.

### How do I convert a JSON array to JSONL?

From the shell: `jq -c '.[]' data.json > data.jsonl`. Without installing anything, use [JSON to JSONL](/tools/convert/json-to-jsonl), which converts a JSON array to one value per line and lets you copy or download the `.jsonl` file.

### Can I pretty-print JSONL?

You can format each line, but that breaks the format: a record that spans multiple lines is no longer one line. For reading, use a viewer that pretty-prints a single record on demand instead — the [Large JSON Viewer](/tools/view/large-json-viewer) shows a local pretty-printed preview of the matched node while leaving the file intact.

### Is there a size limit for JSONL files?

The format sets no limit. Real limits come from the tool: browser memory, worker throughput, and how much you choose to load. Reading line by line keeps memory bounded by the largest record rather than the file size.

### Can JSONL contain arrays or nested objects?

Yes. Each line can be any JSON value — object, array, string, number, boolean, or null. Records are usually objects, and nesting inside a record is normal; the constraint is only that one record occupies one line.

## What's Next?

- **Have a `.jsonl` file?** Convert it to a JSON array with [JSONL to JSON](/tools/convert/jsonl-to-json).
- **Going the other way?** Turn a JSON array into records with [JSON to JSONL](/tools/convert/json-to-jsonl).
- **Too big to open?** Inspect and search it read-only in the [Large JSON Viewer](/tools/view/large-json-viewer).
- **Working with single documents?** Format and validate them in the [JSON Editor](/tools/format/json-editor).
- **New to JSON syntax?** Read [How to Create a JSON File](/blog/how-to-create-json-file) and [Comments in JSON](/blog/json-comments).

---

*All tools on JSON Toolbox run entirely in your browser. Your data never leaves your device.*
