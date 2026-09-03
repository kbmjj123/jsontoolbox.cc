<template>
  <!-- Shared JSON banner (shown when opened via share link) -->
  <SharedJsonBanner
    v-if="isSharedSession"
    :title="sharedPayload?.meta?.title"
    :source="sharedPayload?.meta?.source"
    @edit-copy="exitReadonly"
  />

  <!-- Share link error state -->
  <ShareLinkErrorState
    v-if="shareLoadError"
    :reason="shareLoadError"
    :detail="shareLoadDetail"
    @open-empty="clearAndReset"
    @paste-manual="focusInput"
  />

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
          :readonly="isSharedReadonly"
          :show-upload="!isSharedReadonly"
          :show-load-url="!isSharedReadonly"
          :show-paste="!isSharedReadonly"
          :show-clear="!isSharedReadonly"
          example-slug="json-editor"
          @clear="clearAll"
          @paste="onInputPaste"
          @locate-error="onLocateFromPanel"
          @copy-error="copyErrorMessage"
          @example-loaded="onExampleLoaded"
        />
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
          :masked="masked"
          :sensitive-paths="sensitivePathSet"
          @update:view-mode="viewMode = $event"
          @update:masked="masked = $event"
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
        <button
          @click="openShareModal"
          class="text-xs text-surface-500 hover:text-surface-700 dark:text-surface-400"
        >
          <Icon name="lucide:share-2" class="w-3.5 h-3.5 inline mr-1" />
          {{ $t('share.button') }}
        </button>
      </div>
    </template>
  </ResizablePanel>

  <!-- Sensitive field warning -->
  <div v-if="sensitiveFields.length > 0" class="mt-2">
    <SensitiveFieldWarning :fields="sensitiveFields" @dismiss="dismissSensitiveWarning" />
  </div>

  <!-- Share Modal -->
  <ShareModal
    :state="share.modalState.value"
    :payload="share.currentPayload.value"
    :sensitive-fields="share.detectedSensitive.value"
    :url-length="share.urlLength.value"
    :error-message="share.errorMessage.value"
    :can-native-share="share.canNativeShare.value"
    v-model:title="share.shareTitle.value"
    v-model:readonly="shareReadonly"
    v-model:settings="shareSettings"
    @close="share.closeModal()"
    @share-anyway="handleShareAnyway"
    @generate="handleGenerateAndCopy"
    @copy-again="share.copyAgain()"
    @open-link="share.openLink()"
    @download="share.downloadOriginal()"
    @download-package="share.downloadSharePackage()"
    @native-share="share.nativeShare()"
    @retry="share.retry()"
  />
</template>

<script setup lang="ts">
import type { ParseError, FieldError } from '~/types/jsonErrors'

const { tool, showViewToggle = true, defaultViewMode = 'rich' } = defineProps<{
  tool: any
  showViewToggle?: boolean
  defaultViewMode?: 'text' | 'rich' | 'table'
}>()

const inputJson = ref('')
const outputJson = ref('')
const error = ref('')
const parseError = ref<ParseError | null>(null)
const indent = ref<number | string>(2)
const autoFormat = ref(true)
const viewMode = ref<'text' | 'rich' | 'table'>(defaultViewMode)
const fullscreen = ref(false)
const lastAction = ref<'formatted' | 'minified' | 'validated'>('formatted')

const fieldErrors = ref<FieldError[]>([]) // placeholder for future field-level validation

// Masked display for sensitive fields
const masked = ref(false)
const sensitivePathSet = computed(() => new Set(sensitiveFields.value.map(f => f.path)))

// Friendly localized error message (for output panel and error bar)
const friendlyMessage = computed(() => {
  if (!parseError.value?.errorKey) return ''
  return t(`errors.messages.${parseError.value.errorKey}`, {
    line: parseError.value.line,
    col: parseError.value.column,
  }, { default: parseError.value.message })
})

const copyJustCopied = ref(false)
// ── Input editor ref & source map ─────────────────────────────
const inputEditorRef = ref<InstanceType<typeof import('~/components/tool/JsonInputEditor.vue').default>>()
const sourceMap = ref<Map<string, number>>(new Map())

watch(inputJson, useDebounceFn(() => {
  sourceMap.value = inputJson.value ? buildSourceMap(inputJson.value) : new Map()
}, 500))

provide('onNodeInteraction', (path: string, type: 'click' | 'hover') => {
  if (!path) {
    inputEditorRef.value?.highlightLine(0, 'subtle')
    return
  }
  const startLine = sourceMap.value.get(path)
  if (!startLine) return

  // Compute end line: find next sibling's start, or EOF
  const endLine = computeEndLine(path)

  if (type === 'click') {
    inputEditorRef.value?.scrollToLine(startLine)
    inputEditorRef.value?.highlightLines(startLine, endLine, 'flash')
  } else {
    inputEditorRef.value?.highlightLines(startLine, endLine, 'subtle')
  }
})

function computeEndLine(path: string): number {
  const sm = sourceMap.value
  const parts = path.split(/\.|\[|\]/).filter(Boolean)
  if (parts.length === 0) return inputJson.value.split('\n').length

  const lastPart = parts[parts.length - 1]
  const parentPrefix = path.slice(0, path.length - lastPart.length)

  // Try numeric increment (array element)
  const num = parseInt(lastPart, 10)
  if (!isNaN(num)) {
    const nextLine = sm.get(parentPrefix + String(num + 1))
    if (nextLine) return nextLine - 1
  }

  return inputJson.value.split('\n').length
}

