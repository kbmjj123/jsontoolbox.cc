/**
 * JSON Share Composable
 * Generate shareable JSON links, reusable for all tools
 */
export const useShareJson = () => {
  const baseUrl = ref('')

  /**
   * Compress JSON string for URL
   */
  const compressForUrl = (json: string): string => {
    try {
      // Compress JSON first
      const parsed = JSON.parse(json)
      const minified = JSON.stringify(parsed)
      // Use LZString compression if available, otherwise use encodeURIComponent
      return btoa(unescape(encodeURIComponent(minified)))
    } catch {
      return btoa(unescape(encodeURIComponent(json)))
    }
  }

  /**
   * Decompress JSON from URL
   */
  const decompressFromUrl = (compressed: string): string => {
    try {
      return decodeURIComponent(escape(atob(compressed)))
    } catch {
      return ''
    }
  }

  /**
   * Generate share link
   */
  const generateShareUrl = (json: string, options?: {
    expires?: number  // Expiration time (hours)
    format?: string   // Output format
  }): string => {
    const compressed = compressForUrl(json)
    const params = new URLSearchParams()

    params.set('data', compressed)

    if (options?.expires) {
      params.set('expires', String(options.expires))
    }

    if (options?.format) {
      params.set('format', options.format)
    }

    // Generate unique ID (optional, for short links)
    const id = Date.now().toString(36) + Math.random().toString(36).substr(2, 5)
    params.set('id', id)

    const url = `${window.location.origin}${window.location.pathname}?${params.toString()}`
    return url
  }

  /**
   * Parse JSON data from current URL
   */
  const parseShareUrl = (): { json: string; expires?: number; format?: string } | null => {
    if (typeof window === 'undefined') return null

    const params = new URLSearchParams(window.location.search)
    const data = params.get('data')

    if (!data) return null

    const json = decompressFromUrl(data)
    const expires = params.get('expires') ? parseInt(params.get('expires')!) : undefined
    const format = params.get('format') || undefined

    // Check if expired
    const id = params.get('id')
    if (id && expires) {
      const timestamp = parseInt(id.split('').slice(0, -5).join(''), 36)
      const now = Date.now()
      const expiresMs = expires * 60 * 60 * 1000

      if (now - timestamp > expiresMs) {
        return null // Expired
      }
    }

    return { json, expires, format }
  }

  /**
   * Copy link to clipboard
   */
  const copyShareUrl = async (url: string): Promise<boolean> => {
    try {
      await navigator.clipboard.writeText(url)
      return true
    } catch {
      return false
    }
  }

  /**
   * Share to social media
   */
  const shareToSocial = (url: string, title: string, platform: 'twitter' | 'facebook' | 'linkedin') => {
    const encodedUrl = encodeURIComponent(url)
    const encodedTitle = encodeURIComponent(title)

    const urls: Record<string, string> = {
      twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`
    }

    window.open(urls[platform], '_blank', 'width=600,height=400')
  }

  return {
    generateShareUrl,
    parseShareUrl,
    copyShareUrl,
    shareToSocial,
    compressForUrl,
    decompressFromUrl
  }
}
