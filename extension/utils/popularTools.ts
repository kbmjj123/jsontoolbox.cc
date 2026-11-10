import { SITE_URL } from './constants'
import type { AppLocale } from './options'

export interface PopularTool {
  category: 'format' | 'convert' | 'view'
  slug: string
  en: string
  zh: string
}

/**
 * Every {category}/{slug} below resolves to a real page:
 * app/assets/data/{category}/{slug}.json  →  /tools/{category}/{slug}
 * Never invent a slug (json-formatter / json-validator / json-tree-viewer /
 * json-diff do not exist on the site).
 */
export const POPULAR_TOOLS: readonly PopularTool[] = [
  { category: 'format', slug: 'json-editor', en: 'JSON Editor', zh: 'JSON 编辑器' },
  { category: 'format', slug: 'json-minifier', en: 'JSON Minifier', zh: 'JSON 压缩' },
  { category: 'convert', slug: 'json-to-csv', en: 'JSON to CSV', zh: 'JSON 转 CSV' },
  { category: 'convert', slug: 'json-to-yaml', en: 'JSON to YAML', zh: 'JSON 转 YAML' },
  { category: 'convert', slug: 'json-to-typescript', en: 'JSON to TypeScript', zh: 'JSON 转 TypeScript' },
  { category: 'view', slug: 'large-json-viewer', en: 'Large JSON Viewer', zh: '大型 JSON 查看器' },
]

/** Site i18n strategy is prefix_except_default: zh adds `/zh`, en has no prefix. */
function localePrefix(locale: AppLocale): string {
  return locale === 'zh' ? '/zh' : ''
}

export function toolUrl(tool: PopularTool, locale: AppLocale): string {
  return `${SITE_URL}${localePrefix(locale)}/tools/${tool.category}/${tool.slug}`
}

export function allToolsUrl(locale: AppLocale): string {
  return `${SITE_URL}${localePrefix(locale)}/tools`
}
