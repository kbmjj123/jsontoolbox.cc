/**
 * JSON Flatten Composable
 * Flatten nested JSON objects into flat key-value pairs
 * Reusable for CSV, Excel, and other export tools
 */
export const useJsonFlatten = () => {
  /**
   * Flatten a single object
   * @param obj - The object to flatten
   * @param prefix - Prefix for nested keys
   * @param delimiter - Separator for nested keys (default: '.')
   * @returns Flattened object
   */
  const flattenObject = (
    obj: Record<string, any>,
    prefix: string = '',
    delimiter: string = '.'
  ): Record<string, any> => {
    const result: Record<string, any> = {}

    for (const key in obj) {
      if (!Object.prototype.hasOwnProperty.call(obj, key)) continue

      const value = obj[key]
      const newKey = prefix ? `${prefix}${delimiter}${key}` : key

      if (value === null || value === undefined) {
        result[newKey] = value
      } else if (Array.isArray(value)) {
        // Handle arrays: convert to JSON string or flatten
        if (value.length > 0 && typeof value[0] === 'object') {
          // Array of objects: flatten each and index
          value.forEach((item, index) => {
            if (typeof item === 'object' && item !== null) {
              Object.assign(result, flattenObject(item, `${newKey}${delimiter}${index}`, delimiter))
            } else {
              result[`${newKey}${delimiter}${index}`] = item
            }
          })
        } else {
          // Array of primitives: convert to JSON string
          result[newKey] = JSON.stringify(value)
        }
      } else if (typeof value === 'object') {
        // Nested object: recurse
        Object.assign(result, flattenObject(value, newKey, delimiter))
      } else {
        // Primitive value
        result[newKey] = value
      }
    }

    return result
  }

  /**
   * Flatten an array of objects
   * @param data - Array of objects to flatten
   * @param delimiter - Separator for nested keys (default: '.')
   * @returns Flattened array
   */
  const flattenArray = (
    data: Record<string, any>[],
    delimiter: string = '.'
  ): Record<string, any>[] => {
    return data.map(item => flattenObject(item, '', delimiter))
  }

  /**
   * Get all unique keys from flattened data
   * @param data - Array of flattened objects
   * @returns Array of unique keys
   */
  const getFlattenedKeys = (data: Record<string, any>[]): string[] => {
    const keySet = new Set<string>()
    data.forEach(item => {
      Object.keys(item).forEach(key => keySet.add(key))
    })
    return Array.from(keySet)
  }

  /**
   * Check if data contains nested objects
   * @param data - Array of objects
   * @returns true if any object has nested properties
   */
  const hasNestedObjects = (data: Record<string, any>[]): boolean => {
    return data.some(item => {
      return Object.values(item).some(
        value => typeof value === 'object' && value !== null && !Array.isArray(value)
      )
    })
  }

  /**
   * Get nesting depth of an object
   * @param obj - Object to check
   * @returns Maximum nesting depth
   */
  const getNestingDepth = (obj: Record<string, any>, current: number = 0): number => {
    let maxDepth = current

    for (const value of Object.values(obj)) {
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        const depth = getNestingDepth(value, current + 1)
        maxDepth = Math.max(maxDepth, depth)
      }
    }

    return maxDepth
  }

  return {
    flattenObject,
    flattenArray,
    getFlattenedKeys,
    hasNestedObjects,
    getNestingDepth
  }
}
