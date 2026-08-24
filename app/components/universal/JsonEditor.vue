<template>
  <ResizablePanel v-model:fullscreen="fullscreen" :initial-ratio="0.5" responsive>
    <!-- Header left: label -->
    <template #header-left>
      <span />
    </template>

    <!-- Input editor -->
    <template #first>
      <div class="h-full pr-3 overflow-hidden">
        <JsonInputEditor
          ref="inputEditorRef"
          v-model="inputJson"
          :label="tool.ui?.label_input || 'Input JSON'"
          placeholder='{"name": "JSON Toolbox", "version": "1.0"}'
          :error-line="parseError?.line ?? 0"
          :error-column="parseError?.column ?? 0"
          :friendly-message="friendlyMessage"
          :error="error"
          :error-copied="errorCopied"
          show-upload
          show-load-url
          @clear="clearAll"
          @paste="onInputPaste"
          @locate-error="onLocateFromPanel"
          @copy-error="copyErrorMessage"
        >
          <template #actions>
            <div v-if="hasExamples" ref="exampleMenuRef" class="relative">
              <button
                @click="showExampleMenu = !showExampleMenu"
                class="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400"
              >
                {{ $t('system.example') }}
              </button>
              <div v-if="showExampleMenu" class="absolute left-0 top-full mt-1 bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-lg shadow-lg p-1 z-50 min-w-[140px]">
                <button
                  v-for="ex in examples"
                  :key="ex.id"
                  @click="loadExampleById(ex.id); showExampleMenu = false"
                  class="w-full text-left px-3 py-1.5 text-xs hover:bg-surface-100 dark:hover:bg-surface-700 rounded"
                >
                  {{ getExampleLabel(ex) }}
                </button>
              </div>
            </div>
          </template>
        </JsonInputEditor>
      </div>
    </template>

    <!-- Output panel -->
    <template #second>
      <div class="h-full pl-3 flex flex-col overflow-hidden">
        <JsonOutputPanel
          :label="tool.ui?.label_output || 'Output'"
          :content="outputJson"
          :error="error"
          :friendly-message="friendlyMessage"
          :view-mode="viewMode"
          :parsed-data="parsedData"
          :field-errors="fieldErrors"
          :locate-target="locateTarget"
          :show-copy="false"
          :show-download="false"
          :show-view-toggle="showViewToggle"
          :empty-text="$t('system.emptyOutput')"
          @update:view-mode="viewMode = $event"
          @copy="copyOutput"
          @download="downloadOutput"
          @copy-path="copyPath"
          @locate-error="onLocateFromPanel"
          @load-example="loadDefaultExample"
        />
      </div>
    </template>

    <!-- Toolbar left: indent + action buttons -->
    <template #toolbar-left>
      <div class="flex items-center gap-2">
        <label class="text-xs font-bold text-surface-600 dark:text-surface-400">{{ tool.ui?.option_indent || 'Indent:' }}</label>
        <select v-model="indent" class="rounded-lg border border-surface-200 bg-white px-2 py-1 text-xs dark:border-surface-700 dark:bg-surface-800">
          <option :value="1">{{ $t('formatter.1space') }}</option>
          <option :value="2">{{ tool.ui?.option_2_spaces || $t('formatter.2spaces') }}</option>
          <option :value="3">{{ $t('formatter.3spaces') }}</option>
          <option :value="4">{{ tool.ui?.option_4_spaces || $t('formatter.4spaces') }}</option>
          <option :value="6">{{ $t('formatter.6spaces') }}</option>
          <option :value="8">{{ $t('formatter.8spaces') }}</option>
          <option value="tab">{{ $t('formatter.tab') }}</option>
        </select>
      </div>

      <!-- Minify / Format toggle -->
      <div class="inline-flex rounded-lg border border-surface-200 dark:border-surface-700 overflow-hidden">
        <button
          @click="setMinified"
          :class="isMinified
            ? 'bg-primary-600 text-white dark:bg-primary-500'
            : 'bg-white text-surface-600 hover:bg-surface-50 dark:bg-surface-800 dark:text-surface-400 dark:hover:bg-surface-700'"
          class="px-2.5 py-1 text-[11px] font-bold transition-colors"
        >
          {{ $t('system.minify') }}
        </button>
        <button
          @click="setFormatted"
          :class="!isMinified
            ? 'bg-primary-600 text-white dark:bg-primary-500'
            : 'bg-white text-surface-600 hover:bg-surface-50 dark:bg-surface-800 dark:text-surface-400 dark:hover:bg-surface-700'"
          class="px-2.5 py-1 text-[11px] font-bold transition-colors"
        >
          {{ $t('system.format') || 'Format' }}
        </button>
      </div>
      <!-- Auto-format toggle -->
      <label class="flex items-center gap-1.5 cursor-pointer select-none ml-2">
        <span class="text-xs text-surface-600 dark:text-surface-400">{{ $t('system.autoFormat') }}</span>
        <button
          @click="autoFormat = !autoFormat"
          :class="autoFormat ? 'bg-primary-600' : 'bg-surface-300 dark:bg-surface-600'"
          class="relative inline-flex h-5 w-9 items-center rounded-full transition-colors"
          role="switch"
          :aria-checked="autoFormat"
        >
          <span
            :class="autoFormat ? 'translate-x-4' : 'translate-x-0.5'"
            class="inline-block h-4 w-4 rounded-full bg-white transition-transform"
          />
        </button>
      </label>
    </template>

    <!-- Toolbar right: copy + download + share -->
    <template #toolbar-right>
      <div class="flex items-center gap-2 ml-auto">
        <button
          v-if="outputJson"
          @click="copyOutput"
          class="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400"
        >
          {{ copyJustCopied ? '✓ Copied!' : $t('system.copy') }}
        </button>
        <button
          v-if="outputJson"
          @click="downloadOutput"
          class="text-xs text-surface-500 hover:text-surface-700 dark:text-surface-400"
        >
          {{ $t('system.download') }}
        </button>
        <div class="relative flex items-center" ref="shareMenuRef">
          <button @click="showShareMenu = !showShareMenu" class="text-xs text-surface-500 hover:text-surface-700 dark:text-surface-400">
            {{ $t('system.share') }}
          </button>
          <div v-if="showShareMenu" class="absolute right-0 bottom-full mb-1 bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-lg shadow-lg p-2 z-50 min-w-[200px]">
            <button @click="copyShareLink" class="w-full text-left px-3 py-2 text-xs hover:bg-surface-100 dark:hover:bg-surface-700 rounded">
              {{ shareCopied ? $t('system.copied') : $t('system.copyShareLink') }}
            </button>
            <button @click="shareToTwitter" class="w-full text-left px-3 py-2 text-xs hover:bg-surface-100 dark:hover:bg-surface-700 rounded">
              {{ $t('system.shareOnTwitter') }}
            </button>
            <p class="px-3 pt-1 pb-0.5 text-[10px] text-amber-600 dark:text-amber-400 leading-tight">
              ⚠️ {{ $t('system.shareWarning') }}
            </p>
          </div>
        </div>
      </div>
    </template>
  </ResizablePanel>
