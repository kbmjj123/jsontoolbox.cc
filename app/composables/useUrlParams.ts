/**
 * URL Params Composable
 * Handle URL parameter operations for loading/saving data
 * Reusable for all tools that support URL-based input
 */
export const useUrlParams = () => {
  /**
   * Get URL search params
   * @returns URLSearchParams object
   */
  const getSearchParams = (): URLSearchParams => {
    if (typeof window === 'undefined') return new URLSearchParams()
    return new URLSearchParams(window.location.search)
  }

  /**
   * Get a specific URL param
   * @param key - Param key
   * @returns Param value or null
   */
  const getParam = (key: string): string | null => {
    return getSearchParams().get(key)
  }

  /**
   * Set a URL param
   * @param key - Param key
   * @param value - Param value
   * @param replace - Replace current history entry (default: false)
   */
  const setParam = (key: string, value: string, replace: boolean = false): void => {
    if (typeof window === 'undefined') return

    const params = getSearchParams()
    params.set(key, value)

    const newUrl = `${window.location.pathname}?${params.toString()}`

    if (replace) {
      window.history.replaceState({}, '', newUrl)
    } else {
      window.history.pushState({}, '', newUrl)
    }
  }

  /**
   * Remove a URL param
   * @param key - Param key to remove
   */
  const removeParam = (key: string): void => {
    if (typeof window === 'undefined') return

    const params = getSearchParams()
    params.delete(key)

    const newUrl = params.toString()
      ? `${window.location.pathname}?${params.toString()}`
      : window.location.pathname

    window.history.replaceState({}, '', newUrl)
  }

  /**
   * Load data from URL param
   * @param key - Param key (default: 'data')
   * @returns Decoded data or null
   */
  const loadDataFromUrl = (key: string = 'data'): string | null => {
    const encoded = getParam(key)
    if (!encoded) return null

    try {
      // Try base64 decode
      return decodeURIComponent(escape(atob(encoded)))
    } catch {
      // Fallback: return as-is
      return encoded
    }
  }

  /**
   * Save data to URL param
   * @param data - Data to save
   * @param key - Param key (default: 'data')
   */
  const saveDataToUrl = (data: string, key: string = 'data'): void => {
    try {
      const encoded = btoa(unescape(encodeURIComponent(data)))
      setParam(key, encoded)
    } catch {
      // Fallback: save as-is (for very large data)
      setParam(key, data.substring(0, 2000))
    }
  }

  /**
   * Generate shareable URL with data
   * @param data - Data to include
   * @param options - Options
   * @returns Shareable URL string
   */
  const generateShareUrl = (
    data: string,
    options: {
      key?: string
      baseUrl?: string
    } = {}
  ): string => {
    const { key = 'data', baseUrl } = options

    if (typeof window === 'undefined') return ''

    const base = baseUrl || window.location.origin + window.location.pathname
    const encoded = btoa(unescape(encodeURIComponent(data)))

    return `${base}?${key}=${encoded}`
  }

  /**
   * Clear all URL params
   */
  const clearAllParams = (): void => {
    if (typeof window === 'undefined') return
    window.history.replaceState({}, '', window.location.pathname)
  }

  /**
   * Get all params as object
   * @returns Object with all params
   */
  const getAllParams = (): Record<string, string> => {
    const params = getSearchParams()
    const result: Record<string, string> = {}

    params.forEach((value, key) => {
      result[key] = value
    })

    return result
  }

  return {
    getSearchParams,
    getParam,
    setParam,
    removeParam,
    loadDataFromUrl,
    saveDataToUrl,
    generateShareUrl,
    clearAllParams,
    getAllParams
  }
}
