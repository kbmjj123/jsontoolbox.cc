/**
 * Delimited-text parsing and scalar conversion shared by the CSV and TXT tools.
 *
 * The behaviour here is the reference implementation for every copy claim about
 * delimiters, quoted fields, generated column names and type inference — the
 * page text must describe exactly what these functions do.
 */

/** Conversion switches for one cell / one value. Callers own the state. */
export interface ValueConvertOptions {
  trimValues: boolean
  typeInference: boolean
  emptyAsNull: boolean
}

export interface HeaderSplit {
  /** Resolved column names; empty header cells fall back to `column_N`. */
  headers: string[]
  /** Rows without the header row. */
  dataRows: string[][]
  /** How many header cells came from the header row instead of being generated. */
  usableHeaders: number
}

/** Count separators that are outside double-quoted sections. */
export function countOutsideQuotes(line: string, sep: string): number {
  let count = 0
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') i++
        else inQuotes = false
      }
      continue
    }
    if (ch === '"') { inQuotes = true; continue }
    if (ch === sep) count++
  }
  return count
}

/**
 * Auto-detection is a convenience, not a guarantee: it scores each candidate by
 * how consistently it splits the first rows into the same number of columns.
 */
export function detectDelimiter(text: string): string {
  const lines = text.split(/\r?\n/).filter(l => l.trim() !== '').slice(0, 5)
  let best = ','
  let bestScore = -Infinity
  for (const sep of [',', ';', '\t', '|']) {
    const counts = lines.map(l => countOutsideQuotes(l, sep) + 1)
    if (counts.length === 0) continue
    const first = counts[0]
    const consistent = counts.filter(c => c === first).length
    const score = consistent * 1000 + Math.min(first, 50)
    if (score > bestScore) { bestScore = score; best = sep }
  }
  return best
}

/**
 * Quote-aware delimited text parser: a quoted field may contain the separator
 * and line breaks, and `""` inside quotes is one literal double quote.
 * Blank lines are dropped.
 */
export function parseCsv(text: string, sep: string): string[][] {
  const rows: string[][] = []
  let current: string[] = []
  let field = ''
  let inQuotes = false

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i++ }
        else inQuotes = false
      } else field += ch
    } else {
      if (ch === '"') inQuotes = true
      else if (ch === sep) { current.push(field); field = '' }
      else if (ch === '\n' || ch === '\r') {
        if (ch === '\r' && text[i + 1] === '\n') i++
        current.push(field); field = ''
        if (current.length > 0 && !(current.length === 1 && current[0] === '')) rows.push(current)
        current = []
      } else field += ch
    }
  }
  current.push(field)
  if (current.length > 0 && !(current.length === 1 && current[0] === '')) rows.push(current)
  return rows
}

/** Split the header row off and generate `column_N` names where needed. */
export function splitHeaderRow(
  rows: string[][],
  opts: { hasHeader: boolean; trim: boolean },
): HeaderSplit {
  let headers: string[]
  let dataRows: string[][]

  if (opts.hasHeader) {
    headers = rows[0].map(h => (opts.trim ? h.trim() : h))
    dataRows = rows.slice(1)
  } else {
    headers = rows[0].map((_, i) => `column_${i + 1}`)
    dataRows = rows
  }

  let usableHeaders = opts.hasHeader ? 0 : headers.length
  if (opts.hasHeader) {
    headers = headers.map((h, i) => {
      if (h !== '') { usableHeaders++; return h }
      return `column_${i + 1}`
    })
  }

  return { headers, dataRows, usableHeaders }
}

/**
 * Value conversion for one cell: trim → empty policy → optional type inference.
 *
 * Type inference only recognises lowercase `true` / `false` and plain integers
 * or decimals. `TRUE`, `NULL`, `1e5`, `.5`, `+5` and leading-zero identifiers
 * stay strings. `null` is only produced from an empty value when `emptyAsNull`.
 */
export function convertValue(raw: string, opts: ValueConvertOptions): unknown {
  const value = opts.trimValues ? raw.trim() : raw
  if (value === '') return opts.emptyAsNull ? null : ''
  if (!opts.typeInference) return value
  if (value === 'true') return true
  if (value === 'false') return false
  if (/^-?\d+$/.test(value) || /^-?\d+\.\d+$/.test(value)) {
    const n = Number(value)
    if (!Number.isNaN(n)) return n
  }
  return value
}
