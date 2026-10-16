import { describe, expect, it } from 'vitest'
import {
  analyzeJson,
  getErrorLocation,
  hasLargeNumbers,
  normalizeJsonError,
  parseJson,
  validateJson,
} from '../src/core/parse'
import { formatJson, minifyJson } from '../src/core/format'
import { toJsonPath, jsonTypeLabel } from '../src/core/path'
import {
  ancestorPaths,
  buildTree,
  collectContainerPaths,
  flattenVisible,
  searchTree,
  splitByQuery,
} from '../src/core/tree'
import { buildSourceMap } from '../src/core/sourceMap'

const SAMPLE = {
  name: 'root',
  users: [{ id: 1, profile: { email: 'a@b.c' } }],
  flags: { beta: true, count: 2 },
}

describe('parse', () => {
  it('parses valid JSON', () => {
    const { data, error } = parseJson('{"a":[1,2]}')
    expect(error).toBeNull()
    expect(data).toEqual({ a: [1, 2] })
  })

  it('reports a normalized message for invalid JSON', () => {
    const { data, error } = parseJson('{"a":}')
    expect(data).toBeNull()
    expect(error).toBeTruthy()
    expect(error).not.toMatch(/position \d+/)
  })

  it('strips the position tail from raw messages', () => {
    expect(normalizeJsonError('Unexpected token } in JSON at position 12')).toBe('Unexpected token } in JSON')
  })

  it('keeps big numbers as BigInt when asked', () => {
    const { data } = parseJson('{"n":12345678901234567890}', { bigInt: true })
    expect((data as { n: bigint }).n).toBe(12345678901234567890n)
  })

  it('locates the failing line and column', () => {
    const text = '{\n  "a": 1,\n  "b"\n}'
    const location = getErrorLocation(text, 'Unexpected token } in JSON at position 21')
    expect(location).not.toBeNull()
    expect(location!.line).toBeGreaterThanOrEqual(1)
    expect(location!.column).toBeGreaterThanOrEqual(1)
  })

  it('analyzeJson returns message and location together', () => {
    const result = analyzeJson('{"a":1,}\n')
    expect(result.error).toBeTruthy()
    expect(result.location?.line).toBe(1)
  })

  it('analyzeJson returns no location for valid JSON', () => {
    expect(analyzeJson('{"a":1}')).toEqual({ data: { a: 1 }, error: null, location: null })
  })

  it('validateJson flags invalid input only', () => {
    expect(validateJson('[]').valid).toBe(true)
    expect(validateJson('[').valid).toBe(false)
  })
})

describe('format', () => {
  const minified = '{"a":[1,2],"b":{"c":"d"}}'

  it('formats with the requested indent', () => {
    const result = formatJson(minified, 2)
    expect(result.error).toBeNull()
    expect(result.text.split('\n').length).toBeGreaterThan(1)
    expect(result.text).toContain('\n  "a"')
  })

  it('formats with tabs', () => {
    expect(formatJson(minified, 'tab').text).toContain('\n\t"a"')
  })

  it('minifies to a single line', () => {
    const result = minifyJson(formatJson(minified, 4).text)
    expect(result.text).toBe(minified)
  })

  it('round-trips: format(minify(x)) is stable', () => {
    const once = formatJson(minified, 2).text
    expect(formatJson(minifyJson(once).text, 2).text).toBe(once)
  })

  it('does not throw on invalid input', () => {
    const result = formatJson('{"a":}', 2)
    expect(result.error).toBeTruthy()
    expect(result.text).toBe('{"a":}')
  })
})

describe('path', () => {
  it('builds JSONPath expressions', () => {
    expect(toJsonPath('')).toBe('$')
    expect(toJsonPath('name')).toBe('$.name')
    expect(toJsonPath('users[0].profile')).toBe('$.users[0].profile')
    expect(toJsonPath('0')).toBe('$[0]')
    expect(toJsonPath('[0]')).toBe('$[0]')
  })

  it('labels types', () => {
    expect(jsonTypeLabel(null)).toBe('null')
    expect(jsonTypeLabel([])).toBe('array')
    expect(jsonTypeLabel({})).toBe('object')
    expect(jsonTypeLabel('x')).toBe('string')
    expect(jsonTypeLabel(1)).toBe('number')
    expect(jsonTypeLabel(true)).toBe('boolean')
  })
})

