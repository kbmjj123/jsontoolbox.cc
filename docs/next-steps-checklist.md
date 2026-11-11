# 接下来要做的事：完整执行清单

> 建立日期：2026-11-11 ｜ **唯一执行入口**
> 依据：`docs/content-optimization-tasks.md`（已执行记录与口径基线）、`docs/content-direction-plan.md`（方向判断、取舍、§9 备选路线评估）、`data/gsc/2026-11-11.xlsx`、`data/bing/bing.csv`
> 本清单只列**待办**，不重复方向论证。方向有变动时先改 `content-direction-plan.md`，再回到这里同步。

---

## 0. 一句话原则

**主投 C 类（可复现状态 + 独占资产 + 分发能力），A 类描述性文案零投入。**

| 类型 | 指什么 | 投入 |
|---|---|---|
| A 描述性文案 | `features` / `faq` / `article` 扩写、新科普稿 | 零 |
| B 可验证事实 | 真实输入输出、报错原文、体积与格式边界 | 只做「准」，不做「多」 |
| C 独占资产与可复现状态 | 预填深链、坏语料库、实测基准、可下载数据集、分发能力 | **主投** |

理由：六个工具页近 5,000 曝光却几乎零点击（`json-editor` 2,304 I / 3 C / CTR 0.13%），人还没点进来，加长文救不了这个漏斗。

### 口径约束（继承 `content-optimization-tasks.md` §0.2）

1. GSC 与 Bing 的 impressions 口径不同，**不相加、不直接比大小**；Bing 曝光 25,861 / 点击 297 不代表「Bing 流量更大」。
2. GSC 点击以 `Pages` 表为准；`Queries` 表 812 词合计 clicks 仅 3（长尾匿名化），只用于 impressions / position 排序。
3. 两引擎都缺 query×page 映射，**不做词→页归因、不下关键词自相残杀结论**。
4. Bing 报表无 query/page/position，现有意图分布（工具型 92.1% / 信息型 4.4% / 排错型 3.8%）**仅代表 GSC**。
5. 所有文案改动受 `.claude/rules/copy-accuracy.md` 约束：能力断言必须能指到 `file:line`。
6. AI 侧不跑 `pnpm build` / `nuxi typecheck` / `pnpm dev`，只用静态复查（`read_lints`、`node --check`、重跑脚本、grep 校验引用）。

---

## 1. 阻塞项：需要你拍板或提供（B）

| # | 事项 | 依据 | 验收 |
|---|---|---|---|
| **B1** | 补导 GSC query×page 报表 + Bing `Search Keywords` / `Page Traffic`，按两份 `data/*/README.md` 的命名规范放入目录 | T2 遗留；`node scripts/validate-seo-reports.mjs` 当前报「GSC 维度齐全但缺映射 / Bing 完全缺维度」 | 校验脚本报「归因就绪」 |
| **B2** | 导出 GSC 中文页索引覆盖率报告（URL 检查） | `/zh/blog/*` 仅 2 页有曝光 | 能判定「未收录」还是「已收录未展示」 |
| **B3** | 决策：中文文章 14 条工具内链是否统一加 `/zh` 前缀 | `content-optimization-tasks.md` §4.1；`/zh/tools/...` 路由存在但中文工具页排名差（如 `json-to-csv` P104.5） | 给出明确结论；若「加」，批量替换后校验 0 死链 |
| **B4** | 决策：`content/en/blog/json-editor-component.md` 草稿重写还是归档 | 承诺「Vue 3 component / custom element / CDN script tag」，全仓 `app/` 无 `customElements` 实现，copy-accuracy 阻断 | 仓库不再留悬空草稿 |
| **B5** | 决策并统一隐私 / 埋点口径 | 三处矛盾：`llms.txt.ts:52-53,126` 称 no tracking；`content/en/privacy.md:54-62` 声明采集 PV/referrer；`README.md:18` 称 no telemetry pipeline | 三处口径一致，并明确是否允许自定义事件埋点（**S1-2 的前提**） |
| **B6** | 确认是否把「纯 P 路线最小验证」作为阶段一范围 | `content-direction-plan.md` §9.5 | 阶段一范围锁定，不边做边扩 |

---

