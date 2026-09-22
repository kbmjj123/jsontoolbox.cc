import type { Ref } from 'vue'

export type SearchMode = 'key' | 'value' | 'path'

// Guardrails for the plain main-thread walk used by the regular tools:
//  - MAX_SEARCH_RESULTS: max matches we keep (navigation aid, not exhaustive)
//  - MAX_SEARCH_NODES:   max nodes we visit per search pass (time budget)
//
// Anything beyond these budgets belongs to the Large JSON Explorer, the only
// page that searches big documents (inside a Web Worker).
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

export function useTreeSearch(data: Ref<unknown>) {
  const query = ref('')
  // Debounce the actual search so we never fire a search on every keystroke.
  const debouncedQuery = ref('')
  let debounceTimer: ReturnType<typeof setTimeout> | null = null
  watch(query, (val) => {
    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => { debouncedQuery.value = val }, 250)
  })

  const mode = ref<SearchMode>('key')
  const currentIndex = ref(-1)
  const isSearching = ref(false)
  // `matches` is populated by a bounded, synchronous walk. Regular tools only
  // ever hold documents below LARGE_FILE_MAX_BYTES, so this stays well inside
  // the node budget and never needs a Worker.
  const matches = ref<string[]>([])

  let searchToken = 0

  function runSearch() {
    const q = debouncedQuery.value.trim().toLowerCase()
    const token = ++searchToken
    if (!q) {
      matches.value = []
      isSearching.value = false
      return
    }

    isSearching.value = true
    try {
      const results: string[] = []
      if (data.value) {
        const seen = new Set<string>()
        const budget: SearchBudget = { visited: 0, max: MAX_SEARCH_NODES, limit: MAX_SEARCH_RESULTS }
        walkTree(data.value, '', q, mode.value, results, seen, budget)
      }
      if (token === searchToken) matches.value = results
    } finally {
      if (token === searchToken) isSearching.value = false
    }
  }

  watch([debouncedQuery, mode], runSearch)

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
    isSearching,
    next,
    prev,
    isMatch,
    isCurrentMatch,
    clear,
  }
}
