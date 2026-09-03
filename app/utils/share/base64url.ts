/**
 * Base64URL encoding/decoding for share payloads
 * Differs from standard base64: +→- /→_ and no = padding
 */

/**
 * Encode a Uint8Array to a base64url string
 */
export function encodeBase64url(bytes: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

/**
 * Decode a base64url string to a Uint8Array
 */
export function decodeBase64url(str: string): Uint8Array {
  // Restore standard base64 characters and add padding
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/')
  const padding = (4 - (base64.length % 4)) % 4
  base64 += '='.repeat(padding)

  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

/**
 * Encode a UTF-8 string to Uint8Array
 */
export function textToBytes(text: string): Uint8Array {
  return new TextEncoder().encode(text)
}

/**
 * Decode a Uint8Array to a UTF-8 string
 */
export function bytesToText(bytes: Uint8Array): string {
  return new TextDecoder().decode(bytes)
}
