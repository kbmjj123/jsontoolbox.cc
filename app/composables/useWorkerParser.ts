/**
 * Worker Parser Composable
 * Manages a Web Worker for off-main-thread JSON parsing
 */
export interface WorkerParseResult {
  data: unknown | null
  error: string | null
  line: number
  column: number
}

export const useWorkerParser = () => {
  const isParsing = ref(false)
  let worker: Worker | null = null
  let requestId = 0
  const pending = new Map<number, {
    resolve: (result: WorkerParseResult) => void
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

        // Update parsing state
        if (pending.size === 0) isParsing.value = false
      }
      worker.onerror = (e) => {
        // Reject all pending requests
        for (const [id, { resolve, timer }] of pending) {
          clearTimeout(timer)
          resolve({ data: null, error: e.message || 'Worker error', line: 0, column: 0 })
        }
        pending.clear()
        isParsing.value = false
        // Reset worker so it gets recreated on next use
        worker?.terminate()
        worker = null
      }
    }
    return worker
  }

  /**
   * Parse JSON text in a Web Worker
   * Returns a promise that resolves with the parsed data or error
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
   * Terminate the worker and reject all pending requests
   */
  function terminate() {
    for (const [, { resolve, timer }] of pending) {
      clearTimeout(timer)
      resolve({ data: null, error: 'Terminated', line: 0, column: 0 })
    }
    pending.clear()
    worker?.terminate()
    worker = null
    isParsing.value = false
  }

  // Cleanup on unmount
  onUnmounted(() => {
    terminate()
  })

  return {
    parseInWorker,
    terminate,
    isParsing: readonly(isParsing),
  }
}
