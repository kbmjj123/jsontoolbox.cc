# Docker 自托管发布 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让已安装 Docker 的用户拉取公开预构建镜像即可启动一个 JsonToolBox 实例：核心 JSON 处理仍在浏览器完成，默认不向第三方发起请求、默认不被索引，且官网（Cloudflare Pages 静态构建）的输出逐字不变。

**Architecture:** 复用现有 `nitro.preset: "static"` 产物（已核实 `.output/` 只有 `public/` + `nitro.json`，无运行时服务端）。镜像为两阶段：`FROM --platform=$BUILDPLATFORM node:22-alpine` 构建 → `nginx:1.27-alpine` 以非 root（`USER nginx`）在 8080 提供静态文件。配置分层：**构建期** `NUXT_PUBLIC_SELF_HOSTED=1` 打开自托管分支（noindex / 关 sitemap / 关 ogImage / 图标本地化）；**运行期**由 `docker/entrypoint.sh` 按 6 个 `JT_*` 白名单变量生成 `/runtime-config.json`，前端 `app/plugins/deploy-flags.ts` 仅在自托管时拉取并合并。

**Tech Stack:** Docker BuildKit（`--platform=$BUILDPLATFORM`）、nginx 1.27-alpine、POSIX shell、Nuxt 4 / Vue 3 / TypeScript、vitest `^2.1.8`（与 `packages/json-editor` 同版本）、Node 22 内置 `fetch`（冒烟脚本）。

**Spec:** `docs/superpowers/specs/2026-10-28-docker-self-hosting-design.md`（§2 为已执行的架构审计记录，先读）

## Global Constraints

（以下每条对所有任务生效）

- **不许改 `nitro.preset`、`ssr`、i18n 策略、路由结构、`packages/json-editor`、`server/*`**
- **官网零影响门禁**：所有新逻辑由 `NUXT_PUBLIC_SELF_HOSTED=1` 控制；该变量未设置时，代码路径与今天逐字一致，**包括客户端不得发起 `/runtime-config.json` 请求**
- 运行期配置**只有** 6 个白名单变量：`JT_SITE_NAME`、`JT_SHOW_BRANDING`、`JT_SHOW_EXTERNAL_BADGES`、`JT_ENABLE_REMOTE_LOAD`、`JT_ENABLE_CONTACT_FORM`、`JT_BASE_URL`；其余 env 一律忽略，绝不写入产物
- 运行期**不提供**：统计 ID、站长验证 token、任意第三方脚本地址、索引开关（索引只能构建期决定）
- 自托管默认：`robots.txt` = `Disallow: /`、无 sitemap、页面 `noindex`、无徽章外链、无远端加载、无联系表单、无统计脚本
- 缺失的 JS/CSS/Worker **必须返回 404 且不能是 HTML**
- JSON 内容不得上传、不得写入日志；错误日志不得包含用户原文
- 品牌展示可关闭，**关闭后不得影响任何工具功能**（需求约束 #5）
- 镜像名默认建议 `ghcr.io/kbmjj123/jsontoolbox`（**待确认**，工作流中用变量）
- **AI 不执行** `pnpm build` / `nuxt build` / `docker build` / `docker compose up` / 冒烟脚本；这些由开发者在本地执行。AI 只写代码、配置、文档，以及运行**不需要构建产物的** vitest 单测与静态检查（`pnpm typecheck` / `eslint`）
- 未实际执行的测试一律标注"未验证"，不得勾选通过

## File Structure

```
docker/
  Dockerfile            多阶段构建（builder 固定 BUILDPLATFORM）
  nginx.conf            静态服务：try_files + 资源 404 不回落 HTML
  entrypoint.sh         写 runtime-config.json 后 exec nginx
  runtime-config.sh     纯函数：白名单 env → JSON（可被测试 source）
.dockerignore           排除 data/ docs/ libs/ reports/ .git/ .env* 产物
compose.yml             本机示例，绑定 127.0.0.1:8080
scripts/smoke-selfhost.mjs   对运行中容器的 HTTP 冒烟（开发者执行）
tests/
  deploy-flags.test.ts      标志解析/合并/回退
  runtime-config.test.ts    spawn sh 校验白名单与校验规则
  nginx-conf.test.ts        静态断言 nginx.conf 关键指令
app/
  composables/useDeployFlags.ts    类型 + 默认值 + 纯函数解析
  plugins/deploy-flags.ts          通用插件：仅客户端且自托管时拉取配置
  app.vue                          canonical 用运行期 baseUrl；自托管输出 noindex
  components/app/Footer.vue        徽章/品牌门控 + 站名
  components/ContactForm.vue       门控
  components/tool/LoadUrlModal.vue 门控
  pages/embed/index.vue            iframe 基址取当前 origin
  pages/embed/json.vue             同上
nuxt.config.ts                     自托管分支 + runtimeConfig 扩字段
package.json                       test 脚本 + vitest devDep
.github/workflows/docker.yml       多架构发布（**不触发发布**）
docs/self-hosting/docker.zh-CN.md  中文部署指南
docs/self-hosting/docker.en.md     English deployment guide
README.md                          自托管（Docker）章节
```

---

### Task 1: 自托管构建开关（nuxt.config.ts）

**Files:**
- Modify: `nuxt.config.ts`
- Modify: `package.json`（test 脚本 + vitest devDep）

- [ ] **Step 1: 在 `nuxt.config.ts` 顶部加入开关常量**

在 `import { fileURLToPath } from 'url'` 之后、`export default defineNuxtConfig({` 之前插入：

```ts
// Self-hosted (Docker) build: NUXT_PUBLIC_SELF_HOSTED=1.
// When unset, every value below resolves EXACTLY as before — the hosted site
// must not change by a single byte.
const selfHosted = process.env.NUXT_PUBLIC_SELF_HOSTED === '1'
const envSiteUrl = process.env.NUXT_PUBLIC_SITE_URL
const envSiteName = process.env.NUXT_PUBLIC_SITE_NAME || 'JSON Toolbox'
// A self-hosted instance has no public URL at build time; use a neutral
// placeholder the runtime config can override (JT_BASE_URL / window.origin).
const selfHostedSiteUrl = envSiteUrl || 'http://localhost:8080'
const resolveSiteUrl = selfHosted ? selfHostedSiteUrl : envSiteUrl || 'https://jsontoolbox.cc'
```

- [ ] **Step 2: `site.url`、`i18n.baseUrl`、`runtimeConfig.public` 按开关取值**

```ts
  site: {
    enabled: true,
    url: resolveSiteUrl,
    defaultLocale: 'en',
    trailingSlash: false,
  },
```

```ts
  i18n: {
    baseUrl: selfHosted ? selfHostedSiteUrl : envSiteUrl,
```

```ts
  runtimeConfig: {
    public: {
      selfHosted,
      siteName: envSiteName,
      baseUrl: selfHosted ? selfHostedSiteUrl : envSiteUrl,
      umamiAnalyticsId: '',
      siteVerification: {
        google: '',
        bing: '',
        baidu: '',
        yandex: '',
      },
    }
  },
```

> `site.url` 官方分支保持 `envSiteUrl || 'https://jsontoolbox.cc'`，与现状逐字一致；`i18n.baseUrl` / `runtimeConfig.public.baseUrl` 官方分支保持原样（未设 env 时为 `undefined`），**不要**顺手补默认值，那会改变官网产物。

- [ ] **Step 3: titleTemplate 支持构建期站名**

```ts
  app: {
    head: {
      titleTemplate: `%s | ${envSiteName}`,
    },
  },
```