</template>

<script setup lang="ts">
import type { ParseError, FieldError } from '~/types/jsonErrors'

const { tool, showViewToggle = true, defaultViewMode = 'rich' } = defineProps<{
  tool: any
  showViewToggle?: boolean
  defaultViewMode?: 'text' | 'rich'
}>()

const inputJson = ref('')
const outputJson = ref('')
const error = ref('')
const parseError = ref<ParseError | null>(null)
const indent = ref<number | string>(2)
const autoFormat = ref(true)
const viewMode = ref<'text' | 'rich'>(defaultViewMode)
const fullscreen = ref(false)
const lastAction = ref<'formatted' | 'minified' | 'validated'>('formatted')

const fieldErrors = ref<FieldError[]>([]) // placeholder for future field-level validation

// Friendly localized error message (for output panel and error bar)
const friendlyMessage = computed(() => {
  if (!parseError.value?.errorKey) return ''
  return t(`errors.messages.${parseError.value.errorKey}`, {
    line: parseError.value.line,
    col: parseError.value.column,
  }, { default: parseError.value.message })
})

const showShareMenu = ref(false)
const shareCopied = ref(false)
const copyJustCopied = ref(false)
const shareMenuRef = ref<HTMLElement>()
const exampleMenuRef = ref<HTMLElement>()

