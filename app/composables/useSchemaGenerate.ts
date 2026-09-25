/**
 * Generate a JSON Schema (Draft-07) from a sample JSON value.
 * Extracted from JsonSchemaGenerator.vue so the editor's Schema mode and the
 * standalone generator share a single implementation ("能复用绝不重写").
 */

export interface SchemaGenOptions {
  includeRequired?: boolean
  additionalProperties?: boolean
  /** JSON Schema dialect written to `$schema`. Defaults to `draft-07`. */
  draft?: 'draft-07' | '2020-12'
  /** Attach string `format` guesses (date, email, uri, uuid…). Defaults to true. */
  detectFormats?: boolean
  /** Attach the sampled scalar value as `examples`. Defaults to false. */
  includeExamples?: boolean
}

const SCHEMA_URI: Record<'draft-07' | '2020-12', string> = {
  'draft-07': 'http://json-schema.org/draft-07/schema#',
  '2020-12': 'https://json-schema.org/draft/2020-12/schema',
}

/** How many array items are sampled when merging `items`/`anyOf`. */
const MAX_SAMPLED_ITEMS = 20

const withExample = (schema: Record<string, unknown>, value: unknown, options: SchemaGenOptions) => {
  if (options.includeExamples) schema.examples = [value]
  return schema
}

function inferSchema(value: unknown, options: SchemaGenOptions): Record<string, unknown> {
  if (value === null) return withExample({ type: 'null' }, value, options)
  if (Array.isArray(value)) {
    if (value.length === 0) return { type: 'array' }
    // Merge the sampled items: identical shapes collapse into one `items`
    // schema, mixed shapes become `items: { anyOf: [...] }`.
    const seen = new Map<string, Record<string, unknown>>()
    for (const item of value.slice(0, MAX_SAMPLED_ITEMS)) {
      const schema = inferSchema(item, options)
      const key = JSON.stringify(schema)
      if (!seen.has(key)) seen.set(key, schema)
    }
    const unique = [...seen.values()]
    return { type: 'array', items: unique.length > 1 ? { anyOf: unique } : unique[0] }
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
    if (options.detectFormats !== false) {
      if (/^\d{4}-\d{2}-\d{2}$/.test(value)) schema.format = 'date'
      else if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) schema.format = 'date-time'
      else if (/^[^@]+@[^@]+\.[^@]+$/.test(value)) schema.format = 'email'
      else if (/^https?:\/\//.test(value)) schema.format = 'uri'
      else if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) schema.format = 'uuid'
    }
    return withExample(schema, value, options)
  }
  if (typeof value === 'number') return withExample(Number.isInteger(value) ? { type: 'integer' } : { type: 'number' }, value, options)
  if (typeof value === 'boolean') return withExample({ type: 'boolean' }, value, options)
  return {}
}

export function generateSchema(data: unknown, options: SchemaGenOptions = {}): Record<string, unknown> {
  const uri = SCHEMA_URI[options.draft ?? 'draft-07']
  return { $schema: uri, ...inferSchema(data, options) }
}

export function generateSchemaText(
  data: unknown,
  options: SchemaGenOptions & { indent?: number | 'tab' } = {},
): string {
  const schema = generateSchema(data, options)
  const space = options.indent === 'tab' ? '\t' : (options.indent ?? 2)
  return JSON.stringify(schema, null, space)
}
