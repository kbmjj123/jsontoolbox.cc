/**
 * Build a map from JSON path → source line number.
 * Scans the raw JSON string character by character.
 *
 * Example: '{"config":{"debug":true}}'
 *   → Map { "config" → 1, "config.debug" → 1 }
 */
export function buildSourceMap(json: string): Map<string, number> {
  const map = new Map<string, number>()
  const path: string[] = []
  let line = 1
  let i = 0

  const skipString = () => {
    i++ // opening quote
    while (i < json.length) {
      if (json[i] === '\\') { i += 2; continue }
      if (json[i] === '"') { i++; return }
      if (json[i] === '\n') line++
      i++
    }
  }

  const skipValue = () => {
    while (i < json.length && /[\s]/.test(json[i])) {
      if (json[i] === '\n') line++
      i++
    }
    if (i >= json.length) return
    if (json[i] === '"') { skipString(); return }
    if (json[i] === '{' || json[i] === '[') return // handled by main loop
    // number, boolean, null — skip until delimiter
    while (i < json.length && /[^,}\]\s]/.test(json[i])) i++
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

  const currentPath = () => path.join('.')

  while (i < json.length) {
    const ch = json[i]
    if (ch === '\n') { line++; i++; continue }
    if (/[\s]/.test(ch)) { i++; continue }

    if (ch === '{') {
      i++
      // parse key-value pairs
      while (i < json.length) {
        // skip whitespace/newlines
        while (i < json.length && /[\s]/.test(json[i])) {
          if (json[i] === '\n') line++
          i++
        }
        if (i >= json.length || json[i] === '}') { i++; break }
        if (json[i] === ',') { i++; continue }

        // key
        if (json[i] === '"') {
          const key = readString()
          path.push(key)

          // skip to colon
          while (i < json.length && /[\s]/.test(json[i])) {
            if (json[i] === '\n') line++
            i++
          }
          i++ // colon

          // record this key's line
          map.set(currentPath(), line)

          // skip to value
          while (i < json.length && /[\s]/.test(json[i])) {
            if (json[i] === '\n') line++
            i++
          }

          if (i < json.length && (json[i] === '{' || json[i] === '[')) {
            // nested — let main loop handle it
          } else {
            skipValue()
            path.pop()
          }
        }
      }
    } else if (ch === '[') {
      i++
      let index = 0
      while (i < json.length) {
        while (i < json.length && /[\s]/.test(json[i])) {
          if (json[i] === '\n') line++
          i++
        }
        if (i >= json.length || json[i] === ']') { i++; break }
        if (json[i] === ',') { i++; continue }

        path.push(String(index))
        map.set(currentPath(), line)

        if (json[i] === '{' || json[i] === '[') {
          // nested — let main loop handle it
        } else {
          skipValue()
          path.pop()
          index++
        }
      }
    } else {
      i++
    }
  }

  return map
}
