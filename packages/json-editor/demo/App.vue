<template>
  <section>
    <h2>1. Vue component (v-model, zh locale, dark theme)</h2>
    <JsonEditor
      v-model="value"
      v-model:view="view"
      theme="dark"
      locale="zh"
      height="320px"
      attribution
      @error="onError"
      @select="onSelect"
    />
    <div class="value">view: {{ view }} · error: {{ error ? error.message : 'none' }}</div>
  </section>

  <section>
    <h2>2. Imperative API (defineJsonEditor)</h2>
    <div ref="imperativeHost" style="height: 260px"></div>
    <button type="button" @click="imperative?.format()">Format</button>
    <button type="button" @click="imperative?.minify()">Minify</button>
    <div class="value">{{ imperativeValue }}</div>
  </section>

  <section>
    <h2>3. Custom element &lt;json-editor&gt; (shadow DOM)</h2>
    <json-editor
      value='{"name":"json-editor","nested":{"a":[1,2,3]}}'
      theme="light"
      height="260px"
      attribution
    />
    <div class="value">{{ elementValue }}</div>
  </section>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import JsonEditor from '@kbmjj123/json-editor'
import { defineJsonEditor, registerJsonEditor, type JsonEditorInstance } from '@kbmjj123/json-editor/wc'

const SAMPLE = JSON.stringify(
  {
    name: 'JSON Toolbox',
    clientSide: true,
    tools: ['formatter', 'validator', 'tree-viewer'],
    limits: { maxBytes: 5_242_880, uploads: 0 },
    nested: { level2: { level3: { leaf: 'deep value' } } },
  },
  null,
  2
)

const value = ref(SAMPLE)
const view = ref<'editor' | 'tree' | 'both'>('both')
const error = ref<{ message: string; location: { line: number; column: number } | null } | null>(null)
const onError = (info: typeof error.value) => {
  error.value = info
}
const onSelect = (info: { path: string; jsonPath: string; value: unknown }) => {
  console.log('[demo] select', info.jsonPath)
}

// ── 2. imperative ──────────────────────────────────────────
const imperativeHost = ref<HTMLElement | null>(null)
const imperativeValue = ref('')
let imperative: JsonEditorInstance | null = null

// ── 3. custom element ──────────────────────────────────────
const elementValue = ref('')
let elementEl: HTMLElement | null = null

registerJsonEditor()

function onElementInput(event: Event) {
  elementValue.value = (event as CustomEvent<{ value: string }>).detail.value
}

onMounted(() => {
  if (imperativeHost.value) {
    imperative = defineJsonEditor(imperativeHost.value, { value: '{"a":1,"b":[2,3]}', view: 'editor', height: '260px' })
    imperative.on('change', (next) => {
      imperativeValue.value = next
    })
    imperativeValue.value = imperative.getValue()
  }

  // Custom elements are looked up rather than bound with a template ref so
  // the demo exercises the same path a plain HTML page would.
  elementEl = document.querySelector('json-editor')
  elementEl?.addEventListener('input', onElementInput)
})

onBeforeUnmount(() => {
  imperative?.destroy()
  elementEl?.removeEventListener('input', onElementInput)
})
</script>
