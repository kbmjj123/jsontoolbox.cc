import { describe, expect, it } from 'vitest'
import {
  analyzeJson,
  getErrorLocation,
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
