#!/usr/bin/env node
/**
 * Generate a `#in=` inbound deep link for any tool page.
 *
 * The encoding matches app/utils/share/codec.ts exactly:
 *   "jtb1d" header + deflate-raw bytes, then base64url.
 * The payload is placed in the URL fragment, so it never reaches server logs
 * or Referer headers. No network request is ever made.
 *
 * Usage:
 *   echo '{"a":1}' | node scripts/make-inbound-url.mjs /tools/format/json-editor
 *   node scripts/make-inbound-url.mjs /tools/format/json-repair ./broken.json
 *   node scripts/make-inbound-url.mjs /tools/format/json-schema-validator ./data.json --input2 ./schema.json
 *   node scripts/make-inbound-url.mjs /tools/view/large-json-viewer ./orders.json --label "Order sample"
 */
import { deflateRawSync, inflateRawSync } from 'node:zlib'
import { readFileSync } from 'node:fs'

const HEADER = Buffer.from('jtb1d')
const HARD_MAX = 4000
const RAW_TEXT_MAX = 512 * 1024
const DECOMPRESSED_MAX = 256 * 1024
const ORIGIN = process.env.JSON_TOOLBOX_ORIGIN || 'https://jsontoolbox.cc'

const args = process.argv.slice(2)
const toolPath = args[0]

if (!toolPath || !toolPath.startsWith('/tools/')) {
  console.error('Usage: node scripts/make-inbound-url.mjs /tools/{category}/{slug} [file] [--input2 file] [--label text]')
  process.exit(1)
}

const flagValue = (name) => {
  const index = args.indexOf(name)
  return index >= 0 ? args[index + 1] : undefined
}

const inputFile = args[1] && !args[1].startsWith('--') ? args[1] : undefined
const input2File = flagValue('--input2')
const label = flagValue('--label')

let text
try {
  text = inputFile ? readFileSync(inputFile, 'utf8') : readFileSync(0, 'utf8')
} catch (err) {
  console.error(`Cannot read input: ${err.message}`)
  process.exit(1)
}

if (!text.trim()) {
  console.error('Input is empty')
  process.exit(1)
}
if (text.length > RAW_TEXT_MAX) {
  console.error(`Input is ${text.length} chars, over the ${RAW_TEXT_MAX} limit`)
  process.exit(1)
}

const payload = { version: 1, text }
if (input2File) {
  try {
    payload.input2 = readFileSync(input2File, 'utf8')
  } catch (err) {
    console.error(`Cannot read --input2: ${err.message}`)
    process.exit(1)
  }
}
if (label) payload.label = label

// Match the browser-side checkDecompressedSize() limit on UTF-8 bytes.
const serialized = JSON.stringify(payload)
const payloadBytes = Buffer.byteLength(serialized, 'utf8')
if (payloadBytes > DECOMPRESSED_MAX) {
  console.error(`Payload is ${payloadBytes} UTF-8 bytes, over the ${DECOMPRESSED_MAX} limit`)
  process.exit(1)
}

const compressed = deflateRawSync(Buffer.from(serialized, 'utf8'), { level: 6 })
const encoded = Buffer.concat([HEADER, compressed])
  .toString('base64')
  .replace(/\+/g, '-')
  .replace(/\//g, '_')
  .replace(/=+$/, '')

const url = `${ORIGIN}${toolPath}#in=${encoded}`

// Self-check: verify the wire format can be decoded back with raw inflate.
const roundTrip = Buffer.from(encoded.replace(/-/g, '+').replace(/_/g, '/'), 'base64')
if (roundTrip.subarray(0, HEADER.length).toString() !== 'jtb1d') {
  console.error('Encoding self-check failed: bad header')
  process.exit(1)
}
try {
  const parsed = JSON.parse(inflateRawSync(roundTrip.subarray(HEADER.length)).toString('utf8'))
  if (parsed.version !== 1 || parsed.text !== text) {
    throw new Error('payload mismatch')
  }
} catch (err) {
  console.error(`Encoding self-check failed: ${err.message}`)
  process.exit(1)
}

console.error(`raw ${text.length} chars -> encoded ${encoded.length} chars -> URL ${url.length} chars`)
console.error('Note: JSON is encoded in the URL fragment. Do not use this for passwords, tokens or other sensitive data.')
if (url.length > HARD_MAX) {
  console.error(`URL is ${url.length} chars, over the ${HARD_MAX} hard limit. Use a smaller sample or a downloadable file.`)
  process.exit(1)
}

console.log(url)
