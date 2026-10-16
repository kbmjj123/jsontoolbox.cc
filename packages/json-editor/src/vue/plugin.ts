import type { App, Plugin } from 'vue'
import JsonEditor from './JsonEditor.vue'
import CodeEditor from './CodeEditor.vue'
import TreeView from './TreeView.vue'
import { JSON_EDITOR_OPTIONS, type JsonEditorPluginOptions } from './options'

export type { JsonEditorPluginOptions }

/**
 * Register `<JsonEditor>` / `<CodeEditor>` / `<TreeView>` globally and set
 * default locale, theme, indent and height.
 *
 * Every default is a fallback only — an explicit prop always wins.
 */
export const JsonEditorPlugin: Plugin<[JsonEditorPluginOptions?]> = {
  install(app: App, options: JsonEditorPluginOptions = {}) {
    app.component('JsonEditor', JsonEditor)
    app.component('CodeEditor', CodeEditor)
    app.component('TreeView', TreeView)
    app.provide(JSON_EDITOR_OPTIONS, options)
  },
}

export { JsonEditor, CodeEditor, TreeView }
export default JsonEditorPlugin
