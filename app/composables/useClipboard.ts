/**
 * Clipboard Composable
 * Handle copy/paste operations for text and files
 * Reusable for all tools
 */
export const useClipboard = () => {
  const copied = ref(false)
  const copyError = ref('')

  /**
   * Copy text to clipboard
   * @param text - Text to copy
   * @param timeout - Copied state timeout in ms (default: 2000)
   * @returns Promise<boolean> - Success status
   */
  const copyToClipboard = async (text: string, timeout: number = 2000): Promise<boolean> => {
    try {
      await navigator.clipboard.writeText(text)
      copied.value = true
      copyError.value = ''

      setTimeout(() => {
        copied.value = false
      }, timeout)

      return true
    } catch (e) {
      copyError.value = (e as Error).message
      copied.value = false
      return false
    }
  }

  /**
   * Read text from clipboard
   * @returns Promise<string | null> - Clipboard content or null
   */
  const readFromClipboard = async (): Promise<string | null> => {
    try {
      const text = await navigator.clipboard.readText()
      return text
    } catch (e) {
      copyError.value = (e as Error).message
      return null
    }
  }

  /**
   * Download text as file
   * @param content - File content
   * @param filename - File name
   * @param mimeType - MIME type (default: text/plain)
   */
  const downloadAsFile = (
    content: string,
    filename: string,
    mimeType: string = 'text/plain'
  ): void => {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  /**
   * Download with encoding options (for Excel compatibility)
   * @param content - File content
   * @param filename - File name
   * @param options - Encoding options
   */
  const downloadWithEncoding = (
    content: string,
    filename: string,
    options: {
      encoding?: 'utf-8' | 'gbk'
      addBom?: boolean
      mimeType?: string
    } = {}
  ): void => {
    const { encoding = 'utf-8', addBom = true, mimeType = 'text/plain' } = options

    let fileContent = content
    let finalMimeType = mimeType

    if (encoding === 'gbk') {
      // GBK encoding fallback to UTF-8
      finalMimeType = `${mimeType};charset=gbk`
    }

    if (addBom && encoding === 'utf-8') {
      fileContent = '﻿' + content
    }

    const blob = new Blob([fileContent], { type: finalMimeType })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  /**
   * Reset copy state
   */
  const resetCopyState = () => {
    copied.value = false
    copyError.value = ''
  }

  return {
    copied: readonly(copied),
    copyError: readonly(copyError),
    copyToClipboard,
    readFromClipboard,
    downloadAsFile,
    downloadWithEncoding,
    resetCopyState
  }
}
