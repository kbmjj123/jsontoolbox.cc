/**
 * Streaming JSON Parse Worker
 *
 * Builds a lazy node index WITHOUT materializing the full JS object in memory.
 *
 * Large-file strategy (keeps the main thread responsive):
 *  - The full index is RETAINED INSIDE the worker (never transferred back).
 *  - On parse we only post a lightweight SUMMARY (root type + child count +
 *    total node count).
 *  - The main thread asks for node children on demand, windowed, via
 *    `getChildren`. Memory and transfer cost stay bounded regardless of file
 *    size — a 200MB file no longer freezes or OOMs the tab.
 *
 * Note: parsing is done by a small self-contained scanner (`buildIndex`) rather
 * than an npm streaming parser. clarinet (previously used) is CommonJS and
 * requires node's `stream` builtin; under Vite's browser bundle that resolves
 * to an empty stub, so `Stream.prototype` is undefined and the module throws on
 * load — which made the whole streaming path dead in the browser. The scanner
 * below has no dependencies and also lets us record an exact source line per
 * node (used for click→editor highlighting).
 */
export interface LazyNode {
  path: string
  type: 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null'
  key: string | number
  depth: number
  childCount: number
  children: string[]
  preview?: string
  /** 1-based source line where this node starts (for click→editor highlight) */
  line: number
}

/** A single child entry returned to the main thread on demand. */
export interface WorkerChildEntry {
  childPath: string
  key: string | number
  type: 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null'
  preview?: string
  childCount: number
  line: number
  /** Position among the parent's direct children (0-based). */
  index: number
  isArrayIndex: boolean
}

export interface StreamRequest {
  id: number
  text: string
  mode: 'stream'
}

export interface StreamProgress {
  id: number
  type: 'progress'
  nodeCount: number
  percent: number
}

export interface StreamDone {
  id: number
  type: 'done'
  rootType: 'object' | 'array' | null
  /** Number of direct children of the root node. */
  rootChildCount: number
  nodeCount: number
}

export interface StreamError {
  id: number
  type: 'error'
  error: string
  line: number
  column: number
}

export interface ChildrenRequest {
  id: number
  mode: 'children'
  path: string
  offset: number
  limit: number
}

export interface ChildrenResponse {
  id: number
  type: 'children'
  path: string
  childCount: number
  entries: WorkerChildEntry[]
}

export interface NodeRequest {
  id: number
  mode: 'node'
  path: string
}

export interface NodeResponse {
  id: number
  type: 'node'
  entry: WorkerChildEntry | null
}

type WorkerResponse =
  | StreamProgress
  | StreamDone
  | StreamError
  | ChildrenResponse
  | NodeResponse

export interface SearchRequest {
  id: number
  mode: 'search'
  query: string
  searchMode: 'key' | 'value' | 'path'
  limit: number
  maxNodes: number
}

export interface SearchResult {
  id: number
  type: 'searchResult'
  matchPaths: string[]
  truncated: boolean
  scannedNodes: number
}

// The most recently built index is retained in the Worker so child/search
// requests can be served off the main thread — without re-parsing or
// re-transferring the data.
let retainedIndex: Record<string, LazyNode> | null = null

const MAX_PREVIEW = 50

interface Frame {
  path: string
  type: 'object' | 'array'
  childCount: number
  children: string[]
  /** Next index to assign to an element (arrays only). */
  nextIndex: number
  /** Key context to restore once this container is closed. */
  restoreKey: string | number
}

function isWs(c: string): boolean {
  return c === ' ' || c === '\t' || c === '\r' || c === '\n'
}

function isNumberChar(c: string): boolean {
  return (c >= '0' && c <= '9') || c === '-' || c === '+' || c === '.' || c === 'e' || c === 'E'
}

function childPath(parentPath: string, key: string | number): string {
  if (typeof key === 'number') return `${parentPath}[${key}]`
  const k = String(key)
  if (!parentPath) return k
  return `${parentPath}.${k}`
}

