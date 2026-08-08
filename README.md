# JSON Toolbox

JSON Toolbox (`jsontoolbox.cc`) is a free, client-side collection of JSON tools for developers.
Format, validate, compare, and convert JSON data directly in your browser — no uploads, no tracking.

## Features

- **JSON Formatter** — Format and beautify JSON with custom indentation
- **JSON Validator** — Validate JSON syntax with detailed error messages
- **JSON to CSV** — Convert JSON arrays to CSV format
- **JSON Tree Viewer** — Interactive tree view with expand/collapse and search
- **100% Client-Side** — All processing happens in your browser
- **Privacy First** — No data upload, no tracking
- **Open Source** — Transparent and community-driven

## Tech Stack

- **Framework:** Nuxt 4 (Vue 3, TypeScript)
- **Styling:** Tailwind CSS
- **Content:** Nuxt Content v3
- **i18n:** @nuxtjs/i18n (English, Chinese)
- **SEO:** @nuxtjs/seo (sitemap, robots, og:image)

## Getting Started

### Prerequisites

- Node.js v22+
- pnpm

### Installation

```bash
pnpm install
```

### Development

```bash
pnpm dev
```

### Build

```bash
pnpm build
```

### Preview

```bash
pnpm preview
```

## Project Structure

```
app/
├── assets/data/         ← Tool definitions (JSON configs)
├── components/
│   ├── app/             ← App shell (Header, Footer, Navigation)
│   ├── home/            ← Homepage sections
│   ├── universal/       ← Per-tool implementations
│   └── Nav/             ← Navigation components
├── composables/         ← Vue composables
├── pages/               ← File-based routes
├── types/               ← TypeScript type definitions
└── utils/               ← Utility functions
server/                  ← Nitro server (API routes, sitemap)
content/                 ← Markdown content (blog posts, legal pages)
i18n/locales/            ← Translation JSON files
```

## Adding a New Tool

1. Create JSON config in `app/assets/data/{category}/{slug}.json`
2. Set `component` field to match a file in `components/universal/`
3. Create the universal Vue component
4. Done — routing, navigation, SEO all auto-generated

## Deployment

This project is configured for static site generation and can be deployed to:

- **Cloudflare Pages**
- **Vercel**
- **Netlify**

```bash
pnpm generate
```

The output will be in `.output/public/`.

## License

MIT
