/**
 * TOON (Token-Oriented Object Notation) encoder and decoder.
 *
 * Implements the subset of the TOON specification that this site documents in
 * its page copy: objects, nested objects, primitive arrays in inline form,
 * uniform arrays of objects in tabular form, non-uniform arrays in list form,
 * object list items, the `[]` empty-array form, comma/tab/pipe delimiters, and
 * root primitives, root objects and root arrays.
 *
 * Not implemented (stated as unsupported on the page): the keyed tabular root
 * form `[N:]{...}`, nested field groups such as `field{sub1,sub2}`, key folding
 * and path expansion.
 */

export type ToonDelimiter = ',' | '\t' | '|'

export interface ToonOptions {
  delimiter?: ToonDelimiter
}

const BARE_KEY = /^[A-Za-z_][A-Za-z0-9_.]*$/
const NUMERIC = /^-?[0-9]+(?:\.[0-9]+)?(?:e[+-]?[0-9]+)?$/i
const NUMERIC_LIKE = /^[+-]?[0-9]+(?:\.[0-9]+)?(?:e[+-]?[0-9]+)?$/i

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isPrimitive(value: unknown): boolean {
  return value === null || typeof value !== 'object'
}

// ---------------------------------------------------------------- primitives

/** The delimiter is omitted from a header when it is the comma default. */
function delimiterSymbol(delimiter: string): string {
  return delimiter === ',' ? '' : delimiter
}

function encodeKey(key: string): string {
  return BARE_KEY.test(key) ? key : JSON.stringify(key)
}

