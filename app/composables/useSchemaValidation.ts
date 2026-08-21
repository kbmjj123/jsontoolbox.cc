import Ajv, { type ErrorObject } from 'ajv'
import type { FieldError } from '~/types/jsonErrors'

const ajv = new Ajv({ allErrors: true, verbose: true })

/**
 * JSON Schema Validation Composable
 * Wraps Ajv and converts errors to our FieldError format
 */
export const useSchemaValidation = () => {
  /**
   * Convert Ajv ErrorObject to our FieldError
   */
  const toFieldError = (err: ErrorObject): FieldError => {
    const instancePath = err.instancePath || '/'
    const keyword = err.keyword
    let message = err.message || `Validation failed (${keyword})`

    // Enhance messages for common keywords
    switch (keyword) {
      case 'required':
        message = `Missing required field: ${err.params?.missingProperty}`
        break
      case 'type':
        message = `Expected type: ${err.params?.type}`
        break
      case 'enum':
        message = `Must be one of: ${err.params?.allowedValues?.join(', ')}`
        break
      case 'minimum':
        message = `Must be >= ${err.params?.limit}`
        break
      case 'maximum':
        message = `Must be <= ${err.params?.limit}`
        break
      case 'minLength':
        message = `Length must be >= ${err.params?.limit}`
        break
      case 'maxLength':
        message = `Length must be <= ${err.params?.limit}`
        break
      case 'pattern':
        message = `Must match pattern: ${err.params?.pattern}`
        break
      case 'format':
        message = `Must match format: ${err.params?.format}`
        break
      case 'additionalProperties':
        message = `Unexpected additional property: ${err.params?.additionalProperty}`
        break
      case 'minItems':
        message = `Must have >= ${err.params?.limit} items`
        break
      case 'maxItems':
        message = `Must have <= ${err.params?.limit} items`
        break
    }

    return {
      instancePath,
      schemaPath: err.schemaPath,
      keyword,
      message,
      params: err.params as Record<string, any>,
    }
  }

  /**
   * Validate JSON data against a JSON Schema
   * @param data - Parsed JSON data
   * @param schema - JSON Schema object
   * @returns Array of FieldError
   */
  const validate = (data: any, schema: any): FieldError[] => {
    try {
      const validate = ajv.compile(schema)
      const valid = validate(data)
      if (valid) return []
      return (validate.errors || []).map(toFieldError)
    } catch (e) {
      return [{
        instancePath: '/',
        keyword: 'schema-error',
        message: `Schema error: ${(e as Error).message}`,
      }]
    }
  }

  /**
   * Parse and validate schema string, then validate data
   * @param data - Parsed JSON data
   * @param schemaText - JSON Schema as string
   * @returns { errors, schemaError }
   */
  const validateWithSchemaText = (
    data: any,
    schemaText: string
  ): { errors: FieldError[]; schemaError: string | null } => {
    try {
      const schema = JSON.parse(schemaText)
      return { errors: validate(data, schema), schemaError: null }
    } catch (e) {
      return {
        errors: [],
        schemaError: `Invalid schema JSON: ${(e as Error).message}`,
      }
    }
  }

  return {
    validate,
    validateWithSchemaText,
  }
}
