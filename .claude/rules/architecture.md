# System Architecture

## Overview

JSON Toolbox is a Nuxt 4 full-stack application providing free, client-side JSON tools for developers. All JSON processing happens locally in the browser — no data is ever uploaded to any server.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Nuxt 4 (Vue 3, TypeScript) |
| Styling | Tailwind CSS + `@egoist/tailwindcss-icons` (Lucide icons) |
| Content | Nuxt Content v3 (SQLite-based Markdown) |
| i18n | `@nuxtjs/i18n` v10 (en, zh) |
| SEO | `@nuxtjs/seo` (sitemap, robots, og:image, schema.org) |
| Deployment | Nitro static preset (Cloudflare Pages) |

## Key Directories

```
app/
├── assets/data/         ← Tool definitions (JSON configs, multi-language)
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

## Build & Deploy

- **SSR mode** with `nitro.preset: "static"` — prerendered static site
- Admin routes (`/admin/*`) are stripped during production build via `pages:extend` hook
