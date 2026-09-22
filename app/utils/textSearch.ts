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
  mode: 'key' | 'value' | 'path'
  caseSensitive?: boolean
  limit?: number
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
    const hayLc = opts.caseSensitive ? hay : hay.toLowerCase()
    const inner = hayLc.indexOf(needle)
    if (inner === -1) return
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
      if (mode === 'path') test(vp, i, vp, 'path')
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
      if (mode === 'path') test(vp, i, vp, 'path')
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
        if (mode === 'key') test(s, keyOffset, kp, 'key')
      } else {
        const vp = valuePath()
        if (mode === 'value') test(s, keyOffset, vp, 'value')
        else if (mode === 'path') test(vp, keyOffset, vp, 'path')
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
      if (mode === 'value') test(s, start, vp, 'value')
      else if (mode === 'path') test(vp, start, vp, 'path')
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
): { raw: string; truncated: boolean } {
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
  let truncated = false
  if (raw.length > capBytes) {
    raw = raw.slice(0, capBytes)
    truncated = true
  }
  return { raw, truncated }
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
