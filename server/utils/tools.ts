// Server utils for reading tool JSON data for LLM routes
import { readdirSync, readFileSync, existsSync } from 'fs'
import { resolve } from 'path'

interface ToolInfo {
  name: string
  description: string
  path: string
  slug: string
  category: string
  en: any
  faq?: any[]
  guide?: any[]
  features?: any[]
}

interface CategoryGroup {
  meta: { title: string; description: string; pdesc: string }
  tools: ToolInfo[]
}

export function getToolsFlat(): ToolInfo[] {
  const dataDir = resolve(process.cwd(), 'app/assets/data')
  if (!existsSync(dataDir)) return []

  const tools: ToolInfo[] = []
  const categories = readdirSync(dataDir, { withFileTypes: true })
    .filter(e => e.isDirectory())

  for (const cat of categories) {
    const catDir = resolve(dataDir, cat.name)
    const files = readdirSync(catDir)
      .filter(f => f.endsWith('.json') && !f.startsWith('_'))

    for (const file of files) {
      try {
        const data = JSON.parse(readFileSync(resolve(catDir, file), 'utf-8'))
        const slug = data.slug || file.replace('.json$', '')
        tools.push({
          name: data.en?.name || slug,
          description: data.en?.description || '',
          path: `/tools/${cat.name}/${slug}`,
          slug,
          category: cat.name,
          en: data.en || {},
          faq: data.en?.faq,
          guide: data.en?.guide,
          features: data.en?.features,
        })
      } catch { /* skip invalid files */ }
    }

    // Also scan sub/ directory
    const subDir = resolve(catDir, 'sub')
    if (existsSync(subDir)) {
      const subFiles = readdirSync(subDir).filter(f => f.endsWith('.json'))
      for (const file of subFiles) {
        try {
          const data = JSON.parse(readFileSync(resolve(subDir, file), 'utf-8'))
          const slug = data.slug || file.replace('.json$', '')
          tools.push({
            name: data.en?.name || slug,
            description: data.en?.description || '',
            path: `/tools/${cat.name}/${slug}`,
            slug,
            category: cat.name,
            en: data.en || {},
            faq: data.en?.faq,
            guide: data.en?.guide,
            features: data.en?.features,
          })
        } catch { /* skip */ }
      }
    }
  }

  return tools
}

export function getGroupedTools(): Record<string, CategoryGroup> {
  const dataDir = resolve(process.cwd(), 'app/assets/data')
  if (!existsSync(dataDir)) return {}

  const grouped: Record<string, CategoryGroup> = {}
  const categories = readdirSync(dataDir, { withFileTypes: true })
    .filter(e => e.isDirectory())

  for (const cat of categories) {
    const catDir = resolve(dataDir, cat.name)
    const metaPath = resolve(catDir, '_meta.json')
    let meta = { title: cat.name, description: '', pdesc: '' }

    if (existsSync(metaPath)) {
      try {
        const metaData = JSON.parse(readFileSync(metaPath, 'utf-8'))
        meta = {
          title: metaData.en?.title || cat.name,
          description: metaData.en?.description || '',
          pdesc: metaData.en?.pdesc || '',
        }
      } catch { /* use defaults */ }
    }

    const tools: ToolInfo[] = []
    const files = readdirSync(catDir)
      .filter(f => f.endsWith('.json') && !f.startsWith('_'))

    for (const file of files) {
      try {
        const data = JSON.parse(readFileSync(resolve(catDir, file), 'utf-8'))
        const slug = data.slug || file.replace('.json$', '')
        tools.push({
          name: data.en?.name || slug,
          description: data.en?.description || '',
          path: `/tools/${cat.name}/${slug}`,
          slug,
          category: cat.name,
          en: data.en || {},
          faq: data.en?.faq,
          guide: data.en?.guide,
          features: data.en?.features,
        })
      } catch { /* skip */ }
    }

    // Scan sub/ directory
    const subDir = resolve(catDir, 'sub')
    if (existsSync(subDir)) {
      const subFiles = readdirSync(subDir).filter(f => f.endsWith('.json'))
      for (const file of subFiles) {
        try {
          const data = JSON.parse(readFileSync(resolve(subDir, file), 'utf-8'))
          const slug = data.slug || file.replace('.json$', '')
          tools.push({
            name: data.en?.name || slug,
            description: data.en?.description || '',
            path: `/tools/${cat.name}/${slug}`,
            slug,
            category: cat.name,
            en: data.en || {},
            faq: data.en?.faq,
            guide: data.en?.guide,
            features: data.en?.features,
          })
        } catch { /* skip */ }
      }
    }

    if (tools.length > 0) {
      grouped[cat.name] = { meta, tools }
    }
  }

  return grouped
}
