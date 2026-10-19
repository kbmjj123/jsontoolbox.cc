import { describe, it, expect } from 'vitest'
import { buildTree, parseJson } from '../jsonTree'

describe('parseJson', () => {
  it('parses valid JSON', () => {
    expect(parseJson('{"a":1}')).toEqual({ ok: true, root: { a: 1 } })
  })
  it('reports error for invalid JSON', () => {
    const result = parseJson('{"a":}')
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toBeTruthy()
  })
})

describe('buildTree', () => {
  it('builds nested nodes with paths', () => {
    const root = buildTree({ a: { b: [1, 2] } })
    expect(root.kind).toBe('object')
    expect(root.children[0].key).toBe('a')
    expect(root.children[0].children[0].key).toBe('b')
    expect(root.children[0].children[0].kind).toBe('array')
    expect(root.children[0].children[0].path).toBe('a.b')
    expect(root.children[0].children[0].children[1].path).toBe('a.b[1]')
  })
  it('marks primitives with empty children', () => {
    const root = buildTree({ n: 5 })
    expect(root.children[0].kind).toBe('primitive')
    expect(root.children[0].children).toEqual([])
  })
})