- [ ] **Step 4: 索引策略（robots / sitemap）**

```ts
  sitemap: selfHosted
    ? { enabled: false }
    : {
        autoLastmod: true,
        discoverImages: false,
        exclude: ['/404'],
        sources: [
          '/api/sitemap-urls',
          '/api/sitemap-blog'
        ],
      },
  robots: {
    groups: [
      selfHosted
        ? { userAgent: '*', disallow: ['/'] }
        : { userAgent: '*', allow: '*' },
    ]
  },
```

- [ ] **Step 5: 关掉 OG 图与图标远端回源（仅自托管）**

```ts
  ogImage: selfHosted
    ? { enabled: false }
    : {
        enabled: true,
        fonts: [
          'Noto+Sans+SC:400',
          'Noto+Sans+SC:700',
        ]
      },
```

```ts
  icon: {
    customCollections: [
      {
        prefix: 'icons',
        dir: './app/assets/icons',
      },
    ],
    // Self-hosted instances may run without internet. Default Nuxt Icon falls
    // back to https://api.iconify.design at runtime (there is no /api/_nuxt_icon
    // in a static build). Bundle the icons at build time instead.
    ...(selfHosted
      ? { clientBundle: { scan: true, includeCustomCollections: true, sizeLimitKb: 1024 } }
      : {}),
  },
```

> 风险 R1：`clientBundle.scan` 若遇到本地集合缺失的图标或超出体积上限会让构建失败。只影响自托管分支；`sizeLimitKb: 1024` 留足余量。**需开发者本地 `pnpm build` 验证**（AI 不跑构建）。

- [ ] **Step 6: package.json 增加测试入口**

在 `scripts` 中加入（放在 `"build:pkg"` 之后）：

```json
    "test": "vitest run",
```

`devDependencies` 加入 `"vitest": "^2.1.8"`（与 `packages/json-editor/package.json:96` 同版本）。

- [ ] **Step 7: 静态检查**

Run: `cd /Users/kbmjj123/Desktop/fullstack/jsontoolbox.cc && npx eslint nuxt.config.ts`
Expected: 无新增错误。（不执行 `nuxt build` / `nuxt typecheck`，由开发者本地验证。）

- [ ] **Step 8: Commit**

```bash
git add nuxt.config.ts package.json
git commit -m "feat(self-host): 自托管构建开关与索引/OG/图标分支"
```

---

### Task 2: 运行期标志基础设施（composable + plugin + 单测）

**Files:**
- Create: `app/composables/useDeployFlags.ts`
- Create: `app/plugins/deploy-flags.ts`
- Create: `tests/deploy-flags.test.ts`
- Create: `vitest.config.ts`（根）

- [ ] **Step 1: 写失败测试**

```ts
// tests/deploy-flags.test.ts
import { describe, it, expect } from 'vitest'
import {
  SELF_HOSTED_DEFAULTS,
  HOSTED_DEFAULTS,
  buildDefaults,
  mergeFlags,
  normalizeRuntimeConfig,
  resolveCanonicalBase,
} from '../app/composables/useDeployFlags'

describe('buildDefaults', () => {
  it('官方构建：全部来源展示开启，不发运行期请求', () => {
    const f = buildDefaults({ selfHosted: false, siteName: 'JSON Toolbox', baseUrl: 'https://jsontoolbox.cc' })
    expect(f).toEqual({
      selfHosted: false,
      siteName: 'JSON Toolbox',
      branding: true,
      externalBadges: true,
      remoteLoad: true,
      contactForm: true,
      baseUrl: 'https://jsontoolbox.cc',
      runtimeLoaded: false,
    })
  })

  it('自托管构建：第三方请求相关能力默认关闭', () => {
    const f = buildDefaults({ selfHosted: true, siteName: 'JSON Toolbox', baseUrl: 'http://localhost:8080' })
    expect(f.selfHosted).toBe(true)
    expect(f.branding).toBe(true)       // 来源展示默认保留
    expect(f.externalBadges).toBe(false)
    expect(f.remoteLoad).toBe(false)
    expect(f.contactForm).toBe(false)
  })
})

describe('normalizeRuntimeConfig', () => {
  it('未知字段与非布尔值被丢弃', () => {
    const out = normalizeRuntimeConfig({
      siteName: 'Acme JSON',
      branding: 'yes',
      externalBadges: 'nope',
      remoteLoad: true,
      contactForm: 0,
      analyticsId: 'x',        // 不在白名单
      __proto__: { polluted: 1 } as never,
    })
    expect(out.siteName).toBe('Acme JSON')
    expect(out.branding).toBe(true)
    expect(out.remoteLoad).toBe(true)
    expect(out.contactForm).toBe(false)
    expect(out.externalBadges).toBeUndefined()
    expect((out as Record<string, unknown>).analyticsId).toBeUndefined()
  })

  it('baseUrl 只接受 http(s) 主机[:端口]，非法值忽略', () => {
    expect(normalizeRuntimeConfig({ baseUrl: 'https://json.example.com:8443' }).baseUrl)
      .toBe('https://json.example.com:8443')
    expect(normalizeRuntimeConfig({ baseUrl: 'javascript:alert(1)' }).baseUrl).toBeUndefined()
    expect(normalizeRuntimeConfig({ baseUrl: 'http://x/evil?a=1' }).baseUrl).toBeUndefined()
  })

  it('非对象输入返回空对象', () => {
    expect(normalizeRuntimeConfig(null)).toEqual({})
    expect(normalizeRuntimeConfig('nope')).toEqual({})
  })
})

describe('mergeFlags', () => {
  it('运行期值覆盖构建期默认值，未被覆盖项保留', () => {
    const base = buildDefaults({ selfHosted: true, siteName: 'JSON Toolbox', baseUrl: '' })
    const merged = mergeFlags(base, { branding: false, externalBadges: true })
    expect(merged.branding).toBe(false)
    expect(merged.externalBadges).toBe(true)
    expect(merged.remoteLoad).toBe(false)
    expect(merged.runtimeLoaded).toBe(true)
  })

  it('未提供运行期配置时 runtimeLoaded 为 false', () => {
    const base = buildDefaults({ selfHosted: true, siteName: 'JSON Toolbox', baseUrl: '' })
    expect(mergeFlags(base, {}).runtimeLoaded).toBe(false)
  })
})

describe('resolveCanonicalBase', () => {
  it('优先运行期 baseUrl，其次当前 origin，最后构建期地址', () => {
    expect(resolveCanonicalBase('https://intra.example.com')).toBe('https://intra.example.com')
    expect(resolveCanonicalBase('')).toBe('')
  })
})
```

- [ ] **Step 2: 创建根 vitest.config.ts**

```ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
})
```

- [ ] **Step 3: 运行测试确认失败**

Run: `cd /Users/kbmjj123/Desktop/fullstack/jsontoolbox.cc && pnpm test`
Expected: FAIL（模块 `../app/composables/useDeployFlags` 不存在）。

- [ ] **Step 4: 实现 `app/composables/useDeployFlags.ts`**

