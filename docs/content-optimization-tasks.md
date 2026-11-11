# 现有内容优化任务清单

> 建立日期：2026-11-11
> 范围：**只对已上线内容做优化**。不含新选题、不含内容发展方向规划（下一轮单独讨论）。
> 数据源：`data/gsc/2026-11-11.xlsx`、`data/bing/bing.csv`
> 优先级定义：P0 = 阻断/归因基础，先做；P1 = 有明确数据信号的优化；P2 =  hygiene，随手做。

---

## 0. 数据快照与口径声明

### 0.1 两份报表

| 项 | GSC `2026-11-11.xlsx` | Bing `bing.csv` |
|---|---|---|
| 周期 | Last 3 months，2026-08-21 → 11-08 | 2026-08-25 → 11-08（76 天） |
| Sheet / 列 | `Chart` `Queries`(812) `Pages`(68) `Countries` `Devices` | 仅 4 列：日期 / 点击次数 / 印象数 / 平均点击率 |
| 同期对齐（76 天） | 51 clicks / 9,427 impressions / CTR 0.54% | 297 clicks / 25,861 impressions / CTR 1.15% |
| 可用维度 | 有 query、page、position、country、device | **无 query、无 page、无 position** |
| Bing 趋势 | — | 最近 28 天 134 C / 11,665 I；前 28 天 161 C / 14,100 I（曝光 −17%、点击 −17%） |

### 0.2 口径声明（后续分析必须遵守）

1. **两个引擎的数字不可相加、不可直接比较大小**。Bing 曝光是 GSC 的 2.7×、点击 5.8×，但两侧 impression 统计口径不同（Bing 可能含 Copilot 等 AI 搜索曝光）。在补齐 Bing 的 query/page 维度前，不得据此下「Bing 流量更大」或「AI 拿走了流量」的结论。
2. **GSC 点击以 `Pages` 表为准**。`Queries` 表 812 行合计 clicks 仅 3，而 `Pages` 表合计 51，属 GSC 长尾 query 匿名化导致的口径不一致。`Queries` 表只用于 impressions / position 排序，不用于计算点击。
3. **GSC 导出缺 query × page 映射**。无法确认某个词由哪个页面承接，因此本清单不做关键词自相残杀（cannibalization）的定论，只标记为待查。
4. 所有文案改动仍受 `.claude/rules/copy-accuracy.md` 约束：承诺的能力必须能指到 `file:line`。

---

## 1. 决定优先级的六个发现

### F1（阻断）给 AI 看的博客链接全是死链

`server/utils/blog.ts:36` 写的是 `file.replace('.md$', '')` —— **字符串不是正则**，`.md` 后缀不会被移除，于是 `getBlogs()` 返回 `/blog/what-is-json.md`。已用 Node 验证：`'what-is-json.md'.replace('.md$','')` 结果仍是 `what-is-json.md`。

后果：

- `server/routes/llms.txt.ts:109-118` 的 `JSON Guides & Tutorials` 全部链接指向 `https://jsontoolbox.cc/blog/*.md`；
- `server/routes/llms-full.txt.ts:60` 的 `**URL:**` 同样错误；
- `server/routes/llms.txt.ts:80-87` 的 `priority` 之所以写成 `.md` 路径，是因为 `validPaths` 由 `getBlogs()` 构建（`:39-42`），注释把这个 bug 当成既定行为。

对照证据：`server/api/sitemap-blog.ts:29` 用的是正确的正则 `/\.md$/`，**sitemap 是对的，只有 llms 两条路由错**。也就是说线上 AI 引用链路目前是坏的，而上一轮讨论的「优先引用清单重排」必须等这个先修。

### F2（归因缺口）双引擎都无法回答「哪篇内容带来了流量」

GSC 有 query 与 page 两张独立表但无映射；Bing 连 query/page 都没有。Bing 侧 297 次点击、25,861 次曝光完全无法归因到页面或词。**这是当前最大的分析盲区，优先级高于任何文案调整**。

### F3 流量集中在工具页，博客只有 3 篇拿到点击

