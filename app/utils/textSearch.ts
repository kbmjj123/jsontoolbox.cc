/**
 * Pure text-search helpers for the Large JSON Viewer.
 *
 * Kept free of any `self`/Worker/DOM usage so the same code can run inside the
 * Web Worker and inside a plain Node verification script.
 */

export interface SearchTextHit {
  index: number
  /** 1-based */
  line: number
  /** 1-based */
  column: number
  offset: number
  /** JSONPath — filled in a later phase; optional for now */
  path?: string
  preview: string
}

export interface SearchTextOptions {
  mode: 'key' | 'value' | 'path' | 'all'
  caseSensitive?: boolean
  limit?: number
  /** When true, `query` is treated as a regular expression (compiled with the
   *  given `regexFlags`, defaulting to `i` unless `caseSensitive`). */
  isRegex?: boolean
  regexFlags?: string
}

export interface SearchTextProgress {
  scanned: number
  total: number
  matches: number
}

/** Offset of every line, including empty ones. Offset[0] is always 0. */
export function buildLineOffsets(text: string): Uint32Array {
  const out: number[] = [0]
  const n = text.length
  for (let i = 0; i < n; i++) {
    if (text.charCodeAt(i) === 10) out.push(i + 1)
  }
  return new Uint32Array(out)
}

/** Map a character offset to 1-based line/column. */
export function offsetToLineCol(
  lineOffsets: Uint32Array,
  offset: number,
): { line: number; column: number } {
  let lo = 0
  let hi = lineOffsets.length - 1
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1
    if (lineOffsets[mid] <= offset) lo = mid
    else hi = mid - 1
  }
  return { line: lo + 1, column: offset - lineOffsets[lo] + 1 }
}

export function searchTextScan(
  text: string,
  lineOffsets: Uint32Array,
  query: string,
  opts: SearchTextOptions,
  onProgress?: (p: SearchTextProgress) => void,
  chunkSize = 1 << 20,
): { hits: SearchTextHit[]; truncated: boolean } {
  const limit = opts.limit ?? 5000
  const hits: SearchTextHit[] = []
  if (!query) return { hits, truncated: false }

  const needle = opts.caseSensitive ? query : query.toLowerCase()
  const hay = opts.caseSensitive ? text : text.toLowerCase()
  const n = hay.length
  let scanned = 0
  let lastProgress = 0

  while (scanned < n) {
    const end = Math.min(n, scanned + chunkSize)
    let from = scanned
    while (from < end && hits.length < limit) {
      const at = hay.indexOf(needle, from)
      if (at === -1 || at >= end) break
      const { line, column } = offsetToLineCol(lineOffsets, at)
      hits.push({
        index: hits.length,
        line,
        column,
        offset: at,
        preview: text.slice(Math.max(0, at - 40), at + needle.length + 40),
      })
      from = at + needle.length
    }
    scanned = end
    if (onProgress && scanned - lastProgress >= chunkSize) {
      lastProgress = scanned
      onProgress({ scanned, total: n, matches: hits.length })
    }
    if (hits.length >= limit) break
  }
  return { hits, truncated: hits.length >= limit }
}

export interface RegexValidation {
  ok: boolean
  /** For `ok: false`: either the raw JS RegExp error message (syntax), or the
   *  key `regexTooComplex` when the pattern looks like it could backtrack
   *  catastrophically. */
  error?: string
}

/**
 * Heuristic guard against patterns that can trigger catastrophic backtracking
 * (e.g. `(a+)+`, `(a*)*`, `(a|a)+`, `(\w+)*`). Returns `regexTooComplex` when a
 * group is quantified AND its body itself contains a quantifier or an
 * alternation — the classic runaway-backtracking shape. It is intentionally
 * conservative: a risky-looking pattern is refused rather than allowed to hang
 * the worker. The main-thread timeout in the viewer is the second line of
 * defence for anything this misses.
 */
