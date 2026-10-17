// Generic one-off DOM probe. Pass a tool URL; it dumps the selectors we need
// to script an interactive scenario (file input, action buttons, editor
// containers). Not part of the screenshot pipeline.
//   node scripts/probe.mjs https://jsontoolbox.cc/tools/format/json-repair
import puppeteer from 'puppeteer-core'

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const URL = process.argv[2] || 'https://jsontoolbox.cc/tools/format/json-repair'

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
})
const page = await browser.newPage()
await page.setViewport({ width: 1366, height: 1000, deviceScaleFactor: 1 })
await page.goto(URL, { waitUntil: 'networkidle0', timeout: 45000 })
await page.waitForSelector('body', { timeout: 15000 }).catch(() => {})
await new Promise((r) => setTimeout(r, 3000))

const info = await page.evaluate(() => {
  const out = {}
  out.fileInputs = [...document.querySelectorAll('input[type=file]')].map((el) => ({
    id: el.id,
    name: el.name,
    cls: el.className,
    parent: `${el.parentElement?.tagName}.${el.parentElement?.className || ''}`,
  }))
  out.buttons = [...document.querySelectorAll('button, label')]
    .map((b) => ({ tag: b.tagName, text: (b.textContent || '').trim().slice(0, 40), cls: b.className }))
    .filter((b) =>
      /repair|fix|format|beautif|convert|copy|download|validate|tree|paste|upload|load|pretty|minif|escape|compare|generate/i.test(
        b.text,
      ),
    )
  out.textareas = [...document.querySelectorAll('textarea')].map((t) => ({ id: t.id, cls: t.className, ph: t.placeholder }))
  out.cm = [...document.querySelectorAll('.cm-editor')].map((c) => ({ cls: c.className, parent: c.parentElement?.className || '' }))
  out.containers = [...document.querySelectorAll('[class*="editor"],[class*="result"],[class*="output"],[class*="panel"],[class*="tree"],[class*="cm-"]')]
    .slice(0, 25)
    .map((c) => ({ tag: c.tagName, cls: c.className }))
  return out
})
console.log(JSON.stringify(info, null, 2))
await browser.close()
