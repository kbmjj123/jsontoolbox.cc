// Sensitive field detection composable
// Scans JSON keys for sensitive keywords like password, token, api_key, etc.

const SENSITIVE_PATTERNS = [
  'password',
  'passwd',
  'secret',
  'token',
  'api_key',
  'apikey',
  'api-key',
  'access_token',
  'refresh_token',
  'auth_token',
  'private_key',
  'privatekey',
  'private-key',
  'credential',
  'authorization',
  'bearer',
  'session_id',
  'sessionid',
  'session-id',
  'ssn',
  'credit_card',
  'creditcard',
  'card_number',
  'cvv',
  'pin',
]

// Match patterns: exact match or contains (case-insensitive)
function isSensitiveKey(key: string): boolean {
  const lower = key.toLowerCase()
  return SENSITIVE_PATTERNS.some(pattern => {
    // Exact match
    if (lower === pattern) return true
    // Contains pattern as word boundary (e.g. "user_api_key" matches "api_key")
    if (lower.includes(pattern)) return true
    // Camel case split (e.g. "apiKey" matches "api_key")
    const camelSplit = lower.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase()
    if (camelSplit.includes(pattern)) return true
    return false
  })
}

export interface SensitiveField {
  path: string
  key: string
}

export function useSensitiveFieldDetection() {
  const detectedFields = ref<SensitiveField[]>([])
  const hasSensitiveFields = computed(() => detectedFields.value.length > 0)

  /**
   * Scan a parsed JSON value for sensitive field keys.
   * Only scans top 2 levels for performance.
   */
  function scan(value: unknown, basePath = ''): SensitiveField[] {
    const results: SensitiveField[] = []
    if (!value || typeof value !== 'object') return results

    if (Array.isArray(value)) {
      // Scan first item only for arrays
      if (value.length > 0 && typeof value[0] === 'object' && value[0] !== null) {
        results.push(...scanObject(value[0], `${basePath}[0]`, 0))
      }
    } else {
      results.push(...scanObject(value as Record<string, unknown>, basePath, 0))
    }

    return results
  }

  function scanObject(
    obj: Record<string, unknown>,
    basePath: string,
    depth: number
  ): SensitiveField[] {
    const results: SensitiveField[] = []
    if (depth >= 2) return results // Limit depth for performance

    for (const key of Object.keys(obj)) {
      const path = basePath ? `${basePath}.${key}` : key

      if (isSensitiveKey(key)) {
        results.push({ path, key })
      }

      // Recurse into nested objects (1 level deep)
      const val = obj[key]
      if (val && typeof val === 'object' && !Array.isArray(val) && depth < 1) {
        results.push(...scanObject(val as Record<string, unknown>, path, depth + 1))
      }
    }

    return results
  }

  /**
   * Scan a JSON string. Returns detected sensitive fields.
   */
  function scanJson(jsonString: string): SensitiveField[] {
    try {
      const parsed = JSON.parse(jsonString)
      const results = scan(parsed)
      detectedFields.value = results
      return results
    } catch {
      detectedFields.value = []
      return []
    }
  }

  /**
   * Clear detection results.
   */
  function clear() {
    detectedFields.value = []
  }

  return {
    detectedFields,
    hasSensitiveFields,
    scanJson,
    scan,
    clear,
  }
}
