---
name: json-blog-writer
description: >
  Create and improve high-quality JSON developer content for JSON Toolbox
  using local Markdown articles, tool-page metadata, internal-link maps,
  and real search performance data from Google Search Console and Bing Webmaster Tools.
---

# JSON Toolbox Blog Writer

## Objective

Produce useful, evidence-based JSON developer articles for JSON Toolbox (`jsontoolbox.cc`).

Never invent content priorities from generic SEO assumptions when local article data or search performance data is available.

## Two Operating Modes

### Mode A: Content Plan Mode (no search data yet)

When the site is new and has no GSC/Bing data, use the **content plan** instead of search data:

1. Read `references/content-plan.md` — the externally-researched article queue
2. Scan local published Markdown files to avoid duplication
3. Scan tool-page JSON configs for internal linking
4. Pick the next article from the production queue
5. Output an opportunity report — do NOT write the article yet
6. Wait for user confirmation, then write the article
7. Run quality checks (content, SEO, links, product truthfulness)
8. Save the draft for review

Switch to Mode B once GSC/Bing data is available (typically after ~3 months).

### Mode B: Data-Driven Mode (with search performance data)

When GSC/Bing reports are available in `data/gsc/` and `data/bing/`:

1. Scan local published Markdown files.
2. Scan tool-page JSON configs.
3. Build the content index and internal-link map.
4. Read the latest GSC report (if available).
5. Read the latest Bing Webmaster Tools report (if available).
6. Analyze existing performance and content gaps across both engines.
7. Decide whether to update an existing article or create a new one.
8. Output an opportunity report — do NOT write the article yet.
9. Wait for user confirmation, then write the article.
10. Run quality checks (content, SEO, links, product truthfulness).
11. Save the draft for review.

## Required Inputs

Before writing, inspect these sources in order:

| # | Source | Path | Purpose |
|---|--------|------|---------|
| 1 | Blog Markdown | `content/{en,zh}/blog/*.md` | Existing articles, frontmatter, slugs, tags |
| 2 | Tool configs | `app/assets/data/{category}/{slug}.json` | Tool names, slugs, categories, nextSteps, recommends |
| 3 | Category meta | `app/assets/data/{category}/_meta.json` | Category names, icons, themes |
| 4 | Blog categories | `app/assets/config/blog-category.json` | Valid category keys |
| 5 | Content schema | `content.config.ts` | Frontmatter validation rules |
| 6 | **Content plan** | `references/content-plan.md` | **Article queue for Mode A (no search data yet)** |
| 7 | GSC data | `data/gsc/*.csv` or `data/gsc/*.json` | Google search performance (Mode B) |
| 8 | Bing WMT data | `data/bing/*.csv` or `data/bing/*.json` | Bing search performance (Mode B) |
| 9 | Content policy | `references/content-policy.md` | Writing rules and quality bar |
| 10 | Article template | `references/article-template.md` | Frontmatter + structure |
| 11 | Link rules | `references/internal-linking.md` | How to build links |
| 12 | GSC rules | `references/gsc-opportunity-rules.md` | GSC analysis rules |
| 13 | Bing rules | `references/bing-opportunity-rules.md` | Bing analysis rules |

If an input is missing, state that it is missing. Do NOT silently replace missing performance data with assumptions.

## Article Modes

Choose exactly one mode for each article:

- **`new-article`**: No suitable existing article covers the opportunity.
- **`update-article`**: An existing article has impressions, ranking potential, outdated information, weak CTR, or missing sections.
- **`supporting-article`**: An article is needed to strengthen an existing tool page or topic cluster.
- **`consolidation`**: Multiple articles overlap and should be merged or redirected.

## Dual-Engine Search Analysis

### Google Search Console

Use the GSC Performance report metrics:
- `clicks`, `impressions`, `ctr`, `position`
- Dimensions: `query`, `page`, `date`, `country`, `device`

### Bing Webmaster Tools

Use the Bing WMT API or exported data:
- `Clicks`, `Impressions`, `CTR`, `AveragePosition`
- Dimensions: `Query`, `Page`, `Date`, `Country`, `Device`
- API endpoint: `GetQueryTraffic`, `GetPageTraffic`

