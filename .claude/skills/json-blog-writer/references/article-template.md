# Article Template

## Frontmatter Template

```yaml
---
title: "Article Title Here (Year Developer Guide)"
description: "A concise description of what this article covers and who it's for."
category: "json_tools"
h1: "Custom H1 if different from title (optional)"
date: 2026-09-03
lastmod: 2026-09-03
author: "JSON Toolbox Team"
image: "/blog/cover/{locale}/{slug}-cover.svg"
tags: ["JSON", "JSON Editor", "Related Tool", "Topic"]
locales: ["en", "zh-CN"]
promo:
  slug: "json-formatter"
  text: "🚀 Try it now:"
  btn: "Open JSON Formatter"
---
```

### Field Reference

| Field | Required | Notes |
|-------|----------|-------|
| `title` | ✅ | SEO title. Include primary keyword + year + modifier |
| `description` | ✅ | Meta description. 150-160 chars. Specific, not keyword-stuffed |
| `category` | ✅ | One of: `json_tools`, `tutorials`, `best_practices`, `data_formats` |
| `h1` | ❌ | Override if H1 should differ from `<title>` |
| `date` | ✅ | Publish date, YYYY-MM-DD format |
| `lastmod` | ❌ | Last modified date |
| `author` | ❌ | Default: "JSON Toolbox Team" |
| `image` | ❌ | Cover image path. Use pattern: `/blog/cover/{locale}/{slug}-cover.svg` |
| `tags` | ❌ | Array of relevant tags |
| `locales` | ✅ | Languages this post supports: `["en"]`, `["zh-CN"]`, or `["en", "zh-CN"]` |
| `promo` | ❌ | In-article tool promotion. `slug` must match actual tool slug |

### Category Keys

From `app/assets/config/blog-category.json`:

| Key | EN | ZH |
|-----|----|----|
| `json_tools` | JSON Tools | JSON 工具 |
| `tutorials` | Tutorials | 教程 |
| `best_practices` | Best Practices | 最佳实践 |
| `data_formats` | Data Formats | 数据格式 |

## Article Body Template

```markdown
<!-- Optional: comment out the H1 if it duplicates the title -->
<!-- # Article Title Here -->

Opening paragraph that directly answers the title question. 2-3 sentences max.
Mention the key problem this article solves.

> Optional callout: link to a relevant tool for readers who want to skip to action.

## Why This Matters

Context for the target audience. Who needs this? What problem does it solve?

## Main Topic Section 1

Core content. Use realistic examples.

```json
{
  "valid": true,
  "example": "This JSON must parse correctly"
}
```

## Main Topic Section 2

Continue with practical, actionable content.

### Subsection

Break down complex topics into digestible pieces.

## Common Errors and Edge Cases

Real error messages and how to fix them.

```json
// ❌ Invalid: trailing comma
{"key": "value",}

// ✅ Valid
{"key": "value"}
```

## FAQ

### Question 1 from real search data?

Direct answer. 1-2 sentences.

### Question 2 from real search data?

Direct answer. 1-2 sentences.

### Question 3 from real search data?

Direct answer. 1-2 sentences.

## Conclusion

Brief summary. Link to relevant tools for next steps.
```

## Example: Complete Article

```markdown
---
title: "How to Format JSON in VS Code and Online (2026 Guide)"
description: "Learn how to format and beautify JSON in VS Code, online tools, and the command line. Covers indentation, error detection, and common formatting issues."
category: "tutorials"
date: 2026-09-03
lastmod: 2026-09-03
author: "JSON Toolbox Team"
image: "/blog/cover/en/how-to-format-json-cover.svg"
tags: ["JSON", "JSON Formatter", "VS Code", "Formatting", "Developer Tools"]
locales: ["en"]
promo:
  slug: "json-formatter"
  text: "🚀 Format your JSON instantly:"
  btn: "Open JSON Formatter"
---

Formatting JSON makes it readable and helps spot errors quickly. You can format JSON in VS Code with built-in shortcuts, or use an online tool like [JSON Formatter](/tools/format/json-formatter) when you're not in your editor.

## Why Format JSON?

Minified JSON is hard to read and debug. Proper indentation reveals the structure at a glance, making it easier to find missing commas, mismatched brackets, or incorrect nesting.

## Format JSON in VS Code

1. Open a `.json` file
2. Press `Shift + Option + F` (Mac) or `Shift + Alt + F` (Windows)
3. VS Code formats the document using its built-in JSON formatter

You can also set JSON as the default formatter in settings:

```json
{
  "[json]": {
    "editor.defaultFormatter": "vscode.json-language-features"
  }
}
```

## Format JSON Online

When you're not in VS Code — for example, when debugging an API response in a browser — an online formatter is faster.

Paste your JSON into the [JSON Formatter](/tools/format/json-formatter), and it instantly shows:
- Formatted output with proper indentation
- Error location if the JSON is invalid
- Line and column numbers for quick navigation

## Common Formatting Errors

### Trailing Commas

```json
// ❌ Invalid
{"name": "Alice", "age": 30,}

// ✅ Valid
{"name": "Alice", "age": 30}
```

### Single Quotes

```json
// ❌ Invalid JSON (valid JavaScript)
{'name': 'Alice'}

// ✅ Valid JSON
{"name": "Alice"}
}
```

## FAQ

### How do I format a JSON file in the terminal?

Use `jq . file.json` or `python -m json.tool file.json` to pretty-print JSON from the command line.

### What indentation does JSON use?

Standard practice is 2 spaces, but 4 spaces and tabs are also common. The important thing is consistency within a file.

### Can I format minified JSON?

Yes. Paste it into [JSON Formatter](/tools/format/json-formatter) or use your editor's format command. Both handle single-line JSON.

## Next Steps

- [Validate your JSON](/tools/format/json-schema-validator) before deploying
- [Compare two JSON files](/tools/convert/json-compare) to spot differences
- [Convert JSON to CSV](/tools/convert/json-to-csv) for spreadsheet analysis
```

## Notes

- The `promo.slug` must reference an actual tool from `app/assets/data/`
- Internal links use relative paths: `/tools/{category}/{slug}` and `/blog/{slug}`
- JSON code blocks use `json` language identifier
- Comments in JSON code blocks use `//` notation (for illustration only — real JSON doesn't support comments)
- FAQ questions should come from real GSC/Bing query data when available