GSC `Pages` 表中博客相关 URL 共 11 个有曝光记录，其中**英文文章详情页只有 3 篇拿到点击**（另有 `/zh/blog/json-comments` 1 次点击、`/blog` 列表页 1 次点击）：

| 页面 | Clicks | Impressions | CTR | Position |
|---|---|---|---|---|
| `/blog/how-to-create-json-file` | 9 | 834 | 1.08% | 16.68 |
| `/blog/unexpected-end-of-json-input` | 7 | 1,219 | 0.57% | 13.17 |
| `/blog/json-parse-error-debug` | 1 | 273 | 0.37% | 28.30 |
| `/blog/what-is-json` | 0 | 192 | 0 | 46.10 |
| `/blog/json-comments` | 0 | 142 | 0 | 72.80 |
| `/blog/json-vs-yaml` | 0 | 63 | 0 | 48.35 |
| `/blog/json-validation-syntax-vs-schema` | 0 | 49 | 0 | 26.61 |

**有点击的 3 篇恰好都是「用户手上有一份具体文件/一段具体报错」的实操与排错内容**；零点击的 4 篇是定义/对比/概念类。这是本轮最值得记住的信号，后续方向规划会用到，但本轮先按数据修页面。

### F4 首页位置仍零点击，是标题/描述问题不是排名问题

`Queries` 表中零点击且曝光 ≥50 的词有 20 个，其中：

| Query | Impressions | Clicks | Position |
|---|---|---|---|
| `json editor online` | 528 | 0 | 12.94 |
| `json online editor` | 343 | 0 | 6.57 |
| `online json editor` | 337 | 0 | 9.71 |
| `json unescape` | 142 | 0 | 6.80 |
| `unescape json` | 153 | 0 | 12.45 |
| `json editor` | 348 | 1 | 81.42 |

P6.57 / P9.71 已接近首屏却 0 点击；同时 `/tools/format/json-editor` 以 2,304 impressions（全站最高）只换到 3 clicks（CTR 0.13%，P30.05）。**排名不是唯一瓶颈，SERP 上的 title/description 与查询意图不匹配更可疑**。机会区间（P11–20、I≥20）仅 6 个词、合计约 864 曝光，全部是工具型词，没有一个信息型/科普型词。

其他高曝光零点击页面：`/tools/format/json-escape` 950 I / 0 C / P22.29、`/tools/convert/json-to-csv` 512 I / 0 C / P59.97、`/tools/convert/json-compare` 508 I / 1 C / P32.66、`/tools/convert/json-to-yaml` 372 I / 0 C / P48.68、`/tools/format/json-schema-validator` 288 I / 0 C / P31.98。

### F5 15 篇英文稿里 7 篇零曝光（其中 1 篇是草稿）

`Pages` 表中完全没有曝光记录的英文文章：

`free-realistic-json-test-data`、`how-to-create-manifest-json`、`json-best-practices`、`json-vs-jsonl`、`json-vs-toon`、`read-json-file-python`、`json-editor-component`（`draft: true`，属预期）。

除草稿外 6 篇需逐篇判断：是新发布尚未起量（`json-vs-toon` lastmod 2026-09-29），还是索引/内链/意图问题。**不要一律删或一律重写**。

### F6 中文内容几乎无曝光

`/zh/blog/*` 仅 2 页有记录：`how-to-open-json-file` 14 I / 0 C / P7.79、`json-comments` 2 I / 1 C / P5.5。中文稿 7 篇 vs 英文 15 篇。`llms.txt.ts:66-76` 已单独向 AI 声明中文版，但 GSC 侧中文页基本没有被展示。

---

## 2. 任务清单

### P0 — 先做（阻断与归因）

