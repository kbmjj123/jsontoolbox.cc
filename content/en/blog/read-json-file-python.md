---
title: "How to Read and Write JSON Files in Python"
description: "Read and write JSON in Python: json.load vs json.loads, json.dump vs json.dumps, UTF-8 and BOM handling, exception handling, and streaming large files."
h1: "How to Read and Write JSON Files in Python"
category: "json_tools"
date: 2026-09-29
lastmod: 2026-09-29
image: "/blog/cover/en/read-json-file-python-cover.svg"
draft: true
tags:
  - "JSON"
  - "Python"
  - "json.load"
  - "Tutorial"
  - "Data Processing"
author: "JSON Toolbox Team"
promo:
  slug: "json-editor"
  text: "Validate or format the JSON before it reaches your script:"
  btn: "Open JSON Editor"
locales: ["en"]
---

# How to Read and Write JSON Files in Python

Python's [`json`](https://docs.python.org/3/library/json.html) module has four functions that do almost everything you need, and one letter that decides which one to call: **`s` means string.**

```python
json.load(f)      # read from a file object
json.loads(text)  # read from a string
json.dump(data, f)      # write to a file object
json.dumps(data)        # write to a string
```

Once that clicks, the rest is details: which encoding to open with, how to pretty-print, which exceptions to catch, and what happens to your data when Python types become JSON types (and back).

## The four functions at a glance

| Function | Input | Output | Use when |
|---|---|---|---|
| `json.load(fp)` | File-like object with `.read()` | Python object | Reading from a file, `io.StringIO`, or a stream |
| `json.loads(s)` | `str`, `bytes`, or `bytearray` | Python object | Parsing a string you already have |
| `json.dump(obj, fp)` | Python object + file-like object | Writes to the file | Writing straight to disk |
| `json.dumps(obj)` | Python object | `str` | You need the JSON as text |

The `s` suffix is the whole trick: `loads` and `dumps` work with **s**trings; `load` and `dump` work with file objects.

`json.load()` does not require a real file — anything with a `.read()` method works, including `io.StringIO`:

```python
import io
import json

data = json.load(io.StringIO('{"name": "Ada"}'))
```

## How to read a JSON file in Python

```python
import json

with open("data.json", "r", encoding="utf-8") as f:
    data = json.load(f)

print(data["name"])
```

Three habits are worth fixing early:

1. **Use `with`.** It closes the file even if parsing raises.
2. **Always pass `encoding="utf-8"`.** In text mode `open()` uses a locale-dependent default, which makes the same script behave differently on different machines. JSON is defined as UTF-8, so say so explicitly.
3. **The result is a plain Python object** — usually a `dict`, `list`, `str`, `int`, `float`, `bool`, or `None`.

## How to write JSON to a file in Python

```python
import json

data = {
    "name": "Ada",
    "city": "Zürich",
    "active": True,
    "score": None,
}

with open("data.json", "w", encoding="utf-8") as f:
    json.dump(data, f, indent=2, ensure_ascii=False)
```

The parameters that matter:

| Parameter | Effect |
|---|---|
| `indent=2` | Pretty-prints with that many spaces. Omit it for compact output. |
| `ensure_ascii=False` | Writes `Zürich` instead of `Z\u00fcrich`. Non-ASCII text stays readable. |
| `sort_keys=True` | Sorts object keys alphabetically — useful for stable diffs. |
| `separators=(",", ":")` | Removes the spaces `indent` would add; combine with no `indent` for the tightest output. |

`ensure_ascii` defaults to `True`, which escapes every non-ASCII character. That is always valid JSON and always round-trips correctly, but a file full of `\u00fc` sequences is unpleasant to read. Setting it to `False` requires the file to be written as UTF-8 — which is why the `encoding="utf-8"` argument is not optional here.

**Writing atomically.** If another process may read the file while you write it, write to a temporary file and rename it, so a reader never sees a half-written document:

```python
import json
import os

def write_json_atomic(path, data, **kwargs):
    tmp = f"{path}.tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(data, f, **kwargs)
        f.flush()
        os.fsync(f.fileno())
    os.replace(tmp, path)   # atomic within the same filesystem

write_json_atomic("data.json", data, indent=2, ensure_ascii=False)
```

## Pretty-printing JSON in Python

To a string:

```python
text = json.dumps(data, indent=2, ensure_ascii=False)
print(text)
```

To a file, use `json.dump(data, f, indent=2)`. From the command line, Python ships a formatter:

```bash
python -m json.tool data.json            # pretty-print to stdout
python -m json.tool --indent 4 data.json
python -m json.tool --sort-keys data.json
```

For the tightest output:

```python
compact = json.dumps(data, separators=(",", ":"))
```

One caveat: `pprint` is for Python objects, not JSON. It prints `True`, `False`, `None`, and single quotes — none of which are valid JSON. Use `json.dumps(..., indent=2)` when the output has to be JSON.

## Encoding pitfalls: UTF-8, BOM, and utf-8-sig

A JSON file saved by Notepad on Windows may start with a UTF-8 BOM (`\xef\xbb\xbf`). Reading that with `encoding="utf-8"` fails:

```text
JSONDecodeError: Unexpected UTF-8 BOM (decode using utf-8-sig): line 1 column 1 (char 0)
```

The error even tells you the fix. Use `utf-8-sig`, which strips the BOM if present and behaves like `utf-8` otherwise:

```python
with open("data.json", "r", encoding="utf-8-sig") as f:
    data = json.load(f)
```

A helper that handles both cases is worth keeping around:

```python
def read_json(path):
    """Read JSON, tolerating a UTF-8 BOM."""
    with open(path, "r", encoding="utf-8-sig") as f:
        return json.load(f)
```

Two related traps:

- **Mojibake** (`ZÃ¼rich`) means the file was written in one encoding and read in another — usually UTF-8 bytes read as latin-1. Confirm the actual encoding rather than guessing.
- **Garbled or `\u0000`-style output** usually means the "JSON" file is not text at all — a binary file renamed to `.json`.

## Exception handling

```python
import json

try:
    with open("data.json", "r", encoding="utf-8") as f:
        data = json.load(f)
except FileNotFoundError:
    print("data.json does not exist")
except PermissionError:
    print("no permission to read data.json")
except json.JSONDecodeError as e:
    print(f"invalid JSON: {e.msg} (line {e.lineno}, column {e.colno})")
```

What each one tells you:

| Exception | Cause |
|---|---|
| `FileNotFoundError` | Path does not exist |
| `PermissionError` | Process cannot read the file |
| `json.JSONDecodeError` | The text is not valid JSON |
| `UnicodeDecodeError` | The bytes are not valid in the encoding you chose |
| `TypeError` (on dump) | An object cannot be serialized (e.g. a `set` or a custom class) |

`JSONDecodeError` subclasses `ValueError`, so `except ValueError` catches both it and other value problems. It carries useful attributes:

- `e.msg` — the reason, e.g. `Expecting value` for an empty file
- `e.lineno`, `e.colno` — 1-based line and column
- `e.pos` — character offset

An empty or whitespace-only file produces `Expecting value` — the Python equivalent of JavaScript's *Unexpected end of JSON input*. For a systematic walkthrough of parse failures, see [JSON Parse Failed: 10 Common API Errors and How to Debug Them](/blog/json-parse-error-debug).

## Working with large JSON files

`json.load()` builds the whole document in memory. For a large file, that is the problem, not the parsing.

**JSON Lines** is the practical fix when you control the format — one JSON value per line, read incrementally:

```python
import json

with open("events.jsonl", "r", encoding="utf-8") as f:
    for line_number, line in enumerate(f, start=1):
        line = line.strip()
        if not line:
            continue
        try:
            record = json.loads(line)
        except json.JSONDecodeError as e:
            print(f"skipping line {line_number}: {e.msg}")
            continue
        process(record)
```

Peak memory is bounded by the largest single line, not the file size. See [JSON vs JSONL](/blog/json-vs-jsonl) for when the format is worth adopting.

If you must read one huge JSON document (not JSON Lines), an incremental parser such as `ijson` yields items as it parses, instead of building the entire structure first. That is a third-party dependency, but it is the usual answer for multi-gigabyte single documents.

## Python types vs JSON types

The mapping is mostly automatic, with a few sharp edges:

| Python | JSON |
|---|---|
| `dict` | object |
| `list`, `tuple` | array |
| `str` | string |
| `int`, `float` | number |
| `True` / `False` | `true` / `false` |
| `None` | `null` |

The edges:

