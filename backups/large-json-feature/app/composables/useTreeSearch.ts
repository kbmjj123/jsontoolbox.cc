import type { Ref } from 'vue'
import type { LazyTreeApi } from '~/composables/useLazyTree'
import { useWorkerParser } from '~/composables/useWorkerParser'

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
  const segments = path.replace(/\[(\d+)\]/g, '.$1').split('.')
  for (let i = 1; i < segments.length; i++) {
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

  if (mode === 'value' && String(data).toLowerCase().includes(query)) addMatch(currentPath, results, seen)
  if (mode === 'path' && currentPath.toLowerCase().includes(query)) addMatch(currentPath, results, seen)
}

/**
 * Search the streaming-parser index in the Worker (large-file / lazy mode) to
 * find matching paths. Runs entirely off the main thread, so the UI never blocks.
 */
async function searchLazyIndexInWorker(
  query: string,
  mode: SearchMode,
): Promise<string[]> {
  const { searchIndex } = useWorkerParser()
  return searchIndex(query, mode, MAX_SEARCH_RESULTS, MAX_SEARCH_NODES)
}

export function useTreeSearch(
  data: Ref<unknown>,
  lazy?: LazyTreeApi | null,
) {
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
  // `matches` is populated asynchronously (Worker search for large files, or a
  // fast main-thread walk for small files) so the UI stays responsive.
  const matches = ref<string[]>([])

  let searchToken = 0
  async function runSearch() {
    const q = debouncedQuery.value.trim().toLowerCase()
    const token = ++searchToken
    if (!q) {
      matches.value = []
      isSearching.value = false
      return
    }

    isSearching.value = true
    try {
      let results: string[]
      if (lazy?.isLazy) {
        // Large / lazy files: search runs in the Worker (off main thread).
        results = await searchLazyIndexInWorker(q, mode.value)
      } else if (data.value) {
        // Small files: a quick synchronous walk is fine (no freeze).
        const seen = new Set<string>()
        const budget: SearchBudget = { visited: 0, max: MAX_SEARCH_NODES, limit: MAX_SEARCH_RESULTS }
        results = []
        walkTree(data.value, '', q, mode.value, results, seen, budget)
      } else {
        results = []
      }
      if (token === searchToken) matches.value = results
    } finally {
      if (token === searchToken) isSearching.value = false
    }
  }

  watch([debouncedQuery, mode, () => lazy?.isLazy], runSearch)

  const matchSet = computed(() => new Set(matches.value))
  const totalCount = computed(() => matches.value.length)
  const currentMatchPath = computed(() => matches.value[currentIndex.value] ?? '')

  // Expand ONLY the ancestors of the *current* match. Expanding every match at
  // once would materialize thousands of subtrees and freeze the UI on a common
  // query (e.g. searching "id" in a huge array). Navigation (next/prev) walks
  // through matches one at a time, expanding each as it becomes current.
  const searchExpandedPaths = computed(() => {
    const path = currentMatchPath.value
    if (!path) return new Set<string>()
    return new Set(ancestorPaths(path))
  })

  // For lazy trees, make sure the whole ancestor chain (and the match itself) is
  // actually fetched — both each node's metadata AND its parent's child window —
  // so the match is revealed + expanded when the current match changes.
  function parentPathOf(path: string): string {
    if (path.endsWith(']')) {
      const i = path.lastIndexOf('[')
      return i > 0 ? path.slice(0, i) : ''
    }
    const i = path.lastIndexOf('.')
    return i > 0 ? path.slice(0, i) : ''
  }

  watch(currentMatchPath, async (path) => {
    if (!path || !lazy?.isLazy) return
    const chain = [...ancestorPaths(path), path]
    for (const node of chain) {
      await lazy.ensureNode(node)
      const parent = parentPathOf(node)
      if (!parent) continue
      const childCount = lazy.getNodeSummary(parent)?.childCount ?? 0
      const m = /\[(\d+)\]$/.exec(node)
      const idx = m ? Number(m[1]) : 0
      const limit = 200
      const offset = m ? Math.max(0, idx - Math.floor(limit / 2)) : 0
      await lazy.ensureChildren(parent, offset, limit)
      void childCount
    }
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
