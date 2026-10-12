import type { Ref } from 'vue'
import {
  parseTreePath,
  getAt,
  setAt,
  removeAt,
  deepClone,
  convertValueToType,
  type JsonSegment,
} from '@kbmjj123/json-editor'

export type JsonTypeName = 'string' | 'number' | 'boolean' | 'null'

const MAX_HISTORY = 100

/**
 * Node-level editing for the JSON tree.
 *
 * Every mutation goes through `commit()`: snapshot → parse → mutate →
 * stringify → `getJsonError` validate → write. If anything fails we never
 * touch `inputJson`, so the user's document is never corrupted.
 */
export function useNodeEditing(inputJson: Ref<string>, indent: Ref<number | string>) {
  const { getJsonError } = useJsonFixer()
  const toast = useToast()
  const { t } = useI18n()

  const past = ref<string[]>([])
  const future = ref<string[]>([])
  const canUndo = computed(() => past.value.length > 0)
  const canRedo = computed(() => future.value.length > 0)

  function indentSpace(): number | string {
    return indent.value === 'tab' ? '\t' : Number(indent.value)
  }

  function commit(mutator: (data: unknown) => unknown): boolean {
    const before = inputJson.value
    if (!before.trim()) {
      toast.error(t('edit.emptyInput'))
      return false
    }
    let parsed: unknown
    try {
      parsed = JSON.parse(before)
    } catch {
      toast.error(t('edit.invalidSource'))
      return false
    }
    let next: unknown
    try {
      next = mutator(parsed)
    } catch (e) {
      toast.error((e as Error).message || t('edit.failed'))
      return false
    }
    const text = JSON.stringify(next, null, indentSpace())
    // Live validation: never write a document that does not parse back.
    if (getJsonError(text)) {
      toast.error(t('edit.validationFailed'))
      return false
    }
    if (past.value.length >= MAX_HISTORY) past.value.shift()
    past.value.push(before)
    future.value = []
    inputJson.value = text
    return true
  }

  function setValue(path: string, value: unknown) {
    return commit((data) => setAt(data, parseTreePath(path), value))
  }

  function renameKey(path: string, newKey: string) {
    const key = newKey.trim()
    if (!key) {
      toast.error(t('edit.nameRequired'))
      return false
    }
    return commit((data) => {
      const segs = parseTreePath(path)
      if (segs.length === 0) throw new Error(t('edit.cannotEditRoot'))
      const parentSegs = segs.slice(0, -1)
      const parent = getAt(data, parentSegs)
      const oldKey = String(segs[segs.length - 1])
      if (parent === null || typeof parent !== 'object' || Array.isArray(parent)) {
        throw new Error(t('edit.renameObjectOnly'))
      }
      const record = parent as Record<string, unknown>
      if (key in record) throw new Error(t('edit.keyExists'))
      // Rebuild key-by-key so the renamed field keeps its original position.
      const copy: Record<string, unknown> = {}
      for (const k of Object.keys(record)) {
        copy[k === oldKey ? key : k] = record[k]
      }
      return parentSegs.length ? setAt(data, parentSegs, copy) : copy
    })
  }

  function setType(path: string, type: JsonTypeName) {
    return commit((data) => {
      const segs = parseTreePath(path)
      const current = getAt(data, segs)
      const converted = convertValueToType(current, type)
      return setAt(data, segs, converted)
    })
  }

  function addField(path: string, key: string, value: unknown) {
    const k = key.trim()
    if (!k) {
      toast.error(t('edit.nameRequired'))
      return false
    }
    return commit((data) => {
      const segs = parseTreePath(path)
      const target = segs.length ? getAt(data, segs) : data
      if (target === null || typeof target !== 'object' || Array.isArray(target)) {
        throw new Error(t('edit.addFieldObjectOnly'))
      }
      const record = target as Record<string, unknown>
      if (k in record) throw new Error(t('edit.keyExists'))
      const copy = { ...record, [k]: value }
      return segs.length ? setAt(data, segs, copy) : copy
    })
  }

  function removeField(path: string) {
    if (!path) {
      toast.error(t('edit.cannotEditRoot'))
      return false
    }
    return commit((data) => removeAt(data, parseTreePath(path)))
  }

  function addArrayItem(path: string, value: unknown) {
    return commit((data) => {
      const segs = parseTreePath(path)
      const target = segs.length ? getAt(data, segs) : data
      if (!Array.isArray(target)) throw new Error(t('edit.addItemArrayOnly'))
      const copy = (target as unknown[]).concat([value])
      return segs.length ? setAt(data, segs, copy) : copy
    })
  }

  function removeArrayItem(path: string, index: number) {
    return commit((data) => removeAt(data, [...parseTreePath(path), index]))
  }

  function moveArrayItem(path: string, from: number, to: number) {
    return commit((data) => {
      const segs = parseTreePath(path)
      const target = segs.length ? getAt(data, segs) : data
      if (!Array.isArray(target)) throw new Error(t('edit.moveArrayOnly'))
      const arr = target as unknown[]
      if (!Number.isInteger(from) || !Number.isInteger(to) || from < 0 || from >= arr.length || to < 0 || to >= arr.length) {
        throw new Error(t('edit.invalidIndex'))
      }
      const copy = arr.slice()
      const [item] = copy.splice(from, 1)
      copy.splice(to, 0, item)
      return segs.length ? setAt(data, segs, copy) : copy
    })
  }

  function copyNode(path: string, targetPath: string) {
    const dest = targetPath.trim()
    if (!dest) {
      toast.error(t('edit.targetRequired'))
      return false
    }
    return commit((data) => setAt(data, parseTreePath(dest), deepClone(getAt(data, parseTreePath(path)))))
  }

  function moveNode(path: string, targetPath: string) {
    const dest = targetPath.trim()
    if (!dest) {
      toast.error(t('edit.targetRequired'))
      return false
    }
    return commit((data) => {
      const srcSegs = parseTreePath(path)
      const withCopy = setAt(data, parseTreePath(dest), deepClone(getAt(data, srcSegs)))
      return removeAt(withCopy, srcSegs)
    })
  }

  /** Apply the same value to several paths as one undoable action. */
  function batchSetValue(paths: string[], value: unknown) {
    if (paths.length === 0) return false
    return commit((data) => {
      let next = data
      for (const p of paths) next = setAt(next, parseTreePath(p), value)
      return next
    })
  }

  function undo() {
    const prev = past.value.pop()
    if (prev === undefined) return
    future.value.unshift(inputJson.value)
    inputJson.value = prev
  }

  function redo() {
    const next = future.value.shift()
    if (next === undefined) return
    past.value.push(inputJson.value)
    inputJson.value = next
  }

  // ── Batch selection (multi-select → batch set value) ──────────
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
    canUndo,
    canRedo,
    undo,
    redo,
    batchMode,
    batchSelected,
    toggleBatch,
    clearBatch,
  }
}
