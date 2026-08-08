# Content & Blog System

## Overview

Content is managed via Nuxt Content v3 with SQLite backend (`experimental.nativeSqlite: true`). Content files are Markdown with YAML frontmatter.

## Content Configuration (`content.config.ts`)

Two collections defined:

### `blog` collection

```ts
source: '**/blog/*.md'   // Matches content/{lang}/blog/*.md
schema:
  title: string           // Required
  description: string     // Required
  category: string        // Required
  h1: string              // Optional — custom H1 override
  date: Date              // Required — publish date
  lastmod: Date           // Optional — last modified
  image: string           // Optional — cover image
  tags: string[]          // Optional
  author: string          // Default: 'JSON Toolbox Team'
  promo: {               // Optional — in-article promotion
    slug: string          // Tool slug to promote
    text: string          // Promo text
    btn: string           // Promo button text
  }
  locales: string[]       // Required — supported languages
```

### `general` collection

```ts
source: { include: '**/*.md', exclude: ['**/blog/**'] }
schema:
  title: string           // Required
  description: string     // Optional
  updatedAt: Date         // Optional
```

Used for legal pages: `privacy.md`, `terms-of-service.md`.

## Directory Structure

```
content/
├── en/
│   ├── blog/
│   │   ├── what-is-json.md
│   │   └── ...
│   ├── privacy.md
│   └── terms-of-service.md
└── zh/
    ├── blog/
    │   └── ...
    ├── privacy.md
    └── terms-of-service.md
```

## Blog Post Frontmatter Example

```markdown
---
title: "How to Convert JSON to CSV for Excel"
description: "A complete guide to converting JSON arrays to CSV format for Excel and Google Sheets."
h1: "JSON to CSV: The Complete Guide for Excel Users"
date: 2026-08-07
lastmod: 2026-08-07
image: /blog/json-to-csv-guide.jpg
tags: ["json", "csv", "excel", "guide"]
author: "JSON Toolbox Team"
promo:
  slug: "json-to-csv"
  text: "Need to convert JSON to CSV?"
  btn: "Try JSON to CSV"
locales: ["en"]
---
```

## Localization

Blog posts are **per-language files**, not i18n keys. Each language has its own set of `.md` files:
- `content/en/blog/foo.md` — English version
- `content/zh/blog/foo.md` — Chinese version (may have different slug, different publish date)

The `locales` frontmatter field declares which languages this post exists in. Posts can exist in only one language.

## Blog Pages

| Route | Component | Description |
|-------|-----------|-------------|
| `/blog` | `pages/blog/index.vue` | Blog listing (Nuxt Content query, sorted by date) |
| `/blog/{slug}` | `pages/blog/[...slug].vue` | Single post (catch-all, Markdown rendered) |

## Querying Content

```ts
// Server-side (Nitro):
const posts = await queryCollection(event, 'blog')
  .order('date', 'DESC')
  .limit(20)
  .all()

// Client-side (Vue):
const { data } = await useAsyncData(() =>
  queryCollection('blog').order('date', 'DESC').all()
)
```

## Syntax Highlighting

- Highlight.js is **disabled** in Nuxt Content config: `markdown.highlight: false`
- This prevents Shiki from generating classes that Tailwind's purge would remove
- `safelist` in `tailwind.config.js` preserves any remaining Shiki-generated classes

## Content Aliases

```ts
// nuxt.config.ts aliases:
'@nuxt/content/server' → './adapter-content.ts'
'@nuxt/content/dist/module.mjs' → './adapter-content.ts'
```

Custom content adapter for SQLite-native optimizations.