| # | 任务 | 依据 | 验收标准 |
|---|---|---|---|
| **T1** | 修 `server/utils/blog.ts:36` 的 `.md` 后缀 bug（改为 `/\.md$/`），并**同步**把 `server/routes/llms.txt.ts:80-87` `priority` 里 5 条博客路径的 `.md` 去掉 | F1；对照 `server/api/sitemap-blog.ts:29` | ① `llms.txt` / `llms-full.txt` 中所有博客 URL 为 `/blog/{slug}`，与 sitemap 完全一致、无 `.md`；② `Priority content for citation` 6 项全部出现在输出中（修 bug 后 `validPaths` 会变化，不改 priority 会被静默过滤掉 5 项）；③ 每条 URL 实际可访问 |
| **T2** | 补齐双引擎归因数据：Bing 导出 `Search Keywords` + `Page Traffic` + query-page 映射，按 `data/bing/README.md:96-104` 的文件命名规范；GSC 补导 query × page 组合报表 | F2、口径声明 3；`data/bing/bing.csv` 仅 4 列日期级 | ① `data/bing/` 出现含 `query,page,clicks,impressions,ctr,position` 的导出；② 能对同一个 query 同时看到 Google 与 Bing 表现；③ 能回答 `json editor online` 由哪个 URL 承接 |
| **T3** | 高曝光低点击页面的 title/description 对齐真实查询，先做 3 个页面：`/tools/format/json-editor`（`json editor online` / `online json editor`）、`/tools/format/json-escape`（`unescape json` / `json unescape`）、`/blog/unexpected-end-of-json-input`（`unexpected end of json input`） | F4；现状描述见 `app/assets/data/format/json-editor.json` `en.description`、`app/assets/data/format/json-escape.json` `en.description` | ① 标题/描述自然包含真实查询的语序，不堆词；② 与页面实现一致（copy-accuracy）；③ 记录改动前基线，下一周期报表看 CTR 变化 |

> T1 与 T3 会触及工具 JSON / 博客 frontmatter，改完按 `.claude/rules/copy-accuracy.md` §3 做一次 copy ↔ implementation 审计。

### P1 — 有明确数据信号的优化

| # | 任务 | 依据 | 验收标准 |
|---|---|---|---|
| **T4** | 逐篇处置 F5 的 6 篇零曝光文章：先查索引状态与内链，再决定「改标题/并入已有页/补内链/暂缓观察」，**不做无差别重写** | F5；`how-to-create-json-file` 834 I / 9 C 是同站点对照组 | 每篇给出一句结论 + 对应动作，记录在本文档 §4 |
| **T5** | 统一 frontmatter `locales`：修 `content/en/blog/free-realistic-json-test-data.md:10` 的 `["en", 'zh']`（单双引号混用且值应为 `zh-CN`）、`content/zh/blog/free-realistic-json-test-data.md:10` 的 `["zh"]`；统一行内/多行两种写法 | `docs/content-backlog.md:19` 命名坑；`content.config.ts` schema | 22 篇稿的 `locales` 全部只使用 `en` / `zh-CN`，格式一致；`draft` 与 `lastmod` 一并核对 |
| **T6** | 排查中文内容曝光：确认 `/zh/blog/*` 的 sitemap、hreflang、索引状态；给已有中文排名的 `how-to-open-json-file` 补站内入口 | F6；`server/api/sitemap-blog.ts:45-51` 已生成 `/zh/blog/...` | `/zh` 博客 URL 在 sitemap 中齐全且可索引；下期报表能看到中文页曝光变化 |
| **T7** | 重排 `llms.txt.ts:80-87` 的 `Priority content for citation`：从定义/对比类换成排错类与工具页（候选 `json-parse-error-debug`、`unexpected-end-of-json-input`、`/tools/view/large-json-viewer`） | F3：有点击的 3 篇都是实操/排错；F1 修完后此项才生效 | 引用清单里概念文占比下降，且每条路径在 `validPaths` 中；**与下一轮内容方向规划衔接，本轮只换清单不改条款** |

> T7 只调整现有配置，不新增条款、不改 `Usage` 里的署名与禁止训练声明（`llms.txt.ts:59-64` 保持）。

### P2 — hygiene

