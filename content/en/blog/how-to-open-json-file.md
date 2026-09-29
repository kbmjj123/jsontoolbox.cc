---
title: "How to Open, View, and Edit a JSON File Online"
description: "Open a JSON file on Windows, Mac, or Linux, view it in Chrome, Firefox, or Edge, edit and format it in VS Code, and fix files that refuse to open."
h1: "How to Open, View, and Edit a JSON File Online"
category: "json_tools"
date: 2026-09-29
lastmod: 2026-09-29
image: "/blog/cover/en/how-to-open-json-file-cover.svg"
draft: true
tags:
  - "JSON"
  - "JSON Editor"
  - "Beginners"
  - "File Format"
  - "Tutorial"
author: "JSON Toolbox Team"
promo:
  slug: "json-editor"
  text: "Open your file in the browser — no install, no upload:"
  btn: "Open JSON Editor"
locales:
  - "en"
---

# How to Open, View, and Edit a JSON File Online

A `.json` file is plain text, so there is no single "JSON program" you need. Any text editor opens it — the question is which tool makes it readable, tells you when it is broken, and lets you format or edit it safely.

> **Skip the setup and open it now:** paste your JSON or open a local `.json` file in the [JSON Editor](/tools/format/json-editor) — it highlights syntax, validates as you type, formats with two or four spaces, and lets you copy or download the result. It runs in your browser, so nothing is uploaded.

Below that quick path, this guide covers every common way to open a JSON file: Windows, macOS, Linux, Chrome, Edge, Firefox, VS Code, phones, what to do when a file refuses to open, and how to save your edits back as valid `.json`.

## What is a JSON file?

JSON (JavaScript Object Notation) is a plain-text data format. A JSON file is a text file with the `.json` extension that contains one JSON value — usually an object or an array:

```json
{
  "name": "Ada",
  "active": true,
  "roles": ["admin", "editor"]
}
```

Because it is text, everything from Notepad to VS Code to a browser can open it. Editors add syntax highlighting and validation; browsers show the raw text or a built-in viewer. For the format itself, see [What Is JSON?](/blog/what-is-json).

## How to open a JSON file on Windows

**Notepad** — the built-in option:

1. Right-click the file → **Open with** → **Notepad** (or open Notepad first, then **File → Open**, and set the file type to **All Files (\*.\*)** so `.json` files are visible).
2. The file opens as text. It will not be highlighted or validated, and a minified file is one long line.

**Notepad++** — free, with JSON syntax highlighting and a JSON viewer plugin. Right-click the file → **Open with Notepad++**, or install it and choose it from the "Open with" list.

**VS Code** — the best option for regular work:

1. Right-click the file → **Open with Code**.
2. You get syntax highlighting, live validation, folding, and one-key formatting.

To make VS Code the default for `.json` files: right-click a `.json` file → **Open with** → **Choose another app** → select **Visual Studio Code** → tick **Always use this app to open .json files**.

## How to open a JSON file on macOS

**TextEdit** — built in, but with one trap:

1. Right-click the file → **Open With** → **TextEdit**.
2. If it shows formatting controls or odd fonts, it opened as rich text: press **Shift + Cmd + T** (**Format → Make Plain Text**) to switch.
3. For viewing only this is fine. For editing, save carefully — see the section on saving below.

**VS Code** — recommended:

1. Right-click the file → **Open With** → **Visual Studio Code** (or open VS Code and use **File → Open**).
2. You get highlighting, validation, and formatting.

To make it the default for every `.json` file: right-click the file → **Get Info** → **Open with** → choose **Visual Studio Code** → **Change All…**.

## How to open a JSON file on Linux

Any text editor works:

```bash
nano data.json     # terminal editor
gedit data.json    # GNOME default editor
code data.json     # VS Code, if installed
```

Desktop file managers also let you right-click → **Open With** and pick your editor. For a quick look without opening an editor, `cat data.json` prints the file, and `jq . data.json` prints it parsed and pretty-printed — an error there means the JSON is invalid.

## How to view a JSON file in Chrome, Edge, and Firefox

Browsers can open local JSON files directly:

1. **Drag and drop** the `.json` file onto a browser window, or
2. Press **Ctrl + O** (Windows/Linux) or **Cmd + O** (macOS) and select the file.

What you see depends on the browser:

