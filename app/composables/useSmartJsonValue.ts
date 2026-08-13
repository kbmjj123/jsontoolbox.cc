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

const typePatterns: Record<string, RegExp> = {
  url: /^https?:\/\/[^\s]+$/i,
  image: /\.(jpg|jpeg|png|gif|webp|svg|bmp)(\?.*)?$/i,
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  date: /^\d{4}-\d{2}-\d{2}/,
  color: /^#([0-9a-f]{3}|[0-9a-f]{6})$/i,
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
 * @param value - String value to detect
 * @returns Detected type or null
 */
export function detectValueType(value: string): DetectedType['type'] | null {
  if (typeof value !== 'string') return null
  for (const [type, pattern] of Object.entries(typePatterns)) {
    if (pattern.test(value)) return type as DetectedType['type']
  }
  return null
}

/**
 * Get icon for detected type
 * @param type - Detected type
 * @returns Lucide icon name
 */
export function getTypeIcon(type: string): string {
  return typeIcons[type] || 'lucide:tag'
}

/**
 * Traverse JSON and detect smart types in string values
 * @param jsonData - Parsed JSON object
 * @param basePath - Base path prefix (default: '$')
 * @returns Array of detected types with paths
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
 * @param jsonData - Ref or getter for parsed JSON data
 * @returns Reactive detected types and helper functions
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
    typePatterns,
    typeIcons,
  }
}