| # | 任务 | 依据 | 验收标准 |
|---|---|---|---|
| **T8** | 顺手修 `server/utils/tools.ts:39` 同样的 `file.replace('.json$', '')` 字符串写法 | 与 T1 同源；当前 31 个工具配置**都有** `slug` 字段，故无实际影响，属防回归 | 改为正则；`llms.txt` 工具路径不变 |
| **T9** | 处置草稿 `content/en/blog/json-editor-component.md`（`draft: true`）：补全发布或归档 | F5；`isDraft()` 已正确把它排除出 sitemap / llms | 仓库里不留长期悬空的草稿，或明确标注计划 |
| **T10** | 建立月度报表归档与口径校验：按 `data/{gsc,bing}/README.md` 的命名规范导出，日期范围对齐，落库前校验列数与合计 | 本次两份报表格式不一致（xlsx 多 sheet vs 4 列 csv）、周期差 4 天 | 每次新增报表附一段口径说明；能自动算出同期可比值 |

---

## 3. 已核验通过（不要重复排查）

- 7 个 `promo.slug`（`json-editor`、`json-repair`、`json-schema-validator`、`json-to-toon`、`json-to-yaml`、`jsonc-to-json`、`jsonl-to-json`）**全部对应真实工具**，无死链。
- 博客正文引用的 20 条 `/tools/...` 内链**全部命中**实际路由（`app/assets/data/{category}/{slug}.json` 共 31 个工具），无死链。
- 31 个工具配置都带 `slug` 字段。
- `draft: true` 已被 `isDraft()` 正确排除出 sitemap、`llms.txt`、`llms-full.txt`。
- `locales:` 后跟换行缩进的多行 YAML 数组是**合法写法**（如 `content/en/blog/how-to-open-json-file.md:20-22`），不是空值，T5 只需统一风格而非修 bug。

---

## 4. 执行记录（2026-11-11，10 项全部处理）

| # | 状态 | 实际动作 / 结论 |
|---|---|---|
| T1 | 完成 | `server/utils/blog.ts:36` 改为 `/\.md$/`；`llms.txt.ts` 的 5 条 `.md` 路径去掉后缀、注释改正。静态复现 `validPaths` 验证：6 条 priority 全部命中、无 `.md` 残留、草稿正确排除。 |
| T2 | 部分（外部阻塞） | 已交付 `scripts/validate-seo-reports.mjs`（无依赖，语法检查通过并实跑）+ 两个 README 的补导规格与口径警告。**原始报表必须由用户从 GSC / Bing 后台导出，本轮无法代劳**。脚本当前输出「GSC 维度齐全但缺 query×page 映射 / Bing 完全缺维度」，数据到位后重跑即闭环。 |
| T3 | 完成 | 改 `json-editor.json` / `json-escape.json` 的 `en.meta.title` + `description`，改 `unexpected-end-of-json-input.md` 的 `description`。改后关键词覆盖仍 14/14、14/14、8/8、8/8（en/zh），JSON 语法有效，能力断言集合未变、未新增承诺。**只改英文侧**：中文侧无查询数据，按独立手写原则本轮不动。CTR 基线：`json-editor` 3C/2304I/0.13%、`json-escape` 0C/950I、`unexpected-end...` 7C/1219I/0.57%，下期报表复核。 |
| T4 | 完成 | 6 篇逐篇判断，只对 2 个明确孤岛动刀：`json-best-practices.md`（最早发布、2000 词、**零工具内链**）补 1 条工具链；`free-realistic-json-test-data.md`（**零文章互链**）补 1 条博客链。其余 4 篇（`how-to-create-manifest-json`、`json-vs-jsonl`、`json-vs-toon`、`read-json-file-python`）保留观察：均为 2026-09-29 后发布、已有工具与文章内链，零曝光更可能是索引或时效问题，无 query×page 数据支撑，不做无差别重写。 |
| T5 | 完成 | 实际修了 **4 处**错误值（比清单估计的 2 处多）：en/zh 的 `free-realistic-json-test-data` 与 en/zh 的 `json-validation-syntax-vs-schema`。复查 22 篇全部只使用 `en` / `zh-CN`，`draft` 与 `lastmod` 完整。**验收标准修正**：不改「行内 vs 多行」格式——同一 frontmatter 里 `tags` / `promo` 本来就是多行 YAML，只统一 `locales` 反而制造不一致，且两种写法都合法。 |
| T6 | 完成 | 配置排查通过：`sitemap-blog.ts` 生成 7 个 `/zh/blog/*` URL 且已接入 `nuxt.config.ts:103`；`noindex` 仅出现在博客页 404 分支（`[...slug].vue:204`），中文页不受影响；i18n `prefix_except_default` 与 `/zh` 一致。**验收标准修正**：`how-to-open-json-file` 早已是 `json-editor` 的首位 `relatedPosts`，并在 `large-json-viewer` 也出现，入口已存在，不重复添加。 |
| T7 | 完成 | priority 换成 3 篇有点击的排错/实操文章 + 3 个工具页，概念/对比文 0 项；6 条路径静态复现 `validPaths` 全部命中。`Usage` 署名与禁止训练条款未动。 |
| T8 | 完成 | `server/utils/tools.ts` 两处（`:39`、`:90`）`file.replace('.json$','')` 改为 `/\.json$/`。当前 31 个配置都有 slug，属防回归。 |
| T9 | 完成（判定） | **保持草稿，不发布**：草稿 title/description 承诺「Vue 3 component / custom element / CDN script tag」，全仓 `app/` 无 `customElements` / `defineCustomElement` 实现，按 `copy-accuracy.md` 属阻断级未实现承诺。发布前须删改断言或补齐实现，另需中文版与截图；重写或归档留到方向规划时决定。 |
| T10 | 完成 | 月度归档规范两份 README 原本已有（"Export data regularly"、"Keep previous period data"）；本轮补齐的是校验机制（T2 脚本）+ 命名规范 + 口径警告。 |

