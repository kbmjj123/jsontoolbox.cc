/**
 * Share payload type definitions and serialization
 */

export type ShareToolId =
  | 'json-formatter'
  | 'json-viewer'
  | 'json-validator'

export interface SharePayloadV1 {
  version: 1
  tool: ShareToolId

  content: {
    rawText: string
    kind: 'json' | 'invalid-json'
  }

  display: {
    readOnly: boolean
    preferredView: 'formatted' | 'tree' | 'code'
  }

  toolState?: {
    indentSize?: 2 | 4 | 'tab'
    sortKeys?: boolean
  }

  validation?: {
    message?: string
    line?: number
    column?: number
  }

  meta?: {
    title?: string
    source?: 'manual' | 'blog-example' | 'embed'
  }
}

/**
 * Serialize a SharePayloadV1 to a JSON string
 */
export function serializePayload(payload: SharePayloadV1): string {
  return JSON.stringify(payload)
}

/**
 * Deserialize a JSON string to SharePayloadV1 with strict validation
 */
export function deserializePayload(json: string): SharePayloadV1 {
  let data: unknown

  try {
    data = JSON.parse(json)
  } catch {
    throw new Error('Invalid share payload: not valid JSON')
  }

  if (!validatePayloadStructure(data)) {
    throw new Error('Invalid share payload: missing required fields')
  }

  return data as SharePayloadV1
}

/**
 * Strict schema validation for SharePayloadV1
 */
export function validatePayloadStructure(data: unknown): data is SharePayloadV1 {
  if (!data || typeof data !== 'object') return false

  const obj = data as Record<string, unknown>

  // version must be 1
  if (obj.version !== 1) return false

  // tool must be a known tool id
  const validTools: ShareToolId[] = ['json-formatter', 'json-viewer', 'json-validator']
  if (!validTools.includes(obj.tool as ShareToolId)) return false

  // content is required
  if (!obj.content || typeof obj.content !== 'object') return false
  const content = obj.content as Record<string, unknown>
  if (typeof content.rawText !== 'string') return false
  if (content.kind !== 'json' && content.kind !== 'invalid-json') return false

  // display is required
  if (!obj.display || typeof obj.display !== 'object') return false
  const display = obj.display as Record<string, unknown>
  if (typeof display.readOnly !== 'boolean') return false
  const validViews = ['formatted', 'tree', 'code']
  if (!validViews.includes(display.preferredView as string)) return false

  // toolState is optional but if present must be an object
  if (obj.toolState !== undefined) {
    if (typeof obj.toolState !== 'object' || obj.toolState === null) return false
  }

  // validation is optional but if present must be an object
  if (obj.validation !== undefined) {
    if (typeof obj.validation !== 'object' || obj.validation === null) return false
  }

  // meta is optional but if present must be an object
  if (obj.meta !== undefined) {
    if (typeof obj.meta !== 'object' || obj.meta === null) return false
  }

  return true
}