/**
 * Dependency-free streaming JSON scanner.
 * Walks the text once and builds the lazy node index. Throws a descriptive
 * error (with position) on malformed input.
 */
function buildIndex(
  text: string,
  onProgress?: (nodeCount: number) => void,
): { index: Record<string, LazyNode>; nodeCount: number; rootType: 'object' | 'array' | null } {
  const index: Record<string, LazyNode> = {}
  let nodeCount = 0
  let rootType: 'object' | 'array' | null = null

  let line = 1
  let i = 0
  const stack: Frame[] = []
  /** Key/index to use for the NEXT child of the current container. */
  let currentKey: string | number = ''
  /** True while we are positioned to read an object key. */
  let expectKey = false
  /** True right after an object key, until ':' is consumed. */
  let expectColon = false
  /** True right after ':', until a value is consumed. */
  let expectValue = false
  /** Guards against trailing content after the root value. */
  let sawRoot = false
  let lastProgressReport = 0

  function openContainer(type: 'object' | 'array') {
    const parent = stack.length > 0 ? stack[stack.length - 1] : null
    const parentPath = parent ? parent.path : ''
    const path = childPath(parentPath, currentKey)

    if (!parent) rootType = type

    const node: LazyNode = {
      path,
      type,
      key: currentKey,
      depth: stack.length,
      childCount: 0,
      children: [],
      line,
    }
    index[path] = node
    nodeCount++

    let restoreKey: string | number = currentKey
    if (parent) {
      parent.children.push(path)
      parent.childCount++
      if (parent.type === 'array') {
        parent.nextIndex++
        restoreKey = parent.nextIndex
      }
    }

    stack.push({ path, type, childCount: 0, children: [], nextIndex: 0, restoreKey })
    if (type === 'array') {
      currentKey = 0
      expectKey = false
    } else {
      currentKey = ''
      expectKey = true
    }
  }

  function closeContainer() {
    const frame = stack.pop()
    if (!frame) throw new Error(`Unexpected token at position ${i}`)
    const node = index[frame.path]
    if (node) {
      node.childCount = frame.childCount
      node.children = frame.children
    }
    currentKey = frame.restoreKey
    expectKey = false
  }

  function addValue(type: 'string' | 'number' | 'boolean' | 'null', raw: string | number | boolean | null, preview: string) {
    const parent = stack.length > 0 ? stack[stack.length - 1] : null
    const parentPath = parent ? parent.path : ''
    const path = childPath(parentPath, currentKey)

    const node: LazyNode = {
      path,
      type,
      key: currentKey,
      depth: stack.length,
      childCount: 0,
      children: [],
      preview,
      line,
    }
    index[path] = node
    nodeCount++

    if (parent) {
      parent.children.push(path)
      parent.childCount++
      if (parent.type === 'array') {
        parent.nextIndex++
        currentKey = parent.nextIndex
      }
    }
  }

  function readString(): string {
    // text[i] === '"'
    i++
    let out = ''
    while (i < text.length) {
      const c = text[i]
      if (c === '\\') {
        const n = text[i + 1]
        i += 2
        if (n === 'n') out += '\n'
        else if (n === 't') out += '\t'
        else if (n === 'r') out += '\r'
        else if (n === 'b') out += '\b'
        else if (n === 'f') out += '\f'
        else if (n === 'u') { out += String.fromCharCode(parseInt(text.substr(i, 4), 16)); i += 4 }
        else out += n ?? ''
        continue
      }
      if (c === '"') { i++; break }
      if (c === '\n') line++
      out += c
      i++
    }
    return out
  }

  function previewOf(type: 'string' | 'number' | 'boolean' | 'null', raw: string | number | boolean | null): string {
    if (type === 'null') return 'null'
    if (type === 'string') {
      const s = String(raw)
      return `"${s.length > MAX_PREVIEW ? s.substring(0, MAX_PREVIEW) + '…' : s}"`
    }
    return String(raw)
  }

  while (i < text.length) {
    const c = text[i]

    if (c === '\n') { line++; i++; continue }
    if (isWs(c)) { i++; continue }

    if (c === '{' || c === '[') {
      if (expectColon) throw new Error(`Unexpected token at position ${i}`)
      if (sawRoot && stack.length === 0) throw new Error(`Unexpected token at position ${i}`)
      if (stack.length === 0) sawRoot = true
      openContainer(c === '{' ? 'object' : 'array')
      expectValue = false
      i++
      if (onProgress && nodeCount - lastProgressReport >= 5000) {
        lastProgressReport = nodeCount
        onProgress(nodeCount)
      }
      continue
    }

    if (c === '}' || c === ']') {
      if (expectValue || expectColon) throw new Error(`Unexpected token at position ${i}`)
      closeContainer()
      expectValue = false
      expectColon = false
      i++
      continue
    }

    if (c === ',') {
      if (expectValue || expectColon) throw new Error(`Unexpected token at position ${i}`)
      i++
      const top = stack.length > 0 ? stack[stack.length - 1] : null
      if (top) {
        if (top.type === 'array') currentKey = top.nextIndex
        else expectKey = true
      }
      continue
    }

    if (c === ':') {
      if (!expectColon) throw new Error(`Unexpected token at position ${i}`)
      i++
      expectColon = false
      expectValue = true
      continue
    }

    if (c === '"') {
      const value = readString()
      if (expectKey) {
        currentKey = value
        expectKey = false
        expectColon = true
      } else {
        if (expectColon) throw new Error(`Unexpected token at position ${i}`)
        addValue('string', value, previewOf('string', value))
        expectValue = false
        if (onProgress && nodeCount - lastProgressReport >= 5000) {
          lastProgressReport = nodeCount
          onProgress(nodeCount)
        }
      }
      continue
    }

    if (c === 't') {
      if (!text.startsWith('true', i)) throw new Error(`Unexpected token at position ${i}`)
      if (expectColon) throw new Error(`Unexpected token at position ${i}`)
      i += 4
      addValue('boolean', true, 'true')
      expectValue = false
      continue
    }
    if (c === 'f') {
      if (!text.startsWith('false', i)) throw new Error(`Unexpected token at position ${i}`)
      if (expectColon) throw new Error(`Unexpected token at position ${i}`)
      i += 5
      addValue('boolean', false, 'false')
      expectValue = false
      continue
    }
    if (c === 'n') {
      if (!text.startsWith('null', i)) throw new Error(`Unexpected token at position ${i}`)
      if (expectColon) throw new Error(`Unexpected token at position ${i}`)
      i += 4
      addValue('null', null, 'null')
      expectValue = false
      continue
    }

    if (isNumberChar(c)) {
      if (expectColon) throw new Error(`Unexpected token at position ${i}`)
      const start = i
      while (i < text.length && isNumberChar(text[i])) i++
      const raw = text.slice(start, i)
      const num = Number(raw)
      if (Number.isNaN(num)) throw new Error(`Invalid number at position ${start}`)
      addValue('number', num, String(num))
      expectValue = false
      if (onProgress && nodeCount - lastProgressReport >= 5000) {
        lastProgressReport = nodeCount
        onProgress(nodeCount)
      }
      continue
    }

    throw new Error(`Unexpected token at position ${i}`)
  }

  if (stack.length > 0) throw new Error('Unexpected end of input')

  return { index, nodeCount, rootType }
}

