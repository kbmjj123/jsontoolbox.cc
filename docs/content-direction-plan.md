# 内容发展方向规划（2026-11 起）

> 建立日期：2026-11-11
> 性质：**方向判断 + 取舍 + 依赖**，不是任务清单、也不是写稿计划。
> 上游：`docs/content-optimization-tasks.md`（修现有内容，已执行完毕）。
> 数据源：`data/gsc/2026-11-11.xlsx`、`data/bing/bing.csv`；工程现状见本次代码调研。

---

## 0. 依据与口径

### 0.1 数据快照

| 项 | 数值 |
|---|---|
| GSC 同期 76 天 | 51 clicks / 9,427 impressions / CTR 0.54% |
| Bing 同期 76 天 | 297 clicks / 25,861 impressions / CTR 1.15% |
| GSC `Pages` 表 | 68 个 URL，博客相关 11 个有曝光，**英文文章详情页仅 3 篇有点击** |
| GSC `Queries` 表 | 812 词 / 6,021 impressions |
| 中文侧 | `/zh/blog/*` 仅 2 页有记录（14 I、2 I），7 篇中文稿 |

口径约束（继承 `content-optimization-tasks.md` §0.2）：两引擎 impressions 口径不同，**不相加、不直接比大小**；GSC 点击以 `Pages` 表为准；**缺 query×page 映射，不做词→页归因结论**；Bing 报表无 query/page/position，**以下意图分布仅代表 GSC，不代表 Bing/Copilot 侧**。

### 0.2 真实查询的意图结构（GSC `Queries`，812 词）

| 类别 | 词数 | Impressions | 曝光占比 |
|---|---|---|---|
| 工具/交易型（`json editor online`、`json to csv`…） | 676 | 5,548 | **92.1%** |
| 信息型（`what is` / `how to` / `vs` / `guide`…） | 84 | 266 | 4.4% |
| 排错型（`error` / `unexpected` / `fix` / `syntax`…） | 58 | 226 | 3.8% |
| 品牌/导航 | 0 | 0 | 0% |

> 信息型与排错型有 6 词重叠（如 `unexpected end of json input meaning`），看量级不看精确值。

两个高度集中的窄集群：

- 排错 Top15 里 9 个是**同一个报错 `unexpected end of json input` 的原文变体**（含 `SyntaxError: JSON.parse: unexpected end of data at line 1 column 1…`、`failed to execute 'json' on 'response'…` 等），合计 120 I。对应文章 `/blog/unexpected-end-of-json-input` 是全站博客曝光最高的页（1,219 I / 7 C）。
- 信息型 Top15 里 `how to create json file` 及 Windows/Mac/变体合计约 67 I。对应 `/blog/how-to-create-json-file` 是博客点击最高的页（834 I / 9 C）。
- 对比/定义类几乎无需求：`what is json structure` 14 I、`yaml vs json` 9 I、`json vs yaml` 6 I、`json difference online` 6 I。

### 0.3 对上一轮判断的修正

第一轮凭直觉提出「把排错类做成内容主线」。**数据不支持**：排错型只占 3.8% 曝光，且高度集中在一个报错上，不存在「宽泛排错需求集群」。修正为：**排错是「已验证的窄机会」，做深一个点，不扩成大类**。

同样，第一轮建议「概念文降级、实操文加码」方向是对的，但力度不够——按数据，问题不是文章选题比例，而是**博客整体不该被当作流量主战场**。

---

## 1. 核心判断

### 1.1 搜索需求是「找个工具把我这份数据跑一下」，不是「读一篇解释」

92% 的曝光来自工具型词。用户要的不是答案，是**输入 → 结果**这一步。而 GSC `Pages` 显示这一步目前承接得很差：

| 页面 | Impressions | Clicks | CTR | Position |
|---|---|---|---|---|
| `/tools/format/json-editor` | 2,304 | 3 | 0.13% | 30.05 |
| `/tools/format/json-escape` | 950 | 0 | 0 | 22.29 |
| `/tools/convert/json-to-csv` | 512 | 0 | 0 | 59.97 |
| `/tools/convert/json-compare` | 508 | 1 | 0.20% | 32.66 |
| `/tools/convert/json-to-yaml` | 372 | 0 | 0 | 48.68 |
| `/tools/format/json-schema-validator` | 288 | 0 | 0 | 31.98 |