```ts
/**
 * Deployment flags — hosted site vs. self-hosted (Docker) instance.
 *
 * Build-time values come from `runtimeConfig.public` (baked into the static
 * output). On a self-hosted instance the container can additionally expose a
 * whitelisted `/runtime-config.json`; when present it overrides the UI-only
 * flags. Nothing here may affect tool behaviour.
 */

export interface DeployFlags {
  /** true = built with NUXT_PUBLIC_SELF_HOSTED=1 */
  selfHosted: boolean
  siteName: string
  /** Show "source / powered by" links. Turning it off must not affect tools. */
  branding: boolean
  /** Third-party badge images in the footer (external requests). */
  externalBadges: boolean
  /** "Load JSON from URL" (external request, user-triggered). */
  remoteLoad: boolean
  /** Contact form (posts to a third-party endpoint). */
  contactForm: boolean
  /** Canonical base; empty = use window.location.origin on the client. */
  baseUrl: string
  /** true once /runtime-config.json has been applied (self-hosted only). */
  runtimeLoaded: boolean
}

export type RuntimeConfig = Partial<Omit<DeployFlags, 'selfHosted' | 'runtimeLoaded'>>

/** Self-hosted defaults: no third-party requests, attribution kept. */
export const SELF_HOSTED_DEFAULTS = {
  siteName: 'JSON Toolbox',
  branding: true,
  externalBadges: false,
  remoteLoad: false,
  contactForm: false,
  baseUrl: '',
} as const

/** Hosted site: unchanged behaviour. */
export const HOSTED_DEFAULTS = {
  siteName: 'JSON Toolbox',
  branding: true,
  externalBadges: true,
  remoteLoad: true,
  contactForm: true,
  baseUrl: '',
} as const

export interface BuildInput {
  selfHosted?: boolean
  siteName?: string
  baseUrl?: string
}

export function buildDefaults(input: BuildInput = {}): DeployFlags {
  const preset = input.selfHosted ? SELF_HOSTED_DEFAULTS : HOSTED_DEFAULTS
  return {
    selfHosted: input.selfHosted === true,
    siteName: input.siteName || 'JSON Toolbox',
    branding: preset.branding,
    externalBadges: preset.externalBadges,
    remoteLoad: preset.remoteLoad,
    contactForm: preset.contactForm,
    baseUrl: input.selfHosted ? '' : input.baseUrl || '',
    runtimeLoaded: false,
  }
}

const BOOLEAN_TRUE = new Set(['1', 'true', 'yes', 'on'])
const BOOLEAN_FALSE = new Set(['0', 'false', 'no', 'off'])
const BASE_URL_RE = /^https?:\/\/[A-Za-z0-9.-]+(:[0-9]{1,5})?\/?$/

function asBool(value: unknown): boolean | undefined {
  if (typeof value === 'boolean') return value
  if (typeof value !== 'string') return undefined
  const v = value.trim().toLowerCase()
  if (BOOLEAN_TRUE.has(v)) return true
  if (BOOLEAN_FALSE.has(v)) return false
  return undefined
}

function asSiteName(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const v = value.trim()
  // Keep generated HTML/JSON safe: no markup, no control characters.
  if (!v || v.length > 60 || !/^[A-Za-z0-9._\- ]+$/.test(v)) return undefined
  return v
}

function asBaseUrl(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const v = value.trim()
  return BASE_URL_RE.test(v) ? v.replace(/\/$/, '') : undefined
}

/** Whitelist filter: unknown keys are dropped, invalid values are dropped. */
export function normalizeRuntimeConfig(raw: unknown): RuntimeConfig {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {}
  const src = raw as Record<string, unknown>
  const out: RuntimeConfig = {}

  const siteName = asSiteName(src.siteName)
  if (siteName !== undefined) out.siteName = siteName

  for (const key of ['branding', 'externalBadges', 'remoteLoad', 'contactForm'] as const) {
    const v = asBool(src[key])
    if (v !== undefined) out[key] = v
  }

  const baseUrl = asBaseUrl(src.baseUrl)
  if (baseUrl !== undefined) out.baseUrl = baseUrl

  return out
}

export function mergeFlags(base: DeployFlags, runtime: RuntimeConfig): DeployFlags {
  const hasRuntime = Object.keys(runtime).length > 0
  return {
    ...base,
    ...runtime,
    selfHosted: base.selfHosted,
    runtimeLoaded: base.runtimeLoaded || hasRuntime,
  }
}

/**
 * Canonical base. On a self-hosted instance with no configured base URL the
 * caller should fall back to `window.location.origin` (see `useDeployFlags`).
 * Returns '' when the caller must decide on the client.
 */
export function resolveCanonicalBase(baseUrl: string): string {
  return baseUrl || ''
}

export function useDeployFlags() {
  return useState<DeployFlags>('deploy-flags', () => buildDefaults())
}
```

> `useState` 来自 Nuxt，测试只覆盖纯函数部分，不需要 Nuxt 运行时。

- [ ] **Step 5: 实现 `app/plugins/deploy-flags.ts`**

```ts
/**
 * Loads the container-provided /runtime-config.json on self-hosted instances.
 *
 * The hosted site never issues this request (guarded by `selfHosted`), so it
 * is byte-for-byte unchanged. Failures are silent: build-time defaults stay.
 */
export default defineNuxtPlugin(async () => {
  const config = useRuntimeConfig().public as {
    selfHosted?: boolean
    siteName?: string
    baseUrl?: string
  }

  const flags = useState<DeployFlags>(
    'deploy-flags',
    () => buildDefaults({
      selfHosted: config.selfHosted,
      siteName: config.siteName,
      baseUrl: config.baseUrl,
    }),
  )

  if (!import.meta.client || !config.selfHosted) return

  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 2000)
    const res = await fetch('/runtime-config.json', {
      cache: 'no-store',
      signal: controller.signal,
    })
    clearTimeout(timer)
    // A non-JSON response (or 404) simply means "use defaults".
    if (!res.ok) return
    const raw: unknown = await res.json()
    flags.value = mergeFlags(flags.value, normalizeRuntimeConfig(raw))
  } catch {
    // Offline / blocked / malformed — build-time defaults remain in effect.
  }
})
```

在文件顶部补 import：

```ts
import {
  buildDefaults,
  mergeFlags,
  normalizeRuntimeConfig,
  type DeployFlags,
} from '~/composables/useDeployFlags'
```

- [ ] **Step 6: 运行测试确认通过**

Run: `cd /Users/kbmjj123/Desktop/fullstack/jsontoolbox.cc && pnpm test`
Expected: PASS。

- [ ] **Step 7: Commit**

```bash
git add app/composables/useDeployFlags.ts app/plugins/deploy-flags.ts tests/deploy-flags.test.ts vitest.config.ts
git commit -m "feat(self-host): 部署标志 composable 与运行期配置插件"
```

---

### Task 3: 入口脚本与运行期配置白名单

**Files:**
- Create: `docker/runtime-config.sh`
- Create: `docker/entrypoint.sh`
- Create: `tests/runtime-config.test.ts`

- [ ] **Step 1: 写失败测试**

