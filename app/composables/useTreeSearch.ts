import type { Ref } from 'vue'
import type { LazyNode } from '~/workers/jsonStream.worker'

export type SearchMode = 'key' | 'value' | 'path'

// Guardrails so searching a huge file can never freeze the main thread:
//  - MAX_SEARCH_RESULTS: max matches we keep (navigation aid, not exhaustive)
//  - MAX_SEARCH_NODES:   max nodes we visit per search pass (time budget)
const MAX_SEARCH_RESULTS = 5000
const MAX_SEARCH_NODES = 400_000

/**
 * Build the full path for a child key/index.
 * root "" + "name" → "name"
 * "store" + "book" → "store.book"
 * "items" + 0 → "items[0]"
 */
function childPath(parent: string, key: string | number): string {
  if (!parent) return String(key)
  if (typeof key === 'number') return `${parent}[${key}]`
  return `${parent}.${key}`
}

/**
 * Extract all ancestor paths that need to be expanded to reveal a match.
 * "store.book[0].title" → ["store", "store.book", "store.book[0]"]
 */
function ancestorPaths(path: string): string[] {
  const result: string[] = []
  // Normalize: "store.book[0].title" → ["store", "book", "0", "title"]
  const segments = path.replace(/\[(\d+)\]/g, '.$1').split('.')
  for (let i = 1; i < segments.length; i++) {
    // Rebuild path up to segment i
    let p = segments[0]
    for (let j = 1; j < i; j++) {
      p = /^\d+$/.test(segments[j]) ? `${p}[${segments[j]}]` : `${p}.${segments[j]}`
    }
    result.push(p)
  }
  return result
}

interface SearchBudget {
  visited: number
  max: number
  limit: number
}

function addMatch(path: string, results: string[], seen: Set<string>) {
  if (seen.has(path)) return
  seen.add(path)
  results.push(path)
}

/**
 * Recursively walk the JSON tree and collect matching paths.
 * Bounded by a node-visit budget + result limit so a huge file can't freeze
 * the UI on every keystroke.
 */
function walkTree(
  data: unknown,
  currentPath: string,
  query: string,
  mode: SearchMode,
  results: string[],
  seen: Set<string>,
  budget: SearchBudget,
): void {
  if (budget.visited >= budget.max || results.length >= budget.limit) return
  budget.visited++

  if (data === null || data === undefined) {
    if (mode === 'value' && 'null'.includes(query)) addMatch(currentPath, results, seen)
    return
  }

  if (Array.isArray(data)) {
    if (mode === 'path' && currentPath.toLowerCase().includes(query)) addMatch(currentPath, results, seen)
    for (let i = 0; i < data.length; i++) {
      if (budget.visited >= budget.max || results.length >= budget.limit) return
      walkTree(data[i], childPath(currentPath, i), query, mode, results, seen, budget)
    }
    return
  }

  if (typeof data === 'object') {
    if (mode === 'path' && currentPath.toLowerCase().includes(query)) addMatch(currentPath, results, seen)
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      if (budget.visited >= budget.max || results.length >= budget.limit) return
      const fullPath = childPath(currentPath, key)
      if (mode === 'key' && key.toLowerCase().includes(query)) addMatch(fullPath, results, seen)
      walkTree(value, fullPath, query, mode, results, seen, budget)
    }
    return
  }

  // Primitive
  if (mode === 'value' && String(data).toLowerCase().includes(query)) addMatch(currentPath, results, seen)
  if (mode === 'path' && currentPath.toLowerCase().includes(query)) addMatch(currentPath, results, seen)
}

/**
 * Walk the streaming-parser index (large-file / lazy mode) to find matching
 * paths. The index contains every node, so we can search without materializing
 * the full object. Bounded by the same node + result budget.
 */
