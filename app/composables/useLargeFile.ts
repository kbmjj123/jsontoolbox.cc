import { ref, computed } from 'vue'
import type {
  ScanResult,
  FieldsResult,
  CsvChunk,
  SearchTextResultMsg,
  SearchTextProgressMsg,
  FileFormat,
  FieldStat,
  ArrayMode,
} from '~/workers/recordStream.worker'
import type { SearchTextHit } from '~/utils/textSearch'
import { offsetToLineCol } from '~/utils/textSearch'

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

/**
 * The single size rule of the whole site.
 *
 * - <= LARGE_FILE_MAX_BYTES → handled by the regular tools (plain `JSON.parse`
 *   on the main thread, full editing / formatting / tree browsing).
 * - >  LARGE_FILE_MAX_BYTES → the regular tools refuse the input and hand it
 *   over to the Large JSON Explorer, the only page that owns large-file
 *   machinery (Web Worker scanning, streaming parse, record search, CSV export).
 *
 * Change the number here and every entry point follows — no page keeps its own
 * threshold any more.
 */
export const LARGE_FILE_MAX_BYTES = 5 * 1024 * 1024

/** The one page that owns every large-file capability. */
export const LARGE_FILE_EXPLORER_PATH = '/tools/view/large-json-viewer'

/** UTF-8 byte length of a string. Uses Blob when available (native, fast). */
export function byteLength(text: string): number {
  if (typeof Blob !== 'undefined') return new Blob([text]).size
  let bytes = 0
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i)
    if (code < 0x80) bytes += 1
    else if (code < 0x800) bytes += 2
    else if (code >= 0xd800 && code <= 0xdbff) { bytes += 4; i++ }
    else bytes += 3
  }
  return bytes
}

/**
 * Tell NDJSON apart from plain JSON: in NDJSON every line is a complete JSON
 * value, so the first two lines each parse on their own. A pretty-printed
 * document fails that test because its first line is only an opening brace.
 */
export function detectDocumentFormat(text: string): FileFormat {
  const firstBreak = text.indexOf('\n')
  if (firstBreak === -1) return 'json'
  const head = text.slice(firstBreak + 1, firstBreak + 4096)
  const secondBreak = head.indexOf('\n')
  const firstLine = text.slice(0, firstBreak).trim()
  const secondLine = (secondBreak === -1 ? head : head.slice(0, secondBreak)).trim()
  if (!firstLine || !secondLine) return 'json'
  try {
    JSON.parse(firstLine)
    JSON.parse(secondLine)
    return 'ndjson'
  } catch {
    return 'json'
  }
}

/**
 * Gate used by every "normal" tool page: check a freshly loaded input and, when
 * it is over the limit, offer to hand it off to the Large JSON Explorer instead
 * of trying to parse it on the main thread.
 */
export function useLargeFileGate() {
  const handoff = useLargeFileHandoff()

  /** Show the hand-off prompt (drives `<LargeFileWarning>`). */
  const visible = ref(false)
  /**
   * True while the current editor content is over the limit. Callers must skip
   * every normal parse path while this is set — including after the prompt is
   * dismissed towards the Explorer, because the oversized text is still in the
   * editor until navigation completes.
   */
  const blocked = ref(false)
  /** Size of the oversized input, for the prompt copy. */
  const bytes = ref(0)
  const pendingText = ref('')
  const pendingFileName = ref('data.json')

  /** Returns `true` when the input is over the limit. */
  function check(text: string, fileName = 'data.json', knownBytes?: number): boolean {
    if (!text) return false
    const size = knownBytes ?? byteLength(text)
    if (size <= LARGE_FILE_MAX_BYTES) return false
    bytes.value = size
    pendingText.value = text
    pendingFileName.value = fileName
    visible.value = true
    blocked.value = true
    return true
  }

  /** Carry the content over to the Large JSON Explorer and navigate there. */
  async function openExplorer() {
    const text = pendingText.value
    const name = pendingFileName.value
    visible.value = false
    if (!text) { blocked.value = false; return }
    handoff.value = {
      text,
      format: detectDocumentFormat(text),
      fileName: name,
    }
    await navigateTo(LARGE_FILE_EXPLORER_PATH)
  }

  /** Back out: the caller clears the editor, so parsing can resume normally. */
  function close() {
    visible.value = false
    blocked.value = false
    pendingText.value = ''
    bytes.value = 0
  }

  return { visible, blocked, bytes, check, openExplorer, close }
}

