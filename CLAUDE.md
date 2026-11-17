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

## Implementation Playbook

@docs/tool-page-playbook.md

新增或改造工具落地页前**先读这份**：注册机制、字段由谁渲染、可复用组件/composable 清单、既有缺陷（如 `hero.trustHtml` 不渲染、`ToolRelated` props 不匹配）、ship gate 验证命令。规则文件讲规范，这份讲当前代码库的实际行为。

## Content Direction & Next Steps

@docs/content-direction-plan.md
@docs/next-steps-checklist.md

方向判断、取舍与被否决的备选路线看 `content-direction-plan.md`；**所有待办以 `next-steps-checklist.md` 为唯一执行入口**，不要从已删除的旧选题队列派工。

### docs/ 目录：本地维护，不进公开仓库
- `docs/` 是内部工作文档区（路线图、计划、spec、渠道草稿、升级记录等），计划会持续在这里维护。除 `docs/README.zh-CN.md`（作为 zh README 由根 `README.md` 链接，需公开）外，**其余内容一律不进入公开仓库**。
- 实现：`.gitignore` 用 `docs/**` + `!docs/README.zh-CN.md`；已跟踪文件已通过 `git rm --cached` 从索引移除（本地保留）。
- 因此 `git status` / `git ls-files` 里看不到这些文件是**正常的，不是文件丢失**；本地仍在，上面 `@docs/...` 的引用照常可读。
- 不要 `git add` / 提交 `docs/` 下除 `README.zh-CN.md` 以外的任何文件；新增的计划文档天然被忽略，无需额外操作。

## Quick Reference

### Adding a New Tool
1. JSON config: `app/assets/data/{category}/{slug}.json` → set `component` field
2. Vue component: `app/components/universal/{ComponentName}.vue` → must match `component` value
3. 手工补：首页精选（`useTools.ts` `FEATURED_CONFIG`）、上游 `nextSteps`/`recommends` 回填、`examples/{slug}.json`
4. **Ship gate**: run the copy ↔ implementation audit (§3 of `copy-accuracy.md`) — every claim in `features` / `guide` / `faq` / `article` / `meta` / `ui` must point at a `file:line`
5. 完整步骤与验证命令：@docs/tool-page-playbook.md

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
