import { describe, expect, it } from 'vitest'
import { evaluateJsonPath, parseJsonPathExpression } from '../src/core/jsonPath'

const data = {
  store: {
    book: [
      { category: 'fiction', author: 'Herman', title: 'Moby Dick', price: 8.99 },
      { category: 'reference', author: 'Karen', title: 'Sayings', price: 9.95 },
    ],
    bicycle: { color: 'red', price: 399 },
  },
  'dot.key': 'ok',
}

describe('evaluateJsonPath — supported subset', () => {
  it('returns root for "$"', () => {
    const r = evaluateJsonPath(data, '$')
    expect(r).toEqual([{ path: '', value: data }])
  })

  it('resolves dot key', () => {
    const r = evaluateJsonPath(data, '$.store.bicycle.color')
    expect(r).toEqual([{ path: 'store.bicycle.color', value: 'red' }])
  })

  it('resolves bracket key and index', () => {
    expect(evaluateJsonPath(data, "$['store']['book'][0].title")).toEqual([
      { path: 'store.book[0].title', value: 'Moby Dick' },
    ])
  })

  it('resolves wildcard over an array', () => {
    const r = evaluateJsonPath(data, '$.store.book[*].author')
    expect(r?.map((m) => m.value)).toEqual(['Herman', 'Karen'])
  })

  it('resolves recursive descent $..key', () => {
    const r = evaluateJsonPath(data, '$..price')
    expect(r?.map((m) => m.value as number).sort((a, b) => a - b)).toEqual([8.99, 9.95, 399])
  })

  it('resolves filter ==', () => {
    const r = evaluateJsonPath(data, "$..book[?(@.category=='fiction')].title")
    expect(r).toEqual([{ path: 'store.book[0].title', value: 'Moby Dick' }])
  })

  it('resolves filter !=', () => {
    const r = evaluateJsonPath(data, '$..book[?(@.price!=9.95)].author')
    expect(r?.map((m) => m.value)).toEqual(['Herman'])
  })

  it('handles keys containing dots', () => {
    expect(evaluateJsonPath(data, "$['dot.key']")).toEqual([{ path: 'dot.key', value: 'ok' }])
  })

  it('returns empty array when nothing matches the filter', () => {
    const r = evaluateJsonPath(data, "$..book[?(@.category=='nope')]")
    expect(r).toEqual([])
  })
})

describe('evaluateJsonPath — unsupported / invalid → null', () => {
  it('rejects slices', () => {
    expect(evaluateJsonPath(data, '$.store.book[0:2]')).toBeNull()
  })

  it('rejects trailing recursive descent', () => {
    expect(evaluateJsonPath(data, '$..')).toBeNull()
  })

  it('rejects trailing dot', () => {
    expect(evaluateJsonPath(data, '$.store.')).toBeNull()
  })

  it('rejects empty expression', () => {
    expect(evaluateJsonPath(data, '')).toBeNull()
    expect(evaluateJsonPath(data, '   ')).toBeNull()
  })

  it('rejects unions / script expressions', () => {
    expect(evaluateJsonPath(data, '$.store.book[0,1]')).toBeNull()
    expect(evaluateJsonPath(data, '$.store.book[?(@.price < 9)]')).toBeNull()
  })
})

describe('parseJsonPathExpression', () => {
  it('returns empty segment list for "$"', () => {
    expect(parseJsonPathExpression('$')).toEqual([])
  })

  it('returns null for unsupported slices', () => {
    expect(parseJsonPathExpression('$[0:2]')).toBeNull()
  })
})
