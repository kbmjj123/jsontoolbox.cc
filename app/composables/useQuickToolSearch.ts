// Shared state: single source of truth for the global quick tool search modal.
const isOpen = ref(false)
const contextualFiles = ref<File[]>([])

export function useQuickToolSearch() {
  function open(files?: File[]) {
    if (files) contextualFiles.value = files
    isOpen.value = true
  }

  function close() {
    isOpen.value = false
  }

  function setFiles(files: File[]) {
    contextualFiles.value = files
  }

  function clearFiles() {
    contextualFiles.value = []
  }

  return { isOpen, contextualFiles, open, close, setFiles, clearFiles }
}
