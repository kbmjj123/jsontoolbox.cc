# jsontoolbox.cc

An open-source, client-side JSON toolbox maintained by an independent developer: **31 browser-based tools** for formatting, validating, repairing, comparing, converting, viewing, and generating code from JSON — plus a growing library of developer guides.

Everything runs in your browser. Your JSON is parsed, converted, and rendered locally; it is never uploaded to a server, and no account is required.

**Live site:** [https://jsontoolbox.cc](https://jsontoolbox.cc)

## Languages

- [English](./README.md)
- [简体中文](./docs/README.zh-CN.md)

---

## What makes it different

- **100% client-side.** Every tool — including the large-file viewer — reads and processes data in the browser. There is no backend, no upload endpoint, and no telemetry pipeline holding your data.
- **JSON only, on purpose.** Not a generic "convert anything" site. The tool matrix follows real JSON workflows: API payloads, configuration, logs, data pipelines, and LLM prompts.
- **Built for large files.** Files over 5 MB are handed off to a dedicated viewer that renders only the visible rows and searches in a Web Worker, so multi-megabyte JSON and NDJSON stay usable instead of freezing the tab.
- **Honest about limits.** Tools report when an operation does not help — for example, the JSON ↔ TOON converter tells you when TOON is larger than minified JSON, and JSON Repair reports an error rather than returning half-recovered output.
- **Guides, not just tools.** Tutorials and comparisons that explain the *why* behind the formats: JSON vs JSONL, JSON vs YAML, JSON vs TOON, comments in JSON, and more.
- **Embeddable.** Drop a JSON editor or viewer into your own docs with an iframe generated at [jsontoolbox.cc/embed](https://jsontoolbox.cc/embed).

---

## Usage

- **Hosted version:** [https://jsontoolbox.cc](https://jsontoolbox.cc)
- **Embed in documentation:** generate an iframe snippet (editor or viewer, light/dark, height, readonly, branding) with the [embed generator](https://jsontoolbox.cc/embed)
- **Self-host:** deploy the whole toolbox on your own infrastructure
- **Reuse components:** the tool components are ordinary Vue 3 SFCs in `app/components/universal/` and can be copied into another Nuxt/Vue 3 project (no npm package is published yet)

---

## Tools

31 tools, grouped by task. All links go to the hosted version.

### Format, validate & repair

| Tool | What it does |
|---|---|
| [JSON Editor](https://jsontoolbox.cc/tools/format/json-editor) | Edit, validate, format, and minify JSON with live syntax validation, tree and table views, search, and copy or download |
| [JSON Repair](https://jsontoolbox.cc/tools/format/json-repair) | Fix broken JSON: trailing commas, single quotes, unquoted keys, missing brackets, comments, and Python constants |
| [JSON Minifier](https://jsontoolbox.cc/tools/format/json-minifier) | Remove insignificant whitespace to produce compact JSON, and compare character and byte sizes |
| [JSON Escape & Unescape](https://jsontoolbox.cc/tools/format/json-escape) | Escape text into a JSON-safe string and unescape JSON string literals |
| [JSON Schema Validator](https://jsontoolbox.cc/tools/format/json-schema-validator) | Validate JSON against a JSON Schema with detailed, field-level errors |
| [JSONPath Tester](https://jsontoolbox.cc/tools/format/json-path-tester) | Evaluate JSONPath expressions against your data and inspect matching values and paths |

### Large files

| Tool | What it does |
|---|---|
| [Large JSON Viewer](https://jsontoolbox.cc/tools/view/large-json-viewer) | Read-only viewing of large JSON and NDJSON with line numbers, virtual scrolling, Web Worker search, and exports as TXT, JSON, or CSV |

### Compare

| Tool | What it does |
|---|---|
| [JSON Compare](https://jsontoolbox.cc/tools/convert/json-compare) | Highlight added, removed, changed, and type-changed values, with options to ignore key order or specific fields |

### Convert: other formats → JSON

| Tool | What it does |
|---|---|
| [CSV to JSON](https://jsontoolbox.cc/tools/convert/csv-to-json) | Convert CSV, TSV, or delimited text into an array of JSON objects |
| [Excel to JSON](https://jsontoolbox.cc/tools/convert/excel-to-json) | Convert `.xlsx`, `.xls`, or `.csv` rows into JSON objects |
| [HTML Table to JSON](https://jsontoolbox.cc/tools/convert/html-to-json) | Extract HTML tables into JSON arrays |
| [TXT to JSON](https://jsontoolbox.cc/tools/convert/txt-to-json) | Turn plain or delimited text records into JSON |
| [XML to JSON](https://jsontoolbox.cc/tools/convert/xml-to-json) | Convert XML to JSON with configurable attribute and text handling |
| [YAML to JSON](https://jsontoolbox.cc/tools/convert/yaml-to-json) | Convert YAML to JSON, including multi-document files (one array entry per document) |

### Convert: JSON → other formats

| Tool | What it does |
|---|---|
| [JSON to YAML](https://jsontoolbox.cc/tools/convert/json-to-yaml) | Generate readable block-style YAML for configuration and docs |
| [JSON to CSV](https://jsontoolbox.cc/tools/convert/json-to-csv) | Flatten JSON arrays into CSV for Excel and Google Sheets |
| [JSON to Excel](https://jsontoolbox.cc/tools/convert/json-to-excel) | Convert JSON arrays to a spreadsheet |
| [JSON to HTML Table](https://jsontoolbox.cc/tools/convert/json-to-html) | Render JSON arrays as an HTML table |
| [JSON to Table](https://jsontoolbox.cc/tools/convert/json-to-table) | Inspect JSON arrays as a sortable, filterable table |
| [JSON to XML](https://jsontoolbox.cc/tools/convert/json-to-xml) | Transform JSON into XML |
| [JSON to Text](https://jsontoolbox.cc/tools/convert/json-to-text) | Flatten JSON into plain text |
| [JSON to PDF](https://jsontoolbox.cc/tools/convert/json-to-pdf) | Produce a printable PDF from JSON data |

### Convert: JSON variants

| Tool | What it does |
|---|---|
| [JSONC to JSON](https://jsontoolbox.cc/tools/convert/jsonc-to-json) | Strip `//` and `/* */` comments and trailing commas, keeping comment-like text inside strings |
| [JSON to JSONL](https://jsontoolbox.cc/tools/convert/json-to-jsonl) | Turn a JSON array into one JSON value per line |
| [JSONL to JSON](https://jsontoolbox.cc/tools/convert/jsonl-to-json) | Parse each line into a value and collect them into a JSON array, reporting the line that failed |
| [JSON to TOON](https://jsontoolbox.cc/tools/convert/json-to-toon) | Convert to and from TOON for token-sensitive LLM prompts, with a side-by-side comparison against minified JSON |
| [JSON Parse and Stringify](https://jsontoolbox.cc/tools/convert/json-parse-stringify) | Parse JSON text into values, or stringify values into JSON text |

### Generate code, schema & data

| Tool | What it does |
|---|---|
| [JSON to Code](https://jsontoolbox.cc/tools/convert/json-to-code) | Generate starter data models in 8 languages: TypeScript, Python, Go, Rust, Java, Kotlin, C#, and Swift |
| [JSON to TypeScript](https://jsontoolbox.cc/tools/convert/json-to-typescript) | Generate TypeScript interfaces from JSON examples |
| [JSON Schema Generator](https://jsontoolbox.cc/tools/convert/json-schema-generator) | Infer a JSON Schema draft from representative JSON data |
| [JSON Array Generator](https://jsontoolbox.cc/tools/convert/json-array-generator) | Generate a sample JSON array by setting the item count and field names |

---

## Guides

The site also publishes developer guides under `/blog` (English, with Chinese versions for several of them). Recent topics include:

- [Comments in JSON](https://jsontoolbox.cc/blog/json-comments) — why JSON has no comments, and what to use instead
- [How to Create a JSON File](https://jsontoolbox.cc/blog/how-to-create-json-file) — writing, saving, and validating JSON on Windows, macOS, and Linux
- [How to Create a manifest.json File](https://jsontoolbox.cc/blog/how-to-create-manifest-json) — PWA and Chrome extension examples
- [JSON vs JSONL](https://jsontoolbox.cc/blog/json-vs-jsonl) — when records should be one per line
- [JSON vs TOON](https://jsontoolbox.cc/blog/json-vs-toon) — what token savings actually depend on
- [JSON vs YAML](https://jsontoolbox.cc/blog/json-vs-yaml) — machines vs humans, and what survives conversion
- [How to Read and Write JSON Files in Python](https://jsontoolbox.cc/blog/read-json-file-python) — `load` / `loads` / `dump` / `dumps`, encodings, and errors

Guides live in `content/en/blog/` and `content/zh/blog/` as Markdown with frontmatter.

---

## Tech Stack

- **Framework:** Nuxt 4 (Vue 3)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Content:** Nuxt Content (Markdown guides)
- **Internationalization:** `@nuxtjs/i18n` (English and 简体中文)
- **Build:** static site generation (Nuxt `preset: "static"`), deployable to Cloudflare Pages, Vercel, GitHub Pages, or any static host
- **Architecture:** fully client-side; no backend, no database

---

## Self-hosting & Deployment

### Requirements

- Node.js 20 or newer (Nuxt 4)
- pnpm 10 (see `packageManager` in `package.json`)

### Local Development

```bash
# Install dependencies
pnpm install

# Start local development server
pnpm dev
```

### Build & Deploy

```bash
# Build static files
pnpm build

# Generated static files are located in the `.output/public` directory.
# Deploy that directory to any static hosting service
# (e.g., Cloudflare Pages, Vercel, GitHub Pages, etc.).
```

You can also run `pnpm generate` for a full prerender, or `pnpm preview` to serve a build locally.

### Notes

- This is a fully client-side static site; no backend is required.
- For custom domains and HTTPS, configure them in your hosting platform.
- Set `NUXT_PUBLIC_SITE_URL` to your own domain so canonical URLs and sitemaps point at the right origin.
- Self-hosted deployments should comply with the [Self-hosting & Attribution](#self-hosting--attribution) guidelines.

### Project Layout

| Path | Contents |
|---|---|
| `app/components/universal/` | One Vue component per tool |
| `app/assets/data/{category}/{slug}.json` | Tool metadata: copy, features, guide, FAQ, SEO |
| `app/composables/` | Shared logic (parsing, large-file handling, tools registry) |
| `app/utils/` | Pure helpers, including the JSONC and TOON codecs |
| `content/{en,zh}/blog/` | Markdown guides |
| `i18n/locales/` | UI strings (`en.json`, `zh-CN.json`) |

---

## Self-hosting & Attribution

This project is free to use for personal and commercial self-hosting and derivative works.  
As an independent developer, I continuously maintain and update this project. If you deploy your own site using this code, we kindly ask that you keep a small attribution notice and a link back to support the project's continued development.

### Guidelines

If you self-host or build a derivative work and offer it as a service, we appreciate it if you:

1. **Keep Branding**  
   - Retain the following text and link in the page footer or an "About" page:  
     - "JSON tools powered by [jsontoolbox.cc](https://jsontoolbox.cc)"  
   - Please do not deliberately remove this information via configuration or trivial modifications.

2. **Add a Backlink**  
   - Add a link to [https://jsontoolbox.cc](https://jsontoolbox.cc) on the homepage or an About page.  
   - A normal link (without `rel="nofollow"`) is preferred so that search engines can recognize the source, but this is not strictly required.  
   - You do not need to add a link on every page; a link in the footer or About page is sufficient.

3. **Mention the Source (Recommended)**  
   - In your documentation, README, or About page, you can state:  
     - "This tool is built based on the open-source project jsontoolbox.cc."  
   - Including a link to the project homepage or GitHub repository is appreciated.

### Example Snippet

You can use HTML like this in your footer or About page:

```html
<p>
  JSON tools powered by
  <a href="https://jsontoolbox.cc" target="_blank" rel="noopener">jsontoolbox.cc</a>.
</p>
```

Or in Markdown:

```md
JSON tools powered by [jsontoolbox.cc](https://jsontoolbox.cc).
```

### White-label / No-Attribution License (Optional)

If you need a fully white-label version (e.g., for internal enterprise deployment without branding), please contact me for a separate license.  
This is optional and only for cases where you need a completely white-label solution. Regular self-hosting with attribution remains free under the MIT License.

**Contact:** [kbmjj123@gmail.com]

---

## Contributing

Bug reports and feature requests via GitHub Issues are welcome.  
This includes feedback on the hosted tools, the embeddable version, or the Vue components (if you integrate them in your own project).

If you would like to contribute code (e.g., adding a new JSON tool, improving existing features, enhancing i18n, etc.), please open an issue first to describe your idea so we can discuss the implementation.

The project is currently mainly maintained by me, but community feedback and suggestions are highly appreciated.

---

## License

This project is licensed under the [MIT License](./LICENSE.md).

---

## Contact & Support

If you have any questions, collaboration ideas, or need a white-label license, feel free to reach out:

- **Email:** [kbmjj123@gmail.com]  
- **GitHub Issues:** [https://github.com/kbmjj123/jsontoolbox.cc/issues](https://github.com/kbmjj123/jsontoolbox.cc/issues)  
- **Website:** [https://jsontoolbox.cc](https://jsontoolbox.cc)
