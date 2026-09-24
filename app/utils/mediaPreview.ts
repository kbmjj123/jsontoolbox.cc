/**
 * Extended JSON value type detection + decoders.
 *
 * Shared by the value inspector (P1-3/P1-4). Detection is deliberately
 * conservative: a wrong guess would render a misleading preview, so each
 * matcher is narrow and ordered from most specific to least specific.
 */
/**
 * Primitives live here (not in the composable) so this module stays free of
 * Vue/composable imports — `useSmartJsonValue` re-exports them as the single
 * public entry point, which keeps every existing import path working.
 */

// ── Color detection ────────────────────────────────────────────

const HEX_COLOR = /^#([0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i
const RGB_COLOR = /^rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}/i
const HSL_COLOR = /^hsla?\(\s*\d{1,3}\s*,\s*\d{1,3}%?\s*,\s*\d{1,3}%?/i

export function isColorValue(value: unknown): boolean {
  if (typeof value !== 'string') return false
  return HEX_COLOR.test(value) || RGB_COLOR.test(value) || HSL_COLOR.test(value)
}

/** Get a CSS color string safe for inline style binding. */
export function getColorStyle(value: string): string | null {
  if (!isColorValue(value)) return null
  return value
}

// ── Image detection ────────────────────────────────────────────

const IMAGE_EXTENSIONS = /\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)(\?.*)?$/i
const IMAGE_HOSTS = /cdn\.|img\.|image\.|media\./i
const IMAGE_PATHNAME = /\/image[s]?\//i

/** Confident image URL (has an image extension or a known image host/path). */
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

/**
 * Any HTTP(S) URL that could be an image. Pair with `<img @error>` so failed
 * previews hide themselves.
 */
export function isPossibleImageUrl(value: unknown): boolean {
  if (typeof value !== 'string') return false
  if (value.length > 2048) return false
  return /^https?:\/\/[^\s]+$/i.test(value)
}

export type ValueKind =
  | 'image'
  | 'audio'
  | 'video'
  | 'pdf'
  | 'url'
  | 'email'
  | 'color'
  | 'timestamp'
  | 'jwt'
  | 'base64'
  | 'uuid'
  | 'ip'
  | 'markdown'
  | 'regex'

/** Decoded Base64 above this size must be decoded on demand, not eagerly. */
export const BASE64_AUTO_DECODE_LIMIT = 1024 * 1024

/** Never run detection on absurdly large strings. */
const MAX_DETECT_LENGTH = 100_000

const AUDIO_EXT = /\.(mp3|wav|ogg|oga|m4a|flac|aac|opus|weba)(\?.*)?$/i
const VIDEO_EXT = /\.(mp4|webm|ogv|mov|m4v)(\?.*)?$/i
const PDF_EXT = /\.pdf(\?.*)?$/i
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const IPV4_RE = /^(25[0-5]|2[0-4]\d|1?\d?\d)(\.(25[0-5]|2[0-4]\d|1?\d?\d)){3}$/
const JWT_RE = /^[\w-]+\.[\w-]+\.[\w-]*$/
const ISO_DATE_RE =
  /^\d{4}-\d{2}-\d{2}([T ]\d{2}:\d{2}(:\d{2})?(\.\d+)?(Z|[+-]\d{2}:?\d{2})?)?$/
const BASE64_RE = /^[A-Za-z0-9+/]+={0,2}$/
const MARKDOWN_RE = /(^|\n)#{1,6}\s|\*\*[^*\n]+\*\*|```|(?:\n|^)\s*[-*]\s/
const REGEX_RE = /^\/.*\/[gimsuy]*$/

