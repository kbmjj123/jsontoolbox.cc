import type { FieldError, FieldRule } from '~/types/jsonErrors'

/**
 * Field Validation Composable
 * Validates JSON data against custom rules, returns structured FieldError[]
 */
export const useFieldValidation = () => {
  /**
   * Get the JSON type of a value
   */
  const getType = (val: any): string => {
    if (val === null) return 'null'
    if (Array.isArray(val)) return 'array'
    return typeof val
  }

  /**
   * Walk JSON data and collect all values at a given JSON Pointer path
   * Supports wildcards: /users/*/email matches all user emails
   */
  const resolvePath = (data: any, path: string): { value: any; path: string }[] => {
    const parts = path.split('/').filter(Boolean)
    const results: { value: any; path: string }[] = []

    const walk = (current: any, remaining: string[], currentPath: string) => {
      if (remaining.length === 0) {
        results.push({ value: current, path: currentPath })
        return
      }

      const [head, ...rest] = remaining

      if (head === '*') {
        // Wildcard: iterate all children
        if (Array.isArray(current)) {
          current.forEach((item, i) => {
            walk(item, rest, `${currentPath}/${i}`)
          })
        } else if (typeof current === 'object' && current !== null) {
          Object.keys(current).forEach(key => {
            walk(current[key], rest, `${currentPath}/${key}`)
          })
        }
      } else if (typeof current === 'object' && current !== null && head in current) {
        walk(current[head], rest, `${currentPath}/${head}`)
      }
    }

    walk(data, parts, '')
    return results
  }

  /**
   * Validate JSON data against a set of field rules
   */
  const validate = (data: any, rules: FieldRule[]): FieldError[] => {
    const errors: FieldError[] = []

    for (const rule of rules) {
      const matches = resolvePath(data, rule.path)

      if (matches.length === 0) {
        // Path doesn't exist — check if required
        if (rule.required) {
          errors.push({
            instancePath: rule.path,
            keyword: 'required',
            message: rule.message || `Field is required`,
            params: { missingPath: rule.path },
          })
        }
        continue
      }

      for (const { value, path } of matches) {
        const actualType = getType(value)

        // Type check
        if (rule.type && actualType !== rule.type && actualType !== 'null') {
          errors.push({
            instancePath: path,
            keyword: 'type',
            message: rule.message || `Expected ${rule.type}, got ${actualType}`,
            params: { expected: rule.type, actual: actualType },
          })
          continue // skip further checks if type is wrong
        }

        // Required check (value exists but might be null/empty)
        if (rule.required && (value === null || value === '')) {
          errors.push({
            instancePath: path,
            keyword: 'required',
            message: rule.message || `Field is required`,
            params: { actual: value },
          })
        }

        // Min/max for numbers
        if (rule.type === 'number' && typeof value === 'number') {
          if (rule.min !== undefined && value < rule.min) {
            errors.push({
              instancePath: path,
              keyword: 'minimum',
              message: rule.message || `Value must be >= ${rule.min}`,
              params: { minimum: rule.min, actual: value },
            })
          }
          if (rule.max !== undefined && value > rule.max) {
            errors.push({
              instancePath: path,
              keyword: 'maximum',
              message: rule.message || `Value must be <= ${rule.max}`,
              params: { maximum: rule.max, actual: value },
            })
          }
        }

        // Min/max length for strings
        if (rule.type === 'string' && typeof value === 'string') {
          if (rule.min !== undefined && value.length < rule.min) {
            errors.push({
              instancePath: path,
              keyword: 'minLength',
              message: rule.message || `Length must be >= ${rule.min}`,
              params: { minimum: rule.min, actual: value.length },
            })
          }
          if (rule.max !== undefined && value.length > rule.max) {
            errors.push({
              instancePath: path,
              keyword: 'maxLength',
              message: rule.message || `Length must be <= ${rule.max}`,
              params: { maximum: rule.max, actual: value.length },
            })
          }
        }

        // Min/max length for arrays
        if (rule.type === 'array' && Array.isArray(value)) {
          if (rule.min !== undefined && value.length < rule.min) {
            errors.push({
              instancePath: path,
              keyword: 'minItems',
              message: rule.message || `Array must have >= ${rule.min} items`,
              params: { minimum: rule.min, actual: value.length },
            })
          }
          if (rule.max !== undefined && value.length > rule.max) {
            errors.push({
              instancePath: path,
              keyword: 'maxItems',
              message: rule.message || `Array must have <= ${rule.max} items`,
              params: { maximum: rule.max, actual: value.length },
            })
          }
        }

        // Pattern check for strings
        if (rule.pattern && typeof value === 'string' && !rule.pattern.test(value)) {
          errors.push({
            instancePath: path,
            keyword: 'pattern',
            message: rule.message || `Value does not match pattern ${rule.pattern}`,
            params: { pattern: rule.pattern.source },
          })
        }
      }
    }

    return errors
  }

  /**
   * Build errorMap: { [path]: FieldError[] } for quick lookup by tree nodes
   */
  const buildErrorMap = (errors: FieldError[]): Record<string, FieldError[]> => {
    const map: Record<string, FieldError[]> = {}
    for (const err of errors) {
      const path = err.instancePath
      if (!map[path]) map[path] = []
      map[path].push(err)
    }
    return map
  }

  return {
    validate,
    buildErrorMap,
  }
}
