// Record a real-browser demo for a GitHub Release.
//
// Records the live site by default so the generated iframe code shows the
// public URL. To record a local build instead:
//   pnpm dev
//   node scripts/release-demo.mjs --base http://localhost:3000
//
// Requires puppeteer-core, a local Google Chrome and ffmpeg. Frames come from
// the real UI (never AI-generated) and are encoded to WebP, GIF and MP4.

import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import puppeteer from 'puppeteer-core'

const ROOT = path.resolve(fileURLToPath(import.meta.url), '../..')
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const MOD = process.platform === 'darwin' ? 'Meta' : 'Control'
const WIDTH = 1120
const HEIGHT = 720
const FPS = 10

function arg(name, fallback) {
  const i = process.argv.indexOf(name)
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback
}

const BASE = arg('--base', 'https://jsontoolbox.cc').replace(/\/$/, '')
const NAME = arg('--name', 'v1.0.0-embed')
const OUT = path.resolve(ROOT, arg('--out', 'public/screenshots'))
const framesDir = fs.mkdtempSync(path.join(os.tmpdir(), 'jt-release-demo-'))
let frameNo = 0

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function hold(page, count) {
  for (let i = 0; i < count; i++) {
    await page.screenshot({ path: path.join(framesDir, `frame-${String(frameNo++).padStart(4, '0')}.png`) })
    await sleep(1000 / FPS)
  }
  process.stdout.write(`  frame ${frameNo}\n`)
}

async function goto(page, route) {
  await page.goto(BASE + route, { waitUntil: 'domcontentloaded', timeout: 45000 })
  await page.waitForSelector('body', { timeout: 15000 })
  await sleep(1800)
}

async function clickByText(page, selector, text) {
  const handles = await page.$$(selector)
  for (const handle of handles) {
    const label = await handle.evaluate((el) => el.textContent.trim())
    if (label.includes(text)) {
      await handle.click()
      return true
    }
  }
  throw new Error(`No ${selector} containing "${text}"`)
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true })
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
  })
  try {
    const page = await browser.newPage()
    await page.setViewport({ width: WIDTH, height: HEIGHT, deviceScaleFactor: 1 })
    await page.evaluateOnNewDocument(() => {
      try { localStorage.setItem('cookie-consent', 'accepted') } catch {}
    })

    console.log('scene 1/2: embed generator')
    await goto(page, '/embed')
    await hold(page, 18)
    await page.select('select', 'json-to-csv')
    await hold(page, 16)
    await clickByText(page, 'button', 'dark')
    await hold(page, 14)
    await clickByText(page, 'button', 'Copy code')
    await page.waitForFunction(
      () => [...document.querySelectorAll('button')].some((b) => b.textContent.includes('Copied!')),
      { timeout: 3000 },
    ).catch(() => {})
    await hold(page, 16)

    console.log('scene 2/2: input handoff')
    await goto(page, '/tools/convert/json-to-csv')
    await page.waitForSelector('.rp-panel-first .cm-content', { timeout: 15000 })
    await page.evaluate(() => window.scrollTo(0, 0))
    await hold(page, 16)

    await page.click('.rp-panel-first .cm-content')
    await page.keyboard.down(MOD)
    await page.keyboard.press('KeyA')
    await page.keyboard.up(MOD)
    await page.keyboard.press('Backspace')
    await hold(page, 12)

    await clickByText(page, 'button', 'Example')
    await clickByText(page, 'button', 'User List')
    // Wait for the preview to re-render too, otherwise the GIF catches a
    // transient red "Unable to generate output" state.
    await page.waitForFunction(
      () => document.querySelector('.rp-panel-second')?.textContent?.includes('Alice'),
      { timeout: 10000 },
    )
    await page.evaluate(() => window.scrollTo(0, 0))
    await hold(page, 20)

    await page.waitForFunction(
      () => document.querySelector('section.mt-8 a')?.getAttribute('href')?.includes('#in='),
      { timeout: 8000 },
    )
    await hold(page, 14)

    const link = await page.$('section.mt-8 a')
    await link.click()
    await page.waitForFunction(
      () => location.pathname.includes('json-to-yaml') && location.hash.includes('#in='),
      { timeout: 15000 },
    )
    await page.waitForFunction(
      () => document.querySelector('.rp-panel-first .cm-content')?.textContent?.includes('Alice'),
      { timeout: 10000 },
    )
    // Clicking a link far down the page leaves the scroll position behind.
    await page.evaluate(() => window.scrollTo(0, 0))
    await sleep(400)
    await hold(page, 22)
  } finally {
    await browser.close()
  }

  const input = path.join(framesDir, 'frame-%04d.png')
  const outputs = {
    webp: path.join(OUT, `${NAME}.webp`),
    gif: path.join(OUT, `${NAME}.gif`),
    mp4: path.join(OUT, `${NAME}.mp4`),
  }

  console.log(`encoding ${frameNo} frames (${(frameNo / FPS).toFixed(1)}s)`)
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', input,
    '-c:v', 'libwebp', '-lossless', '0', '-q:v', '45', '-compression_level', '6', '-loop', '0', outputs.webp])
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', input,
    '-vf', `scale=${WIDTH}:-2:flags=lanczos,split[a][b];[a]palettegen=max_colors=128[p];[b][p]paletteuse=dither=bayer`,
    '-loop', '0', outputs.gif])
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', input,
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '23', outputs.mp4])

  for (const [kind, file] of Object.entries(outputs)) {
    console.log(`${kind}: ${path.relative(ROOT, file)} (${(fs.statSync(file).size / 1024 / 1024).toFixed(2)} MB)`)
  }
  fs.rmSync(framesDir, { recursive: true, force: true })
}

main().catch((err) => {
  console.error(err)
  fs.rmSync(framesDir, { recursive: true, force: true })
  process.exit(1)
})
