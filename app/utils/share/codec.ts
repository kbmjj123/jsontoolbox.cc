/**
 * Share payload codec — deflate-raw compression with native + fflate fallback
 *
 * Protocol header (4 bytes): jtb1d
 *   jtb  = JsonToolBox identifier
 *   1    = protocol version
 *   d    = deflate-raw codec
 */

const HEADER = new Uint8Array([0x6a, 0x74, 0x62, 0x31, 0x64]) // "jtb1d"
const HEADER_LEN = HEADER.length

/**
 * Check if the browser supports native CompressionStream (deflate-raw)
 */
function hasNativeCompression(): boolean {
  return typeof CompressionStream !== 'undefined'
    && typeof DecompressionStream !== 'undefined'
}

/**
 * Compress bytes using native CompressionStream (deflate-raw)
 */
async function nativeCompress(input: Uint8Array): Promise<Uint8Array> {
  const cs = new CompressionStream('deflate-raw')
  const writer = cs.writable.getWriter()
  writer.write(input)
  writer.close()

  const reader = cs.readable.getReader()
  const chunks: Uint8Array[] = []
  let totalLen = 0

  while (true) {
    const { value, done } = await reader.read()
    if (done) break
    chunks.push(value)
    totalLen += value.length
  }

  const result = new Uint8Array(totalLen)
  let offset = 0
  for (const chunk of chunks) {
    result.set(chunk, offset)
    offset += chunk.length
  }
  return result
}

/**
 * Decompress bytes using native DecompressionStream (deflate-raw)
 */
async function nativeDecompress(input: Uint8Array): Promise<Uint8Array> {
  const ds = new DecompressionStream('deflate-raw')
  const writer = ds.writable.getWriter()
  writer.write(input)
  writer.close()

  const reader = ds.readable.getReader()
  const chunks: Uint8Array[] = []
  let totalLen = 0

  while (true) {
    const { value, done } = await reader.read()
    if (done) break
    chunks.push(value)
    totalLen += value.length
  }

  if (totalLen === 0) {
    throw new Error('Decompression produced empty output')
  }

  const result = new Uint8Array(totalLen)
  let offset = 0
  for (const chunk of chunks) {
    result.set(chunk, offset)
    offset += chunk.length
  }
  return result
}

/**
 * Compress using fflate (dynamic import fallback)
 */
async function fflateCompress(input: Uint8Array): Promise<Uint8Array> {
  const { deflateSync } = await import('fflate')
  // fflate's deflateSync produces raw deflate (no zlib wrapper)
  return deflateSync(input, { level: 6 })
}

/**
 * Decompress using fflate (dynamic import fallback)
 */
async function fflateDecompress(input: Uint8Array): Promise<Uint8Array> {
  const { inflateSync } = await import('fflate')
  return inflateSync(input)
}

/**
 * Compress payload bytes and prepend protocol header
 */
export async function compressPayload(input: Uint8Array): Promise<Uint8Array> {
  let compressed: Uint8Array

  if (hasNativeCompression()) {
    compressed = await nativeCompress(input)
  } else {
    compressed = await fflateCompress(input)
  }

  // Prepend header: jtb1d + compressed data
  const result = new Uint8Array(HEADER_LEN + compressed.length)
  result.set(HEADER, 0)
  result.set(compressed, HEADER_LEN)
  return result
}

/**
 * Decompress payload bytes after verifying protocol header
 * Tries native DecompressionStream first, falls back to fflate
 */
export async function decompressPayload(input: Uint8Array): Promise<Uint8Array> {
  // Verify header
  if (input.length < HEADER_LEN) {
    throw new Error('Share payload too short')
  }

  for (let i = 0; i < HEADER_LEN; i++) {
    if (input[i] !== HEADER[i]) {
      throw new Error('Invalid share payload header')
    }
  }

  const compressed = input.slice(HEADER_LEN)

  // Try native first
  if (hasNativeCompression()) {
    try {
      return await nativeDecompress(compressed)
    } catch {
      // Native failed, try fflate fallback
    }
  }

  // Fallback to fflate
  return await fflateDecompress(compressed)
}