interface PendingReq {
  resolve: (v: unknown) => void
  reject: (e: unknown) => void
  kind: 'scan' | 'fields' | 'searchText' | 'export' | 'preview'
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
  /** Raw document text, kept in the Worker world as far as possible. Exposed so
   *  the tree view can stream-parse it without re-reading the file. */
  const rawText = ref('')
  const scan = ref<ScanResult | null>(null)
  const scanError = ref<ScanErrorInfo | null>(null)
  const fields = ref<FieldStat[]>([])
  const selectedCollection = ref<string>('')
  const selectedColumns = ref<string[]>([])
  const previewCsv = ref('')
  const csvHeaders = ref<string[]>([])
  const searchHits = ref<SearchTextHit[]>([])
  const searchQuery = ref('')
  const searchScope = ref<'key' | 'value' | 'path'>('value')
  const searchCaseSensitive = ref(false)
  const searchProgress = ref<{ scanned: number; total: number; matches: number }>({ scanned: 0, total: 0, matches: 0 })
  const searchTruncated = ref(false)
  const currentHit = ref(0)
  /** Start offset of each top-level array element (JSON root arrays only). */
  const topArray = ref<Uint32Array | null>(null)
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
        topArray.value = data.topArray ?? null
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
    } else if (data.type === 'searchTextProgress') {
      const msg = data as SearchTextProgressMsg
      searchProgress.value = { scanned: msg.scanned, total: msg.total, matches: msg.matches }
    } else if (data.type === 'searchTextResult') {
      const p = pending.get(data.id)
      pending.delete(data.id)
      searchHits.value = (data as SearchTextResultMsg).hits
      searchTruncated.value = (data as SearchTextResultMsg).truncated
      searchProgress.value = { scanned: 0, total: 0, matches: searchHits.value.length }
      currentHit.value = searchHits.value.length ? 0 : -1
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
    rawText.value = text
    return runScan(text, detected)
  }

  async function loadText(text: string, fmt: FileFormat, name = 'pasted.json') {
    heldText = text
    heldName = name
    heldFile = null
    fileSize.value = byteLength(text)
    rawText.value = text
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

  async function searchText(
    query: string,
    scope: 'key' | 'value' | 'path' = 'value',
    caseSensitive = false,
    limit = 5000,
  ) {
    if (!query.trim()) {
      searchHits.value = []
      searchProgress.value = { scanned: 0, total: 0, matches: 0 }
      return
    }
    status.value = 'searching'
    searchQuery.value = query
    searchScope.value = scope
    searchCaseSensitive.value = caseSensitive
    searchProgress.value = { scanned: 0, total: 0, matches: 0 }
    const id = ++reqId
    return new Promise<SearchTextResultMsg>((resolve, reject) => {
      pending.set(id, { resolve: resolve as any, reject, kind: 'searchText' })
      post(id, {
        mode: 'searchText',
        query,
        searchMode: scope,
        caseSensitive,
        limit,
      })
    })
  }

  /** Stop an in-flight search. The worker is terminated and re-scanned so the
   *  page keeps working afterwards. */
  function cancelSearch() {
    cancel()
    reload()
  }

  function gotoHit(index: number) {
    if (!searchHits.value.length) return
    currentHit.value = Math.max(0, Math.min(searchHits.value.length - 1, index))
  }

  function nextHit() { gotoHit(currentHit.value + 1) }
  function prevHit() { gotoHit(currentHit.value - 1) }

  /** Whether the document is a paged sequence (NDJSON lines or a JSON root array). */
  const arrayKind = computed<'ndjson' | 'json-array' | null>(() =>
    format.value === 'ndjson' ? 'ndjson'
      : topArray.value && topArray.value.length ? 'json-array'
      : null,
  )
  /** Number of top-level items, for the pager. */
  const arrayCount = computed(() =>
    arrayKind.value === 'ndjson'
      ? (scan.value?.lineOffsets?.length ?? 0)
      : (topArray.value?.length ?? 0),
  )
  /** 1-based line of the i-th top-level element (0-based input). Returns 0 when
   *  out of range so callers can ignore it. */
  function elementLine(i: number): number {
    if (arrayKind.value === 'ndjson') return i + 1
    const offs = topArray.value
    const lineOffsets = scan.value?.lineOffsets
    if (!offs || !lineOffsets || i < 0 || i >= offs.length) return 0
    return offsetToLineCol(lineOffsets, offs[i]).line
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
    rawText.value = ''
    scan.value = null
    scanError.value = null
    fields.value = []
    selectedCollection.value = ''
    selectedColumns.value = []
    previewCsv.value = ''
    searchHits.value = []
    topArray.value = null
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
    rawText,
    scan,
    scanError,
    fields,
    selectedCollection,
    selectedColumns,
    previewCsv,
    csvHeaders,
    searchHits,
    searchQuery,
    searchScope,
    searchCaseSensitive,
    searchProgress,
    searchTruncated,
    currentHit,
    arrayKind,
    arrayCount,
    elementLine,
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
    searchText,
    cancelSearch,
    gotoHit,
    nextHit,
    prevHit,
    cancel,
    reset,
    updatePreviewHeaders,
  }
}
