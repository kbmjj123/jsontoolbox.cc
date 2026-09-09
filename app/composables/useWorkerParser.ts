/**
 * Worker Parser Composable
 * Manages Web Workers for off-main-thread JSON parsing.
 * Supports both normal (JSON.parse) and streaming (clarinet) modes.
 */
import type { LazyNode } from '~/workers/jsonStream.worker'

export interface WorkerParseResult {
  data: unknown | null
  error: string | null
  line: number
  column: number
}

export interface StreamParseResult {
  rootType: 'object' | 'array' | null
  nodeCount: number
  index: Record<string, LazyNode>
  error: string | null
  line: number
  column: number
}

export type StreamProgressCallback = (nodeCount: number, percent: number) => void

export const useWorkerParser = () => {
  const isParsing = ref(false)
  const parseProgress = ref(0)
  let worker: Worker | null = null
  let streamWorker: Worker | null = null
  let requestId = 0
  const pending = new Map<number, {
    resolve: (result: WorkerParseResult) => void
    timer: ReturnType<typeof setTimeout>
  }>()
  const streamPending = new Map<number, {
    resolve: (result: StreamParseResult) => void
    onProgress?: StreamProgressCallback
    timer: ReturnType<typeof setTimeout>
  }>()

  function getWorker(): Worker {
    if (!worker) {
      worker = new Worker(
        new URL('../workers/jsonParse.worker.ts', import.meta.url),
        { type: 'module' }
      )
      worker.onmessage = (e: MessageEvent) => {
        const { id, type, parsed, error, line, column } = e.data
        const pendingReq = pending.get(id)
        if (!pendingReq) return
        clearTimeout(pendingReq.timer)
        pending.delete(id)

        if (type === 'done') {
          pendingReq.resolve({ data: parsed, error: null, line: 0, column: 0 })
        }
        else {
          pendingReq.resolve({ data: null, error, line, column })
        }

        if (pending.size === 0) isParsing.value = false
      }
      worker.onerror = (e) => {
        for (const [id, { resolve, timer }] of pending) {
          clearTimeout(timer)
          resolve({ data: null, error: e.message || 'Worker error', line: 0, column: 0 })
        }
        pending.clear()
        isParsing.value = false
        worker?.terminate()
        worker = null
      }
    }
    return worker
  }

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
   * Parse JSON text using JSON.parse in a Web Worker
   */
  function parseInWorker(text: string, timeoutMs = 30000): Promise<WorkerParseResult> {
    return new Promise((resolve) => {
      const id = ++requestId
      const timer = setTimeout(() => {
        pending.delete(id)
        if (pending.size === 0) isParsing.value = false
        resolve({ data: null, error: 'Parse timeout', line: 0, column: 0 })
      }, timeoutMs)

      pending.set(id, { resolve, timer })
      isParsing.value = true

      const w = getWorker()
      w.postMessage({ id, text })
    })
  }

  /**
   * Parse JSON text using streaming parser (clarinet) in a Web Worker.
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
   * Terminate all workers and reject all pending requests
   */
  function terminate() {
    for (const [, { resolve, timer }] of pending) {
      clearTimeout(timer)
      resolve({ data: null, error: 'Terminated', line: 0, column: 0 })
    }
    pending.clear()
    for (const [, { resolve, timer }] of streamPending) {
      clearTimeout(timer)
      resolve({ rootType: null, nodeCount: 0, index: {}, error: 'Terminated', line: 0, column: 0 })
    }
    streamPending.clear()
    worker?.terminate()
    worker = null
    streamWorker?.terminate()
    streamWorker = null
    isParsing.value = false
    parseProgress.value = 0
  }

  onUnmounted(() => {
    terminate()
  })

  return {
    parseInWorker,
    parseStream,
    terminate,
    isParsing: readonly(isParsing),
    parseProgress: readonly(parseProgress),
  }
}
