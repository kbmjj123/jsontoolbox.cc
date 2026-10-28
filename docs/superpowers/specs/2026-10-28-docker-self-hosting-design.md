# Docker 自托管发布能力 — 设计文档

- **日期**：2026-10-28
- **状态**：待实施（需求来源：`docs/channel/01-docker-self-hosting.md`，P0）
- **项目**：`jsontoolbox.cc`（Nuxt 4 静态站，31 个纯前端 JSON 工具）

---

## 1. 目标与成功标准

为已安装 Docker 的用户提供**无需本地编译**的 JsonToolBox 实例。

成功标准（逐字摘自需求）：

1. 用户按文档拉取公开预构建镜像后可以启动实例；
2. 核心处理仍在浏览器进行（不引入服务端 JSON 处理）；
3. 官网构建与自托管构建互不破坏。

非目标：账号系统、数据库、管理后台、多租户、自动升级服务、许可证服务器、远程 JSON 存储。

---

## 2. 架构调查记录（开工前检查）

> 本节为**实际检查结果**，均给出 `file:line`。未确认项显式标注"待核实"。

### 2.1 构建与产物

| 检查项 | 结论 | 证据 |
|---|---|---|
| 构建模式 | `nitro.preset: "static"` + `static: true`；`ssr: true`（预渲染） | `nuxt.config.ts:6-9` |
| 是否有运行时服务端 | **无**。`.output/` 下只有 `public/` 与 `nitro.json`，没有 `server/index.mjs` | 实际目录检查 |
| server 路由 | 仅 4 个，全部构建期消费：`server/api/sitemap-urls.ts`、`server/api/sitemap-blog.ts`（sitemap 数据源）、`server/routes/llms.txt.ts`、`server/routes/llms-full.txt.ts`（已预渲染为 `llms.txt` / `llms-full.txt`） | 目录检查 + `.output/public/llms.txt` 存在 |
| 构建脚本 | `nuxt build && cp .output/public/sitemap_index.xml .output/public/sitemap.xml` | `package.json:14` |
| postinstall | `nuxt prepare && pnpm run build:pkg`（构建 workspace 包 `@kbmjj123/json-editor`） | `package.json:20` |
| 静态落盘规则 | 每个路由同时产出 `path.html` 与 `path/_payload.json`（例：`tools/format/json-editor.html` + `tools/format/json-editor/_payload.json`）；另有 `200.html`、`404.html` | 产物目录检查 |
| Node 版本 | `v22.16.0` | `.nvmrc` |
| 包管理器 | pnpm 10.25.0（`packageManager`），lockfile 已提交，CI 用 `--frozen-lockfile` | `package.json:12`、`.gitignore:30-33` |
| 内容层 | `@nuxt/content` + `content.config.ts`（构建期需要 `content/`） | `content.config.ts` |
| 特殊 alias | `@nuxt/content/server` → `./adapter-content.ts`（sitemap 的空实现桩，构建期必需） | `nuxt.config.ts:187-190` |

**结论：静态输出足够，不需要运行 Nitro 服务端。** 实施不得把 preset 改成 node/server。

### 2.2 外部依赖（运行时）

