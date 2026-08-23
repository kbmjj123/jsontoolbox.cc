# jsontoolbox.cc

An open-source, client-side JSON toolbox maintained by an independent developer, providing formatting, validation, conversion, comparison, and code generation tools.  
This project is free to use for personal and commercial self-hosting. All processing happens in your browser; no data is sent to any server.

**Live Demo:** https://jsontoolbox.cc

## Languages

- [English](./README.md)
- [简体中文](./docs/README.zh-CN.md)

---

## Features

jsontoolbox.cc provides a collection of browser-based JSON tools, organized by common developer tasks.  
All tools run 100% client-side — no data is uploaded to any server.

### 1. View & Edit JSON

- **JSON Editor**  
  Online JSON editor with syntax highlighting and live validation.
- **JSON Escape & Unescape**  
  Escape or unescape JSON strings for special characters, quotes, and backslashes.
- **JSON Minifier**  
  Remove whitespace and comments to produce minimal, compact JSON.

### 2. Validate & Debug

- **JSON Schema Validator**  
  Validate JSON data against a JSON Schema and check structure and data types.
- **JSONPath Tester**  
  Test JSONPath expressions and extract values from JSON documents.

### 3. Compare JSON

- **JSON Compare**  
  Compare two JSON documents and highlight added, removed, and changed values.

### 4. Convert Between Formats

- **CSV ↔ JSON**  
  Convert CSV files to JSON arrays and vice versa.
- **YAML ↔ JSON**  
  Convert YAML configurations to JSON and back.
- **XML ↔ JSON**  
  Transform XML documents to structured JSON and vice versa.
- **JSON → Excel / CSV**  
  Flatten JSON arrays to CSV/Excel-compatible format for spreadsheets.
- **JSON → PDF**  
  Generate printable PDF documents from JSON data.
- **JSON → HTML Table**  
  Visualize JSON arrays as formatted HTML tables.

### 5. Generate Code & Schema

- **JSON to Code**  
  Generate type definitions and data models in 10 languages:  
  TypeScript, Python, Go, Rust, Java, Kotlin, C#, Swift, MySQL, and Protobuf.
- **JSON to TypeScript**  
  Quickly generate TypeScript interfaces from JSON examples.
- **JSON Schema Generator**  
  Automatically generate JSON Schema from sample JSON data.

---

## Tech Stack

- **Frontend:** Nuxt 4 (Vue 3)
- **Language:** TypeScript
- **Build & Deploy:** Static site generation (SSG), deployable to Cloudflare Pages, Vercel, GitHub Pages, or any static hosting
- **Internationalization:** Multi-language support (i18n)
- **Others:** Fully client-side implementation, no backend required

---

## Self-hosting & Deployment

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

# Generated static files are located in the `dist` directory.
# Deploy the `dist` directory to any static hosting service
# (e.g., Cloudflare Pages, Vercel, GitHub Pages, etc.).
```

### Notes

- This is a fully client-side static site; no backend is required.
- For custom domains and HTTPS, configure them in your hosting platform.
- Self-hosted deployments must comply with the [Self-hosting & Attribution](#self-hosting--attribution) requirements.

---

## Self-hosting & Attribution

This project is free to use for personal and commercial self-hosting and derivative works.  
As an independent developer, I continuously maintain and update this project. If you deploy your own site using this code, please keep the attribution notice and a backlink to support the project's continued development.

### Requirements

If you self-host or build a derivative work and offer it as a service, please comply with the following:

1. **Keep Branding**  
   - Retain the following text and link in the page footer or an "About" page:  
     - "JSON tools powered by [jsontoolbox.cc](https://jsontoolbox.cc)"  
   - Do not deliberately remove this information via configuration or trivial modifications.

2. **Add a Backlink**  
   - Add a link to https://jsontoolbox.cc on the homepage or an About page.  
   - The link should be `dofollow` (do not add `rel="nofollow"`), so search engines can recognize the source.

3. **Mention the Source (Recommended)**  
   - In your documentation, README, or About page, state:  
     - "This tool is built based on the open-source project jsontoolbox.cc."  
   - Include a link to the project homepage or GitHub repository.

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
Contact: [your-email@example.com]

---

## Contributing

Bug reports and feature requests via GitHub Issues are welcome.  
If you would like to contribute code (e.g., adding a new JSON tool, improving existing features, enhancing i18n, etc.), please open an issue first to describe your idea so we can discuss the implementation.

The project is currently mainly maintained by me, but community feedback and suggestions are highly appreciated.

---

## License

This project is licensed under the [MIT License](./LICENSE).

---

## Contact & Support

If you have any questions, collaboration ideas, or need a white-label license, feel free to reach out:

- **Email:** [kbmjj123@gmail.com]  
- **GitHub Issues:** https://github.com/kbmjj123/jsontoolbox.cc/issues  
- **Website:** https://jsontoolbox.cc