export function regexComplexityRisk(pattern: string): string | null {
  const stack: { hasQuant: boolean; hasAlt: boolean }[] = []
  for (let i = 0; i < pattern.length; i++) {
    const ch = pattern[i]
    if (ch === '\\') { i++; continue }
    if (ch === '[') {
      i++
      if (pattern[i] === '^') i++
      if (pattern[i] === ']') i++
      while (i < pattern.length && pattern[i] !== ']') {
        if (pattern[i] === '\\') i++
        i++
      }
      continue
    }
    if (ch === '(') { stack.push({ hasQuant: false, hasAlt: false }); continue }
    if (ch === ')') {
      const g = stack.pop()
      const nxt = pattern[i + 1]
      if (g && (nxt === '*' || nxt === '+' || nxt === '{')) {
        if (g.hasQuant || g.hasAlt) return 'regexTooComplex'
      }
      continue
    }
    if (ch === '|') { if (stack.length) stack[stack.length - 1].hasAlt = true; continue }
    if ((ch === '*' || ch === '+') && stack.length) { stack[stack.length - 1].hasQuant = true; continue }
    if (ch === '{' && stack.length) {
      const m = /^\{\d+(,\d*)?\}/.exec(pattern.slice(i))
      if (m) { stack[stack.length - 1].hasQuant = true; i += m[0].length - 1 }
      continue
    }
  }
  return null
}

/** Validate a regex pattern (syntax + complexity). Safe to call on every
 *  keystroke; returns the reason when the pattern must not be run. */
export function validateRegex(pattern: string, flags: string): RegexValidation {
  if (!pattern) return { ok: true }
  try {
    // eslint-disable-next-line no-new
    new RegExp(pattern, flags)
  } catch (e) {
    return { ok: false, error: (e as Error).message || 'invalid regex' }
  }
  const risk = regexComplexityRisk(pattern)
  if (risk) return { ok: false, error: risk }
  return { ok: true }
}

/**
 * Structured full-document search that honours the key/value/path scope.
 *
 * Single left-to-right pass — no index is retained, only the matched hits (capped
 * at `limit`), so memory stays flat regardless of file size. Only valid JSON is
 * searched (the caller runs this after a successful scan), so the lightweight
 * tokenizer below does not need full validation.
 */
