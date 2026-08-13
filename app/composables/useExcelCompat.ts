/**
 * Excel Compatibility Composable
 * Handle encoding and formatting for Excel compatibility
 * Reusable for CSV, Excel, and other spreadsheet export tools
 */
export const useExcelCompat = () => {
  /**
   * UTF-8 BOM for Excel compatibility
   */
  const UTF8_BOM = '﻿'

  /**
   * Add UTF-8 BOM to content
   * @param content - File content
   * @returns Content with BOM
   */
  const addUtf8Bom = (content: string): string => {
    return UTF8_BOM + content
  }

  /**
   * Convert string to ArrayBuffer
   * @param str - String to convert
   * @returns ArrayBuffer
   */
  const stringToArrayBuffer = (str: string): ArrayBuffer => {
    const encoder = new TextEncoder()
    return encoder.encode(str).buffer
  }

  /**
   * Convert to GBK encoding (simplified)
   * Note: Full GBK conversion requires a library, this is a fallback
   * @param content - String to convert
   * @returns ArrayBuffer with encoding
   */
  const toGbk = (content: string): ArrayBuffer => {
    // For full GBK support, would need a library like iconv-lite
    // Fallback to UTF-8 with BOM
    return stringToArrayBuffer(addUtf8Bom(content))
  }

  /**
   * Prepare CSV content for Excel
   * @param csv - CSV content
   * @param options - Encoding options
   * @returns ArrayBuffer ready for download
   */
  const prepareForExcel = (
    csv: string,
    options: {
      encoding?: 'utf-8' | 'gbk'
      addBom?: boolean
    } = {}
  ): { buffer: ArrayBuffer; mimeType: string; extension: string } => {
    const { encoding = 'utf-8', addBom = true } = options

    let content = csv
    let mimeType = 'text/csv;charset=utf-8'
    let extension = 'csv'

    if (encoding === 'gbk') {
      // GBK encoding
      content = csv // toGbk handles BOM
      mimeType = 'text/csv;charset=gbk'
      extension = 'csv'
      return {
        buffer: toGbk(content),
        mimeType,
        extension
      }
    }

    // UTF-8 with optional BOM
    if (addBom) {
      content = addUtf8Bom(csv)
    }

    return {
      buffer: stringToArrayBuffer(content),
      mimeType,
      extension
    }
  }

  /**
   * Escape value for CSV cell
   * @param value - Cell value
   * @param delimiter - Column delimiter
   * @returns Escaped value
   */
  const escapeCsvValue = (value: any, delimiter: string = ','): string => {
    if (value === null || value === undefined) return ''

    const str = String(value)

    // Check if escaping is needed
    if (
      str.includes(delimiter) ||
      str.includes('"') ||
      str.includes('\n') ||
      str.includes('\r')
    ) {
      // Escape double quotes and wrap in quotes
      return `"${str.replace(/"/g, '""')}"`
    }

    return str
  }

  /**
   * Generate CSV with proper escaping
   * @param headers - Column headers
   * @param rows - Data rows
   * @param delimiter - Column delimiter (default: ',')
   * @returns CSV string
   */
  const generateCsv = (
    headers: string[],
    rows: any[][],
    delimiter: string = ','
  ): string => {
    const headerLine = headers.map(h => escapeCsvValue(h, delimiter)).join(delimiter)
    const dataLines = rows.map(row =>
      row.map(cell => escapeCsvValue(cell, delimiter)).join(delimiter)
    )
    return [headerLine, ...dataLines].join('\n')
  }

  return {
    addUtf8Bom,
    stringToArrayBuffer,
    toGbk,
    prepareForExcel,
    escapeCsvValue,
    generateCsv,
    UTF8_BOM
  }
}