### Cross-Engine Comparison

When both GSC and Bing data are available:

1. **Merge** by query + page, flagging source engine.
2. **Identify cross-engine patterns**:
   - Queries ranking well on both → strong content, maintain
   - Queries ranking well on Bing but not GSC → potential Google optimization opportunity
   - Queries ranking well on GSC but not Bing → potential Bing optimization opportunity
   - Queries with high impressions on either engine but no clicks → CTR problem (title/description)
3. **Weight combined traffic potential**: A query with 500 GSC impressions + 300 Bing impressions has more total potential than one with 600 GSC impressions alone.

### Ranking Zones

| Zone | Position | Action |
|------|----------|--------|
| Top 3 | 1–3 | Maintain, protect from cannibalization |
| Page 1 | 4–10 | Optimize for higher CTR, strengthen content |
| Opportunity | 11–20 | Content improvement can move these up |
| Long-term | 21–50 | Needs significant content + authority work |
| Low priority | 51+ | Monitor only, don't prioritize |

## Opportunity Decision Rules

### Update Candidate

Prefer updating an existing article when:
- It already receives meaningful impressions on GSC or Bing
- Its average position indicates ranking potential (zone 4–20)
- The query is closely related to the article
- The article does not fully answer the query
- The title or description does not match the observed intent
- The article is outdated or lacks examples

### New Article Candidate

Prefer a new article when:
- The query cluster is not adequately covered by existing content
- The intent is materially different from existing articles
- Several related queries point to the same missing topic
- The topic can link naturally to one or more JSON Toolbox tools
- Creating a separate article avoids cannibalization

### Do NOT Create an Article When

- The query is only a minor variation of an existing article
- The opportunity is better solved by improving an existing section
- The query is clearly navigational (e.g., "jsontoolbox.cc", "json toolbox login")
- The proposed article would repeat an existing article
- There is no meaningful internal destination or user problem

### High-Traffic Page Protection

- If a page has ≥ 500 monthly clicks and the target query cluster differs from existing traffic → **create a new page**, do not rewrite
- If the target cluster is a synonym expansion of existing traffic → **micro-optimize** the existing page

## Internal Linking

Every article must have an internal-link plan before drafting.

### Link Sources

1. **Tool pages**: From `app/assets/data/{category}/{slug}.json`
   - Route: `/tools/{category}/{slug}`
   - Use `en.name` or `zh.name` as link text
   - Prioritize tools mentioned in `nextSteps` and `recommends`

2. **Other blog articles**: From `content/{locale}/blog/*.md`
   - Route: `/blog/{slug}`
   - Use the article's `title` as link text

### Link Rules

- Links must be contextually relevant and useful at the moment the reader needs them
- Use descriptive link text, not "click here" or "learn more"
- Never invent URLs — all links must match actual project routes
- Link naturally within prose, not in forced "Related Tools" sections alone

### Link Map Format

Build a link map index before writing:

```json
{
  "pages": [
    {
      "path": "/tools/format/json-editor",
      "type": "tool",
      "title": { "en": "JSON Editor", "zh": "JSON 编辑器" },
      "topics": ["format json", "validate json", "edit json"],
      "category": "format"
    },
    {
      "path": "/blog/what-is-json",
      "type": "article",
      "title": { "en": "What Is JSON?", "zh": "JSON 是什么？" },
      "topics": ["json syntax", "json data types", "json structure"],
      "category": "json_tools"
    }
  ]
}
```

## Writing Requirements

### Content Rules

Each article must:
- Answer the main question near the beginning
- Explain the problem before promoting the tool
- Include realistic, valid JSON examples
- Distinguish JSON syntax from JavaScript syntax
- Explain common errors and edge cases
- Mention privacy/client-side processing only when relevant
- Avoid unsupported claims and generic filler
- Include useful internal links naturally
- Include a clear title, description, slug, and structure

### Frontmatter Requirements

Must match the `blog` collection schema in `content.config.ts`:

```yaml
---
title: string          # Required
description: string    # Required
category: string       # Required — one of: json_tools, tutorials, best_practices, data_formats
h1: string             # Optional — custom H1 override
date: YYYY-MM-DD       # Required — publish date
lastmod: YYYY-MM-DD    # Optional — last modified
image: string          # Optional — cover image path
tags: string[]         # Optional
author: string         # Default: "JSON Toolbox Team"
promo:                 # Optional
  slug: string         # Must match actual tool slug
  text: string
  btn: string
locales: string[]      # Required — e.g. ["en", "zh-CN"]
---
```

### i18n Rules

- EN: Clear, concise, developer-friendly
- ZH: Direct, concise, no filler. Use "你" not "您". Short sentences.
- Technical terms stay as-is: JSON, API, CSV, YAML, XML
- See `references/content-policy.md` for full terminology mapping

### What NOT to Write

- Promotional copy disguised as a tutorial
- Features the tool does not actually have
- Claims about speed, security, or capability not verified in code
- Generic "Top 10 JSON Tools" listicles
- Content that duplicates existing articles

## Output Format

### Step 1: Opportunity Report (before writing)

Output this report and wait for confirmation:

```markdown
## Content Opportunity Report

- **Mode**: update-article | new-article | supporting-article | consolidation
- **Source data**: GSC (date range) / Bing WMT (date range) / Both
- **Existing page**: /blog/... (if applicable)
- **Query cluster**:
  - query 1 (impressions, clicks, CTR, position — engine)
  - query 2 (...)
- **Cross-engine insight**: (if both GSC + Bing data available)
- **Content gap**: What's missing from current coverage
- **Recommended title**: ...
- **Search intent**: informational | transactional | troubleshooting
- **Outline**: H2/H3 structure
- **Internal-link plan**: Tool pages + blog articles to link
- **Cannibalization risk**: Which existing pages might compete
- **Estimated impact**: Based on current impressions × target CTR
```

### Step 2: Article Draft (after confirmation)

Write the full Markdown file to `content/{locale}/blog/{slug}.md`.

### Step 3: Quality Checks

After writing, run these checks:

#### Content Check
- [ ] Answers the title question?
- [ ] First paragraph gives a direct answer?
- [ ] Examples are real and valid?
- [ ] JSON code parses correctly?
- [ ] Common errors and edge cases explained?
- [ ] No AI filler or repetitive paragraphs?
- [ ] No duplication with existing articles?
- [ ] Accurately describes JSON Toolbox features?

#### SEO Check
- [ ] Title matches real search intent?
- [ ] Description is specific, not keyword-stuffed?
- [ ] H1 is unique?
- [ ] H2s cover real queries?
- [ ] Slug is stable and descriptive?
- [ ] No keyword cannibalization?
- [ ] Natural tool-page internal links?
- [ ] Related blog internal links?
- [ ] No broken or invented links?

#### Product Truthfulness Check
- [ ] Does not claim unsupported formats
- [ ] Does not claim features not in the codebase
- [ ] Does not make absolute security claims
- [ ] "Client-side processing" verified in code
- [ ] Tool slugs in promo/links actually exist

#### Schema Check
- [ ] All required frontmatter fields present?
- [ ] `category` is a valid key from `blog-category.json`?
- [ ] `promo.slug` matches an actual tool slug?
- [ ] `locales` array includes the target language?
- [ ] `date` format is YYYY-MM-DD?

## How to Invoke

Run the skill with:

```
/json-blog-writer
```

Or describe the task:

```
Run json-blog-writer skill:
1. Scan local articles and tool pages.
2. Read data/gsc/ and data/bing/ for latest reports.
3. Find queries with real impressions or ranking opportunities.
4. Decide: update existing or create new article.
5. Output opportunity report — don't write yet.
6. After confirmation, generate full Markdown.
7. Auto-add internal links from local routes.
8. Run content, SEO, and link quality checks.
```

## Important Rules

1. **Never guess content priorities** — use real data or explicitly say "no data available"
2. **Never auto-publish** — always save as draft for review
3. **Sync languages** — when updating en, plan the zh update too
4. **Cross-engine awareness** — always check if Bing data tells a different story than GSC
5. **Protect high-traffic pages** — ≥500 monthly clicks = cautious approach
6. **100% keyword coverage** — every target keyword must appear naturally in the content
7. **Record expectations** — note whether ranking improvement needs domain authority growth
