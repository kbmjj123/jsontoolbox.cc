# Bing Webmaster Tools Data

This directory stores exported Bing Webmaster Tools (Bing WMT) performance data for analysis by the `json-blog-writer` skill.

## How to Get Data

### Option 1: Web Portal Export

1. Go to [Bing Webmaster Tools](https://www.bing.com/webmasters)
2. Select site: `jsontoolbox.cc`
3. Navigate to **Reports** section
4. **Search Keywords** → Export keyword data
5. **Page Traffic** → Export page data
6. Set date range to match GSC exports

Save as:
- `latest-queries.csv`
- `latest-pages.csv`
- `latest-query-page.csv`

### Option 2: API Access

#### Setup

1. Log in to [Bing Webmaster Tools](https://www.bing.com/webmasters)
2. Go to **Settings** → **API Access**
3. Generate or copy your API Key

#### API Endpoints

Base URL: `https://www.bing.com/webmaster/api.svc/rest/v2`

| Endpoint | Description |
|----------|-------------|
| `GetQueryTraffic` | Query-level search performance |
| `GetPageTraffic` | Page-level search performance |
| `GetQueryPageTraffic` | Query-to-page mapping |

#### Example: Get Query Traffic

```bash
curl -H "APIKey: YOUR_API_KEY" \
  "https://www.bing.com/webmaster/api.svc/rest/v2/GetQueryTraffic?siteUrl=https://jsontoolbox.cc/&startDate=2026-08-01&endDate=2026-08-31"
```

#### Example: Get Page Traffic

```bash
curl -H "APIKey: YOUR_API_KEY" \
  "https://www.bing.com/webmaster/api.svc/rest/v2/GetPageTraffic?siteUrl=https://jsontoolbox.cc/&startDate=2026-08-01&endDate=2026-08-31"
```

#### API Response Format

```json
{
  "d": [
    {
      "Query": "json formatter online",
      "Clicks": 8,
      "Impressions": 320,
      "CTR": 0.025,
      "AveragePosition": 12.3
    }
  ]
}
```

#### Convert API Response to CSV

```javascript
// Example Node.js script to convert API response to CSV
const data = response.d;
const csv = 'query,clicks,impressions,ctr,position\n'
  + data.map(r => `${r.Query},${r.Clicks},${r.Impressions},${r.CTR},${r.AveragePosition}`).join('\n');
```

## CSV Format

### Standard Format

```csv
query,clicks,impressions,ctr,position
json formatter online,8,320,0.025,12.3
json to csv converter,5,210,0.024,15.7
```

### With Page Mapping

```csv
query,page,clicks,impressions,ctr,position
json formatter online,/tools/format/json-editor,8,320,0.025,12.3
json to csv converter,/tools/convert/json-to-csv,5,210,0.024,15.7
```

## File Naming Convention

| Pattern | Description |
|---------|-------------|
| `latest-*.csv` | Current period data |
| `previous-*.csv` | Previous period for comparison |
| `*-queries.csv` | Query-level data |
| `*-pages.csv` | Page-level data |
| `*-query-page.csv` | Query-to-page mapping |

## Cross-Engine Analysis

The `json-blog-writer` skill automatically combines GSC and Bing data when both are available. This enables:

- **Cross-engine comparison**: Same query's performance on Google vs Bing
- **Combined traffic potential**: Total impressions/clicks across both engines
- **Gap identification**: Queries performing on one engine but not the other

To enable cross-engine analysis:
1. Export GSC data to `data/gsc/`
2. Export Bing data to `data/bing/`
3. Use matching date ranges for meaningful comparison
4. Run the skill — it will automatically detect and merge both sources

## Notes

- Bing has ~3-9% global search share, but can be significant for certain topics
- Bing may index and rank pages differently than Google
- Cross-engine analysis provides a more complete picture of search performance
- Data is not committed to git (add to `.gitignore` if needed)

## 当前报表（2026-11-11）与待补维度

- `bing.csv`：76 天（2026-08-25 → 11-08），仅 4 列 `日期 / 点击次数 / 印象数 / 平均 点击率`，**没有 query、page、position**。
- 后果：297 clicks / 25,861 impressions 完全无法归因到页面或查询词，也无法按 §Cross-Engine Analysis 与 GSC 做 query 级交叉分析。**这是当前最大的分析盲区。**
- 补导方式：WMT portal 的 `Search Keywords` + `Page Traffic` 两个导出，或调用 `GetQueryTraffic` / `GetPageTraffic` / `GetQueryPageTraffic` 三个端点；按上方 File Naming Convention 命名为 `latest-queries.csv`、`latest-pages.csv`、`latest-query-page.csv`。
- 期望列：`query,page,clicks,impressions,ctr,position`（中文列名也可，校验脚本会做归一匹配）。导出日期范围请与 GSC 对齐，否则不可比。
- 口径警告：同期对齐后 Bing 曝光是 GSC 的 2.7×、点击 5.8×，两侧 impression 统计口径不同（Bing 可能含 Copilot 等 AI 搜索曝光）。**禁止相加、禁止据此下「Bing 流量更大」或「AI 拿走了流量」的结论**；先补齐维度再谈。

## 校验

```
node scripts/validate-seo-reports.mjs
```

只做检查、不改写报表；`--strict` 可在缺维度时返回非 0 退出码。
