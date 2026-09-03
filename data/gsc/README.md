# Google Search Console Data

This directory stores exported Google Search Console (GSC) performance data for analysis by the `json-blog-writer` skill.

## How to Export

### From the GSC Web Interface

1. Go to [Google Search Console](https://search.google.com/search-console)
2. Select property: `jsontoolbox.cc`
3. Go to **Performance** → **Search results**
4. Set date range:
   - **Latest period**: Last 28 days or last 3 months
   - **Comparison period**: Same length, immediately prior
5. Add filters as needed (e.g., specific pages)
6. Click **Export** (download icon) → **Download CSV**

### Export Types

| Tab | Export | Save As |
|-----|--------|---------|
| Queries | Export queries | `latest-queries.csv` |
| Pages | Export pages | `latest-pages.csv` |
| Queries + Pages | Use API or manual combination | `latest-query-page.csv` |

For trend analysis, also export the previous period:
- `previous-query-page.csv`

## CSV Format

### Standard Export

```csv
Top queries
Clicks,Impressions,CTR,Position
how to format json,45,1200,0.038,8.2
json validator online,32,890,0.036,11.4
```

### Recommended Normalized Format

For the skill to process correctly, normalize to:

```csv
date,query,page,clicks,impressions,ctr,position
2026-08-01,how to format json,/tools/format/json-editor,45,1200,0.038,8.2
2026-08-01,json validator online,/tools/format/json-schema-validator,32,890,0.036,11.4
```

## File Naming Convention

| Pattern | Description |
|---------|-------------|
| `latest-*.csv` | Current period data |
| `previous-*.csv` | Previous period for comparison |
| `*-queries.csv` | Query-level data |
| `*-pages.csv` | Page-level data |
| `*-query-page.csv` | Query-to-page mapping |

## Notes

- Export data regularly (at least monthly) for trend analysis
- Keep previous period data for comparison
- The skill reads all `.csv` and `.json` files in this directory
- Data is not committed to git (add to `.gitignore` if needed)
