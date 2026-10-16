import { jsonrepair } from 'jsonrepair'
// L1: 解析与错误定位统一走包的 core（纯 JSON.parse 语义）。站点只叠加自己的
// 增强：jsonrepair 修复、以及 ERROR_PATTERNS → i18n 友好文案键的映射。
import { analyzeJson } from '@kbmjj123/json-editor/core'
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

    // 3. Fix duplicate commas
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
   * Used by "Fix All" button (user-initiated, explicit).
   *
   * Applies fixes in a loop so steps can stack:
   * e.g. single quote conversion → trailing comma removal → valid JSON
   */
  const fixJson = (input: string): { fixed: string | null; fixes: string[] } => {
    // Start with safe fixes
    const safe = fixJsonSafe(input)
    let fixed = safe.fixed ?? input
    const fixes = [...safe.fixes]

    // Define all fix steps (order matters — each may enable the next)
    const fixSteps = [
      { name: 'Removed trailing commas', apply: (s: string) => s.replace(/,\s*([\]}])/g, '$1') },
      { name: 'Converted single quotes to double quotes', apply: (s: string) => !s.includes('"') ? s.replace(/'/g, '"') : s },
      { name: 'Added missing closing brackets', apply: (s: string) => fixMissingBrackets(s) },
      { name: 'Added missing quotes to keys', apply: (s: string) => fixMissingKeyQuotes(s) },
      { name: 'Removed JSON comments', apply: (s: string) => (s.includes('//') || s.includes('/*')) ? removeJsonComments(s) : s },
      { name: 'Fixed newline characters in strings', apply: (s: string) => s.replace(/\\n/g, '\n').replace(/\n/g, '\\n') },
    ]

    // Apply fixes in a loop so steps can stack (max 4 passes)
    for (let pass = 0; pass < 4; pass++) {
      if (isValidJson(fixed)) break
      const before = fixed
      for (const step of fixSteps) {
        if (isValidJson(fixed)) break
        const result = step.apply(fixed)
        if (result !== fixed) {
          if (isValidJson(result)) {
            fixes.push(step.name)
            fixed = result
            break
          } else if (result.length < fixed.length || /['"]/.test(result) !== /['"]/.test(fixed)) {
            // Accept intermediate progress even if not yet valid
            // (e.g. single quote conversion enables trailing comma fix next)
            fixes.push(step.name)
            fixed = result
          }
        }
      }
      // No progress in this pass — stop
      if (fixed === before) break
    }

    if (!isValidJson(fixed)) {
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
    // `analyzeJson` 一次给出归一化消息 + 行列；站点增强层只补 errorKey。
    const { error, location } = analyzeJson(input)
    if (!error) return null

    return {
      message: error,
      line: location?.line ?? 1,
      column: location?.column ?? 1,
      errorKey: getErrorKey(error)
    }
  }

  /**
   * Repair JSON using the jsonrepair library.
   * Handles: single quotes, unquoted keys, trailing commas, missing brackets,
   * comments, Python constants (True/False/None), and more.
   * Returns the repaired string if successful, null if still unparseable.
   */
  const repairJson = (input: string): string | null => {
    try {
      const repaired = jsonrepair(input)
      JSON.parse(repaired) // validate
      return repaired
    } catch {
      return null
    }
  }

  return {
    fixJsonSafe,
    fixJson,
    repairJson,
    isValidJson,
    getJsonError
  }
}