**主战场是工具页，不是博客页。**

### 1.2 博客的角色重新定义

| | 过去（隐含） | 今后 |
|---|---|---|
| 定位 | 长尾流量入口 | 工具页的**语境层** + AI 引用资产 + 内链权重来源 |
| 成功指标 | 文章页 impressions / 排名 | 文章→工具跳转、工具实际使用、引用带回的品牌与链接 |
| 投入原则 | 按关键词覆盖铺量 | 只做能指向「动手」的内容，其余不投 |

这不影响已有 15 篇英文稿：它们继续承担内链与引用价值，**不再按曝光指标追加投入**。

### 1.3 「AI 拿数据就走人」这件事怎么解

AI 能完整复述的，是那 4.4% 信息型 + 3.8% 排错型的**文字答案**。它拿不走的：

- 用户手上那份具体的 JSON（尤其是不能上传的敏感数据）；
- 浏览器里的错误行列定位、修复结果、大文件渲染；
- 实测出来的性能数字、可下载的坏样本、真实报错原文语料。

**结论：不防 AI、不藏内容。** 把「必须动手、且只有本站能给出结果」这一步做厚，让文字只值一半。`llms.txt` 主动开放 + 署名条款保持；上一轮已把优先引用清单换成排错/实操页与工具页，方向正确。

---

## 2. 四条内容线（按优先级）

### 资源分配原则：三类「内容」的取舍

| 类型 | 具体指什么 | 投入 |
|---|---|---|
| A 描述性文案 | `features` / `faq` / `article` 扩写、新科普稿 | **零投入** |
| B 可验证事实 | 真实输入输出、报错原文、体积与格式边界、失败情形 | **只做「准」，不做「多」** |
| C 独占资产与可复现状态 | 预填深链、坏语料库、实测基准、可下载数据集、分发能力 | **主投** |

理由：六个工具页近 5,000 曝光却几乎零点击（`json-editor` 2,304 I / 3 C / CTR 0.13%），**人还没点进来**；往页面里加长文是给已进来的读者看的，救不了这个漏斗。A 类只是多送一份可被 AI 摘要的语料，且容易踩 copy-accuracy。

### L0 前置工程：让文章能链到「已装好样本的工具状态」

这是所有后续内容的**技术前提**，不是内容任务。现状（本次代码调研结论）：

- `app/pages/tools/[category]/[slug].vue:24` 只透传 `:tool`，不读 `route.query`；全库工具页零 `route.query` 输入预填。
- `app/composables/useToolExample.ts:59` 已有 `loadById(id, target)`，但**全库零调用点**；`JsonInputEditor.vue:368` 只支持手动选示例。
- 各工具组件 `onMounted` 硬编码 `loadDefaultExample()`（`JsonRepair.vue:208`、`JsonEditor.vue:721` 等 20+ 处），会覆盖任何预填值，需要统一守卫。
- **已预留的设计意图**：`app/utils/share/payload.ts:37` 的 `meta.source` 已含 `'blog-example'`，`kind` 已含 `'invalid-json'`（`:16,86`）——说明「博客带坏样本进工具」本来就在协议里，只差接收端。
- 现成可用的例外：`JsonCompare.vue:193-201` 的 `?left=`/`?right=` base64 预填；`public/json-parse-error-demo.html` 的 `?sample=`，但后者样本写死在 HTML、不是工具页。

推荐最小方案：落地页把 `route.query.example` 传下去 → `JsonInputEditor` 在 `onMounted` 用已存在的 `loadById()` 预填 → 在 `JsonInputEditor` 内统一处理「预填优先于默认示例」，避免逐个改 20+ 组件。**不建议**用 `#share=` 手造链接（方案 B）：`JsonEditor.vue:413` 会锁只读、`:511` 的自动修复会改写坏样本。

