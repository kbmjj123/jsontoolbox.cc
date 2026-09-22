/**
 * Lazy Tree Composable (async / on-demand)
 *
 * For large files the full node index lives INSIDE the streaming Worker. The
 * main thread never holds more than the summaries + the subtree windows it has
 * actually requested, so memory and transfer cost stay bounded no matter how
 * big the file is. Children are fetched windowed via `ensureChildren`, which
 * pairs with the virtualized tree (only the visible slice is ever requested).
 */
import type { Ref } from 'vue'
import { readonly, ref } from 'vue'
import type { WorkerChildEntry } from '~/workers/jsonStream.worker'
import { fetchChildren, fetchNode } from '~/composables/useWorkerParser'

export interface NodeSummary {
  type: 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null'
  childCount: number
  line: number
}

interface ParentCache {
  childCount: number
  byPath: Map<string, WorkerChildEntry>
  byIndex: Map<number, string>
  loadedFrom: number
  loadedTo: number
}

export interface LazyTreeApi {
  /** True once a large-file parse has produced a summary. */
  ready: Readonly<Ref<boolean>>
  /** Total number of nodes in the file (for the "(N nodes)" badge). */
  nodeCount: Readonly<Ref<number>>
  /** Whether this store represents a lazy (worker-backed) tree. */
  isLazy: boolean
  initFromSummary: (rootType: 'object' | 'array' | null, rootChildCount: number, nodeCount: number) => void
  reset: () => void
  getNodeSummary: (path: string) => NodeSummary | null
  /** Direct child at a given index, or null if not fetched yet. */
  getChildByIndex: (path: string, index: number) => WorkerChildEntry | null
  /** Index of a child by path within its parent (cached window only). */
  getChildIndex: (parentPath: string, childPath: string) => number | null
  /** Fetch (and cache) a window of a node's children. */
  ensureChildren: (path: string, offset: number, limit: number) => Promise<ChildrenResultLocal>
  /** Fetch (and cache) a single node's metadata by path. */
  ensureNode: (path: string) => Promise<WorkerChildEntry | null>
  /** Source line for a path, for click→editor highlighting. */
  getNodeLine: (path: string) => number | null
}

interface ChildrenResultLocal {
  childCount: number
  entries: WorkerChildEntry[]
}

function parentPathOf(path: string): string {
  if (path.endsWith(']')) {
    const i = path.lastIndexOf('[')
    return i > 0 ? path.slice(0, i) : ''
  }
  const i = path.lastIndexOf('.')
  return i > 0 ? path.slice(0, i) : ''
}

export function useLazyTree() {
  const root = ref<{ type: NodeSummary['type']; childCount: number; line: number } | null>(null)
  const nodeCount = ref(0)
  const ready = ref(false)
  // Plain (non-reactive) cache; a version bump drives reactivity on mutation.
  const cache = new Map<string, ParentCache>()
  const version = ref(0)

  function bump() {
    version.value++
  }

  function initFromSummary(
    rootType: 'object' | 'array' | null,
    rootChildCount: number,
    total: number,
  ) {
    cache.clear()
    root.value = { type: rootType ?? 'object', childCount: rootChildCount, line: 1 }
    nodeCount.value = total
    ready.value = true
    bump()
  }

  function reset() {
    cache.clear()
    root.value = null
    nodeCount.value = 0
    ready.value = false
    bump()
  }

  function getNodeSummary(path: string): NodeSummary | null {
    void version.value
    if (path === '') return root.value
    const parent = parentPathOf(path)
    const pc = cache.get(parent)
    const entry = pc?.byPath.get(path)
    if (!entry) return null
    return { type: entry.type, childCount: entry.childCount, line: entry.line }
  }

  function getChildByIndex(path: string, index: number): WorkerChildEntry | null {
    void version.value
    const pc = cache.get(path)
    if (!pc) return null
    const childPath = pc.byIndex.get(index)
    return childPath ? (pc.byPath.get(childPath) ?? null) : null
  }

  function getChildIndex(parentPath: string, childPath: string): number | null {
    void version.value
    const pc = cache.get(parentPath)
    const entry = pc?.byPath.get(childPath)
    return entry ? entry.index : null
  }

  async function ensureChildren(path: string, offset: number, limit: number): Promise<ChildrenResultLocal> {
    let pc = cache.get(path)
    if (pc && offset >= pc.loadedFrom && offset + limit <= pc.loadedTo) {
      return { childCount: pc.childCount, entries: [] }
    }
    if (!pc) {
      pc = { childCount: 0, byPath: new Map(), byIndex: new Map(), loadedFrom: Infinity, loadedTo: -1 }
      cache.set(path, pc)
    }
    const res = await fetchChildren(path, offset, limit)
    pc.childCount = res.childCount
    for (const e of res.entries) {
      pc.byPath.set(e.childPath, e)
      pc.byIndex.set(e.index, e.childPath)
    }
    pc.loadedFrom = Math.min(pc.loadedFrom, offset)
    pc.loadedTo = Math.max(pc.loadedTo, offset + res.entries.length)
    bump()
    return res
  }

  async function ensureNode(path: string): Promise<WorkerChildEntry | null> {
    const parent = parentPathOf(path)
    const pc = cache.get(parent)
    if (pc?.byPath.has(path)) return pc.byPath.get(path) ?? null
    const entry = await fetchNode(path)
    if (!entry) return null
    let p = cache.get(parent)
    if (!p) {
      p = { childCount: 0, byPath: new Map(), byIndex: new Map(), loadedFrom: Infinity, loadedTo: -1 }
      cache.set(parent, p)
    }
    p.byPath.set(path, entry)
    p.byIndex.set(entry.index, path)
    bump()
    return entry
  }

  function getNodeLine(path: string): number | null {
    return getNodeSummary(path)?.line ?? null
  }

  return {
    ready: readonly(ready),
    nodeCount: readonly(nodeCount),
    isLazy: true,
    initFromSummary,
    reset,
    getNodeSummary,
    getChildByIndex,
    getChildIndex,
    ensureChildren,
    ensureNode,
    getNodeLine,
  }
}
