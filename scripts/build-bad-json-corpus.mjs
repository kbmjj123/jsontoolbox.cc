#!/usr/bin/env node
/**
 * Build a systematic bad-JSON corpus and pre-generate a `#in=` deep link for
 * each entry. The link opens the JSON Repair tool with the sample preloaded so
 * the parse error is reproducible in the browser.
 *
 * Error messages are captured by actually running JSON.parse() in Node (V8),
 * so every `expectedError` field is a real, verifiable fact — not hand-written.
 *
 * The wire format matches app/utils/share/codec.ts exactly:
 *   "jtb1d" header + deflate-raw bytes, then base64url.
 */
import { deflateRawSync, inflateRawSync } from 'node:zlib'
import { writeFileSync, mkdirSync } from 'node:fs'

const HEADER = Buffer.from('jtb1d')
const ORIGIN = process.env.JSON_TOOLBOX_ORIGIN || 'https://jsontoolbox.cc'
const TOOL = 'json-repair'

const CATEGORIES = {
  'truncated-response': { en: 'Truncated response', zh: '响应被截断' },
  'trailing-comma': { en: 'Trailing comma', zh: '尾随逗号' },
  'unquoted-keys': { en: 'Unquoted keys', zh: '未加引号的键' },
  'single-quotes': { en: 'Single-quoted strings', zh: '单引号字符串' },
  'comments': { en: 'Comments', zh: '注释' },
  'python-constants': { en: 'Python constants', zh: 'Python 常量' },
  'js-constants': { en: 'JavaScript constants', zh: 'JavaScript 常量' },
  'concatenated-json': { en: 'Concatenated JSON', zh: '拼接的 JSON' },
  'html-error-page': { en: 'HTML error page', zh: 'HTML 错误页' },
  'missing-comma': { en: 'Missing comma', zh: '缺少逗号' },
  'invalid-escape': { en: 'Invalid escape sequence', zh: '非法转义' },
  'encoding-bom': { en: 'UTF-8 BOM prefix', zh: 'UTF-8 BOM 前缀' },
  'bson-like': { en: 'BSON-like literals', zh: 'BSON 风格字面量' },
  'valid-control': { en: 'Valid JSON (control group)', zh: '合法 JSON（对照组）' },
}