| Browser | What happens |
|---|---|
| **Firefox** | Built-in JSON viewer: syntax highlighting, collapsible nodes, and a filter box |
| **Chrome** | Shows the raw text; install a JSON viewer extension for highlighting and folding |
| **Edge** | Same as Chrome — raw text by default, extensions add the tree view |

This is a good read-only check, not an editing workflow. Browsers cannot save changes back to the file, and a minified one-line file is unreadable either way.

## How to open, format, and edit JSON in VS Code

VS Code is the default answer for most developers:

1. **Open:** right-click the file → **Open with Code**, or **File → Open File**.
2. **Format:** **Shift + Alt + F** (Windows/Linux) or **Shift + Option + F** (macOS). You can also right-click → **Format Document**.
3. **Validate:** syntax errors are underlined in red, with the message on hover. This catches missing commas, unmatched brackets, and bad quotes as you type.
4. **Fold and explore:** use the folding arrows beside objects and arrays to collapse sections of a large file.
5. **Save:** **Ctrl + S** / **Cmd + S**. The `.json` extension is preserved.

Two notes. VS Code's validation checks syntax, not whether your data matches an expected schema. And VS Code accepts comments in some config files because it reads them as JSONC — that does not make them valid JSON; see [Comments in JSON](/blog/json-comments).

## How to view a JSON file on a phone

Phones have no built-in JSON viewer, but three options work:

- **A text editor app** — any editor from your app store opens `.json` as text. Fine for a quick look, awkward for anything minified.
- **A dedicated JSON viewer app** — available on both Android and iOS; these pretty-print and let you collapse nodes.
- **A mobile browser** — open the [JSON Editor](/tools/format/json-editor) and paste the file contents, or open the file if your browser supports picking it. You get formatting, validation, and editing without installing anything, which is often the smoothest path on a phone.

On mobile, editing large files is impractical regardless of the app — download or share the file to a computer for anything substantial.

## What to do if the JSON file won't open

| Symptom | Likely cause | What to do |
|---|---|---|
| It opens as gibberish or shows `\u0000`-like gaps | Wrong encoding — UTF-16, or a binary file renamed to `.json` | Re-save or export as UTF-8; confirm with `file data.json` |
| First character breaks the parse | UTF-8 BOM at the start of the file | Save as UTF-8 without BOM |
| Accented characters look wrong (`cafÃ©`) | File saved as ANSI, not UTF-8 | Open in VS Code and re-save with UTF-8 encoding |
| The name is really `data.json.txt` | Notepad saved it as a text document; Windows hides known extensions | Rename it, removing the `.txt`; show extensions in File Explorer |
| Editor shows fonts and formatting | It is a rich-text file (RTF/DOCX), not JSON | Open the true source, or copy the text into a plain-text editor |
| File is 0 bytes or truncated | Failed or interrupted download/export | Re-download; compare file size with the source |
| "Permission denied" or "file in use" | Another program holds the file, or you lack read permission | Close the other program; check file permissions |
| It opens but every parser rejects it | Invalid JSON — trailing comma, comment, single quotes | Validate it, then fix with [JSON Repair](/tools/format/json-repair) |
| The editor freezes or refuses the file | File is too large for in-browser editing | Use the [Large JSON Viewer](/tools/view/large-json-viewer) |

If a parser rejects the file and the error message is unclear, [JSON Parse Failed: 10 Common API Errors and How to Debug Them](/blog/json-parse-error-debug) walks through the messages one by one.

## How to save edits back as a .json file

Getting the content right is only half the job — the save has to keep the extension and the encoding.

**Notepad:**

1. **File → Save As**.
2. Set **Save as type** to **All Files (\*.\*)** — otherwise you get `data.json.txt`.
3. Type the full name: `data.json`.
4. Set **Encoding** to **UTF-8**, then save.

**VS Code:** press **Ctrl + S** / **Cmd + S**. The extension and encoding are preserved, and validation tells you immediately if your edit broke the syntax.

**Online editor:** click **Download** and save the `.json` file. Keep the original as a backup before replacing it.

The full saving walkthrough, including the traps that produce a file nothing can parse, is in [How to Create a JSON File](/blog/how-to-create-json-file).

## When to use an online editor vs a local tool

**Use a browser-based editor when:**

- You need to look at one file right now and do not want to install anything.
- You are on a machine where you cannot install software — a work laptop, a Chromebook, a phone.
- You want to format, validate, search, and download without touching the original file.
- The data is sensitive enough that you would rather not upload it to someone's server. The [JSON Editor](/tools/format/json-editor) parses, validates, formats, and minifies in your browser; the page does not upload your JSON.