```ts
// tests/runtime-config.test.ts
import { describe, it, expect } from 'vitest'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname

/** Runs the generator in a subshell and returns the parsed JSON. */
function generate(env: Record<string, string>): Record<string, unknown> {
  const dir = mkdtempSync(join(tmpdir(), 'jt-rc-'))
  const out = join(dir, 'runtime-config.json')
  execFileSync('sh', ['-c', `. ${join(ROOT, 'docker/runtime-config.sh')} && jt_write_runtime_config`], {
    env: { ...process.env, ...env, JT_RUNTIME_DIR: dir },
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  if (!existsSync(out)) throw new Error('runtime-config.json was not written')
  return JSON.parse(readFileSync(out, 'utf8'))
}

describe('runtime-config.sh', () => {
  it('未设置任何变量时输出自托管默认值', () => {
    const cfg = generate({ JT_SITE_NAME: '', JT_SHOW_BRANDING: '', JT_SHOW_EXTERNAL_BADGES: '', JT_ENABLE_REMOTE_LOAD: '', JT_ENABLE_CONTACT_FORM: '', JT_BASE_URL: '' })
    expect(cfg).toEqual({
      siteName: 'JSON Toolbox',
      branding: true,
      externalBadges: false,
      remoteLoad: false,
      contactForm: false,
      baseUrl: '',
    })
  })

  it('接受合法布尔写法并归一化', () => {
    const cfg = generate({ JT_SHOW_BRANDING: '0', JT_SHOW_EXTERNAL_BADGES: 'true', JT_ENABLE_REMOTE_LOAD: 'YES', JT_ENABLE_CONTACT_FORM: 'off' })
    expect(cfg.branding).toBe(false)
    expect(cfg.externalBadges).toBe(true)
    expect(cfg.remoteLoad).toBe(true)
    expect(cfg.contactForm).toBe(false)
  })

  it('非法布尔值回退默认', () => {
    const cfg = generate({ JT_SHOW_BRANDING: 'maybe' })
    expect(cfg.branding).toBe(true)
  })

  it('站名拒绝引号与尖括号等危险字符', () => {
    expect(generate({ JT_SITE_NAME: 'Acme "JSON"' }).siteName).toBe('JSON Toolbox')
    expect(generate({ JT_SITE_NAME: '<script>' }).siteName).toBe('JSON Toolbox')
    expect(generate({ JT_SITE_NAME: 'Team JSON Tools' }).siteName).toBe('Team JSON Tools')
  })

  it('baseUrl 只接受 http(s) 主机[:端口]', () => {
    expect(generate({ JT_BASE_URL: 'https://json.internal:8080' }).baseUrl).toBe('https://json.internal:8080')
    expect(generate({ JT_BASE_URL: 'ftp://x' }).baseUrl).toBe('')
    expect(generate({ JT_BASE_URL: 'http://a/evil?b=1' }).baseUrl).toBe('')
  })

  it('白名单外的环境变量绝不进入产物', () => {
    const cfg = generate({
      SECRET_TOKEN: 'super-secret',
      NUXT_PUBLIC_UMAMI_ANALYTICS_ID: 'leak-me',
      JT_UNKNOWN: 'x',
    })
    const serialized = JSON.stringify(cfg)
    expect(serialized).not.toContain('super-secret')
    expect(serialized).not.toContain('leak-me')
    expect(Object.keys(cfg).sort()).toEqual(['baseUrl', 'branding', 'contactForm', 'externalBadges', 'remoteLoad', 'siteName'])
  })

  it('输出是合法 JSON（含边界字符也不破坏结构）', () => {
    expect(() => generate({ JT_SITE_NAME: 'A "B" \\ C' })).not.toThrow()
  })
})
```

- [ ] **Step 2: 运行测试确认失败**

Run: `pnpm test`
Expected: FAIL（`docker/runtime-config.sh` 不存在）。

- [ ] **Step 3: 创建 `docker/runtime-config.sh`**

```sh
#!/bin/sh
# Whitelisted runtime configuration for self-hosted containers.
#
# Static files cannot read container environment variables, so the entrypoint
# materialises a tiny JSON file from an explicit allowlist. Anything not listed
# here is ignored, and every value is validated before it is written — an
# invalid value falls back to the default instead of breaking the JSON.
#
# Sourced by docker/entrypoint.sh; also sourced directly by tests.

JT_RUNTIME_DIR="${JT_RUNTIME_DIR:-/tmp/jt-runtime}"

# --- validation helpers -------------------------------------------------------

_jt_bool() {
  # $1 raw value, $2 default (true|false)
  case "$(printf '%s' "$1" | tr '[:upper:]' '[:lower:]')" in
    1|true|yes|on) echo 'true' ;;
    0|false|no|off) echo 'false' ;;
    *) echo "$2" ;;
  esac
}

_jt_site_name() {
  # $1 raw value, $2 default. Reject anything outside a conservative charset so
  # the generated JSON can never be broken or carry markup.
  case "$1" in
    ''|*[!A-Za-z0-9._\ -]*) echo "$2" ;;
    *) echo "$1" ;;
  esac
}

_jt_base_url() {
  # $1 raw value. Only http(s) host[:port], optional trailing slash.
  case "$1" in
    http://[A-Za-z0-9.-]*|https://[A-Za-z0-9.-]*)
      case "$1" in
        *[!A-Za-z0-9.:/-]*) echo '' ;;
        *) echo "$1" ;;
      esac
      ;;
    *) echo '' ;;
  esac
}

# --- writer ------------------------------------------------------------------

jt_write_runtime_config() {
  mkdir -p "$JT_RUNTIME_DIR"
  _out="$JT_RUNTIME_DIR/runtime-config.json"

  _site_name="$(_jt_site_name "${JT_SITE_NAME:-}" 'JSON Toolbox')"
  _branding="$(_jt_bool "${JT_SHOW_BRANDING:-}" true)"
  _badges="$(_jt_bool "${JT_SHOW_EXTERNAL_BADGES:-}" false)"
  _remote="$(_jt_bool "${JT_ENABLE_REMOTE_LOAD:-}" false)"
  _contact="$(_jt_bool "${JT_ENABLE_CONTACT_FORM:-}" false)"
  _base_url="$(_jt_base_url "${JT_BASE_URL:-}")"

  # Length guard: a very long name is a mistake, not a configuration.
  if [ "${#_site_name}" -gt 60 ]; then
    _site_name='JSON Toolbox'
    echo "JT_SITE_NAME too long, using default" >&2
  fi

  printf '%s' "{
  \"siteName\": \"$_site_name\",
  \"branding\": $_branding,
  \"externalBadges\": $_badges,
  \"remoteLoad\": $_remote,
  \"contactForm\": $_contact,
  \"baseUrl\": \"$_base_url\"
}
" > "$_out"

  # nginx worker runs as an unprivileged user; keep the file world-readable.
  chmod 0644 "$_out"
}
```

- [ ] **Step 4: 创建 `docker/entrypoint.sh`**

```sh
#!/bin/sh
set -eu

. /usr/local/bin/runtime-config.sh

jt_write_runtime_config

exec nginx -c /etc/nginx/nginx.conf -g 'daemon off;'
```

- [ ] **Step 5: 运行测试确认通过**

Run: `pnpm test`
Expected: PASS（含"白名单外的环境变量绝不进入产物"）。

- [ ] **Step 6: Commit**

```bash
git add docker/runtime-config.sh docker/entrypoint.sh tests/runtime-config.test.ts
git commit -m "feat(self-host): 运行期配置白名单生成脚本与单测"
```

---

### Task 4: 静态服务器配置（nginx）

**Files:**
- Create: `docker/nginx.conf`
- Create: `tests/nginx-conf.test.ts`

- [ ] **Step 1: 写失败测试（静态断言）**

