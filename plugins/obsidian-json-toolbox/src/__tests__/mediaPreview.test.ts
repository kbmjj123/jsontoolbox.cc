import { describe, it, expect } from 'vitest'
import {
  detectValueKind,
  decodeJwt,
  decodeBase64,
  formatTimestamps,
  isRemoteResource,
} from '../mediaPreview'

describe('detectValueKind', () => {
  it('detects colors', () => {
    expect(detectValueKind('#ff0000')).toBe('color')
    expect(detectValueKind('rgb(1,2,3)')).toBe('color')
  })
  it('detects image urls', () => {
    expect(detectValueKind('https://cdn.example.com/a.png')).toBe('image')
  })
  it('detects audio/video/pdf before generic url', () => {
    expect(detectValueKind('https://x.com/a.mp3')).toBe('audio')
    expect(detectValueKind('https://x.com/a.mp4')).toBe('video')
    expect(detectValueKind('https://x.com/a.pdf')).toBe('pdf')
  })
  it('detects jwt, uuid, email, ip', () => {
    expect(detectValueKind('a.b.c')).toBe('jwt')
    expect(detectValueKind('123e4567-e89b-12d3-a456-426614174000')).toBe('uuid')
    expect(detectValueKind('a@b.com')).toBe('email')
    expect(detectValueKind('192.168.1.1')).toBe('ip')
  })
  it('detects timestamps (epoch and ISO)', () => {
    expect(detectValueKind(1700000000)).toBe('timestamp')
    expect(detectValueKind('2023-11-14T22:13:20Z')).toBe('timestamp')
  })
  it('detects url, base64, markdown, regex', () => {
    expect(detectValueKind('https://example.com')).toBe('url')
    expect(detectValueKind('aGVsbG8gd29ybGQgd29ybGQ=')).toBe('base64')
    expect(detectValueKind('# Title\n\n**bold**')).toBe('markdown')
    expect(detectValueKind('/^abc$/gi')).toBe('regex')
  })
  it('returns null for plain strings', () => {
    expect(detectValueKind('hello')).toBeNull()
  })
})

describe('decodeJwt', () => {
  it('decodes header and payload', () => {
    const header = btoa(JSON.stringify({ alg: 'HS256' }))
    const payload = btoa(JSON.stringify({ sub: '123' }))
    const jwt = `${header}.${payload}.sig`
    const parts = decodeJwt(jwt)
    expect(parts).not.toBeNull()
    expect(parts!.payload).toEqual({ sub: '123' })
  })
})

describe('decodeBase64', () => {
  it('decodes plain base64 to text', () => {
    const decoded = decodeBase64(btoa('hello world'))
    expect(decoded?.kind).toBe('text')
    expect(decoded?.text).toBe('hello world')
  })
})

describe('formatTimestamps', () => {
  it('formats epoch seconds', () => {
    expect(formatTimestamps(1700000000)?.iso).toBe('2023-11-14T22:13:20.000Z')
  })
})

describe('isRemoteResource', () => {
  it('flags remote kinds only', () => {
    expect(isRemoteResource('image')).toBe(true)
    expect(isRemoteResource('color')).toBe(false)
  })
})
