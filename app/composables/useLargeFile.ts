import { ref } from 'vue'
import type {
  ScanResult,
  FieldsResult,
  CsvChunk,
  SearchResultMsg,
  FileFormat,
  FieldStat,
  SearchHit,
  ArrayMode,
} from '~/workers/recordStream.worker'

export type LfStatus =
  | 'idle'
  | 'scanning'
  | 'ready'
  | 'invalid'
  | 'error'
  | 'exporting'
  | 'searching'

export interface ScanErrorInfo {
  message: string
  line?: number
  column?: number
  snippet?: string
}

export interface LargeFileHandoff {
  file?: File
  text?: string
  format?: FileFormat
  fileName?: string
}

/** Shared, in-memory handoff payload so the small-file page can carry a file to
 *  the dedicated Large JSON / NDJSON Explorer without re-uploading or serializing. */
export function useLargeFileHandoff() {
  return useState<LargeFileHandoff>('largeFileHandoff', () => ({}))
}

interface PendingReq {
  resolve: (v: unknown) => void
  reject: (e: unknown) => void
  kind: 'scan' | 'fields' | 'search' | 'export' | 'preview'
}

export interface ExportOptions {
  columns: string[]
  delimiter?: string
  includeHeader?: boolean
  bom?: boolean
  arrayMode?: ArrayMode
  maxRows?: number
}

