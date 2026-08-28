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
    <div class="flex flex-wrap gap-3 items-center">
      <button @click="compare" class="btn-primary px-5 py-2 text-xs">
        <Icon name="lucide:git-compare" class="h-4 w-4 mr-1.5" />
        {{ tool.ui?.btn_compare || 'Compare' }}
      </button>
      <button @click="sortAndCompare" class="rounded-xl border border-surface-200 bg-white px-4 py-2 text-xs font-bold text-surface-700 hover:bg-surface-50 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-300 dark:hover:bg-surface-700">
        <Icon name="lucide:arrow-az" class="h-4 w-4 mr-1.5" />
        {{ tool.ui?.btn_sort_keys || 'Sort Keys' }}
      </button>
      <button @click="swapInputs" class="rounded-xl border border-surface-200 bg-white px-4 py-2 text-xs font-bold text-surface-700 hover:bg-surface-50 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-300 dark:hover:bg-surface-700">
        <Icon name="lucide:arrow-left-right" class="h-4 w-4 mr-1.5" />
        {{ tool.ui?.btn_swap || 'Swap' }}
      </button>
      <button @click="clearAll" class="rounded-xl border border-surface-200 bg-white px-4 py-2 text-xs font-bold text-surface-700 hover:bg-surface-50 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-300 dark:hover:bg-surface-700">
        {{ $t('system.clearAll') }}
      </button>
      <label class="inline-flex items-center gap-1.5 text-xs text-surface-600 dark:text-surface-400 select-none ml-1">
        <button
          @click="ignoreArrayOrder = !ignoreArrayOrder"
          class="relative inline-flex h-4 w-7 items-center rounded-full transition-colors"
          :class="ignoreArrayOrder ? 'bg-primary-500' : 'bg-surface-300 dark:bg-surface-600'"
        >
          <span
            class="inline-block h-3 w-3 transform rounded-full bg-white transition-transform"
            :class="ignoreArrayOrder ? 'translate-x-3.5' : 'translate-x-0.5'"
          />
        </button>
        {{ tool.ui?.btn_ignore_order || 'Ignore array order' }}
      </label>
    </div>

  </div>

  <!-- Desktop: resizable split -->
  <div class="hidden lg:block">
    <ResizablePanel v-model:fullscreen="fullscreen" :initial-ratio="0.5" responsive>
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

      <template #toolbar-left>
        <button @click="compare" class="btn-primary px-5 py-2 text-xs">
          <Icon name="lucide:git-compare" class="h-4 w-4 mr-1.5" />
          {{ tool.ui?.btn_compare || 'Compare' }}
        </button>
        <button @click="sortAndCompare" class="rounded-xl border border-surface-200 bg-white px-4 py-2 text-xs font-bold text-surface-700 hover:bg-surface-50 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-300 dark:hover:bg-surface-700">
          <Icon name="lucide:arrow-az" class="h-4 w-4 mr-1.5" />
          {{ tool.ui?.btn_sort_keys || 'Sort Keys' }}
        </button>
        <button @click="swapInputs" class="rounded-xl border border-surface-200 bg-white px-4 py-2 text-xs font-bold text-surface-700 hover:bg-surface-50 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-300 dark:hover:bg-surface-700">
          <Icon name="lucide:arrow-left-right" class="h-4 w-4 mr-1.5" />
          {{ tool.ui?.btn_swap || 'Swap' }}
        </button>
        <button @click="clearAll" class="rounded-xl border border-surface-200 bg-white px-4 py-2 text-xs font-bold text-surface-700 hover:bg-surface-50 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-300 dark:hover:bg-surface-700">
          {{ $t('system.clearAll') }}
        </button>
        <div class="h-4 w-px bg-surface-200 dark:bg-surface-700 mx-1"></div>
        <label class="inline-flex items-center gap-1.5 text-xs text-surface-600 dark:text-surface-400 select-none">
          <button
            @click="ignoreArrayOrder = !ignoreArrayOrder"
            class="relative inline-flex h-4 w-7 items-center rounded-full transition-colors"
            :class="ignoreArrayOrder ? 'bg-primary-500' : 'bg-surface-300 dark:bg-surface-600'"
          >
            <span
              class="inline-block h-3 w-3 transform rounded-full bg-white transition-transform"
              :class="ignoreArrayOrder ? 'translate-x-3.5' : 'translate-x-0.5'"
            />
          </button>
          {{ tool.ui?.btn_ignore_order || 'Ignore array order' }}
        </label>
      </template>
    </ResizablePanel>
  </div>

  <!-- Error -->
  <div v-if="error" class="mt-4 rounded-lg bg-red-50 border border-red-200 p-3 text-xs text-red-700 dark:bg-red-900/30 dark:border-red-800 dark:text-red-400">{{ error }}</div>
</template>

<script setup lang="ts">
const props = defineProps<{ tool: any }>()

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

const ignoreArrayOrder = ref(false)

// ── Line-level diff highlighting ──
watch([leftDecorations, rightDecorations], ([newLeft, newRight]) => {
  leftEditor.value?.setLineDecorations(newLeft)
  rightEditor.value?.setLineDecorations(newRight)
}, { flush: 'post' })

// Also update decorations when ignoreArrayOrder changes (re-compare triggers diffs watch)

// ── Scroll sync between editors ──
let scrollSyncing = false

onMounted(() => {
  // Register scroll handlers for CodeMirror editors
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

const deepSortKeys = (obj: any): any => {
  if (Array.isArray(obj)) return obj.map(deepSortKeys)
  if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj).sort().reduce((acc: any, key) => { acc[key] = deepSortKeys(obj[key]); return acc }, {})
  }
  return obj
}

const sortAndCompare = () => {
  if (!leftJson.value.trim() || !rightJson.value.trim()) return
  let parsedLeft: any, parsedRight: any
  try { parsedLeft = JSON.parse(leftJson.value) } catch { return }
  try { parsedRight = JSON.parse(rightJson.value) } catch { return }
  leftJson.value = JSON.stringify(deepSortKeys(parsedLeft), null, 2)
  rightJson.value = JSON.stringify(deepSortKeys(parsedRight), null, 2)
  compare()
}

const compare = () => {
  error.value = ''; diffs.value = []; compared.value = false
  leftDecorations.value = []; rightDecorations.value = []
  leftPathLine.value = new Map(); rightPathLine.value = new Map()
  leftEditor.value?.clearLineDecorations()
  rightEditor.value?.clearLineDecorations()

  if (!leftJson.value.trim() || !rightJson.value.trim()) return

  // Validate JSON
  try { JSON.parse(leftJson.value) } catch (e) { error.value = `JSON A: ${(e as Error).message}`; return }
  try { JSON.parse(rightJson.value) } catch (e) { error.value = `JSON B: ${(e as Error).message}`; return }

  // Compute diff + line mapping in one shot
  const result = computeAndMap(leftJson.value, rightJson.value, ignoreArrayOrder.value)
  diffs.value = result.diffs as Diff[]
  leftDecorations.value = result.leftLines
  rightDecorations.value = result.rightLines
  leftPathLine.value = result.leftPathLine
  rightPathLine.value = result.rightPathLine
  compared.value = true
}

const swapInputs = () => { const temp = leftJson.value; leftJson.value = rightJson.value; rightJson.value = temp }
const onClearLeft = () => { error.value = '' }
const onClearRight = () => { error.value = '' }
const clearAll = () => {
  leftJson.value = ''; rightJson.value = ''; error.value = ''; diffs.value = []; compared.value = false
  leftEditor.value?.clearLineDecorations()
  rightEditor.value?.clearLineDecorations()
}
</script>