/**
 * Search the retained index in the Worker. Iterative (stack-based) traversal,
 * bounded by a node-visit budget + result limit so a huge file can't run away.
 */
function searchIndexLogic(
  index: Record<string, LazyNode> | null,
  query: string,
  mode: 'key' | 'value' | 'path',
  limit: number,
  maxNodes: number,
): { matchPaths: string[]; truncated: boolean; scannedNodes: number } {
  const matchPaths: string[] = []
  const seen = new Set<string>()
  if (!index) return { matchPaths, truncated: false, scannedNodes: 0 }
  const root = index['']
  if (!root) return { matchPaths, truncated: false, scannedNodes: 0 }

  let visited = 0
  const stack: string[] = [...root.children]
  while (stack.length && visited < maxNodes && matchPaths.length < limit) {
    const path = stack.pop() as string
    const node = index[path]
    if (!node) continue
    visited++

    let matched = false
    if (mode === 'key') {
      matched = String(node.key).toLowerCase().includes(query)
    } else if (mode === 'value') {
      matched = !!(node.preview && node.preview.toLowerCase().includes(query))
    } else {
      matched = path.toLowerCase().includes(query)
    }

    if (matched && !seen.has(path)) {
      seen.add(path)
      matchPaths.push(path)
    }

    if (node.type === 'object' || node.type === 'array') {
      for (const child of node.children) stack.push(child)
    }
  }

  const truncated = stack.length > 0
  return { matchPaths, truncated, scannedNodes: visited }
}