```ts
// tests/nginx-conf.test.ts
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const conf = readFileSync(join(new URL('..', import.meta.url).pathname, 'docker/nginx.conf'), 'utf8')

describe('nginx.conf', () => {
  it('监听 8080（非特权端口，允许非 root 运行）', () => {
    expect(conf).toMatch(/listen\s+8080;/)
    expect(conf).not.toMatch(/listen\s+80;/)
  })

  it('不写 user 指令（容器以 USER nginx 启动，非 root 下该指令会被忽略并告警）', () => {
    expect(conf).not.toMatch(/^\s*user\s+/m)
  })

  it('HTML 路由按 $uri → $uri.html → $uri/index.html 解析，缺失返回 404', () => {
    expect(conf).toMatch(/try_files \$uri \$uri\.html \$uri\/index\.html =404;/)
  })

  it('缺失的静态资源返回 404 且不回落 HTML', () => {
    const assetBlock = conf.match(/location ~\* [^\n]*\.(?:js|mjs)[^\n]*\{[\s\S]*?\n\s*\}/)
    expect(assetBlock).toBeTruthy()
    expect(assetBlock![0]).toMatch(/try_files \$uri =404;/)
    expect(assetBlock![0]).toMatch(/error_page 404 = @plain404;/)
    expect(conf).toMatch(/@plain404[\s\S]*?return 404/)
  })

  it('HTML 404 保留 404 状态码', () => {
    expect(conf).toMatch(/error_page 404 \/404\.html;/)
  })

  it('Worker/JS 以 application/javascript 提供', () => {
    expect(conf).toMatch(/include\s+\/etc\/nginx\/mime\.types;/)
  })

  it('/runtime-config.json 走 /tmp 且禁用缓存', () => {
    const block = conf.match(/location = \/runtime-config\.json[\s\S]*?\n\s*\}/)
    expect(block).toBeTruthy()
    expect(block![0]).toMatch(/alias \/tmp\/jt-runtime\/runtime-config\.json;/)
    expect(block![0]).toMatch(/Cache-Control "no-store"/)
  })

  it('临时目录全部落在 /tmp（兼容只读根文件系统）', () => {
    for (const d of ['client_body_temp_path', 'proxy_temp_path', 'fastcgi_temp_path', 'uwsgi_temp_path', 'scgi_temp_path']) {
      expect(conf).toMatch(new RegExp(`${d}\\s+/tmp/`))
    }
    expect(conf).toMatch(/pid\s+\/tmp\//)
  })
})
```

- [ ] **Step 2: 运行测试确认失败**

Run: `pnpm test`
Expected: FAIL（`docker/nginx.conf` 不存在）。

- [ ] **Step 3: 创建 `docker/nginx.conf`**

```nginx
# Static server for the prerendered JsonToolBox build.
#
# Two rules matter more than anything else here:
#   1. HTML routes resolve to `<path>.html` (Nuxt prerender layout) and a
#      missing page must answer 404 — never a 200 HTML shell.
#   2. A missing JS/CSS/Worker chunk must answer 404 with a plain body. If it
#      answered with HTML, the browser would report a syntax error instead of a
#      404 and the real cause (a missing asset) would be invisible.

worker_processes auto;
daemon off;
pid /tmp/nginx.pid;
error_log /dev/stderr warn;

events {
  worker_connections 1024;
}

http {
  include       /etc/nginx/mime.types;
  default_type  application/octet-stream;
  access_log    /dev/stdout;

  # Everything writable lives under /tmp so `--read-only --tmpfs /tmp` works.
  client_body_temp_path /tmp/nginx/client_body;
  proxy_temp_path       /tmp/nginx/proxy;
  fastcgi_temp_path     /tmp/nginx/fastcgi;
  uwsgi_temp_path       /tmp/nginx/uwsgi;
  scgi_temp_path        /tmp/nginx/scgi;

  sendfile        on;
  tcp_nopush      on;
  keepalive_timeout 15;
  server_tokens   off;

  gzip on;
  gzip_vary on;
  gzip_min_length 1024;
  gzip_types text/plain text/css application/javascript application/json image/svg+xml application/xml;

  add_header X-Content-Type-Options "nosniff" always;
  add_header Referrer-Policy "no-referrer-when-downgrade" always;
  add_header X-Frame-Options "SAMEORIGIN" always;

  server {
    listen 8080;
    listen [::]:8080;
    server_name _;

    root /usr/share/nginx/html;
    index index.html;

    # Per-instance config, written by the entrypoint before nginx starts.
    # no-store: the value can change between deployments of the same tag.
    location = /runtime-config.json {
      default_type application/json;
      alias /tmp/jt-runtime/runtime-config.json;
      add_header Cache-Control "no-store" always;
    }

    location = /healthz {
      access_log off;
      default_type text/plain;
      return 200 "ok\n";
    }

    # Hashed build assets: immutable, and a miss is a 404 (never HTML).
    location ^~ /_nuxt/ {
      expires 1y;
      add_header Cache-Control "public, max-age=31536000, immutable" always;
      try_files $uri =404;
      error_page 404 = @plain404;
    }

    # Every other static asset: same rule — no HTML fallback.
    location ~* \.(?:js|mjs|css|json|map|txt|xml|webmanifest|ico|png|jpg|jpeg|gif|svg|webp|avif|woff2?|ttf|otf|wasm)$ {
      try_files $uri =404;
      error_page 404 = @plain404;
    }

    # Prerendered HTML: /about -> /about.html, /about/ -> /about/index.html
    location / {
      add_header Cache-Control "no-cache" always;
      try_files $uri $uri.html $uri/index.html =404;
      error_page 404 /404.html;
    }

    location = /404.html {
      internal;
      add_header Cache-Control "no-cache" always;
    }

    location @plain404 {
      internal;
      default_type text/plain;
      return 404 "Not Found\n";
    }
  }
}
```

- [ ] **Step 4: 运行测试确认通过**

Run: `pnpm test`
Expected: PASS。

- [ ] **Step 5: Commit**

```bash
git add docker/nginx.conf tests/nginx-conf.test.ts
git commit -m "feat(self-host): nginx 静态服务配置与 404 语义断言"
```

---

### Task 5: Dockerfile 与 .dockerignore

**Files:**
- Create: `docker/Dockerfile`
- Create: `.dockerignore`

- [ ] **Step 1: 创建 `docker/Dockerfile`**

```dockerfile
# syntax=docker/dockerfile:1.7
#
# The prerendered output is plain HTML/JS/CSS: it is CPU-architecture
# independent. So the expensive stage (pnpm install + prerender) always runs on
# the build machine's native platform, and only the nginx runtime is built per
# target platform. That keeps arm64 builds out of QEMU.

ARG NODE_IMAGE=node:22.16-alpine
ARG NGINX_IMAGE=nginx:1.27-alpine

# ── Stage 1: build the static site ──────────────────────────────────────────
FROM --platform=$BUILDPLATFORM ${NODE_IMAGE} AS builder
WORKDIR /app

ENV PNPM_HOME=/pnpm
ENV PATH=/pnpm:$PATH
RUN corepack enable && corepack prepare pnpm@10.25.0 --activate

# Manifests first so the dependency layer is cacheable.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.json ./
COPY packages ./packages
RUN --mount=type=cache,id=pnpm-selfhost,target=/pnpm/store \
    pnpm install --frozen-lockfile --ignore-scripts

COPY . .

# `@kbmjj123/json-editor` must be built before the site build (normally done by
# postinstall, which --ignore-scripts skips). `nuxt prepare` is part of the same
# postinstall; `nuxt build` prepares on its own.
RUN pnpm run build:pkg

# Self-hosted build flags. Override SITE_URL / SITE_NAME if the instance has a
# stable public address — otherwise canonical URLs fall back to the runtime
# origin (JT_BASE_URL / window.location.origin).
ARG SITE_URL=http://localhost:8080
ARG SITE_NAME=JSON Toolbox
ENV NUXT_PUBLIC_SELF_HOSTED=1 \
    NUXT_PUBLIC_SITE_URL=$SITE_URL \
    NUXT_PUBLIC_SITE_NAME=$SITE_NAME

RUN pnpm build

# ── Stage 2: serve ──────────────────────────────────────────────────────────
FROM ${NGINX_IMAGE} AS runtime

LABEL org.opencontainers.image.title="JsonToolBox" \
      org.opencontainers.image.description="Free, client-side JSON tools. Self-hosted build." \
      org.opencontainers.image.source="https://github.com/kbmjj123/jsontoolbox.cc" \
      org.opencontainers.image.url="https://jsontoolbox.cc" \
      org.opencontainers.image.licenses="MIT"

COPY docker/nginx.conf /etc/nginx/nginx.conf
COPY docker/entrypoint.sh docker/runtime-config.sh /usr/local/bin/
COPY --from=builder /app/.output/public /usr/share/nginx/html

RUN chmod 0755 /usr/local/bin/entrypoint.sh /usr/local/bin/runtime-config.sh \
    && mkdir -p /tmp/jt-runtime /tmp/nginx \
    && chown -R nginx:nginx /tmp/jt-runtime /tmp/nginx

# Runs unprivileged: nginx only calls setuid() when euid == 0, so with no
# `user` directive in nginx.conf master+workers stay as `nginx`.
USER nginx

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -q --spider http://127.0.0.1:8080/index.html || exit 1

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
```

