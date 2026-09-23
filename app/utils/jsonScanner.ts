/**
 * Single-pass validating JSON scanner.
 *
 * Unlike a full `JSON.parse`, this walks the tokens by hand and only reports
 * edges (offsets, value types, nesting depth) through hooks — so memory stays
 * flat regardless of file size. This is what powers "structure recognition"
 * for large files without loading the whole tree.
 */

export type JsonValueType = 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null'

export interface JsonTypeCounts {
  object: number
  array: number
  string: number
  number: number
  boolean: number
  null: number
}

export function emptyTypeCounts(): JsonTypeCounts {
  return { object: 0, array: 0, string: 0, number: 0, boolean: 0, null: 0 }
}

export interface ScanHooks {
  /** Called when an array closes, with its path/element count/first element offsets. */
  onArrayClose?: (path: string, count: number, firstStart: number, firstEnd: number, depth: number) => void
  /** Called for each top-level element of the target array. */
  onElement?: (index: number, start: number, end: number) => void
  targetPath?: string
  /** Called for every JSON value read, with its type and container depth (root = 1). */
  onValue?: (type: JsonValueType, depth: number) => void
  /** Called for each object key, with the key name, the offset of its opening
   *  quote, and the depth of the containing object (root object = 1). Used to
   *  build a top-level-key offset index for object-rooted documents. */
  onKey?: (key: string, offset: number, depth: number) => void
}

interface Frame {
  type: 'object' | 'array'
  count: number
  nextIndex: number
  depth: number
  curStart: number
  inElem: boolean
  firstStart: number
  firstEnd: number
}

function isWs(c: string): boolean {
  return c === ' ' || c === '\t' || c === '\r' || c === '\n'
}
function isNumberChar(c: string): boolean {
  return (c >= '0' && c <= '9') || c === '-' || c === '+' || c === '.' || c === 'e' || c === 'E'
}
function joinPath(segs: string[]): string {
  let p = ''
  for (const s of segs) {
    if (!s) continue
    if (s.startsWith('[')) p += s
    else p = p ? `${p}.${s}` : s
  }
  return p
}

