/**
 * Lazy Tree Composable
 * Manages the LazyNodeIndex from streaming JSON parsing.
 * Provides methods to query the tree without materializing the full JS object.
 */
import type { LazyNode } from '~/workers/jsonStream.worker'

export interface LazyTreeState {
  index: Map<string, LazyNode>
  rootType: 'object' | 'array' | null
  nodeCount: number
}

export function useLazyTree() {
  const state = ref<LazyTreeState>({
    index: new Map(),
    rootType: null,
    nodeCount: 0,
  })

  const progress = ref(0)
  const isStreaming = ref(false)
  const streamError = ref<string | null>(null)

  /**
   * Initialize from a Worker's done result (Record<string, LazyNode>)
   */
  function initFromIndex(
    rootType: 'object' | 'array' | null,
    nodeCount: number,
    indexRecord: Record<string, LazyNode>,
  ) {
    state.value = {
      index: new Map(Object.entries(indexRecord)),
      rootType,
      nodeCount,
    }
    progress.value = 100
    isStreaming.value = false
    streamError.value = null
  }

  /**
   * Update progress during streaming
   */
  function updateProgress(nodeCount: number, percent: number) {
    progress.value = percent
    state.value.nodeCount = nodeCount
  }

  /**
   * Get a node by path
   */
  function getNode(path: string): LazyNode | undefined {
    return state.value.index.get(path)
  }

  /**
   * Get children of a node by path
   */
  function getChildren(path: string): LazyNode[] {
    const node = state.value.index.get(path)
    if (!node) return []
    return node.children
      .map(childPath => state.value.index.get(childPath))
      .filter((n): n is LazyNode => n !== undefined)
  }

  /**
   * Get the root node (path = '')
   */
  function getRoot(): LazyNode | undefined {
    return state.value.index.get('')
  }

  /**
   * Check if a path exists in the index
   */
  function hasNode(path: string): boolean {
    return state.value.index.has(path)
  }

  /**
   * Get total node count
   */
  function getNodeCount(): number {
    return state.value.nodeCount
  }

  /**
   * Reset all state
   */
  function reset() {
    state.value = { index: new Map(), rootType: null, nodeCount: 0 }
    progress.value = 0
    isStreaming.value = false
    streamError.value = null
  }

  return {
    state: readonly(state),
    progress: readonly(progress),
    isStreaming: readonly(isStreaming),
    streamError: readonly(streamError),
    initFromIndex,
    updateProgress,
    getNode,
    getChildren,
    getRoot,
    hasNode,
    getNodeCount,
    reset,
  }
}