- [ ] **Step 2: 创建 `.dockerignore`**

```
# Build outputs & caches
.output
.nuxt
.nitro
.data
.cache
dist
node_modules
**/node_modules

# VCS & local env
.git
.env
.env.*
!.env.example

# Never ship SEO/credential material or anything the build does not read
data
reports
docs
libs
scripts
.mcp.json
.playwright-mcp
.vscode
.idea
.DS_Store
*.log
tsconfig.tsbuildinfo

# Local-only leftovers
public/1.html
public/1.md
wait-to-upload
test_images
```

> `packages/` **必须**保留（workspace 依赖），`content/`、`app/`、`i18n/`、`public/`、`server/`、`adapter-content.ts`、`content.config.ts` 全部保留。

- [ ] **Step 3: Commit**

```bash
git add docker/Dockerfile .dockerignore
git commit -m "feat(self-host): 多阶段 Dockerfile 与 .dockerignore"
```

---

### Task 6: 功能门控接入（前端）

**Files:**
- Modify: `app/app.vue`
- Modify: `app/components/app/Footer.vue`
- Modify: `app/components/ContactForm.vue`
- Modify: `app/components/tool/LoadUrlModal.vue`
- Modify: `app/pages/embed/index.vue`
- Modify: `app/pages/embed/json.vue`

- [ ] **Step 1: `app/app.vue` — noindex meta + canonical 基址**

在 `<script setup>` 中加入：

```ts
  const flags = useDeployFlags()
```

把 canonical 计算改为（官方分支输出不变：非自托管时 `baseUrl` 为空字符串，仍走 `siteConfig.url`）：

```ts
  const canonicalBase = computed(() => {
    return flags.value.baseUrl || (flags.value.selfHosted ? '' : siteConfig.url)
  })

  // 动态生成 Canonical URL
  const canonicalUrl = computed(() => {
    const normalizedPath = route.path
      .replace(/^\/zh-hk(\/|$)/i, '/zh-HK$1')
      .replace(/^\/zh-tw(\/|$)/i, '/zh-TW$1')
    const base = canonicalBase.value || siteConfig.url
    return `${base}${normalizedPath}`.replace(/\/$/, '')
  })
```

在 `useHead` 的 `meta` 数组里加入（自托管构建期即可确定，预渲染 HTML 直接带上）：

```ts
      ...(flags.value.selfHosted ? [{ name: 'robots', content: 'noindex, nofollow' }] : []),
```

- [ ] **Step 2: `app/components/app/Footer.vue` — 徽章 / 品牌 / 站名门控**

`<script setup>` 改为：

```ts
const { allCategories } = useTools()
const flags = useDeployFlags()
const brandName = computed(() => flags.value.siteName || 'JSON Toolbox')
```

模板三处：
1. 第 33 行 `<LinkExchange class="mb-2"/>` → `<LinkExchange v-if="flags.externalBadges" class="mb-2"/>`
2. 第 35–44 行的 GitHub / Twitter 按钮块（指向主仓库与官方账号的外链）→ 用 `<div v-if="flags.branding" class="flex gap-3">` 包裹
3. 第 15–17 行的品牌文字 `JSON` + `Toolbox` → 替换为 `{{ brandName }}`（保留 `text-primary-600` 配色）：

```html
						<span class="text-2xl font-black tracking-tight text-surface-900 dark:text-surface-100">
							<span class="text-primary-600 dark:text-primary-400">{{ brandName }}</span>
						</span>
```

- [ ] **Step 3: `app/components/ContactForm.vue` — 门控远端提交**

在 `<script setup>` 中加入 `const flags = useDeployFlags()`，并在提交处理函数**最开头**插入守卫：

```ts
  if (!flags.value.contactForm) {
    error.value = t('contact.disabled') || 'The contact form is disabled on this self-hosted instance.'
    return
  }
```

> 若 `i18n/locales/*.json` 暂无 `contact.disabled` 键，先在两处 locale 各补一条（en / zh-CN），再写代码；不要依赖英文兜底漏进中文页（`copy-accuracy` 铁律）。

- [ ] **Step 4: `app/components/tool/LoadUrlModal.vue` — 门控远端加载**

在 `fetchUrl` 开头插入：

```ts
const flags = useDeployFlags()
...
  if (!flags.value.remoteLoad) {
    error.value = 'Loading from a URL is disabled on this self-hosted instance.'
    return
  }
```

同时在输入框下方补一句可见提示（自托管且关闭时）：

```html
<p v-if="!flags.remoteLoad" class="text-xs text-surface-500">URL loading is disabled on this instance.</p>
```

- [ ] **Step 5: embed 页 — iframe 基址取当前实例**

`app/pages/embed/index.vue` 第 23 行与第 38 行：

```ts
const embedBase = computed(() =>
  import.meta.client ? `${window.location.origin}/embed/json` : 'https://jsontoolbox.cc/embed/json',
)
const attributionBase = computed(() =>
  import.meta.client ? `${window.location.origin}/tools/format/json-editor` : 'https://jsontoolbox.cc/tools/format/json-editor',
)
```

并把 `embedUrl` / `attributionUrl` 中的硬编码常量替换为上面两个 computed。**官方站点上 `window.location.origin === https://jsontoolbox.cc`，输出与今天一致。**

`app/pages/embed/json.vue` 第 259 行同样处理（该页生成"嵌入本站"的片段，自托管时指向自己的 origin；第 470 行的官网链接属来源说明，保留）。

- [ ] **Step 6: 静态检查**

Run: `cd /Users/kbmjj123/Desktop/fullstack/jsontoolbox.cc && npx eslint app/composables/useDeployFlags.ts app/plugins/deploy-flags.ts app/app.vue app/components/app/Footer.vue app/components/ContactForm.vue app/components/tool/LoadUrlModal.vue app/pages/embed`
Expected: 无新增错误。

- [ ] **Step 7: 跑全部单测**

Run: `pnpm test`
Expected: PASS。

- [ ] **Step 8: Commit**

```bash
git add app
git commit -m "feat(self-host): 徽章/品牌/远端加载/联系表单门控与实例内嵌基址"
```

---

### Task 7: Compose 与冒烟脚本

**Files:**
- Create: `compose.yml`
- Create: `scripts/smoke-selfhost.mjs`

- [ ] **Step 1: 创建 `compose.yml`（本机默认只绑 127.0.0.1）**

