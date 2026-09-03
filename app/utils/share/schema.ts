/**
 * Share payload factory — creates a validated SharePayloadV1 from tool input
 */

import type { SharePayloadV1, ShareToolId } from './payload'

export interface CreatePayloadInput {
  /** Which tool created this share */
  tool: ShareToolId

  /** Raw text from the editor (preserved as-is) */
  rawText: string

  /** Whether the raw text is valid JSON */
  isValidJson: boolean

  /** Display configuration */
  display: {
    readOnly: boolean
    preferredView: 'formatted' | 'tree' | 'code'
  }

  /** Tool-specific state needed to reproduce the view */
  toolState?: {
    indentSize?: 2 | 4 | 'tab'
    sortKeys?: boolean
  }

  /** Validation result metadata (for validator tool) */
  validation?: {
    message?: string
    line?: number
    column?: number
  }

  /** Optional metadata */
  meta?: {
    title?: string
    source?: 'manual' | 'blog-example' | 'embed'
  }
}

/**
 * Create a SharePayloadV1 from tool input
 */
export function createSharePayload(input: CreatePayloadInput): SharePayloadV1 {
  return {
    version: 1,
    tool: input.tool,
    content: {
      rawText: input.rawText,
      kind: input.isValidJson ? 'json' : 'invalid-json',
    },
    display: {
      readOnly: input.display.readOnly,
      preferredView: input.display.preferredView,
    },
    ...(input.toolState && { toolState: input.toolState }),
    ...(input.validation && { validation: input.validation }),
    ...(input.meta && { meta: input.meta }),
  }
}