const { repairJson, getJsonError } = useJsonFixer()
const share = useShareJson()
const sharedPayloadLoader = useSharedPayloadLoader()

// Sensitive field detection
const { scanJson, detectedFields: sensitiveFields, clear: clearSensitiveFields } = useSensitiveFieldDetection()
const sensitiveDismissed = ref(false)

const dismissSensitiveWarning = () => {
  sensitiveDismissed.value = true
  clearSensitiveFields()
}

// Scan for sensitive fields when input changes (debounced)
const debouncedSensitiveScan = useDebounceFn((val: string) => {
  if (sensitiveDismissed.value) return
  if (!val.trim()) { clearSensitiveFields(); return }
  scanJson(val)
}, 500)

watch(inputJson, (val) => {
  sensitiveDismissed.value = false
  debouncedSensitiveScan(val)
})

const loadDefaultExample = () => { inputEditorRef.value?.loadDefaultExample() }
const onExampleLoaded = () => { nextTick(() => formatJson()) }

// ── Share integration ───────────────────────────────────────────
const shareReadonly = ref(true)
const shareSettings = ref(true)
const isSharedReadonly = ref(false)
const isSharedSession = ref(false)
const sharedPayload = ref<any>(null)
const shareLoadError = ref<string | null>(null)
const shareLoadDetail = ref<string | null>(null)

function openShareModal() {
  share.openShare({
    getPayload: () => ({
      tool: 'json-formatter' as const,
      rawText: inputJson.value,
      isValidJson: !error.value && !!inputJson.value.trim(),
      display: {
        readOnly: shareReadonly.value,
        preferredView: viewMode.value === 'text' ? 'code' as const : viewMode.value === 'rich' ? 'tree' as const : 'formatted' as const,
      },
      toolState: {
        indentSize: indent.value === 'tab' ? 'tab' as const : Number(indent.value) as 2 | 4,
      },
      ...(parseError.value && {
        validation: {
          message: parseError.value.message,
          line: parseError.value.line,
          column: parseError.value.column,
        },
      }),
    }),
  })
}

async function handleShareAnyway() {
  share.shareAnyway()
  await share.generateAndCopy()
}

async function handleGenerateAndCopy() {
  await share.generateAndCopy()
}

function exitReadonly() {
  isSharedReadonly.value = false
}

function clearAndReset() {
  inputJson.value = ''
  outputJson.value = ''
  error.value = ''
  parseError.value = null
  shareLoadError.value = null
  shareLoadDetail.value = null
  isSharedSession.value = false
  sharedPayload.value = null
  sharedPayloadLoader.clearHash()
  nextTick(() => inputEditorRef.value?.focus())
}

function focusInput() {
  shareLoadError.value = null
  shareLoadDetail.value = null
  nextTick(() => inputEditorRef.value?.focus())
}

// Load shared payload from hash on mount
async function loadSharedContent() {
  try {
    const result = await sharedPayloadLoader.loadFromHash()
    if (!result.ok) {
      if (result.reason !== 'missing') {
        shareLoadError.value = result.reason
        shareLoadDetail.value = result.detail || null
      }
      return
    }

    const payload = result.payload
    isSharedSession.value = true
    sharedPayload.value = payload

    // Restore content
    inputJson.value = payload.content.rawText
    isSharedReadonly.value = payload.display.readOnly

    // Restore view mode
    if (payload.display.preferredView === 'code') viewMode.value = 'text'
    else if (payload.display.preferredView === 'tree') viewMode.value = 'rich'
    else viewMode.value = 'rich'

    // Restore tool state
    if (payload.toolState?.indentSize) {
      indent.value = payload.toolState.indentSize === 'tab' ? 'tab' : payload.toolState.indentSize
    }

    // Auto-format
    nextTick(() => formatJson(true))
  } catch (e) {
    console.error('Failed to load shared content:', e)
    shareLoadError.value = 'decode_error'
  }
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
const toast = useToast()

const formatJson = (silent = false) => {
  if (!inputJson.value.trim()) { error.value = ''; parseError.value = null; outputJson.value = ''; return }
  try {
    const parsed = JSON.parse(inputJson.value)
    const space = indent.value === 'tab' ? '\t' : Number(indent.value)
    outputJson.value = JSON.stringify(parsed, null, space)
    lastAction.value = Number(indent.value) === 0 ? 'minified' : 'formatted'
    error.value = ''
    parseError.value = null
    if (!silent) toast.success(Number(indent.value) === 0 ? t('toast.minified') : t('toast.formatted'))
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
      if (!silent) toast.success(Number(indent.value) === 0 ? t('toast.minified') : t('toast.formatted'))
      return
    }
    // Repair failed — show error
    const err = getJsonError(inputJson.value)
    parseError.value = err
    error.value = err ? t('errors.lineCol', { line: err.line, col: err.column }) + ': ' + err.message : t('formatter.invalidJson')
    if (!silent) toast.error(error.value)
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
    toast.success(t('toast.validated'))
  } catch {
    const err = getJsonError(inputJson.value)
    parseError.value = err
    error.value = err ? t('errors.lineCol', { line: err.line, col: err.column }) + ': ' + err.message : t('formatter.invalidJson')
    outputJson.value = ''
    toast.error(error.value)
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
const debouncedFormat = useDebounceFn(() => { formatJson(true) }, 300)
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

onMounted(async () => {
  // Check for shared content first
  await loadSharedContent()

  // If no shared content, load default example
  if (!isSharedSession.value) {
    loadDefaultExample()
  }
})
</script>
