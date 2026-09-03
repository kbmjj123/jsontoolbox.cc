/**
 * Share URL length thresholds and size limits
 *
 * URL length limits are conservative to ensure links work reliably
 * across chat apps, email clients, markdown renderers, and QR codes.
 */

/** URL length ≤ this value: safe to copy/share */
export const RECOMMENDED_MAX = 1500

/** URL length between recommended and warning: usable but may be truncated in some contexts */
export const WARNING_MAX = 2000

/** URL length above this: refuse to generate URL, suggest download instead */
export const HARD_MAX = 4000

/** Maximum decompressed payload size (256 KB) */
export const DECOMPRESSED_MAX = 256 * 1024

/** Maximum raw text length before compression (512 KB) */
export const RAW_TEXT_MAX = 512 * 1024

export type UrlLengthStatus = 'ok' | 'warning' | 'too_large'

/**
 * Check if the encoded URL length is within acceptable bounds
 */
export function checkUrlLength(encodedLength: number): UrlLengthStatus {
  if (encodedLength <= RECOMMENDED_MAX) return 'ok'
  if (encodedLength <= WARNING_MAX) return 'warning'
  if (encodedLength <= HARD_MAX) return 'too_large'
  return 'too_large'
}

/**
 * Check if decompressed payload size is within limits
 */
export function checkDecompressedSize(bytes: Uint8Array): boolean {
  return bytes.length <= DECOMPRESSED_MAX
}

/**
 * Check if raw text is within limits before processing
 */
export function checkRawTextSize(text: string): boolean {
  return text.length <= RAW_TEXT_MAX
}