// Inputs use real newlines and doubled backslashes where a literal backslash
// is intended. JSON.parse() is run against each to capture the real error.
const ITEMS = [
  {
    id: 'corpus-001', category: 'truncated-response',
    title_en: 'API response cut off inside an object',
    title_zh: '接口响应在对象中途被截断',
    description_en: 'Backend or proxy truncated the JSON — common with timeouts or oversized responses.',
    description_zh: '后端或代理在 JSON 中途截断，常见于超时或超大响应。',
    input: `{
  "success": true,
  "data": {
    "id": 12345,
    "name": "Alice"`,
  },
  {
    id: 'corpus-002', category: 'trailing-comma',
    title_en: 'Trailing comma after the last element',
    title_zh: '最后一个元素后的尾随逗号',
    description_en: 'Hand-written or pretty-printed JSON often leaves a trailing comma that strict JSON rejects.',
    description_zh: '手写或格式化后的 JSON 常残留尾随逗号，标准 JSON 不接受。',
    input: `{
  "name": "Alice",
  "age": 30,
}`,
  },
  {
    id: 'corpus-003', category: 'unquoted-keys',
    title_en: 'Object keys without quotes',
    title_zh: '对象的键没有加引号',
    description_en: 'Config files and JS object literals leave keys unquoted; JSON requires double quotes.',
    description_zh: '配置文件与 JS 对象字面量常省略键名引号，而 JSON 要求双引号。',
    input: `{
  host: 'localhost',
  port: 5432,
  ssl: true
}`,
  },
  {
    id: 'corpus-004', category: 'single-quotes',
    title_en: 'Single-quoted strings',
    title_zh: '单引号字符串',
    description_en: 'JSON strings must use double quotes; single quotes come from JS or shell snippets.',
    description_zh: 'JSON 字符串必须用双引号，单引号来自 JS 或 shell 片段。',
    input: `{
  'name': 'Alice',
  'age': 28
}`,
  },
  {
    id: 'corpus-005', category: 'comments',
    title_en: 'Line and block comments',
    title_zh: '行注释与块注释',
    description_en: 'JSON has no comment syntax, but config and code samples often include them.',
    description_zh: 'JSON 没有注释语法，但配置与代码示例常带注释。',
    input: `// server config
{
  "debug": true,
  "level": "info"
}`,
  },
  {
    id: 'corpus-006', category: 'python-constants',
    title_en: 'Python constants True / False / None',
    title_zh: 'Python 常量 True / False / None',
    description_en: 'Dumped from Python dicts without json.dumps(); constants are not valid JSON.',
    description_zh: '未用 json.dumps() 直接打印的 Python 字典，常量不是合法 JSON。',
    input: `{
  "active": True,
  "ratio": NaN,
  "retry": False
}`,
  },
  {
    id: 'corpus-007', category: 'js-constants',
    title_en: 'JavaScript constants undefined / NaN / Infinity',
    title_zh: 'JavaScript 常量 undefined / NaN / Infinity',
    description_en: 'console.log of a JS object embeds these tokens, which JSON rejects.',
    description_zh: '直接打印 JS 对象会带这些记号，JSON 不接受。',
    input: `{
  "value": undefined,
  "score": Infinity
}`,
  },
  {
    id: 'corpus-008', category: 'concatenated-json',
    title_en: 'Two JSON documents concatenated',
    title_zh: '两段 JSON 被拼接在一起',
    description_en: 'Streamed or appended responses glue multiple top-level values together.',
    description_zh: '流式输出或拼接响应把多个顶层值粘在一起。',
    input: `{"ok": true}
{"ok": false}`,
  },
  {
    id: 'corpus-009', category: 'html-error-page',
    title_en: 'HTML error page returned instead of JSON',
    title_zh: '返回的是 HTML 错误页而非 JSON',
    description_en: 'A 502/504 from a gateway or a login redirect returns HTML; parsing it as JSON fails.',
    description_zh: '网关 502/504 或登录跳转返回了 HTML，按 JSON 解析必然失败。',
    input: `<!DOCTYPE html>
<html><head><title>502 Bad Gateway</title></head>
<body><h1>502 Bad Gateway</h1></body></html>`,
  },
  {
    id: 'corpus-010', category: 'missing-comma',
    title_en: 'Missing comma between properties',
    title_zh: '属性之间缺少逗号',
    description_en: 'A forgotten separator between two object members.',
    description_zh: '两个对象成员之间漏写了分隔逗号。',
    input: `{
  "name": "Ada"
  "role": "admin"
}`,
  },
  {
    id: 'corpus-011', category: 'invalid-escape',
    title_en: 'Invalid backslash escape in a Windows path',
    title_zh: 'Windows 路径中的非法反斜杠转义',
    description_en: 'Windows paths use single backslashes; \\U and \\a are not valid JSON escape sequences.',
    description_zh: 'Windows 路径使用单反斜杠，\\U 与 \\a 不是合法的 JSON 转义序列。',
    input: `{"path": "C:\\Users\\admin"}`,
  },
  {
    id: 'corpus-012', category: 'encoding-bom',
    title_en: 'UTF-8 BOM prefix',
    title_zh: 'UTF-8 BOM 前缀',
    description_en: 'Files saved by some editors start with U+FEFF, which strict JSON.parse rejects.',
    description_zh: '部分编辑器保存的文件以 U+FEFF 开头，严格 JSON.parse 会拒绝。',
    input: `\uFEFF{"name": "Alice"}`,
  },
  {
    id: 'corpus-013', category: 'bson-like',
    title_en: 'BSON-style literals ObjectId / ISODate',
    title_zh: 'BSON 风格字面量 ObjectId / ISODate',
    description_en: 'Pasted from MongoDB shell output; the wrappers are not JSON.',
    description_zh: '从 MongoDB shell 输出复制而来，包装函数不是 JSON。',
    input: `{
  "_id": ObjectId("507f1f77bcf86cd799439011"),
  "created": ISODate("2024-01-01T00:00:00Z")
}`,
  },
  {
    id: 'corpus-014', category: 'valid-control',
    title_en: 'Valid JSON (control group)',
    title_zh: '合法 JSON（对照组）',
    description_en: 'A well-formed document — used to confirm the tool accepts valid input.',
    description_zh: '格式正确的文档，用于确认工具能正常接受合法输入。',
    input: `{
  "name": "Ada Lovelace",
  "active": true,
  "roles": ["admin", "editor"]
}`,
  },
]

const encode = (text) => {
  const payload = JSON.stringify({ version: 1, text })
  const compressed = deflateRawSync(Buffer.from(payload, 'utf8'), { level: 6 })
  return Buffer.concat([HEADER, compressed])
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

const items = ITEMS.map((it) => {
  if (!(it.category in CATEGORIES)) {
    throw new Error(`Unknown category for ${it.id}: ${it.category}`)
  }
  let expectedError = null
  try {
    JSON.parse(it.input)
  } catch (err) {
    expectedError = err.message
  }
  const encoded = encode(it.input)
  // Self-check: the encoded payload must decode back to the same input.
  const roundTrip = Buffer.from(encoded.replace(/-/g, '+').replace(/_/g, '/'), 'base64')
  if (roundTrip.subarray(0, HEADER.length).toString() !== 'jtb1d') {
    throw new Error(`Header mismatch for ${it.id}`)
  }
  const decoded = inflateRawSync(roundTrip.subarray(HEADER.length)).toString('utf8')
  const decodedText = JSON.parse(decoded).text
  if (decodedText !== it.input) {
    throw new Error(`Round-trip mismatch for ${it.id}`)
  }
  return {
    ...it,
    expectedError,
    deepLink: `${ORIGIN}/tools/format/${TOOL}#in=${encoded}`,
  }
})

const corpus = {
  name: 'Bad JSON Corpus',
  description: 'Real-world invalid/malformed JSON samples, numbered and grouped by error type. Each entry carries a #in= deep link that opens the JSON Repair tool with the sample preloaded so the parse error is reproducible.',
  description_zh: '真实场景中的非法/损坏 JSON 样本，按错误类型编号分类。每条都附带 #in= 深链，可一键在 JSON Repair 工具中预载样本、复现报错。',
  generatedAt: new Date().toISOString().slice(0, 10),
  tool: TOOL,
  categories: Object.entries(CATEGORIES).map(([id, label]) => ({ id, ...label })),
  items,
}

mkdirSync('public/data', { recursive: true })
writeFileSync('public/data/bad-json-corpus.json', JSON.stringify(corpus, null, 2) + '\n')
console.log(`Wrote ${items.length} items to public/data/bad-json-corpus.json`)
