import { json } from '@codemirror/lang-json'
import {
  EditorView,
  Decoration,
  lineNumbers,
  highlightActiveLineGutter,
  drawSelection,
  dropCursor,
  keymap,
  placeholder,
  type DecorationSet,
} from '@codemirror/view'
import { EditorState, Compartment, StateEffect, StateField, type Extension, type StateEffectType } from '@codemirror/state'
import { syntaxHighlighting, HighlightStyle, indentUnit } from '@codemirror/language'
import { history, defaultKeymap, historyKeymap, indentWithTab } from '@codemirror/commands'
import { tags } from '@lezer/highlight'

/**
 * Minimal CodeMirror 6 wrapper.
 *
 * Written directly against `@codemirror/*` instead of a Vue wrapper because
 * custom-element usage needs `EditorView({ root: shadowRoot })`, which the
 * Vue wrappers do not expose.
 */

export interface CodeMirrorHandle {
  view: EditorView
  /** Replace the document without firing `onDocChange`. */
  setValue(value: string): void
  getValue(): string
  /** Replace the document and notify listeners (used after Format / Minify). */
  replaceAll(value: string): void
  setReadOnly(readOnly: boolean): void
  setIndent(indent: number | string): void
  scrollToLine(line: number): void
  focus(): void
  setErrorLine(line: number | null): void
  flashLines(from: number, to?: number): void
  destroy(): void
}

export interface CreateCodeMirrorOptions {
  parent: HTMLElement
  doc: string
  readOnly?: boolean
  placeholder?: string
  indent?: number | string
  /** Shadow root that CodeMirror should mount its stylesheet into. */
  root?: ShadowRoot | Document
  /** Refuse pastes larger than this many bytes. `0` disables the check. */
  maxBytes?: number
  onDocChange?: (value: string) => void
  onOversizedPaste?: (info: { bytes: number; text: string }) => void
  onReady?: (view: EditorView) => void
}

const errorLineEffect = StateEffect.define<DecorationSet>()
const flashEffect = StateEffect.define<DecorationSet>()

function decorationField(effect: StateEffectType<DecorationSet>) {
  return StateField.define<DecorationSet>({
    create: () => Decoration.none,
    update(value, tr) {
      for (const e of tr.effects) if (e.is(effect)) return e.value
      return value.map(tr.changes)
    },
    provide: (field) => EditorView.decorations.from(field),
  })
}

const errorLineField = decorationField(errorLineEffect)
const flashField = decorationField(flashEffect)

/** Colours resolve to `--je-*` variables, so light/dark needs no reconfigure. */
const jsonHighlight = syntaxHighlighting(
  HighlightStyle.define([
    { tag: tags.propertyName, color: 'var(--je-key)' },
    { tag: tags.string, color: 'var(--je-string)' },
    { tag: tags.number, color: 'var(--je-number)' },
    { tag: tags.bool, color: 'var(--je-boolean)' },
    { tag: tags.null, color: 'var(--je-null)' },
    { tag: tags.punctuation, color: 'var(--je-punctuation)' },
    { tag: tags.separator, color: 'var(--je-punctuation)' },
    { tag: tags.invalid, color: 'var(--je-danger)' },
  ])
)

const baseTheme = EditorView.theme({
  '&': { height: '100%', backgroundColor: 'transparent' },
  '.cm-scroller': { lineHeight: '1.6' },
  '.cm-content': { padding: '10px 0' },
  '.cm-line': { padding: '0 12px' },
  '&.cm-focused': { outline: 'none' },
  '.cm-gutters': {
    backgroundColor: 'transparent',
    border: 'none',
    borderRight: '1px solid var(--je-border)',
    color: 'var(--je-fg-faint)',
  },
  '.cm-lineNumbers .cm-gutterElement': { padding: '0 8px 0 12px', minWidth: '34px' },
  '.cm-activeLineGutter': { backgroundColor: 'transparent', color: 'var(--je-fg-muted)' },
  '.cm-activeLine': { backgroundColor: 'var(--je-bg-hover)' },
  '.cm-selectionBackground': { backgroundColor: 'var(--je-bg-active)' },
  '&.cm-focused .cm-selectionBackground': { backgroundColor: 'var(--je-bg-active)' },
  '.cm-cursor, .cm-dropCursor': { borderLeftColor: 'var(--je-fg)' },
  '.cm-placeholder': { color: 'var(--je-fg-faint)' },
})

function byteLength(text: string): number {
  return new TextEncoder().encode(text).length
}