## 2. 阶段一 S1：解除依赖 + 最小可行验证（优先）

| # | 动作 | 依据（代码位置） | 依赖 | 验收 |
|---|---|---|---|---|
| **S1-1** | **统一深链协议**：落地页接收 `route.query.example` → `JsonInputEditor` 用已有 `loadById()` 预填 → 统一守卫「预填优先于 20+ 处 `onMounted` 默认示例」；同时去掉 `#share=` 的单页硬编码、把 `meta.source` 真正写入链接、加来源参数 | 落地页 `[category]/[slug].vue:24` 不读 query；`useToolExample.ts:59` 有 `loadById` 但零调用点；`useShareJson.ts:300-302` `getToolPath` 硬编码 `/tools/format/json-editor`；`app/utils/share/payload.ts:35-38` 预留 `blog-example` / `embed` 却运行时不写 | — | 任一工具页可从外部链接带样本进入；生成的链接带可识别来源 |
| **S1-2** | **最轻埋点 / 来源追踪**：embed 使用、share 转发、工具间跳转、文章→工具跳转 | 全库无 `track(` / `/api/events` / `umami.track`；`nuxt.config.ts:131` 仅有条件 PV 统计 | **B5** | 能回答「某个 embed / share 带来多少次进入」 |
| **S1-3** | **口径与文案对齐**：修正 `llms.txt.ts:53,127` 的离线承诺（现无 service worker，仅静态预渲染 + 纯客户端计算支撑）；统一三处 tracking 表述；README 补 share / 离线 / analytics 说明 | `public/site.webmanifest` 只有安装元数据，无 SW；README 现为工具清单 | **B5** | copy-accuracy 通过；三处口径一致 |
| **S1-4** | 重跑 `node scripts/validate-seo-reports.mjs`，产出带口径声明的双引擎对照 | 脚本已交付并实跑 | **B1** | 出对照表，且**不做绝对值结论** |
| **S1-5** | 把校验脚本纳入月度流程：每次导出附口径说明、日期范围对齐、`--strict` 可用于 CI | `content-optimization-tasks.md` T10 | — | 每份新报表都有口径说明 |

> 最小可行验证（§9.5）= **S1-1 + S1-2，内容完全不动**，跑一个周期看 embed / share 实际跳转，有可观测数据后再决定是否全面转向纯 P 路线。

---

## 3. 阶段二 S2：主投 C 类（独占资产 + 分发能力）

| # | 动作 | 依据 | 依赖 | 验收 |
|---|---|---|---|---|
| **S2-1** | **embed 通用化**：加 `?tool=`，让 31 个工具可嵌；同步 `embed/index.vue` 生成器与 README | `embed/json.vue:16-44` 只支持 json-editor，`?tool=` 不存在；导航 `Header.vue:99` 与 `README.md:23,30` 已有入口 | S1-1 | 每个工具都有可用 iframe 片段，带 branding 参数 |
| **S2-2** | **结果驱动工具链**：`nextSteps` / `recommends` 从底部静态卡片改为携带当前输出跳转 | `ToolRelated.vue:4-21` 不带数据/状态/来源；`useLargeFile.ts:136-148` 已有 handoff state 先例 | S1-1 | 工具→工具跳转能带上当前结果 |
| **S2-3** | **系统化坏 JSON 语料库**：编号、错误分类、可下载、每条对应一个预填深链 | `scripts/samples/` 仅 4 个小文件（只被 Playwright 引用）；`examples/json-repair.json` 3 个示例 | S1-1 | 语料可下载，每条链接可直接复现报错 |
| **S2-4** | **真实性能基准**：用自家工具实测 1/5/10/20MB JSON 的格式化、树展开、校验耗时，附机器配置、文件大小、方法说明 | 全库 `*benchmark*` 零命中 | — | 表格可复现、数字有出处 |
| **S2-5** | **测试数据集站内化**：把 `resources.jsontoolbox.cc/orders-{1,5,10,20}mb.json` 收回站内，每个文件配「用 Large JSON Viewer 打开」深链 | `content/en/blog/free-realistic-json-test-data.md:43-46` 现为外链，仓库内无实体 | S1-1 | 站内可下载，无外链依赖 |
| **S2-6** | **离线可安装**：补 service worker，把 `site.webmanifest` 变成真 PWA | `app/app.vue:40` 已引入 manifest，但全库无 SW / workbox | S1-3 | 断网重新导航可用 |
| **S2-7** | **README 转为产品说明书**：怎么嵌入、怎么带状态链接、怎么自托管 + 可复制示例；补 share / 离线 / analytics | README 现主体是 31 个工具表与指南清单 | S1-3 | 开发者照文档可独立完成一次嵌入 |