export function searchStructured(
  text: string,
  lineOffsets: Uint32Array,
  query: string,
  opts: SearchTextOptions,
  onProgress?: (p: SearchTextProgress) => void,
  chunkSize = 1 << 20,
): { hits: SearchTextHit[]; truncated: boolean } {
  const limit = opts.limit ?? 5000
  const hits: SearchTextHit[] = []
  let truncated = false
  if (!query) return { hits, truncated: false }

  const needle = opts.caseSensitive ? query : query.toLowerCase()
  const mode = opts.mode
  // Compile the regex once (caller has already validated syntax + complexity).
  const regex = opts.isRegex
    ? new RegExp(query, opts.regexFlags ?? (opts.caseSensitive ? '' : 'i'))
    : null
  const n = text.length
  let i = 0
  const prefixStack: string[] = ['']
  const containerTypes: ('o' | 'a')[] = []
  let pendingKey: string | null = null
  let arrIdx = 0
  let expectKey = false
  let scanned = 0
  let lastProgress = 0

  const curPrefix = () => prefixStack[prefixStack.length - 1]
  function valuePath(): string {
    const p = curPrefix()
    const t = containerTypes[containerTypes.length - 1]
    if (t === 'a') return p ? `${p}[${arrIdx}]` : `[${arrIdx}]`
    if (pendingKey == null) return p
    return p ? `${p}.${pendingKey}` : pendingKey
  }

  // tokenStart is the offset of the first character of the matched token (for a
  // string, just inside the opening quote). kind selects what we match against.
  function test(tokenText: string, tokenStart: number, path: string, kind: 'key' | 'value' | 'path') {
    if (hits.length >= limit) { truncated = true; return }
    const hay = kind === 'path' ? path : tokenText
    let inner: number
    if (regex) {
      const m = regex.exec(hay)
      if (!m) return
      inner = m.index
    } else {
      const hayLc = opts.caseSensitive ? hay : hay.toLowerCase()
      inner = hayLc.indexOf(needle)
      if (inner === -1) return
    }
    const offset = kind === 'path' ? tokenStart : tokenStart + inner
    const lc = offsetToLineCol(lineOffsets, offset)
    const display = kind === 'value' ? tokenText.slice(0, 120)
      : kind === 'key' ? tokenText
      : path
    hits.push({
      index: hits.length,
      line: lc.line,
      column: lc.column,
      offset,
      path,
      preview: display,
    })
  }

  // Keep scanning until we exhaust the text OR confirm we've exceeded the limit
  // (test() flips `truncated` once hits reach `limit`). Exiting on `hits.length <
  // limit` here would hide the truncation flag — the loop would stop the moment
  // we collect the 5000th hit and test() would never run again to set it.
  while (i < n && !truncated) {
    const c = text[i]
    // Report progress while scanning so the viewer can show a live bar and the
    // worker stays cancellable mid-search (the main thread keeps receiving these
    // messages even while this loop runs synchronously off-thread).
    scanned = i
    if (onProgress && scanned - lastProgress >= chunkSize) {
      lastProgress = scanned
      onProgress({ scanned, total: n, matches: hits.length })
    }
    if (c === ' ' || c === '\t' || c === '\n' || c === '\r') { i++; continue }
    const topT = containerTypes[containerTypes.length - 1]

    if (c === '{') {
      const vp = valuePath()
      if (mode === 'path' || mode === 'all') test(vp, i, vp, 'path')
      prefixStack.push(vp)
      containerTypes.push('o')
      pendingKey = null
      expectKey = true
      i++
      continue
    }
    if (c === '}') {
      containerTypes.pop(); prefixStack.pop()
      expectKey = false
      i++
      continue
    }
    if (c === '[') {
      const vp = valuePath()
      if (mode === 'path' || mode === 'all') test(vp, i, vp, 'path')
      prefixStack.push(vp)
      containerTypes.push('a')
      arrIdx = 0
      i++
      continue
    }
    if (c === ']') {
      containerTypes.pop(); prefixStack.pop()
      i++
      continue
    }
    if (c === ',') {
      if (topT === 'o') { pendingKey = null; expectKey = true }
      else if (topT === 'a') { arrIdx++ }
      i++
      continue
    }
    if (c === ':') { i++; continue }

    if (c === '"') {
      const start = i
      i++ // skip opening quote
      let s = ''
      while (i < n) {
        const ch = text[i]
        if (ch === '\\') { s += ch + (text[i + 1] ?? ''); i += 2; continue }
        if (ch === '"') { i++; break }
        s += ch
        i++
      }
      const keyOffset = start + 1
      if (expectKey) {
        pendingKey = s
        expectKey = false
        // The key's own JSONPath is the parent prefix plus this key name.
        const kp = curPrefix() ? `${curPrefix()}.${s}` : s
        if (mode === 'key' || mode === 'all') test(s, keyOffset, kp, 'key')
      } else {
        const vp = valuePath()
        if (mode === 'value' || mode === 'all') test(s, keyOffset, vp, 'value')
        if (mode === 'path' || mode === 'all') test(vp, keyOffset, vp, 'path')
      }
      continue
    }

    // primitive: true / false / null / number
    if (c === 't' || c === 'f' || c === 'n' || (c >= '0' && c <= '9') || c === '-') {
      const start = i
      let s = ''
      while (i < n) {
        const ch = text[i]
        if (ch === ' ' || ch === ',' || ch === '}' || ch === ']' || ch === '\n' || ch === '\t' || ch === '\r') break
        s += ch; i++
      }
      const vp = valuePath()
      if (mode === 'value' || mode === 'all') test(s, start, vp, 'value')
      if (mode === 'path' || mode === 'all') test(vp, start, vp, 'path')
      continue
    }

    i++ // unexpected char — skip
  }

  // Use the actual scan position, not `n`: when the loop exited early because we
  // hit the result cap (`truncated`), reporting `n` would over-state progress.
  scanned = i
  if (onProgress && scanned - lastProgress >= chunkSize) {
    lastProgress = scanned
    onProgress({ scanned, total: n, matches: hits.length })
  }
  return { hits, truncated }
}

