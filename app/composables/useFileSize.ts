/**
 * File Size Detection Composable
 *
 * There is exactly one size rule in the app, and it lives in `useLargeFile`:
 *
 *   - <= LARGE_FILE_MAX_BYTES → "normal" pages handle it with `JSON.parse`
 *     on the main thread (full editing, formatting, tree browsing).
 *   - >  LARGE_FILE_MAX_BYTES → the input is handed off to the Large JSON
 *     Explorer, the single page that owns large-file machinery.
 *
 * This composable only measures and reports. It never decides how to parse.
 */
import { LARGE_FILE_MAX_BYTES, byteLength } from './useLargeFile'

export interface FileSizeInfo {
  bytes: number
  /** True when the input must go to the Large JSON Explorer instead. */
  oversized: boolean
}

export const useFileSize = () => {
  const fileSizeBytes = ref(0)
  const isOversized = ref(false)

  /**
   * Measure an input. `File.size` is exact; the text fallback measures the real
   * UTF-8 length instead of the old `length * 2` estimate, so a 5 MB ASCII file
   * is no longer reported as 10 MB.
   */
  function detectSize(text: string, file?: File): FileSizeInfo {
    const bytes = file ? file.size : byteLength(text)
    fileSizeBytes.value = bytes
    isOversized.value = bytes > LARGE_FILE_MAX_BYTES
    return { bytes, oversized: isOversized.value }
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

  return {
    fileSizeBytes: readonly(fileSizeBytes),
    isOversized: readonly(isOversized),
    detectSize,
    formatBytes,
    LARGE_FILE_MAX_BYTES,
  }
}
