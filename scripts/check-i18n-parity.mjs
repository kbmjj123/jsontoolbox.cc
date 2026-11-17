// Verify that every de locale block mirrors its en counterpart:
// identical key paths, array lengths, interpolation tokens, and non-empty values.
// Run: node scripts/check-i18n-parity.mjs
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (p) => JSON.parse(fs.readFileSync(path.join(root, p), 'utf8'))
const tokens = (s) => [...String(s).matchAll(/\{([^}]+)\}/g)].map((m) => m[1]).sort()

const leaves = (obj, pre = '', out = new Map()) => {
  for (const [k, v] of Object.entries(obj ?? {})) {
    const p = pre ? `${pre}.${k}` : k
    if (v && typeof v === 'object' && !Array.isArray(v)) leaves(v, p, out)
    else out.set(p, v)
  }
  return out
}

let issues = 0
function compare(label, en, de) {
  const A = leaves(en)
  const B = leaves(de)
  const missing = [...A.keys()].filter((k) => !B.has(k))
  const extra = [...B.keys()].filter((k) => !A.has(k))
  const empty = [...B.keys()].filter((k) => B.get(k) === '' || B.get(k) == null)
  // HTML rich-text fields contain literal { } braces inside <code> examples —
  // those are not vue-i18n interpolation placeholders, so skip token checks there.
  const isHtmlField = (k) => /\.(content|trustHtml)$/.test(k)
  const tokenBad = [...A.keys()].filter((k) => B.has(k) && !isHtmlField(k) &&
    JSON.stringify(tokens(A.get(k))) !== JSON.stringify(tokens(B.get(k))))
  // arrays must keep the same length (features/faq/guide/keywords/verifySteps...)
  const arrays = []
  const walk = (a, b, p = '') => {
    for (const k of Object.keys(a ?? {})) {
      const key = p ? `${p}.${k}` : k
      const av = a[k], bv = b?.[k]
      if (Array.isArray(av)) {
        if (!Array.isArray(bv) || bv.length !== av.length) arrays.push(`${key}: ${av.length} != ${Array.isArray(bv) ? bv.length : 'n/a'}`)
      } else if (av && typeof av === 'object') walk(av, bv, key)
    }
  }
  walk(en, de)

  const problems = [...missing.map((k) => `MISSING ${k}`), ...extra.map((k) => `EXTRA ${k}`),
    ...empty.map((k) => `EMPTY ${k}`), ...tokenBad.map((k) => `TOKEN ${k}: ${JSON.stringify(tokens(A.get(k)))} != ${JSON.stringify(tokens(B.get(k)))}`),
    ...arrays.map((a) => `ARRAY ${a}`)]
  if (problems.length) {
    issues += problems.length
    console.log(`\n[FAIL] ${label}: ${problems.length} issue(s)`)
    problems.forEach((p) => console.log(`  - ${p}`))
  } else {
    console.log(`[ok] ${label} (${A.size} leaves)`)
  }
}

// i18n locale file
compare('i18n/de.json', read('i18n/locales/en.json'), read('i18n/locales/de.json'))

// tool JSONs + category metas
const dataDir = path.join(root, 'app/assets/data')
for (const cat of fs.readdirSync(dataDir, { withFileTypes: true })
  .filter((e) => e.isDirectory() && e.name !== 'examples')) {
  for (const f of fs.readdirSync(path.join(dataDir, cat.name)).filter((f) => f.endsWith('.json'))) {
    const rel = `app/assets/data/${cat.name}/${f}`
    const d = read(rel)
    if (!d.en || !d.de) { console.log(`\n[FAIL] ${rel}: missing en or de block`); issues++; continue }
    compare(rel, d.en, d.de)
  }
}

// example labels
for (const f of fs.readdirSync(path.join(dataDir, 'examples')).filter((f) => f.endsWith('.json'))) {
  const rel = `app/assets/data/examples/${f}`
  const arr = read(rel)
  arr.forEach((e, i) => {
    for (const k of ['label_en', 'label_zh', 'label_de']) {
      if (!e[k]) { console.log(`\n[FAIL] ${rel}[${i}].${k} missing`); issues++ }
    }
  })
}

console.log(issues ? `\nFAILED with ${issues} issue(s)` : '\nPASS: de parity OK')
process.exit(issues ? 1 : 0)