describe('tree', () => {
  const root = buildTree(SAMPLE)

  it('builds paths with bracket indexes for arrays', () => {
    const paths = collectContainerPaths(root)
    expect(paths).toContain('users')
    expect(paths).toContain('users[0]')
    expect(paths).toContain('users[0].profile')
    expect(paths).toContain('flags')
  })

  it('marks leaf types and child counts', () => {
    const flags = root.children.find((node) => node.key === 'flags')!
    expect(flags.childCount).toBe(2)
    const beta = flags.children.find((node) => node.key === 'beta')!
    expect(beta.type).toBe('boolean')
    expect(beta.children).toHaveLength(0)
  })

  it('flattens only expanded containers', () => {
    const collapsed = flattenVisible(root, new Set())
    expect(collapsed).toHaveLength(1)

    const opened = flattenVisible(root, new Set(['', 'users', 'users[0]']))
    const keys = opened.map((node) => node.path)
    expect(keys).toContain('users[0].id')
    expect(keys).toContain('users[0].profile')
    expect(keys).not.toContain('users[0].profile.email')
  })

  it('flattens deeper when nested containers are expanded', () => {
    const opened = flattenVisible(root, new Set(['', 'users', 'users[0]', 'users[0].profile']))
    expect(opened.map((node) => node.path)).toContain('users[0].profile.email')
  })

  it('searches keys and values, and reports ancestors', () => {
    const result = searchTree(root, 'email')
    expect(result.total).toBe(1)
    expect(result.matches.has('users[0].profile.email')).toBe(true)
    expect(result.ancestors.has('users[0].profile')).toBe(true)
    expect(result.ancestors.has('users')).toBe(true)
  })

  it('is case-insensitive by default', () => {
    expect(searchTree(root, 'EMAIL').total).toBe(1)
    expect(searchTree(root, 'EMAIL', { caseSensitive: true }).total).toBe(0)
  })

  it('can search values only', () => {
    expect(searchTree(root, 'a@b.c', { keys: false }).total).toBe(1)
    expect(searchTree(root, 'a@b.c', { keys: false, values: false }).total).toBe(0)
  })

  it('returns nothing for an empty query', () => {
    expect(searchTree(root, '   ').total).toBe(0)
  })

  it('splits text into highlight chunks', () => {
    expect(splitByQuery('hello world', 'o')).toEqual([
      { text: 'hell', hit: false },
      { text: 'o', hit: true },
      { text: ' w', hit: false },
      { text: 'o', hit: true },
      { text: 'rld', hit: false },
    ])
    expect(splitByQuery('hello', '')).toEqual([{ text: 'hello', hit: false }])
  })

  it('lists ancestors nearest-first', () => {
    expect(ancestorPaths('users[0].profile.email')).toEqual(['users[0].profile', 'users[0]', 'users'])
    expect(ancestorPaths('name')).toEqual([])
  })
})

describe('sourceMap', () => {
  it('maps paths to line numbers', () => {
    const json = '{\n  "config": {\n    "debug": true\n  }\n}'
    const map = buildSourceMap(json)
    expect(map.get('config')).toBe(2)
    expect(map.get('config.debug')).toBe(3)
  })

  it('maps array indexes', () => {
    const json = '{\n  "list": [\n    1,\n    2\n  ]\n}'
    const map = buildSourceMap(json)
    expect(map.get('list[0]')).toBe(3)
    expect(map.get('list[1]')).toBe(4)
  })

  it('keeps strings intact when they contain braces', () => {
    const map = buildSourceMap('{"a":"{\\"not\\":1}"}')
    expect(map.has('a')).toBe(true)
    expect(map.has('not')).toBe(false)
  })
})

// ── Boundaries ────────────────────────────────────────────────────────────
// Pinned before L1 unification: the site has a near-identical copy of these
// functions (app/utils/sourceMap.ts, app/utils/jsonPath.ts) with 1 and 10
// consumers respectively. These cases define the contract the swap must keep.

