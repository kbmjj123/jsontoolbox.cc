<template>
  <!-- Mobile: stacked layout -->
  <div class="grid grid-cols-1 gap-4 lg:hidden">
    <JsonInputEditor
      v-model="leftJson"
      :label="tool.ui?.label_json_a || 'JSON A (Original)'"
      placeholder='{"name": "Alice", "age": 30}'
      show-load-url
      @clear="onClearLeft"
    />
    <JsonInputEditor
      v-model="rightJson"
      :label="tool.ui?.label_json_b || 'JSON B (Modified)'"
      placeholder='{"name": "Alice", "age": 31, "email": "alice@example.com"}'
      show-load-url
      @clear="onClearRight"
    />
  </div>

  <!-- Desktop: resizable split -->
  <div class="hidden lg:block">
    <ResizablePanel v-model:fullscreen="fullscreen" :initial-ratio="0.5" responsive>
      <template #toolbar-left>
        <button @click="compare" class="btn-primary px-4 py-1.5 text-xs">
          <Icon name="lucide:git-compare" class="h-3.5 w-3.5 mr-1" />
          {{ tool.ui?.btn_compare || 'Compare' }}
        </button>
      </template>
      <template #first>
        <div class="h-full pr-3">
          <JsonInputEditor
            ref="leftEditor"
            v-model="leftJson"
            editor-mode="codemirror"
            :label="tool.ui?.label_json_a || 'JSON A (Original)'"
            placeholder='{"name": "Alice", "age": 30}'
            show-upload
            show-load-url
            @clear="onClearLeft"
          />
        </div>
      </template>
      <template #second>
        <div class="h-full pl-3">
          <JsonInputEditor
            ref="rightEditor"
            v-model="rightJson"
            editor-mode="codemirror"
            :label="tool.ui?.label_json_b || 'JSON B (Modified)'"
            placeholder='{"name": "Alice", "age": 31, "email": "alice@example.com"}'
            show-upload
            show-load-url
            @clear="onClearRight"
          />
        </div>
      </template>

    </ResizablePanel>
  </div>

  <!-- Error -->
  <div v-if="error" class="mt-4 rounded-lg bg-red-50 border border-red-200 p-3 text-xs text-red-700 dark:bg-red-900/30 dark:border-red-800 dark:text-red-400">{{ error }}</div>
</template>

<script setup lang="ts">
const props = defineProps<{ tool: any }>()
const { t } = useI18n()
const toast = useToast()

interface Diff {
  path: string
  type: 'added' | 'removed' | 'changed'
  value?: any
  oldValue?: any
  newValue?: any
}

const leftJson = ref('')
const rightJson = ref('')
const error = ref('')
const diffs = ref<Diff[]>([])
const compared = ref(false)
const leftDecorations = ref<LineDecoration[]>([])
const rightDecorations = ref<LineDecoration[]>([])
const leftPathLine = ref(new Map<string, number>())
const rightPathLine = ref(new Map<string, number>())
const fullscreen = ref(false)

const leftEditor = ref<InstanceType<typeof JsonInputEditor>>()
const rightEditor = ref<InstanceType<typeof JsonInputEditor>>()

import type { LineDecoration } from '~/composables/useDiffLineMapping'

const { loadDataFromUrl } = useUrlParams()
const { computeAndMap } = useDiffLineMapping()

onMounted(() => {
  const leftUrl = loadDataFromUrl('left')
  const rightUrl = loadDataFromUrl('right')
  if (leftUrl) leftJson.value = leftUrl
  if (rightUrl) rightJson.value = rightUrl
  if (leftUrl && rightUrl) nextTick(() => compare())
})

// ── Line-level diff highlighting ──
watch([leftDecorations, rightDecorations], ([newLeft, newRight]) => {
  leftEditor.value?.setLineDecorations(newLeft)
  rightEditor.value?.setLineDecorations(newRight)
}, { flush: 'post' })

// ── Auto-compare on input change (debounced) ──
let compareTimer: ReturnType<typeof setTimeout> | null = null
watch([leftJson, rightJson], () => {
  if (compareTimer) clearTimeout(compareTimer)
  compareTimer = setTimeout(() => { compare(true) }, 300)
})

// ── Scroll sync between editors ──
let scrollSyncing = false

onMounted(() => {
  leftEditor.value?.onCmScrollRegister((info) => {
    if (scrollSyncing) return
    scrollSyncing = true
    const ratio = info.scrollTop / Math.max(1, info.scrollHeight - info.clientHeight)
    rightEditor.value?.scrollToRatio(ratio)
    nextTick(() => { scrollSyncing = false })
  })

  rightEditor.value?.onCmScrollRegister((info) => {
    if (scrollSyncing) return
    scrollSyncing = true
    const ratio = info.scrollTop / Math.max(1, info.scrollHeight - info.clientHeight)
    leftEditor.value?.scrollToRatio(ratio)
    nextTick(() => { scrollSyncing = false })
  })
})

const compare = (silent = false) => {
  error.value = ''; diffs.value = []; compared.value = false
  leftDecorations.value = []; rightDecorations.value = []
  leftPathLine.value = new Map(); rightPathLine.value = new Map()
  leftEditor.value?.clearLineDecorations()
  rightEditor.value?.clearLineDecorations()

  if (!leftJson.value.trim() || !rightJson.value.trim()) return

  try { JSON.parse(leftJson.value) } catch (e) { error.value = `JSON A: ${(e as Error).message}`; if (!silent) toast.error(error.value); return }
  try { JSON.parse(rightJson.value) } catch (e) { error.value = `JSON B: ${(e as Error).message}`; if (!silent) toast.error(error.value); return }

  const result = computeAndMap(leftJson.value, rightJson.value)
  diffs.value = result.diffs as Diff[]
  leftDecorations.value = result.leftLines
  rightDecorations.value = result.rightLines
  leftPathLine.value = result.leftPathLine
  rightPathLine.value = result.rightPathLine
  compared.value = true
  if (!silent) toast.success(t('toast.compared'))
}

const onClearLeft = () => { error.value = '' }
const onClearRight = () => { error.value = '' }
</script>
