// Sitemap Blog API - returns blog URLs for sitemap generation
import { readdirSync, readFileSync, existsSync } from 'fs'
import { resolve } from 'path'

interface BlogSitemapEntry {
  loc: string
  lastmod: string
}

export default defineEventHandler(() => {
  const contentDir = resolve(process.cwd(), 'content')
  const entries: BlogSitemapEntry[] = []

  if (!existsSync(contentDir)) return entries

  // Scan each locale's blog directory (content/en/blog/, content/zh/blog/, etc.)
  const locales = readdirSync(contentDir, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name)

  for (const locale of locales) {
    const blogDir = resolve(contentDir, locale, 'blog')
    if (!existsSync(blogDir)) continue

    const files = readdirSync(blogDir).filter(f => f.endsWith('.md'))

    for (const file of files) {
      const slug = file.replace(/\.md$/, '')
      const filePath = resolve(blogDir, file)

      try {
        const raw = readFileSync(filePath, 'utf-8')
        // Extract frontmatter dates
        const dateMatch = raw.match(/^date:\s*(.+)$/m)
        const lastmodMatch = raw.match(/^lastmod:\s*(.+)$/m)

        const date = dateMatch?.[1]?.trim()
        const lastmod = lastmodMatch?.[1]?.trim()

        // Build the URL path: /blog/slug for default locale, /{locale}/blog/slug for others
        const loc = locale === 'en' ? `/blog/${slug}` : `/${locale}/blog/${slug}`

        entries.push({
          loc,
          lastmod: lastmod || date || new Date().toISOString()
        })
      } catch {
        // Fallback if file read fails
        const loc = locale === 'en' ? `/blog/${slug}` : `/${locale}/blog/${slug}`
        entries.push({
          loc,
          lastmod: new Date().toISOString()
        })
      }
    }
  }

  return entries
})
