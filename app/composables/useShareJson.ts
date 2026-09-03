/**
 * JSON Share Composable
 * Handles share modal state, payload encoding, and download/copy operations
 */

import {
  encodeBase64url,
  textToBytes,
  compressPayload,
  serializePayload,
  createSharePayload,
  checkUrlLength,
  checkRawTextSize,
  RECOMMENDED_MAX,
  WARNING_MAX,
  HARD_MAX,
} from '~/utils/share'
import type { SharePayloadV1, ShareToolId, CreatePayloadInput } from '~/utils/share'
import { useSensitiveFieldDetection } from './useSensitiveFieldDetection'
import type { SensitiveField } from './useSensitiveFieldDetection'

export type ShareModalState =
  | 'idle'
  | 'analyzing'
  | 'sensitive-warning'
  | 'ready'
  | 'generating'
  | 'success'
  | 'too-large'
  | 'error'

export interface ShareInput {
  getPayload: () => CreatePayloadInput
}

export interface ShareResult {
  url: string | null
  urlLength: number
  tooLarge: boolean
  sensitiveFields: SensitiveField[]
}

export const useShareJson = () => {
  const { t } = useI18n()
  const { scanJson } = useSensitiveFieldDetection()
  const { copyToClipboard, downloadAsFile } = useClipboard()

  // Modal state machine
  const modalState = ref<ShareModalState>('idle')
  const currentPayload = ref<SharePayloadV1 | null>(null)
  const shareUrl = ref<string | null>(null)
  const urlLength = ref(0)
  const detectedSensitive = ref<SensitiveField[]>([])
  const errorMessage = ref('')
  const shareTitle = ref('')

  // Computed
  const isOpen = computed(() => modalState.value !== 'idle')

  /**
   * Open share modal with analysis
   */
  async function openShare(input: ShareInput): Promise<void> {
    modalState.value = 'analyzing'
    shareTitle.value = ''
    errorMessage.value = ''

    try {
      const payloadInput = input.getPayload()

      // Check raw text size
      if (!checkRawTextSize(payloadInput.rawText)) {
        modalState.value = 'too-large'
        currentPayload.value = null
        return
      }

      // Create payload
      const payload = createSharePayload(payloadInput)
      currentPayload.value = payload

      // Detect sensitive fields
      const sensitiveFields = scanJson(payloadInput.rawText)
      detectedSensitive.value = sensitiveFields

      if (sensitiveFields.length > 0) {
        modalState.value = 'sensitive-warning'
        return
      }

      // Proceed to ready state
      modalState.value = 'ready'
    } catch (e) {
      errorMessage.value = (e as Error).message
      modalState.value = 'error'
    }
  }

  /**
   * Skip sensitive warning and proceed to ready
   */
  function shareAnyway(): void {
    modalState.value = 'ready'
  }

  /**
   * Generate the share URL and copy to clipboard
   */
  async function generateAndCopy(): Promise<void> {
    if (!currentPayload.value) {
      modalState.value = 'error'
      errorMessage.value = 'No payload to share'
      return
    }

    modalState.value = 'generating'

    try {
      // Serialize payload
      const json = serializePayload(currentPayload.value)
      const bytes = textToBytes(json)

      // Compress
      const compressed = await compressPayload(bytes)

      // Encode to base64url
      const encoded = encodeBase64url(compressed)

      // Build URL
      const origin = window.location.origin
      const path = getToolPath(currentPayload.value.tool)
      const url = `${origin}${path}#share=${encoded}`

      // Check length
      const lengthStatus = checkUrlLength(url.length)
      urlLength.value = url.length

      if (lengthStatus === 'too_large') {
        modalState.value = 'too-large'
        shareUrl.value = null
        return
      }

      shareUrl.value = url

      // Copy to clipboard
      const success = await copyToClipboard(url)

      if (success) {
        modalState.value = 'success'
      } else {
        modalState.value = 'error'
        errorMessage.value = t('share.copyFailed')
      }
    } catch (e) {
      modalState.value = 'error'
      errorMessage.value = (e as Error).message
    }
  }

  /**
   * Copy the existing share URL again
   */
  async function copyAgain(): Promise<boolean> {
    if (!shareUrl.value) return false
    return await copyToClipboard(shareUrl.value)
  }

  /**
   * Open the share URL in a new tab
   */
  function openLink(): void {
    if (shareUrl.value) {
      window.open(shareUrl.value, '_blank')
    }
  }

  /**
   * Download the payload as a JSON share package
   */
  function downloadSharePackage(): void {
    if (!currentPayload.value) return

    const pkg = {
      format: 'jsontoolbox-share',
      version: 1,
      payload: currentPayload.value,
    }

    const filename = shareTitle.value
      ? `${slugify(shareTitle.value)}.json`
      : 'jsontoolbox-share-v1.json'

    downloadAsFile(JSON.stringify(pkg, null, 2), filename, 'application/json;charset=utf-8')
  }

  /**
   * Download the raw text as .json or .txt
   */
  function downloadOriginal(): void {
    if (!currentPayload.value) return

    const { rawText, kind } = currentPayload.value.content
    const isValid = kind === 'json'

    const filename = shareTitle.value
      ? `${slugify(shareTitle.value)}.${isValid ? 'json' : 'txt'}`
      : `shared-json.${isValid ? 'json' : 'txt'}`

    const mimeType = isValid ? 'application/json;charset=utf-8' : 'text/plain;charset=utf-8'
    downloadAsFile(rawText, filename, mimeType)
  }

  /**
   * Use native Web Share API if available
   */
  async function nativeShare(): Promise<boolean> {
    if (!shareUrl.value || !navigator.share) return false

    try {
      await navigator.share({
        title: shareTitle.value || 'Shared JSON',
        text: t('share.nativeShareText'),
        url: shareUrl.value,
      })
      return true
    } catch {
      // User cancelled or API not available
      return false
    }
  }

  /**
   * Close modal and reset state
   */
  function closeModal(): void {
    modalState.value = 'idle'
    currentPayload.value = null
    shareUrl.value = null
    urlLength.value = 0
    detectedSensitive.value = []
    errorMessage.value = ''
    shareTitle.value = ''
  }

  /**
   * Retry from error state
   */
  function retry(): void {
    modalState.value = 'ready'
    errorMessage.value = ''
  }

  /**
   * Check if native share is available
   */
  const canNativeShare = computed(() => {
    return typeof navigator !== 'undefined' && !!navigator.share
  })

  /**
   * URL length status
   */
  const urlLengthStatus = computed(() => {
    if (urlLength.value === 0) return 'ok'
    return checkUrlLength(urlLength.value)
  })

  return {
    // State
    modalState: readonly(modalState),
    currentPayload: readonly(currentPayload),
    shareUrl: readonly(shareUrl),
    urlLength: readonly(urlLength),
    detectedSensitive: readonly(detectedSensitive),
    errorMessage: readonly(errorMessage),
    shareTitle,
    isOpen,
    canNativeShare,
    urlLengthStatus,

    // Actions
    openShare,
    shareAnyway,
    generateAndCopy,
    copyAgain,
    openLink,
    downloadSharePackage,
    downloadOriginal,
    nativeShare,
    closeModal,
    retry,
  }
}

/**
 * Map tool id to its URL path
 * All tools share the same json-editor page since they are integrated
 */
function getToolPath(tool: ShareToolId): string {
  return '/tools/format/json-editor'
}

/**
 * Create a safe filename slug from a title
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 64) || 'shared-json'
}