function needsQuotes(value: string, delimiter: string): boolean {
  if (value === '') return true
  if (value !== value.replace(/^[ \t]+|[ \t]+$/g, '')) return true
  if (value === 'true' || value === 'false' || value === 'null') return true
  if (NUMERIC_LIKE.test(value)) return true
  if (/[:\\"[\]{}]/.test(value)) return true
  if (/[\u0000-\u001F]/.test(value)) return true
  if (value.includes(delimiter)) return true
  if (value.startsWith('-') || value.startsWith('#')) return true
  return false
}

function formatNumber(value: number): string {
  if (value === 0) return '0' // also normalises -0
  return String(value)
}

function encodePrimitive(value: unknown, delimiter: string): string {
  if (value === null) return 'null'
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  if (typeof value === 'number') return formatNumber(value)
  return needsQuotes(value, delimiter) ? JSON.stringify(value) : value
}

function decodeToken(token: string): unknown {
  const text = token.trim()
  if (text.startsWith('"')) {
    try {
      return JSON.parse(text)
    } catch {
      return text.slice(1, -1)
    }
  }
  if (text === 'true') return true
  if (text === 'false') return false
  if (text === 'null') return null
  if (NUMERIC.test(text)) return Number(text)
  return text
}

// ------------------------------------------------------------------- encoder

type ArrayKind = 'primitive' | 'tabular' | 'list'

function arrayKind(items: unknown[]): ArrayKind {
  if (items.every(isPrimitive)) return 'primitive'
  if (items.every(item => isPlainObject(item) && Object.keys(item).length > 0)) {
    const keys = Object.keys(items[0]).sort()
    const sameKeys = items.every(item => {
      const own = Object.keys(item).sort()
      return own.length === keys.length && own.every((k, i) => k === keys[i])
    })
    const primitiveColumns = keys.every(k => items.every(item => isPrimitive(item[k])))
    if (sameKeys && primitiveColumns) return 'tabular'
  }
  return 'list'
}

function pad(depth: number): string {
  return '  '.repeat(depth)
}

function encodeArrayWithPrefix(
  prefix: string,
  items: unknown[],
  depth: number,
  delimiter: string,
  out: string[],
): void {
  const symbol = delimiterSymbol(delimiter)
  if (items.length === 0) {
    out.push(`${prefix}: []`)
    return
  }
  const kind = arrayKind(items)
  if (kind === 'primitive') {
    const cells = items.map(item => encodePrimitive(item, delimiter)).join(delimiter)
    out.push(`${prefix}[${items.length}${symbol}]: ${cells}`)
    return
  }
  if (kind === 'tabular') {
    const fields = Object.keys(items[0] as Record<string, unknown>)
    const header = fields.map(encodeKey).join(delimiter)
    out.push(`${prefix}[${items.length}${symbol}]{${header}}:`)
    for (const item of items) {
      const row = fields.map(f => encodePrimitive((item as Record<string, unknown>)[f], delimiter))
      out.push(`${pad(depth + 1)}${row.join(delimiter)}`)
    }
    return
  }
  out.push(`${prefix}[${items.length}${symbol}]:`)
  encodeListItems(items, depth + 1, delimiter, out)
}

function encodeListItems(items: unknown[], depth: number, delimiter: string, out: string[]): void {
  const symbol = delimiterSymbol(delimiter)
  for (const item of items) {
    if (isPrimitive(item)) {
      out.push(`${pad(depth)}- ${encodePrimitive(item, delimiter)}`)
      continue
    }
    if (Array.isArray(item)) {
      if (item.length === 0) {
        out.push(`${pad(depth)}- []`)
        continue
      }
      const kind = arrayKind(item)
      if (kind === 'primitive') {
        const cells = item.map(v => encodePrimitive(v, delimiter)).join(delimiter)
        out.push(`${pad(depth)}- [${item.length}${symbol}]: ${cells}`)
      } else {
        out.push(`${pad(depth)}- [${item.length}${symbol}]:`)
        encodeListItems(item, depth + 1, delimiter, out)
      }
      continue
    }
    encodeObjectListItem(item as Record<string, unknown>, depth, delimiter, out)
  }
}

function encodeObjectListItem(
  obj: Record<string, unknown>,
  depth: number,
  delimiter: string,
  out: string[],
): void {
  const keys = Object.keys(obj)
  if (keys.length === 0) {
    out.push(`${pad(depth)}-`)
    return
  }
  const firstKey = keys[0]
  const firstValue = obj[firstKey]
  const head = `${pad(depth)}- ${encodeKey(firstKey)}`
  if (isPrimitive(firstValue)) {
    out.push(`${head}: ${encodePrimitive(firstValue, delimiter)}`)
  } else if (Array.isArray(firstValue)) {
    encodeArrayWithPrefix(head, firstValue, depth, delimiter, out)
  } else {
    out.push(`${head}:`)
    encodeObjectBody(firstValue as Record<string, unknown>, depth + 1, delimiter, out)
  }
  for (const key of keys.slice(1)) {
    encodeField(key, obj[key], depth + 1, delimiter, out)
  }
}

function encodeField(
  key: string,
  value: unknown,
  depth: number,
  delimiter: string,
  out: string[],
): void {
  const prefix = `${pad(depth)}${encodeKey(key)}`
  if (isPrimitive(value)) {
    out.push(`${prefix}: ${encodePrimitive(value, delimiter)}`)
    return
  }
  if (Array.isArray(value)) {
    encodeArrayWithPrefix(prefix, value, depth, delimiter, out)
    return
  }
  const keys = Object.keys(value as Record<string, unknown>)
  if (keys.length === 0) {
    out.push(`${prefix}:`)
    return
  }
  out.push(`${prefix}:`)
  encodeObjectBody(value as Record<string, unknown>, depth + 1, delimiter, out)
}

function encodeObjectBody(
  obj: Record<string, unknown>,
  depth: number,
  delimiter: string,
  out: string[],
): void {
  for (const [key, value] of Object.entries(obj)) {
    encodeField(key, value, depth, delimiter, out)
  }
}

export function jsonToToon(value: unknown, options: ToonOptions = {}): string {
  const delimiter = options.delimiter ?? ','
  const out: string[] = []

  if (isPrimitive(value)) {
    out.push(encodePrimitive(value, delimiter))
    return out.join('\n')
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      out.push('[]')
      return out.join('\n')
    }
    const symbol = delimiterSymbol(delimiter)
    const kind = arrayKind(value)
    if (kind === 'primitive') {
      const cells = value.map(v => encodePrimitive(v, delimiter)).join(delimiter)
      out.push(`[${value.length}${symbol}]: ${cells}`)
    } else if (kind === 'tabular') {
      const fields = Object.keys(value[0] as Record<string, unknown>)
      out.push(`[${value.length}${symbol}]{${fields.map(encodeKey).join(delimiter)}}:`)
      for (const item of value) {
        const row = fields.map(f => encodePrimitive((item as Record<string, unknown>)[f], delimiter))
        out.push(`${pad(1)}${row.join(delimiter)}`)
      }
    } else {
      out.push(`[${value.length}${symbol}]:`)
      encodeListItems(value, 1, delimiter, out)
    }
    return out.join('\n')
  }

  encodeObjectBody(value as Record<string, unknown>, 0, delimiter, out)
  return out.join('\n')
}

// ------------------------------------------------------------------- decoder

export class ToonSyntaxError extends Error {
  constructor() {
    super('Invalid TOON')
    this.name = 'ToonSyntaxError'
  }
}

function fail(): never {
  throw new ToonSyntaxError()
}

interface Line {
  text: string
  depth: number
}

/** Split on a delimiter while ignoring separators inside quoted cells. */
function splitOutsideQuotes(text: string, delimiter: string): string[] {
  const parts: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (inQuotes) {
      if (ch === '\\') { current += ch + (text[i + 1] ?? ''); i++; continue }
      if (ch === '"') { inQuotes = false; current += ch; continue }
      current += ch
      continue
    }
    if (ch === '"') { inQuotes = true; current += ch; continue }
    if (ch === delimiter) { parts.push(current); current = ''; continue }
    current += ch
  }
  parts.push(current)
  return parts
}

