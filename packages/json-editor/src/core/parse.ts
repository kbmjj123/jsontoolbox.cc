/**
 * JSON parsing and error locating. Pure functions — no Vue, no DOM.
 */

export interface ParseResult {
  data: unknown
  error: string | null
}

export interface ErrorLocation {
  line: number
  column: number
}

/**
 * Strip the engine-specific tail from a `JSON.parse` message so the same
 * failure reads the same in every browser / Node version.
 *
 * `"Unexpected token } in JSON at position 12"` → `"Unexpected token }"`
 */
export function normalizeJsonError(message: string): string {
  return message
    .replace(/\s+at position \d+.*$/, '')
    .replace(/\s+\(line \d+ column \d+\).*$/, '')
}

export function parseJson(text: string, options: { bigInt?: boolean } = {}): ParseResult {
  const { bigInt = false } = options

  try {
    if (bigInt) {
      // Wrap 16+ digit numbers as `"123n"` strings, then restore them as BigInt
      // so precision survives for values beyond Number.MAX_SAFE_INTEGER.
      const processed = text.replace(/:\s*(-?\d{16,})/g, ':"$1n"')
      const data = JSON.parse(processed)
      return { data: restoreBigInt(data), error: null }
    }
    return { data: JSON.parse(text), error: null }
  } catch (e) {
    return { data: null, error: normalizeJsonError((e as Error).message) }
  }
}

function restoreBigInt(obj: unknown): unknown {
  if (typeof obj === 'string' && obj.endsWith('n') && /^-?\d+n$/.test(obj)) {
    return BigInt(obj.slice(0, -1))
  }
  if (Array.isArray(obj)) return obj.map(restoreBigInt)
  if (obj !== null && typeof obj === 'object') {
    const result: Record<string, unknown> = {}
    for (const key in obj as Record<string, unknown>) {
      result[key] = restoreBigInt((obj as Record<string, unknown>)[key])
    }
    return result
  }
  return obj
}

export function hasLargeNumbers(text: string): boolean {
  return /:\s*-?\d{16,}/.test(text)
}

export interface JsonAnalysis {
  data: unknown
  error: string | null
  /** Present whenever `error` is set and the engine reported a position. */
  location: ErrorLocation | null
}

/**
 * Parse and, on failure, report both the normalized message and the
 * line/column — the two things an editor UI needs in one pass.
 */
export function analyzeJson(text: string): JsonAnalysis {
  try {
    return { data: JSON.parse(text), error: null, location: null }
  } catch (e) {
    const raw = (e as Error).message
    return {
      data: null,
      error: normalizeJsonError(raw),
      location: getErrorLocation(text, raw),
    }
  }
}

/**
 * Turn a `JSON.parse` error message into a 1-based line/column pair.
 *
 * Expects the **raw** message (the one containing `position N`); a
 * normalized message has no position to read.
 */
export function getErrorLocation(text: string, error: string): ErrorLocation | null {
  const match = error.match(/position (\d+)/)
  if (!match) return null

  const pos = Number.parseInt(match[1], 10)
  const lines = text.substring(0, pos).split('\n')
  return {
    line: lines.length,
    column: lines[lines.length - 1].length + 1,
  }
}

export function validateJson(text: string): { valid: boolean; error: string | null } {
  try {
    JSON.parse(text)
    return { valid: true, error: null }
  } catch (e) {
    return { valid: false, error: normalizeJsonError((e as Error).message) }
  }
}
