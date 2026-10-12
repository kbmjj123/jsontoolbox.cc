/**
 * Pure value recognition for the JSON value inspector.
 *
 * Framework-free (no Vue, no DOM beyond standard `atob` / `TextDecoder` /
 * `Date`, all available in browsers and modern Node). This is the canonical
 * home for the four kinds the unification plan (P3-7) moves into the package:
 * `color`, `timestamp`, `jwt`, `base64`.
 *
 * Deliberately *not* here (they stay site-side): Markdown rendering
 * (`marked` + `DOMPurify`), the image lightbox, and the data-URI modal. The
 * site may render richer previews on top of the recognition exported below.
 */

// ── Color ──────────────────────────────────────────────────────

const HEX_COLOR = /^#([0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i
const RGB_COLOR = /^rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}/i
const HSL_COLOR = /^hsla?\(\s*\d{1,3}\s*,\s*\d{1,3}%?\s*,\s*\d{1,3}%?/i

export function isColorValue(value: unknown): value is string {
  if (typeof value !== 'string') return false
  return HEX_COLOR.test(value) || RGB_COLOR.test(value) || HSL_COLOR.test(value)
}

/** A CSS color string safe for an inline `style` binding, or `null`. */
export function getColorStyle(value: string): string | null {
  return isColorValue(value) ? value : null
}

// ── JWT ────────────────────────────────────────────────────────

const JWT_RE = /^[\w-]+\.[\w-]+\.[\w-]*$/

export function isJwt(value: unknown): boolean {
  if (typeof value !== 'string') return false
  const v = value.trim()
  return JWT_RE.test(v) && v.split('.').length === 3
}

function base64UrlDecode(segment: string): string {
  const b64 = segment.replace(/-/g, '+').replace(/_/g, '/')
  const pad = b64.length % 4 === 0 ? '' : '='.repeat(4 - (b64.length % 4))
  const binary = atob(b64 + pad)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return new TextDecoder().decode(bytes)
}

export interface JwtParts {
  header: unknown
  payload: unknown
}

export function decodeJwt(value: string): JwtParts | null {
  const parts = value.trim().split('.')
  if (parts.length !== 3) return null
  try {
    return {
      header: JSON.parse(base64UrlDecode(parts[0])),
      payload: JSON.parse(base64UrlDecode(parts[1])),
    }
  } catch {
    return null
  }
}

// ── Timestamp ─────────────────────────────────────────────────

function isTimestampNumber(value: number): boolean {
  const digits = Math.abs(value).toString().length
  return digits === 10 || digits === 13
}

export function isTimestamp(value: unknown): boolean {
  if (typeof value === 'number') return isTimestampNumber(value)
  if (typeof value !== 'string') return false
  const v = value.trim()
  if (!v) return false
  if (/^\d{10}$/.test(v) || /^\d{13}$/.test(v)) return true
  if (!/^\d{4}-\d{2}-\d{2}([T ]\d{2}:\d{2}(:\d{2})?(\.\d+)?(Z|[+-]\d{2}:?\d{2})?)?$/.test(v)) {
    return false
  }
  return !Number.isNaN(Date.parse(v))
}

export interface TimestampViews {
  local: string
  utc: string
  iso: string
}

export function formatTimestamps(value: string | number): TimestampViews | null {
  let ms: number
  if (typeof value === 'number') {
    ms = isTimestampNumber(value) && Math.abs(value).toString().length === 10 ? value * 1000 : value
  } else {
    const trimmed = value.trim()
    if (/^\d{10}$/.test(trimmed)) ms = Number(trimmed) * 1000
    else if (/^\d{13}$/.test(trimmed)) ms = Number(trimmed)
    else {
      const parsed = Date.parse(trimmed)
      if (Number.isNaN(parsed)) return null
      ms = parsed
    }
  }
  const date = new Date(ms)
  if (Number.isNaN(date.getTime())) return null
  return {
    local: date.toLocaleString(),
    utc: date.toUTCString(),
    iso: date.toISOString(),
  }
}

// ── Base64 ────────────────────────────────────────────────────

const BASE64_RE = /^[A-Za-z0-9+/]+={0,2}$/

/** Accepts plain Base64 and `data:` URLs (e.g. inline images). */
export function isBase64(value: unknown): boolean {
  if (typeof value !== 'string') return false
  if (/^data:[a-z0-9-+/]+\/[^;,]+;base64,/i.test(value)) return true
  const v = value.trim()
  return v.length >= 16 && v.length % 4 === 0 && BASE64_RE.test(v)
}

/** Approximate decoded size, used to gate eager decoding. */
export function base64ByteLength(value: string): number {
  const cleaned = value.replace(/^data:[^,]*,/i, '').replace(/=+$/, '')
  return Math.floor((cleaned.length * 3) / 4)
}

export function sniffImageMime(binary: string): string | null {
  if (binary.charCodeAt(0) === 0x89 && binary.charCodeAt(1) === 0x50) return 'image/png'
  if (binary.charCodeAt(0) === 0xff && binary.charCodeAt(1) === 0xd8) return 'image/jpeg'
  if (binary.startsWith('GIF8')) return 'image/gif'
  if (binary.startsWith('RIFF') && binary.includes('WEBP')) return 'image/webp'
  if (/^\s*<svg|^\s*<\?xml/i.test(binary)) return 'image/svg+xml'
  return null
}

export interface DecodedBase64 {
  kind: 'image' | 'text'
  /** Only set for `image` — a data: URL safe to bind to `<img src>`. */
  dataUrl?: string
  text?: string
  bytes: number
}

export function decodeBase64(value: string): DecodedBase64 | null {
  try {
    const bytes = base64ByteLength(value)
    const dataUrlMatch = /^data:([^;,]+)[;,]/i.exec(value)
    if (dataUrlMatch) {
      const mime = dataUrlMatch[1]
      const payload = value.slice(value.indexOf(',') + 1)
      const binary = atob(payload)
      if (mime.startsWith('image/')) return { kind: 'image', dataUrl: value, bytes }
      return { kind: 'text', text: binary, bytes }
    }
    const binary = atob(value)
    const mime = sniffImageMime(binary)
    if (mime) return { kind: 'image', dataUrl: `data:${mime};base64,${value}`, bytes }
    return { kind: 'text', text: binary, bytes }
  } catch {
    return null
  }
}

// ── Unified inspector ──────────────────────────────────────────

export type ValueInsightKind = 'color' | 'timestamp' | 'jwt' | 'base64'

/** Never run detection on absurdly large strings. */
const MAX_DETECT_LENGTH = 100_000

export type ValueInsight =
  | { kind: 'color'; value: string; css: string }
  | { kind: 'timestamp'; views: TimestampViews }
  | { kind: 'jwt'; header: unknown; payload: unknown }
  | { kind: 'base64'; bytes: number; image: boolean; text?: string; dataUrl?: string }

/**
 * Recognize a leaf string value as one of the four inspector kinds.
 * Ordered most-specific first; returns `null` for anything else.
 */
export function inspectValue(value: unknown): ValueInsight | null {
  if (typeof value !== 'string' || value.length > MAX_DETECT_LENGTH) return null

  if (isColorValue(value)) return { kind: 'color', value, css: value }

  if (isJwt(value)) {
    const parts = decodeJwt(value)
    if (parts) return { kind: 'jwt', header: parts.header, payload: parts.payload }
  }

  if (isTimestamp(value)) {
    const views = formatTimestamps(value)
    if (views) return { kind: 'timestamp', views }
  }

  if (isBase64(value)) {
    const decoded = decodeBase64(value)
    if (decoded) {
      return {
        kind: 'base64',
        bytes: decoded.bytes,
        image: decoded.kind === 'image',
        text: decoded.text,
        dataUrl: decoded.dataUrl,
      }
    }
  }

  return null
}
