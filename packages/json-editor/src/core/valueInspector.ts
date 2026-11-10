/**
 * Pure value recognition for the JSON value inspector.
 *
 * Framework-free (no Vue, no DOM beyond standard `atob` / `TextDecoder` /
 * `Date`, all available in browsers and modern Node). This is the canonical
 * home for the value kinds the package understands: `color`, `timestamp`,
 * `jwt`, `base64`, `image`, `audio`, `video`, `pdf`, `url`, `email`, `uuid`,
 * `ip`, `markdown`, `regex`.
 *
 * Deliberately *not* here (they stay site-side or are rendered in the Vue
 * layer on top of the recognition exported below): the rich Markdown renderer
 * (`marked` + `DOMPurify`), the image lightbox UI, and the data-URI modal.
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

const ISO_DATE_RE =
  /^\d{4}-\d{2}-\d{2}([T ]\d{2}:\d{2}(:\d{2})?(\.\d+)?(Z|[+-]\d{2}:?\d{2})?)?$/

export function isTimestamp(value: unknown): boolean {
  if (typeof value === 'number') return isTimestampNumber(value)
  if (typeof value !== 'string') return false
  const v = value.trim()
  if (!v) return false
  if (/^\d{10}$/.test(v) || /^\d{13}$/.test(v)) return true
  if (!ISO_DATE_RE.test(v)) return false
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
  if (/^data:([a-z0-9-+/]+\/[^;,]+)?(;base64)?,/i.test(value)) return true
  const v = value.trim()
  return v.length >= 16 && v.length % 4 === 0 && BASE64_RE.test(v)
}

/** Approximate decoded size, used to gate eager decoding. */
export function base64ByteLength(value: string): number {
  const cleaned = value
    .replace(/^data:[^,]*,/i, '')
    .replace(/^data:[^;]*;base64,/i, '')
    .replace(/=+$/, '')
  return Math.floor((cleaned.length * 3) / 4)
}

