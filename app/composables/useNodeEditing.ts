import type { Ref } from 'vue'

export type JsonSegment = string | number
export type JsonTypeName = 'string' | 'number' | 'boolean' | 'null'

const MAX_HISTORY = 100

/**
 * Parse a tree dot-path (`users[0].name`, `items[2]`, ``) into segments
 * (`['users', 0, 'name']`). Keys containing `.` or `[` are not addressable —
 * the same limitation the tree itself has when building child paths.
 */
export function parseJsonPath(path: string): JsonSegment[] {
  if (!path) return []
  const segs: JsonSegment[] = []
  const re = /([^.[\]]+)|\[(\d+)\]/g
  let m: RegExpExecArray | null
  while ((m = re.exec(path)) !== null) {
    if (m[1] !== undefined) segs.push(m[1])
    else if (m[2] !== undefined) segs.push(Number(m[2]))
  }
  return segs
}

function getAt(data: unknown, segs: JsonSegment[]): unknown {
  let cur: any = data
  for (const s of segs) {
    if (cur === null || cur === undefined) return undefined
    cur = cur[s as any]
  }
  return cur
}

/** Immutable set: rebuilds only the ancestors on the way down. */
function setAt(data: unknown, segs: JsonSegment[], value: unknown): unknown {
  if (segs.length === 0) return value
  const [head, ...rest] = segs
  if (Array.isArray(data)) {
    const idx = typeof head === 'number' ? head : Number(head)
    if (!Number.isInteger(idx)) throw new Error('Invalid array index')
    const copy = data.slice()
    copy[idx] = rest.length ? setAt(data[idx], rest, value) : value
    return copy
  }
  if (data !== null && typeof data === 'object') {
    const copy: any = { ...data }
    copy[head as string] = rest.length ? setAt((data as any)[head as string], rest, value) : value
    return copy
  }
  throw new Error('Cannot set a value inside a primitive')
}

/** Immutable delete of the last segment (object key or array index). */
function removeAt(data: unknown, segs: JsonSegment[]): unknown {
  if (segs.length === 0) throw new Error('The root node cannot be removed')
  const parentSegs = segs.slice(0, -1)
  const last = segs[segs.length - 1]
  const parent = getAt(data, parentSegs)
  if (Array.isArray(parent)) {
    const idx = typeof last === 'number' ? last : Number(last)
    if (!Number.isInteger(idx) || idx < 0 || idx >= parent.length) throw new Error('Invalid array index')
    const copy = parent.slice()
    copy.splice(idx, 1)
    return parentSegs.length ? setAt(data, parentSegs, copy) : copy
  }
  if (parent !== null && typeof parent === 'object') {
    const key = String(last)
    if (!(key in (parent as Record<string, unknown>))) throw new Error('Field not found')
    const copy: any = { ...parent }
    delete copy[key]
    return parentSegs.length ? setAt(data, parentSegs, copy) : copy
  }
  throw new Error('Cannot remove from a primitive')
}

function deepClone<T>(value: T): T {
  return value === undefined ? (null as unknown as T) : (JSON.parse(JSON.stringify(value)) as T)
}

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
    return commit((data) => setAt(data, parseJsonPath(path), value))
  }

  function renameKey(path: string, newKey: string) {
    const key = newKey.trim()
    if (!key) {
      toast.error(t('edit.nameRequired'))
      return false
    }
    return commit((data) => {
      const segs = parseJsonPath(path)
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
      const segs = parseJsonPath(path)
      const current = getAt(data, segs)
      let converted: unknown
      if (type === 'null') {
        converted = null
      } else if (type === 'string') {
        converted = current !== null && typeof current === 'object' ? JSON.stringify(current) : String(current)
      } else if (type === 'number') {
        const n = Number(current)
        converted = Number.isFinite(n) ? n : 0
      } else {
        converted = typeof current === 'string'
          ? current !== '' && current !== 'false' && current !== '0'
          : Boolean(current)
      }
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
      const segs = parseJsonPath(path)
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
    return commit((data) => removeAt(data, parseJsonPath(path)))
  }

  function addArrayItem(path: string, value: unknown) {
    return commit((data) => {
      const segs = parseJsonPath(path)
      const target = segs.length ? getAt(data, segs) : data
      if (!Array.isArray(target)) throw new Error(t('edit.addItemArrayOnly'))
      const copy = (target as unknown[]).concat([value])
      return segs.length ? setAt(data, segs, copy) : copy
    })
  }

  function removeArrayItem(path: string, index: number) {
    return commit((data) => removeAt(data, [...parseJsonPath(path), index]))
  }

  function moveArrayItem(path: string, from: number, to: number) {
    return commit((data) => {
      const segs = parseJsonPath(path)
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
    return commit((data) => setAt(data, parseJsonPath(dest), deepClone(getAt(data, parseJsonPath(path)))))
  }

  function moveNode(path: string, targetPath: string) {
    const dest = targetPath.trim()
    if (!dest) {
      toast.error(t('edit.targetRequired'))
      return false
    }
    return commit((data) => {
      const srcSegs = parseJsonPath(path)
      const withCopy = setAt(data, parseJsonPath(dest), deepClone(getAt(data, srcSegs)))
      return removeAt(withCopy, srcSegs)
    })
  }

  /** Apply the same value to several paths as one undoable action. */
  function batchSetValue(paths: string[], value: unknown) {
    if (paths.length === 0) return false
    return commit((data) => {
      let next = data
      for (const p of paths) next = setAt(next, parseJsonPath(p), value)
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
