<template>
  <div class="je-root" :class="{ 'je-dark': isDark }" :style="{ height: resolvedHeight }">
    <div class="je-toolbar">
      <button
        type="button"
        class="je-btn"
        :disabled="readOnly || !hasContent"
        :title="t('format')"
        @click="onFormat"
      >
        <span v-html="icons.alignLeft" />
        <span>{{ t('format') }}</span>
      </button>
      <button
        type="button"
        class="je-btn"
        :disabled="readOnly || !hasContent"
        :title="t('minify')"
        @click="onMinify"
      >
        <span v-html="icons.minimize" />
        <span>{{ t('minify') }}</span>
      </button>
      <button type="button" class="je-btn" :title="t('copy')" @click="onCopy">
        <span v-html="copied ? icons.check : icons.copy" />
        <span>{{ copied ? t('copied') : t('copy') }}</span>
      </button>

      <span class="je-sep" />

      <select v-model="indentValue" class="je-select" :aria-label="t('format')">
        <option :value="2">2</option>
        <option :value="4">4</option>
        <option value="tab">Tab</option>
      </select>

      <span class="je-toolbar-spacer" />

      <div class="je-sep" />
      <button
        v-for="option in viewOptions"
        :key="option"
        type="button"
        class="je-btn"
        :class="{ 'je-btn-active': view === option }"
        @click="view = option"
      >
        {{ t(option === 'editor' ? 'editor' : option === 'tree' ? 'tree' : 'both') }}
      </button>
    </div>

    <div class="je-body">
      <CodeEditor
        v-if="view !== 'tree'"
        ref="editorRef"
        v-model="text"
        :read-only="readOnly"
        :placeholder="placeholder"
        :indent="indentValue"
        :max-bytes="maxBytes"
        :locale="resolvedLocale"
        :messages="resolvedMessages"
        :bordered="false"
        :show-status="false"
        @oversized-paste="onOversizedPaste"
      />
      <TreeView
        v-if="view !== 'editor'"
        class="je-pane"
        :text="text"
        :locale="resolvedLocale"
        :messages="resolvedMessages"
        @select="onSelect"
      />
    </div>

    <div :class="['je-status', errorInfo && 'is-error']">
      <span class="je-dot" :class="{ 'is-error': !!errorInfo }" />
      <span class="je-status-message">{{ statusText }}</span>
      <span v-if="errorInfo?.location" class="je-status-loc">
        {{ t('line_column', { line: errorInfo.location.line, column: errorInfo.location.column }) }}
      </span>
      <span class="je-status-right">{{ t('chars', { n: text.length }) }}</span>
    </div>

    <div v-if="attribution" class="je-attribution">
      <a :href="attributionUrl" target="_blank" rel="noopener">{{ t('attribution', { name: 'jsontoolbox.cc' }) }}</a>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import CodeEditor from './CodeEditor.vue'
import TreeView from './TreeView.vue'
import { useTheme, type ThemeOption } from './useTheme'
import { useJsonEditorOptions } from './options'
import { icons } from './icons'
import { copyText } from './clipboard'
import { createTranslator, type Locale, type Messages } from '../i18n'
import { analyzeJson, type ErrorLocation } from '../core/parse'
import type { IndentOption } from '../core/format'
import '../styles/index.css'

export type JsonEditorView = 'editor' | 'tree' | 'both'

const props = defineProps<{
  modelValue?: string
  view?: JsonEditorView
  theme?: ThemeOption
  locale?: Locale
  messages?: Partial<Messages>
  readOnly?: boolean
  placeholder?: string
  indent?: IndentOption
  maxBytes?: number
  height?: string
  /** Show a small "powered by jsontoolbox.cc" link. Off by default. */
  attribution?: boolean
  attributionUrl?: string
}>()

// Resolution order for every optional prop: explicit prop → plugin defaults
// (`app.use(JsonEditorPlugin, {...})`) → built-in default.
const pluginOptions = useJsonEditorOptions()
const resolvedLocale = computed<Locale>(() => props.locale ?? pluginOptions?.locale ?? 'en')
const resolvedTheme = computed<ThemeOption>(() => props.theme ?? pluginOptions?.theme ?? 'auto')
const resolvedIndent = computed<IndentOption>(() => props.indent ?? pluginOptions?.indent ?? 2)
const resolvedMessages = computed(() => props.messages ?? pluginOptions?.messages)
const resolvedHeight = computed(() => props.height ?? pluginOptions?.height ?? '420px')
const readOnly = computed(() => props.readOnly ?? false)
const maxBytes = computed(() => props.maxBytes ?? 0)
const placeholder = computed(() => props.placeholder ?? '')
const attribution = computed(() => props.attribution ?? false)
const attributionUrl = computed(() => props.attributionUrl ?? 'https://jsontoolbox.cc')

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'update:view': [view: JsonEditorView]
  error: [info: { message: string; location: ErrorLocation | null } | null]
  select: [info: { path: string; jsonPath: string; value: unknown }]
  'oversized-paste': [info: { bytes: number; text: string }]
}>()

const text = ref(props.modelValue ?? '')
watch(
  () => props.modelValue,
  (value) => {
    if (value != null && value !== text.value) text.value = value
  }
)
watch(text, (value) => emit('update:modelValue', value))

const view = ref<JsonEditorView>(props.view ?? 'both')
watch(
  () => props.view,
  (value) => {
    if (value) view.value = value
  }
)
watch(view, (value) => emit('update:view', value))

const indentValue = ref<IndentOption>(resolvedIndent.value)
watch(resolvedIndent, (value) => {
  indentValue.value = value
})

const { isDark } = useTheme(resolvedTheme)
const t = computed(() => createTranslator(resolvedLocale.value, resolvedMessages.value))

const editorRef = ref<InstanceType<typeof CodeEditor> | null>(null)
const viewOptions: JsonEditorView[] = ['editor', 'tree', 'both']

const hasContent = computed(() => text.value.trim().length > 0)
const errorInfo = computed(() => {
  if (!hasContent.value) return null
  const { error, location } = analyzeJson(text.value)
  return error ? { message: error, location } : null
})
watch(errorInfo, (info) => emit('error', info), { immediate: true })

const statusText = computed(() => {
  if (!hasContent.value) return t.value('empty')
  return errorInfo.value ? `${t.value('invalid')} — ${errorInfo.value.message}` : t.value('valid')
})

function onOversizedPaste(info: { bytes: number; text: string }) {
  emit('oversized-paste', info)
}

function onSelect(info: { path: string; jsonPath: string; value: unknown }) {
  emit('select', info)
}

function onFormat() {
  editorRef.value?.format()
}

function onMinify() {
  editorRef.value?.minify()
}

const copied = ref(false)
let copiedTimer: ReturnType<typeof setTimeout> | null = null

async function onCopy() {
  const ok = await copyText(text.value)
  if (!ok) return
  copied.value = true
  if (copiedTimer) clearTimeout(copiedTimer)
  copiedTimer = setTimeout(() => {
    copied.value = false
  }, 1200)
}

defineExpose({
  format: onFormat,
  minify: onMinify,
  focus: () => editorRef.value?.focus(),
  scrollToLine: (line: number) => editorRef.value?.scrollToLine(line),
  flashLines: (from: number, to?: number) => editorRef.value?.flashLines(from, to),
})
</script>
