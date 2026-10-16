<template>
  <div :class="['je-host', bordered ? 'je-root' : 'je-pane']">
    <div ref="hostRef" class="je-editor" />
    <div v-if="showStatus" :class="['je-status', error && 'is-error']">
      <span class="je-dot" :class="{ 'is-error': !!error }" />
      <span class="je-status-message">{{ statusText }}</span>
      <span v-if="errorLocation" class="je-status-loc">
        {{ t('line_column', { line: errorLocation.line, column: errorLocation.column }) }}
      </span>
      <span class="je-status-right">{{ t('chars', { n: charCount }) }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { createCodeMirror, type CodeMirrorHandle } from './useCodeMirror'
import { useJsonEditorOptions } from './options'
import { analyzeJson, type ErrorLocation } from '../core/parse'
import { formatJson, minifyJson, type IndentOption } from '../core/format'
import { createTranslator, type Locale, type Messages } from '../i18n'
import '../styles/index.css'

const props = withDefaults(
  defineProps<{
    modelValue?: string
    readOnly?: boolean
    placeholder?: string
    indent?: IndentOption
    /** Refuse pastes larger than this many bytes. `0` disables the check. */
    maxBytes?: number
    showStatus?: boolean
    /** `false` when nested inside another `je-root` (e.g. `JsonEditor`). */
    bordered?: boolean
    locale?: Locale
    messages?: Partial<Messages>
  }>(),
  {
    modelValue: '',
    readOnly: false,
    placeholder: '',
    indent: 2,
    maxBytes: 0,
    showStatus: true,
    bordered: true,
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
  error: [info: { message: string; location: ErrorLocation | null } | null]
  'oversized-paste': [info: { bytes: number; text: string }]
}>()

const hostRef = ref<HTMLElement | null>(null)
let handle: CodeMirrorHandle | null = null

const pluginOptions = useJsonEditorOptions()
const t = computed(() =>
  createTranslator(
    props.locale ?? pluginOptions?.locale ?? 'en',
    props.messages ?? pluginOptions?.messages
  )
)

const analysis = computed(() => analyzeJson(props.modelValue))
const error = computed(() => analysis.value.error)
const errorLocation = computed<ErrorLocation | null>(() =>
  props.modelValue.trim() ? analysis.value.location : null
)

const charCount = computed(() => props.modelValue.length)
const statusText = computed(() => {
  if (!props.modelValue.trim()) return t.value('empty')
  return error.value ? `${t.value('invalid')} — ${error.value}` : t.value('valid')
})

function emitError() {
  if (!props.modelValue.trim()) {
    emit('error', null)
    return
  }
  const { error: message, location } = analysis.value
  emit('error', message ? { message, location } : null)
}

onMounted(() => {
  if (!hostRef.value) return

  // Inside a custom element, CodeMirror must mount its stylesheet on the
  // shadow root rather than the document.
  const rootNode = hostRef.value.getRootNode()
  const root = typeof ShadowRoot !== 'undefined' && rootNode instanceof ShadowRoot ? rootNode : undefined

  handle = createCodeMirror({
    parent: hostRef.value,
    doc: props.modelValue,
    readOnly: props.readOnly,
    placeholder: props.placeholder,
    indent: props.indent,
    root,
    maxBytes: props.maxBytes,
    onDocChange: (value) => emit('update:modelValue', value),
    onOversizedPaste: (info) => emit('oversized-paste', info),
  })
})

onBeforeUnmount(() => {
  handle?.destroy()
  handle = null
})

// Only push external edits into the editor; never echo our own typing back.
watch(
  () => props.modelValue,
  (value) => {
    if (handle && value !== handle.getValue()) handle.setValue(value)
  }
)

watch([() => props.readOnly], ([readOnly]) => handle?.setReadOnly(readOnly))
watch([() => props.indent], ([indent]) => handle?.setIndent(indent))

// Highlight the failing line, and report the error upward.
watch(
  [errorLocation, () => props.modelValue],
  ([location]) => {
    handle?.setErrorLine(location ? location.line : null)
    emitError()
  },
  { immediate: true, flush: 'post' }
)

function format() {
  const result = formatJson(props.modelValue, props.indent)
  if (result.error) return false
  handle?.replaceAll(result.text)
  return true
}

function minify() {
  const result = minifyJson(props.modelValue)
  if (result.error) return false
  handle?.replaceAll(result.text)
  return true
}

defineExpose({
  format,
  minify,
  focus: () => handle?.focus(),
  scrollToLine: (line: number) => handle?.scrollToLine(line),
  flashLines: (from: number, to?: number) => handle?.flashLines(from, to),
})
</script>
