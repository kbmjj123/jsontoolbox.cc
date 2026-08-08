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

## Quick Reference

### Adding a New Tool
1. JSON config: `app/assets/data/{category}/{slug}.json` → set `component` field
2. Vue component: `app/components/universal/{ComponentName}.vue` → must match `component` value
3. Done — routing, navigation, SEO all auto-generated

### File Structure for New Features
- Tool config: `app/assets/data/{category}/`
- Tool UI: `app/components/universal/`
- Shared UI: `app/components/tool/`
- Business logic: `app/composables/`
- Utility functions: `app/utils/`
