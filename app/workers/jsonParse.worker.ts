/**
 * JSON Parse Web Worker
 * Offloads JSON.parse to a background thread to keep UI responsive
 */

interface ParseRequest {
  id: number
  text: string
}

interface ParseSuccess {
  id: number
  type: 'done'
  parsed: unknown
}

interface ParseError {
  id: number
  type: 'error'
  error: string
  line: number
  column: number
}

type WorkerResponse = ParseSuccess | ParseError

self.onmessage = (e: MessageEvent<ParseRequest>) => {
  const { id, text } = e.data
  try {
    const parsed = JSON.parse(text)
    const response: WorkerResponse = { id, type: 'done', parsed }
    self.postMessage(response)
  }
  catch (err) {
    const message = (err as Error).message
    // Extract position from error message
    const posMatch = message.match(/position (\d+)/)
    let line = 0
    let column = 0
    if (posMatch) {
      const pos = parseInt(posMatch[1])
      const lines = text.substring(0, pos).split('\n')
      line = lines.length
      column = lines[lines.length - 1].length + 1
    }
    const response: WorkerResponse = { id, type: 'error', error: message, line, column }
    self.postMessage(response)
  }
}
