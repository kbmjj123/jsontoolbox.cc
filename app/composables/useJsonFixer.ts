/**
 * JSON Auto-Fixer Composable
 * Automatically fix common JSON syntax errors, reusable for formatter, validator, etc.
 */
export const useJsonFixer = () => {
  /**
   * Fix common JSON errors
   * @param input Raw JSON string
   * @returns Fixed JSON string, or null if unable to fix
   */
  const fixJson = (input: string): { fixed: string | null; fixes: string[] } => {
    const fixes: string[] = []
    let fixed = input

    // 1. Remove BOM and trim whitespace
    fixed = fixed.replace(/^﻿/, '').trim()

    // 2. Fix single quotes to double quotes (only in non-nested cases)
    if (!fixed.includes('"')) {
      const singleQuoteFixed = fixed.replace(/'/g, '"')
      if (isValidJson(singleQuoteFixed)) {
        fixes.push('Converted single quotes to double quotes')
        fixed = singleQuoteFixed
      }
    }

    // 3. Fix trailing commas (end of objects and arrays)
    const trailingCommaFixed = fixed.replace(/,\s*([\]}])/g, '$1')
    if (trailingCommaFixed !== fixed && isValidJson(trailingCommaFixed)) {
      fixes.push('Removed trailing commas')
      fixed = trailingCommaFixed
    }

    // 4. Fix missing closing brackets
    const bracketFixed = fixMissingBrackets(fixed)
    if (bracketFixed !== fixed && isValidJson(bracketFixed)) {
      fixes.push('Added missing closing brackets')
      fixed = bracketFixed
    }

    // 5. Fix missing quotes (simple case: unquoted keys)
    const quotesFixed = fixMissingKeyQuotes(fixed)
    if (quotesFixed !== fixed && isValidJson(quotesFixed)) {
      fixes.push('Added missing quotes to keys')
      fixed = quotesFixed
    }

    // 6. Fix comments (remove // and /* */ comments)
    if (fixed.includes('//') || fixed.includes('/*')) {
      const commentFixed = removeJsonComments(fixed)
      if (commentFixed !== fixed && isValidJson(commentFixed)) {
        fixes.push('Removed JSON comments')
        fixed = commentFixed
      }
    }

    // 7. Fix duplicate commas
    const doubleCommaFixed = fixed.replace(/,,/g, ',')
    if (doubleCommaFixed !== fixed && isValidJson(doubleCommaFixed)) {
      fixes.push('Removed duplicate commas')
      fixed = doubleCommaFixed
    }

    // 8. Fix newline characters in strings
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
   * Get detailed JSON error information (line, column)
   */
  const getJsonError = (input: string): { message: string; line: number; column: number } | null => {
    try {
      JSON.parse(input)
      return null
    } catch (e) {
      const error = e as Error
      const match = error.message.match(/position (\d+)/)
      let line = 1
      let column = 1

      if (match) {
        const pos = parseInt(match[1])
        const lines = input.substring(0, pos).split('\n')
        line = lines.length
        column = lines[lines.length - 1].length + 1
      }

      return {
        message: error.message,
        line,
        column
      }
    }
  }

  return {
    fixJson,
    isValidJson,
    getJsonError
  }
}
