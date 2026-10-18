import path from 'node:path'
import { fileURLToPath } from 'node:url'
import puppeteer from 'puppeteer-core'

const ROOT = path.resolve(fileURLToPath(import.meta.url), '../..')
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const BASE = 'http://localhost:3333'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const browser = await puppeteer.launch({
  headless: true,
  executablePath: CHROME,
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
})
const page = await browser.newPage()
await page.setViewport({ width: 1366, height: 1000 })
await page.goto(BASE + '/tools/format/json-editor', { waitUntil: 'networkidle0', timeout: 45000 })
await page.waitForSelector('body').catch(() => {})
await sleep(3500)

const input = await page.$('input[type=file]')
await input.uploadFile(path.join(ROOT, 'scripts/samples/fake-json.json'))
await sleep(1500)

const buttons = await page.evaluate(() =>
  [...document.querySelectorAll('button')].map((b) => (b.textContent || '').trim()).filter(Boolean),
)
console.log('BUTTONS:', JSON.stringify(buttons))

// Left panel highlight after upload (before any click)
const leftLines = await page.evaluate(() =>
  [...document.querySelectorAll('.rp-panel-first .cm-line')].map((l) => ({
    cls: l.className?.toString?.() || '',
    style: l.getAttribute('style') || '',
    text: (l.textContent || '').slice(0, 30),
  })),
)
console.log('LEFT LINES (after upload):', JSON.stringify(leftLines))

// Click Format
await page.evaluate(() => {
  const b = [...document.querySelectorAll('button')].find((x) => (x.textContent || '').includes('Format'))
  if (b) b.click()
})
await sleep(1800)
const afterFormat = await page.evaluate(() => {
  const right = document.querySelector('.rp-panel-second')
  const rt = (right?.innerText || right?.textContent || '').replace(/\s+/g, ' ').trim()
  const tokenEls = [...document.querySelectorAll('*')]
    .map((e) => (e.innerText || '').replace(/\s+/g, ' ').trim())
    .filter((t) => /unexpected|token|position|expect|invalid/i.test(t) && t.length < 160)
    .slice(0, 6)
  return { rightText: rt.slice(0, 200), tokenEls }
})
console.log('AFTER FORMAT right:', JSON.stringify(afterFormat))

// Try Validate button if present
const hasValidate = buttons.some((b) => /validate/i.test(b))
if (hasValidate) {
  await page.evaluate(() => {
    const b = [...document.querySelectorAll('button')].find((x) => /validate/i.test(x.textContent || ''))
    if (b) b.click()
  })
  await sleep(1500)
  const afterValidate = await page.evaluate(() => {
    const errs = [...document.querySelectorAll('*')]
      .map((e) => (e.innerText || '').replace(/\s+/g, ' ').trim())
      .filter((t) => /unexpected|token|position|expect|invalid|error/i.test(t) && t.length < 160)
      .slice(0, 8)
    return errs
  })
  console.log('AFTER VALIDATE errors:', JSON.stringify(afterValidate))
}
await browser.close()
