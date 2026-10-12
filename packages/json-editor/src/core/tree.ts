import { jsonTypeLabel, type JsonTypeName } from './path'
import { evaluateJsonPath } from './jsonPath'

export interface TreeNode {
  /** Tree path used by the UI: `users[0].name`. Root is `''`. */
  path: string
  /** Display key. Root uses `''`. */
  key: string
  type: JsonTypeName
  value: unknown
  depth: number
  /** Empty for primitives. */
  children: TreeNode[]
  /** Number of direct entries for containers, `0` for primitives. */
  childCount: number
}

function joinPath(parent: string, key: string, isIndex: boolean): string {
  if (!parent) return key
  return isIndex ? `${parent}[${key}]` : `${parent}.${key}`
}

function build(value: unknown, path: string, key: string, depth: number): TreeNode {
  if (Array.isArray(value)) {
    const children = value.map((item, index) =>
      build(item, joinPath(path, String(index), true), String(index), depth + 1)
    )
    return { path, key, type: 'array', value, depth, children, childCount: children.length }
  }
  if (value !== null && typeof value === 'object') {
    const record = value as Record<string, unknown>
    const children = Object.keys(record).map((k) =>
      build(record[k], joinPath(path, k, false), k, depth + 1)
    )
    return { path, key, type: 'object', value, depth, children, childCount: children.length }
  }
  return {
    path,
    key,
    type: jsonTypeLabel(value),
    value,
    depth,
    children: [],
    childCount: 0,
  }
}

/**
 * Build the full node tree for a parsed JSON value.
 *
 * The tree is built eagerly — it is meant for documents you would happily
 * render in a browser. For multi-megabyte payloads, use the streaming
 * helpers instead (not part of this package).
 */
export function buildTree(value: unknown): TreeNode {
  return build(value, '', '', 0)
}

/** Every container path in the tree — used by expand-all / collapse-all. */
export function collectContainerPaths(root: TreeNode): string[] {
  const out: string[] = []
  const walk = (node: TreeNode) => {
    if (node.children.length === 0) return
    out.push(node.path)
    for (const child of node.children) walk(child)
  }
  walk(root)
  return out
}

/** Ancestor paths of `path`, nearest first (excluding `path` itself). */
export function ancestorPaths(path: string): string[] {
  const out: string[] = []
  const re = /([^.[\]]+)|\[(\d+)\]/g
  const segs: Array<{ text: string; isIndex: boolean }> = []
  let m: RegExpExecArray | null
  while ((m = re.exec(path)) !== null) {
    if (m[1] !== undefined) segs.push({ text: m[1], isIndex: false })
    else if (m[2] !== undefined) segs.push({ text: m[2], isIndex: true })
  }
  for (let i = segs.length - 1; i > 0; i--) {
    let built = ''
    for (let j = 0; j < i; j++) {
      const seg = segs[j]
      built = seg.isIndex ? `${built}[${seg.text}]` : j === 0 ? seg.text : `${built}.${seg.text}`
    }
    out.push(built)
  }
  return out
}

/**
 * Flat list of nodes currently visible given the expanded set.
 *
 * Flat rendering keeps search highlighting and keyboard navigation trivial
 * and avoids recursive component self-reference.
 */
export function flattenVisible(root: TreeNode, expanded: Set<string>): TreeNode[] {
  const out: TreeNode[] = [root]
  if (root.children.length === 0 || !expanded.has(root.path)) return out
  const stack: TreeNode[] = [...root.children].reverse()
  while (stack.length) {
    const node = stack.pop()!
    out.push(node)
    if (node.children.length > 0 && expanded.has(node.path)) {
      for (let i = node.children.length - 1; i >= 0; i--) stack.push(node.children[i])
    }
  }
  return out
}

export type TreeSearchMode = 'key' | 'value' | 'path' | 'all' | 'jsonpath'

export interface TreeSearchOptions {
  /** Search mode. Default `'key'` (matches the site's tree-search default). */
  mode?: TreeSearchMode
  /** Match against keys (legacy fallback, used only when `mode` is unset). */
  keys?: boolean
  /** Match against values (legacy fallback, used only when `mode` is unset). */
  values?: boolean
  /** Default `false`. Ignored in `jsonpath` mode (expressions are case-sensitive). */
  caseSensitive?: boolean
}

export interface TreeSearchResult {
  /** Paths whose own key or value matched. */
  matches: Set<string>
  /** Every ancestor of a match — expand these to reveal the matches. */
  ancestors: Set<string>
  total: number
  /** `true` only in `jsonpath` mode when the expression is invalid/unsupported. */
  invalid: boolean
}