### 4.1 执行中新增的发现（未纳入本轮改动，留给下一轮决策）

- **中文文章的 14 条工具内链全部不带 `/zh` 前缀**（形如 `[JSON 编辑器](/tools/format/json-editor)`）。中文站读者点内链会跳到英文工具页。`/zh/tools/...` 路由确实存在，但是否批量本地化需先确认 Nuxt 是否自动补前缀、以及中文工具页内容质量（GSC 里 `/zh/tools/convert/json-to-csv` 排名 104.5），本轮不擅自批量替换。
- **GSC `Queries` 表点击合计 3 vs `Pages` 表 51**：长尾 query 匿名化导致，已写入 §0.2 口径声明；补导 query×page 后需复核。

### 4.2 本轮未达成的验收项

- T2 的「`data/bing/` 出现含 query/page 的导出」「能对同一 query 同时看到两引擎表现」：需用户补导报表，脚本与规格已就绪。
- T3 的「下期报表看 CTR 变化」、T6 的「下期报表看中文页曝光变化」：属跨周期验证，本轮只能记录基线。

---

## 5. 本清单明确不做（留给下一轮）

- 不新写任何文章、不定选题、不做内容发展方向规划。
- 不改工具功能、不改交互组件、不改 `article` 长文结构。
- 不封 AI 爬虫、不加登录/付费墙；`nuxt.config.ts` 的 robots 保持 `userAgent: '*' allow`。
- 不据 Bing/GSC 口径差异推断 AI 搜索影响，也不把两侧数字相加——**先完成 T2 再谈**。
- 不在 T1 完成前动 `Priority content for citation`。

---

## 6. 完成后的复查方式

1. `read_lints` 检查改过的 `.ts` / `.md` 无新增诊断。
2. `node --check` 不适用 `.ts`；改用重跑 `llms.txt` / `llms-full.txt` 生成逻辑，逐条比对 URL 与 sitemap。
3. 静态校验：`content/*/blog/*.md` 的 frontmatter 字段与 `content.config.ts` schema 一致，所有 `promo.slug` 与正文 `/tools/` 链接仍能在 31 个工具配置中命中。
4. 下一周期报表出来后，对照 T3 记录的 CTR 基线复核效果。
