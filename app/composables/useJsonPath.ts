/**
 * JSONPath evaluation (deliberately a BASIC SUBSET, not full JSONPath).
 *
 * Supported: `$`, `.key`, `['key']`, `[n]`, `*` (wildcard), `$..key`
 * (recursive descent), and simple filters `[?(@.x=="y")]` / `[?(@.x!=1)]`.
 * Not supported: slices, unions, script expressions, `=~`, functions.
 *
 * Results are returned as **internal tree paths** (`store.books[0].title`,
 * not `$.store…`) so they drop straight into the tree's search state —
 * `valueAtPath`, `isMatch` and jump/flash all key off that format.
 */
export interface JsonPathMatch {
  path: string
  value: unknown
}

const MAX_MATCHES = 5000

type Segment =
  | { type: 'key'; key: string }
  | { type: 'index'; index: number }
  | { type: 'wildcard' }
  | { type: 'recursive' }
  | { type: 'filter'; expr: string }

/**
 * Parse a JSONPath expression into segments.
 * Returns `null` when the syntax is unsupported/invalid.
 */
export function parseJsonPathExpression(expr: string): Segment[] | null {
  const raw = expr.trim()
  if (!raw) return null
  let s = raw
  if (s.startsWith('$')) s = s.slice(1)
  if (!s) return [] // "$" alone → root

  const segs: Segment[] = []
  let i = 0
  while (i < s.length) {
    const ch = s[i]

    if (ch === '.') {
      // `..` recursive descent
      if (s[i + 1] === '.') {
        segs.push({ type: 'recursive' })
        i += 2
        if (i >= s.length) return null // trailing `..` with nothing to match
        continue
      }
      i++
      if (i >= s.length) return null // trailing dot
      if (s[i] === '[') continue // handled on the next iteration
      if (s[i] === '*') {
        segs.push({ type: 'wildcard' })
        i++
        continue
      }
      const key = readKey(s, i)
      if (!key) return null
      segs.push({ type: 'key', key })
      i += key.length
      continue
    }

    if (ch === '[') {
      const close = s.indexOf(']', i)
      if (close === -1) return null
      const inner = s.slice(i + 1, close).trim()
      if (!inner) return null
      if (inner === '*') {
        segs.push({ type: 'wildcard' })
      } else if (/^\d+$/.test(inner)) {
        segs.push({ type: 'index', index: Number(inner) })
      } else if (inner.startsWith('?(') && inner.endsWith(')')) {
        segs.push({ type: 'filter', expr: inner.slice(2, -1) })
      } else if (/^'.*'$/.test(inner) || /^".*"$/.test(inner)) {
        segs.push({ type: 'key', key: inner.slice(1, -1) })
      } else {
        segs.push({ type: 'key', key: inner })
      }
      i = close + 1
      continue
    }

    if (ch === '*') {
      segs.push({ type: 'wildcard' })
      i++
      continue
    }

    // Bare key (e.g. `store.book` without a leading dot)
    const key = readKey(s, i)
    if (!key) return null
    if (key === '*') segs.push({ type: 'wildcard' })
    else segs.push({ type: 'key', key })
    i += key.length
  }

  return segs
}

function readKey(s: string, from: number): string {
  let j = from
  while (j < s.length && s[j] !== '.' && s[j] !== '[') j++
  return s.slice(from, j)
}

function childPath(parent: string, key: string): string {
  return parent ? `${parent}.${key}` : key
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

/** Yield every descendant (not the node itself) with its internal path. */
function eachDescendant(node: unknown, path: string, visit: (v: unknown, p: string) => void): void {
  if (Array.isArray(node)) {
    for (let i = 0; i < node.length; i++) {
      const p = `${path}[${i}]`
      visit(node[i], p)
      eachDescendant(node[i], p, visit)
    }
  } else if (isPlainObject(node)) {
    for (const key of Object.keys(node)) {
      const p = childPath(path, key)
      visit(node[key], p)
      eachDescendant(node[key], p, visit)
    }
  }
}

function parseLiteral(text: string): unknown {
  const s = text.trim()
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    return s.slice(1, -1)
  }
  if (s === 'true') return true
  if (s === 'false') return false
  if (s === 'null') return null
  const n = Number(s)
  return Number.isNaN(n) ? s : n
}

/** Supports `@.field == value` / `@.field != value` only. */
function matchFilter(value: unknown, expr: string): boolean {
  const m = /^@\.([A-Za-z0-9_$-]+)\s*(==|!=)\s*(.+)$/.exec(expr.trim())
  if (!m) return false
  const [, key, operator, rawRight] = m
  if (!isPlainObject(value)) return false
  const left = value[key]
  const right = parseLiteral(rawRight)
  const equal = String(left) === String(right)
  return operator === '==' ? equal : !equal
}

function walk(
  current: unknown,
  currentPath: string,
  segs: Segment[],
  index: number,
  out: JsonPathMatch[],
): void {
  if (out.length >= MAX_MATCHES) return
  if (index >= segs.length) {
    out.push({ path: currentPath, value: current })
    return
  }

  const seg = segs[index]
  const next = index + 1

  switch (seg.type) {
    case 'recursive': {
      // Match the remainder at this node and at every descendant.
      walk(current, currentPath, segs, next, out)
      eachDescendant(current, currentPath, (v, p) => {
        if (out.length < MAX_MATCHES) walk(v, p, segs, next, out)
      })
      break
    }
    case 'key': {
      if (isPlainObject(current) && seg.key in current) {
        walk(current[seg.key], childPath(currentPath, seg.key), segs, next, out)
      }
      break
    }
    case 'index': {
      if (Array.isArray(current) && seg.index >= 0 && seg.index < current.length) {
        walk(current[seg.index], `${currentPath}[${seg.index}]`, segs, next, out)
      }
      break
    }
    case 'wildcard': {
      if (Array.isArray(current)) {
        for (let i = 0; i < current.length && out.length < MAX_MATCHES; i++) {
          walk(current[i], `${currentPath}[${i}]`, segs, next, out)
        }
      } else if (isPlainObject(current)) {
        for (const key of Object.keys(current)) {
          if (out.length >= MAX_MATCHES) break
          walk(current[key], childPath(currentPath, key), segs, next, out)
        }
      }
      break
    }
    case 'filter': {
      if (Array.isArray(current)) {
        for (let i = 0; i < current.length && out.length < MAX_MATCHES; i++) {
          if (matchFilter(current[i], seg.expr)) {
            walk(current[i], `${currentPath}[${i}]`, segs, next, out)
          }
        }
      }
      break
    }
  }
}

/**
 * Evaluate a JSONPath expression against `data`.
 * Returns `null` when the expression is unsupported or invalid.
 */
export function evaluateJsonPath(data: unknown, expr: string): JsonPathMatch[] | null {
  const trimmed = expr.trim()
  if (!trimmed) return null
  if (trimmed === '$') return [{ path: '', value: data }]

  const segs = parseJsonPathExpression(trimmed)
  if (!segs) return null

  const out: JsonPathMatch[] = []
  walk(data, '', segs, 0, out)
  return out
}
