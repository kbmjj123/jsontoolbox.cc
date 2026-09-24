/**
 * Shared code / format generation.
 *
 * Extracted so the JSON editor's Generate panel (P1-5), the API snippet
 * generator (P2-2) and the standalone converters share one implementation
 * instead of each tool carrying its own copy.
 */
import yaml from 'js-yaml'
import { generateSchema } from '~/composables/useSchemaGenerate'
import { flattenArray, getFlattenedKeys } from '~/composables/useJsonFlatten'
import { generateCsv } from '~/composables/useExcelCompat'

export interface CodegenOptions {
  /** Root type name (default `Root`). */
  name?: string
  /** Mark every generated field optional (`?`). */
  optional?: boolean
  /** Render `null` values as `null` instead of `unknown`. */
  useNull?: boolean
  /** Emit nested objects as separate named interfaces (default true). */
  expand?: boolean
  /** Annotate each field with its sample value. */
  comments?: boolean
  /** Convert snake-case / kebab-case keys to camelCase. */
  camelCase?: boolean
  /** Singularize the interface name derived from an array field. */
  singularArray?: boolean
}

type ResolvedOptions = Required<Omit<CodegenOptions, 'name'>> & { name: string }

function resolve(options: CodegenOptions): ResolvedOptions {
  return {
    name: options.name || 'Root',
    optional: options.optional ?? false,
    useNull: options.useNull ?? true,
    expand: options.expand ?? true,
    comments: options.comments ?? false,
    camelCase: options.camelCase ?? false,
    singularArray: options.singularArray ?? true,
  }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function toCamelCase(key: string): string {
  return key.replace(/[-_\s]+([A-Za-z0-9])/g, (_, c: string) => c.toUpperCase())
}

/** Quote keys that are not valid JS/TS identifiers. */
function safeKey(key: string): string {
  return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(key) ? key : JSON.stringify(key)
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

function toPascal(key: string): string {
  const camel = toCamelCase(key)
  const cleaned = camel.replace(/[^A-Za-z0-9]/g, '')
  return capitalize(cleaned || 'Item')
}

function singularize(word: string): string {
  if (/ies$/i.test(word)) return word.replace(/ies$/i, 'y')
  if (/(ch|sh|ss|x|s)$/i.test(word)) return word.replace(/s$/i, '')
  return word
}

/** Merge the shapes of every element so `User[]` reflects the whole array. */
function mergeObjectSamples(items: unknown[]): { keys: string[]; optionalKeys: Set<string> } {
  const counts = new Map<string, number>()
  for (const item of items) {
    if (!isPlainObject(item)) continue
    for (const key of Object.keys(item)) counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  const objectCount = items.filter((i) => isPlainObject(i)).length
  const optionalKeys = new Set<string>()
  for (const [key, count] of counts) {
    if (count < objectCount) optionalKeys.add(key)
  }
  return { keys: [...counts.keys()], optionalKeys }
}

function tsTypeOf(
  value: unknown,
  suggestedName: string,
  nested: string[],
  options: ResolvedOptions,
  depth = 0,
): string {
  if (value === null) return options.useNull ? 'null' : 'unknown'

  if (Array.isArray(value)) {
    if (value.length === 0) return 'unknown[]'
    const elementName = options.singularArray ? singularize(suggestedName) : suggestedName
    const objects = value.filter((item) => isPlainObject(item))
    if (objects.length === 0) {
      // Mixed/primitive array: collapse to the union of the primitive types.
      const primitives = new Set(value.map((item) => tsTypeOf(item, elementName, nested, options, depth + 1)))
      return `${[...primitives].join(' | ')}[]`
    }
    const { keys, optionalKeys } = mergeObjectSamples(value)
    const fields = objectFields(keys, optionalKeys, objects, elementName, nested, options, depth)
    const elementType = options.expand
      ? registerInterface(elementName, fields, nested, options)
      : `{ ${inlineFields(fields)} }`
    return `${elementType}[]`
  }

  if (isPlainObject(value)) {
    const fields = objectFields(
      Object.keys(value),
      new Set(),
      [value],
      suggestedName,
      nested,
      options,
      depth,
    )
    if (!options.expand) return `{ ${inlineFields(fields)} }`
    return registerInterface(suggestedName, fields, nested, options)
  }

  switch (typeof value) {
    case 'string': return 'string'
    case 'number': return 'number'
    case 'boolean': return 'boolean'
    default: return 'unknown'
  }
}

interface Field {
  key: string
  type: string
  optional: boolean
  sample: unknown
}

function objectFields(
  keys: string[],
  optionalKeys: Set<string>,
  samples: Record<string, unknown>[],
  ownerName: string,
  nested: string[],
  options: ResolvedOptions,
  depth: number,
): Field[] {
  const fields: Field[] = []
  for (const rawKey of keys) {
    const sample = samples.find((s) => rawKey in s)?.[rawKey] ?? null
    const key = options.camelCase ? toCamelCase(rawKey) : rawKey
    const type = tsTypeOf(sample, `${ownerName}${toPascal(rawKey)}`, nested, options, depth + 1)
    fields.push({
      key,
      type,
      optional: options.optional || optionalKeys.has(rawKey),
      sample,
    })
  }
  return fields
}

function inlineFields(fields: Field[]): string {
  return fields.map((f) => `${safeKey(f.key)}${f.optional ? '?' : ''}: ${f.type}`).join('; ')
}

/** Render body lines, optionally prefixing each field with its sample value. */
function renderFields(fields: Field[], options: ResolvedOptions, indent = '  '): string[] {
  const lines: string[] = []
  for (const field of fields) {
    if (options.comments) {
      const sample = JSON.stringify(field.sample) ?? String(field.sample)
      lines.push(`${indent}/** e.g. ${sample} */`)
    }
    lines.push(`${indent}${safeKey(field.key)}${field.optional ? '?' : ''}: ${field.type}`)
  }
  return lines
}

/** Declare a named interface once and return its name. */
function registerInterface(name: string, fields: Field[], nested: string[], options: ResolvedOptions): string {
  nested.push(`export interface ${name} {\n${renderFields(fields, options).join('\n')}\n}`)
  return name
}

function buildInterfaces(input: unknown, options: ResolvedOptions, keyword: 'interface' | 'type'): string {
  const rootName = toPascal(options.name)
  const nested: string[] = []

  let root: string
  if (isPlainObject(input)) {
    const fields = objectFields(Object.keys(input), new Set(), [input], rootName, nested, options, 0)
    const body = renderFields(fields, options).join('\n')
    root = keyword === 'interface'
      ? `export interface ${rootName} {\n${body}\n}`
      : `export type ${rootName} = {\n${body}\n}`
  } else if (Array.isArray(input)) {
    const elementType = tsTypeOf(input, `${rootName}Item`, nested, options)
    root = `export type ${rootName} = ${elementType}`
  } else {
    root = `export type ${rootName} = ${tsTypeOf(input, rootName, nested, options)}`
  }

  // Nested declarations first so the file reads top-down.
  return [...nested, root].join('\n\n')
}

/** TypeScript `interface` output. */
export function generateTypeScript(input: unknown, options: CodegenOptions = {}): string {
  return buildInterfaces(input, resolve(options), 'interface')
}

/** TypeScript `type` alias output. */
export function generateTsType(input: unknown, options: CodegenOptions = {}): string {
  return buildInterfaces(input, resolve(options), 'type')
}

/** YAML output (js-yaml). */
export function toYaml(input: unknown, indent = 2): string {
  return yaml.dump(input, { indent, lineWidth: -1, noRefs: true })
}

/** CSV output for an array of objects (nested values are flattened). */
export function toCsv(input: unknown, delimiter = ','): string {
  const rows = Array.isArray(input) ? input : [input]
  const records = rows.filter((r) => isPlainObject(r)) as Record<string, unknown>[]
  if (records.length === 0) return ''
  const flat = flattenArray(records, delimiter === ',' ? '.' : delimiter)
  const headers = getFlattenedKeys(flat)
  return generateCsv(
    headers,
    flat.map((row) => headers.map((h) => row[h] ?? '')),
    delimiter,
  )
}

/** JSON Schema output (Draft-07), reusing the shared generator. */
export function toJsonSchema(input: unknown, indent = 2): string {
  return JSON.stringify(generateSchema(input, { includeRequired: true }), null, indent)
}

export type ConvertFormat = 'typescript' | 'tsType' | 'yaml' | 'csv' | 'jsonSchema'

export function convert(input: unknown, format: ConvertFormat, options: CodegenOptions = {}): string {
  switch (format) {
    case 'typescript': return generateTypeScript(input, options)
    case 'tsType': return generateTsType(input, options)
    case 'yaml': return toYaml(input)
    case 'csv': return toCsv(input)
    case 'jsonSchema': return toJsonSchema(input)
  }
}

// ── API snippets (P2-2): generate code only, never send a request ──

export interface ApiSnippetOptions {
  method: string
  url: string
  headers: Record<string, string>
  body?: unknown
}

/** Escape a value for use inside a single-quoted POSIX shell string. */
function shq(value: string): string {
  return `'${value.replace(/'/g, `'\\''`)}'`
}

function upperMethod(method: string): string {
  return method.toUpperCase()
}

function hasBody(method: string): boolean {
  const m = method.toUpperCase()
  return m !== 'GET' && m !== 'HEAD'
}

export function genFetch(options: ApiSnippetOptions): string {
  const method = upperMethod(options.method)
  const headerLines = Object.entries(options.headers)
    .map(([k, v]) => `    ${JSON.stringify(k)}: ${JSON.stringify(v)},`)
    .join('\n')
  const init: string[] = [`  method: ${JSON.stringify(method)}`]
  if (headerLines) init.push(`  headers: {\n${headerLines}\n  }`)
  if (hasBody(method) && options.body !== undefined) {
    init.push(`  body: JSON.stringify(${JSON.stringify(options.body, null, 2)})`)
  }
  return `const response = await fetch(${JSON.stringify(options.url)}, {\n${init.join(',\n')}\n})\nconst data = await response.json()`
}

export function genCurl(options: ApiSnippetOptions): string {
  const method = upperMethod(options.method)
  const parts = [`curl -X ${method} ${shq(options.url)}`]
  for (const [k, v] of Object.entries(options.headers)) {
    parts.push(`  -H ${shq(`${k}: ${v}`)}`)
  }
  if (hasBody(method) && options.body !== undefined) {
    parts.push(`  --data-raw ${shq(JSON.stringify(options.body))}`)
  }
  return parts.join(' \\\n')
}

export function genAxios(options: ApiSnippetOptions): string {
  const method = upperMethod(options.method).toLowerCase()
  const config: string[] = []
  const headerLines = Object.entries(options.headers)
    .map(([k, v]) => `    ${JSON.stringify(k)}: ${JSON.stringify(v)},`)
    .join('\n')
  if (headerLines) config.push(`  headers: {\n${headerLines}\n  },`)
  const args = [JSON.stringify(options.url)]
  if (hasBody(options.method) && options.body !== undefined) {
    args.push(JSON.stringify(options.body, null, 2))
  }
  if (config.length) args.push(`{\n${config.join('\n')}\n}`)
  return `import axios from 'axios'\n\nconst { data } = await axios.${method}(\n${args.join(',\n')}\n)`
}

export function genPythonRequests(options: ApiSnippetOptions): string {
  const method = upperMethod(options.method).toLowerCase()
  const headerLines = Object.entries(options.headers)
    .map(([k, v]) => `    ${JSON.stringify(k)}: ${JSON.stringify(v)},`)
    .join('\n')
  const lines = ['import requests', '']
  lines.push(`url = ${JSON.stringify(options.url)}`)
  if (headerLines) lines.push(`headers = {\n${headerLines}\n}`)
  const call: string[] = []
  if (headerLines) call.push('headers=headers')
  if (hasBody(options.method) && options.body !== undefined) {
    lines.push(`payload = ${JSON.stringify(options.body, null, 2)}`)
    call.push('json=payload')
  }
  lines.push('')
  lines.push(`response = requests.${method}(url${call.length ? `, ${call.join(', ')}` : ''})`)
  lines.push('data = response.json()')
  return lines.join('\n')
}

export type ApiSnippetKind = 'fetch' | 'curl' | 'axios' | 'python'

export function generateApiSnippet(kind: ApiSnippetKind, options: ApiSnippetOptions): string {
  switch (kind) {
    case 'fetch': return genFetch(options)
    case 'curl': return genCurl(options)
    case 'axios': return genAxios(options)
    case 'python': return genPythonRequests(options)
  }
}
