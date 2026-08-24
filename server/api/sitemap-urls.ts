// Sitemap URLs API - dynamically generates tool URLs from data files
import { readdirSync, readFileSync, existsSync } from 'fs'
import { resolve } from 'path'

interface SitemapUrl {
  loc: string
  lastmod: string
  images?: Array<{
    loc: string
    title?: string
  }>
}

export default defineEventHandler(async () => {
  const dataDir = resolve(process.cwd(), 'app/assets/data')
  const tools: SitemapUrl[] = []
  const baseUrl = process.env.NUXT_PUBLIC_SITE_URL || 'https://jsontoolbox.cc'

  if (!existsSync(dataDir)) {
    return tools
  }

  const categories = readdirSync(dataDir, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name)

  for (const category of categories) {
    const categoryDir = resolve(dataDir, category)
    const files = readdirSync(categoryDir)
      .filter(f => f.endsWith('.json') && f !== '_meta.json')

    for (const file of files) {
      const slug = file.replace('.json', '')
      const filePath = resolve(categoryDir, file)

      try {
        const content = readFileSync(filePath, 'utf-8')
        const data = JSON.parse(content)
        const lastmod = data.lastmod || data.updatedAt || new Date().toISOString()

        // 构建工具 URL
        const toolUrl = `/tools/${category}/${slug}`

        // 构建 OG Image URL（使用 @nuxtjs/seo 的标准路径）
        const ogImageUrl = `${baseUrl}/__og_image__/og.png?path=${toolUrl}`

        // 获取 SEO title 用于 alt 文案
        const seoTitle = data.en?.meta?.title || data.en?.name || `${slug} - JSON Toolbox`

        tools.push({
          loc: toolUrl,
          lastmod: new Date(lastmod).toISOString(),
          images: [
            {
              loc: ogImageUrl,
              title: seoTitle
            }
          ]
        })
      } catch {
        // Fallback to current date if parsing fails
        tools.push({
          loc: `/tools/${category}/${slug}`,
          lastmod: new Date().toISOString()
        })
      }
    }
  }

  return tools
})