export function useLargeFile() {
  let worker: Worker | null = null
  let reqId = 0
  const pending = new Map<number, PendingReq>()
  let csvChunks: string[] = []
  let activeKind: 'export' | 'preview' | null = null
  let heldFile: File | null = null
  let heldText: string | null = null
  let heldFormat: FileFormat = 'json'
  let heldName = ''

  const status = ref<LfStatus>('idle')
  const fileName = ref('')
  const fileSize = ref(0)
  const format = ref<FileFormat>('json')
  const scan = ref<ScanResult | null>(null)
  const scanError = ref<ScanErrorInfo | null>(null)
  const fields = ref<FieldStat[]>([])
  const selectedCollection = ref<string>('')
  const selectedColumns = ref<string[]>([])
  const previewCsv = ref('')
  const csvHeaders = ref<string[]>([])
  const searchHits = ref<SearchHit[]>([])
  const searchQuery = ref('')
  const searchMode = ref<'key' | 'value'>('value')
  const searchTruncated = ref(false)
  const exportTotal = ref(0)
  const exportDone = ref(false)
  const errorMsg = ref('')

  function ensureWorker(): Worker {
    if (worker) return worker
    worker = new Worker(
      new URL('../workers/recordStream.worker.ts', import.meta.url),
      { type: 'module' },
    )
    worker.onmessage = (e: MessageEvent) => handleMessage(e.data)
    worker.onerror = (e: ErrorEvent) => {
      status.value = 'error'
      errorMsg.value = e.message || 'Worker error'
    }
    return worker
  }

  function handleMessage(data: any) {
    if (data.type === 'scan') {
      const p = pending.get(data.id)
      pending.delete(data.id)
      if (!data.ok) {
        scanError.value = {
          message: data.error || 'Invalid JSON',
          line: data.line,
          column: data.column,
          snippet: data.snippet,
        }
        scan.value = data as ScanResult
        status.value = 'invalid'
      } else {
        scan.value = data as ScanResult
        scanError.value = null
        // Default to the biggest record collection (root array or NDJSON lines).
        selectedCollection.value = data.candidates[0]?.path ?? ''
        status.value = 'ready'
      }
      p?.resolve(data)
    } else if (data.type === 'fields') {
      const p = pending.get(data.id)
      pending.delete(data.id)
      fields.value = (data as FieldsResult).fields
      // Select every discovered field by default.
      selectedColumns.value = (data as FieldsResult).fields.map(f => f.path)
      p?.resolve(data)
    } else if (data.type === 'csvChunk') {
      const chunk = data as CsvChunk
      csvChunks.push(chunk.chunk)
      exportTotal.value = chunk.total
      if (chunk.done) finishStream()
    } else if (data.type === 'search') {
      const p = pending.get(data.id)
      pending.delete(data.id)
      searchHits.value = (data as SearchResultMsg).hits
      searchTruncated.value = (data as SearchResultMsg).truncated
      status.value = 'ready'
      p?.resolve(data)
    }
  }

  function finishStream() {
    const kind = activeKind
    activeKind = null
    const text = csvChunks.join('')
    csvChunks = []
    if (kind === 'preview') {
      previewCsv.value = text
      status.value = 'ready'
      return
    }
    // Full export: download via Blob (browser may stream to disk, avoids one
    // giant string on the main thread).
    const blob = new Blob(csvChunks.length ? csvChunks : [text], {
      type: 'text/csv;charset=utf-8',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = downloadName()
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    exportDone.value = true
    status.value = 'ready'
  }

  function downloadName(): string {
    const base = (fileName.value || 'large-json').replace(/\.(json|ndjson|jsonl|jsonlines)$/i, '')
    return `${base}-export.csv`
  }

  function detectFormatFromName(name: string): FileFormat | null {
    if (/\.(ndjson|jsonl|jsonlines)$/i.test(name)) return 'ndjson'
    if (/\.json$/i.test(name)) return 'json'
    return null
  }

  function post(id: number, msg: Record<string, unknown>) {
    ensureWorker().postMessage({ id, ...msg })
  }

  async function loadFile(file: File, fmt?: FileFormat) {
    heldFile = file
    heldName = file.name
    fileSize.value = file.size
    fileName.value = file.name
    const detected = fmt || detectFormatFromName(file.name) || 'json'
    heldFormat = detected
    format.value = detected
    const text = await file.text()
    heldText = text
    return runScan(text, detected)
  }

  async function loadText(text: string, fmt: FileFormat, name = 'pasted.json') {
    heldText = text
    heldName = name
    heldFile = null
    fileSize.value = text.length * 2
    fileName.value = name
    heldFormat = fmt
    format.value = fmt
    return runScan(text, fmt)
  }

  async function runScan(text: string, fmt: FileFormat) {
    status.value = 'scanning'
    scanError.value = null
    errorMsg.value = ''
    exportDone.value = false
    previewCsv.value = ''
    searchHits.value = []
    csvHeaders.value = []
    fields.value = []
    selectedColumns.value = []
    const id = ++reqId
    return new Promise<ScanResult>((resolve, reject) => {
      pending.set(id, { resolve: resolve as any, reject, kind: 'scan' })
      post(id, { mode: 'load', text, format: fmt })
      // Safety timeout
      setTimeout(() => {
        if (pending.has(id)) {
          pending.delete(id)
          status.value = 'error'
          errorMsg.value = 'Scan timed out'
          reject(new Error('timeout'))
        }
      }, 120000)
    })
  }

  /** Re-run the scan for the same held file (used after a cancel). */
  async function reload() {
    if (heldFile) return loadFile(heldFile, heldFormat)
    if (heldText) return loadText(heldText, heldFormat, heldName)
  }

  async function fetchFields(sampleSize = 200) {
    if (!scan.value?.ok) return
    const id = ++reqId
    return new Promise<FieldsResult>((resolve, reject) => {
      pending.set(id, { resolve: resolve as any, reject, kind: 'fields' })
      post(id, { mode: 'fields', rowPath: selectedCollection.value || undefined, sampleSize })
    })
  }

  async function runPreview(opts: ExportOptions) {
    if (!scan.value?.ok) return
    activeKind = 'preview'
    csvChunks = []
    exportTotal.value = 0
    status.value = 'exporting'
    const id = ++reqId
    return new Promise<void>((resolve, reject) => {
      pending.set(id, { resolve: resolve as any, reject, kind: 'preview' })
      post(id, {
        mode: 'export',
        rowPath: selectedCollection.value || undefined,
        columns: opts.columns,
        delimiter: opts.delimiter ?? ',',
        includeHeader: opts.includeHeader !== false,
        bom: !!opts.bom,
        arrayMode: opts.arrayMode ?? 'json',
        maxRows: opts.maxRows ?? 50,
      })
    })
  }

  async function startExport(opts: ExportOptions) {
    if (!scan.value?.ok) return
    activeKind = 'export'
    csvChunks = []
    exportTotal.value = 0
    exportDone.value = false
    status.value = 'exporting'
    const id = ++reqId
    return new Promise<void>((resolve, reject) => {
      pending.set(id, { resolve: resolve as any, reject, kind: 'export' })
      post(id, {
        mode: 'export',
        rowPath: selectedCollection.value || undefined,
        columns: opts.columns,
        delimiter: opts.delimiter ?? ',',
        includeHeader: opts.includeHeader !== false,
        bom: !!opts.bom,
        arrayMode: opts.arrayMode ?? 'json',
      })
    })
  }

  async function search(query: string, mode: 'key' | 'value' = 'value', limit = 200) {
    if (!scan.value?.ok || !query.trim()) {
      searchHits.value = []
      return
    }
    status.value = 'searching'
    const id = ++reqId
    return new Promise<SearchResultMsg>((resolve, reject) => {
      pending.set(id, { resolve: resolve as any, reject, kind: 'search' })
      post(id, {
        mode: 'search',
        rowPath: selectedCollection.value || undefined,
        query,
        searchMode: mode,
        limit,
      })
    })
  }

  function cancel() {
    // The simplest reliable cancel: terminate the worker. We keep the held file
    // so the user can re-run immediately.
    if (worker) {
      worker.terminate()
      worker = null
    }
    pending.clear()
    csvChunks = []
    activeKind = null
    status.value = 'idle'
  }

  function reset() {
    cancel()
    scan.value = null
    scanError.value = null
    fields.value = []
    selectedCollection.value = ''
    selectedColumns.value = []
    previewCsv.value = ''
    searchHits.value = []
    status.value = 'idle'
  }

  /** Parse the first CSV line into headers (for the preview table). */
  function updatePreviewHeaders() {
    const firstLine = previewCsv.value.split('\r\n')[0] || previewCsv.value.split('\n')[0] || ''
    csvHeaders.value = firstLine ? firstLine.split(',').map(h => h.replace(/^"|"$/g, '')) : []
  }

  return {
    // state
    status,
    fileName,
    fileSize,
    format,
    scan,
    scanError,
    fields,
    selectedCollection,
    selectedColumns,
    previewCsv,
    csvHeaders,
    searchHits,
    searchQuery,
    searchMode,
    searchTruncated,
    exportTotal,
    exportDone,
    errorMsg,
    // actions
    loadFile,
    loadText,
    reload,
    fetchFields,
    runPreview,
    startExport,
    search,
    cancel,
    reset,
    updatePreviewHeaders,
  }
}
