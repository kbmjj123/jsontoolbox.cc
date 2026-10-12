/**
 * Node-level editing for the JSON tree — **pure logic**, no Vue, no i18n, no
 * DOM. Every operation is immutable: given a value it returns a new value
 * (or throws `Error` with a plain message on invalid input). The stateful
 * shell (history, toast, i18n) lives in the Vue composable layer.
 *
 * This is the single source of truth shared by the package's own
 * `TreeView`/`JsonEditor` and the site's tree tools after de-duplication.
 */

import { parseJson, validateJson } from './parse'
import { stringifyJson, type IndentOption } from './format'

export type JsonSegment = string | number

/** The four scalar types a leaf can be coerced into. */
export type JsonPrimitiveType = 'string' | 'number' | 'boolean' | 'null'

/**
 * Parse a tree dot-path (`users[0].name`, `items[2]`, ``) into segments
 * (`['users', 0, 'name']`). Keys containing `.` or `[` are not addressable —
 * the same limitation the tree itself has when building child paths.
 */
export function parseTreePath(path: string): JsonSegment[] {
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

export function getAt(data: unknown, segs: JsonSegment[]): unknown {
  let cur: unknown = data
  for (const s of segs) {
    if (cur === null || cur === undefined) return undefined
    cur = (cur as Record<JsonSegment, unknown>)[s]
  }
  return cur
}

/** Immutable set: rebuilds only the ancestors on the way down. */
export function setAt(data: unknown, segs: JsonSegment[], value: unknown): unknown {
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
    const copy: Record<string, unknown> = { ...(data as Record<string, unknown>) }
    copy[head as string] = rest.length ? setAt((data as Record<string, unknown>)[head as string], rest, value) : value
    return copy
  }
  throw new Error('Cannot set a value inside a primitive')
}

/** Immutable delete of the last segment (object key or array index). */
export function removeAt(data: unknown, segs: JsonSegment[]): unknown {
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
    const copy: Record<string, unknown> = { ...(parent as Record<string, unknown>) }
    delete copy[key]
    return parentSegs.length ? setAt(data, parentSegs, copy) : copy
  }
  throw new Error('Cannot remove from a primitive')
}

export function deepClone<T>(value: T): T {
  return value === undefined ? (null as unknown as T) : (JSON.parse(JSON.stringify(value)) as T)
}

/** Coerce a value into the target primitive type. */
export function convertValueToType(value: unknown, type: JsonPrimitiveType): unknown {
  if (type === 'null') return null
  if (type === 'string') {
    return value !== null && typeof value === 'object' ? JSON.stringify(value) : String(value)
  }
  if (type === 'number') {
    const n = Number(value)
    return Number.isFinite(n) ? n : 0
  }
  // boolean
  return typeof value === 'string'
    ? value !== '' && value !== 'false' && value !== '0'
    : Boolean(value)
}

// ── Immutable operations ────────────────────────────────────────────────────
// Each takes the current data and returns new data, or throws `Error`.

export function renameKeyOp(data: unknown, path: string, newKey: string): unknown {
  const key = newKey.trim()
  if (!key) throw new Error('Name is required')
  const segs = parseTreePath(path)
  if (segs.length === 0) throw new Error('The root node cannot be renamed')
  const parentSegs = segs.slice(0, -1)
  const parent = getAt(data, parentSegs)
  const oldKey = String(segs[segs.length - 1])
  if (parent === null || typeof parent !== 'object' || Array.isArray(parent)) {
    throw new Error('Only object fields can be renamed')
  }
  const record = parent as Record<string, unknown>
  if (key in record) throw new Error('A field with that name already exists')
  // Rebuild key-by-key so the renamed field keeps its original position.
  const copy: Record<string, unknown> = {}
  for (const k of Object.keys(record)) {
    copy[k === oldKey ? key : k] = record[k]
  }
  return parentSegs.length ? setAt(data, parentSegs, copy) : copy
}

