import { describe, expect, it } from 'vitest'
import {
  parseTreePath,
  getAt,
  setAt,
  removeAt,
  deepClone,
  convertValueToType,
  renameKeyOp,
  setTypeOp,
  addFieldOp,
  removeFieldOp,
  addArrayItemOp,
  removeArrayItemOp,
  moveArrayItemOp,
  copyNodeOp,
  moveNodeOp,
  batchSetValueOp,
  commitEdit,
} from '../src/core/edit'

describe('edit — path + get/set/remove (pure)', () => {
  it('parses tree paths into segments', () => {
    expect(parseTreePath('')).toEqual([])
    expect(parseTreePath('users[0].name')).toEqual(['users', 0, 'name'])
    expect(parseTreePath('items[2]')).toEqual(['items', 2])
  })

  it('reads values at a path', () => {
    const data = { users: [{ name: 'Ann' }] }
    expect(getAt(data, parseTreePath('users[0].name'))).toBe('Ann')
    expect(getAt(data, parseTreePath('users[5].name'))).toBeUndefined()
  })

  it('immutably sets a nested value', () => {
    const data = { a: { b: 1 } }
    const next = setAt(data, parseTreePath('a.b'), 2) as typeof data
    expect(next.a.b).toBe(2)
    expect(data.a.b).toBe(1) // original untouched
  })

  it('immutably removes a field and keeps key order on rename', () => {
    const data = { a: 1, b: 2, c: 3 }
    const removed = removeFieldOp(data, 'b') as Record<string, number>
    expect(Object.keys(removed)).toEqual(['a', 'c'])
    expect(removed).not.toBe(data)

    const renamed = renameKeyOp(data, 'b', 'B') as Record<string, number>
    expect(Object.keys(renamed)).toEqual(['a', 'B', 'c'])
    expect(renamed.B).toBe(2)
  })

  it('deep-clones so edits do not leak', () => {
    const src = { nested: { x: 1 } }
    const clone = deepClone(src)
    ;(clone as any).nested.x = 99
    expect((src as any).nested.x).toBe(1)
  })

  it('converts values between primitive types', () => {
    expect(convertValueToType('42', 'number')).toBe(42)
    expect(convertValueToType(7, 'string')).toBe('7')
    expect(convertValueToType('yes', 'boolean')).toBe(true)
    expect(convertValueToType('', 'boolean')).toBe(false)
    expect(convertValueToType(1, 'null')).toBeNull()
  })

  it('rejects duplicate keys and renaming the root', () => {
    const data = { a: 1, b: [1] }
    expect(() => renameKeyOp(data, '', 'x')).toThrow()
    expect(() => renameKeyOp(data, 'a', 'a')).toThrow(/already exists/)
    expect(() => addFieldOp(data, 'a', 'x', 1)).toThrow(/object/)
    expect(() => addFieldOp(data, 'b', 'x', 1)).toThrow(/object/)
  })
})

describe('edit — array ops', () => {
  const data = { list: [10, 20, 30] }

  it('appends and removes items', () => {
    const added = addArrayItemOp(data, 'list', 40) as typeof data
    expect(added.list).toEqual([10, 20, 30, 40])
    const removed = removeArrayItemOp(data, 'list', 1) as typeof data
    expect(removed.list).toEqual([10, 30])
  })

  it('moves items', () => {
    const moved = moveArrayItemOp(data, 'list', 0, 2) as typeof data
    expect(moved.list).toEqual([20, 30, 10])
    expect(() => moveArrayItemOp(data, 'list', 0, 9)).toThrow(/Invalid array index/)
  })
})

describe('edit — copy / move / batch', () => {
  it('copies a node to a destination', () => {
    const data = { src: { v: 1 }, dst: {} }
    const out = copyNodeOp(data, 'src', 'dst.copy') as any
    expect(out.dst.copy).toEqual({ v: 1 })
    expect(out.src).toEqual({ v: 1 })
  })

  it('moves a node (copy then delete source)', () => {
    const data = { src: { v: 1 }, dst: {} }
    const out = moveNodeOp(data, 'src', 'dst.moved') as any
    expect(out.dst.moved).toEqual({ v: 1 })
    expect(out.src).toBeUndefined()
  })

  it('batches a value across several paths', () => {
    const data = { a: { x: 1 }, b: { x: 2 } }
    const out = batchSetValueOp(data, ['a.x', 'b.x'], 0) as any
    expect(out.a.x).toBe(0)
    expect(out.b.x).toBe(0)
    expect(() => batchSetValueOp(data, [], 0)).toThrow()
  })
})

describe('edit — removeAt / setTypeOp', () => {
  it('removeAt deletes a nested field and rebuilds ancestors', () => {
    const data = { a: { b: 1, c: 2 }, d: [10, 20] }
    const next = removeAt(data, parseTreePath('a.c'))
    expect(next).toEqual({ a: { b: 1 }, d: [10, 20] })
    // original untouched (immutability)
    expect(data.a.c).toBe(2)
  })

  it('removeAt drops an array element by index', () => {
    const data = { d: [10, 20, 30] }
    const next = removeAt(data, parseTreePath('d[1]'))
    expect((next as { d: number[] }).d).toEqual([10, 30])
  })

  it('setTypeOp coerces a string leaf to a number', () => {
    const data = { a: '42' }
    const next = setTypeOp(data, 'a', 'number')
    expect((next as { a: unknown }).a).toBe(42)
  })

  it('setTypeOp coerces a number leaf to a boolean', () => {
    const data = { a: 0 }
    const next = setTypeOp(data, 'a', 'boolean')
    expect((next as { a: unknown }).a).toBe(false)
  })
})

describe('edit — commitEdit', () => {
  it('parses, mutates, validates and re-stringifies', () => {
    const r = commitEdit('{"a":1}', 2, (d) => setAt(d, parseTreePath('a'), 2))
    expect(r.ok).toBe(true)
    if (r.ok) expect(JSON.parse(r.text)).toEqual({ a: 2 })
  })

  it('returns the parser error for invalid input', () => {
    const r = commitEdit('{bad', 2, (d) => d)
    expect(r.ok).toBe(false)
  })

  it('returns the operation error when the mutator throws', () => {
    const r = commitEdit('{"a":1}', 2, () => {
      throw new Error('boom')
    })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error).toBe('boom')
  })
})
