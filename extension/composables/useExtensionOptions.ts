import { ref } from 'vue'
import { setI18nLocale } from '../i18n'
import {
  DEFAULT_OPTIONS,
  applyTheme,
  getOptions,
  setOptions,
  type ExtensionOptions,
} from '../utils/options'

// Module-level singletons: every component calling this composable shares the
// same reactive state (WXT auto-imports composables per call site otherwise).
const options = ref<ExtensionOptions>({ ...DEFAULT_OPTIONS })
const ready = ref(false)

async function init(): Promise<void> {
  const loaded = await getOptions()
  options.value = loaded
  applyTheme(loaded.theme)
  setI18nLocale(loaded.locale)
  ready.value = true
}

void init()

export function useExtensionOptions() {
  async function update(next: Partial<ExtensionOptions>): Promise<void> {
    const merged = await setOptions(next)
    options.value = merged
    applyTheme(merged.theme)
    setI18nLocale(merged.locale)
  }

  return { options, ready, update, reload: init }
}
