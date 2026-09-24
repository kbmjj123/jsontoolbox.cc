/**
 * Smart JSON value type detection composable.
 *
 * - Basic detection (url / image / email / date / color) is defined here.
 * - Extended detection + decoders (JWT, Base64, timestamp, media) live in
 *   `~/utils/mediaPreview` and are imported here for the composable's return
 *   API. They are NOT re-exported, so the single source of truth for those
 *   symbols stays in `~/utils/mediaPreview` (avoids duplicate auto-imports).
 */

import {
  base64ByteLength,
  decodeBase64,
  decodeJwt,
  detectValueKind,
  formatTimestamps,
  getColorStyle,
  isColorValue,
  isImageUrl,
  isRemoteResource,
} from '~/utils/mediaPreview'

export interface DetectedType {
  path: string
  type: 'url' | 'image' | 'email' | 'date' | 'color'
  value: string
}

// ── General type patterns (basic detection) ──

const typePatterns: Record<string, RegExp> = {
  url: /^https?:\/\/[^\s]+$/i,
  image: /\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)(\?.*)?$/i,
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  date: /^\d{4}-\d{2}-\d{2}/,
  color: /^#([0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i,
}

const typeIcons: Record<string, string> = {
  url: 'lucide:link',
  image: 'lucide:image',
  email: 'lucide:mail',
  date: 'lucide:calendar',
  color: 'lucide:palette',
  // Extended kinds (P1-3 / P1-4)
  audio: 'lucide:music',
  video: 'lucide:video',
  pdf: 'lucide:file-text',
  timestamp: 'lucide:calendar',
  jwt: 'lucide:key',
  base64: 'lucide:binary',
  uuid: 'lucide:fingerprint',
  ip: 'lucide:globe',
  markdown: 'lucide:file-code',
  regex: 'lucide:regex',
}

/**
 * Detect basic smart type for a string value.
 * (For the finer-grained kinds — jwt/base64/timestamp/… use `detectValueKind`.)
 */
export function detectValueType(value: string): DetectedType['type'] | null {
  if (typeof value !== 'string') return null
  // Image check first (more specific than url)
  if (isImageUrl(value)) return 'image'
  if (isColorValue(value)) return 'color'
  for (const [type, pattern] of Object.entries(typePatterns)) {
    if (type === 'image' || type === 'color') continue // already checked above
    if (pattern.test(value)) return type as DetectedType['type']
  }
  return null
}

/**
 * Get icon for detected type
 */
export function getTypeIcon(type: string): string {
  return typeIcons[type] || 'lucide:tag'
}

/**
 * Traverse JSON and detect smart types in string values
 */
export function detectJsonTypes(jsonData: any, basePath = '$'): DetectedType[] {
  const types: DetectedType[] = []

  const traverse = (obj: any, path: string) => {
    if (typeof obj === 'string') {
      const type = detectValueType(obj)
      if (type) {
        types.push({ path, type, value: obj })
      }
    } else if (Array.isArray(obj)) {
      obj.forEach((item, i) => traverse(item, `${path}[${i}]`))
    } else if (typeof obj === 'object' && obj !== null) {
      Object.keys(obj).forEach(key => traverse(obj[key], `${path}.${key}`))
    }
  }

  traverse(jsonData, basePath)
  return types
}

/**
 * Vue composable for smart JSON value detection
 */
export function useSmartJsonValue(jsonData: MaybeRefOrGetter<any>) {
  const detectedTypes = computed<DetectedType[]>(() => {
    const data = toValue(jsonData)
    if (!data) return []
    try {
      return detectJsonTypes(data)
    } catch {
      return []
    }
  })

  return {
    detectedTypes,
    detectValueType,
    detectValueKind,
    getTypeIcon,
    isImageUrl,
    isColorValue,
    getColorStyle,
    decodeJwt,
    decodeBase64,
    formatTimestamps,
    base64ByteLength,
    isRemoteResource,
    typePatterns,
    typeIcons,
  }
}