function isWsChar(c: string): boolean {
  return c === ' ' || c === '\t' || c === '\r' || c === '\n'
}

/** Format an internal path ("obj.deep.leaf" / "items[0]") as a JSONPath. */
export function toJsonPath(path: string): string {
  if (!path) return '$'
  return path.startsWith('[') ? `$${path}` : `$.${path}`
}

export type JsonPathSeg = { kind: 'key'; name: string } | { kind: 'index'; value: number }

/**
 * Parse a JSONPath like `$.users[0].profile.email` into segments. Returns `null`
 * for malformed input. The leading `$` is optional. Only `.key` and `[index]`
 * steps are supported — the subset the large-file viewer can resolve.
 */
export function parseJsonPath(input: string): JsonPathSeg[] | null {
  let s = input.trim()
  if (s === '$' || s === '') return []
  if (s.startsWith('$')) s = s.slice(1)
  if (s.startsWith('.')) s = s.slice(1)
  const segs: JsonPathSeg[] = []
  const re = /\.([^.\[\]]+)|\[(\d+)\]/g
  let m: RegExpExecArray | null
  let last = 0
  while ((m = re.exec(s))) {
    if (m.index !== last) return null
    if (m[1] !== undefined) segs.push({ kind: 'key', name: m[1] })
    else segs.push({ kind: 'index', value: Number(m[2]) })
    last = re.lastIndex
  }
  if (last !== s.length) return null
  return segs
}

/**
 * Given the offset of an object key's opening quote, return the offset of the
 * value following the `:`. Falls back to the key offset when the structure
 * cannot be confirmed. Powers "go to path" for object-rooted documents.
 */
export function keyValueStart(text: string, keyOffset: number): number {
  const n = text.length
  let i = keyOffset
  if (text[i] !== '"') return keyOffset
  i++ // skip opening quote
  while (i < n && text[i] !== '"') {
    if (text[i] === '\\') i += 2
    else i++
  }
  if (i >= n) return keyOffset
  i++ // skip closing quote
  while (i < n && isWsChar(text[i])) i++
  if (text[i] !== ':') return keyOffset
  i++ // skip colon
  while (i < n && isWsChar(text[i])) i++
  return i
}

/**
 * Extract the single JSON value starting at `offset` (skipping leading
 * whitespace) and return its raw source slice. Used for the "node preview"
 * feature — parsing happens on the main thread only on explicit user action,
 * so a large node is capped to avoid blocking the UI.
 */
export function extractNodeAt(
  text: string,
  offset: number,
  capBytes = 200_000,
): { raw: string; truncated: boolean; size: number } {
  let i = offset
  const n = text.length
  while (i < n && isWsChar(text[i])) i++
  if (i >= n) return { raw: '', truncated: false }

  const c = text[i]
  let end = i

  if (c === '{' || c === '[') {
    let depth = 0
    let inStr = false
    let esc = false
    while (end < n) {
      const ch = text[end]
      if (inStr) {
        if (esc) esc = false
        else if (ch === '\\') esc = true
        else if (ch === '"') inStr = false
      } else if (ch === '"') {
        inStr = true
      } else if (ch === '{' || ch === '[') {
        depth++
      } else if (ch === '}' || ch === ']') {
        depth--
        if (depth === 0) { end++; break }
      }
      end++
    }
  } else if (c === '"') {
    end = i + 1
    while (end < n) {
      const ch = text[end]
      if (ch === '\\') { end += 2; continue }
      if (ch === '"') { end++; break }
      end++
    }
  } else {
    while (end < n) {
      const ch = text[end]
      if (ch === ',' || ch === '}' || ch === ']' || ch === '\n' || ch === '\r' || ch === '\t' || ch === ' ') break
      end++
    }
  }

  let raw = text.slice(i, end)
  const size = end - i
  let truncated = false
  if (raw.length > capBytes) {
    raw = raw.slice(0, capBytes)
    truncated = true
  }
  return { raw, truncated, size }
}

