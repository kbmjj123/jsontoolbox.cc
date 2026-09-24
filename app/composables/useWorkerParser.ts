/**
 * Worker Parser Composable
 *
 * Owns the streaming JSON parser (clarinet) that builds a lazy node index
 * without materializing the document as one JS object.
 *
 * This is large-file machinery: the only consumer is the Large JSON Explorer.
 * Regular tools parse with `JSON.parse` on the main thread and hand anything
 * above LARGE_FILE_MAX_BYTES over to that page instead.
 */
import type { LazyNode } from '~/workers/jsonStream.worker'

export interface StreamParseResult {
  rootType: 'object' | 'array' | null
  nodeCount: number
  index: Record<string, LazyNode>
  error: string | null
  line: number
  column: number
}

export type StreamProgressCallback = (nodeCount: number, percent: number) => void

// ── Module-level singletons ──────────────────────────────────────────────
// The streaming Worker retains the built index, so every caller must share the
// SAME Worker instance — hence these live at module scope.
let streamWorker: Worker | null = null
let requestId = 0
let isParsing = ref(false)
let parseProgress = ref(0)
const streamPending = new Map<number, {
  resolve: (result: StreamParseResult) => void
  onProgress?: StreamProgressCallback
  timer: ReturnType<typeof setTimeout>
}>()

function getStreamWorker(): Worker {
  if (!streamWorker) {
    streamWorker = new Worker(
      new URL('../workers/jsonStream.worker.ts', import.meta.url),
      { type: 'module' }
    )
    streamWorker.onmessage = (e: MessageEvent) => {
      const { id, type, rootType, nodeCount, index, percent, error, line, column } = e.data

      const pendingReq = streamPending.get(id)
      if (!pendingReq) return

      if (type === 'progress') {
        pendingReq.onProgress?.(nodeCount, percent)
        parseProgress.value = percent
        return
      }

      clearTimeout(pendingReq.timer)
      streamPending.delete(id)

      if (type === 'done') {
        pendingReq.resolve({ rootType, nodeCount, index, error: null, line: 0, column: 0 })
      } else {
        pendingReq.resolve({ rootType: null, nodeCount: 0, index: {}, error, line, column })
      }

      if (streamPending.size === 0) {
        isParsing.value = false
        parseProgress.value = 0
      }
    }
    streamWorker.onerror = (e) => {
      for (const [id, { resolve, timer }] of streamPending) {
        clearTimeout(timer)
        resolve({ rootType: null, nodeCount: 0, index: {}, error: e.message || 'Worker error', line: 0, column: 0 })
      }
      streamPending.clear()
      isParsing.value = false
      parseProgress.value = 0
      streamWorker?.terminate()
      streamWorker = null
    }
  }
  return streamWorker
}

/**
 * Parse JSON text using the streaming parser (clarinet) in a Web Worker.
 * Builds a LazyNodeIndex instead of a full JS object.
 */
function parseStream(
  text: string,
  onProgress?: StreamProgressCallback,
  timeoutMs = 120000,
): Promise<StreamParseResult> {
  return new Promise((resolve) => {
    const id = ++requestId
    const timer = setTimeout(() => {
      streamPending.delete(id)
      if (streamPending.size === 0) {
        isParsing.value = false
        parseProgress.value = 0
      }
      resolve({ rootType: null, nodeCount: 0, index: {}, error: 'Stream parse timeout', line: 0, column: 0 })
    }, timeoutMs)

    streamPending.set(id, { resolve, onProgress, timer })
    isParsing.value = true
    parseProgress.value = 0

    const w = getStreamWorker()
    w.postMessage({ id, text, mode: 'stream' })
  })
}

/**
 * Terminate the worker and reject all pending requests
 */
function terminate() {
  for (const [, { resolve, timer }] of streamPending) {
    clearTimeout(timer)
    resolve({ rootType: null, nodeCount: 0, index: {}, error: 'Terminated', line: 0, column: 0 })
  }
  streamPending.clear()
  streamWorker?.terminate()
  streamWorker = null
  isParsing.value = false
  parseProgress.value = 0
}

export const useWorkerParser = () => {
  return {
    parseStream,
    terminate,
    isParsing: readonly(isParsing),
    parseProgress: readonly(parseProgress),
  }
}
