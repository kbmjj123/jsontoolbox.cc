/**
 * Share protocol utilities — barrel export
 */

// Base64URL encoding
export { encodeBase64url, decodeBase64url, textToBytes, bytesToText } from './base64url'

// Compression codec (deflate-raw)
export { compressPayload, decompressPayload } from './codec'

// Payload types and serialization
export type { SharePayloadV1, ShareToolId } from './payload'
export { serializePayload, deserializePayload, validatePayloadStructure } from './payload'

// Payload factory
export type { CreatePayloadInput } from './schema'
export { createSharePayload } from './schema'

// Size limits
export {
  RECOMMENDED_MAX,
  WARNING_MAX,
  HARD_MAX,
  DECOMPRESSED_MAX,
  RAW_TEXT_MAX,
  checkUrlLength,
  checkDecompressedSize,
  checkRawTextSize,
} from './limits'
export type { UrlLengthStatus } from './limits'