export function sniffImageMime(binary: string): string | null {
  if (binary.charCodeAt(0) === 0x89 && binary.charCodeAt(1) === 0x50) return 'image/png'
  if (binary.charCodeAt(0) === 0xff && binary.charCodeAt(1) === 0xd8) return 'image/jpeg'
  if (binary.startsWith('GIF8')) return 'image/gif'
  if (binary.startsWith('RIFF') && binary.includes('WEBP')) return 'image/webp'
  if (binary.startsWith('<?xml') || binary.includes('<svg')) return 'image/svg+xml'
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
      // Any image data URI — base64 or not — is a valid <img> source as-is.
      // Resolve this before attempting to decode, since non-base64 payloads
      // (e.g. URL-encoded SVG) would throw in `atob` below.
      if (mime.startsWith('image/')) return { kind: 'image', dataUrl: value, bytes }
      const payload = value.slice(value.indexOf(',') + 1)
      const binary = atob(payload)
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

// ── Image / media URL detection ───────────────────────────────

const IMAGE_EXTENSIONS = /\.(jpe?g|png|gif|webp|svg|avif|bmp|ico)(\?.*)?$/i
const IMAGE_HOSTS = /cdn\.|img\.|image\.|media\.|images\./i
const IMAGE_PATHNAME = /\/image[s]?\//i
const AUDIO_EXT = /\.(mp3|wav|ogg|oga|m4a|flac|aac|opus|weba)(\?.*)?$/i
const VIDEO_EXT = /\.(mp4|webm|ogv|mov|m4v|mkv)(\?.*)?$/i
const PDF_EXT = /\.pdf(\?.*)?$/i

export function isImageUrl(value: unknown): boolean {
  if (typeof value !== 'string') return false
  if (value.length > 2048) return false
  if (IMAGE_EXTENSIONS.test(value)) return true
  try {
    const url = new URL(value)
    if (IMAGE_HOSTS.test(url.hostname)) return true
    if (IMAGE_PATHNAME.test(url.pathname)) return true
  } catch {
    if (/^[/.]/.test(value) && IMAGE_EXTENSIONS.test(value)) return true
  }
  return false
}

export function isAudioUrl(value: unknown): boolean {
  return typeof value === 'string' && AUDIO_EXT.test(value)
}

export function isVideoUrl(value: unknown): boolean {
  return typeof value === 'string' && VIDEO_EXT.test(value)
}

export function isPdfUrl(value: unknown): boolean {
  return typeof value === 'string' && PDF_EXT.test(value)
}

// ── Plain string kinds ────────────────────────────────────────

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const IPV4_RE = /^(25[0-5]|2[0-4]\d|1?\d?\d)(\.(25[0-5]|2[0-4]\d|1?\d?\d)){3}$/
const MARKDOWN_RE = /(^|\n)#{1,6}\s|\*\*[^*\n]+\*\*|```|(?:\n|^)\s*[-*]\s/
const REGEX_RE = /^\/.*\/[gimsuy]*$/

export function isUuid(value: unknown): boolean {
  return typeof value === 'string' && UUID_RE.test(value.trim())
}

export function isEmail(value: unknown): boolean {
  return typeof value === 'string' && EMAIL_RE.test(value.trim())
}

export function isIp(value: unknown): boolean {
  return typeof value === 'string' && IPV4_RE.test(value.trim())
}

export function isHttpUrl(value: unknown): boolean {
  return typeof value === 'string' && /^https?:\/\/[^\s]+$/i.test(value)
}

export function isMarkdown(value: unknown): boolean {
  return typeof value === 'string' && MARKDOWN_RE.test(value)
}

export function isRegex(value: unknown): boolean {
  return typeof value === 'string' && REGEX_RE.test(value.trim())
}

// ── Unified inspector ──────────────────────────────────────────

export type ValueInsightKind =
  | 'color'
  | 'timestamp'
  | 'jwt'
  | 'base64'
  | 'image'
  | 'audio'
  | 'video'
  | 'pdf'
  | 'url'
  | 'email'
  | 'uuid'
  | 'ip'
  | 'markdown'
  | 'regex'

/** Never run full detection on absurdly large strings. */
export const MAX_DETECT_LENGTH = 100_000

export type ValueInsight =
  | { kind: 'color'; value: string; css: string }
  | { kind: 'timestamp'; views: TimestampViews }
  | { kind: 'jwt'; header: unknown; payload: unknown }
  | { kind: 'base64'; bytes: number; image: boolean; remote: boolean; text?: string; dataUrl?: string }
  | { kind: 'image'; url: string; remote: boolean }
  | { kind: 'audio'; url: string }
  | { kind: 'video'; url: string }
  | { kind: 'pdf'; url: string }
  | { kind: 'url'; url: string }
  | { kind: 'email'; value: string }
  | { kind: 'uuid'; value: string }
  | { kind: 'ip'; value: string }
  | { kind: 'markdown'; text: string }
  | { kind: 'regex'; source: string }

/**
 * Recognize a leaf string (or number) value as one of the inspector kinds.
 * Ordered most-specific first; returns `null` for anything else.
 *
 * Detection is conservative: a wrong guess renders a misleading preview, so each
 * matcher is narrow. `remote` flags kinds that may fetch a third-party resource
 * (image / media URLs) so the UI can gate them behind a user option.
 */
export function inspectValue(value: unknown): ValueInsight | null {
  if (typeof value === 'number') {
    if (isTimestamp(value)) {
      const views = formatTimestamps(value)
      if (views) return { kind: 'timestamp', views }
    }
    return null
  }
  if (typeof value !== 'string') return null

  // Huge strings: skip full detection but still surface Base64 blobs (e.g. a
  // large inline image) without decoding them eagerly.
  if (value.length > MAX_DETECT_LENGTH) {
    if (isBase64(value)) {
      const isImage = /^data:image\//i.test(value)
      return { kind: 'base64', bytes: base64ByteLength(value), image: isImage, remote: false }
    }
    return null
  }

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
        remote: false,
        text: decoded.text,
        dataUrl: decoded.dataUrl,
      }
    }
  }

  if (isImageUrl(value)) return { kind: 'image', url: value, remote: true }
  if (isAudioUrl(value)) return { kind: 'audio', url: value }
  if (isVideoUrl(value)) return { kind: 'video', url: value }
  if (isPdfUrl(value)) return { kind: 'pdf', url: value }
  if (isEmail(value)) return { kind: 'email', value: value.trim() }
  if (isUuid(value)) return { kind: 'uuid', value: value.trim() }
  if (isIp(value)) return { kind: 'ip', value: value.trim() }
  if (isHttpUrl(value)) return { kind: 'url', url: value }
  if (isMarkdown(value)) return { kind: 'markdown', text: value }
  if (isRegex(value)) return { kind: 'regex', source: value.trim() }

  return null
}