function searchLazyIndex(
  lazyMap: Map<string, LazyNode>,
  query: string,
  mode: SearchMode,
  limit: number,
  maxNodes: number,
): string[] {
  const results: string[] = []
  const seen = new Set<string>()
  const root = lazyMap.get('')
  if (!root) return results

  let visited = 0
  const stack: string[] = [...root.children]
  while (stack.length && visited < maxNodes && results.length < limit) {
    const path = stack.pop() as string
    const node = lazyMap.get(path)
    if (!node) continue
    visited++

    if (mode === 'key') {
      if (String(node.key).toLowerCase().includes(query)) addMatch(path, results, seen)
    } else if (mode === 'value') {
      if (node.preview && node.preview.toLowerCase().includes(query)) addMatch(path, results, seen)
    } else if (mode === 'path') {
      if (path.toLowerCase().includes(query)) addMatch(path, results, seen)
    }

    // Descend into containers so deeper nodes get visited.
    if (node.type === 'object' || node.type === 'array') {
      for (const child of node.children) stack.push(child)
    }
  }
  return results
}

export function useTreeSearch(
  data: Ref<unknown>,
  lazyIndex?: Ref<Map<string, LazyNode> | null | undefined>,
) {
  const query = ref('')
  // Debounce the actual search so we never traverse the tree on every keystroke.
  const debouncedQuery = ref('')
  let debounceTimer: ReturnType<typeof setTimeout> | null = null
  watch(query, (val) => {
    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => { debouncedQuery.value = val }, 250)
  })

  const mode = ref<SearchMode>('key')
  const currentIndex = ref(-1)

  const matches = computed<string[]>(() => {
    const q = debouncedQuery.value.trim().toLowerCase()
    if (!q) return []

    const idx = lazyIndex?.value
    if (idx && idx.size > 0) {
      return searchLazyIndex(idx, q, mode.value, MAX_SEARCH_RESULTS, MAX_SEARCH_NODES)
    }
    if (!data.value) return []

    const results: string[] = []
    const seen = new Set<string>()
    const budget: SearchBudget = { visited: 0, max: MAX_SEARCH_NODES, limit: MAX_SEARCH_RESULTS }
    walkTree(data.value, '', q, mode.value, results, seen, budget)
    return results
  })

  const matchSet = computed(() => new Set(matches.value))
  const totalCount = computed(() => matches.value.length)
  const currentMatchPath = computed(() => matches.value[currentIndex.value] ?? '')

  // All ancestor paths that need to be expanded to reveal matches
  const searchExpandedPaths = computed(() => {
    const paths = new Set<string>()
    for (const match of matches.value) {
      for (const ancestor of ancestorPaths(match)) {
        paths.add(ancestor)
      }
    }
    return paths
  })

  // Auto-select first match when results change
  watch(matches, (newMatches) => {
    if (newMatches.length === 0) {
      currentIndex.value = -1
    } else if (currentIndex.value < 0 || currentIndex.value >= newMatches.length) {
      currentIndex.value = 0
    }
  })

  // Reset index when query or mode changes
  watch([query, mode], () => {
    currentIndex.value = -1
  })

  function next() {
    if (matches.value.length === 0) return
    currentIndex.value = (currentIndex.value + 1) % matches.value.length
  }

  function prev() {
    if (matches.value.length === 0) return
    currentIndex.value = (currentIndex.value - 1 + matches.value.length) % matches.value.length
  }

  function isMatch(path: string) {
    return matchSet.value.has(path)
  }

  function isCurrentMatch(path: string) {
    return currentIndex.value >= 0 && matches.value[currentIndex.value] === path
  }

  function clear() {
    query.value = ''
    debouncedQuery.value = ''
    currentIndex.value = -1
  }

  return {
    query,
    mode,
    matches,
    currentIndex,
    totalCount,
    currentMatchPath,
    matchSet,
    searchExpandedPaths,
    next,
    prev,
    isMatch,
    isCurrentMatch,
    clear,
  }
}
