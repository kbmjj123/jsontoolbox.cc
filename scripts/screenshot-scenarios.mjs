// Scenario-driven, interactive screenshot pipeline.
//
// Unlike the static "scan article -> screenshot tool page" script, this one runs
// a scripted sequence per scenario: open a tool, upload a file, click buttons,
// wait for client-side rendering, then capture. Before each capture it can drop
// annotation boxes/labels onto elements (coordinates taken from the live DOM via
// boundingBox, so the page itself is never mutated), and the final frame is
// exported as WebP via sharp.
//
// Run: node scripts/screenshot-scenarios.mjs
//
// Each scenario: { slug, locale, steps[] }. Step actions:
//   goto(url)                 open BASE + (locale prefix if zh) + url
//   uploadFile(sel, file)     put a local file into a file <input>
//   click(sel, text)          click first element matching sel whose text includes text
//   wait(selector|ms)         wait for a selector or a fixed delay
//   waitFn(fn)                wait until an in-page predicate is true
//   annotate(sel, [text], label)  record a box+label for the next screenshot
//   screenshot(name)          capture viewport -> {name}.webp (+ annotations)

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import puppeteer from 'puppeteer-core'
import sharp from 'sharp'

const ROOT = path.resolve(fileURLToPath(import.meta.url), '../..')
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const BASE = 'http://localhost:3333'
const VIEWPORT = { width: 1366, height: 1000, deviceScaleFactor: 1 }
const OUT_DIR = path.join(ROOT, 'public/blog/screenshots')
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function findByText(page, sel, text) {
  const els = await page.$$(sel)
  for (const el of els) {
    const t = await el.evaluate((e) => e.textContent || '')
    if (t.includes(text)) return el
  }
  return null
}

async function clickByText(page, sel, text) {
  const el = await findByText(page, sel, text)
  if (el) await el.evaluate((e) => e.click())
  else console.error(`  clickByText: not found ${sel} "${text}"`)
}

function escapeXml(s) {
  return String(s).replace(
    /[<>&'"]/g,
    (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c]),
  )
}

// Build an SVG overlay covering the full frame with one box+label per annotation.
function buildSvg(width, height, annotations) {
  const parts = []
  for (const a of annotations) {
    const { x, y, width: w, height: h } = a.box
    const pad = 6
    const rx = Math.max(0, x - pad)
    const ry = Math.max(0, y - pad)
    const rw = w + pad * 2
    const rh = h + pad * 2
    parts.push(
      `<rect x="${rx}" y="${ry}" width="${rw}" height="${rh}" fill="none" stroke="#ff3b30" stroke-width="3" rx="6"/>`,
    )
    const label = a.label || ''
    if (label) {
      const labelW = label.length * 7.5 + 16
      const lx = Math.max(0, x)
      const ly = Math.max(0, y - 26)
      parts.push(`<rect x="${lx}" y="${ly}" width="${labelW}" height="20" rx="4" fill="#ff3b30"/>`)
      parts.push(
        `<text x="${lx + 8}" y="${ly + 14}" font-family="sans-serif" font-size="12" font-weight="bold" fill="white">${escapeXml(label)}</text>`,
      )
    }
  }
  return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">${parts.join('')}</svg>`
}

