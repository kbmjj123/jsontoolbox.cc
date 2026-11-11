/**
 * Inbound deep-link protocol — carry arbitrary JSON text into a tool page.
 *
 * Distinct from #share=: inbound data is editable, has no read-only display
 * semantics, and does not use the SharePayloadV1 structure. Everything lives
 * in the URL; decoding never performs a network request.
 *
 * Wire format is shared with app/utils/share/codec.ts:
 *   "jtb1d" header + deflate-raw bytes, then base64url.
 */
import { compressPayload, decompressPayload } from './codec'
import {
  encodeBase64url,
  decodeBase64url,
  textToBytes,
  bytesToText,
} from './base64url'
import { checkDecompressedSize, checkRawTextSize } from './limits'

/** Data lives in the URL fragment so it never reaches server logs or Referer headers. */
export const INBOUND_HASH_PREFIX = '#in='

export interface InboundPayload {
  version: 1
  text: string
  input2?: string
  label?: string
}

export type InboundFailure = 'too-large' | 'invalid'

export class InboundError extends Error {
  constructor(readonly reason: InboundFailure, message: string) {
    super(message)
    this.name = 'InboundError'
  }
}

/** Encode text into the value of a `?in=` parameter (browser-side generator). */
export async function encodeInbound(
  text: string,
  options: { input2?: string; label?: string } = {},
): Promise<string> {
  if (!checkRawTextSize(text)) {
    throw new InboundError('too-large', 'Text exceeds the raw size limit')
  }
  const payload: InboundPayload = {
    version: 1,
    text,
    ...(options.input2 != null && { input2: options.input2 }),
    ...(options.label && { label: options.label }),
  }
  const compressed = await compressPayload(textToBytes(JSON.stringify(payload)))
  return encodeBase64url(compressed)
}

/**
 * Decode a `?in=` parameter. The decoded value is plain text only — never
 * evaluated, injected into an object graph, or used as a fetch target.
 */
export async function decodeInbound(encoded: string): Promise<InboundPayload> {
  let raw: Uint8Array
  try {
    raw = await decompressPayload(decodeBase64url(encoded))
  } catch {
    throw new InboundError('invalid', 'Cannot decode inbound payload')
  }
  if (!checkDecompressedSize(raw)) {
    throw new InboundError('too-large', 'Decompressed payload exceeds the size limit')
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(bytesToText(raw))
  } catch {
    throw new InboundError('invalid', 'Invalid inbound JSON')
  }

  const candidate = parsed as Partial<InboundPayload> | null
  if (
    !candidate ||
    candidate.version !== 1 ||
    typeof candidate.text !== 'string' ||
    (candidate.input2 != null && typeof candidate.input2 !== 'string')
  ) {
    throw new InboundError('invalid', 'Invalid inbound payload shape')
  }
  if (!checkRawTextSize(candidate.text)) {
    throw new InboundError('too-large', 'Text exceeds the raw size limit')
  }

  return {
    version: 1,
    text: candidate.text,
    ...(candidate.input2 != null && { input2: candidate.input2 }),
    ...(typeof candidate.label === 'string' && { label: candidate.label }),
  }
}