// ── Input editor ref & source map ─────────────────────────────
const inputEditorRef = ref<InstanceType<typeof import('~/components/tool/JsonInputEditor.vue').default>>()
const sourceMap = ref<Map<string, number>>(new Map())

watch(inputJson, useDebounceFn(() => {
  sourceMap.value = inputJson.value ? buildSourceMap(inputJson.value) : new Map()
}, 500))

provide('onNodeInteraction', (path: string, type: 'click' | 'hover') => {
  if (!path) {
    // Clear highlight on mouse leave
    inputEditorRef.value?.highlightLine(0, 'subtle')
    return
  }
  const line = sourceMap.value.get(path)
  if (!line) return
  if (type === 'click') {
    inputEditorRef.value?.scrollToLine(line)
    inputEditorRef.value?.highlightLine(line, 'flash')
  } else {
    inputEditorRef.value?.highlightLine(line, 'subtle')
  }
})

const { repairJson, getJsonError } = useJsonFixer()
const { generateShareUrl, copyShareUrl, shareToSocial } = useShareJson()
const { examples, hasExamples, getLabel: getExampleLabel, loadById } = useToolExample('json-editor')

const showExampleMenu = ref(false)

const loadDefaultExample = () => {
  const ex = examples.value[0]
  if (ex) {
    inputJson.value = ex.input
    nextTick(() => formatJson())
  }
}

const loadExampleById = (id: string) => {
  loadById(id, inputJson)
  nextTick(() => formatJson())
}

const parsedData = computed(() => {
  try {
    return JSON.parse(inputJson.value)
  } catch {
    return null
  }
})

const copyPath = async (path: string) => {
  await copyToClipboard(path)
}

const { t } = useI18n()

const formatJson = () => {
  if (!inputJson.value.trim()) { error.value = ''; parseError.value = null; outputJson.value = ''; return }
  try {
    const parsed = JSON.parse(inputJson.value)
    const space = indent.value === 'tab' ? '\t' : Number(indent.value)
    outputJson.value = JSON.stringify(parsed, null, space)
    lastAction.value = Number(indent.value) === 0 ? 'minified' : 'formatted'
    error.value = ''
    parseError.value = null
  } catch {
    // Auto-repair using jsonrepair library
    const repaired = repairJson(inputJson.value)
    if (repaired) {
      inputJson.value = repaired
      const parsed = JSON.parse(repaired)
      const space = indent.value === 'tab' ? '\t' : Number(indent.value)
      outputJson.value = JSON.stringify(parsed, null, space)
      lastAction.value = Number(indent.value) === 0 ? 'minified' : 'formatted'
      error.value = ''
      parseError.value = null
      return
    }
    // Repair failed — show error
    const err = getJsonError(inputJson.value)
    parseError.value = err
    error.value = err ? t('errors.lineCol', { line: err.line, col: err.column }) + ': ' + err.message : t('formatter.invalidJson')
  }
}

const isMinified = computed(() => Number(indent.value) === 0)
const lastIndent = ref<number | string>(2)

const setMinified = () => {
  if (!isMinified.value) lastIndent.value = indent.value
  indent.value = 0
  if (!autoFormat.value) formatJson()
}

const setFormatted = () => {
  indent.value = lastIndent.value
  if (!autoFormat.value) formatJson()
}

