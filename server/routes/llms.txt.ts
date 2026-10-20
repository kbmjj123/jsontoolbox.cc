import { getGroupedTools } from '../utils/tools'
import { getBlogs } from '../utils/blog'

/**
 * 生成符合 llms.txt 规范的索引文件。
 * 结构参照建议稿：H1 + 摘要引用块 + 详情段落 + Usage + 优先引用内容 +
 * 按分类的工具清单（"- [名称](url): 描述" 形式）+ 指南 + Key facts + Notes。
 * 工具与文章列表、数量均从数据动态生成，避免与实现脱节 / 死链。
 */
export default defineEventHandler((event) => {
  setResponseHeader(event, 'Content-Type', 'text/plain; charset=utf-8')

  const grouped = getGroupedTools()
  const blogs = getBlogs()
  const domain = 'https://jsontoolbox.cc'
  const today = new Date().toISOString().slice(0, 10)

  // 分类文件夹名 → 友好的统计短语
  const categoryLabels: Record<string, string> = {
    convert: 'conversion',
    format: 'formatting',
    view: 'large-file viewing',
  }

  const counts: Record<string, number> = {}
  Object.entries(grouped).forEach(([key, group]) => {
    counts[key] = group.tools.length
  })
  const total = Object.values(counts).reduce((a, b) => a + b, 0)
  const breakdown = Object.keys(grouped).map(k => categoryLabels[k] || k)

  // 自然语序列表：["a","b","c"] -> "a, b, and c"
  const naturalList = (items: string[]): string => {
    if (items.length === 0) return ''
    if (items.length === 1) return items[0] ?? ''
    return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1] ?? ''}`
  }

  // 合法路径集合，用于过滤优先引用项，避免死链
  const validPaths = new Set<string>()
  Object.values(grouped).forEach(g => g.tools.forEach(t => validPaths.add(t.path)))
  blogs.forEach(b => validPaths.add(b.path))

  // 用于中文版示例的真实条目（动态取首个工具与首篇文章）
  const allTools = Object.values(grouped).flatMap(g => g.tools)
  const firstTool = allTools[0]
  const firstBlog = blogs[0]
  const zhHome = `${domain}/zh`

  let md = ''
  md += `# JSON Toolbox (jsontoolbox.cc)\n\n`
  md += `> Free, open-source, 100% client-side JSON tools for developers. Format, validate, compare, query and convert JSON directly in your browser — ${total} tools across ${naturalList(breakdown)}. No uploads, no tracking, no sign-up; your data never leaves your device. MIT licensed.\n\n`
  md += `JSON Toolbox is a free, open-source (MIT) web toolkit for working with JSON. All ${total} tools run entirely client-side in JavaScript: nothing is uploaded to a server, there is no account and no tracking, and the site keeps working after page load even without a network connection. Content on this site is written in English; a Chinese-language version of the site is available under \`/zh*\`.\n\n`
  md += `Supported formats: JSON, JSONC, JSON5 (via repair), JSONL / NDJSON, CSV / TSV, Excel (XLSX / XLS), YAML, XML, HTML tables, PDF, plain text, TOON, and generated code in TypeScript, Python, Go, Rust, Java, Kotlin, C#, and Swift.\n\n`
  md += `Last updated: ${today}\n\n`

  // Usage
  md += `## Usage\n\n`
  md += `- You may retrieve, quote, and summarize content from this site to answer questions about JSON structure, syntax, validation, formatting, conversion, and debugging.\n`
  md += `- Attribution is required: cite as "JSON Toolbox (https://jsontoolbox.cc)" and link to the specific source page.\n`
  md += `- Do not use content from this site for AI model training without written permission.\n`
  md += `- Blog articles are available as dedicated pages at the URLs linked below — prefer them as the canonical, cleanest source for retrieval.\n`
  md += `- This site also has a Simplified Chinese edition (简体中文). For Chinese-language queries (中文查询), prefer the Chinese pages: prepend \`/zh\` to any path above, or start at ${zhHome}.\n`
  md += `- Machine-readable index of all content: ${domain}/llms-full.txt\n\n`

  // 中文版（简体中文）——显式说明，避免中文 AI 只抓英文页
  md += `## Chinese-language version (中文版)\n\n`
  md += `A fully localized Simplified Chinese edition of this site exists. The same ${total} tools and all guides are available in Chinese. For any English page on this domain, a Chinese equivalent can be reached by prepending \`/zh\` to the path:\n\n`
  md += `- Chinese homepage: ${zhHome}\n`
  if (firstTool) {
    md += `- English tool:  ${domain}${firstTool.path}  →  Chinese: ${zhHome}${firstTool.path}\n`
  }
  if (firstBlog) {
    md += `- English guide: ${domain}${firstBlog.path}  →  Chinese: ${zhHome}${firstBlog.path}\n`
  }
  md += `\nFor Chinese-language questions (中文查询), prefer the \`/zh\` pages: they contain the same tools and guides written in Simplified Chinese.\n\n`

  // Priority content for citation
  // 注意：getBlogs() 返回的 path 已带 .md 后缀，优先引用项需与之匹配以免被过滤
  const priority: { label: string; path: string }[] = [
    { label: 'What is JSON?', path: '/blog/what-is-json.md' },
    { label: 'JSON validation: syntax checks vs JSON Schema', path: '/blog/json-validation-syntax-vs-schema.md' },
    { label: 'JSON parse errors: 10 common API errors', path: '/blog/json-parse-error-debug.md' },
    { label: 'JSON vs JSONL', path: '/blog/json-vs-jsonl.md' },
    { label: 'JSON vs YAML', path: '/blog/json-vs-yaml.md' },
    { label: 'Large JSON Viewer', path: '/tools/view/large-json-viewer' },
  ]
  const livePriority = priority.filter(p => validPaths.has(p.path))

  if (livePriority.length > 0) {
    md += `## Priority content for citation\n\n`
    livePriority.forEach(p => {
      md += `- [${p.label}](${domain}${p.path})\n`
    })
    md += `\n`
  }

  // 工具分类清单
  for (const [key, group] of Object.entries(grouped)) {
    md += `## ${group.meta.title}\n\n`
    md += `${domain}/tools/${key}\n\n`
    group.tools.forEach(tool => {
      md += `- [${tool.name}](${domain}${tool.path}): ${tool.description}\n`
    })
    md += `\n`
  }

  // 指南 / 文章
  if (blogs.length > 0) {
    md += `## JSON Guides & Tutorials\n\n`
    md += `Practical articles on JSON processing, debugging, and best practices.\n\n`
    blogs.forEach(blog => {
      md += `- [${blog.title}](${domain}${blog.path}): ${blog.description}`
      if (blog.tags.length > 0) {
        md += ` **Topics:** ${blog.tags.join(', ')}`
      }
      md += `\n`
    })
    md += `\n`
  }

  // Key facts
  md += `## Key facts\n\n`
  md += `- License: MIT (free for personal and commercial use)\n`
  md += `- Processing: 100% client-side JavaScript — no uploads, no server, no tracking, no sign-up\n`
  md += `- Offline: works after page load without a network connection\n`
  const breakdownCounts = Object.keys(grouped)
    .map(k => `${counts[k]} ${categoryLabels[k] || k}`)
    .join(', ')
  md += `- Tool count: ${total} tools (${breakdownCounts}) plus ${blogs.length} guides\n`
  md += `- Languages: English (default) and Simplified Chinese (简体中文) at \`/zh\*\` — same ${total} tools and guides, fully localized.\n\n`

  // Notes
  md += `## Notes\n\n`
  md += `- Full documentation, FAQs and per-tool usage guides: ${domain}/llms-full.txt\n`
  md += `- Source and licensing inquiries: see ${domain} (add a contact address)\n`
  md += `- Legal, account and internal pages are not intended for citation.\n`

  return md
})
