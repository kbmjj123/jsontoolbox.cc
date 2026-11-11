/**
 * Client-side mirror of the "current tool's input text".
 *
 * Universal tool components take their input through `JsonInputEditor`, which
 * writes the live text here. The related-tools links in `ToolRelated` read it
 * and attach the value to the next tool's URL via the `#in=` inbound protocol
 * (app/utils/share/inbound.ts), so a user can carry the data they are working
 * on into a recommended tool without copy-paste.
 *
 * Scoped to the current page via Nuxt's `useState` (SSR-safe, request-isolated
 * and persisted across client-side navigation). It stays empty during SSR, so
 * the rendered SEO links remain clean path-only URLs; the `#in=` fragment is
 * only added on the client after the user interacts with the input.
 */
export function useToolHandoff() {
  const currentInput = useState<string>('toolHandoffInput', () => '')

  return {
    currentInput,
    setCurrentInput(value: string) {
      currentInput.value = value
    },
  }
}
