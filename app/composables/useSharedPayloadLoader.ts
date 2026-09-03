/**
 * Shared Payload Loader — receiving end
 * Reads share fragment from URL hash, decodes, validates, and returns payload
 */

import {
  decodeBase64url,
  bytesToText,
  decompressPayload,
  deserializePayload,
  checkDecompressedSize,
} from '~/utils/share'
import type { SharePayloadV1 } from '~/utils/share'

export type LoadFailureReason =
  | 'missing'          // No share fragment found
  | 'invalid_header'   // Protocol header mismatch
  | 'too_large'        // Decompressed payload exceeds limit
  | 'decode_error'     // Base64url or decompression failed
  | 'invalid_payload'  // JSON parse or schema validation failed
  | 'unsupported'      // Unsupported protocol version

export interface LoadSuccess {
  ok: true
  payload: SharePayloadV1
}

export interface LoadFailure {
  ok: false
  reason: LoadFailureReason
  detail?: string
}

export type LoadResult = LoadSuccess | LoadFailure

export const useSharedPayloadLoader = () => {
  const isSharedSession = ref(false)
  const loadResult = ref<LoadResult | null>(null)

  /**
   * Parse the hash fragment to extract the encoded share payload
   * Expected format: #share=jtb1d.<base64url-encoded>
   */
  function extractFromHash(): string | null {
    if (typeof window === 'undefined') return null

    const hash = window.location.hash
    if (!hash) return null

    // Match #share=<payload>
    const match = hash.match(/^#share=(.+)$/)
    if (!match) return null

    return match[1]
  }

  /**
   * Load and decode shared payload from URL hash
   */
  async function loadFromHash(): Promise<LoadResult> {
    const encoded = extractFromHash()

    if (!encoded) {
      const result: LoadFailure = { ok: false, reason: 'missing' }
      loadResult.value = result
      return result
    }

    try {
      // Base64URL decode
      const compressedBytes = decodeBase64url(encoded)
      console.log('[Share] Decoded bytes:', compressedBytes.length)

      // Decompress (also verifies protocol header)
      const decompressedBytes = await decompressPayload(compressedBytes)
      console.log('[Share] Decompressed bytes:', decompressedBytes.length)

      // Check decompressed size
      if (!checkDecompressedSize(decompressedBytes)) {
        const result: LoadFailure = { ok: false, reason: 'too_large' }
        loadResult.value = result
        isSharedSession.value = true
        return result
      }

      // UTF-8 decode
      const json = bytesToText(decompressedBytes)
      console.log('[Share] JSON length:', json.length)

      // Deserialize and validate
      const payload = deserializePayload(json)
      console.log('[Share] Payload validated, tool:', payload.tool)

      const result: LoadSuccess = { ok: true, payload }
      loadResult.value = result
      isSharedSession.value = true
      return result
    } catch (e) {
      const message = (e as Error).message
      console.error('[Share] Decode failed:', message)

      // Determine failure reason from error message
      let reason: LoadFailureReason = 'decode_error'
      if (message.includes('header')) reason = 'invalid_header'
      else if (message.includes('too short')) reason = 'invalid_header'
      else if (message.includes('not valid JSON') || message.includes('missing required')) {
        reason = 'invalid_payload'
      }

      const result: LoadFailure = { ok: false, reason, detail: message }
      loadResult.value = result
      isSharedSession.value = true
      return result
    }
  }

  /**
   * Check if the current payload's tool matches the expected tool
   */
  function isToolMatch(payload: SharePayloadV1, currentTool: string): boolean {
    return payload.tool === currentTool
  }

  /**
   * Clear hash from URL without triggering navigation
   */
  function clearHash(): void {
    if (typeof window === 'undefined') return
    const url = window.location.pathname + window.location.search
    window.history.replaceState({}, '', url)
  }

  return {
    isSharedSession: readonly(isSharedSession),
    loadResult: readonly(loadResult),
    loadFromHash,
    isToolMatch,
    clearHash,
  }
}
