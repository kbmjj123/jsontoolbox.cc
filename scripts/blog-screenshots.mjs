// Batch-screenshot blog articles' referenced tool pages.
//
// For every markdown file in content/{locale}/blog/*.md, the script collects the
// tool URLs the article points at (frontmatter `promo.slug` + in-body
// `/tools/...` links), opens each one in the system Chrome via puppeteer-core,
// waits for it to render, and saves a viewport screenshot into
// public/blog/screenshots/{locale}/{slug}/.
//
// Usage:
//   node scripts/blog-screenshots.mjs [locale] [slug]
//   node scripts/blog-screenshots.mjs en                 # all en articles
//   node scripts/blog-screenshots.mjs en how-to-open-json-file   # one article
//
// Requires puppeteer-core (devDependency) and a local Google Chrome.

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import puppeteer from 'puppeteer-core'
import sharp from 'sharp'

const ROOT = path.resolve(fileURLToPath(import.meta.url), '../..')
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const BASE = 'https://jsontoolbox.cc'
const VIEWPORT = { width: 1366, height: 1000, deviceScaleFactor: 1 }
// Articles link to several tools; only the first few are worth a figure.
const MAX_IMAGES = 3
// Directories under app/assets/data that hold sample payloads, not tool pages.
const NON_TOOL_DIRS = new Set(['examples'])

// slug -> category, derived from the tool data files so a bare promo slug can be
// turned into a real route like /tools/format/json-editor.
function buildSlugMap() {
  const map = {}
  const dataDir = path.join(ROOT, 'app/assets/data')
  const walk = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const fp = path.join(dir, e.name)
      if (e.isDirectory()) {
        // `app/assets/data/examples/` holds sample payloads whose file names
        // collide with real tool slugs (`json-to-yaml.json` exists in both
        // `examples/` and `convert/`). Walking it would map a bare promo slug
        // to the wrong category and screenshot a 404 page.
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
  const toolLinks = [
    ...raw.matchAll(/\/tools\/([a-z0-9-]+)\/([a-z0-9-]+)/g),
  ].map((m) => `/tools/${m[1]}/${m[2]}`)
  return { promoSlug, toolLinks: [...new Set(toolLinks)] }
}

async function main() {
  const slugMap = buildSlugMap()
  const locale = process.argv[2] || 'en'
  const onlySlug = process.argv[3]
  const dir = path.join(ROOT, `content/${locale}/blog`)
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.md'))

  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
  })
  const page = await browser.newPage()
  await page.setViewport(VIEWPORT)
  // Avoid the cookie/consent banner pushing layout around.
  await page.evaluateOnNewDocument(() => {
    try { localStorage.setItem('cookie-consent', 'accepted') } catch {}
  })

  const report = []
  for (const f of files) {
    const slug = f.replace(/\.md$/, '')
    if (onlySlug && slug !== onlySlug) continue
    const { promoSlug, toolLinks } = parseArticle(path.join(dir, f))
    // English is the default locale (no prefix); Chinese lives under /zh.
    // Article bodies link tools as /tools/... even in Chinese, so the locale
    // prefix has to be added here or Chinese articles get English screenshots.
    const localePrefix = locale === 'en' ? '' : `/${locale}`
    const ordered = []
    if (promoSlug && slugMap[promoSlug]) {
      ordered.push(`/tools/${slugMap[promoSlug]}/${promoSlug}`)
    }
    for (const u of toolLinks) if (!ordered.includes(u)) ordered.push(u)
    const targets = ordered.slice(0, MAX_IMAGES)
    if (targets.length === 0) {
      console.log(`skip ${locale}/${slug}: no tool links`)
      continue
    }
    const outDir = path.join(ROOT, 'public/blog/screenshots', locale, slug)
    fs.mkdirSync(outDir, { recursive: true })
    // Only clear figures produced by this script (NN-*.webp / NN-*.png).
    // Interactive scenario figures (e.g. json-editor-formatted.webp) are kept.
    for (const f of fs.readdirSync(outDir)) {
      if (/^\d{2}-.*\.(png|webp)$/.test(f)) fs.rmSync(path.join(outDir, f), { force: true })
    }
    const images = []
    let i = 1
    for (const u of targets) {
      const url = BASE + localePrefix + u
      const base = `${String(i).padStart(2, '0')}-${u.split('/').pop()}`
      const pngPath = path.join(outDir, base + '.png')
      const webpPath = path.join(outDir, base + '.webp')
      try {
        await page.goto(url, { waitUntil: 'networkidle0', timeout: 45000 })
        await page.waitForSelector('main', { timeout: 15000 }).catch(() => {})
        // Give client-only editor components a moment to mount.
        await new Promise((r) => setTimeout(r, 1500))
        await page.screenshot({ path: pngPath })
        // Convert to webp (smaller than PNG, the format the blog standardizes on).
        await sharp(pngPath).webp({ quality: 82 }).toFile(webpPath)
        fs.unlinkSync(pngPath)
        images.push(`/blog/screenshots/${locale}/${slug}/${base}.webp`)
        console.log(`  ok ${url} -> ${base}.webp`)
        i++
      } catch (e) {
        console.error(`  FAIL ${url}: ${e.message}`)
      }
    }
    report.push({ slug, locale, images })
  }

  await browser.close()
  const reportPath = path.join(ROOT, 'scripts/.screenshot-report.json')
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))
  console.log(`\nreport -> ${reportPath}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
