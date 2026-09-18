/**
 * Streaming JSON Parse Worker
 * Uses clarinet (SAX-style parser) to build a lazy node index
 * without materializing the full JS object in memory.
 */
import { parser as clarinetParser } from 'clarinet'

export interface LazyNode {
  path: string
  type: 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null'
  key: string | number
  depth: number
  childCount: number
  children: string[]
  preview?: string
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
  nodeCount: number
  index: Record<string, LazyNode>
}

export interface StreamError {
  id: number
  type: 'error'
  error: string
  line: number
  column: number
}

type WorkerResponse = StreamProgress | StreamDone | StreamError

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

// The most recently built index is retained in the Worker so search requests can
// be served off the main thread — without re-parsing or re-transferring the data.
let retainedIndex: Record<string, LazyNode> | null = null

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

self.onmessage = (e: MessageEvent<StreamRequest | SearchRequest>) => {
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

  const { id, text } = data

  const index: Record<string, LazyNode> = {}
  let nodeCount = 0
  let rootType: 'object' | 'array' | null = null

  // Stack to track current path during parsing
  const stack: Array<{ path: string; type: 'object' | 'array'; childCount: number; children: string[] }> = []
  let currentKey: string | number = ''
  let lastProgressReport = 0

  const p = clarinetParser()

  p.onerror = (err: Error) => {
    // Try to extract line/column from clarinet error
    const message = err.message || String(err)
    const lineMatch = message.match(/line (\d+)/i)
    const colMatch = message.match(/column (\d+)/i)
    const response: WorkerResponse = {
      id,
      type: 'error',
      error: message,
      line: lineMatch ? parseInt(lineMatch[1]) : 0,
      column: colMatch ? parseInt(colMatch[1]) : 0,
    }
    self.postMessage(response)
  }

  p.onopenobject = (key: string) => {
    const parentPath = stack.length > 0 ? stack[stack.length - 1].path : ''
    const path = parentPath === '' ? (key || '') : (typeof currentKey === 'number' ? `${parentPath}[${currentKey}]` : (parentPath ? `${parentPath}.${key}` : key))

    if (stack.length === 0) {
      rootType = 'object'
    }

    // Register this object node
    const node: LazyNode = {
      path: path || '',
      type: 'object',
      key: key || '',
      depth: stack.length,
      childCount: 0,
      children: [],
    }
    index[path || ''] = node
    nodeCount++

    // Notify parent about this child
    if (stack.length > 0) {
      const parent = stack[stack.length - 1]
      parent.children.push(path || '')
      parent.childCount++
    }

    stack.push({ path: path || '', type: 'object', childCount: 0, children: [] })
    currentKey = key || ''

    reportProgress(id, text.length)
  }

  p.onkey = (key: string) => {
    currentKey = key
  }

  p.oncloseobject = () => {
    if (stack.length > 0) {
      const frame = stack.pop()!
      const node = index[frame.path]
      if (node) {
        node.childCount = frame.childCount
        node.children = frame.children
      }
    }
  }

  p.onopenarray = () => {
    const parentPath = stack.length > 0 ? stack[stack.length - 1].path : ''
    const arrayKey = typeof currentKey === 'number' ? `[${currentKey}]` : currentKey
    const path = parentPath === '' ? '' : (parentPath ? `${parentPath}.${arrayKey}` : arrayKey)

    if (stack.length === 0) {
      rootType = 'array'
    }

    const node: LazyNode = {
      path: path || '',
      type: 'array',
      key: arrayKey || '',
      depth: stack.length,
      childCount: 0,
      children: [],
    }
    index[path || ''] = node
    nodeCount++

    if (stack.length > 0) {
      const parent = stack[stack.length - 1]
      parent.children.push(path || '')
      parent.childCount++
    }

    stack.push({ path: path || '', type: 'array', childCount: 0, children: [] })
    currentKey = 0

    reportProgress(id, text.length)
  }

  p.onclosearray = () => {
    if (stack.length > 0) {
      const frame = stack.pop()!
      const node = index[frame.path]
      if (node) {
        node.childCount = frame.childCount
        node.children = frame.children
      }
    }
  }

  p.onvalue = (v: string | number | boolean | null) => {
    const parentPath = stack.length > 0 ? stack[stack.length - 1].path : ''
    const key = typeof currentKey === 'number' ? `[${currentKey}]` : currentKey
    const path = parentPath === '' ? key : (parentPath ? `${parentPath}.${key}` : key)

    let type: LazyNode['type'] = 'null'
    if (typeof v === 'string') type = 'string'
    else if (typeof v === 'number') type = 'number'
    else if (typeof v === 'boolean') type = 'boolean'

    const preview = v === null ? 'null' : (type === 'string' ? `"${String(v).substring(0, 50)}${String(v).length > 50 ? '…' : ''}"` : String(v))

    const node: LazyNode = {
      path: path || '',
      type,
      key: currentKey,
      depth: stack.length,
      childCount: 0,
      children: [],
      preview,
    }
    index[path || ''] = node
    nodeCount++

    if (stack.length > 0) {
      const parent = stack[stack.length - 1]
      parent.children.push(path || '')
      parent.childCount++
    }

    // Increment array index
    if (stack.length > 0 && stack[stack.length - 1].type === 'array') {
      currentKey = (currentKey as number) + 1
    }

    reportProgress(id, text.length)
  }

  p.onend = () => {
    retainedIndex = index
    const response: WorkerResponse = {
      id,
      type: 'done',
      rootType,
      nodeCount,
      index,
    }
    self.postMessage(response)
  }

  try {
    // Feed text in chunks to allow progress reporting
    const CHUNK_SIZE = 1024 * 1024 // 1MB chunks
    for (let offset = 0; offset < text.length; offset += CHUNK_SIZE) {
      const chunk = text.substring(offset, Math.min(offset + CHUNK_SIZE, text.length))
      p.write(chunk)
    }
    p.close()
  } catch (err) {
    const message = (err as Error).message || String(err)
    const posMatch = message.match(/position (\d+)/)
    let line = 0, column = 0
    if (posMatch) {
      const pos = parseInt(posMatch[1])
      const lines = text.substring(0, pos).split('\n')
      line = lines.length
      column = lines[lines.length - 1].length + 1
    }
    const response: WorkerResponse = { id, type: 'error', error: message, line, column }
    self.postMessage(response)
  }

  function reportProgress(reqId: number, totalChars: number) {
    nodeCount // access outer variable
    // Report every 5000 nodes
    if (nodeCount - lastProgressReport >= 5000) {
      lastProgressReport = nodeCount
      // Estimate percent based on text position (rough)
      const percent = Math.min(99, Math.round((nodeCount / Math.max(nodeCount + 1000, 1)) * 100))
      const response: WorkerResponse = {
        id: reqId,
        type: 'progress',
        nodeCount,
        percent,
      }
      self.postMessage(response)
    }
  }
}
