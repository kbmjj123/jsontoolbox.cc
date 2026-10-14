可以。这里不应该继续做“假设性选题规划”，而应该把博客生产改造成一个**基于本地文章库和真实 GSC 数据的内容工作流 Skill**：

> 先读取已发布文章 → 再读取 GSC 查询、页面和趋势数据 → 识别真实机会 → 判断是更新旧文还是新写文章 → 自动规划内链 → 最后生成符合项目规范的 Markdown。

目前我能看到的本地文件只有你上传的图片，没有项目中的 Markdown 文件；同时当前没有可用的 Google Search Console 外部连接器。因此下面先把这个 Skill 的设计和实现规范确定下来，接入项目后即可按真实数据运行，而不是根据猜测生成选题。

## Skill 的核心目标

建议在项目中增加一个专用 Skill，例如：

```text
skills/json-blog-writer/
├── SKILL.md
├── references/
│   ├── content-policy.md
│   ├── article-template.md
│   ├── internal-linking.md
│   └── gsc-opportunity-rules.md
└── scripts/
    ├── scan-articles.ts
    ├── analyze-gsc.ts
    ├── build-link-map.ts
    └── generate-brief.ts
```

这个 Skill 不负责盲目批量写文章，而是负责完成以下流程：

1. 扫描本地已发布 Markdown。
2. 建立文章主题、关键词、URL、工具页和内链索引。
3. 读取 GSC 报告或导出的 CSV/JSON。
4. 根据真实曝光、点击、排名和查询意图识别机会。
5. 给出“更新旧文”或“新写文章”的判断。
6. 生成文章 Brief。
7. 根据 Brief 编写文章。
8. 自动检查内链、重复主题、事实依据和文章质量。
9. 输出待审核 Markdown，而不是直接覆盖线上文章。

## `SKILL.md` 建议内容

可以在项目中创建如下文件：

```md
---
name: json-blog-writer
description: >
  Create and improve high-quality JSON developer content for JsonToolBox
  using local Markdown articles, product pages, internal-link metadata,
  and real Google Search Console performance data.
---

# JsonToolBox Blog Writer

## Objective

Produce useful, evidence-based JSON developer articles for JsonToolBox.

Never invent content priorities from generic SEO assumptions when local
article data or Google Search Console data is available.

Use this order:

1. Read published Markdown files.
2. Read product and tool-page metadata.
3. Read the latest GSC report.
4. Analyze existing performance and content gaps.
5. Decide whether to update an existing article or create a new one.
6. Build an internal-link plan.
7. Write the article.
8. Run quality and link checks.
9. Save the draft for review.

## Required inputs

Before writing, inspect:

- Existing blog Markdown files.
- Blog frontmatter and URL structure.
- Tool-page routes.
- Existing internal links.
- Latest GSC query report.
- Latest GSC page report.
- Optional date-comparison report.
- Project content and SEO rules.

If an input is missing, state that it is missing. Do not silently replace
missing performance data with assumptions.

## Article modes

Choose one mode:

- `new-article`: no suitable existing article covers the opportunity.
- `update-article`: an existing article has impressions, ranking potential,
  outdated information, weak CTR, or missing sections.
- `supporting-article`: an article is needed to strengthen an existing
  important tool page or topic cluster.
- `consolidation`: multiple articles overlap and should be merged or
  redirected instead of creating another article.

## GSC analysis

Use the following metrics:

- clicks
- impressions
- ctr
- average position
- query
- page
- date
- country
- device, when useful

The GSC Performance report provides clicks, impressions, CTR, and average
position, and can group data by queries and pages. The Search Analytics API
supports dimensions such as query, page, country, device, and date.

Do not rank opportunities by impressions alone.

For each query, determine:

- whether it already maps to an existing article;
- whether it maps to a tool page;
- whether the query is informational, navigational, transactional, or
  troubleshooting-oriented;
- whether the current page satisfies the intent;
- whether it is a new-topic opportunity or an update opportunity;
- whether it can naturally support internal links.

## Opportunity rules

Use these as decision rules, not as automatic truth:

### Update candidate

Prefer updating an existing article when:

- it already receives meaningful impressions;
- its average position indicates ranking potential;
- the query is closely related to the article;
- the article does not fully answer the query;
- the title or description does not match the observed intent;
- the article is outdated or lacks examples.

### New article candidate

Prefer a new article when:

- the query cluster is not adequately covered by existing content;
- the intent is materially different from existing articles;
- several related queries point to the same missing topic;
- the topic can link naturally to one or more JsonToolBox tools;
- creating a separate article avoids cannibalization.

### Do not create an article when:

- the query is only a minor variation of an existing article;
- the opportunity is better solved by improving an existing section;
- the query is clearly navigational;
- the proposed article would repeat an existing article;
- there is no meaningful internal destination or user problem.

## Internal linking

Every article must receive an internal-link plan before drafting.

Prefer links that are:

- contextually relevant;
- useful at the moment the reader needs them;
- descriptive rather than generic;
- connected to an existing tool or supporting article.

Do not force links merely to reach a target count.

Recommended destinations include:

- JSON Formatter
- JSON Validator
- JSON Viewer
- JSON Editor
- JSON Minifier
- JSON Converter
- related published guides

Use the actual route from the local project. Never invent a URL.

## Writing requirements

Each article should:

- answer the main question near the beginning;
- explain the problem before promoting the tool;
- include realistic examples;
- use valid JSON when showing JSON;
- distinguish JSON syntax from JavaScript syntax;
- explain common errors and edge cases;
- mention privacy or client-side processing only when relevant;
- avoid unsupported claims;
- avoid generic filler;
- include useful internal links naturally;
- include a clear title, description, slug, and article structure.

Do not write promotional copy disguised as a tutorial.

## Output

Before writing the full article, output:

- selected mode;
- source GSC date range;
- top supporting queries;
- relevant existing articles;
- content gap;
- recommended title;
- search intent;
- outline;
- internal-link plan;
- risks of cannibalization.

Then write the Markdown draft.

Do not publish, overwrite, or delete an existing article without explicit approval.
```

