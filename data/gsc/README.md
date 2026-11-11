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

## 当前报表（2026-11-11）与待补维度

- `2026-11-11.xlsx`：Last 3 months（2026-08-21 → 11-08），含 `Chart` / `Queries`(812) / `Pages`(68) / `Countries` / `Devices` 等 sheet。**当前是 xlsx，而 `json-blog-writer` 的 Required Inputs 只列 `.csv` / `.json`，不会被自动读取**；需另存 CSV 或扩展读取逻辑。
- 缺口：**没有 query × page 映射**。`Queries` 只有 query 维度、`Pages` 只有 page 维度，无法判断某个词由哪个 URL 承接，也无法确认关键词自相残杀。
- 补导方式：GSC UI 单次导出只能按一个维度分组；拿 query × page 需用 Search Analytics API 指定 `dimensions: ['query','page']`，或按页面过滤后逐页导出查询再合并。
- 建议文件名：`latest-query-page.csv`，列 `query,page,clicks,impressions,ctr,position,date`；同时保留 `latest-queries.csv` 与 `latest-pages.csv`。
- 口径警告：`Queries` 表 812 行 clicks 合计仅 3，`Pages` 表合计 51，属长尾 query 匿名化导致的差异。**点击以 Pages 表为准**，Queries 表只用于 impressions / position 排序。

## 校验

```
node scripts/validate-seo-reports.mjs
```

只做检查、不改写报表；`--strict` 可在缺维度时返回非 0 退出码。
