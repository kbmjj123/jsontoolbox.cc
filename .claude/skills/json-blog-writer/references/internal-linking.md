# Internal Linking Rules

## Overview

Every blog article must have an internal-link plan before drafting. Links connect readers to relevant tools and related articles at the moment they need them.

## Link Sources

### 1. Tool Pages

Tool configs live in `app/assets/data/{category}/{slug}.json`.

**Route pattern**: `/tools/{category}/{slug}`

Example:
- Config: `app/assets/data/format/json-editor.json`
- Route: `/tools/format/json-editor`

**How to discover tools**:
- Read all JSON files in `app/assets/data/` (excluding `_meta.json`, `examples/`, `sub/`)
- Extract: `slug`, `category`, `en.name`, `zh.name`
- Pay attention to `nextSteps` and `recommends` fields — these suggest related tools

**Current tool categories**:
| Category | Path | Examples |
|----------|------|----------|
| `format` | `/tools/format/` | json-editor, json-minifier, json-path-tester, json-schema-validator, json-escape |
| `convert` | `/tools/convert/` | json-to-csv, json-to-yaml, json-to-xml, json-compare, csv-to-json, json-to-table, json-to-pdf |

### 2. Blog Articles

Articles live in `content/{locale}/blog/*.md`.

**Route pattern**: `/blog/{slug}`

**How to discover articles**:
- Read all `.md` files in `content/en/blog/` and `content/zh/blog/`
- Extract from frontmatter: `title`, `description`, `tags`, `category`, `slug` (from filename)
- Track which articles exist in which language

**Current articles**:
| Slug | EN Title | ZH Title |
|------|----------|----------|
| `what-is-json` | What Is JSON? Structure, Syntax, and Common Mistakes | JSON 是什么？结构、语法与常见错误 |
| `json-parse-error-debug` | JSON Parse Failed: 10 Common API Errors | JSON 解析失败怎么办？10 个典型错误 |
| `json-best-practices` | JSON Best Practices: API Design, Performance, Security | 前后端项目中 JSON 的最佳实践 |

## Building the Link Map

Before writing any article, build a link map by scanning all tools and articles.

### Link Map JSON Structure

```json
{
  "generated": "2026-09-03T12:00:00Z",
  "tools": [
    {
      "path": "/tools/format/json-editor",
      "category": "format",
      "slug": "json-editor",
      "component": "JsonEditor",
      "name": { "en": "JSON Editor", "zh": "JSON 编辑器" },
      "topics": ["format json", "validate json", "edit json", "beautify json"],
      "nextSteps": ["json-minifier", "json-to-csv"],
      "recommends": ["json-compare", "json-schema-validator"]
    }
  ],
  "articles": [
    {
      "path": "/blog/what-is-json",
      "slug": "what-is-json",
      "title": { "en": "What Is JSON?", "zh": "JSON 是什么？" },
      "category": "json_tools",
      "tags": ["JSON", "JSON Editor", "JSON Validator"],
      "locales": ["en", "zh-CN"]
    }
  ]
}
```

### How to Build It

1. Scan `app/assets/data/**/*.json` (skip `_meta.json`, `examples/`, `sub/`)
2. For each tool file: extract `slug`, `category`, `en.name`, `zh.name`, `nextSteps`, `recommends`
3. Derive topics from the tool name and description
4. Scan `content/{en,zh}/blog/*.md`
5. For each article: extract frontmatter `title`, `tags`, `category`, `locales`
6. Save to `data/content-index.json` (for reuse across sessions)

## Link Placement Rules

### DO

- Link where the reader naturally needs more context
  ```markdown
  If the JSON has syntax errors, use the
  [JSON Validator](/tools/format/json-schema-validator) to locate them.
  ```

- Link to related tools when mentioning a workflow
  ```markdown
  After formatting, you might want to
  [convert the JSON to CSV](/tools/convert/json-to-csv) for spreadsheet analysis.
  ```

- Link between articles on related topics
  ```markdown
  For a deeper dive into JSON syntax rules, see
  [What Is JSON?](/blog/what-is-json).
  ```

- Use the tool's localized name as link text
  ```markdown
  <!-- EN -->
  [JSON Formatter](/tools/format/json-formatter)
  <!-- ZH -->
  [JSON 格式化](/tools/format/json-formatter)
  ```

### DON'T

- ❌ "Click here to format JSON"
- ❌ "Learn more" (with a link)
- ❌ "JSON tools" (generic, not descriptive)
- ❌ Linking the same destination 5+ times in one article
- ❌ Links in every paragraph (2-4 tool links + 1-2 article links is sufficient)
- ❌ Forced "Related Tools" sections that feel mechanical

## Link Density Guidelines

| Article Length | Tool Links | Article Links | Total |
|---------------|------------|---------------|-------|
| 1000-2000 words | 2-3 | 1 | 3-4 |
| 2000-4000 words | 3-4 | 1-2 | 4-6 |
| 4000+ words | 4-6 | 2-3 | 6-9 |

These are guidelines, not hard limits. The key rule is: every link must be contextually justified.

## Cross-Language Linking

- Tool page URLs are language-independent: `/tools/format/json-editor` works for all locales
- Blog article URLs are language-independent: `/blog/what-is-json` works for all locales
- The `useBlog` composable handles locale-based content resolution
- When writing in one language, you can link to articles that exist in other locales — the routing handles it

## Validation Checklist

Before finalizing an article, verify:

- [ ] All tool link URLs match actual tool config paths
- [ ] All article link URLs match actual blog post paths
- [ ] Link text uses the correct localized tool/article name
- [ ] No duplicate links to the same destination
- [ ] Links are placed where readers need them, not at random
- [ ] No invented URLs (every link has a corresponding file)