function toChildEntry(childPathKey: string, indexAt: number): WorkerChildEntry {
  const node = retainedIndex![childPathKey]
  return {
    childPath: childPathKey,
    key: node.key,
    type: node.type,
    preview: node.preview,
    childCount: node.childCount,
    line: node.line,
    index: indexAt,
    isArrayIndex: node.type === 'array',
  }
}

self.onmessage = (
  e: MessageEvent<StreamRequest | ChildrenRequest | NodeRequest | SearchRequest>,
) => {
  const data = e.data

  // ── Search request: serve from the retained index, off the main thread ──
  if (data.mode === 'search') {
    const { matchPaths, truncated, scannedNodes } = searchIndexLogic(
      retainedIndex,
      data.query,
      data.searchMode,
      data.limit,
      data.maxNodes,
    )
    const result: SearchResult = { id: data.id, type: 'searchResult', matchPaths, truncated, scannedNodes }
    self.postMessage(result)
    return
  }

  // ── Children request: return a window of a node's direct children ──
  if (data.mode === 'children') {
    const node = retainedIndex?.[data.path]
    const response: ChildrenResponse = {
      id: data.id,
      type: 'children',
      path: data.path,
      childCount: node ? node.childCount : 0,
      entries: node
        ? node.children
          .slice(data.offset, data.offset + data.limit)
          .map((cp, k) => toChildEntry(cp, data.offset + k))
        : [],
    }
    self.postMessage(response)
    return
  }

  // ── Single node request: return one node's entry (used to expand/scroll) ──
  if (data.mode === 'node') {
    const node = retainedIndex?.[data.path]
    const response: NodeResponse = {
      id: data.id,
      type: 'node',
      entry: node ? toChildEntry(data.path, -1) : null,
    }
    self.postMessage(response)
    return
  }

  // ── Stream parse request ──
  const { id, text } = data as StreamRequest

  try {
    const { index, nodeCount, rootType } = buildIndex(text, (n) => {
      const percent = Math.min(99, Math.round((n / Math.max(n + 1000, 1)) * 100))
      const response: WorkerResponse = { id, type: 'progress', nodeCount: n, percent }
      self.postMessage(response)
    })

    retainedIndex = index
    const root = index['']
    const response: WorkerResponse = {
      id,
      type: 'done',
      rootType,
      rootChildCount: root ? root.childCount : 0,
      nodeCount,
    }
    self.postMessage(response)
  } catch (err) {
    const message = (err as Error).message || String(err)
    const posMatch = message.match(/position (\d+)/)
    let errLine = 0
    let column = 0
    if (posMatch) {
      const pos = parseInt(posMatch[1])
      const lines = text.substring(0, pos).split('\n')
      errLine = lines.length
      column = lines[lines.length - 1].length + 1
    }
    const response: WorkerResponse = { id, type: 'error', error: message, line: errLine, column }
    self.postMessage(response)
  }
}
