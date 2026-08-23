/**
 * Build a map from JSON path → source line number.
 * Recursively scans the raw JSON string.
 *
 * Path format matches tree components' getFullPath: "users[0].name"
 *
 * Example: '{"config":{"debug":true}}'
 *   → Map { "config" → 1, "config.debug" → 1 }
 */
export function buildSourceMap(json: string): Map<string, number> {
  const map = new Map<string, number>()
  let line = 1
  let i = 0

  // ── Helpers ─────────────────────────────────────────────────

  const skipWs = () => {
    while (i < json.length && /[\s]/.test(json[i])) {
      if (json[i] === '\n') line++
      i++
    }
  }

  const skipString = () => {
    i++ // opening quote
    while (i < json.length) {
      if (json[i] === '\\') { i += 2; continue }
      if (json[i] === '"') { i++; return }
      if (json[i] === '\n') line++
      i++
    }
  }

  const readString = (): string => {
    i++ // opening quote
    let s = ''
    while (i < json.length && json[i] !== '"') {
      if (json[i] === '\\') { s += json[i] + json[i + 1]; i += 2; continue }
      s += json[i]
      if (json[i] === '\n') line++
      i++
    }
    i++ // closing quote
    return s
  }

  const skipPrimitive = () => {
    while (i < json.length && /[^,}\]\s]/.test(json[i])) i++
  }

  /** Skip any value (string, number, bool, null, object, array) without recording */
  const skipValue = () => {
    skipWs()
    if (i >= json.length) return
    const ch = json[i]
    if (ch === '"') { skipString(); return }
    if (ch === '{') { skipObject(); return }
    if (ch === '[') { skipArray(); return }
    skipPrimitive()
  }

  const skipObject = () => {
    i++ // {
    while (true) {
      skipWs()
      if (i >= json.length || json[i] === '}') { i++; return }
      if (json[i] === ',') { i++; continue }
      if (json[i] === '"') {
        skipString() // key
        skipWs()
        i++ // :
        skipValue()
      } else {
        i++
      }
    }
  }

  const skipArray = () => {
    i++ // [
    while (true) {
      skipWs()
      if (i >= json.length || json[i] === ']') { i++; return }
      if (json[i] === ',') { i++; continue }
      skipValue()
    }
  }

  // ── Path builder (matches tree's getFullPath format) ────────

  const joinPath = (parent: string, key: string, isIndex: boolean): string => {
    if (!parent) return key
    return isIndex ? `${parent}[${key}]` : `${parent}.${key}`
  }

  // ── Recursive parsers (record paths) ────────────────────────

  const parseValue = (path: string) => {
    skipWs()
    if (i >= json.length) return
    const ch = json[i]
    if (ch === '{') { parseObject(path); return }
    if (ch === '[') { parseArray(path); return }
    // string/primitive — advance past the value
    skipValue()
  }

  const parseObject = (parentPath: string) => {
    i++ // {
    while (true) {
      skipWs()
      if (i >= json.length || json[i] === '}') { i++; return }
      if (json[i] === ',') { i++; continue }
      if (json[i] === '"') {
        const key = readString()
        skipWs()
        i++ // :
        const childPath = joinPath(parentPath, key, false)
        map.set(childPath, line)
        parseValue(childPath)
      } else {
        i++
      }
    }
  }

  const parseArray = (parentPath: string) => {
    i++ // [
    let index = 0
    while (true) {
      skipWs()
      if (i >= json.length || json[i] === ']') { i++; return }
      if (json[i] === ',') { i++; continue }
      const childPath = joinPath(parentPath, String(index), true)
      map.set(childPath, line)
      parseValue(childPath)
      index++
    }
  }

  // ── Entry ───────────────────────────────────────────────────

  parseValue('')
  return map
}
