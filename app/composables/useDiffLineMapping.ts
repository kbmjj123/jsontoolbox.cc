import { diff as jsonDiff } from 'jsondiffpatch'

export interface DiffEntry {
  path: string
  type: 'added' | 'removed' | 'changed'
  oldValue?: any
  newValue?: any
}

export interface LineDecoration {
  line: number
  type: 'added' | 'removed' | 'changed'
}

export function useDiffLineMapping() {
  /**
   * Compute diff using jsondiffpatch, then map to line decorations.
   */
  function computeAndMap(
    leftText: string,
    rightText: string,
    ignoreArrayOrder = false
  ): { diffs: DiffEntry[], leftLines: LineDecoration[], rightLines: LineDecoration[], leftPathLine: Map<string, number>, rightPathLine: Map<string, number> } {
    const empty = { diffs: [] as DiffEntry[], leftLines: [] as LineDecoration[], rightLines: [] as LineDecoration[], leftPathLine: new Map<string, number>(), rightPathLine: new Map<string, number>() }
    let leftObj: any, rightObj: any
    try { leftObj = JSON.parse(leftText) } catch { return empty }
    try { rightObj = JSON.parse(rightText) } catch { return empty }

    const options = ignoreArrayOrder ? { arrays: { detectMove: true, includeValueOnMove: false } } : {}
    const delta = jsonDiff(leftObj, rightObj, undefined, undefined, options as any)

    if (!delta) return empty

    const diffs = flattenDelta(delta, '')
    if (!diffs.length) return empty

    const { decorations: leftLines, pathLine: leftPathLine } = mapToLines(leftText, diffs, 'left')
    const { decorations: rightLines, pathLine: rightPathLine } = mapToLines(rightText, diffs, 'right')

    return { diffs, leftLines, rightLines, leftPathLine, rightPathLine }
  }

  /**
   * Recursively flatten a jsondiffpatch delta into DiffEntry list.
   *
   * Delta format:
   *   Added:   [newValue]            — 1-element array
   *   Removed: [oldValue, 0, 0]     — 3-element array, last two are 0
   *   Modified: [oldValue, newValue] — 2-element array
   *   Nested:  { key: delta, ... }   — object (arrays have `_t: "a"`)
   */
  function flattenDelta(delta: any, basePath: string): DiffEntry[] {
    if (!delta) return []
    const results: DiffEntry[] = []

    if (Array.isArray(delta)) {
      if (delta.length === 1) {
        results.push({ path: basePath, type: 'added', newValue: delta[0] })
      } else if (delta.length === 2) {
        results.push({ path: basePath, type: 'changed', oldValue: delta[0], newValue: delta[1] })
      } else if (delta.length === 3 && delta[1] === 0 && delta[2] === 0) {
        results.push({ path: basePath, type: 'removed', oldValue: delta[0] })
      }
      return results
    }

    if (typeof delta === 'object') {
      const isArrayDelta = delta._t === 'a'
      for (const key of Object.keys(delta)) {
        if (key === '_t') continue
        let childPath: string
        if (isArrayDelta) {
          if (key.startsWith('_')) {
            const idx = key.slice(1)
            childPath = basePath ? `${basePath}.${idx}` : idx
            const entry = delta[key]
            if (Array.isArray(entry) && entry.length === 3 && entry[1] === 0 && entry[2] === 0) {
              results.push({ path: childPath, type: 'removed', oldValue: entry[0] })
            }
            continue
          } else {
            childPath = basePath ? `${basePath}.${key}` : key
          }
        } else {
          childPath = basePath ? `${basePath}.${key}` : key
        }
        results.push(...flattenDelta(delta[key], childPath))
      }
    }

    return results
  }

  /**
   * Map diff entries to line numbers in a formatted JSON text.
   */
  function mapToLines(jsonText: string, diffs: DiffEntry[], side: 'left' | 'right'): { decorations: LineDecoration[], pathLine: Map<string, number> } {
    const pathTypeMap = new Map<string, 'added' | 'removed' | 'changed'>()
    for (const d of diffs) {
      if (d.type === 'changed') {
        pathTypeMap.set(d.path, 'changed')
      } else if (side === 'left' && d.type === 'removed') {
        pathTypeMap.set(d.path, 'removed')
      } else if (side === 'right' && d.type === 'added') {
        pathTypeMap.set(d.path, 'added')
      }
    }
    if (pathTypeMap.size === 0) return { decorations: [], pathLine: new Map() }

    // Wildcard variants for array diffs (e.g. [0] ↔ [*])
    const wildcardMap = new Map<string, 'added' | 'removed' | 'changed'>()
    for (const [p, t] of pathTypeMap) {
      const wp = p.replace(/\.\d+/g, '.*')
      if (wp !== p) wildcardMap.set(wp, t)
    }

    const linePaths = scanJsonPaths(jsonText)

    const decorations: LineDecoration[] = []
    const pathLine = new Map<string, number>()
    const seen = new Set<number>()
    for (const [ln, path] of linePaths) {
      const type = pathTypeMap.get(path) || wildcardMap.get(path)
      if (type && !seen.has(ln)) {
        seen.add(ln)
        decorations.push({ line: ln, type })
        if (!pathLine.has(path)) pathLine.set(path, ln)
      }
    }
    return { decorations: decorations.sort((a, b) => a.line - b.line), pathLine }
  }

  /**
   * Scan formatted JSON text. Returns line number → JSON path.
   * Only records paths for VALUE lines (strings, numbers, booleans, null),
   * not for structural characters like { } [ ] on their own lines.
   */
  function scanJsonPaths(jsonText: string): Map<number, string> {
    const result = new Map<number, string>()
    const path: string[] = []
    const contextStack: Array<'object' | 'array'> = []
    const arrayIdxStack: number[] = []

    let inString = false
    let escape = false
    let inValue = false
    let lineNum = 1
    let lineHasContent = false

    function currentPath(): string { return path.join('.') }

    for (let i = 0; i < jsonText.length; i++) {
      const ch = jsonText[i]

      if (ch === '\n') {
        if (lineHasContent) result.set(lineNum, currentPath())
        lineHasContent = false
        inValue = false
        lineNum++
        continue
      }

      // Inside a string
      if (inString) {
        if (escape) { escape = false }
        else if (ch === '\\') { escape = true }
        else if (ch === '"') {
          inString = false
          let j = i + 1
          while (j < jsonText.length && (jsonText[j] === ' ' || jsonText[j] === '\t')) j++
          if (j < jsonText.length && jsonText[j] === ':') {
            const keyStart = jsonText.lastIndexOf('"', i - 1)
            path.push(jsonText.substring(keyStart + 1, i))
          } else {
            // String VALUE ended — record path now
            result.set(lineNum, currentPath())
            lineHasContent = false
            inValue = false
          }
        }
        continue
      }

      // Skip whitespace
      if (/\s/.test(ch)) continue

      // Start of string
      if (ch === '"') { inString = true; continue }

      // Structural: { } [ ]
      if (ch === '{' || ch === '[') {
        if (ch === '[') {
          contextStack.push('array')
          arrayIdxStack.push(0)
          path.push('0')
        } else {
          contextStack.push('object')
        }
        continue
      }

      if (ch === '}' || ch === ']') {
        if (inValue) {
          result.set(lineNum, currentPath())
          lineHasContent = false
          inValue = false
        }
        contextStack.pop()
        if (ch === ']') {
          arrayIdxStack.pop()
          if (path.length > 0) path.pop()
        } else {
          const parentDepth = contextStack.length
          while (path.length > parentDepth && path.length > 0) path.pop()
        }
        continue
      }

      // Comma: separate items
      if (ch === ',') {
        if (inValue) {
          result.set(lineNum, currentPath())
          lineHasContent = false
          inValue = false
        }
        if (contextStack.length > 0) {
          const ctx = contextStack[contextStack.length - 1]
          if (ctx === 'object') {
            if (path.length > 0) path.pop()
          } else {
            // Array: increment tracked index, update path
            arrayIdxStack[arrayIdxStack.length - 1]++
            const newIdx = arrayIdxStack[arrayIdxStack.length - 1]
            if (path.length > 0) path[path.length - 1] = String(newIdx)
            else path.push(String(newIdx))
          }
        }
        continue
      }

      // Colon: key-value separator
      if (ch === ':') { inValue = true; continue }

      // Non-string value character (digit, t, f, n, -)
      if (!inValue) inValue = true
      lineHasContent = true
    }

    if (lineHasContent) result.set(lineNum, currentPath())
    return result
  }

  return { computeAndMap }
}
