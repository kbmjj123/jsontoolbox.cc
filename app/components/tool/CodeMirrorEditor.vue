<template>
  <div class="cm-host h-full">
    <CodeMirror
      ref="cmRef"
      :model-value="modelValue"
      @update:model-value="emit('update:modelValue', $event)"
      :lang="json()"
      :linter="jsonParseLinter()"
      :extensions="extensions"
      :placeholder="placeholder"
      :readonly="readonly"
      :disabled="disabled"
      :dark="isDark"
      :basic="false"
      :minimal="true"
      :tab-size="2"
      :preserve-scroll-position="true"
      @ready="onReady"
    />
  </div>
</template>

<script setup lang="ts">
import CodeMirror from 'vue-codemirror6'
import { json, jsonParseLinter } from '@codemirror/lang-json'
import { EditorView, Decoration } from '@codemirror/view'
import { RangeSetBuilder, type Extension } from '@codemirror/state'
import { syntaxHighlighting, HighlightStyle } from '@codemirror/language'
import { tags } from '@lezer/highlight'

const props = withDefaults(defineProps<{
  modelValue: string
  placeholder?: string
  readonly?: boolean
  disabled?: boolean
}>(), {
  placeholder: '',
  readonly: false,
  disabled: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  scroll: [info: { scrollTop: number; scrollHeight: number; clientHeight: number }]
  ready: [view: EditorView]
}>()

const cmRef = ref<any>()
const isDark = ref(false)

// ── Color mode detection ──
let observer: MutationObserver | null = null

const checkDark = () => {
  isDark.value = document.documentElement.classList.contains('dark')
}

onMounted(() => {
  checkDark()
  observer = new MutationObserver(checkDark)
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
})

onUnmounted(() => {
  observer?.disconnect()
})

// ── Extensions (static — no computed, to avoid reconfigure loops) ──
const extensions: Extension[] = [
  EditorView.theme({
    '&': {
      height: '100%',
      fontSize: '14px',
      fontFamily: "'Menlo', 'Monaco', 'Consolas', 'Liberation Mono', 'Courier New', monospace",
    },
    '.cm-scroller': {
      overflow: 'auto',
    },
    '.cm-content': {
      padding: '16px 0',
      lineHeight: '1.5',
    },
    '.cm-line': {
      padding: '0 16px',
    },
    '&.cm-focused': {
      outline: 'none',
    },
    '.cm-gutters': {
      backgroundColor: 'transparent',
      border: 'none',
    },
    '.cm-activeLineGutter': {
      backgroundColor: 'transparent',
    },
    '.cm-activeLine': {
      backgroundColor: 'transparent',
    },
    '.cm-selectionBackground': {
      backgroundColor: '#b5d5ff80 !important',
    },
    '&.cm-focused .cm-selectionBackground': {
      backgroundColor: '#b5d5ff80 !important',
    },
    // JSON syntax colors — aligned with JsonOutputPanel (handled via HighlightStyle below)
    // Diff line highlight classes
    '.diff-added': {
      backgroundColor: 'rgba(34, 197, 94, 0.10)',
    },
    '.diff-removed': {
      backgroundColor: 'rgba(239, 68, 68, 0.10)',
    },
    '.diff-changed': {
      backgroundColor: 'rgba(234, 179, 8, 0.10)',
    },
  }),
  EditorView.lineWrapping,
  // JSON syntax colors — aligned with JsonOutputPanel
  syntaxHighlighting(HighlightStyle.define([
    { tag: tags.propertyName, color: '#7c3aed' },               // key — purple-600
    { tag: tags.string, color: '#16a34a' },                      // string value — green-600
    { tag: tags.number, color: '#d97706' },                      // number — amber-600
    { tag: tags.bool, color: '#2563eb' },                        // boolean — blue-600
    { tag: tags.null, color: '#2563eb' },                        // null — blue-600
    { tag: tags.punctuation, color: '#64748b' },                 // brackets, commas — slate-500
    { tag: tags.separator, color: '#64748b' },                   // colon — slate-500
  ])),
  syntaxHighlighting(HighlightStyle.define([
    { tag: tags.propertyName, color: '#c084fc' },               // key — purple-400 (dark)
    { tag: tags.string, color: '#4ade80' },                      // string value — green-400 (dark)
    { tag: tags.number, color: '#fbbf24' },                      // number — amber-400 (dark)
    { tag: tags.bool, color: '#60a5fa' },                        // boolean — blue-400 (dark)
    { tag: tags.null, color: '#60a5fa' },                        // null — blue-400 (dark)
    { tag: tags.punctuation, color: '#94a3b8' },                 // brackets, commas — slate-400 (dark)
    { tag: tags.separator, color: '#94a3b8' },                   // colon — slate-400 (dark)
  ], { dark: true })),
]

// ── Ready handler ──
let editorView: EditorView | undefined

function onReady(payload: { view: EditorView }) {
  editorView = payload.view
  // Scroll events happen on .cm-scroller (scrollDOM), not the outer .cm-editor.
  // domEventHandlers registers on .cm-editor where scroll doesn't bubble to.
  // So we attach directly to scrollDOM.
  editorView.scrollDOM.addEventListener('scroll', onScrollNative)
  emit('ready', payload.view)
}

function onScrollNative() {
  if (!editorView) return
  const dom = editorView.scrollDOM
  emit('scroll', {
    scrollTop: dom.scrollTop,
    scrollHeight: dom.scrollHeight,
    clientHeight: dom.clientHeight,
  })
}

onUnmounted(() => {
  editorView?.scrollDOM.removeEventListener('scroll', onScrollNative)
})

// ── Line decorations (direct dispatch) ──
function setLineDecorations(lines: Array<{ line: number; type: 'added' | 'removed' | 'changed' }>) {
  console.log('[CM] setLineDecorations called, editorView:', !!editorView, 'lines:', lines)
  if (!editorView) return

  const clsMap = { added: 'diff-added', removed: 'diff-removed', changed: 'diff-changed' }
  const doc = editorView.state.doc
  console.log('[CM] doc.lines:', doc.lines)

  const builder = new RangeSetBuilder<Decoration>()
  const sorted = [...lines]
    .filter(({ line }) => line >= 1 && line <= doc.lines)
    .sort((a, b) => a.line - b.line)

  for (const { line, type } of sorted) {
    const lineObj = doc.line(line)
    const cls = clsMap[type as keyof typeof clsMap]
    builder.add(lineObj.from, lineObj.from, Decoration.line({ attributes: { class: cls } }))
  }

  const ds = builder.finish()
  console.log('[CM] dispatching decorations, size:', ds.size)
  editorView.dispatch({
    effects: decorationFieldEffect.of(ds),
  })
}

function clearLineDecorations() {
  if (!editorView) return
  editorView.dispatch({
    effects: decorationFieldEffect.of(Decoration.none),
  })
}

// ── Exposed methods ──
function scrollToLine(line: number) {
  if (!editorView) return
  const lineObj = editorView.state.doc.line(Math.max(1, Math.min(line, editorView.state.doc.lines)))
  editorView.dispatch({
    effects: EditorView.scrollIntoView(lineObj.from, { y: 'center' }),
  })
}

function scrollToRatio(ratio: number) {
  if (!editorView) return
  const dom = editorView.scrollDOM
  const maxScroll = dom.scrollHeight - dom.clientHeight
  dom.scrollTop = Math.max(0, Math.min(ratio * maxScroll, maxScroll))
}

function getView(): EditorView | undefined {
  return editorView
}

// ── StateField for line decorations ──
import { StateField, StateEffect } from '@codemirror/state'

const decorationFieldEffect = StateEffect.define<any>()
const decorationField = StateField.define({
  create() { return Decoration.none },
  update(value, tr) {
    for (const e of tr.effects) {
      if (e.is(decorationFieldEffect)) {
        console.log('[CM] StateField received decoration effect, size:', e.value.size)
        return e.value
      }
    }
    return value.map(tr.changes)
  },
  provide: f => EditorView.decorations.from(f),
})

// Add StateField to extensions
extensions.push(decorationField)

defineExpose({
  scrollToLine,
  scrollToRatio,
  setLineDecorations,
  clearLineDecorations,
  getView,
})
</script>