describe('sourceMap boundaries', () => {
  it('records the line of the colon, not the value', () => {
    // The map is written right after `:` is consumed — a value on the next
    // line still records the colon's line.
    expect(buildSourceMap('{\n  "a":\n    1\n}').get('a')).toBe(2)
    // A newline between key and colon *is* counted.
    expect(buildSourceMap('{\n  "a"\n  : 1\n}').get('a')).toBe(3)
  })

  it('returns an empty map for empty containers', () => {
    expect(buildSourceMap('{}').size).toBe(0)
    expect(buildSourceMap('[]').size).toBe(0)
  })

  it('maps a top-level array', () => {
    const map = buildSourceMap('[\n  1,\n  2\n]')
    expect(map.get('0')).toBe(2)
    expect(map.get('1')).toBe(3)
  })

  it('maps nested arrays', () => {
    const map = buildSourceMap('{"m":[[1,2],{"k":3}]}')
    expect(map.get('m[0][0]')).toBe(1)
    expect(map.get('m[1].k')).toBe(1)
  })

  it('treats keys containing dots or brackets as opaque', () => {
    // Known limitation shared with buildTree: `a.b` is indistinguishable
    // from a nested path. Pinned so the swap cannot change it silently.
    const map = buildSourceMap('{"a.b":1,"c[0]":2}')
    expect(map.has('a.b')).toBe(true)
    expect(map.has('c[0]')).toBe(true)
  })

  it('does not break on escaped quotes or backslashes', () => {
    const map = buildSourceMap('{"a":"he said \\"hi\\"","b":"c:\\\\d"}')
    expect([...map.keys()]).toEqual(['a', 'b'])
  })

  it('ignores structural characters inside strings', () => {
    const map = buildSourceMap('{"a":"[]{},:","b":1}')
    expect([...map.keys()]).toEqual(['a', 'b'])
    expect(map.get('b')).toBe(1)
  })

  it('counts CRLF line endings', () => {
    expect(buildSourceMap('{\r\n  "a": 1\r\n}').get('a')).toBe(2)
  })

  it('records every sibling when a value spans lines', () => {
    const json = '{\n  "a": {\n    "x": 1\n  },\n  "b": 2\n}'
    const map = buildSourceMap(json)
    expect(map.get('a')).toBe(2)
    expect(map.get('a.x')).toBe(3)
    expect(map.get('b')).toBe(5)
  })
})

describe('path boundaries', () => {
  it('prefixes dotted keys without disambiguating them', () => {
    expect(toJsonPath('a.b')).toBe('$.a.b')
    expect(toJsonPath('users[0]')).toBe('$.users[0]')
  })

  it('lists array ancestors', () => {
    expect(ancestorPaths('users[0]')).toEqual(['users'])
    expect(ancestorPaths('[0]')).toEqual([])
  })

  it('labels undefined as undefined', () => {
    // The signature promises JsonTypeName, but the runtime returns whatever
    // `typeof` yields. Pinned: the site copy has the same cast.
    expect(jsonTypeLabel(undefined)).toBe('undefined')
  })
})

describe('parse boundaries', () => {
  it('strips both engine error formats', () => {
    expect(normalizeJsonError('Unexpected token } in JSON at position 12')).toBe('Unexpected token } in JSON')
    expect(normalizeJsonError('Unexpected token } in JSON at position 12 (line 1 column 13)')).toBe(
      'Unexpected token } in JSON'
    )
    expect(normalizeJsonError('Unexpected token } (line 1 column 13)')).toBe('Unexpected token }')
    expect(normalizeJsonError('Unexpected end of JSON input')).toBe('Unexpected end of JSON input')
  })

  it('locates a position deterministically', () => {
    // Synthetic messages: the engines disagree on wording and position.
    expect(getErrorLocation('abc\ndef', 'boom at position 0')).toEqual({ line: 1, column: 1 })
    expect(getErrorLocation('abc\ndef', 'boom at position 4')).toEqual({ line: 2, column: 1 })
    expect(getErrorLocation('abc\ndef', 'boom at position 5')).toEqual({ line: 2, column: 2 })
  })

  it('clamps a position beyond the text and returns null without one', () => {
    expect(getErrorLocation('abc\ndef', 'boom at position 100')).toEqual({ line: 2, column: 4 })
    expect(getErrorLocation('abc', 'boom')).toBeNull()
  })

  it('restores negative big integers', () => {
    const { data } = parseJson('{"n":-12345678901234567890}', { bigInt: true })
    expect((data as { n: bigint }).n).toBe(-12345678901234567890n)
  })

  it('leaves big integers inside arrays untouched', () => {
    // The rewrite only matches `:`-prefixed numbers, so array members keep
    // the lossy Number conversion.
    const { data } = parseJson('{"a":[12345678901234567890]}', { bigInt: true })
    expect(typeof (data as { a: unknown[] }).a[0]).toBe('number')
  })

  it('needs 16 digits before it rewrites', () => {
    expect(hasLargeNumbers('{"n":123456789012345}')).toBe(false)
    expect(hasLargeNumbers('{"n":1234567890123456}')).toBe(true)
  })

  it('reports errors on the bigInt path too', () => {
    const { data, error } = parseJson('{"n":1,}', { bigInt: true })
    expect(data).toBeNull()
    expect(error).toBeTruthy()
  })
})
