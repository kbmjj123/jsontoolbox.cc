/**
 * Path helpers shared by the tree view and the copy-path actions.
 */

/**
 * Convert an internal tree path (`users[0].profile`, `name`, `0`, `[0]`)
 * into a standard JSONPath expression rooted at `$`
 * (`$.users[0].profile`, `$.name`, `$[0]`).
 */
export function toJsonPath(path: string): string {
  if (!path) return '$'
  // Root-level array index: `0` → `$[0]`
  if (/^\d+$/.test(path)) return `$[${path}]`
  // Already bracketed (e.g. `[0]`)
  if (path.startsWith('[')) return '$' + path
  return '$.' + path
}

export type JsonTypeName = 'string' | 'number' | 'boolean' | 'null' | 'array' | 'object'

export function jsonTypeLabel(value: unknown): JsonTypeName {
  if (value === null) return 'null'
  if (Array.isArray(value)) return 'array'
  if (typeof value === 'object') return 'object'
  return typeof value as JsonTypeName
}