export function scanJson(text: string, hooks: ScanHooks = {}): { rootType: 'object' | 'array' | null } {
  if (!text.trim()) throw new Error('The file is empty')
  let i = 0
  let rootType: 'object' | 'array' | null = null
  const stack: Frame[] = []
  const segs: string[] = []
  let pendingSeg = ''
  let expectKey = false
  let expectColon = false
  let expectValue = false
  let sawRoot = false
  /** True right after a comma — lets us reject trailing commas. */
  let sawComma = false

  const n = text.length

  function openContainer(type: 'object' | 'array') {
    const parent = stack.length > 0 ? stack[stack.length - 1] : null
    if (parent) {
      if (parent.type === 'array') pendingSeg = `[${parent.nextIndex}]`
      segs.push(pendingSeg)
    } else {
      rootType = type
    }
    // A container value sits one level deeper than its parent container.
    if (hooks.onValue) hooks.onValue(type, stack.length + 1)
    stack.push({
      type,
      count: 0,
      nextIndex: 0,
      depth: stack.length,
      curStart: -1,
      inElem: false,
      firstStart: -1,
      firstEnd: -1,
    })
    if (type === 'array') {
      expectKey = false
    } else {
      expectKey = true
    }
  }

  function closeContainer(end: number) {
    const frame = stack.pop()
    if (!frame) throw new Error(`Unexpected token at position ${i}`)
    const path = joinPath(segs)

    if (frame.type === 'array' && hooks.onArrayClose) {
      hooks.onArrayClose(path, frame.count, frame.firstStart, frame.firstEnd, frame.depth)
    }

    if (!segs.length && !stack.length) segs.length = 0
    else segs.pop()

    const parent = stack.length > 0 ? stack[stack.length - 1] : null
    if (parent) {
      parent.count++
      if (parent.type === 'array') {
        if (hooks.onElement && hooks.targetPath !== undefined) {
          const ppath = joinPath(segs)
          if (ppath === hooks.targetPath) {
            hooks.onElement(parent.nextIndex, parent.curStart, end)
          }
        }
        if (parent.count === 1) { parent.firstStart = parent.curStart; parent.firstEnd = end }
        parent.nextIndex++
        parent.inElem = false
      }
    }
    expectKey = false
  }

  function noteElementEnd(end: number) {
    const top = stack.length > 0 ? stack[stack.length - 1] : null
    if (top && top.type === 'array' && top.inElem) {
      const ppath = joinPath(segs)
      if (hooks.onElement && hooks.targetPath !== undefined && ppath === hooks.targetPath) {
        hooks.onElement(top.nextIndex, top.curStart, end)
      }
      top.count++
      if (top.count === 1) { top.firstStart = top.curStart; top.firstEnd = end }
      top.nextIndex++
      top.inElem = false
    }
  }

  function readString(): string {
    i++
    let out = ''
    while (i < n) {
      const c = text[i]
      if (c === '\\') {
        const nx = text[i + 1]
        i += 2
        if (nx === 'n') out += '\n'
        else if (nx === 't') out += '\t'
        else if (nx === 'r') out += '\r'
        else if (nx === 'b') out += '\b'
        else if (nx === 'f') out += '\f'
        else if (nx === 'u') { out += String.fromCharCode(parseInt(text.substr(i, 4), 16)); i += 4 }
        else out += nx ?? ''
        continue
      }
      if (c === '"') { i++; break }
      out += c
      i++
    }
    return out
  }

  while (i < n) {
    const c = text[i]

    if (isWs(c)) { i++; continue }

    const top = stack.length > 0 ? stack[stack.length - 1] : null

    if (c === '{' || c === '[') {
      if (expectColon) throw new Error(`Unexpected token at position ${i}`)
      if (sawRoot && !stack.length) throw new Error(`Unexpected token at position ${i}`)
      if (!stack.length) sawRoot = true
      if (top && top.type === 'array' && !top.inElem) { top.curStart = i; top.inElem = true }
      openContainer(c === '{' ? 'object' : 'array')
      expectValue = false
      // A container is real content after a comma — clear the flag, otherwise
      // the closer of an empty container (`"key": []`) is rejected as a
      // trailing comma.
      sawComma = false
      i++
      continue
    }

    if (c === '}' || c === ']') {
      if (expectValue || expectColon || sawComma) throw new Error(`Unexpected token at position ${i}`)
      i++
      closeContainer(i)
      expectValue = false
      expectColon = false
      sawComma = false
      continue
    }

    if (c === ',') {
      if (expectValue || expectColon || sawComma) throw new Error(`Unexpected token at position ${i}`)
      i++
      sawComma = true
      if (top) {
        if (top.type === 'array') { top.inElem = false }
        else expectKey = true
      }
      continue
    }

    if (c === ':') {
      if (!expectColon) throw new Error(`Unexpected token at position ${i}`)
      i++
      expectColon = false
      expectValue = true
      sawComma = false
      continue
    }

    if (c === '"') {
      if (top && top.type === 'array' && !top.inElem) { top.curStart = i; top.inElem = true }
      const start = i
      readString()
      if (expectKey) {
        pendingSeg = text.slice(start + 1, i - 1)
        if (hooks.onKey) hooks.onKey(pendingSeg, start, stack.length)
        expectKey = false
        expectColon = true
        // The key is real content after a comma — clear the flag so an empty
        // container value (`"key": []`) is not mistaken for a trailing comma.
        sawComma = false
      } else {
        if (expectColon) throw new Error(`Unexpected token at position ${i}`)
        if (hooks.onValue) hooks.onValue('string', stack.length + 1)
        noteElementEnd(i)
        expectValue = false
        sawComma = false
      }
      continue
    }

    if (c === 't' || c === 'f' || c === 'n') {
      if (expectColon) throw new Error(`Unexpected token at position ${i}`)
      if (top && top.type === 'array' && !top.inElem) { top.curStart = i; top.inElem = true }
      const type: JsonValueType = c === 't' ? 'boolean' : c === 'f' ? 'boolean' : 'null'
      if (hooks.onValue) hooks.onValue(type, stack.length + 1)
      if (text.startsWith('true', i)) i += 4
      else if (text.startsWith('false', i)) i += 5
      else if (text.startsWith('null', i)) i += 4
      else throw new Error(`Unexpected token at position ${i}`)
      noteElementEnd(i)
      expectValue = false
      sawComma = false
      continue
    }

    if (isNumberChar(c)) {
      if (expectColon) throw new Error(`Unexpected token at position ${i}`)
      if (top && top.type === 'array' && !top.inElem) { top.curStart = i; top.inElem = true }
      const start = i
      while (i < n && isNumberChar(text[i])) i++
      if (Number.isNaN(Number(text.slice(start, i)))) throw new Error(`Invalid number at position ${start}`)
      if (hooks.onValue) hooks.onValue('number', stack.length + 1)
      noteElementEnd(i)
      expectValue = false
      sawComma = false
      continue
    }

    throw new Error(`Unexpected token at position ${i}`)
  }

  if (stack.length > 0) throw new Error('Unexpected end of input')
  return { rootType }
}

/**
 * Count JSON value types in an already-parsed value (used by the NDJSON path,
 * which JSON.parses each line for validation anyway).
 */
export function accumulateValue(v: unknown, counts: JsonTypeCounts): void {
  if (v === null) { counts.null++; return }
  const t = typeof v
  if (t === 'object') {
    if (Array.isArray(v)) { counts.array++; for (const e of v) accumulateValue(e, counts) }
    else { counts.object++; for (const k in v) accumulateValue((v as Record<string, unknown>)[k], counts) }
  } else if (t === 'string') counts.string++
  else if (t === 'number') counts.number++
  else if (t === 'boolean') counts.boolean++
}

/** Container nesting depth of a parsed value (root container = 1; scalars = 0).
 *  Mirrors the scanner's `onValue` max-depth so JSON and NDJSON agree. */
export function valueDepth(v: unknown): number {
  if (v === null || typeof v !== 'object') return 0
  if (Array.isArray(v)) { let m = 1; for (const e of v) m = Math.max(m, 1 + valueDepth(e)); return m }
  let m = 1
  for (const k in v) m = Math.max(m, 1 + valueDepth((v as Record<string, unknown>)[k]))
  return m
}
