# Google Search Console Opportunity Rules

## Data Source

Google Search Console (GSC) Performance report.

### How to Export

1. Go to [Google Search Console](https://search.google.com/search-console)
2. Select property: `jsontoolbox.cc`
3. Go to **Performance** → **Search results**
4. Set date range (28 days, 3 months, or 6 months)
5. Click **Export** → Download CSV

### Export Files

Save to `data/gsc/`:

| File | Content | Use |
|------|---------|-----|
| `latest-queries.csv` | Queries with clicks/impressions/CTR/position | Top-level query analysis |
| `latest-pages.csv` | Pages with clicks/impressions/CTR/position | Page-level performance |
| `latest-query-page.csv` | Queries mapped to pages | Topic-to-page matching |
| `previous-query-page.csv` | Same as above, previous period | Trend comparison |

### CSV Format

```csv
date,query,page,clicks,impressions,ctr,position,country,device
2026-08-01,how to format json,/blog/format-json,12,480,0.025,11.4,USA,DESKTOP
```

Or without date (aggregated):

```csv
query,page,clicks,impressions,ctr,position
how to format json,/blog/format-json,12,480,0.025,11.4
```

## Metrics Reference

| Metric | Description | Good For |
|--------|-------------|----------|
| `clicks` | How many times users clicked | Actual traffic value |
| `impressions` | How many times the result was shown | Topic demand |
| `ctr` | clicks / impressions | Title/description effectiveness |
| `position` | Average ranking position | Content competitiveness |

## Analysis Steps

### Step 1: Overview

Calculate for the period:
- Total queries
- Total impressions
- Total clicks
- Average CTR
- Average position

### Step 2: Position Distribution

| Zone | Range | Meaning |
|------|-------|---------|
| Strong | 1-3 | Top of SERP — protect these |
| Good | 4-10 | First page — optimize CTR |
| Opportunity | 11-20 | Second page — content improvement can help |
| Long-term | 21-50 | Needs significant work |
| Monitor | 51+ | Low priority |

Count queries in each zone. Focus on the "Opportunity" zone (11-20) for quick wins.

### Step 3: Query-to-Page Mapping

For each query:
1. Does it map to an existing article? → Update candidate
2. Does it map to a tool page? → Consider supporting article
3. Does it map to nothing? → New article candidate
4. Does it map to multiple pages? → Cannibalization risk

### Step 4: Intent Classification

| Intent Type | Signal | Action |
|-------------|--------|--------|
| Informational | "what is", "how to", "guide" | Tutorial/guide article |
| Transactional | "online", "free", "tool", "converter" | Tool page or comparison article |
| Troubleshooting | "error", "failed", "fix", "not working" | Debug guide |
| Navigational | Brand name, specific page name | Don't create content |

### Step 5: Opportunity Identification

#### High-Impression, Low-CTR (Title/Description Problem)

- Impressions > 100, CTR < 2%
- The page is being shown but not clicked
- Action: Rewrite title and meta description to better match intent

#### High-Impression, Position 8-20 (Content Gap)

- Impressions > 50, position 8-20
- The page ranks but isn't competitive enough
- Action: Expand content, add missing sections, improve examples

#### Query Cluster Without Coverage (New Content)

- Multiple related queries, no matching article
- Action: Create new article targeting the cluster

#### Multiple Pages, Same Query (Cannibalization)

- Same query sending traffic to 2+ pages
- Action: Consolidate or differentiate the pages

## Decision Matrix

### Update Existing Article When:

| Condition | Confidence |
|-----------|------------|
| Article has impressions for the target query | High |
| Position is in zone 4-20 | High |
| Query intent matches article topic | High |
| Article is missing sections that queries demand | Medium |
| Article title/description doesn't match intent | Medium |
| Article is > 6 months old | Medium |

### Create New Article When:

| Condition | Confidence |
|-----------|------------|
| No existing article covers the query cluster | High |
| Intent is materially different from existing articles | High |
| Multiple related queries point to same gap | Medium |
| Topic naturally links to JSON Toolbox tools | Medium |
| New article won't cannibalize existing pages | Medium |

### Do NOT Create When:

| Condition | Reason |
|-----------|--------|
| Query is a minor variation of existing article | Update existing instead |
| Query is navigational (brand name) | No content needed |
| No clear internal link destination | Low value |
| Would duplicate an existing article | Cannibalization risk |

## High-Traffic Page Protection

Before modifying a page with ≥ 500 monthly clicks:

1. **Identify the page's traffic source queries** (which queries bring clicks)
2. **Check if target queries overlap** with existing traffic queries
3. **Decision**:
   - Overlap (same topic cluster) → Micro-optimize existing page
   - No overlap (different topic) → Create new page instead
   - The page has both types of traffic → Be very careful, consider adding a section rather than rewriting

## Trend Analysis

When comparing two periods (e.g., this month vs last month):

| Trend | Signal | Action |
|-------|--------|--------|
| Impressions ↑, Clicks ↑ | Growing topic | Invest more content |
| Impressions ↑, Clicks ↓ | CTR problem | Fix title/description |
| Impressions ↓, Clicks ↑ | Better targeting | Maintain current approach |
| Impressions ↓, Clicks ↓ | Declining topic | Check if still relevant |
| New queries appearing | Emerging topic | Consider new content |
| Queries disappearing | Declining interest | Don't invest heavily |
