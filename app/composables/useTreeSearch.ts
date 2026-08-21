import type { Ref } from 'vue'

export type SearchMode = 'key' | 'value' | 'path'

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

/**
 * Recursively walk the JSON tree and collect paths that match the query.
 */
function walkTree(
  data: unknown,
  currentPath: string,
  query: string,
  mode: SearchMode,
  results: string[],
): void {
  if (data === null || data === undefined) {
    if (mode === 'value' && 'null'.includes(query)) {
      results.push(currentPath)
    }
    return
  }

  if (Array.isArray(data)) {
    if (mode === 'path' && currentPath.toLowerCase().includes(query)) {
      results.push(currentPath)
    }
    for (let i = 0; i < data.length; i++) {
      walkTree(data[i], childPath(currentPath, i), query, mode, results)
    }
    return
  }

  if (typeof data === 'object') {
    if (mode === 'path' && currentPath.toLowerCase().includes(query)) {
      results.push(currentPath)
    }
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      const fullPath = childPath(currentPath, key)
      if (mode === 'key' && key.toLowerCase().includes(query)) {
        results.push(fullPath)
      }
      walkTree(value, fullPath, query, mode, results)
    }
    return
  }

  // Primitive
  if (mode === 'value' && String(data).toLowerCase().includes(query)) {
    results.push(currentPath)
  }
  if (mode === 'path' && currentPath.toLowerCase().includes(query)) {
    if (!results.includes(currentPath)) {
      results.push(currentPath)
    }
  }
}

export function useTreeSearch(data: Ref<unknown>) {
  const query = ref('')
  const mode = ref<SearchMode>('key')
  const currentIndex = ref(-1)

  const matches = computed<string[]>(() => {
    const q = query.value.trim().toLowerCase()
    if (!q || !data.value) return []
    const results: string[] = []
    walkTree(data.value, '', q, mode.value, results)
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
