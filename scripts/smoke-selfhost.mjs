#!/usr/bin/env node
/**
 * HTTP smoke test for a running self-hosted container.
 *
 *   docker compose up -d
 *   node scripts/smoke-selfhost.mjs --base http://127.0.0.1:8080
 *
 * Exits non-zero on the first failed assertion. Run by the developer — it needs
 * a running container, so it is never part of `pnpm test`.
 */

const args = process.argv.slice(2)
const base = (args[args.indexOf('--base') + 1] || 'http://127.0.0.1:8080').replace(/\/$/, '')

let failures = 0
function check(name, ok, detail = '') {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`)
  if (!ok) failures += 1
}

async function head(path) {
  const res = await fetch(base + path, { redirect: 'manual' })
  const type = res.headers.get('content-type') || ''
  const text = res.status === 200 ? await res.text() : ''
  return { status: res.status, type, text, cache: res.headers.get('cache-control') || '' }
}

// Locate the worker chunk from the built HTML of the large-file viewer page.
async function findWorkerChunk() {
  const page = await head('/tools/view/large-json-viewer')
  const m = page.text.match(/\/_nuxt\/[^"'()\s]*recordStream\.worker[^"'()\s]*\.js/)
  return m ? m[0] : null
}

const results = []
for (const path of ['/', '/zh', '/tools', '/tools/format/json-editor']) {
  const r = await head(path)
  results.push([`GET ${path} → 200 HTML`, r.status === 200 && r.type.includes('text/html'), `${r.status} ${r.type}`])
}

const missing = await head('/this-page-does-not-exist')
results.push(['缺失页面 → 404', missing.status === 404, `${missing.status} ${missing.type}`])

const missingAsset = await head('/_nuxt/definitely-missing.js')
results.push([
  '缺失 JS → 404 且非 HTML',
  missingAsset.status === 404 && !missingAsset.type.includes('text/html'),
  `${missingAsset.status} ${missingAsset.type || '(no content-type)'}`,
])

const worker = await findWorkerChunk()
if (worker) {
  const r = await head(worker)
  results.push([
    `Worker chunk ${worker} → 200 JS`,
    r.status === 200 && /javascript/.test(r.type),
    `${r.status} ${r.type}`,
  ])
} else {
  results.push(['Worker chunk 可定位', false, '未在 large-json-viewer 页面中找到 recordStream.worker-*.js'])
}

const rc = await head('/runtime-config.json')
results.push([
  '/runtime-config.json → 200 + no-store',
  rc.status === 200 && rc.cache.includes('no-store'),
  `${rc.status} ${rc.cache}`,
])

const robots = await head('/robots.txt')
results.push(['/robots.txt 含 Disallow: /', robots.status === 200 && /Disallow:\s*\//.test(robots.text), `${robots.status}`])

const llms = await head('/llms.txt')
results.push(['/llms.txt → 200', llms.status === 200, `${llms.status}`])

for (const [name, ok, detail] of results) check(name, ok, detail)

console.log(failures ? `\n${failures} 项失败` : '\n全部通过')
process.exit(failures ? 1 : 0)