## GSC 数据不应直接决定选题

GSC 报告适合发现三类真实信号：

| 信号 | 可能含义 | 下一步 |
|---|---|---|
| 高曝光、低 CTR | 页面已经被看到，但标题或摘要吸引力不足 | 优先优化标题、描述和首段 |
| 高曝光、排名约 8–20 | 已有排名基础，但内容深度或意图匹配不足 | 优先更新旧文 |
| 多个相关查询指向同一页面 | 页面覆盖了主题，但可能缺少专门章节 | 扩展文章或拆出 supporting article |
| 查询有曝光但没有合适页面 | 内容缺口 | 新建文章 |
| 文章之间查询和主题高度重叠 | 关键词蚕食风险 | 合并、重新定位或加强差异 |
| 工具页有查询但缺少解释内容 | 工具页可能缺少场景支持 | 建立教程或问题解决文章 |

GSC 的核心报告提供 clicks、impressions、CTR 和 average position，并可以按 query、page、country、device、date 等维度拆分；因此 Skill 应该基于这些维度分析，而不是只看一个关键词列表。 [support.google](https://support.google.com/webmasters/answer/7576553?hl=en)

## 建议的输入文件格式

### 1. 文章扫描结果

Skill 可以从 Markdown frontmatter 读取基本信息：

```md
---
title: JSON 是什么？结构、语法与常见错误
slug: what-is-json
description: 了解 JSON 的结构、语法规则和常见错误。
publishedAt: 2026-08-12
updatedAt: 2026-08-20
status: published
locale: zh-CN
primaryKeyword: JSON 是什么
secondaryKeywords:
  - JSON 语法
  - JSON 数据结构
  - JSON 常见错误
toolLinks:
  - /json-formatter
  - /json-validator
relatedArticles:
  - /json-parse-errors
---
```

如果目前文章没有这些字段，Skill 应该先根据路径、标题、正文和现有链接生成一个索引，而不是要求你手工一次性补齐所有文章。

### 2. GSC 查询报告

建议支持 CSV 和 JSON 两种格式。

```csv
date,query,page,clicks,impressions,ctr,position,country,device
2026-08-01,how to format json,/blog/format-json,12,480,0.025,11.4,USA,DESKTOP
```

也可以使用 API 返回的结构：

```json
{
  "rows": [
    {
      "keys": ["how to format json", "/blog/format-json"],
      "clicks": 12,
      "impressions": 480,
      "ctr": 0.025,
      "position": 11.4
    }
  ]
}
```

建议至少保存两份报告：

```text
data/gsc/
├── latest-query-page.csv
├── previous-query-page.csv
├── latest-pages.csv
└── latest-queries.csv
```

其中 `latest-query-page.csv` 用来分析主题和页面匹配，`latest-pages.csv` 用来判断哪些文章值得更新，`previous-query-page.csv` 用来观察趋势变化。

## 内链索引设计

不要只在生成文章时临时搜索链接。建议建立一个内链地图：

```json
{
  "pages": [
    {
      "path": "/json-formatter",
      "type": "tool",
      "title": "JSON Formatter",
      "topics": ["format JSON", "pretty print JSON", "JSON indentation"],
      "priority": "core"
    },
    {
      "path": "/blog/json-parse-errors",
      "type": "article",
      "title": "JSON 解析失败怎么办？",
      "topics": ["JSON.parse error", "unexpected token", "JSON validation"],
      "priority": "supporting"
    }
  ]
}
```

文章正文中应出现这种自然内链：

```md
如果你只是想快速检查缩进、换行和嵌套结构，可以使用
[JSON Formatter](/json-formatter) 直接格式化内容。

如果格式化前已经出现解析错误，可以先查看
[JSON 解析失败的常见原因](/blog/json-parse-errors)，再回到工具定位具体问题。
```

应该避免：

```md
点击这里。
了解更多。
JSON 工具。
```

## 推荐的运行流程

以后每次生产文章，可以让 Skill 按下面格式执行：

### 第一步：扫描项目

读取：

```text
content/blog/**/*.md
pages/**/*.vue
app/**/*.vue
data/**/*.json
```

识别：

- 已发布文章；
- 工具页；
- 文章标题和 slug；
- 已使用关键词；
- 已存在内链；
- 文章之间的重叠主题。

### 第二步：分析 GSC

读取最近 28、90 或 180 天数据，并与上一周期比较：

```text
当前周期：2026-08-01 至 2026-08-31
对比周期：2026-07-01 至 2026-07-31
```

输出：

- 页面增长或下降；
- 曝光增长但点击下降的页面；
- 平均排名在 8–20 的查询；
- 有曝光但无相关页面的查询；
- 同一查询对应多个页面的潜在蚕食；
- 新出现的查询主题。

### 第三步：生成机会报告

例如：

```md
## Content opportunity

- Mode: update-article
- Existing page: /blog/what-is-json
- Query cluster:
  - what is json
  - json syntax
  - json object vs array
- Impressions: 1,842
- Clicks: 31
- CTR: 1.68%
- Average position: 12.7
- Reason:
  - The page has ranking potential.
  - Queries indicate users need more syntax examples.
  - The current article does not clearly explain object/array differences.
- Recommended action:
  - Add a JSON object vs array section.
  - Add valid and invalid examples.
  - Link to JSON Formatter and JSON Validator.
```

这里的数字必须来自实际 GSC 报告；如果没有报告，Skill 应该输出“缺少数据”，而不是填入示例数字。

### 第四步：决定更新还是新建

这一步非常重要。建议强制要求 Skill 给出理由：

```text
decision: update
confidence: high
evidence:
- 现有页面已获得相关查询曝光
- 查询意图与现有文章高度相关
- 当前文章缺少该问题的独立章节
- 新建文章会造成主题重叠
```

或者：

```text
decision: new
confidence: medium
evidence:
- 相关查询没有对应文章
- 多个查询集中在 JSON to CSV
- 现有 JSON Converter 工具页可以作为核心内链目标
- 与现有格式化、验证文章的意图不同
```

## 文章质量检查

生成 Markdown 后，再执行一次审核，不要直接认为文章完成。

### 内容检查

- 是否回答了标题问题？
- 首段是否给出直接答案？
- 示例是否真实有效？
- JSON 代码是否可以解析？
- 是否解释了常见错误和边界情况？
- 是否有明显的 AI 套话或重复段落？
- 是否与已有文章重复？
- 是否准确描述 JsonToolBox 的功能？

### SEO 检查

- 标题是否符合实际搜索意图？
- 描述是否具体而非堆关键词？
- H1 是否唯一？
- H2 是否覆盖真实查询？
- slug 是否稳定？
- 是否存在关键词蚕食？
- 是否有自然的工具页内链？
- 是否有相关博客内链？
- 是否存在失效链接或虚构链接？

### 产品真实性检查

Skill 不应擅自声明：

- 支持某种项目中不存在的格式；
- 处理大文件时一定更快；
- 绝对安全；
- 绝对不会上传数据；
- 比其他工具更好；
- 具备未在产品中实现的 AI、批量或导出功能。

“完全在浏览器中处理”这类描述，也应以项目实际实现为依据，并在产品代码或隐私说明中得到确认。

## 与现有三篇文章的衔接

从截图看，目前至少有这三个内容主题：

1. 前后端项目中 JSON 的最佳实践：接口设计、性能与安全。
2. JSON 解析失败怎么办：接口调试中的典型错误与排查步骤。
3. JSON 是什么：结构、语法与常见错误。

这三篇可以初步形成一个主题集群，但最终的内链关系仍应以本地 Markdown 的真实标题、路径和正文为准：

```text
JSON 是什么
├── JSON 解析失败怎么办
├── JSON Formatter
└── JSON Validator

JSON 解析失败怎么办
├── JSON 是什么
├── JSON Validator
└── 前后端 JSON 最佳实践

前后端 JSON 最佳实践
├── JSON 是什么
├── JSON Formatter
├── JSON Validator
└── JSON Converter
```

这里不建议现在直接判断下一篇一定写什么。正确做法是先检查：

- 三篇文章的实际 URL；
- 是否已经互相链接；
- 当前 GSC 查询分别落在哪些页面；
- 哪些查询只有曝光没有点击；
- 是否已有工具页承接这些意图。

## 项目实现建议

如果项目使用 Nuxt，可以把这个流程实现为一个本地 CLI：

```json
{
  "scripts": {
    "content:scan": "tsx scripts/content/scan.ts",
    "content:gsc": "tsx scripts/content/analyze-gsc.ts",
    "content:opportunities": "tsx scripts/content/opportunities.ts",
    "content:links": "tsx scripts/content/build-link-map.ts",
    "content:check": "tsx scripts/content/check.ts"
  }
}
```

推荐运行方式：

```bash
pnpm content:scan
pnpm content:gsc --input data/gsc/latest-query-page.csv
pnpm content:opportunities
pnpm content:links
pnpm content:check
```

最终输出：

```text
content/
├── blog/
├── content-index.json
├── internal-link-map.json
└── drafts/
    └── 2026-09-json-validation-errors.md

reports/
└── content-opportunities-2026-09.md
```

## 需要调整的工作方式

以后不要从类似下面的指令开始：

```text
请规划下一篇 JSON SEO 文章。
```

而应使用：

```text
运行 json-blog-writer skill：

1. 扫描本地已发布 Markdown 和工具页。
2. 读取 data/gsc/ 中最新和上一周期报告。
3. 找出有真实曝光或排名机会的查询主题。
4. 判断应该更新旧文章还是新建文章。
5. 输出机会报告，不要直接写文章。
6. 等我确认后，再生成完整 Markdown。
7. 根据本地路由自动加入自然内链。
8. 运行内容、SEO、重复主题和链接检查。
```

这样生成的文章会从“预先猜关键词”转变为“根据已有内容和真实搜索数据迭代”，更适合 JsonToolBox 当前的内容建设阶段。GSC 的页面和查询维度也能帮助区分“已有页面优化机会”和“真正的内容缺口”。 [support.google](https://support.google.com/webmasters/answer/7576553?hl=en)