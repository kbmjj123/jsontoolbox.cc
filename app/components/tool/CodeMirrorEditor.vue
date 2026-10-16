<template>
  <div ref="hostRef" class="cm-host h-full" />
</template>

<script setup lang="ts">
/**
 * CodeMirror 6 host for the site.
 *
 * L2 统一后：编辑器内核（json 语言、keymap、history、错误行、粘贴闸门、
 * 缩进、滚动定位）由 `@kbmjj123/json-editor` 的 `createCodeMirror` 提供，
 * 这里只保留站点自己的皮肤与装饰（diff 行底色、点击定位高亮），作为扩展注入。
 *
 * 不再使用 `vue-codemirror6`：自定义元素场景需要 `EditorView({ root })`，
 * 而 Vue 封装层不暴露该参数，两边各写一份不如共用包里那一份。
 */
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { createCodeMirror, type CodeMirrorHandle } from '@kbmjj123/json-editor/vue'
import { EditorView, Decoration, type DecorationSet } from '@codemirror/view'
import { Prec, RangeSetBuilder, StateEffect, StateField, type Extension } from '@codemirror/state'
import { LARGE_FILE_MAX_BYTES } from '~/composables/useLargeFile'

const props = withDefaults(
  defineProps<{
    modelValue: string
    placeholder?: string
    readonly?: boolean
    disabled?: boolean
    /** When true, paste events carrying more than LARGE_FILE_MAX_BYTES are
     *  refused (and reported via `file-size`) instead of being inserted. */
    blockOversized?: boolean
  }>(),
  {
    placeholder: '',
    readonly: false,
    disabled: false,
    blockOversized: false,
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
  scroll: [info: { scrollTop: number; scrollHeight: number; clientHeight: number }]
  ready: [view: EditorView]
  /** Reported when a pasted value exceeds the large-file limit. */
  'file-size': [info: { bytes: number; oversized: boolean; text: string }]
}>()

const hostRef = ref<HTMLElement | null>(null)
let handle: CodeMirrorHandle | null = null

// ── Line decorations (diff view) ───────────────────────────
const decorationEffect = StateEffect.define<DecorationSet>()
const highlightEffect = StateEffect.define<DecorationSet>()

function fieldFor(effect: StateEffect<DecorationSet>) {
  return StateField.define<DecorationSet>({
    create: () => Decoration.none,
    update(value, tr) {
      for (const e of tr.effects) if (e.is(effect)) return e.value
      return value.map(tr.changes)
    },
    provide: (field) => EditorView.decorations.from(field),
  })
}

// ── Site skin ──────────────────────────────────────────────
// `Prec.high` 保证覆盖包内置的 baseTheme（字号/行高/内边距/选区色不同）。
const siteExtensions: Extension[] = [
  fieldFor(decorationEffect),
  fieldFor(highlightEffect),
  Prec.high(
    EditorView.theme({
      '&': {
        height: '100%',
        fontSize: '14px',
        fontFamily: "'Menlo', 'Monaco', 'Consolas', 'Liberation Mono', 'Courier New', monospace",
      },
      '.cm-scroller': { overflow: 'auto', lineHeight: '1.5' },
      '.cm-content': { padding: '16px 0', lineHeight: '1.5' },
      '.cm-line': { padding: '0 16px' },
      '&.cm-focused': { outline: 'none' },
      '.cm-gutters': {
        backgroundColor: 'transparent',
        border: 'none',
        borderRight: '1px solid rgba(148, 163, 184, 0.25)',
        color: '#94a3b8',
      },
      '.cm-lineNumbers .cm-gutterElement': { padding: '0 8px 0 12px', minWidth: '32px' },
      '.cm-activeLineGutter': { backgroundColor: 'transparent' },
      '.cm-activeLine': { backgroundColor: 'transparent' },
      '.cm-selectionBackground': { backgroundColor: '#b5d5ff80 !important' },
      '&.cm-focused .cm-selectionBackground': { backgroundColor: '#b5d5ff80 !important' },
      // Diff line highlight classes
      '.diff-added': { backgroundColor: 'rgba(34, 197, 94, 0.10)' },
      '.diff-removed': { backgroundColor: 'rgba(239, 68, 68, 0.10)' },
      '.diff-changed': { backgroundColor: 'rgba(234, 179, 8, 0.10)' },
    })
  ),
]

// ── Scroll events ──────────────────────────────────────────
// 滚动发生在 .cm-scroller（scrollDOM）上，不会冒泡到外层 .cm-editor。
function onScrollNative() {
  const dom = handle?.view.scrollDOM
  if (!dom) return
  emit('scroll', {
    scrollTop: dom.scrollTop,
    scrollHeight: dom.scrollHeight,
    clientHeight: dom.clientHeight,
  })
}

onMounted(() => {
  if (!hostRef.value) return

  handle = createCodeMirror({
    parent: hostRef.value,
    doc: props.modelValue,
    readOnly: props.readonly || props.disabled,
    placeholder: props.placeholder,
    indent: 2,
    maxBytes: props.blockOversized ? LARGE_FILE_MAX_BYTES : 0,
    extensions: siteExtensions,
    onDocChange: (value) => emit('update:modelValue', value),
    onOversizedPaste: ({ bytes, text }) => emit('file-size', { bytes, oversized: true, text }),
    onReady: (view) => {
      view.scrollDOM.addEventListener('scroll', onScrollNative)
      emit('ready', view)
    },
  })
})

onUnmounted(() => {
  handle?.view.scrollDOM.removeEventListener('scroll', onScrollNative)
  handle?.destroy()
  handle = null
})

// 只把外部改动写进编辑器，不回灌自己的输入。
watch(
  () => props.modelValue,
  (value) => {
    if (handle && value !== handle.getValue()) handle.setValue(value)
  }
)

// ── Exposed methods ────────────────────────────────────────
function addLineDecoration(effect: StateEffect<DecorationSet>, lines: Array<{ line: number; cls: string }>) {
  if (!handle) return
  const doc = handle.view.state.doc
  const builder = new RangeSetBuilder<Decoration>()
  const sorted = [...lines]
    .filter(({ line }) => line >= 1 && line <= doc.lines)
    .sort((a, b) => a.line - b.line)
  for (const { line, cls } of sorted) {
    const from = doc.line(line).from
    builder.add(from, from, Decoration.line({ attributes: { class: cls } }))
  }
  handle.view.dispatch({ effects: effect.of(builder.finish()) })
}

function setLineDecorations(lines: Array<{ line: number; type: 'added' | 'removed' | 'changed' }>) {
  const clsMap = { added: 'diff-added', removed: 'diff-removed', changed: 'diff-changed' }
  addLineDecoration(
    decorationEffect,
    lines.map(({ line, type }) => ({ line, cls: clsMap[type] }))
  )
}

function clearLineDecorations() {
  handle?.view.dispatch({ effects: decorationEffect.of(Decoration.none) })
}

let highlightTimer: ReturnType<typeof setTimeout> | null = null

function highlightLines(startLine: number, endLine: number, style: 'flash' | 'subtle') {
  if (!handle) return
  if (highlightTimer) {
    clearTimeout(highlightTimer)
    highlightTimer = null
  }

  if (startLine <= 0) {
    handle.view.dispatch({ effects: highlightEffect.of(Decoration.none) })
    return
  }

  const doc = handle.view.state.doc
  const sLine = Math.max(1, Math.min(startLine, doc.lines))
  const eLine = endLine > 0 ? Math.max(sLine, Math.min(endLine, doc.lines)) : sLine
  const cls = style === 'flash' ? 'cm-highlight-flash' : 'cm-highlight-subtle'
  const lines = []
  for (let l = sLine; l <= eLine; l++) lines.push({ line: l, cls })
  addLineDecoration(highlightEffect, lines)

  if (style === 'flash') {
    highlightTimer = setTimeout(() => {
      handle?.view.dispatch({ effects: highlightEffect.of(Decoration.none) })
      highlightTimer = null
    }, 2000)
  }
}

function scrollToRatio(ratio: number) {
  const dom = handle?.view.scrollDOM
  if (!dom) return
  const maxScroll = dom.scrollHeight - dom.clientHeight
  dom.scrollTop = Math.max(0, Math.min(ratio * maxScroll, maxScroll))
}

defineExpose({
  scrollToLine: (line: number) => handle?.scrollToLine(line),
  scrollToRatio,
  highlightLine: (line: number, style: 'flash' | 'subtle') => highlightLines(line, 0, style),
  highlightLines,
  setLineDecorations,
  clearLineDecorations,
})
</script>

<style>
/* 包的语法高亮读的是 --je-* 变量，宿主在这里提供明暗两套值（与站点现有
   JSON 配色一致）。暗色跟随 html.dark，无需重建编辑器。 */
.cm-host {
  --je-bg: transparent;
  --je-fg: #1e293b;
  --je-fg-muted: #64748b;
  --je-fg-faint: #94a3b8;
  --je-border: rgba(148, 163, 184, 0.25);
  --je-key: #7c3aed;
  --je-string: #16a34a;
  --je-number: #d97706;
  --je-boolean: #2563eb;
  --je-null: #2563eb;
  --je-punctuation: #64748b;
  --je-danger: #dc2626;
}

.dark .cm-host {
  --je-fg: #e2e8f0;
  --je-fg-muted: #94a3b8;
  --je-fg-faint: #64748b;
  --je-border: rgba(148, 163, 184, 0.24);
  --je-key: #c084fc;
  --je-string: #4ade80;
  --je-number: #fbbf24;
  --je-boolean: #60a5fa;
  --je-null: #60a5fa;
  --je-punctuation: #94a3b8;
  --je-danger: #f87171;
}

.cm-highlight-flash {
  background-color: rgba(251, 191, 36, 0.3) !important;
  animation: cm-flash-fade 2s forwards;
}
.dark .cm-highlight-flash {
  background-color: rgba(251, 191, 36, 0.2) !important;
}
.cm-highlight-subtle {
  background-color: rgba(251, 191, 36, 0.15) !important;
}
.dark .cm-highlight-subtle {
  background-color: rgba(251, 191, 36, 0.1) !important;
}
@keyframes cm-flash-fade {
  0% {
    background-color: rgba(251, 191, 36, 0.3);
  }
  70% {
    background-color: rgba(251, 191, 36, 0.3);
  }
  100% {
    background-color: transparent;
  }
}
</style>