---

## 4. 阶段三 S3：轻量配套

| # | 动作 | 依据 | 依赖 | 验收 |
|---|---|---|---|---|
| **S3-1** | L1 边界事实核准：6 个工具页按 `json-editor` → `json-escape` → `json-to-csv` → `json-compare` → `json-to-yaml` → `json-schema-validator` 逐条核对输入输出/失败情形/体积格式限制，**正文不追加篇幅** | `content-direction-plan.md` L1 | — | 每条断言能指到 `file:line`，en/zh 集合一致 |
| **S3-2** | L2 两个窄集群：把 `unexpected end of json input` 的报错原文变体写成 H2/FAQ，补 `how to create json file` 的 Windows/Mac/VS Code 变体，每条带预填深链 | GSC 排错 Top15 中 9 个是同一报错变体、合计 120 I；信息型 create 系列约 67 I | S1-1 | 真实问句、每条可动手，不写泛泛排错指南 |
| **S3-3** | 中文侧闭环：按 B2/B3 结论修索引与内链前缀；**不新写中文稿** | GSC `Countries` 里 China 仅 41 I / 4 C | B2/B3 | `/zh` 页可索引、内链不跳英文 |
| **S3-4** | 跨周期 CTR 复核：对照 T3 基线 `json-editor` 3C/2304I/0.13%、`json-escape` 0C/950I、`unexpected-end...` 7C/1219I/0.57% | `content-optimization-tasks.md` §4 | 新一期报表 | 记录变化，不归因于单一改动 |
| **S3-5** | 按 B4 结论处置 `json-editor-component` 草稿 | 发布阻断：未实现承诺 | B4 | 草稿不再悬空 |
| **S3-6** | 双引擎实测对照出稿（同一批词在 Google / Bing 的表现） | `content-direction-plan.md` L3-4 | S1-4 | 先解决口径可比性，否则不出结论 |

---

## 5. 文档与规则同步（低风险，可并行）

| # | 动作 | 依据 |
|---|---|---|
| **D-1** | 修 `.claude/skills/json-blog-writer/SKILL.md:23,61` 的断链：引用 `references/content-plan.md`，真实文件是 skill 根目录下的 `content-plan.md` | 引用路径不存在 |
| **D-2** | 重排 `.claude/skills/json-blog-writer/content-plan.md` 的 P0 队列：Mode B 已可用（报表已到位），按 92.1% 工具型意图结构重排；停用「站点无 GSC 数据」的 Mode A 假设 | 文件 `:3-4` 仍写「暂无 GSC/Bing 历史数据」 |
| **D-3** | `.claude/seo-strategy.md` §4 补 AI 搜索 / zero-click 定位，文章 KPI 改为转化而非自身曝光 | `content-direction-plan.md` §7 |
| **D-4** | `.claude/rules/seo-workflow.md` 补「工具页优先于博客页」的投入次序 | 同上 |
| **D-5** | `CLAUDE.md` 补 `@docs/content-direction-plan.md` 与 `@docs/next-steps-checklist.md`，避免「零引用的活决策」被误判为无效文档 | 两份文档当前零活文档引用 |

---

## 6. 明确不做

- **不写**新科普稿、不扩写 `features` / `faq` / `article`；`what is` / `A vs B` / `best practices` 一律不新增。
- **不把排错扩成大类**，只做 S3-2 的两个已验证窄集群。
- **不封 AI 爬虫、不加登录 / 付费墙**：`nuxt.config.ts` robots 保持 `userAgent: '*' allow`；`llms.txt` 的开放、署名与禁止训练条款保持。
- **B1 完成前**：不做词→页归因、不自相残杀定论、不推断「AI 偷走流量」、不把两引擎数字相加。
- **不在内容侧追加篇幅**来「丰富工具页」——CTR 0.13% 的瓶颈不在正文长度。

