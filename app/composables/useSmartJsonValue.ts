/**
 * Smart JSON value type detection composable
 * Detects URLs, images, emails, dates, colors in JSON string values
 * Useful for enhanced visualization in editors and viewers
 */

export interface DetectedType {
  path: string
  type: 'url' | 'image' | 'email' | 'date' | 'color'
  value: string
}

// ── Image detection patterns (merged from TreeNode) ──

const IMAGE_EXTENSIONS = /\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)(\?.*)?$/i
const IMAGE_HOSTS = /cdn\.|img\.|image\.|media\./i
const IMAGE_PATHNAME = /\/image[s]?\//i

/**
 * Check if a string value is a confident image URL (has extension or known host)
 */
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
 * Check if a value could possibly be an image URL (any HTTP/HTTPS URL).
 * Use with <img @error> to hide failed previews.
 */
export function isPossibleImageUrl(value: unknown): boolean {
  if (typeof value !== 'string') return false
  if (value.length > 2048) return false
  return /^https?:\/\/[^\s]+$/i.test(value)
}

// ── Color detection patterns ──

const HEX_COLOR = /^#([0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i
const RGB_COLOR = /^rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}/i
const HSL_COLOR = /^hsla?\(\s*\d{1,3}\s*,\s*\d{1,3}%?\s*,\s*\d{1,3}%?/i

/**
 * Check if a string value is a CSS color
 */
export function isColorValue(value: unknown): boolean {
  if (typeof value !== 'string') return false
  return HEX_COLOR.test(value) || RGB_COLOR.test(value) || HSL_COLOR.test(value)
}

/**
 * Get a CSS color string safe for inline style binding.
 * Returns the value as-is if it looks like a valid CSS color.
 */
export function getColorStyle(value: string): string | null {
  if (!isColorValue(value)) return null
  return value
}

// ── General type patterns ──

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
}

/**
 * Detect smart type for a string value
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
    getTypeIcon,
    isImageUrl,
    isColorValue,
    getColorStyle,
    typePatterns,
    typeIcons,
  }
}
