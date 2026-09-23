/**
 * Convert an internal tree path (e.g. `users[0].profile`, `name`, `0`, `[0]`)
 * into a standard JSONPath expression rooted at `$` (e.g. `$.users[0].profile`,
 * `$.name`, `$[0]`).
 *
 * This is the single source of truth for JSONPath string formatting, shared by
 * the tree node menu (P0-1), the JSONPath query bar (P2-1), and the table view
 * row copy (P0-2).
 */
export function toJsonPath(path: string): string {
  if (!path) return '$'
  // Root-level array index: `0` → `$[0]`
  if (/^\d+$/.test(path)) return `$[${path}]`
  // Already bracketed (e.g. `[0]`): `$` + path
  if (path.startsWith('[')) return '$' + path
  return '$.' + path
}

/**
 * Plain-language JSON type label for a value, used in the tree node badge.
 */
export function jsonTypeLabel(value: unknown): string {
  if (value === null) return 'null'
  if (Array.isArray(value)) return 'array'
  return typeof value // 'string' | 'number' | 'boolean' | 'object'
}