/**
 * Collect the start offsets of the direct children of the JSON array that
 * begins at `start` (the `[` itself, or the first non-whitespace char). Powers
 * "browse a large array" navigation for nested arrays (e.g. `$.orders`).
 *
 * The full child count is always computed (so the total is known even for huge
 * arrays); only the first `storeLimit` start offsets are kept in memory to
 * bound it. Callers that need an offset beyond `storeLimit` can re-scan with a
 * higher limit (cost is O(target index), fine for reasonable jumps).
 */
export function collectArrayChildOffsets(
  text: string,
  start: number,
  storeLimit = 200_000,
  countTotal = true,
): { offsets: number[]; total: number } {
  const n = text.length
  let i = start
  while (i < n && isWsChar(text[i])) i++
  if (text[i] !== '[') return { offsets: [], total: 0 }
  i++
  const offsets: number[] = []
  let total = 0
  let depth = 1
  let inStr = false
  let esc = false
  let expectValue = true
  while (i < n) {
    if (!countTotal && offsets.length >= storeLimit) break
    const ch = text[i]
    if (inStr) {
      if (esc) esc = false
      else if (ch === '\\') esc = true
      else if (ch === '"') inStr = false
      i++
      continue
    }
    if (ch === '"') {
      inStr = true
      if (expectValue) { if (offsets.length < storeLimit) offsets.push(i); total++; expectValue = false }
      i++
      continue
    }
    if (ch === '{' || ch === '[') {
      if (depth === 1 && expectValue) { if (offsets.length < storeLimit) offsets.push(i); total++; expectValue = false }
      depth++
      i++
      continue
    }
    if (ch === '}' || ch === ']') {
      depth--
      if (depth === 0) break
      i++
      continue
    }
    if (ch === ',') {
      if (depth === 1) expectValue = true
      i++
      continue
    }
    if (isWsChar(ch)) { i++; continue }
    if (depth === 1 && expectValue) {
      if (offsets.length < storeLimit) offsets.push(i)
      total++
      expectValue = false
      while (i < n && !isWsChar(text[i]) && text[i] !== ',' && text[i] !== ']' && text[i] !== '}') i++
      continue
    }
    i++
  }
  return { offsets, total }
}

/**
 * Offsets of each top-level element of a root JSON array (e.g. `[1,2,3]` or
 * `[{…},{…}]`). Returns [] for non-array roots. Light single-pass scan — only
 * depth-0 element starts are recorded, so memory stays flat. Powers the
 * "array paging" feature. NDJSON uses the per-line offsets instead.
 */
export function collectRootArrayElementOffsets(text: string): number[] {
  const n = text.length
  let i = 0
  while (i < n && isWsChar(text[i])) i++
  if (text[i] !== '[') return []
  i++ // skip the opening [
  const out: number[] = []
  // We have already passed the root '[' so we are one level inside it;
  // root-level elements therefore live at depth === 1.
  let depth = 1
  let elemStart = -1
  let inStr = false
  let esc = false
  while (i < n) {
    const ch = text[i]
    if (inStr) {
      if (esc) esc = false
      else if (ch === '\\') esc = true
      else if (ch === '"') inStr = false
    } else if (ch === '"') {
      if (depth === 1 && elemStart === -1) elemStart = i
      inStr = true
    } else if (ch === '[' || ch === '{') {
      if (depth === 1) elemStart = i
      depth++
    } else if (ch === ']' || ch === '}') {
      depth--
      if (depth === 0) break // closed the root array
    } else if (ch === ',') {
      // Only top-level commas separate root array elements; commas inside
      // nested structures must not reset the recorded element start.
      if (depth === 1) {
        if (elemStart >= 0) out.push(elemStart)
        elemStart = -1
      }
    } else if (depth === 1 && elemStart === -1 && !isWsChar(ch)) {
      // primitive element (number / true / false / null)
      elemStart = i
    }
    i++
  }
  if (elemStart >= 0) out.push(elemStart)
  return out
}
