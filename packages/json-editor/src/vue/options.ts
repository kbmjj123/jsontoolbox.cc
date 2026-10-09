import { inject, type InjectionKey } from 'vue'
import type { Locale, Messages } from '../i18n'
import type { ThemeOption } from './useTheme'
import type { IndentOption } from '../core/format'

export interface JsonEditorPluginOptions {
  locale?: Locale
  messages?: Partial<Messages>
  theme?: ThemeOption
  indent?: IndentOption
  height?: string
}

export const JSON_EDITOR_OPTIONS: InjectionKey<JsonEditorPluginOptions> = Symbol('json-editor-options')

/**
 * Options passed to `app.use(JsonEditorPlugin, {...})`. Returns `null` when
 * the plugin was not installed, so components can fall back to their own
 * prop value and then to the built-in default.
 */
export function useJsonEditorOptions(): JsonEditorPluginOptions | null {
  return inject(JSON_EDITOR_OPTIONS, null)
}