export function setTypeOp(data: unknown, path: string, type: JsonPrimitiveType): unknown {
  const segs = parseTreePath(path)
  const current = getAt(data, segs)
  return setAt(data, segs, convertValueToType(current, type))
}

export function addFieldOp(data: unknown, path: string, key: string, value: unknown): unknown {
  const k = key.trim()
  if (!k) throw new Error('Name is required')
  const segs = parseTreePath(path)
  const target = segs.length ? getAt(data, segs) : data
  if (target === null || typeof target !== 'object' || Array.isArray(target)) {
    throw new Error('Fields can only be added to an object')
  }
  const record = target as Record<string, unknown>
  if (k in record) throw new Error('A field with that name already exists')
  const copy = { ...record, [k]: value }
  return segs.length ? setAt(data, segs, copy) : copy
}

export function removeFieldOp(data: unknown, path: string): unknown {
  if (!path) throw new Error('The root node cannot be removed')
  return removeAt(data, parseTreePath(path))
}

export function addArrayItemOp(data: unknown, path: string, value: unknown): unknown {
  const segs = parseTreePath(path)
  const target = segs.length ? getAt(data, segs) : data
  if (!Array.isArray(target)) throw new Error('Items can only be added to an array')
  const copy = (target as unknown[]).concat([value])
  return segs.length ? setAt(data, segs, copy) : copy
}

export function removeArrayItemOp(data: unknown, path: string, index: number): unknown {
  return removeAt(data, [...parseTreePath(path), index])
}

export function moveArrayItemOp(data: unknown, path: string, from: number, to: number): unknown {
  const segs = parseTreePath(path)
  const target = segs.length ? getAt(data, segs) : data
  if (!Array.isArray(target)) throw new Error('Items can only be moved inside an array')
  const arr = target as unknown[]
  if (
    !Number.isInteger(from) || !Number.isInteger(to) ||
    from < 0 || from >= arr.length || to < 0 || to >= arr.length
  ) {
    throw new Error('Invalid array index')
  }
  const copy = arr.slice()
  const [item] = copy.splice(from, 1)
  copy.splice(to, 0, item)
  return segs.length ? setAt(data, segs, copy) : copy
}

export function copyNodeOp(data: unknown, path: string, targetPath: string): unknown {
  const dest = targetPath.trim()
  if (!dest) throw new Error('A destination path is required')
  return setAt(data, parseTreePath(dest), deepClone(getAt(data, parseTreePath(path))))
}

export function moveNodeOp(data: unknown, path: string, targetPath: string): unknown {
  const dest = targetPath.trim()
  if (!dest) throw new Error('A destination path is required')
  const srcSegs = parseTreePath(path)
  const withCopy = setAt(data, parseTreePath(dest), deepClone(getAt(data, srcSegs)))
  return removeAt(withCopy, srcSegs)
}

/** Apply the same value to several paths as a single operation. */
export function batchSetValueOp(data: unknown, paths: string[], value: unknown): unknown {
  if (paths.length === 0) throw new Error('No paths selected')
  let next = data
  for (const p of paths) next = setAt(next, parseTreePath(p), value)
  return next
}

export type CommitResult = { ok: true; text: string } | { ok: false; error: string }

/**
 * Parse → mutate → validate → stringify. Guarantees the written text always
 * parses back, so a failed edit never corrupts the user's document.
 */
export function commitEdit(
  text: string,
  indent: IndentOption,
  mutator: (data: unknown) => unknown,
): CommitResult {
  if (!text.trim()) return { ok: false, error: 'Input is empty' }
  const parsed = parseJson(text)
  if (parsed.error) return { ok: false, error: parsed.error }
  let next: unknown
  try {
    next = mutator(parsed.data)
  } catch (e) {
    return { ok: false, error: (e as Error).message || 'Edit failed' }
  }
  const out = stringifyJson(next, indent)
  const check = validateJson(out)
  if (!check.valid) return { ok: false, error: check.error || 'Result is not valid JSON' }
  return { ok: true, text: out }
}
