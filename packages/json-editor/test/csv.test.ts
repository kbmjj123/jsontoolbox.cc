import { describe, expect, it } from 'vitest'
import { toCsv, escapeCsvCell } from '../src/core/csv'

describe('toCsv (pure)', () => {
  it('joins headers and rows with the default comma delimiter', () => {
    const csv = toCsv(['name', 'age'], [['Ada', 36], ['Bob', 24]])
    expect(csv).toBe('name,age\nAda,36\nBob,24')
  })

  it('escapes cells containing the delimiter, quotes or newlines', () => {
    expect(escapeCsvCell('a,b')).toBe('"a,b"')
    expect(escapeCsvCell('he said "hi"')).toBe('"he said ""hi"""')
    expect(escapeCsvCell('line1\nline2')).toBe('"line1\nline2"')
    expect(escapeCsvCell('plain')).toBe('plain')
  })

  it('renders null/undefined cells as empty', () => {
    expect(escapeCsvCell(null)).toBe('')
    expect(escapeCsvCell(undefined)).toBe('')
  })

  it('JSON-stringifies nested objects/arrays instead of [object Object]', () => {
    const csv = toCsv(['meta'], [[{ a: 1, b: [2, 3] }]])
    expect(csv).toBe('meta\n"{""a"":1,""b"":[2,3]}"')
  })

  it('supports a custom delimiter', () => {
    const csv = toCsv(['a', 'b'], [['x;y', 1]], { delimiter: ';' })
    expect(csv).toBe('a;b\n"x;y";1')
  })

  it('prepends a UTF-8 BOM when bom is true', () => {
    const csv = toCsv(['a'], [['é']], { bom: true })
    expect(csv.charCodeAt(0)).toBe(0xfeff)
    expect(csv.slice(1)).toBe('a\né')
  })
})
