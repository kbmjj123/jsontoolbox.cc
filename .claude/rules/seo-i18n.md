# SEO & i18n Rules

## SEO

- Use `useSeoMeta()` for page-level meta tags
- Use `useHead()` for global head configuration
- Canonical URLs are auto-generated
- Sitemap is auto-generated via `@nuxtjs/seo`
- Schema.org via `useSchemaOrg()`

## i18n

- Default locale: `en`
- Strategy: `prefix_except_default` (English at `/`, others at `/zh/`, etc.)
- Translation files: `i18n/locales/{locale}.json`
- Use `$t('key')` in templates, `t('key')` in scripts
- Use `useLocalePath()` for locale-aware links

## Content

- Blog posts: `content/{locale}/blog/*.md`
- Legal pages: `content/{locale}/privacy.md`, `content/{locale}/terms-of-service.md`
- Use `queryCollection()` to fetch content
