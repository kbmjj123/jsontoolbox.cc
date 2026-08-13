/**
 * Field Selector Composable
 * Allow users to select which fields to export
 * Reusable for CSV, Excel, and other export tools
 */
export const useFieldSelector = () => {
  /**
   * Extract all unique field paths from data
   * @param data - Array of objects
   * @param delimiter - Delimiter for nested keys (default: '.')
   * @returns Array of field paths
   */
  const extractFieldPaths = (
    data: Record<string, any>[],
    delimiter: string = '.'
  ): string[] => {
    const fieldSet = new Set<string>()

    const traverse = (obj: Record<string, any>, prefix: string = '') => {
      for (const key in obj) {
        if (!Object.prototype.hasOwnProperty.call(obj, key)) continue

        const value = obj[key]
        const fieldPath = prefix ? `${prefix}${delimiter}${key}` : key

        if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
          traverse(value, fieldPath)
        } else {
          fieldSet.add(fieldPath)
        }
      }
    }

    data.forEach(item => traverse(item))
    return Array.from(fieldSet)
  }

  /**
   * Get field statistics
   * @param data - Array of objects
   * @param fieldPath - Dot-notation field path
   * @returns Field statistics
   */
  const getFieldStats = (
    data: Record<string, any>[],
    fieldPath: string
  ): {
    total: number
    filled: number
    empty: number
    fillRate: number
  } => {
    const total = data.length
    let filled = 0

    data.forEach(item => {
      const value = getNestedValue(item, fieldPath)
      if (value !== null && value !== undefined && value !== '') {
        filled++
      }
    })

    return {
      total,
      filled,
      empty: total - filled,
      fillRate: total > 0 ? filled / total : 0
    }
  }

  /**
   * Get nested value by dot-notation path
   * @param obj - Object to traverse
   * @param path - Dot-notation path
   * @returns Value at path
   */
  const getNestedValue = (obj: any, path: string): any => {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : null
    }, obj)
  }

  /**
   * Filter data by selected fields
   * @param data - Array of objects
   * @param selectedFields - Array of selected field paths
   * @returns Filtered data with only selected fields
   */
  const filterByFields = (
    data: Record<string, any>[],
    selectedFields: string[]
  ): Record<string, any>[] => {
    return data.map(item => {
      const filtered: Record<string, any> = {}

      selectedFields.forEach(fieldPath => {
        const value = getNestedValue(item, fieldPath)
        // Set value using the last part of the path
        const keys = fieldPath.split('.')
        const lastKey = keys[keys.length - 1]
        filtered[lastKey] = value
      })

      return filtered
    })
  }

  /**
   * Select all fields
   * @param fields - Array of field paths
   * @returns All fields selected
   */
  const selectAll = (fields: string[]): string[] => {
    return [...fields]
  }

  /**
   * Deselect all fields
   * @returns Empty array
   */
  const deselectAll = (): string[] => {
    return []
  }

  /**
   * Toggle field selection
   * @param selected - Currently selected fields
   * @param field - Field to toggle
   * @returns Updated selection
   */
  const toggleField = (selected: string[], field: string): string[] => {
    if (selected.includes(field)) {
      return selected.filter(f => f !== field)
    } else {
      return [...selected, field]
    }
  }

  return {
    extractFieldPaths,
    getFieldStats,
    getNestedValue,
    filterByFields,
    selectAll,
    deselectAll,
    toggleField
  }
}
