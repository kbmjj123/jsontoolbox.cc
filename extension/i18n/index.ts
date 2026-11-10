import { createI18n } from 'vue-i18n'
import en from './en.json'
import zh from './zh.json'

export type AppLocale = 'en' | 'zh'

// Kept loosely typed on purpose: some keys are built at runtime
// (`convert.${direction}`, errorCode values), and vue-i18n's inferred literal
// key union would reject a plain `string` key in those places.
const messages: any = { en, zh }

export const i18n = createI18n({
  legacy: false,
  locale: 'en',
  fallbackLocale: 'en',
  messages,
})

/** Keep the extension chrome in sync with the locale stored in browser.storage. */
export function setI18nLocale(locale: AppLocale): void {
  // `global` is a union (Composer | VueI18n) in vue-i18n's types; both expose
  // a writable `locale` ref so the narrow cast is safe.
  const composer = i18n.global as unknown as { locale: { value: string } }
  composer.locale.value = locale
}

export default i18n