| 类别 | 结论 | 证据 |
|---|---|---|
| 字体 | **本地**。`@fontsource-variable/inter`，CSS 中无 Google Fonts 引用 | `app/assets/css/tailwind.css:2`；产物 CSS 无 `fonts.googleapis` |
| 图标 | **远端（阻断项）**。产物含 `iconifyApiEndpoint: "https://api.iconify.design"`、`fallbackToApi: true`、`localApiEndpoint: "/api/_nuxt_icon"`；而静态产物**没有** `api/` 目录 → 图标实际走 Iconify 公共 API（含 `api.unisvg.com` 等镜像） | `.output/public/_nuxt/uC_81WEO.js`；`nuxt.config.ts:156-166` |
| 统计 | Umami 脚本，**仅在构建期注入了 `NUXT_PUBLIC_UMAMI_ANALYTICS_ID` 时**才存在；脚本来自 `https://cdn.bulkpictools.com`，上报 `https://umami.bulkpictools.com` | `app/composables/useSiteSeo.ts:43-50`、`app/app.vue:42`、`nuxt.config.ts:115` |
| 广告 | **未发现**任何广告/GTM/Adsense 脚本 | 全仓 grep `adsbygoogle|googletag|gtag|plausible` |
| 联系表单 | `POST https://api.web3forms.com/submit`；`config.public.formKey` 在 `runtimeConfig` 中**未声明**，当前恒为 undefined（既有缺陷，待核实） | `app/components/ContactForm.vue:85,156`；`nuxt.config.ts:112-123` |
| 从 URL 加载 JSON | 用户主动触发 `fetch(target)`，离线不可用 | `app/components/tool/LoadUrlModal.vue:76` |
| 第三方徽章图片 | 首页/页脚渲染 6 个外站徽章图（openhunts / yo.directory / twelve.tools / launchit.fast / launchclash / launchnest）→ 每次加载首页都发起第三方图片请求 | `app/assets/config/exchange-links.json`、`app/components/app/Footer.vue:33` |
| 值预览中的远程资源 | 用户数据里的图片/音视频/PDF URL 会由浏览器发起第三方请求（`isRemoteResource` 已做提示） | `app/utils/mediaPreview.ts` |
| 分享链接 | **已符合要求**：`${window.location.origin}${path}#share=...`，只带 hash，不上传服务器 | `app/composables/useShareJson.ts:130-132` |
| OG 图字体（构建期） | `ogImage.fonts: ['Noto+Sans+SC:400','Noto+Sans+SC:700']` → 构建期下载字体，属**构建期**网络依赖 | `nuxt.config.ts:102-108` |

### 2.3 Worker / WASM

| 检查项 | 结论 | 证据 |
|---|---|---|
| Worker | 存在，Large JSON Viewer 专用：`new Worker(new URL('../workers/recordStream.worker.ts', import.meta.url), { type: 'module' })` | `app/composables/useLargeFile.ts:224-230` |
| Worker 源文件 | `app/workers/recordStream.worker.ts`、`app/workers/jsonStream.worker.ts` | 目录检查 |
| 产物 | 独立 chunk `recordStream.worker-*.js`（ES module） | `.output/public/_nuxt/recordStream.worker-BhgvF9t1.js` |
| WASM | **未发现** `.wasm` / `WebAssembly` | 全仓 grep |

→ 静态服务器必须让该 chunk 以 `application/javascript` 返回，且缺失时**不能回落 HTML**。

### 2.4 域名与基址常量

| 位置 | 行为 | 影响 |
|---|---|---|
| `nuxt.config.ts:71` | `site.url = NUXT_PUBLIC_SITE_URL \|\| 'https://jsontoolbox.cc'` | canonical / sitemap / OG 绝对地址的**构建期**来源 |
| `nuxt.config.ts:142` | `i18n.baseUrl` 同上 | hreflang 构建期来源 |
| `nuxt.config.ts:114` | `runtimeConfig.public.baseUrl` 同上 | `twitter:site`、Schema.org、搜索 action |
| `app/app.vue:11-16` | canonical 由 `siteConfig.url + route.path` 拼出 | **自托管实例若未重新构建，canonical 会指向官网** |
| `app/pages/embed/index.vue:23,38` | 硬编码 `https://jsontoolbox.cc/embed/json` | 自托管实例生成的 iframe 片段指向官网 |
| `app/pages/embed/json.vue:259,470` | 硬编码官网工具页与链接 | 同上 |

### 2.5 已有能力 / 缺失能力

**已有**
- 纯静态产物（无需 Node 运行时）
- 分享链接已用当前实例地址
- 字体本地化
- 多语言（en / zh，`prefix_except_default`）
- CI 已存在（但只覆盖 `packages/json-editor`）：`.github/workflows/ci.yml`

**缺失（本次要建）**
- Dockerfile / `.dockerignore` / Compose / 静态服务器配置
- 自托管模式开关与功能门控
- 运行时配置通道（白名单）
- 路由与资源加载冒烟测试
- 多架构镜像构建与发布工作流
- 部署 / 升级 / 回滚 / 公网边界文档

**既有缺陷（不在本次范围，需记录）**
- `ContactForm.vue` 的 `formKey` 未在 `runtimeConfig` 声明 → 官网联系表单的 `access_key` 恒为 undefined（待核实线上是否真的不可用）

### 2.6 仓库卫生（影响镜像内容与构建上下文）