> 这一步完成前，任何「点进去就看到结果」的内容承诺都不能写进文案（copy-accuracy 铁律）。

### L1 工具页的可复现状态与边界事实（B 类，轻量）

**不扩写描述性文案。** 只做两件小事：

1. 把每页已有的输入/输出/边界事实核准——真实示例、失败情形、体积与格式限制，逐条能指到 `file:line`（copy-accuracy）；
2. 让这些事实能被外部「带状态复现」，依赖 L0 的预填接收端。

优先次序仍按 GSC 曝光 × 零点击：`json-editor` → `json-escape` → `json-to-csv` → `json-compare` → `json-to-yaml` → `json-schema-validator`。上一轮 T3 已调整 title/description，**正文不追加篇幅**。

关键词策略沿用既有铁律：按该页报表「点击 → 曝光」精选、自然融入 FAQ 问句与正文，覆盖率 100%，禁止 `<strong>` 词表堆砌；每个语种用自己的 GSC 词独立手写，不从 en 机翻。

### L2 两个已验证的窄集群（做深，不铺开）

1. **`unexpected end of json input` 报错原文集群**：把 Top15 里那些完整报错串（含 `SyntaxError: JSON.parse: unexpected end of data at line 1 column 1…`、`failed to execute 'json' on 'response'…`）写成真实的 H2/FAQ 问句，每条链到 L0 预填好对应坏样本的工具状态。目标是覆盖「用户直接粘贴报错原文搜索」的长尾，而不是写泛泛的排错指南。
2. **`how to create json file` 平台/变体集群**：Windows/Mac/VS Code/浏览器等变体，补齐现有文章的 H2，每条给可动手的落点。

这两处是**唯一有数据证明有需求的博客方向**。其余新稿一律暂停。

### L3 独占资产（AI 编不出来，被引用必须带出处）

按「先低成本高信号」排序：

1. **系统化坏 JSON 语料库**：现状只有 `scripts/samples/` 4 个小文件（仅 Playwright 引用）与 `app/assets/data/examples/json-repair.json` 的 3 个示例。扩成有编号、错误分类、可下载、每条对应一个预填深链的语料集。
2. **真实性能基准**：用自家工具实测 1/5/10/20MB JSON 的格式化、树展开、校验耗时，产出带机器配置、文件大小、方法说明的表格。全库目前 `*benchmark*` 零命中。
3. **测试数据集站内化**：`free-realistic-json-test-data` 的 1/5/10/20MB 文件目前外链到 `resources.jsontoolbox.cc`，仓库内无实体；收回站内并给每个文件配「用 Large JSON Viewer 打开」的深链。
4. **双引擎实测数据**：等 T2 补导 query/page 后，产出「同一批词在 Google 与 Bing 的表现对照」。⚠️ 必须先解决口径可比性，否则不出结论。

### L4 中文侧：先修闭环，暂缓扩张

`/zh` 几乎零曝光，7 篇中文稿。本阶段：

- 决策并处理**中文文章 14 条工具内链缺 `/zh` 前缀**的问题（见 `content-optimization-tasks.md` §4.1）；
- 补 GSC 中文页的索引覆盖率数据，确认是「没被收录」还是「收录了没展示」；
- **不新写中文稿**。按独立手写原则成本很高，应先验证中文侧是否真有需求（GSC `Countries` 里 China 仅 41 I / 4 C）。

---

## 3. 停止投入清单（明确取舍）

- **不再新写** `what is` / `A vs B` / `best practices` 类科普稿：信息型总曝光 4.4%，对比词个位数曝光，且这类恰是 AI 能直接答完的部分。
- **不把排错扩成大类**：只做 L2 的两个窄集群。
- **不封 AI 爬虫、不加登录/付费墙**：与 no signup / client-side / 开源承诺冲突，且会损失引用带来的品牌曝光；`nuxt.config.ts` robots 保持 `userAgent: '*' allow`。
- **不据 Bing/GSC 绝对值差异推断「AI 偷走了流量」**：口径未对齐、Bing 无 query 维度，T2 完成前不出结论。
- **不做 query→页归因或关键词自相残杀定论**：缺 query×page 映射。
- **不在 T2 数据到位前用 GSC/Bing 实测数字写面向用户的内容**。