const MAX_SEARCH_RESULTS = 5000

/** Resolve the effective mode, honouring the legacy `keys`/`values` booleans. */
function resolveMode(options: TreeSearchOptions): TreeSearchMode | 'none' {
  if (options.mode) return options.mode
  // The legacy `keys`/`values` booleans are only honoured when explicitly
  // supplied — otherwise we fall through to the new `'key'` default (the
  // site's tree-search default), so `searchTree(root, q)` means "search keys".
  if (options.keys !== undefined || options.values !== undefined) {
    const keys = options.keys ?? true
    const values = options.values ?? true
    if (keys && values) return 'all'
    if (keys && !values) return 'key'
    if (!keys && values) return 'value'
    return 'none'
  }
  return 'key'
}

/**
 * Search the tree. Returns matched paths plus the ancestors needed to reveal
 * them, so the caller can expand without walking the tree again.
 *
 * `jsonpath` mode delegates to `evaluateJsonPath`; when the expression is
 * unsupported/invalid the result has `invalid: true` and empty matches — callers
 * should surface an "invalid expression" hint rather than a zero-results state.
 */
export function searchTree(
  root: TreeNode,
  query: string,
  options: TreeSearchOptions = {}
): TreeSearchResult {
  const caseSensitive = options.caseSensitive ?? false
  const empty: TreeSearchResult = { matches: new Set(), ancestors: new Set(), total: 0, invalid: false }
  const needle = query.trim()
  if (!needle) return empty

  const mode = resolveMode(options)
  if (mode === 'none') return empty

  // JSONPath bypasses the plain substring walk: expressions are case-sensitive.
  if (mode === 'jsonpath') {
    const found = evaluateJsonPath(root.value, needle)
    if (found === null) return { matches: new Set(), ancestors: new Set(), total: 0, invalid: true }
    const matches = new Set<string>()
    const ancestors = new Set<string>()
    for (const hit of found) {
      if (matches.size >= MAX_SEARCH_RESULTS) break
      if (matches.has(hit.path)) continue
      matches.add(hit.path)
      for (const ancestor of ancestorPaths(hit.path)) ancestors.add(ancestor)
    }
    return { matches, ancestors, total: matches.size, invalid: false }
  }

  const target = caseSensitive ? needle : needle.toLowerCase()
  const hit = (text: string) => {
    const haystack = caseSensitive ? text : text.toLowerCase()
    return haystack.includes(target)
  }

  const matches = new Set<string>()
  const ancestors = new Set<string>()
  const walk = (node: TreeNode) => {
    let matched = false
    if ((mode === 'key' || mode === 'all') && hit(node.key)) matched = true
    if (!matched && (mode === 'value' || mode === 'all') && node.children.length === 0) {
      if (hit(formatScalar(node.value))) matched = true
    }
    if (!matched && (mode === 'path' || mode === 'all') && hit(node.path)) matched = true
    if (matched) {
      matches.add(node.path)
      for (const ancestor of ancestorPaths(node.path)) ancestors.add(ancestor)
    }
    for (const child of node.children) walk(child)
  }

  walk(root)
  return { matches, ancestors, total: matches.size, invalid: false }
}

/** How a leaf value is rendered (and searched) as text. */
export function formatScalar(value: unknown): string {
  if (typeof value === 'string') return value
  if (value === null) return 'null'
  return String(value)
}

export interface TextChunk {
  text: string
  hit: boolean
}

/**
 * Split `text` into chunks so the UI can wrap matches in a highlight element
 * without building HTML strings.
 */
export function splitByQuery(text: string, query: string, caseSensitive = false): TextChunk[] {
  const needle = query.trim()
  if (!needle) return [{ text, hit: false }]

  const haystack = caseSensitive ? text : text.toLowerCase()
  const target = caseSensitive ? needle : needle.toLowerCase()

  const chunks: TextChunk[] = []
  let cursor = 0
  let found = haystack.indexOf(target, cursor)
  while (found !== -1) {
    if (found > cursor) chunks.push({ text: text.slice(cursor, found), hit: false })
    chunks.push({ text: text.slice(found, found + target.length), hit: true })
    cursor = found + target.length
    found = haystack.indexOf(target, cursor)
  }
  if (cursor < text.length) chunks.push({ text: text.slice(cursor), hit: false })
  return chunks.length ? chunks : [{ text, hit: false }]
}
