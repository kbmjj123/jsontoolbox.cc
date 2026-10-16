import { computed, type ComputedRef, type Ref } from 'vue'
import { createTranslator, type Locale, type Messages, type Translator } from '../i18n'

/**
 * Reactive translator bound to a locale ref and optional message overrides.
 * Falls back to English for any key the locale does not define.
 */
export function useMessages(
  locale: Ref<Locale> | (() => Locale),
  overrides?: Ref<Partial<Messages> | undefined> | (() => Partial<Messages> | undefined)
): ComputedRef<Translator> {
  return computed(() =>
    createTranslator(
      typeof locale === 'function' ? locale() : locale.value,
      typeof overrides === 'function' ? overrides() : overrides?.value
    )
  )
}
