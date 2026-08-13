/**
 * JSON Parser Composable
 * Enhanced JSON parsing with BigInt support and error handling
 * Reusable for all tools that parse JSON
 */
export const useJsonParser = () => {
  /**
   * Parse JSON with optional BigInt support
   * @param text - JSON string to parse
   * @param options - Parse options
   * @returns Parsed data
   */
  const parseJson = (
    text: string,
    options: {
      bigInt?: boolean // Use BigInt for large numbers
    } = {}
  ): { data: any; error: string | null } => {
    const { bigInt = false } = options

    try {
      if (bigInt) {
        // Use regex to convert large numbers to BigInt strings
        const processed = text.replace(
          /:\s*(-?\d{16,})/g,
          ':"$1n"'
        )
        const data = JSON.parse(processed)

        // Convert BigInt strings back to actual BigInt
        const restoreBigInt = (obj: any): any => {
          if (typeof obj === 'string' && obj.endsWith('n') && /^\-?\d+n$/.test(obj)) {
            return BigInt(obj.slice(0, -1))
          }
          if (Array.isArray(obj)) {
            return obj.map(restoreBigInt)
          }
          if (typeof obj === 'object' && obj !== null) {
            const result: Record<string, any> = {}
            for (const key in obj) {
              result[key] = restoreBigInt(obj[key])
            }
            return result
          }
          return obj
        }

        return { data: restoreBigInt(data), error: null }
      }

      return { data: JSON.parse(text), error: null }
    } catch (e) {
      return { data: null, error: (e as Error).message }
    }
  }

  /**
   * Check if text contains large numbers
   * @param text - JSON string to check
   * @returns true if large numbers detected
   */
  const hasLargeNumbers = (text: string): boolean => {
    return /:\s*-?\d{16,}/.test(text)
  }

  /**
   * Get error location (line, column)
   * @param text - JSON string
   * @param error - Error message
   * @returns Line and column info
   */
  const getErrorLocation = (
    text: string,
    error: string
  ): { line: number; column: number } | null => {
    const match = error.match(/position (\d+)/)
    if (!match) return null

    const pos = parseInt(match[1])
    const lines = text.substring(0, pos).split('\n')
    return {
      line: lines.length,
      column: lines[lines.length - 1].length + 1
    }
  }

  /**
   * Validate JSON without parsing
   * @param text - JSON string to validate
   * @returns Validation result
   */
  const validateJson = (text: string): { valid: boolean; error: string | null } => {
    try {
      JSON.parse(text)
      return { valid: true, error: null }
    } catch (e) {
      return { valid: false, error: (e as Error).message }
    }
  }

  return {
    parseJson,
    hasLargeNumbers,
    getErrorLocation,
    validateJson
  }
}
