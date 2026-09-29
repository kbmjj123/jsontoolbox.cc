---
title: "JSON vs TOON: When a Token-Efficient Format Pays Off"
description: "TOON encodes the same JSON data model with less repeated syntax. Compare JSON and TOON, learn when TOON helps, and convert both ways in your browser."
h1: "JSON vs TOON: When a Token-Efficient Format Pays Off"
category: "json_tools"
date: 2026-09-29
lastmod: 2026-09-29
image: "/blog/cover/en/json-vs-toon-cover.svg"
draft: true
tags:
  - "JSON"
  - "TOON"
  - "LLM"
  - "Token Efficiency"
  - "AI"
author: "JSON Toolbox Team"
promo:
  slug: "json-to-toon"
  text: "Compare TOON against minified JSON with your own payload:"
  btn: "Open JSON to TOON Converter"
locales: ["en"]
---

# JSON vs TOON: When a Token-Efficient Format Pays Off

Every `{`, `"`, and `,` in a JSON payload costs tokens when you paste it into a prompt. Send a thousand records and you pay for the field names a thousand times.

TOON exists for exactly that case. It is not a new data model and not a JSON replacement — it is a different encoding of the same JSON data model, designed so a uniform list of objects stops repeating its own structure.

This guide covers what TOON is, how it differs from JSON on the wire, what the token savings claims actually mean, when each format is the right choice, and how to convert between them — including how to measure the difference on your own data instead of trusting a percentage.

## What is TOON (Token-Oriented Object Notation)?

**TOON** (Token-Oriented Object Notation) is a line-oriented, indentation-based encoding of the JSON data model, built for token-sensitive LLM workflows.

The key sentence: **TOON encodes the JSON data model.** It has the same types — object, array, string, number, boolean, null — and no others. A conversion JSON → TOON → JSON preserves values; what changes is the syntax that represents them.

