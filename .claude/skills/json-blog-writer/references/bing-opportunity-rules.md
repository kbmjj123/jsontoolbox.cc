# Bing Webmaster Tools Opportunity Rules

## Data Source

Bing Webmaster Tools (Bing WMT) provides search performance data for Bing.

### How to Get Data

#### Option 1: Web Portal Export

1. Go to [Bing Webmaster Tools](https://www.bing.com/webmasters)
2. Select site: `jsontoolbox.cc`
3. Go to **Reports** → **Search Traffic** → **Page Traffic** or **Search Keywords**
4. Set date range and export CSV

#### Option 2: API Access

**Authentication**: API Key from Bing WMT → Settings → API Access

**Base URL**: `https://www.bing.com/webmaster/api.svc/rest/v2`

**Key Endpoints**:

| Endpoint | Purpose | Parameters |
|----------|---------|------------|
| `GetQueryTraffic` | Query-level performance | `siteUrl`, `startDate`, `endDate` |
| `GetPageTraffic` | Page-level performance | `siteUrl`, `startDate`, `endDate` |
| `GetQueryPageTraffic` | Query-to-page mapping | `siteUrl`, `startDate`, `endDate` |

**Example API Call**:

```bash
curl -H "APIKey: YOUR_API_KEY" \
  "https://www.bing.com/webmaster/api.svc/rest/v2/GetQueryTraffic?siteUrl=https://jsontoolbox.cc/&startDate=2026-08-01&endDate=2026-08-31"
```

**API Response Format**:

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

### Export Files

Save to `data/bing/`:

| File | Content | Use |
|------|---------|-----|
| `latest-queries.csv` | Queries with metrics | Query-level analysis |
| `latest-pages.csv` | Pages with metrics | Page-level analysis |
| `latest-query-page.csv` | Queries mapped to pages | Topic-to-page matching |
| `previous-query-page.csv` | Same, previous period | Trend comparison |

### CSV Format

```csv
query,page,clicks,impressions,ctr,position
json formatter online,/tools/format/json-editor,8,320,0.025,12.3
```

## Metrics Reference

Bing WMT uses the same core metrics as GSC:

| Metric | Bing Field | Description |
|--------|------------|-------------|
| Clicks | `Clicks` | User clicks from Bing SERP |
| Impressions | `Impressions` | Times shown in Bing SERP |
| CTR | `CTR` | clicks / impressions |
| Position | `AveragePosition` | Average ranking in Bing |

## Bing-Specific Considerations

### Differences from Google

1. **Index behavior**: Bing may index pages differently or at different speeds
2. **Ranking factors**: Bing tends to favor exact-match keywords more than Google
3. **User demographics**: Bing users may have different search patterns (more enterprise, older demographic in some markets)
4. **Market share**: Bing has ~3-9% global search share, but higher in certain niches and regions
5. **AI integration**: Bing's AI-powered search (Copilot) may surface different results

### Why Bing Data Matters

- **Untapped traffic**: Queries ranking well on Bing but not GSC may indicate opportunities Google hasn't picked up yet
- **Validation**: If a topic performs well on both engines, it's a strong signal
- **Different competition**: You may face less competition on Bing for certain queries
- **Diversification**: Relying only on GSC misses a real traffic source

## Cross-Engine Analysis

When both GSC and Bing data are available, perform cross-engine comparison:

### Step 1: Merge Data

Combine GSC and Bing data by `query` + `page`:

```
query: "json to csv converter"
page: /tools/convert/json-to-csv
GSC:   impressions=1200, clicks=45, position=8.2
Bing:  impressions=380, clicks=12, position=6.1
```

### Step 2: Identify Patterns

| Pattern | Meaning | Action |
|---------|---------|--------|
| Strong on both engines | Topic has universal demand | Protect and invest |
| Strong GSC, weak Bing | Google-specific advantage | Optimize Bing metadata |
| Strong Bing, weak GSC | Bing-specific opportunity | Investigate Google optimization |
| Weak on both | Low demand or poor content | Re-evaluate investment |
| New on Bing, not in GSC | Emerging topic on Bing | Early mover opportunity |

### Step 3: Combined Traffic Potential

Calculate combined potential:
```
Combined impressions = GSC impressions + Bing impressions
Combined clicks = GSC clicks + Bing clicks
```

This gives a more complete picture than either source alone.

## Decision Rules (Same as GSC, with Bing Additions)

### Update Candidate (Bing-specific additions)

Also consider updating when:
- Bing shows the page with high impressions but low CTR (Bing-specific title optimization)
- Bing position is significantly worse than GSC (different ranking factors at play)

### New Article Candidate (Bing-specific additions)

Also consider new article when:
- A query cluster shows Bing impressions but no GSC presence (Bing-first opportunity)
- Bing users search with different phrasing than Google users for the same topic

### Bing-Specific CTR Benchmarks

Bing CTR tends to be slightly different from Google due to different SERP layouts:

| Position | Expected Google CTR | Expected Bing CTR |
|----------|--------------------|--------------------|
| 1 | 25-35% | 20-30% |
| 2-3 | 10-20% | 8-15% |
| 4-10 | 3-10% | 2-8% |
| 11-20 | 1-3% | 0.5-2% |

Use these as rough benchmarks when evaluating CTR performance.

## Bing Optimization Tips

When optimizing for Bing specifically:

1. **Exact-match keywords**: Bing places more weight on exact keyword matches in titles
2. **Social signals**: Bing considers social media engagement more than Google
3. **Page load speed**: Important for both, but Bing explicitly factors this in
4. **Meta keywords**: Bing still considers the meta keywords tag (Google doesn't)
5. **Structured data**: Bing uses Schema.org markup similarly to Google

## Rate Limits

The Bing WMT API has rate limits:
- Standard usage: ~1000 requests per day
- Batch queries where possible
- Cache results locally in `data/bing/`
