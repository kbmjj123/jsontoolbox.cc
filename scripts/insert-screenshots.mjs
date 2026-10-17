// Insert generated webp screenshots into blog articles as natural figures.
//
// For every content/{locale}/blog/*.md the script works out which tool(s) the
// article points at (frontmatter promo.slug + in-body /tools/... links), picks
// the first one, and inserts its webp right after the paragraph where that tool
// is first linked (falling back to just before the first H2). Interactive
// scenario figures (annotated) are preferred when available and the locale is
// English.
//
// Run dry (default) to preview, then `node scripts/insert-screenshots.mjs --apply`.

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(fileURLToPath(import.meta.url), '../..')
const APPLY = process.argv.includes('--apply')

const NON_TOOL_DIRS = new Set(['examples'])
function buildSlugMap() {
  const map = {}
  const dataDir = path.join(ROOT, 'app/assets/data')
  const walk = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const fp = path.join(dir, e.name)
      if (e.isDirectory()) {
        if (!NON_TOOL_DIRS.has(e.name)) walk(fp)
      } else if (/^[a-z0-9-]+\.json$/.test(e.name)) {
        map[e.name.replace(/\.json$/, '')] = path.basename(dir)
      }
    }
  }
  walk(dataDir)
  return map
}

function parseArticle(file) {
  const raw = fs.readFileSync(file, 'utf8')
  const fm = raw.split(/^---\s*$/m)[1] || ''
  const promo = fm.match(/promo:\s*\n\s*slug:\s*"([^"]+)"/)
  const promoSlug = promo ? promo[1] : null
  const toolLinks = [...raw.matchAll(/\/tools\/([a-z0-9-]+)\/([a-z0-9-]+)/g)].map((m) => `/tools/${m[1]}/${m[2]}`)
  return { promoSlug, toolLinks: [...new Set(toolLinks)] }
}

const WORDS = {
  json: 'JSON', to: 'to', csv: 'CSV', yaml: 'YAML', xml: 'XML', html: 'HTML', excel: 'Excel',
  pdf: 'PDF', typescript: 'TypeScript', editor: 'Editor', repair: 'Repair', formatter: 'Formatter',
  minifier: 'Minifier', validator: 'Validator', viewer: 'Viewer', compare: 'Compare', escape: 'Escape',
  beautifier: 'Beautifier', generator: 'Generator', parser: 'Parser', tree: 'Tree', schema: 'Schema',
  path: 'Path', tester: 'Tester', array: 'Array', large: 'Large', code: 'Code', table: 'Table',
  text: 'Text', toon: 'Toon', jsonl: 'JSONL', cson: 'CSON', jsonc: 'JSONC',
}
function humanName(slug) {
  return slug.split('-').map((w) => WORDS[w] || w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

// Interactive, annotated scenario figures (English only for now).
const DEMO = {
  'json-editor': '/blog/screenshots/en/how-to-open-json-file/json-editor-formatted.webp',
  'json-repair': '/blog/screenshots/en/json-parse-error-debug/json-repair-demo.webp',
}

const slugMap = buildSlugMap()

for (const locale of ['en', 'zh']) {
  const dir = path.join(ROOT, `content/${locale}/blog`)
  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.md'))) {
    const slug = f.replace(/\.md$/, '')
    const { promoSlug, toolLinks } = parseArticle(path.join(dir, f))
    const ordered = []
    if (promoSlug && slugMap[promoSlug]) ordered.push(`/tools/${slugMap[promoSlug]}/${promoSlug}`)
    for (const u of toolLinks) if (!ordered.includes(u)) ordered.push(u)
    const targets = ordered.slice(0, 3)
    if (!targets.length) {
      console.log(`skip ${locale}/${slug}: no tools`)
      continue
    }
    let chosenTool = targets[0].split('/').pop()
    let img
    // A couple of articles are best served by an annotated interactive figure
    // rather than their first-linked tool; pin those explicitly (tool + image).
    const PREFER = {
      'en/json-parse-error-debug': {
        tool: 'json-repair',
        img: '/blog/screenshots/en/json-parse-error-debug/json-repair-demo.webp',
      },
    }
    const p = PREFER[`${locale}/${slug}`]
    if (p && fs.existsSync(path.join(ROOT, 'public', p.img.replace(/^\//, '')))) {
      chosenTool = p.tool
      img = p.img
    }
    if (!img) {
      const dir = path.join(ROOT, 'public/blog/screenshots', locale, slug)
      const cand = fs.readdirSync(dir).find(
        (f) => f.endsWith('.webp') && f.includes(chosenTool) && !/demo|formatted/.test(f),
      )
      if (!cand) {
        console.log(`skip ${locale}/${slug}: no image for ${chosenTool}`)
        continue
      }
      img = `/blog/screenshots/${locale}/${slug}/${cand}`
    }
    const imgFile = path.join(ROOT, 'public', img.replace(/^\//, ''))
    if (!fs.existsSync(imgFile)) {
      console.log(`skip ${locale}/${slug}: image missing ${img}`)
      continue
    }

    const raw = fs.readFileSync(path.join(dir, f), 'utf8')
    const rawLines = raw.split('\n')
    let fm = null
    let body = raw
    if (rawLines[0].trim() === '---') {
      let end = -1
      // Front matter ends at the next `---` line, but only within the first 60
      // lines; a `---` later in the body is a horizontal rule, not the close.
      for (let i = 1; i < Math.min(rawLines.length, 60); i++) {
        if (rawLines[i].trim() === '---') {
          end = i
          break
        }
      }
      if (end > 0) {
        fm = rawLines.slice(1, end).join('\n')
        body = rawLines.slice(end + 1).join('\n')
      }
    }
    if (fm === null) {
      console.log(`skip ${locale}/${slug}: no frontmatter`)
      continue
    }
    if (body.includes('/blog/screenshots')) {
      console.log(`skip ${locale}/${slug}: already has a screenshot`)
      continue
    }

    const blocks = body.split(/\n\n+/)
    let idx = blocks.findIndex((b) => b.includes('(/tools/') && b.includes(`/${chosenTool})`))
    let where
    if (idx === -1) {
      idx = blocks.findIndex((b) => b.startsWith('## '))
      where = idx === -1 ? 'end' : `before H2 (block ${idx})`
    } else {
      where = `after tool link (block ${idx})`
    }
    const alt = `${humanName(chosenTool)} tool interface`
    const caption = `*The ${humanName(chosenTool)} tool.*`
    const imgBlock = `![${alt}](${img})\n\n${caption}`
    if (!APPLY) {
      console.log(`${locale}/${slug} -> ${chosenTool} | ${img} | ${where}`)
      continue
    }
    if (idx === -1) {
      body = body.trimEnd() + '\n\n' + imgBlock + '\n'
    } else {
      const at = where.startsWith('before') ? idx : idx + 1
      blocks.splice(at, 0, imgBlock)
      body = blocks.join('\n\n')
    }
    fs.writeFileSync(path.join(dir, f), `---\n${fm}\n---\n\n${body}`)
    console.log(`applied ${locale}/${slug}`)
  }
}