---

## 4. 前置依赖（决定顺序）

| 依赖 | 阻塞什么 | 提供方 |
|---|---|---|
| 补导 GSC query×page + Bing query/page 报表（T2） | L1 选词精度、L3-4、任何跨引擎结论 | 用户从后台导出 |
| L0 `?example=` 预填接收端 | L2 全部内容、L3-1 语料库 | 工程侧 |
| GSC 中文页索引覆盖率报告 | L4 判断「没收录」还是「没展示」 | 用户从后台导出 |
| 中文内链 `/zh` 前缀决策 | L4 闭环 | 用户决策 |
| 下一周期性能报表 | L1 / T3 的 CTR 效果验证 | 时间 |

**顺序原则：先解除依赖，再动内容。** 在 T2 与 L0 完成前，只做不需要归因、不需要预填能力的 L3-2（基准测试）与 L3-3（数据集站内化）。

---

## 5. 度量口径

| 层级 | 指标 | 说明 |
|---|---|---|
| 主 | 工具页 CTR、文章→工具页跳转、工具实际使用 | 对应「必须动手」是否发生 |
| 次 | 工具页平均排名、品牌词与带链接引用 | 引用价值，不作流量承诺 |
| 参考 | 文章页 impressions | 仅观察，不作 KPI |
| 禁用 | 两引擎 impressions 相加、跨日期范围比较、Queries 表点击数 | 见 §0.1 |

每个周期固定：日期范围对齐 → 跑 `node scripts/validate-seo-reports.mjs` → 记录口径说明 → 才做同比。

---

## 6. 阶段路线

| 阶段 | 内容 | 出口条件 |
|---|---|---|
| **一：解除依赖** | 补导报表（T2）、L0 预填工程、度量口径对齐、中文索引与内链决策 | 校验脚本报「归因就绪」；外部页面能链到预填状态；进入路径可追踪 |
| **二：主投 C 类** | L3-1 坏语料库、L3-2 基准、L3-3 数据集站内化；配合 §9 的深链统一、embed 通用化、来源标记 | 每条资产都有可复现的站内链接与可观测的进入路径 |
| **三：轻量配套** | L1 边界事实核准、L2 两个窄集群、L3-4 双引擎对照、L4 中文闭环 | 工具页 CTR 与文章→工具跳转有可对比的周期数据 |

不设日期承诺：阶段二、三的节奏取决于阶段一的报表与工程何时就绪。**A 类描述性文案在任何阶段都不投入。**

---

## 7. 需要同步维护的既有文档

本规划生效后，以下文档应补一节，避免规则与方向打架（**本轮未改**）：

- `.claude/seo-strategy.md` §4「文章内容策略」：补 AI 搜索 / zero-click 定位，明确文章 KPI 改为转化而非自身曝光。
- `json-blog-writer` skill 的 `SKILL.md` 与 `references/content-plan.md`（`.claude/skills/` 与 `.codebuddy/skills/` 各有一份）：Mode B 已可用（报表已到位），需把 `content-plan.md` 里基于外部假设的 P0 选题队列按 §0.2 的真实意图结构重新排序；避免继续按「科普稿铺量」派工。
- `.claude/rules/seo-workflow.md`：补「工具页优先于博客页」的投入次序。
- 两份 `data/*/README.md`：口径说明已在上一轮补齐，保持。

---

## 8. 本轮边界

只产出方向判断与取舍。**没有**写新文章、改工具功能、改 SEO 文案、动 `llms.txt` 条款，也没有把上述路线拆成任务清单。需要执行时，从阶段一开始单独拆清单。

---

## 9. 备选路线评估：纯产品 / 分发优先

> 命题：**停掉全部 SEO 内容生产**，资源只投「工具能被带状态进入、被嵌入、被安装、被别处链接」的能力，以及这些能力的对外文档。本节是评估记录，不是已采纳路线。