const SCENARIOS = [
  {
    slug: 'how-to-open-json-file',
    locale: 'en',
    steps: [
      { action: 'goto', url: '/tools/format/json-editor' },
      { action: 'uploadFile', selector: 'input[type=file]', file: 'scripts/samples/sample.json' },
      {
        action: 'waitFn',
        fn: () => {
          const e = document.querySelector('.rp-panel-first .cm-content')
          return e && e.textContent.replace(/\s/g, '').length > 20
        },
        timeout: 8000,
      },
      { action: 'annotate', selector: 'button', text: 'Upload File', label: '1. Upload your JSON' },
      { action: 'click', selector: 'button', text: 'Format' },
      {
        action: 'waitFn',
        fn: () => {
          const e = document.querySelector('.rp-panel-second .cm-content')
          return e && e.textContent.replace(/\s/g, '').length > 20
        },
        timeout: 8000,
      },
      { action: 'annotate', selector: '.rp-panel-second', label: '2. Formatted result' },
      { action: 'screenshot', name: 'json-editor-formatted' },
    ],
  },
  {
    // 图 A — 真实 JSON.parse 报错效果图（对应文章 "When JSON.parse Fails" 的 SyntaxError）
    slug: 'json-parse-error-debug',
    locale: 'en',
    steps: [
      { action: 'goto', url: '/json-parse-error-demo.html' },
      {
        action: 'waitFn',
        fn: () => {
          const e = document.querySelector('#err')
          return e && e.textContent.length > 5
        },
        timeout: 8000,
      },
      { action: 'annotate', selector: '.tok', label: 'Offending character' },
      { action: 'annotate', selector: '.err', label: 'JSON.parse throws SyntaxError' },
      { action: 'screenshot', name: 'json-parse-error-demo' },
    ],
  },
  {
    // 图 B — JSON Repair 修复单引号/注释（对应文章 Scenario 3 的修复演示）
    slug: 'json-parse-error-debug',
    locale: 'en',
    steps: [
      { action: 'goto', url: '/tools/format/json-repair' },
      { action: 'uploadFile', selector: 'input[type=file]', file: 'scripts/samples/fake-json.json' },
      {
        action: 'waitFn',
        fn: () => {
          const e = document.querySelector('.rp-panel-first .cm-content')
          return e && e.textContent.replace(/\s/g, '').length > 10
        },
        timeout: 8000,
      },
      { action: 'annotate', selector: '.rp-panel-first', label: '1. Invalid JSON (single quotes / comments)' },
      { action: 'click', selector: 'button', text: 'Repair JSON' },
      {
        action: 'waitFn',
        fn: () => {
          const e = document.querySelector('.rp-panel-second .cm-content')
          return e && e.textContent.replace(/\s/g, '').length > 10
        },
        timeout: 8000,
      },
      { action: 'annotate', selector: '.rp-panel-second', label: '2. Repaired to valid JSON' },
      { action: 'screenshot', name: 'json-repair-fake-json' },
      ],
    },
    {
      // 图 C — 后端返回 HTML 错误页：JSON.parse 在 position 0 抛错（对应 Scenario 1）
      slug: 'json-parse-error-debug',
      locale: 'en',
      steps: [
        { action: 'goto', url: '/json-parse-error-demo.html?sample=html' },
        {
          action: 'waitFn',
          fn: () => { const e = document.querySelector('#err'); return e && e.textContent.length > 5 },
          timeout: 8000,
        },
        { action: 'annotate', selector: '.tok', label: 'Offending character' },
        { action: 'annotate', selector: '.err', label: 'JSON.parse throws SyntaxError' },
        { action: 'screenshot', name: 'json-parse-html-error' },
      ],
    },
    {
      // 图 D — 截断 JSON：输入在半途结束（对应 Scenario 7）
      slug: 'json-parse-error-debug',
      locale: 'en',
      steps: [
        { action: 'goto', url: '/json-parse-error-demo.html?sample=truncated' },
        {
          action: 'waitFn',
          fn: () => { const e = document.querySelector('#err'); return e && e.textContent.length > 5 },
          timeout: 8000,
        },
        { action: 'annotate', selector: '.tok', label: 'JSON ends here' },
        { action: 'annotate', selector: '.err', label: 'JSON.parse throws SyntaxError' },
        { action: 'screenshot', name: 'json-parse-truncated' },
      ],
    },
  ]

async function main() {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
  })
  const page = await browser.newPage()
  await page.setViewport(VIEWPORT)

  for (const sc of SCENARIOS) {
    const outDir = path.join(OUT_DIR, sc.locale, sc.slug)
    fs.mkdirSync(outDir, { recursive: true })
    const prefix = sc.locale === 'en' ? '' : `/${sc.locale}`
    const annotations = []
    console.log(`scenario ${sc.locale}/${sc.slug}`)
    for (const step of sc.steps) {
      try {
        switch (step.action) {
          case 'goto':
            await page.goto(BASE + prefix + step.url, { waitUntil: 'networkidle0', timeout: 45000 })
            await page.waitForSelector('body', { timeout: 15000 }).catch(() => {})
            await sleep(2500)
            break
          case 'uploadFile': {
            const input = await page.$(step.selector)
            await input.uploadFile(path.resolve(ROOT, step.file))
            await sleep(800)
            break
          }
          case 'click':
            await clickByText(page, step.selector || 'button', step.text)
            await sleep(step.wait ?? 600)
            break
          case 'waitFn':
            await page.waitForFunction(step.fn, { timeout: step.timeout ?? 8000 }).catch(() => {})
            break
          case 'wait':
            if (step.selector) await page.waitForSelector(step.selector, { timeout: step.timeout ?? 8000 }).catch(() => {})
            else await sleep(step.ms ?? 1000)
            break
          case 'annotate': {
            let el
            if (step.text) el = await findByText(page, step.selector || '*', step.text)
            else el = await page.$(step.selector)
            if (!el) {
              console.error(`  annotate: element not found (${step.selector} ${step.text || ''})`)
              break
            }
            const box = await el.boundingBox()
            if (box) annotations.push({ box, label: step.label || '' })
            else console.error(`  annotate: no bounding box (${step.selector})`)
            break
          }
          case 'screenshot': {
            const diag = await page.evaluate(() => {
              const right = document.querySelector('.rp-panel-second')
              const left = document.querySelector('.rp-panel-first .cm-content')
              return {
                left: (left?.textContent || '').replace(/\s/g, '').length,
                right: (right?.textContent || '').replace(/\s/g, '').length,
                rightCls: right?.className,
                rightHTML: right?.innerHTML.slice(0, 200),
              }
            })
            console.log(`  diag: ${JSON.stringify(diag)}`)
            const png = path.join(outDir, step.name + '.png')
            await page.screenshot({ path: png })
            const meta = await sharp(png).metadata()
            const svg = buildSvg(meta.width, meta.height, annotations)
            const webp = path.join(outDir, step.name + '.webp')
            await sharp(png).composite([{ input: Buffer.from(svg) }]).webp({ quality: 82 }).toFile(webp)
            fs.unlinkSync(png)
            annotations.length = 0
            const { size } = fs.statSync(webp)
            console.log(`  ok ${step.name}.webp ${meta.width}x${meta.height} ${size} bytes`)
            break
          }
        }
      } catch (e) {
        console.error(`  step ${step.action} failed: ${e.message}`)
      }
    }
  }
  await browser.close()
  console.log('done')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
