import { describe, it, expect } from 'vitest'
import { formatJson, validateJson, toggleJsonYaml, toTable } from '../commands'

describe('formatJson', () => {
  it('pretty-prints with 2-space indent', () => {
    const result = formatJson('{"a":1,"b":[2,3]}')
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.output).toBe('{\n  "a": 1,\n  "b": [\n    2,\n    3\n  ]\n}')
  })
  it('reports error for invalid input', () => {
    expect(formatJson('{oops').ok).toBe(false)
  })
})

describe('validateJson', () => {
  it('passes valid JSON', () => {
    expect(validateJson('{"a":1}').ok).toBe(true)
  })
  it('fails invalid JSON with message', () => {
    const result = validateJson('{"a":}')
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toContain('JSON')
  })
})

describe('toggleJsonYaml', () => {
  it('converts JSON to YAML', () => {
    const result = toggleJsonYaml('{"a":1,"b":"x"}')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.direction).toBe('json→yaml')
      expect(result.output).toContain('a: 1')
    }
  })
  it('converts YAML to JSON', () => {
    const result = toggleJsonYaml('a: 1\nb: x\n')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.direction).toBe('yaml→json')
      expect(JSON.parse(result.output)).toEqual({ a: 1, b: 'x' })
    }
  })
  it('reports error for neither JSON nor YAML', () => {
    expect(toggleJsonYaml('\t\tbroken: [').ok).toBe(false)
  })
})

describe('toTable', () => {
  it('builds table from array of objects', () => {
    const result = toTable('[{"a":1,"b":2},{"a":3,"b":4}]')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.headers).toEqual(['a', 'b'])
      expect(result.rows).toEqual([['1', '2'], ['3', '4']])
    }
  })
  it('builds key/value table from a plain object', () => {
    const result = toTable('{"a":1,"b":2}')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.headers).toEqual(['key', 'value'])
      expect(result.rows).toEqual([['a', '1'], ['b', '2']])
    }
  })
  it('rejects non-tabular input', () => {
    expect(toTable('42').ok).toBe(false)
  })
})
