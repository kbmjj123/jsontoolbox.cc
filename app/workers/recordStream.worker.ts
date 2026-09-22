/**
 * Record-oriented streaming worker (Large File Mode).
 *
 * Deliberately does NOT build a full node index. Benchmarks showed the
 * index-based approach costs ~27x the file size in worker memory
 * (20MB file -> ~553MB, 50MB -> ~1.09GB and ~109s — unusable).
 *
 * This worker instead:
 *  - runs a single-pass validating scanner (no retained index, O(1) memory),
 *  - locates record boundaries (array element offsets / NDJSON line offsets),
 *  - hands each record to the native JSON.parse (fast, and the object is
 *    discarded immediately after use),
 *  - streams CSV out in chunks so neither side ever holds the whole output.
 *
 * Consequence: validation, overview, search and CSV export scale to tens/hundreds
 * of MB. What is NOT possible here: full object-tree browsing / editing (those
 * need an index and belong to the small-file page).
 */
import { buildLineOffsets, searchStructured, collectRootArrayElementOffsets, type SearchTextHit } from '~/utils/textSearch'
import { scanJson, emptyTypeCounts, accumulateValue, valueDepth, type JsonTypeCounts } from '~/utils/jsonScanner'

export type FileFormat = 'json' | 'ndjson'

export interface Candidate {
  /** '' means the root array (or the NDJSON line stream). */
  path: string
  /** Number of records in this collection. */
  count: number
  kind: 'array' | 'lines'
  /** Sample top-level keys, to help the user pick the right collection. */
  sampleKeys: string[]
}

/** Why a scan failed — lets the UI show a localized message instead of a raw
 *  scanner exception. */
export type ScanFailReason = 'eof' | 'token' | 'empty' | 'scanner'

export interface ScanResult {
  id: number
  type: 'scan'
  ok: boolean
  error?: string
  /** Localized-friendliness reason for a failed scan (only when `ok` is false). */
  reason?: ScanFailReason
  line?: number
  column?: number
  snippet?: string
  /** Offset of every line (including empty ones), for the text viewer's
   *  virtual scrolling and for mapping match offsets to line/column. */
  lineOffsets?: Uint32Array
  /** Start offset of each top-level element of a root JSON array — powers the
   *  array pager. Absent for NDJSON (use lineOffsets) and object-rooted docs. */
  topArray?: Uint32Array
  rootType: 'object' | 'array' | null
  format: FileFormat
  /** Records in the primary collection (root array or NDJSON lines). */
  recordCount: number
  candidates: Candidate[]
  bytes: number
  /** Max container nesting depth of the document (root container = 1). */
  maxDepth: number
  /** Count of each JSON value type encountered while scanning. */
  typeCounts: JsonTypeCounts
}

export interface FieldStat {
  path: string
  type: 'string' | 'number' | 'boolean' | 'null' | 'object' | 'array'
  /** Fraction of sampled records where this path was present (0..1). */
  presence: number
  example: string
  isArray: boolean
}

export interface FieldsResult {
  id: number
  type: 'fields'
  fields: FieldStat[]
  sampled: number
}

export interface CsvChunk {
  id: number
  type: 'csvChunk'
  chunk: string
  /** Rows contained in THIS chunk. */
  rows: number
  /** Cumulative rows written so far (use for progress). */
  total: number
  done: boolean
  /** Progress 0..100, only meaningful while running. */
  percent: number
}

export interface SearchHit {
  recordIndex: number
  path: string
  key: string
  preview: string
}

export interface SearchResultMsg {
  id: number
  type: 'search'
  hits: SearchHit[]
  truncated: boolean
  scanned: number
}

export type ArrayMode = 'json' | 'first' | 'skip'

export interface LoadRequest {
  id: number
  mode: 'load'
  text: string
  format: FileFormat
}
export interface FieldsRequest {
  id: number
  mode: 'fields'
  rowPath?: string
  sampleSize?: number
}
export interface ExportRequest {
  id: number
  mode: 'export'
  rowPath?: string
  columns: string[]
  arrayMode?: ArrayMode
  delimiter?: string
  includeHeader?: boolean
  bom?: boolean
  maxRows?: number
}
export interface SearchRequest {
  id: number
  mode: 'search'
  rowPath?: string
  query: string
  searchMode?: 'key' | 'value'
  limit?: number
}
export interface ResetRequest {
  id: number
  mode: 'reset'
}