| 目录 | 内容 | Docker 处理 |
|---|---|---|
| `data/` | `gsc/` + `bing/` SEO 数据（`.gitignore` 中另有 `gsc-service-account.json`） | **必须排除**（凭据风险） |
| `reports/`、`docs/`、`libs/` | 报告、文档、`libs/json-generator`（grep 确认**未被 app 引用**） | 排除 |
| `.env`、`.env.*` | 本地环境变量 | 排除（本地即已被 gitignore） |
| `.output`、`.nuxt`、`.data`、`node_modules`、`dist` | 构建产物 | 排除 |
| `.git` | 历史 | 排除 |

### 2.7 许可证与品牌（**阻塞项**）

- `LICENSE.md` = **MIT**（无"必须保留页面反链"条款）
- `README.md:186-232` 另有"Self-hosting & Attribution"章节，要求保留品牌与反链，并写"请勿通过配置刻意移除"，同时提供"白标/去品牌授权（另议）"

需求通用约束 #5 明确：**品牌展示可关闭，不得影响功能；许可证义务以仓库实际许可证为准，不将保留网页反链描述为 MIT 的要求。**
→ 与 README 现状冲突，**需维护者确认**（见 §10 阻塞项 B1）。在确认前，实施按需求执行（可关闭），但不擅自改 README 的授权条款。

---

## 3. 决策记录

| # | 决策项 | 结论 | 理由 |
|---|---|---|---|
| D1 | 运行形态 | **静态产物 + nginx:alpine**，不改 nitro preset | 已验证产物无服务端依赖；改 preset 会破坏官网 SSR/SEO |
| D2 | 构建架构 | builder 用 `FROM --platform=$BUILDPLATFORM`，runtime 用 `$TARGETPLATFORM` | 静态产物与 CPU 架构无关，避免 QEMU 下跑 `pnpm install` + 预渲染（分钟级 → 十年级） |
| D3 | 监听端口 | 容器内部 **8080**；文档/健康检查/Compose 统一用 8080 | 需求允许不固定 80；8080 使非 root 可直接监听 |
| D4 | 运行用户 | `USER nginx`，nginx.conf **不写** `user` 指令，临时目录全部放 `/tmp` | nginx 仅在 `geteuid()==0` 时才 setuid；非 root 启动即整体以 nginx 运行。配合 `--read-only --tmpfs /tmp` 可用（**待验证**） |
| D5 | 缺失资源 | HTML 路由 `try_files $uri $uri.html $uri/index.html =404` + `error_page 404 /404.html`；**资源类扩展名**单独 location，`try_files $uri =404` 且 `error_page 404 = @plain404` 返回纯文本 | 满足"不得对所有缺失资源无条件返回 HTML，避免掩盖 JS/Worker 404" |
| D6 | 运行时配置 | 入口脚本按**白名单**生成 `/tmp/jt-runtime/runtime-config.json`，nginx `alias` 暴露为 `/runtime-config.json`（`no-store`）；写入 /tmp 而非 html 目录，保证只读根文件系统可用 | 静态文件读不到容器 env；禁止把任意 env/秘密注入前端 |
| D7 | 配置取值 | 入口脚本对值做**严格字符白名单校验**，非法值丢弃并回退默认值 + 打日志 | 彻底规避 shell 生成 JSON 的转义漏洞 |
| D8 | 环境变量前缀 | `JT_`（`JT_SITE_NAME`、`JT_SHOW_BRANDING`、`JT_SHOW_EXTERNAL_BADGES`、`JT_ENABLE_REMOTE_LOAD`、`JT_ENABLE_CONTACT_FORM`、`JT_BASE_URL`） | 避免与宿主其他 env 冲突；白名单外一律忽略 |
| D9 | 索引策略 | **构建期**决定：自托管构建 `robots.txt` 为 `Disallow: /`、关闭 sitemap、页面 `<meta name="robots" content="noindex,nofollow">`；**运行期不提供索引开关** | 需求："若暂不实现，应明确哪些配置只能重新构建"。需要被索引时须重新构建并设 `SITE_URL` |
| D10 | 图标 | 自托管构建启用 `icon.clientBundle.scan`（本地 `@iconify-json/lucide`、`circle-flags` + 自定义 `icons` 集合）；**官网构建保持不变** | 唯一能让容器在断网时图标不请求 `api.iconify.design` 的办法；对官网零影响 |
| D11 | OG 图 | 自托管构建 `ogImage.enabled = false` | 省掉构建期 Noto Sans SC 字体下载与上百张 OG 图渲染，显著缩短镜像构建时间 |
| D12 | 官网零影响门禁 | 所有新行为由 `NUXT_PUBLIC_SELF_HOSTED=1` 构建期开关控制；未设置时代码路径与今天**逐字一致**（含"不发起 `/runtime-config.json` 请求"） | 需求："官网构建与自托管构建互不破坏" |
| D13 | 测试 | 根新增 `tests/`（vitest `^2.1.8`，与 `packages/json-editor` 同版本）+ `scripts/smoke-selfhost.mjs`（对运行中容器做 HTTP 断言） | 复用仓库既有测试框架；冒烟脚本由开发者在本地 Docker 执行 |
| D14 | 镜像标识 | 建议 `ghcr.io/kbmjj123/jsontoolbox`（**待确认**）；tag：`latest` + `<git-tag>` + `sha-<短 sha>` | 需求：固定版本可复现，latest 仅便捷入口 |