---

## 7. 度量与复查

| 层级 | 指标 |
|---|---|
| 主 | 工具页 CTR、文章→工具跳转、工具实际使用、embed / share 进入次数 |
| 次 | 工具页平均排名、带链接的品牌引用 |
| 参考（非 KPI） | 文章页 impressions |
| 禁用 | 两引擎 impressions 相加、跨日期范围比较、`Queries` 表点击数 |

每周期固定：日期范围对齐 → `node scripts/validate-seo-reports.mjs` → 记录口径说明 → 才做同比。

一批改动完成后的静态复查：`read_lints` → `node --check` 改过的脚本 → 重跑校验脚本 → 全站博客内链 / `promo.slug` 死链校验 → 工具 JSON 有效性 → `meta.keywords` 覆盖率 100% → `git --no-pager diff --stat`。**构建由用户本地验证。**

---

## 8. 文档清理原则（本轮已按此执行）

- **删除**：重复副本、AI 对话草稿、写作过程（`draft.md` / `serp.md`）、被新方向取代的旧选题队列、已有真实数据后的空占位。
- **保留**：`content-optimization-tasks.md`（口径基线与执行记录，被方向文档继承）、`content-direction-plan.md`（最新决策链）、`tool-page-playbook.md` / `README.zh-CN.md` / `self-hosting/docker.*`（活文档，被 `CLAUDE.md` / `README.md` / `compose.yml` 引用）、`docs/upgrade/finish/` 与 `docs/superpowers/`（已落地实施记录与架构决策）、`docs/left-pages/summary.md` 与 `semrush-summary.md`（调研底稿）、`docs/blog/` 下 8 篇工作稿（已发布文章的来源记录）、`docs/channel/`（未执行但有效的路线规格）。
- 具体删除结果见本轮交付说明，不在本文档内重复维护。

---

## 9. 实施进度（2026-11-11）

### 9.1 本轮已完成

