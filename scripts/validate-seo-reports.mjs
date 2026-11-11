#!/usr/bin/env node
/**
 * 校验 data/gsc 与 data/bing 的搜索报表是否具备「可归因」维度。
 *
 * 用法：
 *   node scripts/validate-seo-reports.mjs
 *   node scripts/validate-seo-reports.mjs --strict   # 缺维度时以非 0 退出（适合 CI）
 *
 * 无第三方依赖。.xlsx 的 sheet 检查仅在 python3 + openpyxl 可用时执行。
 * 只做检查，不改写任何报表文件。
 */
import { readdirSync, readFileSync, existsSync } from 'node:fs'
import { resolve, join } from 'node:path'
import { execFileSync } from 'node:child_process'

const root = resolve(process.cwd())
const dirs = ['data/gsc', 'data/bing']
const strict = process.argv.includes('--strict')

// 中英文列名归一后匹配；Bing 中文导出与 GSC 英文导出都要能识别
const aliases = {
  query: ['query', 'queries', 'topqueries', '关键词', '查询', '搜索词', '查询词'],
  page: ['page', 'pages', 'toppages', 'url', '页面', '网址', '着陆页'],
  clicks: ['clicks', '点击', '点击次数', '点击量'],
  impressions: ['impressions', '印象数', '展示次数', '曝光', '曝光量'],
  ctr: ['ctr', '点击率', '平均点击率'],
  position: ['position', 'averageposition', 'avgposition', '排名', '平均排名', '平均排名位置'],
  date: ['date', '日期', '时间'],
}

const normalize = s => String(s ?? '')
  .replace(/^\uFEFF/, '')
  .trim()
  .toLowerCase()
  .replace(/[\s_\-]/g, '')

function parseCsvLine(line) {
  const cells = []
  let cur = ''
  let quoted = false
  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (c === '"') {
      if (quoted && line[i + 1] === '"') { cur += '"'; i++ }
      else quoted = !quoted
    } else if (c === ',' && !quoted) {
      cells.push(cur.trim()); cur = ''
    } else cur += c
  }
  cells.push(cur.trim())
  return cells
}

function detectColumns(header) {
  const found = {}
  header.forEach((raw, i) => {
    const n = normalize(raw)
    for (const [key, names] of Object.entries(aliases)) {
      if (found[key] !== undefined) continue
      if (names.some(a => n === normalize(a) || n.includes(normalize(a)))) found[key] = i
    }
  })
  return found
}

function inspectCsv(file) {
  const lines = readFileSync(file, 'utf-8').split(/\r?\n/).filter(l => l.trim())
  if (!lines.length) return { error: '空文件' }
  const cols = detectColumns(parseCsvLine(lines[0]))
  const dates = []
  if (cols.date !== undefined) {
    for (const line of lines.slice(1)) {
      const cell = parseCsvLine(line)[cols.date]
      const m = cell?.match(/(\d{4})[-/](\d{1,2})[-/](\d{1,2})/)
      if (m) dates.push(`${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`)
    }
  }
  return {
    rows: lines.length - 1,
    cols: Object.keys(cols),
    range: dates.length ? `${dates[0]} → ${dates[dates.length - 1]} (${dates.length} 天)` : '无日期列',
  }
}

function inspectXlsx(file) {
  try {
    const out = execFileSync('python3', ['-c', [
      'import openpyxl,warnings,json,sys',
      'warnings.filterwarnings("ignore")',
      'wb=openpyxl.load_workbook(sys.argv[1],read_only=True,data_only=True)',
      'r={}',
      'for w in wb:',
      ' rows=list(w.iter_rows(values_only=True))[:1]',
      ' r[w.title]={"rows":w.max_row,"header":[str(c) for c in (rows[0] if rows else [])]}',
      'print(json.dumps(r,ensure_ascii=False))',
    ].join('\n'), file], { encoding: 'utf-8', stdio: ['ignore', 'pipe', 'ignore'] })
    return { sheets: JSON.parse(out.trim()) }
  } catch {
    return { sheets: null, note: '未检测到 python3 + openpyxl，跳过 xlsx 内部结构检查' }
  }
}

const report = {}
for (const dir of dirs) {
  const abs = join(root, dir)
  if (!existsSync(abs)) { report[dir] = { files: [], error: '目录不存在' }; continue }
  const files = readdirSync(abs).filter(f => /\.(csv|xlsx|json)$/i.test(f) && !f.startsWith('.'))
  report[dir] = {
    files: files.map(f => {
      const file = join(abs, f)
      return { name: f, ...(f.endsWith('.csv') ? inspectCsv(file) : inspectXlsx(file)) }
    }),
  }
}

console.log('=== 搜索报表归因就绪度 ===')
let ready = true

for (const [dir, info] of Object.entries(report)) {
  console.log(`\n[${dir}]`)
  if (info.error) { console.log(' ', info.error); ready = false; continue }
  if (!info.files.length) { console.log('  无报表文件'); ready = false; continue }

  for (const f of info.files) {
    console.log(`  ${f.name}`)
    if (f.error) { console.log('   ', f.error); ready = false; continue }
    if (f.sheets) {
      for (const [name, meta] of Object.entries(f.sheets)) {
        console.log(`    sheet "${name}": ${meta.rows} 行, 表头 ${meta.header.join(' | ')}`)
      }
      continue
    }
    if (f.note) console.log('   ', f.note)
    console.log(`    数据行 ${f.rows}，日期 ${f.range}`)
    console.log(`    识别到维度: ${f.cols.length ? f.cols.join(', ') : '（无）'}`)
  }

  // 汇总可用维度：CSV 看表头，xlsx 看各 sheet 表头
  const units = []
  for (const f of info.files) {
    if (f.cols) units.push({ name: f.name, cols: f.cols })
    if (f.sheets) {
      for (const [name, meta] of Object.entries(f.sheets)) {
        if (['Filters', 'Chart', 'Devices', 'Countries', 'Search appearance'].includes(name)) continue
        units.push({ name: `${f.name} / ${name}`, cols: Object.keys(detectColumns(meta.header)) })
      }
    }
  }
  const hasQuery = units.some(u => u.cols.includes('query'))
  const hasPage = units.some(u => u.cols.includes('page'))
  const hasBoth = units.some(u => u.cols.includes('query') && u.cols.includes('page'))
  console.log(`  维度覆盖: query=${hasQuery ? '有' : '缺'} page=${hasPage ? '有' : '缺'} query×page 同表=${hasBoth ? '有' : '缺'}`)
  if (!hasQuery || !hasPage) {
    console.log('  → 归因未就绪：缺少 query 或 page 维度，按 README 补导')
    ready = false
  } else if (!hasBoth) {
    console.log('  → 维度齐全但缺 query×page 映射：可分表对齐，无法确认某个词由哪个 URL 承接，仍需补导')
    ready = false
  } else {
    console.log('  → 归因就绪')
  }
}

console.log('\n=== 口径提醒 ===')
console.log('- GSC 与 Bing 的 impressions 统计口径不同，禁止相加、禁止直接比较绝对值。')
console.log('- GSC 的点击数以 Pages 表为准；Queries 表因长尾匿名化会显著偏低。')
console.log('- 对比两引擎前，必须先把日期范围对齐。')
console.log(`\n结论：${ready ? '归因数据已就绪' : '归因数据未就绪（见上方缺失维度）'}`)

if (strict && !ready) process.exit(1)