### 9.1 为什么值得认真考虑

- 92.1% 曝光来自工具型词；搜索入口一旦被 AI 中介化，「被引用」不如「被调用」。
- 工具被嵌进别人的文档 / 内部系统，或被安装到桌面后，**完全绕过 SERP 与 AI 摘要**——这是对 zero-click 最彻底的解法。
- 项目已有骨架（见 9.2），不是从零建设。

### 9.2 已有骨架与缺口（本次代码调研）

| 能力 | 现状 | 缺口 | 证据 |
|---|---|---|---|
| embed | 只支持 json-editor 一种工具；导航与 README 已有公开入口 | `?tool=` 不存在，**其余 30 个工具不可嵌入** | `app/pages/embed/json.vue:16-44`、`embed/index.vue:30-42`、`Header.vue:99`、`README.md:23,30` |
| 分享深链 | `#share=` 只在 json-editor 出现，`getToolPath` 硬编码单页 | 无 `?example=` 统一入口；`meta.source` 类型预留但运行时不写入，**链接无来源标记、无法归因** | `useShareJson.ts:130-132,300-302`、`app/utils/share/payload.ts:35-38` |
| 工具链 | `nextSteps` / `recommends` 是底部静态推荐卡片 | 不携带结果/状态/来源，不随输出变化，**不是结果驱动闭环**；唯一带数据的是超大文件兜底单路径 | `ToolRelated.vue:4-21`、`useLargeFile.ts:136-148` |
| 离线 | 只有 `site.webmanifest` 可安装元数据 | **无 service worker / 离线缓存**；`llms.txt.ts:53,127` 的「断网仍可用」仅靠静态预渲染 + 纯客户端计算支撑 | `public/site.webmanifest:1-25`、`app/app.vue:40` |
| 度量 | 有条件注入 Umami 页面统计（构建期 ID） | **零自定义事件埋点**，无 embed 使用量 / share 转发量 / 工具间转化；且 `llms.txt` 宣称 no tracking 与 `privacy.md` 的 PV/referrer 采集**口径矛盾** | `nuxt.config.ts:131`、`useSiteSeo.ts:43-50`、`content/en/privacy.md:54-62`、`README.md:18` |

### 9.3 代价与风险

1. **失去唯一可累积的新增长尾入口**：GSC 同期仅 51 clicks / 76 天，站点仍在「需要被发现」阶段。embed 冷启动依赖别人愿意嵌，比写稿更慢、更不可控。
2. **无事件埋点 = 不可证伪**：连 query×page 都缺，若流量不涨，无法区分「分发没起作用」与「起作用了但没测到」。这是最致命的一条。
3. **「内容零投入」是伪命题**：README、embed 文档、可复制示例、demo 本身也是内容，只是从「给搜索引擎看的长文」变成「给开发者看的说明书」。真正的取舍不是「内容 vs 产品」，而是「内容给谁看」。
4. **AI 引用通道停更**：`llms.txt` 的 Guides 清单不再更新，品牌引用只剩动态生成的工具清单（这部分尚可）。
5. **要加度量必须先统一隐私口径**，否则是合规与 copy-accuracy 风险。

### 9.4 结论

**不采纳「内容完全停止」，但采纳其重心。** 把资源主投到 9.2 各行的收口：深链统一 / 全工具 embed / 结果驱动工具链 / 来源标记与最轻埋点 / 离线承诺对齐。内容侧不扩量，只保留产品说明书形态（README、可复现示例、基准数据）与 L2 两个已验证窄集群。

理由：9.2 的每一项都是**已有骨架的收口**，边际成本远低于继续写稿，且直接作用于那 92% 需求；而完全停投会在站点还没有稳定发现渠道、也没有度量手段的时候，同时切断入口与观测能力。

### 9.5 若仍想试纯 P 路线

最小可行验证：**只做「深链统一 + 来源标记/埋点」，内容完全不动**，跑一个周期看 embed / share 带来的实际跳转。有了可观测数据再决定是否全面转向，避免在不可观测的状态下一次性切换。