```yaml
services:
  jsontoolbox:
    # Pin a version tag for reproducible deployments; use :latest only for a
    # quick try-out. Final image name is pending confirmation.
    image: ghcr.io/kbmjj123/jsontoolbox:latest
    container_name: jsontoolbox
    restart: unless-stopped
    # Local machine: loopback only. To expose it on a controlled LAN, see
    # docs/self-hosting/docker.zh-CN.md (do NOT use 0.0.0.0 on a public host).
    ports:
      - "127.0.0.1:8080:8080"
    environment:
      JT_SHOW_BRANDING: "1"
      JT_SHOW_EXTERNAL_BADGES: "0"
      JT_ENABLE_REMOTE_LOAD: "0"
      JT_ENABLE_CONTACT_FORM: "0"
      # JT_SITE_NAME: "Team JSON Tools"
      # JT_BASE_URL: "https://json.internal:8443"
    # Hardening options below are available but NOT enabled by default: they
    # must pass the smoke test on your setup first.
    # read_only: true
    # tmpfs:
    #   - /tmp
    # cap_drop:
    #   - ALL
```

- [ ] **Step 2: 创建 `scripts/smoke-selfhost.mjs`**

```js
#!/usr/bin/env node
/**
 * HTTP smoke test for a running self-hosted container.
 *
 *   docker compose up -d
 *   node scripts/smoke-selfhost.mjs --base http://127.0.0.1:8080
 *
 * Exits non-zero on the first failed assertion. Run by the developer — it needs
 * a running container, so it is never part of `pnpm test`.
 */

const args = process.argv.slice(2)
const base = (args[args.indexOf('--base') + 1] || 'http://127.0.0.1:8080').replace(/\/$/, '')

let failures = 0
function check(name, ok, detail = '') {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`)
  if (!ok) failures += 1
}

async function head(path) {
  const res = await fetch(base + path, { redirect: 'manual' })
  const type = res.headers.get('content-type') || ''
  const text = res.status === 200 ? await res.text() : ''
  return { status: res.status, type, text, cache: res.headers.get('cache-control') || '' }
}

