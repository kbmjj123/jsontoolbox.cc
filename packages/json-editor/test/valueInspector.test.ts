import { describe, expect, it } from 'vitest'
import {
  inspectValue,
  isColorValue,
  isJwt,
  isTimestamp,
  isBase64,
  decodeJwt,
  formatTimestamps,
  decodeBase64,
  base64ByteLength,
  getColorStyle,
} from '../src/core/valueInspector'

describe('valueInspector (pure)', () => {
  it('recognizes hex / rgb / hsl colors', () => {
    expect(isColorValue('#fff')).toBe(true)
    expect(isColorValue('#0052d4')).toBe(true)
    expect(isColorValue('rgb(1, 2, 3)')).toBe(true)
    expect(isColorValue('hsl(120, 50%, 50%)')).toBe(true)
    expect(isColorValue('#zzz')).toBe(false)
    expect(getColorStyle('#0052d4')).toBe('#0052d4')
    expect(getColorStyle('nope')).toBeNull()
    expect(inspectValue('#ff0000')?.kind).toBe('color')
  })

  it('recognizes 10/13-digit epoch and ISO dates as timestamps', () => {
    expect(isTimestamp(1690000000)).toBe(true) // 10 digits → seconds
    expect(isTimestamp(1690000000000)).toBe(true) // 13 digits → ms
    expect(isTimestamp(123)).toBe(false)
    expect(isTimestamp('2026-10-12T08:30:00Z')).toBe(true)
    expect(inspectValue('2026-10-12T08:30:00Z')?.kind).toBe('timestamp')
    const views = formatTimestamps(1690000000000)
    expect(views?.iso).toBe('2023-07-22T04:26:40.000Z')
  })

  it('recognizes and decodes a JWT', () => {
    // header: {"alg":"HS256"}  payload: {"sub":"1","name":"Ada"}
    const jwt =
      'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIiwibmFtZSI6IkFkYSJ9.4jt1iRdzOTo'
    expect(isJwt(jwt)).toBe(true)
    const parts = decodeJwt(jwt)
    expect(parts?.header).toEqual({ alg: 'HS256' })
    expect(parts?.payload).toEqual({ sub: '1', name: 'Ada' })
    expect(inspectValue(jwt)?.kind).toBe('jwt')
  })

  it('recognizes Base64 and decodes text', () => {
    const b64 = btoa('hello world')
    expect(isBase64(b64)).toBe(true)
    expect(base64ByteLength(b64)).toBe(11)
    const decoded = decodeBase64(b64)
    expect(decoded?.kind).toBe('text')
    expect(decoded?.text).toBe('hello world')
    expect(inspectValue(b64)?.kind).toBe('base64')
  })

  it('detects an image from a Base64 payload', () => {
    // 1x1 transparent PNG.
    const png =
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
    const decoded = decodeBase64(png)
    expect(decoded?.kind).toBe('image')
    expect(decoded?.dataUrl).toMatch(/^data:image\/png;base64,/)
    expect(inspectValue(png)?.kind).toBe('base64')
  })

  it('returns null for plain strings and non-strings', () => {
    expect(inspectValue('just a normal string')).toBeNull()
    expect(inspectValue(42)).toBeNull()
    expect(inspectValue(null)).toBeNull()
    expect(inspectValue({})).toBeNull()
  })

  it('flags a Base64 data: URL as base64', () => {
    const url = 'data:image/png;base64,iVBORw0KGgo='
    expect(inspectValue(url)?.kind).toBe('base64')
  })
})
