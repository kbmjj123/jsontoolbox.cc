// Server utils for reading blog content for LLM routes
import { readdirSync, readFileSync, existsSync } from 'fs'
import { resolve } from 'path'

interface BlogEntry {
  title: string
  description: string
  path: string
  date: string
  tags: string[]
  content: string
}

export function getBlogs(): BlogEntry[] {
  const contentDir = resolve(process.cwd(), 'content/en/blog')
  if (!existsSync(contentDir)) return []

  const blogs: BlogEntry[] = []
  const files = readdirSync(contentDir).filter(f => f.endsWith('.md'))

  for (const file of files) {
    try {
      const raw = readFileSync(resolve(contentDir, file), 'utf-8')
      const slug = file.replace('.md$', '')

      // Parse frontmatter
      const fmMatch = raw.match(/^---\n([\s\S]*?)\n---/)
      if (!fmMatch) continue

      const fm = fmMatch[1]
      const title = fm.match(/title:\s*"?(.+?)"?\s*$/m)?.[1] || slug
      const description = fm.match(/description:\s*"?(.+?)"?\s*$/m)?.[1] || ''
      const date = fm.match(/date:\s*(.+)$/m)?.[1]?.trim() || ''
      const tagsRaw = fm.match(/tags:\s*\[([^\]]*)\]/)?.[1] || ''
      const tags = tagsRaw.split(',').map(t => t.trim().replace(/"/g, '')).filter(Boolean)

      // Extract body content (after frontmatter), strip markdown formatting
      const body = raw.slice(fmMatch[0].length).trim()
      // Take first ~500 chars of meaningful text as snippet
      const plainText = body
        .replace(/#{1,6}\s+/g, '')    // headings
        .replace(/\*\*(.+?)\*\*/g, '$1') // bold
        .replace(/\*(.+?)\*/g, '$1')     // italic
        .replace(/`{1,3}[^`]*`{1,3}/g, '') // code
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // links
        .replace(/!\[[^\]]*\]\([^)]+\)/g, '') // images
        .replace(/\n{2,}/g, '\n')
        .trim()
        .slice(0, 800)

      blogs.push({
        title,
        description,
        path: `/blog/${slug}`,
        date,
        tags,
        content: plainText,
      })
    } catch { /* skip invalid files */ }
  }

  return blogs.sort((a, b) => b.date.localeCompare(a.date))
}
