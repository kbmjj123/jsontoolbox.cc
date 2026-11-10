import cssText from '../styles/index.css?inline'

let injected = false

/**
 * Inject the component stylesheet into <head> on the client. Safe to call from
 * any component's `setup` (and idempotent). It is a no-op during SSR because
 * `document` does not exist there, so it never throws under Node.
 *
 * This self-contained injection means consumers (e.g. the Nuxt site) get
 * styled output without having to import `style.css` manually — and unlike a
 * top-level side effect in the entry chunk, it is not tree-shaken away by
 * bundlers that honor `package.json`'s `sideEffects` field.
 */
export function injectJsonEditorStyles() {
  if (typeof document === 'undefined') return
  if (injected) return
  if (document.getElementById('json-editor-styles')) {
    injected = true
    return
  }
  const style = document.createElement('style')
  style.id = 'json-editor-styles'
  style.textContent = cssText
  document.head.appendChild(style)
  injected = true
}