---

## 4. 运行方案

```
┌─ builder (BUILDPLATFORM, node:22-alpine) ─────────────┐
│ corepack enable pnpm                                   │
│ pnpm install --frozen-lockfile   (含 devDeps + postinstall) │
│ ARG/ENV NUXT_PUBLIC_SELF_HOSTED=1                      │
│ ARG/ENV NUXT_PUBLIC_SITE_URL=http://localhost:8080     │
│ pnpm build  → .output/public                           │
└────────────────────────────────────────────────────────┘
                     │ COPY .output/public
┌─ runtime (TARGETPLATFORM, nginx:1.27-alpine) ──────────┐
│ /usr/share/nginx/html  ← 静态产物                       │
│ /docker-entrypoint.sh  ← 白名单 env → /tmp/jt-runtime/  │
│                            runtime-config.json          │
│ nginx (USER nginx, listen 8080)                         │
└─────────────────────────────────────────────────────────┘
```

前端启动顺序：
1. 浏览器加载预渲染 HTML（构建期默认值已内嵌，断网也能渲染）
2. 仅当 `selfHosted === true` 时，`app/plugins/deploy-flags.client.ts` 拉取 `/runtime-config.json`（`no-store`，2s 超时），失败即回退默认
3. 合并后写入 `useDeployFlags()`，各组件按标志渲染；并按 `JT_BASE_URL`（缺省 `window.location.origin`）修正 `canonical`/`hreflang`

---

## 5. 配置模型

### 5.1 构建期（build-arg → ENV）

| 变量 | 默认（自托管镜像） | 用途 | 应用时机 | 安全边界 |
|---|---|---|---|---|
| `NUXT_PUBLIC_SELF_HOSTED` | `1` | 打开自托管分支：noindex、关 sitemap、关 ogImage、图标本地化、开启运行期配置拉取 | 构建期 | 仅布尔开关，不携带数据 |
| `NUXT_PUBLIC_SITE_URL` | `http://localhost:8080` | canonical / hreflang / Schema.org / sitemap 基址 | 构建期 | 会被运行期 `JT_BASE_URL` 覆盖（前端 patch） |
| `NUXT_PUBLIC_UMAMI_ANALYTICS_ID` | 空 | 自托管**不设置**，产物内不含任何统计脚本 | 构建期 | 空即无脚本 |
| `NUXT_PUBLIC_SITE_VERIFICATION_*` | 空 | 自托管不设置，不输出站长验证 meta | 构建期 | 空即无 meta |

### 5.2 运行期（容器 env，白名单）

| 变量 | 类型 | 默认 | 用途 | 校验 |
|---|---|---|---|---|
| `JT_SITE_NAME` | string | 沿用品牌名 `JSON Toolbox` | 站点显示名 | `[A-Za-z0-9._\- ]{1,60}`，否则回退 |
| `JT_SHOW_BRANDING` | bool | `1` | 是否显示"来源 / Powered by"链接。**关闭不影响任何工具功能** | `1/0/true/false/yes/no/on/off` |
| `JT_SHOW_EXTERNAL_BADGES` | bool | `0` | 是否渲染 6 个第三方徽章图片（默认关 → 首页无第三方请求） | 同上 |
| `JT_ENABLE_REMOTE_LOAD` | bool | `0` | 是否启用"从 URL 加载 JSON"（默认关 → 离线可用） | 同上 |
| `JT_ENABLE_CONTACT_FORM` | bool | `0` | 是否启用联系表单（默认关 → 不向 web3forms 提交） | 同上 |
| `JT_BASE_URL` | string | 空 → 用 `window.location.origin` | 覆盖 canonical / hreflang 基址 | `^https?://[A-Za-z0-9.\-]+(:[0-9]{1,5})?/?$`，否则忽略 |

