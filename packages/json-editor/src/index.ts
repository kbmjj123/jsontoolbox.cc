export * from './core'
export * from './i18n'

export {
  JsonEditor,
  CodeEditor,
  TreeView,
  JsonEditorPlugin,
  useTheme,
  useMessages,
  copyText,
  createCodeMirror,
  icons,
} from './vue'
export type { ThemeOption, JsonEditorPluginOptions, IconName, CodeMirrorHandle, CreateCodeMirrorOptions } from './vue'
export type { JsonEditorView } from './vue/JsonEditor.vue'

export { defineJsonEditor, JsonEditorElement, registerJsonEditor } from './wc'
export type {
  JsonEditorInstance,
  JsonEditorOptions,
  JsonEditorErrorInfo,
  JsonEditorSelectInfo,
  JsonEditorEvent,
} from './wc'

export { JsonEditor as default } from './vue'