/** Read a leading bare or double-quoted key. */
function readKey(text: string): { key: string; rest: string } | null {
  if (text.startsWith('"')) {
    let i = 1
    let key = ''
    let closed = false
    while (i < text.length) {
      const ch = text[i]
      if (ch === '\\') { key += ch + (text[i + 1] ?? ''); i += 2; continue }
      if (ch === '"') { i++; closed = true; break }
      key += ch
      i++
    }
    if (!closed) return null
    return { key, rest: text.slice(i) }
  }
  const match = /^([A-Za-z_][A-Za-z0-9_.]*)(.*)$/.exec(text)
  if (!match) return null
  return { key: match[1], rest: match[2] }
}

interface Header {
  key: string | null
  length: number
  delimiter: string
  fields: string[] | null
  inline: string | null
}

function parseHeader(text: string): Header | null {
  let key: string | null = null
  let rest = text
  if (!rest.startsWith('[')) {
    const read = readKey(rest)
    if (!read) return null
    key = read.key
    rest = read.rest
  }
  const bracket = /^\[(\d+)([\t|]?)\]/.exec(rest)
  if (!bracket) return null
  const length = Number(bracket[1])
  const delimiter = bracket[2] === '' ? ',' : bracket[2]
  rest = rest.slice(bracket[0].length)

  let fields: string[] | null = null
  if (rest.startsWith('{')) {
    const close = rest.indexOf('}')
    if (close === -1) return null
    const inner = rest.slice(1, close)
    fields = inner === ''
      ? []
      : splitOutsideQuotes(inner, delimiter).map(part => {
        const trimmed = part.trim()
        if (trimmed.startsWith('"')) {
          try {
            return JSON.parse(trimmed) as string
          } catch {
            return trimmed.slice(1, -1)
          }
        }
        return trimmed
      })
    rest = rest.slice(close + 1)
  }

  if (!rest.startsWith(':')) return null
  let inline = rest.slice(1)
  if (inline.startsWith(' ')) inline = inline.slice(1)
  if (inline === '') inline = null
  return { key, length, delimiter, fields, inline }
}

function splitKeyValue(text: string): { key: string; value: string } | null {
  const read = readKey(text)
  if (!read) return null
  if (!read.rest.startsWith(':')) return null
  let value = read.rest.slice(1)
  if (value.startsWith(' ')) value = value.slice(1)
  return { key: read.key, value }
}

function parseObjectBody(lines: Line[], start: number, depth: number): { obj: Record<string, unknown>; next: number } {
  const obj: Record<string, unknown> = {}
  let i = start
  while (i < lines.length && lines[i].depth === depth) {
    const line = lines[i]
    if (line.text.startsWith('- ') || line.text === '-') fail()

    const header = parseHeader(line.text)
    if (header) {
      if (header.key === null) fail()
      const parsed = parseArray(lines, i, depth, header)
      obj[header.key] = parsed.value
      i = parsed.next
      continue
    }

    const pair = splitKeyValue(line.text)
    if (!pair) fail()

    if (pair.value === '[]') {
      obj[pair.key] = []
      i++
      continue
    }

    if (pair.value === '') {
      if (i + 1 < lines.length && lines[i + 1].depth > depth) {
        const child = parseObjectBody(lines, i + 1, lines[i + 1].depth)
        obj[pair.key] = child.obj
        i = child.next
      } else {
        obj[pair.key] = {}
        i++
      }
      continue
    }

    obj[pair.key] = decodeToken(pair.value)
    i++
  }
  return { obj, next: i }
}