export interface SearchTextRequest {
  id: number
  mode: 'searchText'
  query: string
  searchMode: 'key' | 'value' | 'path'
  caseSensitive: boolean
  limit: number
}
export interface SearchTextProgressMsg {
  id: number
  type: 'searchTextProgress'
  scanned: number
  total: number
  matches: number
}
export interface SearchTextResultMsg {
  id: number
  type: 'searchTextResult'
  hits: SearchTextHit[]
  truncated: boolean
}

type Request =
  | LoadRequest
  | FieldsRequest
  | ExportRequest
  | SearchRequest
  | SearchTextRequest
  | ResetRequest

// ── retained document ────────────────────────────────────────────
let docText = ''
let docFormat: FileFormat = 'json'
/** Non-empty line offsets, for NDJSON validation (`buildRecordLineOffsets`). */
let lineOffsets: number[] = []
/** Offset of every line including empty ones, for the text viewer. */
let allLineOffsets: Uint32Array = new Uint32Array(0)

const MAX_CANDIDATE_DEPTH = 5
const MIN_CANDIDATE_COUNT = 1
const MAX_CANDIDATES = 50

// `accumulateValue` / `valueDepth` are imported from ~/utils/jsonScanner.

/** Offsets of each non-empty line (NDJSON validation only). */
function buildRecordLineOffsets(text: string): number[] {
  const out: number[] = []
  let start = 0
  const n = text.length
  for (let i = 0; i < n; i++) {
    if (text[i] === '\n') {
      if (i > start) out.push(start)
      start = i + 1
    }
  }
  if (start < n) out.push(start)
  return out
}

function lineEnd(text: string, start: number): number {
  const nl = text.indexOf('\n', start)
  return nl === -1 ? text.length : nl
}

/** Iterate records: yields (index, rawTextSlice). */
function forEachRecord(
  rowPath: string | undefined,
  cb: (index: number, raw: string) => void,
): number {
  if (docFormat === 'ndjson') {
    let idx = 0
    for (const off of lineOffsets) {
      const end = lineEnd(docText, off)
      const raw = docText.slice(off, end)
      if (!raw.trim()) continue
      cb(idx++, raw)
    }
    return idx
  }
  let count = 0
  scanJson(docText, {
    targetPath: rowPath ?? '',
    onElement: (index, start, end) => {
      count++
      cb(index, docText.slice(start, end))
    },
  })
  return count
}

function inferType(v: unknown): FieldStat['type'] {
  if (v === null || v === undefined) return 'null'
  if (Array.isArray(v)) return 'array'
  if (typeof v === 'object') return 'object'
  if (typeof v === 'number') return 'number'
  if (typeof v === 'boolean') return 'boolean'
  return 'string'
}

function previewOf(v: unknown): string {
  if (v === null || v === undefined) return ''
  if (typeof v === 'object') {
    const s = JSON.stringify(v)
    return s.length > 60 ? `${s.slice(0, 60)}…` : s
  }
  const s = String(v)
  return s.length > 60 ? `${s.slice(0, 60)}…` : s
}

/** Discover candidate columns by walking sampled records. */
function discoverFields(records: unknown[], maxDepth = 3): Map<string, { type: FieldStat['type']; present: number; example: string; isArray: boolean }> {
  const out = new Map<string, { type: FieldStat['type']; present: number; example: string; isArray: boolean }>()

  /** Record one sighting of `path` in this sample. */
  function bump(p: string, t: FieldStat['type'], v: unknown, isArray: boolean) {
    const cur = out.get(p)
    if (!cur) {
      out.set(p, { type: t, present: 1, example: previewOf(v), isArray })
    } else {
      cur.present++
      if (!cur.example) cur.example = previewOf(v)
    }
  }

  function walk(obj: unknown, prefix: string, depth: number) {
    if (obj === null || typeof obj !== 'object') return
    if (Array.isArray(obj)) {
      bump(prefix, 'array', obj, true)
      return
    }
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      const p = prefix ? `${prefix}.${k}` : k
      const t = inferType(v)
      if (t === 'object' && depth < maxDepth && v !== null) {
        walk(v, p, depth + 1)
        continue
      }
      bump(p, t, v, t === 'array')
    }
  }

  for (const rec of records) {
    if (rec === null || typeof rec !== 'object' || Array.isArray(rec)) continue
    for (const [k, v] of Object.entries(rec as Record<string, unknown>)) {
      const t = inferType(v)
      if (t === 'object' && v !== null) {
        // nested leaves (addr.city) plus the object itself (addr → JSON column)
        walk(v, k, 1)
        bump(k, 'object', v, false)
        continue
      }
      bump(k, t, v, t === 'array')
    }
  }
  return out
}

