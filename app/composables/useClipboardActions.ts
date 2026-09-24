import type { Ref } from 'vue'
import { detectValueKind } from '~/utils/mediaPreview'

export type PasteKind = 'json' | 'url' | 'base64' | 'unknown'

export interface ClipboardActionsOptions {
  inputJson: Ref<string>
  indent: Ref<number | string>
  /**
   * Writes a value back into the document at `path`.
   * Supplied by the editor via `useNodeEditing.setValue` — when absent,
   * "replace node" is simply unavailable.
   */
  writeNode?: (path: string, value: unknown) => boolean
}

/**
 * Single home for the clipboard workflow (F12):
 * copy formatted / minified JSON, copy a node, replace a node from the
 * clipboard, and classify pasted text without ever silently rewriting it.
 */
export function useClipboardActions(options: ClipboardActionsOptions) {
  const { t } = useI18n()
  const toast = useToast()
  const { copied, copyToClipboard, readFromClipboard } = useClipboard()

  const canReplaceNode = typeof options.writeNode === 'function'

  function indentSpace(): number | string {
    return options.indent.value === 'tab' ? '\t' : Number(options.indent.value)
  }

  function parseCurrent(): unknown {
    return JSON.parse(options.inputJson.value)
  }

  async function copyFormatted(): Promise<boolean> {
    try {
      const ok = await copyToClipboard(JSON.stringify(parseCurrent(), null, indentSpace()))
      if (ok) toast.success(t('clipboard.copiedFormatted'))
      return ok
    } catch {
      toast.error(t('clipboard.needsValidJson'))
      return false
    }
  }

  async function copyMinified(): Promise<boolean> {
    try {
      const ok = await copyToClipboard(JSON.stringify(parseCurrent()))
      if (ok) toast.success(t('clipboard.copiedMinified'))
      return ok
    } catch {
      toast.error(t('clipboard.needsValidJson'))
      return false
    }
  }

  /** Copy a node's value: objects/arrays as pretty JSON, primitives raw. */
  async function copyNode(value: unknown): Promise<boolean> {
    const text =
      value !== null && typeof value === 'object'
        ? JSON.stringify(value, null, 2)
        : String(value ?? '')
    const ok = await copyToClipboard(text)
    if (ok) toast.success(t('clipboard.copiedNode'))
    return ok
  }

  /** Replace the node at `path` with whatever is currently on the clipboard. */
  async function replaceNode(path: string): Promise<boolean> {
    if (!options.writeNode) return false
    const text = await readFromClipboard()
    if (text === null) {
      toast.error(t('clipboard.readFailed'))
      return false
    }
    // Prefer a JSON interpretation; otherwise keep the raw text as a string.
    let value: unknown = text
    try {
      value = JSON.parse(text)
    } catch {
      /* keep raw string */
    }
    const ok = options.writeNode(path, value)
    if (ok) toast.success(t('clipboard.replacedNode'))
    return ok
  }

  /** Classify pasted text so the UI can hint instead of guessing. */
  function detectPasteKind(text: string): PasteKind {
    const value = text.trim()
    if (!value) return 'unknown'
    try {
      JSON.parse(value)
      return 'json'
    } catch {
      /* not JSON */
    }
    const kind = detectValueKind(value)
    if (kind === 'url' || kind === 'image' || kind === 'audio' || kind === 'video' || kind === 'pdf') return 'url'
    if (kind === 'base64') return 'base64'
    return 'unknown'
  }

  /**
   * Light hint after a paste. Never rewrites the pasted content — URL / Base64
   * are only reported, JSON formatting is done by the editor's own formatter.
   */
  function hintAfterPaste(text: string) {
    switch (detectPasteKind(text)) {
      case 'json':
        toast.success(t('clipboard.pasteAsJson'))
        break
      case 'url':
        toast.info(t('clipboard.pasteAsUrl'))
        break
      case 'base64':
        toast.info(t('clipboard.pasteAsBase64'))
        break
    }
  }

  return {
    copied,
    canReplaceNode,
    copyFormatted,
    copyMinified,
    copyNode,
    replaceNode,
    detectPasteKind,
    hintAfterPaste,
  }
}