What it gives you beyond viewing: syntax highlighting, live validation, two- or four-space formatting, minification, a tree view with copyable JSONPath per node, search by key, value, path, or a JSONPath subset, editing directly in the tree, a table view for arrays of objects with CSV export, and copy or download of the result.

**Use a local editor when:**

- You edit the same files repeatedly, or they live in a Git repository.
- You need offline access.
- Files are large enough that browser editing is impractical.

**Large files are the dividing line.** The JSON Editor targets everyday documents up to 5 MB; above that it hands the content to the [Large JSON Viewer](/tools/view/large-json-viewer), which opens big JSON and NDJSON files read-only, renders only the visible rows, and searches in a Web Worker so the page stays responsive. It does not edit or reformat — for that, work with the file locally or split it into smaller parts.

## FAQ

### Can I open a JSON file in Notepad?

Yes. Right-click → **Open with** → **Notepad**, or open Notepad and use **File → Open** with the file type set to **All Files (\*.\*)**. Notepad shows the raw text without highlighting or validation. If you save from Notepad, choose **All Files** and UTF-8, or you will end up with `data.json.txt`.

### How do I open a JSON file on a Mac?

Right-click → **Open With** → **TextEdit** (then **Shift + Cmd + T** if it opened as rich text), or use VS Code, which is the better choice for editing. To make VS Code the default for all JSON files: **Get Info** → **Open with** → **Visual Studio Code** → **Change All…**.

### Can I open a JSON file in Chrome?

Yes. Drag the file onto a Chrome window or press **Ctrl + O** / **Cmd + O**. Chrome shows the raw text; install a JSON viewer extension if you want highlighting and collapsible nodes. Firefox has a built-in JSON viewer.

### What is the best editor for JSON files?

VS Code for regular work: free, syntax highlighting, live validation, folding, and one-key formatting. For a quick look at a single file with nothing installed, a browser-based editor is faster. For files too big to edit comfortably, use a dedicated large-file viewer.

### How do I format a JSON file?

In VS Code, press **Shift + Alt + F** (Windows/Linux) or **Shift + Option + F** (macOS). In a browser, paste it into the [JSON Editor](/tools/format/json-editor) and choose two-space, four-space, or minified output, then copy or download. Formatting requires valid JSON — fix syntax errors first.

### Why won't my JSON file open?

Usually one of: the file is actually `data.json.txt`, it was saved as rich text or with a BOM, it is a binary or truncated download, or it is simply too large for the tool you are using. Check the name and encoding first, then validate the contents — see the troubleshooting table above.

### Can I edit a JSON file online?

Yes. Paste or open the file in the [JSON Editor](/tools/format/json-editor), change values, add or remove fields, reorder array items, validate, and download the result. Do not add comments — standard JSON has no comment syntax, details in [Comments in JSON](/blog/json-comments).

### Is it safe to upload JSON files to online viewers?

It depends on the tool: many online viewers upload your file to their server, which is a real problem for configs containing keys, tokens, or customer data. Read the privacy note before pasting. The tools on this site process data in your browser and do not upload it — though you should still avoid pasting credentials or confidential production data into any browser-based tool.

### How do I open a JSONL or NDJSON file?

They are also plain text, so any editor opens them — but each line is a separate JSON value, so a JSON formatter will reject the file as a whole. Use the [Large JSON Viewer](/tools/view/large-json-viewer), which handles NDJSON, or convert it with [JSONL to JSON](/tools/convert/jsonl-to-json). See [JSON vs JSONL](/blog/json-vs-jsonl).

## What's Next?

- **Open your file now:** [JSON Editor](/tools/format/json-editor) — paste or open, validate, format, edit, download.
- **File too big to edit?** Inspect it read-only in the [Large JSON Viewer](/tools/view/large-json-viewer).
- **Broken but you are not sure why?** Run it through [JSON Repair](/tools/format/json-repair).
- **Creating or re-saving a JSON file?** Read [How to Create a JSON File](/blog/how-to-create-json-file).
- **Hit a parse error?** See [JSON Parse Failed: 10 Common API Errors and How to Debug Them](/blog/json-parse-error-debug).

---

*All tools on JSON Toolbox run entirely in your browser. Your data never leaves your device.*
