/**
 * Pure CSV serialization for the package's table view.
 *
 * Self-contained on purpose: the site has its own `useExcelCompat.generateCsv`,
 * but the package must not depend on site code (see the unification plan §5 #4).
 * When the site dedupes onto the package (P3-8) it can swap to this.
 *
 * Quoting follows RFC 4180: a cell is wrapped in double quotes when it contains
 * the delimiter, a quote, or a newline; embedded quotes are doubled.
 */

/** Render a single cell value to its display string. */
function cellToString(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  // Nested objects / arrays → JSON so they stay machine-readable in CSV.
  return JSON.stringify(value)
}

/** Escape a single cell for CSV, applying RFC 4180 quoting when needed. */
export function escapeCsvCell(value: unknown, delimiter = ','): string {
  const str = cellToString(value)
  if (
    str.includes(delimiter) ||
    str.includes('"') ||
    str.includes('\n') ||
    str.includes('\r')
  ) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

export interface ToCsvOptions {
  /** Column delimiter. Defaults to `,`. */
  delimiter?: string
  /** Prepend a UTF-8 BOM so Excel detects UTF-8. Defaults to `false`. */
  bom?: boolean
}

/**
 * Build a CSV string from headers and rows.
 *
 * @param headers - Column header labels (used as the first line).
 * @param rows    - Data rows; each cell is stringified via {@link escapeCsvCell}.
 */
export function toCsv(
  headers: string[],
  rows: unknown[][],
  options: ToCsvOptions = {}
): string {
  const delimiter = options.delimiter ?? ','
  const headerLine = headers.map((h) => escapeCsvCell(h, delimiter)).join(delimiter)
  const dataLines = rows.map((row) =>
    row.map((cell) => escapeCsvCell(cell, delimiter)).join(delimiter)
  )
  const body = [headerLine, ...dataLines].join('\n')
  return options.bom ? '﻿' + body : body
}