**不被接受的运行期配置**（明确写进文档）：统计 ID、站长验证 token、任意第三方脚本地址、任何形式的 base path 重写 —— 均需重新构建。

### 5.3 安全边界

- 入口脚本**只**读取上表 6 个变量，其余 env 一律忽略，不写入任何文件。
- 所有值先做字符白名单校验，非法值丢弃 + 输出一行 warning 到 stderr（不回显原始值）。
- 生成的 JSON **不含**任何 env 名称以外的信息，不读取文件、不执行子命令（除 `mkdir -p`）。

---

## 6. 路由、分享与索引

- **直接访问/刷新**：`/`、`/zh`、`/tools`、`/tools/{category}`、`/tools/{category}/{slug}`、`/blog`、`/blog/{slug}`、`/embed/json`、`/about` 等均由 `$uri.html` 命中；`/llms.txt`、`/robots.txt`、`/sitemap_index.xml`（自托管关闭 sitemap，见 D9）按文件命中。
- **404**：HTML 路由缺失 → `404.html` + **404 状态码**；`/_nuxt/*` 缺失 → 纯文本 404（不返回 HTML）。
- **SPA 回落**：不使用 `index.html` 通配回落（避免掩盖资源 404）。
- **分享**：保持 `#share=` hash 方案，origin 取 `window.location.origin`（现状已符合）；打开官网只由用户主动点击链接触发，链接中不含 JSON。
- **索引**：默认 `Disallow: /` + `noindex`；文档明确"noindex 不是认证或保密措施"。
- **已知限制（写进文档）**：未重新构建时，`/zh` hreflang 与 OG 图绝对地址指向构建期 `SITE_URL`；`JT_BASE_URL` 只在客户端 patch canonical/hreflang，对不执行 JS 的爬虫无效。

---

## 7. 发布与供应链

- 注册表：`ghcr.io/kbmjj123/jsontoolbox`（**待确认**）
- 触发：`release: published` + `workflow_dispatch`（手动输入 tag）
- 平台：`linux/amd64`、`linux/arm64`（D2：仅 runtime 走目标架构）
- 标签：`<tag>`、`sha-<短 sha>`、`latest`（仅 release 时打 latest）
- 元信息：OCI labels（`source` / `revision` / `version` / `licenses=MIT` / `created`）；`--provenance` 由 buildx 生成
- 最小权限：`permissions: contents: read, packages: write`；`GITHUB_TOKEN` 不回显；不在日志打印任何 secret
- 基础镜像：固定小版本 tag（`node:22.16-alpine` / `nginx:1.27-alpine`），并记录"基础镜像更新与漏洞修复流程"（ renovate/Dependabot 或月度人工核对 → 重新构建 → 冒烟 → 打新 patch tag）
- **不**做 cosign 签名、不做 SBOM 附加（需维护者另行确认）

---

## 8. 文件清单（最小变更）

**新增**
```
docker/Dockerfile
docker/nginx.conf
docker/entrypoint.sh
.dockerignore
compose.yml
scripts/smoke-selfhost.mjs
tests/deploy-flags.test.ts
tests/runtime-config.test.ts
tests/nginx-conf.test.ts
docs/self-hosting/docker.zh-CN.md
docs/self-hosting/docker.en.md
.github/workflows/docker.yml
```

**修改**
```
nuxt.config.ts                         自托管分支（robots/sitemap/ogImage/icon）+ runtimeConfig 扩字段
app/composables/useDeployFlags.ts      新增：标志类型 + 默认值 + 合并逻辑（纯函数）
app/plugins/deploy-flags.client.ts     新增：仅 selfHosted 时拉取 runtime-config.json + canonical patch
app/app.vue                            自托管时输出 noindex meta
app/components/app/Footer.vue          按 showExternalBadges / showBranding 门控
app/components/ContactForm.vue         按 enableContactForm 门控
app/components/tool/LoadUrlModal.vue   按 enableRemoteLoad 门控
app/pages/embed/index.vue              iframe 基址优先用当前 origin
app/pages/embed/json.vue               同上
package.json                           增加 test 脚本 + vitest devDep
README.md                              自托管章节（Docker）+ 链接到部署指南
```