| 项 | 实际落地 |
|---|---|
| D-1 | 两个 skill 副本的 `SKILL.md` 中 `references/content-plan.md` → `content-plan.md`（真实文件在 skill 根目录） |
| D-2 | 两份 `content-plan.md` 顶部标注「Mode A 已停用」，指向本清单与方向文档；旧 P0 队列保留为历史记录 |
| D-3 | `.claude/seo-strategy.md` 新增 §7：工具型 92.1%、文章 KPI 改转化、停止科普稿、不封 AI 爬虫、口径约束 |
| D-4 | `.claude/rules/seo-workflow.md` 新增「投入次序」5 条 |
| D-5 | `CLAUDE.md` 新增「Content Direction & Next Steps」节，挂上两份文档 |
| **S1-1（核心）** | `JsonInputEditor.vue` 的 `loadDefaultExample()` 支持 `?example=<id>`；**24 个调用该方法的工具组件一处改动全站生效**。无效 id 静默回退默认示例；加 `/tools/` 路径守卫避免与 `/embed/json` 同名参数（语义为示例文件名）冲突 |
| S1-1 配套 | `app/assets/data/examples/json-repair.json` 补 3 个对应真实排错查询的坏样本：`truncated-response`、`html-error-page`、`concatenated-json`；`useShareJson.ts` 的 `getToolPath` 加注释澄清为有意设计 |
| S1-3（部分） | 修正 `llms.txt.ts:53,127` 的离线措辞（见 9.2） |
| **方案 A：`#in=` 任意数据带状态进入** | 新增 `app/utils/share/inbound.ts`（复用 `jtb1d` + deflate-raw，独立 payload `{version,text,input2?,label?}`）；`JsonInputEditor` 接入，优先级 `#in=` > `?example=` > 默认示例；解码失败/超限给中英提示并回退；新增 `scripts/make-inbound-url.mjs` 生成链接（含自检、三层上限、敏感数据警示） |
| **S2-3 坏 JSON 语料库** | 新增 `scripts/build-bad-json-corpus.mjs`：14 条样本按 14 类错误分类，每条用真实 `JSON.parse` 实测报错（非手写）并预生成 `#in=` 深链（`inbound.ts` 同格式）；落盘 `public/data/bad-json-corpus.json` 可下载，每条链接可在 JSON Repair 直接复现报错。覆盖原 `scripts/samples/` 死样本场景 |
| **S2-1 embed 通用化** | 新增 `app/pages/embed/tool.vue` 通用壳：按 `?tool=<slug>` 复用工具页 `import.meta.glob` 解析任意 universal 组件并渲染，31 个工具一次覆盖；生成器 `embed/index.vue` 增加工具选择器并分支生成 `/embed/tool` 片段（旧 editor/viewer 走 `/embed/json` 保持兼容）；README 与 i18n 同步「可嵌入任意工具」。静态核查 32 个 universal 组件：仅 `LargeJsonViewer` 用硬编码视口高度（`100vh`/`calc`/`fixed`）需 embed 适配，已补 embed 分支（`h-full` 占满外壳、禁用全屏覆盖层）；其余组件均为 `ResizablePanel` / `h-full` 自管理根，与工具页形态一致，embed 下直接可用 |
| **S2-2 结果驱动工具链** | 新增 `app/composables/useToolHandoff.ts`：客户端共享镜像「当前工具输入」（`useState`，SSR 为空，保证 SEO 链接干净）。`JsonInputEditor` 一处加客户端 watch 写入（覆盖 24 个用它的工具，同 S1-1 套路）；`ToolRelated` 的相关工具链接改为 `linkTo()`，读取镜像输入并经 `#in=` 协议异步编码附加到目标 URL，下游 universal 组件自动预填。8 个未用 `JsonInputEditor` 的工具（生成器/PDF/表格/大文件）降级为干净 path（与方案 A 的 `#in=` 覆盖范围一致）；SSR 不携带数据，仅客户端交互后生效 |
| **S2-2 续：相关工具位置上移** | 把「相关工具」从 `ToolSeoContent` 底部（Features/Guide/Example/Article/FAQ 之后）抽到工具页 `universal` 组件正下方独立 section，使其紧贴工具主体、用户处理完数据即见下一步入口。`ToolSeoContent` 移除该 section 与死代码 `relatedSlugs`；合并逻辑（nextSteps+recommends）迁到工具页。embed 外壳不引用 `ToolSeoContent`，不受影响 |
| **S2-6 离线可安装 PWA（技术部分）** | 手写 `public/sw.js`（导航 network-first、静态 cache-first、版本化缓存、旧缓存清理）+ 在 `app.vue` 生产环境注册（`import.meta.dev` 守卫，dev 不注册以免缓存干扰）。`site.webmanifest` 字段（name/icons/display/start_url/scope）本已齐备，补上 SW 即成为真 PWA。analytics 文案不属本项（归 S2-7/S1-3） |
| **S2-7 README 产品说明书（非 B5 部分）** | README 新增 `## Embedding`（`/embed/tool` 参数表 tool/theme/height/branding/lang + 可复制 iframe 示例）、`## Share & stateful links`（#in= 片段协议、工具间跳转自动携带、诚实标注 embed 不读 #in=、Share 按钮待 S1-2）；增强 `### Self-hosting with Docker`（补源码 build 命令 + 环境变量表 NUXT_PUBLIC_SELF_HOSTED/SITE_URL/SITE_NAME/JT_BASE_URL）。embed 生成器页（`app/pages/embed/index.vue`）同步补「URL parameters」说明卡 + Limitations 补 limitation4（诚实标注 embed 不读 #in=、初始空白），en/zh locale 同步；中文 README（docs/README.zh-CN.md）同步补「嵌入」「分享与带状态链接」「使用 Docker 自托管」三块，双语一致。analytics 段仍待 B5 口径 |

### 9.2 按代码事实修正的清单描述