export function createCodeMirror(options: CreateCodeMirrorOptions): CodeMirrorHandle {
  const {
    parent,
    doc,
    readOnly = false,
    placeholder: placeholderText = '',
    indent = 2,
    root,
    maxBytes = 0,
    onDocChange,
    onOversizedPaste,
    onReady,
  } = options

  let suppressEmit = false
  const editableCompartment = new Compartment()
  const indentCompartment = new Compartment()

  const extensions: Extension[] = [
    lineNumbers(),
    highlightActiveLineGutter(),
    drawSelection(),
    dropCursor(),
    history(),
    keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]),
    json(),
    jsonHighlight,
    baseTheme,
    EditorView.lineWrapping,
    EditorView.contentAttributes.of({ 'aria-label': 'JSON editor' }),
    errorLineField,
    flashField,
    editableCompartment.of([EditorState.readOnly.of(readOnly), EditorView.editable.of(!readOnly)]),
    indentCompartment.of(indentUnit.of(typeof indent === 'number' ? ' '.repeat(indent) : indent)),
    EditorView.updateListener.of((update) => {
      if (!update.docChanged || suppressEmit) return
      onDocChange?.(update.state.doc.toString())
    }),
    EditorView.domEventHandlers({
      paste(event) {
        if (!maxBytes) return false
        const text = (event as ClipboardEvent).clipboardData?.getData('text') ?? ''
        if (!text) return false
        const bytes = byteLength(text)
        if (bytes <= maxBytes) return false
        event.preventDefault()
        onOversizedPaste?.({ bytes, text })
        return true
      },
    }),
  ]

  if (placeholderText) extensions.push(placeholder(placeholderText))

  const view = new EditorView({
    state: EditorState.create({ doc, extensions }),
    parent,
    ...(root ? { root } : {}),
  })

  onReady?.(view)

  let flashTimer: ReturnType<typeof setTimeout> | null = null

  const lineRanges = (from: number, to: number, className: string) => {
    const docLines = view.state.doc
    const start = Math.min(Math.max(1, Math.round(from)), docLines.lines)
    const end = Math.min(Math.max(start, Math.round(to)), docLines.lines)
    const ranges = []
    for (let line = start; line <= end; line++) {
      ranges.push(Decoration.line({ class: className }).range(docLines.line(line).from))
    }
    return Decoration.set(ranges)
  }

  return {
    view,

    setValue(value: string) {
      if (value === view.state.doc.toString()) return
      suppressEmit = true
      view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: value } })
      suppressEmit = false
    },

    getValue() {
      return view.state.doc.toString()
    },

    replaceAll(value: string) {
      suppressEmit = true
      view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: value } })
      suppressEmit = false
      onDocChange?.(value)
    },

    setReadOnly(value: boolean) {
      view.dispatch({
        effects: editableCompartment.reconfigure([
          EditorState.readOnly.of(value),
          EditorView.editable.of(!value),
        ]),
      })
    },

    setIndent(value: number | string) {
      view.dispatch({
        effects: indentCompartment.reconfigure(
          indentUnit.of(typeof value === 'number' ? ' '.repeat(value) : value)
        ),
      })
    },

    scrollToLine(line: number) {
      if (!Number.isFinite(line) || line < 1) return
      const clamped = Math.min(Math.max(1, Math.round(line)), view.state.doc.lines)
      view.dispatch({
        effects: EditorView.scrollIntoView(view.state.doc.line(clamped).from, { y: 'center' }),
      })
    },

    focus() {
      view.focus()
    },

    setErrorLine(line: number | null) {
      if (line == null || !Number.isFinite(line) || line < 1) {
        view.dispatch({ effects: errorLineEffect.of(Decoration.none) })
        return
      }
      view.dispatch({ effects: errorLineEffect.of(lineRanges(line, line, 'je-line-error')) })
    },

    flashLines(from: number, to?: number) {
      if (flashTimer) {
        clearTimeout(flashTimer)
        flashTimer = null
      }
      if (!Number.isFinite(from) || from < 1) {
        view.dispatch({ effects: flashEffect.of(Decoration.none) })
        return
      }
      view.dispatch({ effects: flashEffect.of(lineRanges(from, to ?? from, 'je-line-flash')) })
      flashTimer = setTimeout(() => {
        view.dispatch({ effects: flashEffect.of(Decoration.none) })
        flashTimer = null
      }, 1600)
    },

    destroy() {
      if (flashTimer) clearTimeout(flashTimer)
      view.destroy()
    },
  }
}
