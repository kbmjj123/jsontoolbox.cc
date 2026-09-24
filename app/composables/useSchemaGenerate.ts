/**
 * Generate a JSON Schema (Draft-07) from a sample JSON value.
 * Extracted from JsonSchemaGenerator.vue so the editor's Schema mode and the
 * standalone generator share a single implementation ("能复用绝不重写").
 */

export interface SchemaGenOptions {
  includeRequired?: boolean
  additionalProperties?: boolean
}

function inferSchema(value: unknown, options: SchemaGenOptions): Record<string, unknown> {
  if (value === null) return { type: 'null' }
  if (Array.isArray(value)) {
    if (value.length === 0) return { type: 'array' }
    return { type: 'array', items: inferSchema(value[0], options) }
  }
  if (typeof value === 'object') {
    const properties: Record<string, unknown> = {}
    const required: string[] = []
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      properties[key] = inferSchema(val, options)
      required.push(key)
    }
    const schema: Record<string, unknown> = { type: 'object', properties }
    if (options.includeRequired && required.length > 0) schema.required = required
    if (options.additionalProperties) schema.additionalProperties = true
    return schema
  }
  if (typeof value === 'string') {
    const schema: Record<string, unknown> = { type: 'string' }
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) schema.format = 'date'
    else if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) schema.format = 'date-time'
    else if (/^[^@]+@[^@]+\.[^@]+$/.test(value)) schema.format = 'email'
    else if (/^https?:\/\//.test(value)) schema.format = 'uri'
    else if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) schema.format = 'uuid'
    return schema
  }
  if (typeof value === 'number') return Number.isInteger(value) ? { type: 'integer' } : { type: 'number' }
  if (typeof value === 'boolean') return { type: 'boolean' }
  return {}
}

export function generateSchema(data: unknown, options: SchemaGenOptions = {}): Record<string, unknown> {
  return { $schema: 'http://json-schema.org/draft-07/schema#', ...inferSchema(data, options) }
}

export function generateSchemaText(
  data: unknown,
  options: SchemaGenOptions & { indent?: number | 'tab' } = {},
): string {
  const schema = generateSchema(data, options)
  const space = options.indent === 'tab' ? '\t' : (options.indent ?? 2)
  return JSON.stringify(schema, null, space)
}
