/**
 * Shared "inbox" for content handed to a tool from the homepage hero picker.
 *
 * Module-level reactive state so it survives client-side navigation between the
 * picker modal and the destination tool page. Holds plain text only (never
 * serialized to storage); large files are carried via `useLargeFileHandoff`.
 */

interface InboxPayload {
  text: string
  fileName?: string
}

const inbox = ref<InboxPayload | null>(null)

export const useJsonInbox = () => {
  function setInbox(payload: InboxPayload) {
    inbox.value = payload
  }

  /** Read and clear the pending content. Returns null when nothing is pending. */
  function consumeInbox(): string | null {
    const value = inbox.value
    if (!value) return null
    inbox.value = null
    return value.text
  }

  return { inbox, setInbox, consumeInbox }
}