function parseArray(lines: Line[], start: number, depth: number, header: Header): { value: unknown[]; next: number } {
  if (header.fields !== null) {
    if (header.inline !== null) fail()
    const rows: unknown[][] = []
    let j = start + 1
    while (j < lines.length && lines[j].depth > depth) {
      const cells = splitOutsideQuotes(lines[j].text.trim(), header.delimiter)
      if (cells.length !== header.fields.length) fail()
      rows.push(cells.map(decodeToken))
      j++
    }
    if (rows.length !== header.length) fail()
    const value = rows.map(cells => {
      const obj: Record<string, unknown> = {}
      header.fields!.forEach((field, index) => { obj[field] = cells[index] })
      return obj
    })
    return { value, next: j }
  }

  if (header.inline !== null) {
    const cells = splitOutsideQuotes(header.inline, header.delimiter)
    if (cells.length !== header.length) fail()
    return { value: cells.map(decodeToken), next: start + 1 }
  }

  const items: unknown[] = []
  let j = start + 1
  while (j < lines.length && lines[j].depth > depth) {
    const line = lines[j]
    if (!line.text.startsWith('-')) fail()
    const after = line.text.slice(1)
    const content = after.startsWith(' ') ? after.slice(1) : after

    if (content === '') {
      items.push({})
      j++
      continue
    }

    const itemHeader = parseHeader(content)
    if (itemHeader) {
      if (itemHeader.inline !== null) {
        const cells = splitOutsideQuotes(itemHeader.inline, itemHeader.delimiter)
        if (cells.length !== itemHeader.length) fail()
        items.push(cells.map(decodeToken))
        j++
      } else {
        const parsed = parseArray(lines, j, line.depth, itemHeader)
        items.push(parsed.value)
        j = parsed.next
      }
      continue
    }

    const pair = splitKeyValue(content)
    if (!pair) {
      // A list item that is neither a header nor `key: value` is a primitive.
      items.push(decodeToken(content))
      j++
      continue
    }
    const item: Record<string, unknown> = {}
    if (pair.value === '') {
      if (j + 1 < lines.length && lines[j + 1].depth > line.depth) {
        const child = parseObjectBody(lines, j + 1, lines[j + 1].depth)
        item[pair.key] = child.obj
        j = child.next
      } else {
        item[pair.key] = {}
        j++
      }
    } else {
      item[pair.key] = decodeToken(pair.value)
      j++
    }
    while (j < lines.length && lines[j].depth > line.depth) {
      const child = parseObjectBody(lines, j, lines[j].depth)
      Object.assign(item, child.obj)
      j = child.next
    }
    items.push(item)
  }

  if (items.length !== header.length) fail()
  return { value: items, next: j }
}

function toLines(text: string): Line[] {
  const raw = text.split('\n').map(l => l.replace(/\s+$/, ''))
  const widths: number[] = []
  const lines: Line[] = []
  for (const line of raw) {
    if (line.trim() === '') continue
    const leading = line.length - line.replace(/^[ ]+/, '').length
    if (leading % 2 !== 0) fail()
    let widthIndex = widths.indexOf(leading)
    if (widthIndex === -1) {
      widths.push(leading)
      widths.sort((a, b) => a - b)
      widthIndex = widths.indexOf(leading)
    }
    lines.push({ text: line.slice(leading), depth: widthIndex })
  }
  return lines
}

export function toonToJson(text: string): unknown {
  const lines = toLines(text)
  if (lines.length === 0) return {}

  const first = lines[0].text
  if (first === '[]') return []

  const header = parseHeader(first)
  if (header && header.key === null) {
    const parsed = parseArray(lines, 0, lines[0].depth, header)
    if (parsed.next !== lines.length) fail()
    return parsed.value
  }

  // A single line that is neither a keyed header nor `key: value` is a
  // root primitive.
  if (lines.length === 1 && header === null && splitKeyValue(first) === null) {
    return decodeToken(first)
  }

  const parsed = parseObjectBody(lines, 0, lines[0].depth)
  if (parsed.next !== lines.length) fail()
  return parsed.obj
}