- **Tuples become arrays.** `json.dumps((1, 2))` gives `[1, 2]`, and reading it back gives a `list`, not a tuple. Tuples do not survive a round trip.
- **Non-string keys become strings.** `json.dumps({1: "a"})` gives `{"1": "a"}`, and the key comes back as `"1"`. Keys must be `str`, `int`, `float`, `bool`, or `None`; a tuple key raises `TypeError: keys must be str, int, float, bool or None, not tuple`.
- **`NaN` and `Infinity` are not JSON.** Python writes them by default (`NaN`, `Infinity`), but strict parsers reject that output. Pass `allow_nan=False` to raise `ValueError: Out of range float values are not JSON compliant` instead of emitting invalid JSON.
- **Duplicate keys: last one wins.** `json.loads('{"a": 1, "a": 2}')` returns `{"a": 2}`. There is no warning, so a typo in a hand-written file can silently drop data.
- **Sets, datetimes, and custom classes are not serializable** by default. Convert them first (`list(s)`, `dt.isoformat()`), or pass `default=` to `json.dumps`.

## Validate, format, and model JSON before it reaches your script

Most time lost to JSON bugs in Python is spent debugging data that was already broken. Three browser tools cover the steps before `json.load()` runs:

- **[JSON Editor](/tools/format/json-editor)** — paste or open the file to validate it live, format it with two or four spaces, minify it, and copy or download the result. Useful for confirming a file is valid before you point a script at it, and for pretty-printing an API response you are about to paste into a test fixture.
- **[JSON Array Generator](/tools/convert/json-array-generator)** — when you need sample data rather than a single object: set the item count and field names and download a pretty-printed JSON array to use as test input.
- **[JSON to Code Generator](/tools/convert/json-to-code)** — paste a representative sample and choose Python to get a starter `dataclass` (arrays become `list[Item]`, nested objects become separate declarations), then copy or download the `.py` file. The output is inferred from the sample, so review naming, optional fields, and nullability — it describes the shape, it does not validate runtime data.

All three run in your browser and do not upload the data, which matters when the JSON is a production payload.

## FAQ

### What is the difference between json.load() and json.loads()?

`json.load()` takes a file-like object and reads from it; `json.loads()` takes a string and parses it. The `s` stands for string. Use `load` with `open()`, `loads` with text you already have.

### How do I read a JSON file in Python?

```python
import json

with open("data.json", "r", encoding="utf-8") as f:
    data = json.load(f)
```

Add `encoding="utf-8-sig"` if the file may have a BOM.

### How do I write JSON to a file in Python?

```python
with open("data.json", "w", encoding="utf-8") as f:
    json.dump(data, f, indent=2, ensure_ascii=False)
```

### What is the difference between json.dump() and json.dumps()?

`json.dump()` writes to a file object; `json.dumps()` returns a string. Same `s` rule as `load` / `loads`.

### How do I pretty-print JSON in Python?

Pass `indent`: `json.dumps(data, indent=2)`. For a file, `json.dump(data, f, indent=2)`. From the shell, `python -m json.tool data.json`.

### Why do I get "Unexpected UTF-8 BOM"?

The file starts with a byte-order mark, usually because it was saved by a Windows editor. Open it with `encoding="utf-8-sig"`, which strips the BOM.

### Which exceptions should I catch when reading JSON?

`FileNotFoundError` and `PermissionError` for the file itself, `json.JSONDecodeError` for invalid content, and `UnicodeDecodeError` for encoding mismatches. `JSONDecodeError` subclasses `ValueError`, so a single `except ValueError` covers it.

### How do I handle large JSON files in Python?

For JSON Lines, iterate the file and call `json.loads(line)` per line. For one huge document, use an incremental parser such as `ijson`. `json.load()` always loads the entire document into memory.

### Is a Python dict the same as a JSON object?

No. A dict is an in-memory Python structure whose keys can be any hashable type; a JSON object is text with string keys. Serialization converts between them, and the conversion is lossy in places: tuples become arrays, non-string keys become strings, and `NaN` has no valid JSON representation.

## What's Next?

- **Check a file before parsing it:** [JSON Editor](/tools/format/json-editor).
- **Need sample data?** Generate an array with the [JSON Array Generator](/tools/convert/json-array-generator).
- **Want a model for the payload?** Generate a Python dataclass with the [JSON to Code Generator](/tools/convert/json-to-code).
- **Working with line-delimited data?** Read [JSON vs JSONL](/blog/json-vs-jsonl).
- **Debugging a parse failure?** See [JSON Parse Failed: 10 Common API Errors and How to Debug Them](/blog/json-parse-error-debug).

---

*All tools on JSON Toolbox run entirely in your browser. Your data never leaves your device.*
