import { getGroupedTools } from '../utils/tools'
import { getBlogs } from '../utils/blog'

export default defineEventHandler((event) => {
  setResponseHeader(event, 'Content-Type', 'text/plain; charset=utf-8')

  const grouped = getGroupedTools()
  const blogs = getBlogs()
  const domain = 'https://jsontoolbox.cc'

  let md = `# JSON Toolbox — Free Online JSON Tools\n\n`
  md += `> **100% client-side JSON tools for developers.** Format, validate, compare, and convert JSON data directly in your browser.\n`
  md += `> **No uploads, no tracking, no sign-up.** Your data never leaves your device.\n\n`

  // Tools by category
  for (const [key, group] of Object.entries(grouped)) {
    const catUrl = `${domain}/tools/${key}`
    md += `## [${group.meta.title}](${catUrl})\n`
    if (group.meta.pdesc) {
      md += `${group.meta.pdesc}\n\n`
    }
    group.tools.forEach(tool => {
      md += `### [${tool.name}](${domain}${tool.path})\n`
      md += `${tool.description}\n\n`
    })
  }

  // Blog articles
  if (blogs.length > 0) {
    md += `## JSON Guides & Tutorials\n`
    md += `Practical articles on JSON processing, debugging, and best practices.\n\n`
    blogs.forEach(blog => {
      md += `### [${blog.title}](${domain}${blog.path})\n`
      md += `${blog.description}\n`
      if (blog.tags.length > 0) {
        md += `**Topics:** ${blog.tags.join(', ')}\n`
      }
      md += `\n`
    })
  }

  md += `---\n`
  md += `For detailed FAQs, usage guides, and full documentation:\n`
  md += `${domain}/llms-full.txt\n`

  return md
})