// Locate the worker chunk from the built HTML of the large-file viewer page.
async function findWorkerChunk() {
  const page = await head('/tools/view/large-json-viewer')
  const m = page.text.match(/\/_nuxt\/[^"'()\s]*recordStream\.worker[^"'()\s]*\.js/)
  return m ? m[0] : null
}

const results = []
for (const path of ['/', '/zh', '/tools', '/tools/format/json-editor']) {
  const r = await head(path)
  results.push([`GET ${path} → 200 HTML`, r.status === 200 && r.type.includes('text/html'), `${r.status} ${r.type}`])
}

const missing = await head('/this-page-does-not-exist')
results.push(['缺失页面 → 404', missing.status === 404, `${missing.status} ${missing.type}`])

const missingAsset = await head('/_nuxt/definitely-missing.js')
results.push([
  '缺失 JS → 404 且非 HTML',
  missingAsset.status === 404 && !missingAsset.type.includes('text/html'),
  `${missingAsset.status} ${missingAsset.type || '(no content-type)'}`,
])

const worker = await findWorkerChunk()
if (worker) {
  const r = await head(worker)
  results.push([
    `Worker chunk ${worker} → 200 JS`,
    r.status === 200 && /javascript/.test(r.type),
    `${r.status} ${r.type}`,
  ])
} else {
  results.push(['Worker chunk 可定位', false, '未在 large-json-viewer 页面中找到 recordStream.worker-*.js'])
}

const rc = await head('/runtime-config.json')
results.push([
  '/runtime-config.json → 200 + no-store',
  rc.status === 200 && rc.cache.includes('no-store'),
  `${rc.status} ${rc.cache}`,
])

const robots = await head('/robots.txt')
results.push(['/robots.txt 含 Disallow: /', robots.status === 200 && /Disallow:\s*\//.test(robots.text), `${robots.status}`])

const llms = await head('/llms.txt')
results.push(['/llms.txt → 200', llms.status === 200, `${llms.status}`])

for (const [name, ok, detail] of results) check(name, ok, detail)

console.log(failures ? `\n${failures} 项失败` : '\n全部通过')
process.exit(failures ? 1 : 0)
```

- [ ] **Step 3: 在 `package.json` 增加冒烟入口**

```json
    "smoke:selfhost": "node scripts/smoke-selfhost.mjs",
```

- [ ] **Step 4: Commit**

```bash
git add compose.yml scripts/smoke-selfhost.mjs package.json
git commit -m "feat(self-host): Compose 示例与容器 HTTP 冒烟脚本"
```

---

### Task 8: 发布工作流（**只交付文件，不触发发布**）

**Files:**
- Create: `.github/workflows/docker.yml`

- [ ] **Step 1: 创建工作流**

```yaml
name: Docker

on:
  release:
    types: [published]
  workflow_dispatch:
    inputs:
      tag:
        description: 'Image tag to publish (e.g. 1.0.0)'
        required: true

# Least privilege: no secrets are read, nothing is echoed.
permissions:
  contents: read
  packages: write

env:
  IMAGE_NAME: ghcr.io/kbmjj123/jsontoolbox   # 待确认：发布前检查可用性
  REGISTRY: ghcr.io

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: docker/setup-qemu-action@v3
      - uses: docker/setup-buildx-action@v3

      - uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Derive tags
        id: meta
        run: |
          TAG="${{ github.event.release.tag_name || inputs.tag }}"
          echo "tag=${TAG}" >> "$GITHUB_OUTPUT"
          echo "sha=sha-$(git rev-parse --short HEAD)" >> "$GITHUB_OUTPUT"

      # The prerender output is architecture independent: the builder stage runs
      # on the native BUILDPLATFORM, only the nginx runtime is built per target.
      - uses: docker/build-push-action@v6
        with:
          context: .
          file: docker/Dockerfile
          platforms: linux/amd64,linux/arm64
          push: true
          provenance: true
          tags: |
            ${{ env.IMAGE_NAME }}:${{ steps.meta.outputs.tag }}
            ${{ env.IMAGE_NAME }}:${{ steps.meta.outputs.sha }}
            ${{ env.IMAGE_NAME }}:latest
          labels: |
            org.opencontainers.image.source=https://github.com/kbmjj123/jsontoolbox.cc
            org.opencontainers.image.revision=${{ github.sha }}
            org.opencontainers.image.version=${{ steps.meta.outputs.tag }}
            org.opencontainers.image.licenses=MIT
          cache-from: type=gha
          cache-to: type=gha,mode=max

      # Smoke test each published arch before declaring support.
      - name: Runtime smoke (amd64)
        run: |
          docker run -d --name jt-smoke -p 127.0.0.1:8080:8080 \
            ${{ env.IMAGE_NAME }}:${{ steps.meta.outputs.sha }}
          for i in $(seq 1 30); do
            curl -fsS http://127.0.0.1:8080/index.html > /dev/null && break || sleep 1
          done
          node scripts/smoke-selfhost.mjs --base http://127.0.0.1:8080
          docker rm -f jt-smoke
```

> **约束 #6**：本文件只是"待发布产物"。是否真正发布镜像 / 打 Release 需维护者确认，AI 不触发。
> arm64 冒烟需在 arm64 runner 上执行；未经真机验证前**不对外声明 arm64 支持**。

- [ ] **Step 2: Commit**

```bash
git add .github/workflows/docker.yml
git commit -m "ci(self-host): GHCR 多架构镜像构建工作流（未授权发布）"
```

---

### Task 9: 文档（中 / 英）

**Files:**
- Create: `docs/self-hosting/docker.zh-CN.md`
- Create: `docs/self-hosting/docker.en.md`
- Modify: `README.md`

- [ ] **Step 1: 中文指南 `docs/self-hosting/docker.zh-CN.md`**

必须包含以下章节（每条都写清"默认值 / 何时生效 / 边界"）：

1. **它能做什么、不能做什么**：纯前端处理；不提供账号、数据库、远程存储、自动升级；`noindex` 不是认证或保密措施
2. **快速开始**：一条 `docker run` + 一段 `compose.yml`，默认只绑 `127.0.0.1:8080`
3. **端口与数据**：内部端口 8080；**不需要挂载任何卷**；浏览器 localStorage ≠ 容器内持久化（重建容器即丢）
4. **配置表**：6 个 `JT_*` 变量（用途 / 默认 / 取值 / 生效时机），并明确"统计 ID、站长验证、站点标题后缀、base path 只能重新构建"
5. **与在线版的差异**：自托管默认关闭第三方徽章、从 URL 加载、联系表单；无统计脚本；默认 noindex 且不含 sitemap；图标已本地化
6. **离线与例外清单**：断网可用；例外 = 用户数据里的远程资源预览（图片/音视频/PDF URL）、用户主动打开的官网链接
7. **内网/公网边界**：`127.0.0.1` 与 `0.0.0.0` 的区别、必须自带反向代理与 HTTPS、不要把实例直接暴露到公网
8. **加固选项**：`--read-only --tmpfs /tmp`、`cap_drop: [ALL]`、资源限额 —— **标注"需先在你的环境跑通冒烟"**
9. **升级与回滚**：`docker compose pull && up -d` 升级；回滚 = 把 tag 改回上一个版本后重建容器；固定版本 tag 才可复现
10. **版本与来源**：镜像 tag 对应仓库 Release；源码、许可证（MIT）、在线版入口链接

- [ ] **Step 2: 英文指南 `docs/self-hosting/docker.en.md`**

与中文条目一一对应（同一份结构，英文表述）。

- [ ] **Step 3: README 增加"Self-hosting (Docker)"章节**

在 `README.md` 的 `### Build & Deploy` 之后追加：

```markdown
### Self-hosting with Docker

Run your own instance without a Node toolchain — no build step required:

```bash
docker run -d --name jsontoolbox -p 127.0.0.1:8080:8080 ghcr.io/kbmjj123/jsontoolbox:latest
```

Then open <http://127.0.0.1:8080>.

Full guide (configuration, offline behaviour, upgrade & rollback, network
exposure): [English](./docs/self-hosting/docker.en.md) ·
[简体中文](./docs/self-hosting/docker.zh-CN.md)
```

> **不要改动** `README.md:186-232` 的 "Self-hosting & Attribution" 条款（阻塞项 B1，需维护者确认）。

- [ ] **Step 4: Commit**

```bash
git add docs/self-hosting README.md
git commit -m "docs(self-host): Docker 部署指南（中/英）与 README 章节"
```

---

### Task 10: 验收矩阵执行清单（开发者执行，AI 不代跑）

**Files:**
- Modify: `docs/channel/01-docker-self-hosting.md`（勾选"实施任务"，未验证项标注）

- [ ] **Step 1: 本地构建镜像**

Run（开发者本地）：`docker build -f docker/Dockerfile -t jsontoolbox:selfhost --build-arg SITE_URL=http://localhost:8080 .`
Expected: 构建成功，镜像内无 `node_modules`、无 `.git`、无 `data/`。

- [ ] **Step 2: 启动并冒烟**

Run: `docker run -d --name jt -p 127.0.0.1:8080:8080 jsontoolbox:selfhost` → `pnpm smoke:selfhost`
Expected: 全部 PASS（含"缺失 JS → 404 且非 HTML"与 Worker chunk 200）。

- [ ] **Step 3: 验收矩阵逐条（对照需求 §验收矩阵 1–7）**

| # | 验收项 | 判定依据 | 结果 |
|---|---|---|---|
| 1 | 干净环境凭 Docker + 文档启动 | 新机器仅 `docker run` + 文档 | 由开发者填写 |
| 2 | 格式化/校验/树形查看/导入导出可用 | 浏览器手动 | 由开发者填写 |
| 3 | 断网后核心功能可用 | 断网 + 网络面板记录例外 | 由开发者填写 |
| 4 | Worker/字体/静态资源无 404 | 控制台 + 冒烟脚本 | 由开发者填写 |
| 5 | 本机默认不向所有接口开放 | `docker ps` 端口应为 `127.0.0.1:8080` | 由开发者填写 |
| 6 | 固定版本升级与回滚成功 | 换 tag 重建 | 由开发者填写 |
| 7 | 产物与日志无密钥、无 JSON 原文 | `docker history` / 镜像内 grep | 由开发者填写 |

- [ ] **Step 4: 官网回归（不构建自托管开关）**

Run（开发者本地）：`pnpm build`（不设 `NUXT_PUBLIC_SELF_HOSTED`）
Expected: 产物与本次改动前一致：含 `sitemap_index.xml`、`robots.txt` 为 `Allow`、`__og-image__/` 存在、页面无 `noindex`。**未执行则标注"未验证"。**

- [ ] **Step 5: 回填需求文档与 spec 状态**

- `docs/channel/01-docker-self-hosting.md` 的"实施任务"勾选已完成任务；未验证项保留未勾选
- `docs/superpowers/specs/2026-10-28-docker-self-hosting-design.md` 顶部 `- **状态**：` 更新为实际状态（如"已实现，冒烟未验证"）

- [ ] **Step 6: Commit**

```bash
git add docs/channel/01-docker-self-hosting.md docs/superpowers/specs/2026-10-28-docker-self-hosting-design.md
git commit -m "docs(self-host): 回填验收结果与 spec 状态"
```

---

## 自审结果

1. **Spec 覆盖**：静态产物结论 → T1/T5；图标远端回源 → T1 Step 5；运行时配置白名单 → T3；路由/404 语义 → T4/T7；noindex/robots/sitemap → T1 Step 4；分享链接（已符合，无需改）→ 记录在 spec §2.2；发布与供应链 → T8；文档 → T9；验收 → T10。无缺口。
2. **占位符扫描**：无 TBD / "后续补充"；每个步骤含具体代码或命令。镜像名与 README 授权条款是**显式阻塞项**（B1/B2/B3），不是占位符。
3. **类型一致性**：`DeployFlags` 在 T2 定义，T6 各组件与 T3 生成的 JSON 字段逐字对应（`siteName` / `branding` / `externalBadges` / `remoteLoad` / `contactForm` / `baseUrl`）；`JT_RUNTIME_DIR` 在 T3 脚本与 T5 Dockerfile、`docker/nginx.conf` 的 `alias` 路径三方一致（`/tmp/jt-runtime/runtime-config.json`）。
4. **官网零影响**：所有新逻辑由 `selfHosted` 门控；`site.url`、`i18n.baseUrl`、`runtimeConfig.public.baseUrl` 的官方分支保持原样；embed 页在官方域上 `window.location.origin` 与硬编码值相等。

## 执行方式

计划已保存到 `docs/superpowers/plans/2026-10-28-docker-self-hosting.md`。

**注意**：镜像构建（`docker build`）、站点构建（`pnpm build`）、容器冒烟（`pnpm smoke:selfhost`）均由开发者在本地执行；AI 只写代码、配置、文档，并运行不依赖构建产物的 vitest 单测与 eslint。
