import type { ParseError, FieldError } from '~/types/jsonErrors'

/**
 * Shared JSON editor operations for convert tools.
 * Provides format, minify, validate, fix, and parsed data for a JSON input string.
 */
export const useJsonEditor = () => {
  const { fixJson: fixJsonAuto, getJsonError } = useJsonFixer()
  const { t } = useI18n()

  const formatJson = (input: string, indent: number | string = 2): { output: string; error: string; parseError: ParseError | null } => {
    if (!input.trim()) return { output: '', error: '', parseError: null }
    try {
      const parsed = JSON.parse(input)
      const space = indent === 'tab' ? '\t' : Number(indent)
      return { output: JSON.stringify(parsed, null, space), error: '', parseError: null }
    } catch {
      const err = getJsonError(input)
      const error = err ? t('errors.lineCol', { line: err.line, col: err.column }) + ': ' + err.message : t('formatter.invalidJson')
      return { output: '', error, parseError: err }
    }
  }

  const minifyJson = (input: string): { output: string; error: string; parseError: ParseError | null } => {
    if (!input.trim()) return { output: '', error: '', parseError: null }
    try {
      const parsed = JSON.parse(input)
      return { output: JSON.stringify(parsed), error: '', parseError: null }
    } catch {
      const err = getJsonError(input)
      const error = err ? t('errors.lineCol', { line: err.line, col: err.column }) + ': ' + err.message : t('formatter.invalidJson')
      return { output: '', error, parseError: err }
    }
  }

  const validateJson = (input: string): { valid: boolean; error: string; parseError: ParseError | null } => {
    if (!input.trim()) return { valid: true, error: '', parseError: null }
    try {
      JSON.parse(input)
      return { valid: true, error: '', parseError: null }
    } catch {
      const err = getJsonError(input)
      const error = err ? t('errors.lineCol', { line: err.line, col: err.column }) + ': ' + err.message : t('formatter.invalidJson')
      return { valid: false, error, parseError: err }
    }
  }

  const fixJson = (input: string): { fixed: string | null; error: string; fixes: string[] } => {
    const { fixed, fixes } = fixJsonAuto(input)
    if (fixed) {
      return { fixed, error: '', fixes }
    }
    return { fixed: null, error: t('formatter.unableToFix'), fixes: [] }
  }

  const parseJson = (input: string): { data: unknown | null; error: string } => {
    if (!input.trim()) return { data: null, error: '' }
    try {
      return { data: JSON.parse(input), error: '' }
    } catch {
      return { data: null, error: (arguments[0] as any)?.message || 'Invalid JSON' }
    }
  }

  return {
    formatJson,
    minifyJson,
    validateJson,
    fixJson,
    parseJson,
  }
}
