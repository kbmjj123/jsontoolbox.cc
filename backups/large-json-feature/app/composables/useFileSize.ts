/**
 * File Size Detection Composable
 * Detects and classifies JSON file sizes for performance-aware processing
 */
export type FileSizeCategory = 'small' | 'medium' | 'large'

export const useFileSize = () => {
  // SPLIT = the boundary between the daily synchronous path (< SPLIT, parsed
  // instantly on the main thread) and the worker/on-demand path (>= SPLIT, rare
  // huge files). Kept high on purpose: JSON.parse + a virtualized tree render
  // is perfectly smooth up to ~20MB, so the bulk of real usage never pays the
  // worker round-trip cost. Only genuinely large files take the heavy path.
  const SIZE_THRESHOLDS = {
    SMALL: 20 * 1024 * 1024,   // 20 MB — sync path below this
    MEDIUM: 100 * 1024 * 1024, // 100 MB
  }

  const fileSizeBytes = ref(0)
  const fileSizeCategory = ref<FileSizeCategory>('small')

  /**
   * Detect file size from text and/or File object
   * File.size is more accurate; text.length * 2 is a fallback estimate
   */
  function detectSize(text: string, file?: File) {
    const bytes = file ? file.size : text.length * 2
    fileSizeBytes.value = bytes
    if (bytes < SIZE_THRESHOLDS.SMALL) {
      fileSizeCategory.value = 'small'
    }
    else if (bytes < SIZE_THRESHOLDS.MEDIUM) {
      fileSizeCategory.value = 'medium'
    }
    else {
      fileSizeCategory.value = 'large'
    }
  }

  /**
   * Format bytes to human-readable string
   */
  function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
  }

  /**
   * Check if text is a large file (>= 5 MB)
   */
  function isLargeFile(text: string): boolean {
    return text.length * 2 >= SIZE_THRESHOLDS.SMALL
  }

  /**
   * Get the first N bytes of text (for partial parsing)
   */
  function getPartialText(text: string, maxBytes: number): string {
    const maxChars = Math.floor(maxBytes / 2)
    if (text.length <= maxChars) return text
    // Find a valid JSON break point (try to end at a comma or array element boundary)
    let cutPoint = maxChars
    const bracketStack: string[] = []
    for (let i = 0; i < maxChars; i++) {
      if (text[i] === '{' || text[i] === '[') bracketStack.push(text[i])
      else if (text[i] === '}') bracketStack.pop()
      else if (text[i] === ']') bracketStack.pop()
    }
    // Try to find a clean break at a comma
    for (let i = maxChars - 1; i > maxChars - 1000 && i > 0; i--) {
      if (text[i] === ',' && bracketStack.length === 0) {
        cutPoint = i
        break
      }
    }
    return text.substring(0, cutPoint)
  }

  return {
    fileSizeBytes: readonly(fileSizeBytes),
    fileSizeCategory: readonly(fileSizeCategory),
    detectSize,
    formatBytes,
    isLargeFile,
    getPartialText,
    SIZE_THRESHOLDS,
  }
}
