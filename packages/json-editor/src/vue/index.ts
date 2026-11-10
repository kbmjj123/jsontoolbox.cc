import JsonEditor from './JsonEditor.vue'
import CodeEditor from './CodeEditor.vue'
import TreeView from './TreeView.vue'
import TableView from './TableView.vue'
import ValueInsight from './ValueInsight.vue'

// Components inject the stylesheet from their own `setup` (the reliable,
// non-tree-shakeable path). This top-level call is a fallback for consumers that
// import the entry without mounting a component. No-op during SSR.
import { injectJsonEditorStyles } from './injectStyles'
injectJsonEditorStyles()

export { JsonEditor, CodeEditor, TreeView, TableView, ValueInsight }
export { useNodeEditing, coerceScalarInput, type NodeEditingNotify, type UseNodeEditingOptions } from './useNodeEditing'
export { JsonEditorPlugin, type JsonEditorPluginOptions } from './plugin'
export { useTheme, type ThemeOption } from './useTheme'
export { useMessages } from './useMessages'
export { copyText, downloadFile } from './clipboard'
export { createCodeMirror, type CodeMirrorHandle, type CreateCodeMirrorOptions } from './useCodeMirror'
export { icons, type IconName } from './icons'
export type { JsonEditorView } from './JsonEditor.vue'
export default JsonEditor
