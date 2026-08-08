// Sitemap URLs API - dynamically generates tool URLs from data files
import { readdirSync, readFileSync, existsSync } from 'fs'
import { resolve } from 'path'

export default defineEventHandler(async () => {
  const dataDir = resolve(process.cwd(), 'app/assets/data')
  const tools: Array<{ url: string; lastmod: string }> = []

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

        tools.push({
          url: `/tools/${category}/${slug}`,
          lastmod: new Date(lastmod).toISOString()
        })
      } catch {
        // Fallback to current date if parsing fails
        tools.push({
          url: `/tools/${category}/${slug}`,
          lastmod: new Date().toISOString()
        })
      }
    }
  }

  return tools
})
