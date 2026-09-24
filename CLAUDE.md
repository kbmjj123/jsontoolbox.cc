# CLAUDE.md

## Project: JSON Toolbox

Free, client-side JSON tools for developers. Nuxt 4 + Vue 3 + TypeScript + Tailwind CSS. All JSON processing client-side — no uploads.

**Commands:**
- `pnpm dev` — Start dev server
- `pnpm build` — Production build (static preset)
- `pnpm preview` — Preview production build

## Product & Strategy

@.claude/product-architecture.md
@.claude/domain-branding.md
@.claude/use-case-matrix.md
@.claude/tool-matrix.md
@.claude/seo-strategy.md
@.claude/homepage-design.md

## Key Rules & Conventions

@.claude/rules/architecture.md
@.claude/rules/tool-system.md
@.claude/rules/component-conventions.md
@.claude/rules/content-system.md
@.claude/rules/i18n-translation-rules.md
@.claude/rules/ui-conventions.md
@.claude/rules/seo-i18n.md
@.claude/rules/seo-workflow.md
@.claude/rules/copy-accuracy.md

## Quick Reference

### Adding a New Tool
1. JSON config: `app/assets/data/{category}/{slug}.json` → set `component` field
2. Vue component: `app/components/universal/{ComponentName}.vue` → must match `component` value
3. Done — routing, navigation, SEO all auto-generated
4. **Ship gate**: run the copy ↔ implementation audit (§3 of `copy-accuracy.md`) — every claim in `features` / `guide` / `faq` / `article` / `meta` / `ui` must point at a `file:line`

### Copy ↔ Implementation（铁律，阻断级）
- 文案承诺的能力必须能在代码里指认；指不出 → 删文案或补实现
- 数量 / 顺序 / 范围 / 默认值 / 上限必须与实现同向
- 语言键：`app/assets/data/**` 用 `en`/`zh`；`i18n/locales/` 是 `en.json`/`zh-CN.json`。写反 → 静默为空
- 英文兜底（`tool.ui?.x || 'English'`）会在 zh 页漏出
- 完整清单：@.claude/rules/copy-accuracy.md

### File Structure for New Features
- Tool config: `app/assets/data/{category}/`
- Tool UI: `app/components/universal/`
- Shared UI: `app/components/tool/`
- Business logic: `app/composables/`
- Utility functions: `app/utils/`
