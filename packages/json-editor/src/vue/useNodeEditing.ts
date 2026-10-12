/**
 * Stateful node-editing layer for the tree view.
 *
 * Thin wrapper over the pure functions in `core/edit`: it adds undo/redo
 * history and batch selection, and turns operation failures into user
 * notifications through an injectable `onNotify` callback (so the package
 * stays free of any toast/i18n framework).
 *
 * All mutations are applied to the shared `text` ref, which the host keeps in
 * sync with the editor pane.
 */
import { computed, ref, type Ref } from 'vue'
import {
  commitEdit,
  parseTreePath,
  setAt,
  renameKeyOp,
  setTypeOp,
  addFieldOp,
  removeFieldOp,
  addArrayItemOp,
  removeArrayItemOp,
  moveArrayItemOp,
  copyNodeOp,
  moveNodeOp,
  batchSetValueOp,
  type JsonPrimitiveType,
} from '../core/edit'
import type { IndentOption } from '../core/format'

export type { JsonPrimitiveType } from '../core/edit'

export type NotifyKind = 'error' | 'success'

export interface NodeEditingNotify {
  (message: string, kind: NotifyKind): void
}

export interface UseNodeEditingOptions {
  text: Ref<string>
  indent: Ref<IndentOption> | (() => IndentOption)
  /** Surface errors/success to the host UI. Plain messages by default. */
  onNotify?: NodeEditingNotify
  /** Optional i18n hook: receive the English error and return a localized one. */
  localize?: (message: string) => string
}

const MAX_HISTORY = 100

/** Turn a typed string into a JSON value, keeping strings as the fallback. */
export function coerceScalarInput(raw: string): unknown {
  const trimmed = raw.trim()
  if (trimmed === '') return ''
  if (trimmed === 'true') return true
  if (trimmed === 'false') return false
  if (trimmed === 'null') return null
  if (/^-?\d+(\.\d+)?([eE][+-]?\d+)?$/.test(trimmed)) return Number(trimmed)
  try {
    return JSON.parse(trimmed)
  } catch {
    return raw
  }
}

export function useNodeEditing(opts: UseNodeEditingOptions) {
  const text = opts.text
  const indentOf = () => (typeof opts.indent === 'function' ? opts.indent() : opts.indent.value)
  const localize = opts.localize

  const past = ref<string[]>([])
  const future = ref<string[]>([])
  const canUndo = computed(() => past.value.length > 0)
  const canRedo = computed(() => future.value.length > 0)

  function notify(message: string, kind: NotifyKind) {
    opts.onNotify?.(localize ? localize(message) : message, kind)
  }

  function commit(mutator: (data: unknown) => unknown): boolean {
    const before = text.value
    const res = commitEdit(before, indentOf(), mutator)
    if (!res.ok) {
      notify(res.error, 'error')
      return false
    }
    if (past.value.length >= MAX_HISTORY) past.value.shift()
    past.value.push(before)
    future.value = []
    text.value = res.text
    return true
  }

  const setValue = (path: string, value: unknown) => commit((d) => setAt(d, parseTreePath(path), value))
  const renameKey = (path: string, newKey: string) => commit((d) => renameKeyOp(d, path, newKey))
  const setType = (path: string, type: JsonPrimitiveType) => commit((d) => setTypeOp(d, path, type))
  const addField = (path: string, key: string, value: unknown) => commit((d) => addFieldOp(d, path, key, value))
  const removeField = (path: string) => commit((d) => removeFieldOp(d, path))
  const addArrayItem = (path: string, value: unknown) => commit((d) => addArrayItemOp(d, path, value))
  const removeArrayItem = (path: string, index: number) => commit((d) => removeArrayItemOp(d, path, index))
  const moveArrayItem = (path: string, from: number, to: number) =>
    commit((d) => moveArrayItemOp(d, path, from, to))
  const copyNode = (path: string, targetPath: string) => commit((d) => copyNodeOp(d, path, targetPath))
  const moveNode = (path: string, targetPath: string) => commit((d) => moveNodeOp(d, path, targetPath))
  const batchSetValue = (paths: string[], value: unknown) => commit((d) => batchSetValueOp(d, paths, value))

  function undo() {
    const prev = past.value.pop()
    if (prev === undefined) return
    future.value.unshift(text.value)
    text.value = prev
  }

  function redo() {
    const next = future.value.shift()
    if (next === undefined) return
    past.value.push(text.value)
    text.value = next
  }

  // ── Batch selection (multi-select → batch set value) ──────────────
  const batchMode = ref(false)
  const batchSelected = ref<Set<string>>(new Set())

  function toggleBatch(path: string) {
    const next = new Set(batchSelected.value)
    if (next.has(path)) next.delete(path)
    else next.add(path)
    batchSelected.value = next
  }

  function clearBatch() {
    batchSelected.value = new Set()
  }

  return {
    canUndo,
    canRedo,
    undo,
    redo,
    setValue,
    renameKey,
    setType,
    addField,
    removeField,
    addArrayItem,
    removeArrayItem,
    moveArrayItem,
    copyNode,
    moveNode,
    batchSetValue,
    batchMode,
    batchSelected,
    toggleBatch,
    clearBatch,
  }
}