1. **`getToolPath` 硬编码不是缺陷**：`ShareToolId` 只有 3 个值（`json-formatter` / `json-viewer` / `json-validator`），都是同一个 JSON Editor 页的视图，分享 UI 只在 `JsonEditor.vue` 出现。去掉映射会破坏功能，本轮只加注释说明；**全工具分享需另立任务**。
2. **`meta.source` 运行时写入延后**：它与「来源标记 / 分发归因」同属 B5 隐私口径决策，擅自加会踩口径矛盾。协议层字段已存在（`app/utils/share/payload.ts:35-38`），等 B5 拍板。
3. **S1-1 参数加 `/tools/` 守卫**：`/embed/json` 已有 `?example=<文件名>` 语义，不能全局复用同名参数。
4. **S1-3 的 tracking 口径未动**：`llms.txt.ts:52,126`、`llms-full.txt.ts:78` 与 `content/en/privacy.md:54-62` 的矛盾属 B5 决策范围，本轮只改离线措辞。
5. **`#in=` 用 URL fragment 而不是 query**：最初设计为 `?in=`，但数据放 query 会进服务器日志与 Referer 头；项目自有的 `#share=` 用 fragment 正是为此。统一后解码永不触发网络请求，数据不出现在 HTTP 层。注意页面内脚本（如 AdSense）仍可读 `location.href`，故生成器已附「勿用于密码/令牌」警示——与现有 `shareWarning` 口径一致。

### 9.3 未实施及原因

| 项 | 原因 |
|---|---|
| B1–B6 | 需用户导出报表 / 拍板 |
| S1-2 | 依赖 B5（埋点口径） |
| S1-4 | 依赖 B1 |
| S2-4、S2-5 | S2-4 无依赖；S2-5 依赖 S1-1（已完成）。两者现在可做；S2-5 仍受「大文件如何站内托管（约 400MB，不能进 git）」与「LargeJsonViewer 远程加载深链（当前仅本地上传）」两个未决工程点制约 |
| S2-6 离线 PWA | 已完成（手写 sw.js + 生产注册；manifest 字段已齐备），不依赖 B5 |
| S2-7 README 说明书 | 非 B5 部分（嵌入 / 带状态链接 / 自托管文档）已完成；仅 analytics 说明段依赖 S1-3 的 tracking 口径（B5），待其拍板 |
| S2-1、S2-2、S2-3 | 已完成（均不依赖 B5） |
| S3 全部 | 依赖 T2 数据与预填链路验收 |
| S1-3 tracking 部分 | 依赖 B5 |

### 9.4 `#in=` 用法

```bash
echo '{"a":1}' | node scripts/make-inbound-url.mjs /tools/format/json-editor
node scripts/make-inbound-url.mjs /tools/format/json-repair ./broken.json
# 双输入工具（JSON + Schema）：
node scripts/make-inbound-url.mjs /tools/format/json-schema-validator ./data.json --input2 ./schema.json
```

- 输出形如 `https://jsontoolbox.cc/tools/format/json-editor#in=<base64url>`；数据在 fragment，**可编辑、不锁只读**，与只读的 `#share=` 语义分离。
- 三层上限：原文 512 KB 字符、UTF-8 解压后 256 KB、完整 URL 4000 字符；超限生成器拒绝，接收端给本地化提示并回退默认示例。
- 优先级：`#in=` > `?example=` > 内置默认示例；只在 `/tools/` 路径生效。
- 覆盖 24 个使用 `JsonInputEditor` 的工具页；8 个未调用 `loadDefaultExample()` 的组件（生成器/PDF/表格/大文件查看器）暂不覆盖。
- `JSON_TOOLBOX_ORIGIN` 环境变量可切换域名，便于本地验证。

### 9.5 坏 JSON 语料库用法

- 数据文件：`public/data/bad-json-corpus.json`，可访问 `/data/bad-json-corpus.json` 直接下载。
- 结构：`categories`（14 类错误）+ `items`（14 条）；每条含 `id` / `category` / 中英标题与说明 / `input`（坏 JSON 原文）/ `expectedError`（由 `JSON.parse` 实测，非手写）/ `deepLink`（预生成的 `#in=` 链接）。
- 复现：点 `deepLink` 即在 JSON Repair 预载样本，点「修复」即可看到对应报错；`expectedError` 即预期信息。
- 重建：`node scripts/build-bad-json-corpus.mjs`（改样本或新增类别后重跑；`JSON_TOOLBOX_ORIGIN` 可切换域名）。
- 注意：原 `scripts/samples/` 的 4 个文件已被本语料库系统覆盖，且实际无 Playwright 引用，属冗余死资源；清理留待后续（不在本轮删除范围）。