**不改动**：`nitro.preset`、i18n 策略、路由结构、`packages/json-editor`、`server/*`。

---

## 9. 测试与验收

### 9.1 单元测试（vitest，无需 Docker，AI 可写/跑）
- `deploy-flags`：官方默认值、自托管默认值、非法 JSON 回退、超时回退、白名单合并
- `runtime-config`：6 个变量的合法/非法取值、非法字符被拒、`JT_BASE_URL` 正则、未知 env 被忽略（通过 spawn `sh docker/entrypoint.sh` 读取产物 JSON）
- `nginx-conf`：静态断言（8080、无 `user` 指令、`try_files` 顺序、资源 location 的 `=404` 与纯文本 404、`/runtime-config.json` 的 `no-store` 与 `alias`）

### 9.2 冒烟（需 Docker，由开发者执行）
`node scripts/smoke-selfhost.mjs --base http://127.0.0.1:8080`，断言：
1. `/`、`/zh`、`/tools/format/json-editor` 返回 200 且 content-type 为 HTML
2. `/this-page-does-not-exist` 返回 **404**
3. `/_nuxt/` 下存在的 JS/CSS 返回 200 且 content-type 正确
4. `/_nuxt/definitely-missing.js` 返回 **404 且非 HTML**
5. Worker chunk（`recordStream.worker-*.js`）返回 200 且 `content-type: application/javascript`
6. `/runtime-config.json` 返回 200 + `Cache-Control: no-store`
7. `/robots.txt` 含 `Disallow: /`
8. `/llms.txt`、`/zh/llms.txt`（如存在）返回 200

### 9.3 人工验收（对应需求验收矩阵 1–7）
断网（阻断容器/宿主外网）后：格式化/校验/树形查看/文件导入导出可用；用浏览器网络面板记录例外（默认关闭徽章与远端加载后，预期**零第三方请求**；图标在启用 D10 后本地化）。**未执行的项标注"未验证"。**

---

## 10. 风险与阻塞项（需维护者确认）

| ID | 事项 | 类型 | 处理 |
|---|---|---|---|
| B1 | `README.md:186-232` 要求保留品牌/反链并提供白标授权，与需求"品牌展示可关闭"冲突 | **阻塞** | 实施按需求（可关闭）；README 授权条款**未经确认不修改**，交付时列入变更摘要 |
| B2 | 镜像名 `ghcr.io/kbmjj123/jsontoolbox` 可用性 | **阻塞** | 发布前检查；未确认前工作流用变量 `IMAGE_NAME`，默认建议值 |
| B3 | 是否允许新增 GHCR 发布工作流 / 打 GitHub Release | **阻塞**（约束 #6） | 本次只交付工作流文件与操作说明，**不触发发布** |
| B4 | 根新增 `vitest` devDep 与 `pnpm test` 脚本 | 需确认 | 版本与 `packages/json-editor` 对齐（^2.1.8） |
| R1 | `icon.clientBundle.scan` 可能触发 sizeLimit 或"图标未在本地集合"导致构建失败 | 风险 | 仅自托管分支启用；`sizeLimitKb` 放宽；需本地 `pnpm build` 验证 |
| R2 | `--read-only --tmpfs /tmp` 下 nginx 是否完全可用 | 风险 | 文档标注"待验证"，先提供不带 `--read-only` 的示例 |
| R3 | arm64 镜像未经真机验证 | 风险 | 未验证前**不发布 arm64 支持声明** |
| R4 | `ContactForm.formKey` 未声明（既有缺陷） | 记录 | 不在本次修复；自托管默认关闭该表单 |

---

## 11. 未包含（YAGNI）

- 自动安装 Docker、自动配置域名/HTTPS、反向代理与公网防护
- 账号、数据库、管理后台、多租户、自动升级服务、许可证服务器
- 容器内持久化（浏览器 localStorage 不等于容器持久化，仅在文档说明）
- 镜像签名 / SBOM 发布 / 第三方市场提交
- 把自托管能力反向改造成 npm 包或 Web Component（属 02/06 号需求）