function resolvePath(obj: unknown, path: string): unknown {
  let cur: any = obj
  for (const seg of path.split('.')) {
    if (cur == null) return undefined
    const parts = seg.split(/(\[\d+\])/g).filter(Boolean)
    for (const p of parts) {
      if (cur == null) return undefined
      if (p.startsWith('[')) cur = cur[Number(p.slice(1, -1))]
      else cur = cur[p]
    }
  }
  return cur
}

function csvEscape(v: unknown, delimiter: string, arrayMode: ArrayMode): string {
  if (v === undefined) return ''
  if (v === null) return ''
  let s: string
  if (Array.isArray(v)) {
    if (arrayMode === 'skip') return ''
    if (arrayMode === 'first') {
      const f = v[0]
      s = f === undefined || f === null ? '' : (typeof f === 'object' ? JSON.stringify(f) : String(f))
    } else {
      s = JSON.stringify(v)
    }
  } else if (typeof v === 'object') {
    s = JSON.stringify(v)
  } else {
    s = String(v)
  }
  if (s.includes(delimiter) || s.includes('"') || s.includes('\n') || s.includes('\r')) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

self.onmessage = (e: MessageEvent<Request>) => {
  const data = e.data

  // ── Full-text search: scan the retained document, report hits with
  //    line/column so the viewer can jump straight to them.
  if (data.mode === 'searchText') {
    const offsets = allLineOffsets.length ? allLineOffsets : (allLineOffsets = buildLineOffsets(docText))
    const r = searchStructured(
      docText,
      offsets,
      data.query,
      { mode: data.searchMode, caseSensitive: data.caseSensitive, limit: data.limit },
      (p) => {
        self.postMessage({
          id: data.id, type: 'searchTextProgress',
          scanned: p.scanned, total: p.total, matches: p.matches,
        } as SearchTextProgressMsg)
      },
    )
    self.postMessage({
      id: data.id, type: 'searchTextResult', hits: r.hits, truncated: r.truncated,
    } as SearchTextResultMsg)
    return
  }

  if (data.mode === 'reset') {
    docText = ''
    lineOffsets = []
    allLineOffsets = new Uint32Array(0)
    self.postMessage({ id: data.id, type: 'reset' })
    return
  }

  if (data.mode === 'load') {
    docText = data.text
    docFormat = data.format
    // Build every-line offsets once so the text viewer can virtual-scroll and
    // so searchText can map offsets to line/column without recomputing.
    // Posted by structured clone (NOT transferred) so the worker keeps its own
    // copy for later searches.
    allLineOffsets = buildLineOffsets(docText)
    try {
      let rootType: 'object' | 'array' | null = null
      let recordCount = 0
      const candidates: Candidate[] = []

      if (docFormat === 'ndjson') {
        lineOffsets = buildRecordLineOffsets(docText)
        // validate every line; accumulate type counts + max depth along the way
        let bad: { line: number; message: string } | null = null
        let valid = 0
        let sampleKeys: string[] = []
        const typeCounts = emptyTypeCounts()
        let maxDepth = 0
        for (let li = 0; li < lineOffsets.length; li++) {
          const off = lineOffsets[li]
          const raw = docText.slice(off, lineEnd(docText, off))
          if (!raw.trim()) continue
          try {
            const v = JSON.parse(raw)
            valid++
            if (!sampleKeys.length && v && typeof v === 'object' && !Array.isArray(v)) {
              sampleKeys = Object.keys(v).slice(0, 8)
            }
            accumulateValue(v, typeCounts)
            const d = valueDepth(v)
            if (d > maxDepth) maxDepth = d
          } catch (err) {
            if (!bad) bad = { line: li + 1, message: (err as Error).message }
          }
        }
        recordCount = valid
        candidates.push({ path: '', count: valid, kind: 'lines', sampleKeys })
        rootType = 'array'
        if (bad) {
          const res: ScanResult = {
            id: data.id, type: 'scan', ok: false, error: bad.message, reason: 'token',
            line: bad.line, column: 1,
            snippet: docText.slice(lineOffsets[bad.line - 1] ?? 0, lineEnd(docText, lineOffsets[bad.line - 1] ?? 0)).slice(0, 120),
            rootType, format: docFormat, recordCount, candidates,
            bytes: docText.length, lineOffsets: allLineOffsets,
            maxDepth, typeCounts,
          }
          self.postMessage(res)
          return
        }
        const res: ScanResult = {
          id: data.id, type: 'scan', ok: true, rootType, format: docFormat,
          recordCount, candidates, bytes: docText.length,
          lineOffsets: allLineOffsets, maxDepth, typeCounts,
        }
        self.postMessage(res)
        return
      }

      // ── JSON ──
      const seen: { path: string; count: number; start: number; end: number; depth: number }[] = []
      const typeCounts = emptyTypeCounts()
      let maxDepth = 0
      let err: { message: string; position: number; reason?: ScanFailReason } | null = null
      try {
        const r = scanJson(docText, {
          onArrayClose: (path, count, firstStart, firstEnd, depth) => {
            if (depth <= MAX_CANDIDATE_DEPTH && count >= MIN_CANDIDATE_COUNT && seen.length < MAX_CANDIDATES) {
              seen.push({ path, count, start: firstStart, end: firstEnd, depth })
            }
          },
          onValue: (type, depth) => {
            typeCounts[type]++
            if ((type === 'object' || type === 'array') && depth > maxDepth) maxDepth = depth
          },
        })
        rootType = r.rootType
      } catch (ex) {
        const m = (ex as Error).message || String(ex)
        const pm = m.match(/position (\d+)/)
        err = {
          message: m,
          position: pm ? parseInt(pm[1]) : 0,
          reason: m === 'Unexpected end of input' ? 'eof' : 'token',
        }
      }

      if (err) {
        // Safety net: scanJson is a hand-written scanner and may not understand
        // every construct. If the document is in fact valid JSON, never report
        // "Invalid JSON" — that would be a false claim about the user's file.
        let parses = false
        try { JSON.parse(docText); parses = true } catch { /* genuinely invalid */ }
        if (parses) {
          console.warn('[recordStream] scanner failed on valid JSON:', err.message)
          err = {
            message: 'This file is valid JSON, but the structure scanner could not read it. CSV export needs that scan — try the JSON Editor for smaller files, or report this document so the scanner can be fixed.',
            position: 0,
            reason: 'scanner',
          }
        }
      }

      if (err) {
        const lines = docText.slice(0, err.position).split('\n')
        const res: ScanResult = {
          id: data.id, type: 'scan', ok: false, error: err.message, reason: err.reason,
          line: lines.length, column: lines[lines.length - 1].length + 1,
          snippet: docText.slice(Math.max(0, err.position - 40), err.position + 40),
          rootType: null, format: docFormat, recordCount: 0, candidates: [], bytes: docText.length,
          lineOffsets: allLineOffsets, maxDepth: 0, typeCounts: emptyTypeCounts(),
        }
        self.postMessage(res)
        return
      }

      for (const s of seen) {
        let sampleKeys: string[] = []
        if (s.end > s.start && s.start >= 0) {
          try {
            const first = JSON.parse(docText.slice(s.start, s.end))
            if (first && typeof first === 'object' && !Array.isArray(first)) {
              sampleKeys = Object.keys(first).slice(0, 8)
            }
          } catch { /* non-object elements: leave keys empty */ }
        }
        // Keep collections whose elements are objects (CSV rows need objects).
        // Always keep the root array so the UI can explain why it is not
        // exportable instead of silently showing "no collections found".
        if (sampleKeys.length > 0 || s.path === '') {
          candidates.push({ path: s.path, count: s.count, kind: 'array', sampleKeys })
        }
      }
      candidates.sort((a, b) => b.count - a.count)

      // primary record count = biggest candidate whose elements are objects
      recordCount = candidates.length ? candidates[0].count : 0

      const res: ScanResult = {
        id: data.id, type: 'scan', ok: true, rootType, format: docFormat,
        recordCount, candidates, bytes: docText.length,
        lineOffsets: allLineOffsets, maxDepth, typeCounts,
        topArray: rootType === 'array' ? new Uint32Array(collectRootArrayElementOffsets(docText)) : undefined,
      }
      self.postMessage(res)
    } catch (outer) {
      const res: ScanResult = {
        id: data.id, type: 'scan', ok: false, error: (outer as Error).message || String(outer), reason: 'scanner',
        rootType: null, format: docFormat, recordCount: 0, candidates: [], bytes: docText.length,
        lineOffsets: allLineOffsets, maxDepth: 0, typeCounts: emptyTypeCounts(),
      }
      self.postMessage(res)
    }
    return
  }

  if (data.mode === 'fields') {
    const sampleSize = data.sampleSize ?? 200
    const samples: unknown[] = []
    forEachRecord(data.rowPath, (index, raw) => {
      if (samples.length >= sampleSize) return
      try { samples.push(JSON.parse(raw)) } catch { /* skip unparsable record */ }
    })
    const total = Math.max(1, samples.length)
    const map = discoverFields(samples)
    const fields: FieldStat[] = [...map.entries()].map(([path, v]) => ({
      path,
      type: v.type,
      presence: v.present / total,
      example: v.example,
      isArray: v.isArray,
    }))
    fields.sort((a, b) => b.presence - a.presence || a.path.localeCompare(b.path))
    const res: FieldsResult = { id: data.id, type: 'fields', fields, sampled: samples.length }
    self.postMessage(res)
    return
  }

  if (data.mode === 'export') {
    const delimiter = data.delimiter ?? ','
    const arrayMode = data.arrayMode ?? 'json'
    const includeHeader = data.includeHeader !== false
    const bom = !!data.bom
    const maxRows = data.maxRows ?? Infinity
    const columns = data.columns

    let buf: string[] = []
    let bufLen = 0
    let rowCount = 0
    let chunkRows = 0
    let totalSeen = 0

    const flush = (done: boolean) => {
      if (!buf.length && !done) return
      const chunk = buf.join('')
      buf = []
      bufLen = 0
      const msg: CsvChunk = {
        id: data.id, type: 'csvChunk', chunk,
        rows: chunkRows, total: rowCount,
        done, percent: done ? 100 : 0,
      }
      chunkRows = 0
      self.postMessage(msg)
    }

    if (bom) { buf.push('\uFEFF'); bufLen += 1 }
    if (includeHeader) {
      buf.push(columns.map(c => csvEscape(c, delimiter, 'json')).join(delimiter) + '\r\n')
      bufLen += columns.length * 12
    }

    forEachRecord(data.rowPath, (_index, raw) => {
      if (rowCount >= maxRows) return
      let rec: unknown
      try { rec = JSON.parse(raw) } catch { return }
      totalSeen++
      const line = columns.map(c => csvEscape(resolvePath(rec, c), delimiter, arrayMode)).join(delimiter)
      buf.push(line + '\r\n')
      bufLen += line.length + 2
      rowCount++
      chunkRows++
      if (bufLen >= 1024 * 1024) flush(false)
    })

    flush(true)
    return
  }

  if (data.mode === 'search') {
    const q = (data.query || '').toLowerCase()
    const limit = data.limit ?? 200
    const mode = data.searchMode ?? 'value'
    const hits: SearchHit[] = []
    let scanned = 0
    let truncated = false

    if (q) {
      forEachRecord(data.rowPath, (index, raw) => {
        if (hits.length >= limit) { truncated = true; return }
        let rec: unknown
        try { rec = JSON.parse(raw) } catch { return }
        scanned++

        const stack: { v: unknown; p: string }[] = [{ v: rec, p: '' }]
        while (stack.length) {
          const { v, p } = stack.pop()!
          if (v === null || typeof v !== 'object') {
            if (mode === 'value' && String(v).toLowerCase().includes(q)) {
              hits.push({ recordIndex: index, path: p, key: p.split('.').pop() ?? '', preview: previewOf(v) })
            }
            continue
          }
          if (Array.isArray(v)) {
            for (let i = 0; i < v.length; i++) stack.push({ v: v[i], p: `${p}[${i}]` })
            continue
          }
          for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
            const cp = p ? `${p}.${k}` : k
            if (mode === 'key' && k.toLowerCase().includes(q)) {
              hits.push({ recordIndex: index, path: cp, key: k, preview: previewOf(val) })
            }
            stack.push({ v: val, p: cp })
          }
        }
      })
    }

    const res: SearchResultMsg = { id: data.id, type: 'search', hits, truncated, scanned }
    self.postMessage(res)
    return
  }
}