const validateJson = () => {
  if (!inputJson.value.trim()) { error.value = ''; parseError.value = null; outputJson.value = ''; return }
  try {
    JSON.parse(inputJson.value)
    outputJson.value = tool.ui?.status_valid || t('formatter.validJson')
    lastAction.value = 'validated'
    error.value = ''
    parseError.value = null
  } catch {
    const err = getJsonError(inputJson.value)
    parseError.value = err
    error.value = err ? t('errors.lineCol', { line: err.line, col: err.column }) + ': ' + err.message : t('formatter.invalidJson')
    outputJson.value = ''
  }
}

const clearAll = () => {
  outputJson.value = ''
  error.value = ''
  parseError.value = null
}

// Locate error from the output panel "Jump to Error" button
const onLocateFromPanel = () => {
  if (!parseError.value) return
  nextTick(() => {
    inputEditorRef.value?.scrollToLine(parseError.value!.line)
    inputEditorRef.value?.highlightLine(parseError.value!.line, 'flash')
  })
}

// Copy error message to clipboard
const errorCopied = ref(false)
const copyErrorMessage = async () => {
  if (!parseError.value) return
  const text = `${t('errors.lineCol', { line: parseError.value.line, col: parseError.value.column })}: ${friendlyMessage.value || parseError.value.message}`
  await copyToClipboard(text)
  errorCopied.value = true
  setTimeout(() => { errorCopied.value = false }, 2000)
}

// Locate field error in tree — expand ancestors + scroll + flash
const locateTarget = ref('')

// In-place format: replace inputJson with formatted version
const formatInputInPlace = () => {
  if (!inputJson.value.trim()) return
  try {
    const parsed = JSON.parse(inputJson.value)
    const space = indent.value === 'tab' ? '\t' : Number(indent.value)
    inputJson.value = JSON.stringify(parsed, null, space)
  } catch {}
}

// Paste: immediately format input in-place
const onInputPaste = () => {
  if (autoFormat.value) {
    nextTick(() => formatInputInPlace())
  }
}

// 300ms debounce: update output panel only (non-intrusive)
const debouncedFormat = useDebounceFn(() => { formatJson() }, 300)
// 1.5s debounce: format input in-place (after user stops typing)
const debouncedFormatInPlace = useDebounceFn(() => { formatInputInPlace() }, 1500)

watch(inputJson, () => {
  if (autoFormat.value) {
    debouncedFormat()
    debouncedFormatInPlace()
  }
})

// Indent change: immediate re-format (deliberate user action, no debounce)
watch(indent, () => {
  if (!inputJson.value.trim()) return
  formatJson()
  if (autoFormat.value) {
    formatInputInPlace()
  }
})

useEventListener('keydown', (e: KeyboardEvent) => {
  if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
    e.preventDefault()
    formatJson()
  }
})

const copyOutput = async () => {
  await copyToClipboard(outputJson.value)
  copyJustCopied.value = true
  setTimeout(() => { copyJustCopied.value = false }, 2000)
}

const downloadOutput = () => {
  const blob = new Blob([outputJson.value], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${lastAction.value}.json`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

const copyShareLink = async () => {
  if (!outputJson.value) return

  const url = generateShareUrl(outputJson.value)
  const success = await copyShareUrl(url)
  shareCopied.value = success

  setTimeout(() => {
    shareCopied.value = false
    showShareMenu.value = false
  }, 2000)
}

const shareToTwitter = () => {
  if (!outputJson.value) return

  const url = generateShareUrl(outputJson.value)
  shareToSocial(url, 'Check out this formatted JSON', 'twitter')
  showShareMenu.value = false
}

const handleClickOutside = (e: MouseEvent) => {
  const target = e.target as HTMLElement
  if (shareMenuRef.value && !shareMenuRef.value.contains(target)) {
    showShareMenu.value = false
  }
  if (exampleMenuRef.value && !exampleMenuRef.value.contains(target)) {
    showExampleMenu.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  loadDefaultExample()
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>