The specification lives at [github.com/toon-format/spec](https://github.com/toon-format/spec) (currently version 4.1, a working draft), with a TypeScript reference implementation at [github.com/toon-format/toon](https://github.com/toon-format/toon). The provisional media type is `text/toon` and the file extension is `.toon`.

Because it is a working draft, treat any tool's TOON support as targeting a specific spec version, and verify round-trips on your own data.

## JSON vs TOON: structural differences

| | JSON | TOON |
|---|---|---|
| Shape | Braces, brackets, commas | Indentation, headers, minimal punctuation |
| Objects | `{ "id": 1, "name": "Ada" }` | `id: 1` / `name: Ada` on indented lines |
| Arrays | `[ 1, 2, 3 ]` | Header declares the length: `numbers[3]: 1,2,3` |
| Repeated objects | Every object repeats every key | Uniform arrays declare the fields once, then one row per record |
| String quoting | Always double-quoted | Only when necessary |
| Indentation | Insignificant | Significant — it defines nesting |
| Nesting | Any depth, punctuation-delimited | Any depth, indentation-delimited |
| Data model | JSON | JSON (same types) |

Same data, both ways. JSON:

```json
{
  "users": [
    { "id": 1, "name": "Ada", "role": "admin" },
    { "id": 2, "name": "Bob", "role": "user" }
  ]
}
```

TOON:

```toon
users[2]{id,name,role}:
  1,Ada,admin
  2,Bob,user
```

The field names appear once instead of twice. Multiply that by a few hundred records and the saving becomes the whole point.

### The four TOON forms

TOON renders arrays in one of four shapes, depending on what is in them:

**Inline** — primitive arrays, on the header line:

```toon
tags[3]: admin,ops,dev
numbers[5]: 1,2,3,4,5
empty: []
```

**Tabular** — arrays of uniform objects, with the field list in the header:

```toon
users[2]{id,name,role}:
  1,Ada,admin
  2,Bob,user
```

**List** — arrays that fit neither form, one `-` item per element:

```toon
items[3]:
  - 1
  - a: hello
    b: world
  - text value
```

**Keyed tabular** — objects whose values are uniform objects, with rows that carry their own key (a newer form that not every implementation supports).

Objects and nested objects use plain indented `key: value` lines:

```toon
user:
  id: 123
  name: Ada Lovelace
  contact:
    email: ada@example.com
```

The tabular form is where TOON wins. Everything else is closer to a draw — which is why the next section matters more than any headline percentage.

## Token efficiency: what the numbers really mean

Most published TOON benchmarks report savings against **indented** JSON. That is the wrong baseline for a decision, because indentation is formatting you would never send to a model. The realistic baseline is **minified JSON**, and against that baseline the gap is smaller and much more data-dependent.

Three things to keep straight:

**1. The baseline.** Minified JSON is the fair comparison. Comparing against pretty-printed JSON measures formatting overhead, not serialization efficiency, and makes the difference look larger than it is.

**2. The counting method.** Token counts on this site are **estimates**, not counts from a model tokenizer: the character count divided by four, rounded up, applied to both sides with the same formula. Real token counts differ between models and tokenizers. Use the numbers for relative comparison, and verify with your own tokenizer before making cost decisions.

**3. The data shape.** Savings are largest on uniform arrays of objects — the tabular case. They shrink or reverse for:

- deeply nested structures,
- sparse or non-uniform objects,
- arrays of arrays,
- configuration-like data with many unique keys,
- small payloads, where TOON's own header syntax costs more than it saves.

Published benchmarks from the reference implementation and third parties report savings of roughly 30–60% for tabular data against indented JSON, and a much smaller — sometimes zero or negative — difference against minified JSON. Treat those figures as someone else's measurement on someone else's data, not as a guarantee.

Retrieval accuracy is a separate question from size. Published comparisons report small differences in either direction depending on the setup, and a model that does not reliably parse TOON will cost you far more than the tokens you saved.

**The practical answer: measure it.** Convert your actual payload and read the comparison — characters, UTF-8 bytes, and estimated tokens for minified JSON and TOON side by side. The [JSON to TOON Converter](/tools/convert/json-to-toon) does exactly that, and it will tell you when TOON is the larger of the two rather than leaving you to assume.

## When to use JSON

JSON remains the default for almost everything:

- **APIs.** `application/json` is what clients, servers, gateways, and SDKs expect. TOON is not an interchange format for HTTP APIs.
- **Configuration.** `package.json`, `tsconfig.json`, `manifest.json` — documents that tools load whole and that humans edit.
- **Interoperability.** Databases, browsers, queues, and libraries all speak JSON. None of them speak TOON.
- **Deeply nested or irregular data.** This is where TOON's advantage disappears.
- **Anything a strict parser will read.** If a `JSON.parse()` is involved, JSON is the answer.

Two related reads: [How to Create a JSON File](/blog/how-to-create-json-file) for the file basics, and [Comments in JSON](/blog/json-comments) if you are tempted to document a payload inline.

## When to use TOON

TOON is a **transport encoding for prompts**, not a replacement for JSON. The mental model most teams settle on:

> Keep JSON as your application's data exchange format. Convert to TOON at the boundary where data goes into a prompt.

Reach for it when:

- **You are sending many uniform records to an LLM.** Tool results, RAG context, query rows, event lists.
- **Context window or input-token cost is the constraint.** Fewer tokens per record means more records per call.
- **The data is genuinely tabular.** Same keys, same types, row after row.
- **You can verify comprehension.** The model has to understand the format; some need it explained in the system prompt.

Do not reach for it when the data is small, deeply nested, non-uniform, or consumed by something other than a model — minified JSON is simpler and, in those cases, often smaller.

## Real-world use cases for TOON

**LLM tool results.** A tool returns 200 rows; you serialize them as TOON and the prompt stops paying for 200 copies of the field names.

**RAG context.** Retrieved chunks or records go into the prompt as TOON. Uniform metadata — id, title, score, source — is exactly the tabular shape TOON compresses.

**Data analysis in prompts.** Query results, event streams, and log summaries sent for summarization or classification. If you are already emitting JSONL for pipelines, TOON is the prompt-side representation and JSONL is the storage-side one — see [JSON vs JSONL](/blog/json-vs-jsonl) for where each belongs.

**Config and inventory lists.** Flat lists of items — feature flags, SKUs, endpoints — where the schema repeats every row.

In every case the pattern is the same: generate JSON, keep JSON, convert at the prompt boundary, and measure whether it helped.

## How to convert between JSON and TOON

### In the browser

The [JSON to TOON Converter](/tools/convert/json-to-toon) handles both directions on one page:

- **JSON → TOON** for token-sensitive prompts, and **TOON → JSON** for getting data back into applications, APIs, and standard JSON tools.
- **A side-by-side comparison** of minified JSON and TOON by characters, UTF-8 bytes, and estimated tokens — always measured against minified JSON.
- **Honest warnings:** when TOON is larger than minified JSON for your input, when no uniform object array was found, and when the data is deeply nested and minified JSON may be smaller.
- **Validation in both directions.** JSON input goes through `JSON.parse`; TOON input is read by a TOON parser that checks declared array lengths and row widths, so malformed input is reported instead of silently accepted.
- **A round-trip check.** Swap Direction feeds the current output back as input and runs the reverse conversion, so you can confirm your data survives both ways — worth doing for strings that contain delimiters or colons.
- **Delimiter choice:** comma, tab, or pipe, declared in the TOON header. Values containing the active delimiter are quoted automatically.
- **Download** the TOON as `.txt` or the JSON as `.json`.

Everything runs in your browser, and the source is not uploaded — which matters when the payload is customer data or a production prompt.

Supported TOON syntax includes objects and nested objects with two-space indentation, inline primitive arrays, tabular arrays with a field header, non-uniform arrays in list form, empty arrays and objects, and root primitives, objects, or arrays. The page does **not** implement the keyed tabular root form, nested field groups, key folding, or path expansion; input using them is reported as invalid rather than partially decoded.

One note if you are coming from the spec: TOON 4.1 defines full-line `#` comments as decode-side syntax — decoders strip them, and **encoders must never emit them**. So converted output never contains comments, and comment lines are not part of the syntax this converter accepts; keep them out of what you paste in.

### From the command line or your own code

The TOON project publishes a reference implementation and CLI as npm packages (`@toon-format/toon`, `@toon-format/cli`) for Node-based pipelines:

```bash
npx @toon-format/cli input.json -o output.toon
npx @toon-format/cli data.toon -o output.json
```

For production pipelines, pin the version and pin the spec version you target — TOON is a working draft, and encoder output can change between versions.

## Common mistakes and pitfalls

| Mistake | Why it hurts | What to do |
|---|---|---|
| Treating TOON as a new data model | It is not — it encodes the JSON data model; you cannot express anything new in it | Convert at the boundary, keep JSON as the source of truth |
| Trusting a fixed savings percentage | Savings depend on the payload and the tokenizer | Measure minified JSON vs TOON on your own data |
| Comparing against pretty-printed JSON | Indentation inflates the apparent difference | Always compare against minified JSON |
| Using TOON for deeply nested data | The tabular form never applies; overhead can make it larger | Keep minified JSON, or flatten the payload first |
| Using TOON for arrays of arrays | Not the shape TOON optimizes | Benchmark before adopting |
| Using TOON where nothing parses it | APIs, databases, and libraries expect JSON | JSON at the interface, TOON only inside prompts |
| Assuming the model understands TOON | Comprehension varies; a confused model costs more than the tokens saved | Test with your prompt, and explain the format in the system prompt if needed |
| Forgetting delimiters in values | A comma inside a value changes the row width | Let the converter quote them, then round-trip to confirm |
| Sending TOON to an API that expects JSON | It will fail to parse | Never send TOON as `application/json` |

## FAQ

### Is TOON valid JSON?

No. TOON is a different encoding with its own syntax; `JSON.parse()` cannot read it. It encodes the same data model, so conversion back to JSON is possible for supported syntax.

### Can TOON have comments?

The specification defines full-line `#` comments as decode-side syntax — decoders strip them in a pre-pass, and encoders must not emit them. So converted TOON never contains comments, and there is no inline or trailing comment form. This converter does not accept comment lines in input; keep them out of what you paste.

### When should I use TOON instead of JSON?

When you are putting a large, uniform set of records into an LLM prompt and input tokens or context window are the constraint. Keep JSON everywhere else — APIs, storage, configuration, and anything a standard parser reads.

### How many tokens does TOON save?

It depends on your data and your tokenizer, and no fixed percentage applies. Published benchmarks report substantial savings on tabular data against indented JSON, and a much smaller difference against minified JSON — sometimes none at all. Measure your own payload instead of assuming.

### Is the conversion lossless?

For supported syntax, yes: strings, numbers, booleans, null, objects, arrays, and key order are preserved. Verify with a round trip on your own data, especially if values contain delimiters or colons.

### Can TOON handle nested objects?

Yes — nested objects use indented `key: value` lines. But nesting is also where TOON's size advantage usually disappears, because the tabular form only applies to uniform arrays of objects.

### What about arrays of arrays?

They work, in list form, but they are not the shape TOON is designed to compress. Some published analyses find minified JSON smaller for these structures. Check the comparison before committing.

### Is this site's token count a real tokenizer count?

No. It is an estimate: characters divided by four, rounded up, applied identically to both sides. Real counts vary by model and tokenizer, so use the numbers to compare the two representations, not to predict a bill.

### Should I use TOON with every LLM?

Only if the model reliably understands it. Test comprehension and output quality with your own prompts before relying on it, and consider describing the format in your system instructions.

## What's Next?

- **Compare on your own data:** open the [JSON to TOON Converter](/tools/convert/json-to-toon) and read the character, byte, and token comparison.
- **Shrinking JSON for transport?** Use the [JSON Minifier](/tools/format/json-minifier) — minified JSON is the baseline TOON has to beat.
- **Working with record streams?** Read [JSON vs JSONL](/blog/json-vs-jsonl) for storage and pipeline formats.
- **Need to inspect or edit the JSON first?** Use the [JSON Editor](/tools/format/json-editor).
- **Documenting payloads?** See [Comments in JSON](/blog/json-comments).

---

*All tools on JSON Toolbox run entirely in your browser. Your data never leaves your device.*