function isTimestampNumber(value: number): boolean {
  const digits = Math.abs(value).toString().length
  return digits === 10 || digits === 13
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

// ── Individual predicates (each usable on its own) ──────────────

export function isAudioUrl(value: unknown): boolean {
  return AUDIO_EXT.test(asString(value))
}

export function isVideoUrl(value: unknown): boolean {
  return VIDEO_EXT.test(asString(value))
}

export function isPdfUrl(value: unknown): boolean {
  return PDF_EXT.test(asString(value))
}

export function isUuid(value: unknown): boolean {
  return UUID_RE.test(asString(value))
}

export function isEmail(value: unknown): boolean {
  return EMAIL_RE.test(asString(value))
}

export function isIp(value: unknown): boolean {
  return IPV4_RE.test(asString(value))
}

export function isJwt(value: unknown): boolean {
  const v = asString(value)
  return JWT_RE.test(v) && v.split('.').length === 3
}

/** 10/13-digit epoch, an ISO date string, or a numeric epoch. */
export function isTimestamp(value: unknown): boolean {
  if (typeof value === 'number') return isTimestampNumber(value)
  const v = asString(value)
  if (!v) return false
  if (/^\d{10}$/.test(v) || /^\d{13}$/.test(v)) return true
  if (!ISO_DATE_RE.test(v)) return false
  return !Number.isNaN(Date.parse(v))
}

/** Accepts plain Base64 and `data:` URLs (e.g. inline images). */
export function isBase64(value: unknown): boolean {
  const raw = typeof value === 'string' ? value : ''
  if (/^data:[a-z0-9-+/]+\/[^;,]+;base64,/i.test(raw)) return true
  const v = raw.trim()
  return v.length >= 16 && v.length % 4 === 0 && BASE64_RE.test(v)
}

export function isMarkdown(value: unknown): boolean {
  return typeof value === 'string' && MARKDOWN_RE.test(value)
}

export function isRegex(value: unknown): boolean {
  return REGEX_RE.test(asString(value))
}

export function isHttpUrl(value: unknown): boolean {
  return /^https?:\/\/[^\s]+$/i.test(asString(value))
}

/**
 * Fine-grained value detection, ordered from most specific to least specific
 * so a narrower match (e.g. `.pdf`) always wins over a broader one (`url`).
 */
export function detectValueKind(value: unknown): ValueKind | null {
  if (typeof value === 'string' && value.length > MAX_DETECT_LENGTH) return null

  if (isColorValue(value)) return 'color'
  if (isAudioUrl(value)) return 'audio'
  if (isVideoUrl(value)) return 'video'
  if (isPdfUrl(value)) return 'pdf'
  if (isJwt(value)) return 'jwt'
  if (isUuid(value)) return 'uuid'
  if (isEmail(value)) return 'email'
  if (isIp(value)) return 'ip'
  if (isImageUrl(value)) return 'image'
  if (isTimestamp(value)) return 'timestamp'
  if (isHttpUrl(value)) return 'url'
  if (isBase64(value)) return 'base64'
  if (isMarkdown(value)) return 'markdown'
  if (isRegex(value)) return 'regex'
  return null
}

/** Alias matching the upgrade plan's naming. */
export const detectExtended = detectValueKind

/**
 * Kinds whose preview fetches a remote URL, so the UI must warn that a
 * third-party request will leave the browser.
 */
export function isRemoteResource(kind: ValueKind | null): boolean {
  return kind === 'image' || kind === 'audio' || kind === 'video' || kind === 'pdf'
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// ── JWT ────────────────────────────────────────────────────────

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

// ── Base64 ─────────────────────────────────────────────────────

/** Approximate decoded size, used to gate eager decoding. */
export function base64ByteLength(value: string): number {
  const cleaned = value.replace(/^data:[^,]*,/i, '').replace(/=+$/, '')
  return Math.floor((cleaned.length * 3) / 4)
}

export interface DecodedBase64 {
  kind: 'image' | 'text'
  /** Only set for `image` — a data: URL safe to bind to <img src>. */
  dataUrl?: string
  text?: string
  bytes: number
}

function sniffImageMime(binary: string): string | null {
  if (binary.startsWith('\u0089PNG')) return 'image/png'
  if (binary.charCodeAt(0) === 0xff && binary.charCodeAt(1) === 0xd8) return 'image/jpeg'
  if (binary.startsWith('GIF8')) return 'image/gif'
  if (binary.startsWith('RIFF') && binary.includes('WEBP')) return 'image/webp'
  if (/^\s*<svg|^\s*<\?xml/i.test(binary)) return 'image/svg+xml'
  return null
}

export function decodeBase64(value: string): DecodedBase64 | null {
  try {
    const bytes = base64ByteLength(value)
    const dataUrlMatch = /^data:([^;,]+)[;,]/i.exec(value)
    if (dataUrlMatch) {
      const mime = dataUrlMatch[1]
      const payload = value.slice(value.indexOf(',') + 1)
      const binary = atob(payload)
      if (mime.startsWith('image/')) {
        return { kind: 'image', dataUrl: value, bytes }
      }
      return { kind: 'text', text: binary, bytes }
    }
    const binary = atob(value)
    const mime = sniffImageMime(binary)
    if (mime) {
      return { kind: 'image', dataUrl: `data:${mime};base64,${value}`, bytes }
    }
    return { kind: 'text', text: binary, bytes }
  } catch {
    return null
  }
}

// ── Timestamps ─────────────────────────────────────────────────

export interface TimestampViews {
  local: string
  utc: string
  iso: string
}

export function formatTimestamps(value: string | number): TimestampViews | null {
  let ms: number
  if (typeof value === 'number') {
    ms = Math.abs(value).toString().length === 10 ? value * 1000 : value
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

/** Truncate very long values so the inspector header stays readable. */
export function truncate(value: string, max = 160): string {
  return value.length > max ? `${value.slice(0, max)}…` : value
}
