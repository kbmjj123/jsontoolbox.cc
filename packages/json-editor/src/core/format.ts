import { parseJson, normalizeJsonError } from './parse'

export type IndentOption = 2 | 4 | 'tab'

export interface TransformResult {
  text: string
  error: string | null
}

function indentValue(indent: IndentOption): number | string {
  return indent === 'tab' ? '\t' : indent
}

export function stringifyJson(value: unknown, indent: IndentOption = 2): string {
  return JSON.stringify(value, null, indentValue(indent))
}

/**
 * Re-indent JSON text. Fails with the parser's message instead of throwing.
 */
export function formatJson(text: string, indent: IndentOption = 2): TransformResult {
  const { data, error } = parseJson(text)
  if (error) return { text, error }
  try {
    return { text: stringifyJson(data, indent), error: null }
  } catch (e) {
    return { text, error: normalizeJsonError((e as Error).message) }
  }
}

/** Compact JSON: no insignificant whitespace. */
export function minifyJson(text: string): TransformResult {
  const { data, error } = parseJson(text)
  if (error) return { text, error }
  try {
    return { text: JSON.stringify(data), error: null }
  } catch (e) {
    return { text, error: normalizeJsonError((e as Error).message) }
  }
}

/** UTF-8 byte length of a string. */
export function byteLength(text: string): number {
  return new TextEncoder().encode(text).length
}
