# Tool Registration & Configuration System

## Overview

Every tool on the site is defined declaratively through JSON configuration files. No routing, navigation, or SEO configuration changes are needed when adding a new tool.

## Data Structure

```
app/assets/data/{category}/
├── _meta.json           ← Category metadata (slug, icon, theme, i18n)
└── {tool-slug}.json     ← Individual tool definition
```

### `_meta.json` Format

```json
{
  "slug": "format",
  "sort": 1,
  "icon": "lucide:align-left",
  "theme": { "bg": "...", "text": "...", "iconBg": "..." },
  "en": { "title": "...", "description": "...", "h2": "...", "pdesc": "...", "faq": [...] },
  "zh": { ... }
}
```

### Tool JSON Format

Two-level structure:

**Top-level (language-agnostic):**
- `slug` — Tool identifier, also URL path segment
- `category` — Which category this tool belongs to
- `component` — Maps to a Vue file in `components/universal/`
- `icon` — Lucide icon name
- `sort` — Ordering weight
- `nextSteps` — Tool slugs for the workflow chain
- `recommends` — Tool slugs for the recommendation section

**Language-level (`en`/`zh`):**
- `name`, `description` — Display text
- `meta` — SEO title, description, keywords
- `features` — Feature highlights
- `guide` — Step-by-step usage guide
- `faq` — FAQ items

## How It Works

### 1. Data Loading (`useTools` composable)

Uses `import.meta.glob` for build-time static import of all JSON files.

### 2. Dynamic Routing

URL pattern: `/tools/{category}/{slug}`

The page `[category]/[slug].vue`:
1. Calls `getToolDetail(category, slug)` to get merged data
2. Uses `tool.component` to resolve which universal component to load
3. Passes `:tool` prop to the component

### 3. Adding a New Tool

1. Create JSON config in `app/assets/data/{category}/{slug}.json`
2. Set `component` field to match a file in `components/universal/`
3. Create the universal Vue component
4. Done — routing, navigation, SEO all auto-generated
