import { getToolsFlat } from '../utils/tools'
import { getBlogs } from '../utils/blog'

export default defineEventHandler((event) => {
  setResponseHeader(event, 'Content-Type', 'text/plain; charset=utf-8')

  const tools = getToolsFlat()
  const blogs = getBlogs()
  const domain = 'https://jsontoolbox.cc'

  let md = `# JSON Toolbox — Full Knowledge Base & Technical Documentation\n\n`
  md += `This document provides comprehensive details about JSON Toolbox's browser-based tools, FAQs, and guides.\n\n`

  // --- Part 1: Tool Deep-Dive with FAQ ---
  md += `## 1. JSON Tools Deep-Dive\n\n`

  tools.forEach(tool => {
    md += `### Tool: ${tool.name}\n`
    md += `**URL:** ${domain}${tool.path}\n`
    md += `**Description:** ${tool.description}\n\n`

    // Features
    if (tool.features && tool.features.length > 0) {
      md += `#### Key Features\n`
      tool.features.forEach((f: any) => {
        md += `- **${f.title}**: ${f.description}\n`
      })
      md += `\n`
    }

    // FAQ
    if (tool.faq && tool.faq.length > 0) {
      md += `#### Frequently Asked Questions\n`
      tool.faq.forEach((f: any) => {
        const q = f.q || f.question || ''
        const a = f.a || f.answer || ''
        md += `**Q: ${q}**\n`
        md += `**A:** ${a}\n\n`
      })
    }

    // Guide
    if (tool.guide && tool.guide.length > 0) {
      md += `#### How to Use\n`
      tool.guide.forEach((g: any, i: number) => {
        md += `${i + 1}. **${g.title}**: ${g.description}\n`
      })
      md += `\n`
    }

    md += `---\n\n`
  })

  // --- Part 2: Blog Articles ---
  if (blogs.length > 0) {
    md += `## 2. JSON Guides & Best Practices\n\n`

    blogs.forEach(blog => {
      md += `### Article: ${blog.title}\n`
      md += `**URL:** ${domain}${blog.path}\n`
      md += `**Date:** ${blog.date}\n`
      md += `**Summary:** ${blog.description}\n\n`

      md += `#### Content Preview\n`
      md += `${blog.content}\n\n`

      md += `---\n\n`
    })
  }

  // --- Part 3: Site Info ---
  md += `## 3. About JSON Toolbox\n\n`
  md += `**Website:** ${domain}\n`
  md += `**GitHub:** https://github.com/kbmjj123/jsontoolbox.cc\n\n`
  md += `### Privacy & Security\n`
  md += `- 100% client-side processing — all JSON operations run in your browser\n`
  md += `- No data upload — your JSON never leaves your device\n`
  md += `- No tracking — no analytics that inspect your JSON content\n`
  md += `- Open source — full source code available on GitHub\n\n`
  md += `### Technology Stack\n`
  md += `- Nuxt 4 + Vue 3 + TypeScript\n`
  md += `- Tailwind CSS\n`
  md += `- All JSON processing via native browser APIs (JSON.parse / JSON.stringify)\n`
  md += `- Libraries: js-yaml, xml-js, deep-diff\n`

  return md
})
