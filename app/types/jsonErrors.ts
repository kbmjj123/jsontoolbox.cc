/**
 * JSON Error Types
 * Structured error types for parse errors and field-level validation errors
 */

/** Parse error (syntax level) — from JSON.parse failures */
export interface ParseError {
  line: number
  column: number
  message: string
  offset?: number
  /** i18n key for friendly localized error message */
  errorKey?: string
}

/** Field-level error (semantic/rule level) — from validation rules */
export interface FieldError {
  instancePath: string   // JSON Pointer, e.g. "/user/email"
  schemaPath?: string    // which rule failed
  keyword: string        // "type" | "required" | "minimum" | "pattern" ...
  message: string        // human-readable description
  params?: Record<string, any> // extra params, e.g. { minimum: 0, actual: -5 }
}

/** Validation rule definition */
export interface FieldRule {
  path: string           // JSON Pointer, e.g. "/user/email"
  type?: 'string' | 'number' | 'boolean' | 'object' | 'array'
  required?: boolean
  min?: number           // for number / array.length / string.length
  max?: number
  pattern?: RegExp
  message?: string
}
