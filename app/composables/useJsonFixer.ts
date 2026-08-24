import type { ParseError } from '~/types/jsonErrors'

/**
 * Error message localization dictionary
 * Maps patterns in JSON.parse error messages to friendly i18n keys
 */
const ERROR_PATTERNS: Array<{
  pattern: RegExp
  key: string
}> = [
  // Trailing comma / missing comma before closing bracket
  { pattern: /Unexpected token\s*[}\]]/i, key: 'missingCommaOrExtraBracket' },
  // Missing comma between properties
  { pattern: /Unexpected string/i, key: 'missingComma' },
  // Single quotes used instead of double
  { pattern: /Unexpected token\s*'/i, key: 'singleQuotes' },
  // Unquoted property name
  { pattern: /Expected property name/i, key: 'unquotedKey' },
  // Unclosed string
  { pattern: /Unterminated string/i, key: 'unterminatedString' },
  // Unexpected end of input
  { pattern: /Unexpected end of (JSON )?input/i, key: 'unexpectedEnd' },
  // Unexpected token '{' or '[' (likely missing comma)
  { pattern: /Unexpected token\s*[{[]/i, key: 'missingCommaBeforeObject' },
  // Trailing comma specifically
  { pattern: /Unexpected token\s*,/i, key: 'trailingComma' },
  // Invalid character
  { pattern: /Unexpected token/i, key: 'unexpectedToken' },
  // Duplicate key
  { pattern: /duplicate/i, key: 'duplicateKey' },
]

/**
 * JSON Auto-Fixer Composable
 * Automatically fix common JSON syntax errors, reusable for formatter, validator, etc.
 */
export const useJsonFixer = () => {
  /**
   * Conservative auto-fix — only safe, non-destructive operations.
   * Used by the Auto Fix toggle (silent, no content change risk).
   *
   * Safe operations:
   * - Remove UTF-8 BOM
   * - Trim leading/trailing whitespace
   * - Normalize smart quotes → straight double quotes
   * - Remove trailing commas before ] or }
   * - Remove duplicate commas (,, → ,)
   */
  const fixJsonSafe = (input: string): { fixed: string | null; fixes: string[] } => {
    const fixes: string[] = []
    let fixed = input

    // 1. Remove BOM and trim whitespace
    const trimmed = fixed.replace(/^﻿/, '').trim()
    if (trimmed !== fixed) {
      fixes.push('Removed BOM / trimmed whitespace')
      fixed = trimmed
    }

    // 2. Normalize smart quotes (" " ' ' → " ")
    if (/[“”‘’]/.test(fixed)) {
      const smartFixed = fixed.replace(/[“”]/g, '"').replace(/[‘’]/g, "'")
      if (isValidJson(smartFixed)) {
        fixes.push('Normalized smart quotes')
        fixed = smartFixed
      }
    }

    // 3. Fix trailing commas (end of objects and arrays)
    const trailingCommaFixed = fixed.replace(/,\s*([\]}])/g, '$1')
    if (trailingCommaFixed !== fixed && isValidJson(trailingCommaFixed)) {
      fixes.push('Removed trailing commas')
      fixed = trailingCommaFixed
    }

    // 4. Fix duplicate commas
    const doubleCommaFixed = fixed.replace(/,,+/g, ',')
    if (doubleCommaFixed !== fixed && isValidJson(doubleCommaFixed)) {
      fixes.push('Removed duplicate commas')
      fixed = doubleCommaFixed
    }

    if (fixes.length === 0 && !isValidJson(fixed)) {
      return { fixed: null, fixes: [] }
    }

    return { fixed, fixes }
  }

  /**
   * Aggressive fix — includes potentially destructive operations.
   * Used by "Fix All" button in the errors panel (user-initiated, explicit).
   *
   * Additional operations beyond safe fixes:
   * - Convert single quotes to double quotes
   * - Add missing closing brackets
   * - Add quotes to unquoted keys
   * - Remove JSON comments (// and /* *​/)
   * - Fix newline characters in strings
   */
  const fixJson = (input: string): { fixed: string | null; fixes: string[] } => {
    // Start with safe fixes
    const safe = fixJsonSafe(input)
    let fixed = safe.fixed ?? input
    const fixes = [...safe.fixes]

    // 5. Fix single quotes to double quotes (only if no existing double quotes)
    if (!fixed.includes('"')) {
      const singleQuoteFixed = fixed.replace(/'/g, '"')
      if (isValidJson(singleQuoteFixed)) {
        fixes.push('Converted single quotes to double quotes')
        fixed = singleQuoteFixed
      }
    }

    // 6. Fix missing closing brackets
    const bracketFixed = fixMissingBrackets(fixed)
    if (bracketFixed !== fixed && isValidJson(bracketFixed)) {
      fixes.push('Added missing closing brackets')
      fixed = bracketFixed
    }

    // 7. Fix missing quotes (simple case: unquoted keys)
    const quotesFixed = fixMissingKeyQuotes(fixed)
    if (quotesFixed !== fixed && isValidJson(quotesFixed)) {
      fixes.push('Added missing quotes to keys')
      fixed = quotesFixed
    }

    // 8. Fix comments (remove // and /* */ comments)
    if (fixed.includes('//') || fixed.includes('/*')) {
      const commentFixed = removeJsonComments(fixed)
      if (commentFixed !== fixed && isValidJson(commentFixed)) {
        fixes.push('Removed JSON comments')
        fixed = commentFixed
      }
    }

    // 9. Fix newline characters in strings
    const newlineFixed = fixed.replace(/\\n/g, '\n').replace(/\n/g, '\\n')
    if (newlineFixed !== fixed && isValidJson(newlineFixed)) {
      fixes.push('Fixed newline characters in strings')
      fixed = newlineFixed
    }

    if (fixes.length === 0 && !isValidJson(fixed)) {
      return { fixed: null, fixes: [] }
    }

    return { fixed, fixes }
  }

  /**
   * Fix missing closing brackets
   */
  const fixMissingBrackets = (input: string): string => {
    const stack: string[] = []
    let result = ''
    let inString = false
    let escape = false

    for (let i = 0; i < input.length; i++) {
      const char = input[i]

      if (escape) {
        result += char
        escape = false
        continue
      }

      if (char === '\\' && inString) {
        result += char
        escape = true
        continue
      }

      if (char === '"') {
        inString = !inString
        result += char
        continue
      }

      if (inString) {
        result += char
        continue
      }

      if (char === '{' || char === '[') {
        stack.push(char)
        result += char
      } else if (char === '}' || char === ']') {
        const expected = char === '}' ? '{' : '['
        if (stack.length > 0 && stack[stack.length - 1] === expected) {
          stack.pop()
          result += char
        }
      } else {
        result += char
      }
    }

    // Add missing closing brackets
    while (stack.length > 0) {
      const open = stack.pop()
      result += open === '{' ? '}' : ']'
    }

    return result
  }

  /**
   * Fix missing key quotes
   */
  const fixMissingKeyQuotes = (input: string): string => {
    // Match unquoted keys: { key: value } or , key: value
    return input.replace(/([\{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g, '$1"$2":')
  }

  /**
   * Remove JSON comments (supports single-line and multi-line comments)
   */
  const removeJsonComments = (input: string): string => {
    let result = ''
    let i = 0
    let inString = false

    while (i < input.length) {
      const char = input[i]
      const next = input[i + 1]

      if (inString) {
        result += char
        if (char === '\\' && i + 1 < input.length) {
          result += input[i + 1]
          i += 2
          continue
        }
        if (char === '"') {
          inString = false
        }
        i++
        continue
      }

      if (char === '"') {
        inString = true
        result += char
        i++
        continue
      }

      // Check single-line comment //
      if (char === '/' && next === '/') {
        // Skip until end of line
        while (i < input.length && input[i] !== '\n') {
          i++
        }
        continue
      }

      // Check multi-line comment /* */
      if (char === '/' && next === '*') {
        i += 2
        while (i < input.length - 1) {
          if (input[i] === '*' && input[i + 1] === '/') {
            i += 2
            break
          }
          i++
        }
        continue
      }

      result += char
      i++
    }

    return result
  }

  /**
   * Validate if JSON is valid
   */
  const isValidJson = (input: string): boolean => {
    try {
      JSON.parse(input)
      return true
    } catch {
      return false
    }
  }

  /**
   * Get localized error message key for a JSON.parse error
   * Returns an i18n key that can be translated to a friendly message
   */
  const getErrorKey = (rawMessage: string): string => {
    for (const { pattern, key } of ERROR_PATTERNS) {
      if (pattern.test(rawMessage)) return key
    }
    return 'genericSyntaxError'
  }

  /**
   * Get detailed JSON error information (line, column)
   * Returns structured ParseError or null if valid
   */
  const getJsonError = (input: string): ParseError | null => {
    try {
      JSON.parse(input)
      return null
    } catch (e) {
      const error = e as Error
      const match = error.message.match(/position (\d+)/)
      let line = 1
      let column = 1
      let offset: number | undefined

      if (match) {
        offset = parseInt(match[1])
        const lines = input.substring(0, offset).split('\n')
        line = lines.length
        column = lines[lines.length - 1].length + 1
      }

      // Strip redundant position info from message since we provide line/column
      const cleanMessage = error.message
        .replace(/\s+at position \d+.*$/, '')
        .replace(/\s+\(line \d+ column \d+\).*$/, '')

      const errorKey = getErrorKey(cleanMessage)

      return {
        message: cleanMessage,
        line,
        column,
        offset,
        errorKey
      }
    }
  }

  return {
    fixJsonSafe,
    fixJson,
    isValidJson,
    getJsonError
  }
}
