// 格式化工具函数

/**
 * 格式化 JSON 字符串
 */
export function formatJson(json: string, indent: number = 2): string {
  try {
    const parsed = JSON.parse(json)
    return JSON.stringify(parsed, null, indent)
  } catch (e) {
    throw new Error(`Invalid JSON: ${(e as Error).message}`)
  }
}

/**
 * 压缩 JSON 字符串
 */
export function minifyJson(json: string): string {
  try {
    const parsed = JSON.parse(json)
    return JSON.stringify(parsed)
  } catch (e) {
    throw new Error(`Invalid JSON: ${(e as Error).message}`)
  }
}

/**
 * 验证 JSON 字符串
 */
export function validateJson(json: string): { valid: boolean; error?: string; line?: number; column?: number } {
  try {
    JSON.parse(json)
    return { valid: true }
  } catch (e) {
    const error = e as SyntaxError
    const match = error.message.match(/position (\d+)/)
    let line: number | undefined
    let column: number | undefined

    if (match) {
      const pos = parseInt(match[1])
      const lines = json.substring(0, pos).split('\n')
      line = lines.length
      column = lines[lines.length - 1].length + 1
    }

    return {
      valid: false,
      error: error.message,
      line,
      column
    }
  }
}

/**
 * JSON 转 CSV
 */
export function jsonToCsv(json: string, delimiter: string = ','): string {
  const data = JSON.parse(json)

  if (!Array.isArray(data)) {
    throw new Error('Input must be a JSON array')
  }

  if (data.length === 0) return ''

  // 收集所有唯一的键
  const keys = [...new Set(data.flatMap(item => Object.keys(item)))]

  const header = keys.map(key => `"${key}"`).join(delimiter)
  const rows = data.map(item =>
    keys.map(key => {
      const value = item[key]
      if (value === null || value === undefined) return ''
      const str = String(value)
      // 如果包含分隔符、引号或换行符，需要用引号包裹
      if (str.includes(delimiter) || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`
      }
      return str
    }).join(delimiter)
  )

  return [header, ...rows].join('\n')
}

/**
 * JSON 转 YAML (简单实现)
 */
export function jsonToYaml(json: string): string {
  const data = JSON.parse(json)
  return convertToYaml(data, 0)
}

function convertToYaml(data: any, indent: number): string {
  const spaces = '  '.repeat(indent)

  if (data === null || data === undefined) return 'null'
  if (typeof data === 'boolean') return data.toString()
  if (typeof data === 'number') return data.toString()
  if (typeof data === 'string') {
    if (data.includes('\n') || data.includes(':') || data.includes('#')) {
      return `"${data.replace(/"/g, '\\"')}"`
    }
    return data
  }

  if (Array.isArray(data)) {
    if (data.length === 0) return '[]'
    return data.map(item => {
      const value = convertToYaml(item, indent + 1)
      if (typeof item === 'object' && item !== null) {
        return `${spaces}- ${value.trim()}`
      }
      return `${spaces}- ${value}`
    }).join('\n')
  }

  if (typeof data === 'object') {
    const entries = Object.entries(data)
    if (entries.length === 0) return '{}'
    return entries.map(([key, value]) => {
      const yamlValue = convertToYaml(value, indent + 1)
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        return `${spaces}${key}:\n${yamlValue}`
      }
      if (Array.isArray(value) && value.length > 0) {
        return `${spaces}${key}:\n${yamlValue}`
      }
      return `${spaces}${key}: ${yamlValue}`
    }).join('\n')
  }

  return String(data)
}
