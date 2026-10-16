/**
 * Entry point for the CDN bundle: registers `<json-editor>` as a side effect
 * so a single `<script src="...">` is enough.
 *
 * Import `registerJsonEditor` from `@kbmjj123/json-editor/wc` instead if
 * you want to choose the tag name or control when registration happens.
 */
import { registerJsonEditor, JsonEditorElement } from './element'

registerJsonEditor()

export { registerJsonEditor, JsonEditorElement }
export { defineJsonEditor } from './defineJsonEditor'
export type {
  JsonEditorInstance,
  JsonEditorOptions,
  JsonEditorErrorInfo,
  JsonEditorSelectInfo,
  JsonEditorEvent,
} from './defineJsonEditor'
