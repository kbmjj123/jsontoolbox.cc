/**
 * Table Preview Composable
 * Render data as a preview table
 * Reusable for CSV, Excel, and other tabular data tools
 */
export const useTablePreview = () => {
  /**
   * Convert data to table format
   * @param data - Array of objects
   * @param maxRows - Maximum rows to display (default: 100)
   * @returns Table data with headers and rows
   */
  const toTableData = (
    data: Record<string, any>[],
    maxRows: number = 100
  ): { headers: string[]; rows: any[][]; totalRows: number } => {
    if (!data || data.length === 0) {
      return { headers: [], rows: [], totalRows: 0 }
    }

    // Get all unique keys as headers
    const headers = [...new Set(data.flatMap(item => Object.keys(item)))]

    // Convert to rows
    const rows = data.slice(0, maxRows).map(item =>
      headers.map(key => {
        const value = item[key]
        if (value === null || value === undefined) return ''
        if (typeof value === 'object') return JSON.stringify(value)
        return String(value)
      })
    )

    return {
      headers,
      rows,
      totalRows: data.length
    }
  }

  /**
   * Truncate cell value for display
   * @param value - Cell value
   * @param maxLength - Maximum length (default: 50)
   * @returns Truncated value
   */
  const truncateCell = (value: string, maxLength: number = 50): string => {
    if (value.length <= maxLength) return value
    return value.substring(0, maxLength - 3) + '...'
  }

  /**
   * Calculate column widths based on content
   * @param headers - Column headers
   * @param rows - Data rows
   * @param maxWidth - Maximum column width (default: 200)
   * @returns Array of column widths
   */
  const calculateColumnWidths = (
    headers: string[],
    rows: any[][],
    maxWidth: number = 200
  ): number[] => {
    return headers.map((header, index) => {
      const headerWidth = header.length * 8 + 24 // Approximate width
      const contentWidth = Math.max(
        ...rows.map(row => (row[index] || '').length * 8 + 16)
      )
      return Math.min(Math.max(headerWidth, contentWidth, 80), maxWidth)
    })
  }

  return {
    toTableData,
    truncateCell,
    calculateColumnWidths
  }
}
