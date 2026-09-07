<script setup lang="ts">
import type { ParseError, FieldError } from '~/types/jsonErrors'
import type { FileSizeCategory } from '~/composables/useFileSize'

definePageMeta({ layout: 'embed' })

const route = useRoute()
const { t, locale, setLocale } = useI18n()

useSeoMeta({
  title: () => t('embed.jsonSeo.title'),
  description: () => t('embed.jsonSeo.description'),
})
const toast = useToast()

// Apply locale from query param
const queryLocale = route.query.lang as string
if (queryLocale && ['en', 'zh'].includes(queryLocale)) {
  setLocale(queryLocale)
}

// ── Query params ─────────────────────────────────────────────
const mode = computed(() => {
  const m = route.query.mode as string
  return m === 'editor' ? 'editor' : 'viewer'
})
const theme = computed(() => {
  const t = route.query.theme as string
  return t === 'light' || t === 'dark' ? t : 'auto'
})
const minHeight = computed(() => {
  const h = Number(route.query.height)
  return h > 0 ? h : 480
})
const showToolbar = computed(() => route.query.toolbar !== '0')
const isReadonly = computed(() => route.query.readonly === '1')
const showBranding = computed(() => route.query.branding !== '0')
const isPreview = computed(() => route.query.preview === '1')
const initialIndent = computed(() => {
  const v = route.query.indent as string
  if (v === 'tab') return 'tab'
  const n = Number(v)
  return n > 0 ? n : 2
})
const exampleSlug = computed(() => (route.query.example as string) || '')

// ── Theme ───────────────────────────────────────────────────
const resolvedTheme = ref<'light' | 'dark'>('light')

function applyTheme() {
  if (import.meta.server) return
  const html = document.documentElement
  if (theme.value === 'auto') {
    resolvedTheme.value = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  } else {
    resolvedTheme.value = theme.value
  }
  html.classList.toggle('dark', resolvedTheme.value === 'dark')
}

onMounted(() => {
  applyTheme()
  if (theme.value === 'auto') {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyTheme)
  }
})

// ── Editor state ─────────────────────────────────────────────
const inputJson = ref('')
const outputJson = ref('')
const error = ref('')
const parseError = ref<ParseError | null>(null)
const indent = ref<number | string>(initialIndent.value)
const autoFormat = ref(true)
const viewMode = ref<'text' | 'rich' | 'table'>('rich')
const fieldErrors = ref<FieldError[]>([])

const fullscreen = ref(false)
const inputEditorRef = ref<InstanceType<typeof import('~/components/tool/JsonInputEditor.vue').default>>()

const { repairJson, getJsonError } = useJsonFixer()
const { parseInWorker, isParsing } = useWorkerParser()
const { detectSize, formatBytes, fileSizeCategory, fileSizeBytes, isLargeFile, getPartialText } = useFileSize()

const friendlyMessage = computed(() => {
  if (!parseError.value?.errorKey) return ''
  return t(`errors.messages.${parseError.value.errorKey}`, {
    line: parseError.value.line,
    col: parseError.value.column,
  }, { default: parseError.value.message })
})

const parsedData = computed(() => {
  try { return JSON.parse(inputJson.value) } catch { return null }
})

// ── Large file handling ─────────────────────────────────────
const showLargeFileWarning = ref(false)
const pendingLargeText = ref('')

const onFileSize = (info: { bytes: number; category: FileSizeCategory }) => {
  detectSize(inputJson.value)
  if (info.category === 'large') {
    showLargeFileWarning.value = true
    pendingLargeText.value = inputJson.value
  }
}

const handleLargeFileContinue = () => {
  showLargeFileWarning.value = false
  pendingLargeText.value = ''
  nextTick(() => formatJson())
}

const handleLargeFilePartial = () => {
  showLargeFileWarning.value = false
  const partial = getPartialText(inputJson.value, 20 * 1024 * 1024)
  inputJson.value = partial
  nextTick(() => formatJson())
}

const handleLargeFileCancel = () => {
  showLargeFileWarning.value = false
  pendingLargeText.value = ''
  inputJson.value = ''
  outputJson.value = ''
  error.value = ''
  parseError.value = null
  parsedData.value = null
}

// ── Format / Minify / Validate ───────────────────────────────
const formatJson = (silent = false) => {
  if (!inputJson.value.trim()) {
    error.value = ''; parseError.value = null; outputJson.value = ''; return
  }

  if (isLargeFile(inputJson.value)) {
    formatJsonAsync(silent)
    return
  }

  try {
    const parsed = JSON.parse(inputJson.value)
    const space = indent.value === 'tab' ? '\t' : Number(indent.value)
    outputJson.value = JSON.stringify(parsed, null, space)
    error.value = ''
    parseError.value = null
    if (!silent) toast.success(Number(indent.value) === 0 ? t('toast.minified') : t('toast.formatted'))
  } catch {
    const repaired = repairJson(inputJson.value)
    if (repaired) {
      inputJson.value = repaired
      const parsed = JSON.parse(repaired)
      const space = indent.value === 'tab' ? '\t' : Number(indent.value)
      outputJson.value = JSON.stringify(parsed, null, space)
      error.value = ''
      parseError.value = null
      if (!silent) toast.success(Number(indent.value) === 0 ? t('toast.minified') : t('toast.formatted'))
      return
    }
    const err = getJsonError(inputJson.value)
    parseError.value = err
    error.value = err ? t('errors.lineCol', { line: err.line, col: err.column }) + ': ' + err.message : t('formatter.invalidJson')
    if (!silent) toast.error(error.value)
  }
}

async function formatJsonAsync(silent: boolean) {
  const result = await parseInWorker(inputJson.value)
  if (result.data !== null) {
    const space = indent.value === 'tab' ? '\t' : Number(indent.value)
    outputJson.value = JSON.stringify(result.data, null, space)
    error.value = ''
    parseError.value = null
    if (!silent) toast.success(Number(indent.value) === 0 ? t('toast.minified') : t('toast.formatted'))
  }
  else {
    const repaired = repairJson(inputJson.value)
    if (repaired) {
      inputJson.value = repaired
      const parsed = JSON.parse(repaired)
      const space = indent.value === 'tab' ? '\t' : Number(indent.value)
      outputJson.value = JSON.stringify(parsed, null, space)
      error.value = ''
      parseError.value = null
      if (!silent) toast.success(Number(indent.value) === 0 ? t('toast.minified') : t('toast.formatted'))
      return
    }
    const err = result.error ? { message: result.error, line: result.line, column: result.column, errorKey: '' } : getJsonError(inputJson.value)
    parseError.value = err
    error.value = err ? t('errors.lineCol', { line: err.line, col: err.column }) + ': ' + err.message : t('formatter.invalidJson')
    if (!silent) toast.error(error.value)
  }
}

const validateJson = () => {
  if (!inputJson.value.trim()) {
    error.value = ''; parseError.value = null; outputJson.value = ''; return
  }

  if (isLargeFile(inputJson.value)) {
    validateJsonAsync()
    return
  }

  try {
    JSON.parse(inputJson.value)
    outputJson.value = t('formatter.validJson')
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

async function validateJsonAsync() {
  const result = await parseInWorker(inputJson.value)
  if (result.data !== null) {
    outputJson.value = t('formatter.validJson')
    error.value = ''
    parseError.value = null
    toast.success(t('toast.validated'))
  }
  else {
    const err = result.error ? { message: result.error, line: result.line, column: result.column, errorKey: '' } : getJsonError(inputJson.value)
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

const onLocateFromPanel = () => {
  if (!parseError.value) return
  nextTick(() => {
    inputEditorRef.value?.scrollToLine(parseError.value!.line)
    inputEditorRef.value?.highlightLine(parseError.value!.line, 'flash')
  })
}

// ── Indent / minify toggle ───────────────────────────────────
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

// ── Paste / auto-format ─────────────────────────────────────
const formatInputInPlace = () => {
  if (!inputJson.value.trim()) return

  if (isLargeFile(inputJson.value)) {
    formatInputInPlaceAsync()
    return
  }

  try {
    const parsed = JSON.parse(inputJson.value)
    const space = indent.value === 'tab' ? '\t' : Number(indent.value)
    inputJson.value = JSON.stringify(parsed, null, space)
  } catch {}
}

async function formatInputInPlaceAsync() {
  const result = await parseInWorker(inputJson.value)
  if (result.data !== null) {
    const space = indent.value === 'tab' ? '\t' : Number(indent.value)
    inputJson.value = JSON.stringify(result.data, null, space)
  }
}

const onInputPaste = () => {
  if (autoFormat.value) nextTick(() => formatInputInPlace())
}

const debouncedFormat = useDebounceFn(() => { formatJson(true) }, 300)
const debouncedFormatInPlace = useDebounceFn(() => { formatInputInPlace() }, 1500)

watch(inputJson, () => {
  if (autoFormat.value) {
    debouncedFormat()
    debouncedFormatInPlace()
  }
})

watch(indent, () => {
  if (!inputJson.value.trim()) return
  formatJson()
  if (autoFormat.value) formatInputInPlace()
})

useEventListener('keydown', (e: KeyboardEvent) => {
  if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
    e.preventDefault()
    formatJson()
  }
})

// ── Copy / Download ─────────────────────────────────────────
const copyJustCopied = ref(false)

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
  link.download = 'output.json'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// ── Load example on mount ────────────────────────────────────
const onExampleLoaded = () => { nextTick(() => formatJson()) }

// ── Open full editor URL ─────────────────────────────────────
const fullEditorUrl = computed(() => {
  const base = 'https://jsontoolbox.cc/tools/format/json-editor'
  return base
})
</script>

<template>
  <div
    class="flex flex-col h-full"
  >
    <!-- Top bar -->
    <div class="flex items-center justify-between px-4 py-2 border-b border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 shrink-0">
      <span class="text-sm font-semibold text-surface-700 dark:text-surface-300">
        JsonToolBox
      </span>
      <a
        :href="fullEditorUrl"
        target="_blank"
        rel="noopener"
        class="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
      >
        {{ $t('embed.openFullEditor') || 'Open full editor ↗' }}
      </a>
    </div>

    <!-- Editor mode -->
    <div v-if="mode === 'editor'" class="flex-1 flex flex-col overflow-hidden px-4 pb-4" :style="{ minHeight: minHeight + 'px' }">
      <ResizablePanel v-model:fullscreen="fullscreen" :initial-ratio="0.5" responsive class="flex-1">
        <template #header-left>
          <span />
        </template>

        <template v-if="isPreview" #header-right>
          <span />
        </template>

        <template #first>
          <div class="h-full pr-3 overflow-hidden relative">
            <!-- Parsing indicator -->
            <div v-if="isParsing" class="absolute inset-0 z-20 flex items-center justify-center bg-surface-50/80 dark:bg-surface-800/80 backdrop-blur-sm rounded-xl">
              <div class="flex items-center gap-3 px-4 py-3 rounded-lg bg-white dark:bg-surface-900 shadow-lg border border-surface-200 dark:border-surface-700">
                <div class="w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
                <span class="text-sm font-medium text-surface-700 dark:text-surface-300">{{ $t('largeFile.parsing') }}</span>
              </div>
            </div>
            <JsonInputEditor
              ref="inputEditorRef"
              v-model="inputJson"
              :label="$t('embed.inputLabel') || 'Input JSON'"
              placeholder='{"name": "JSON Toolbox", "version": "1.0"}'
              :error-line="parseError?.line ?? 0"
              :error-column="parseError?.column ?? 0"
              :friendly-message="friendlyMessage"
              :error="error"
              :show-upload="!isReadonly && !isPreview"
              :show-load-url="!isReadonly && !isPreview"
              :show-paste="!isReadonly && !isPreview"
              :show-clear="!isReadonly && !isPreview"
              :example-slug="exampleSlug || 'json-editor'"
              @clear="clearAll"
              @paste="onInputPaste"
              @locate-error="onLocateFromPanel"
              @example-loaded="onExampleLoaded"
              @file-size="onFileSize"
            />
          </div>
        </template>

        <template #second>
          <div class="h-full pl-3 flex flex-col overflow-hidden">
            <JsonOutputPanel
              :label="$t('embed.outputLabel') || 'Output'"
              :content="outputJson"
              :error="error"
              :friendly-message="friendlyMessage"
              :view-mode="viewMode"
              :parsed-data="parsedData"
              :field-errors="fieldErrors"
              :show-copy="false"
              :show-download="false"
              :show-view-toggle="true"
              :empty-text="$t('system.emptyOutput')"
              :file-size-category="fileSizeCategory"
              @update:view-mode="viewMode = $event"
              @copy="copyOutput"
              @download="downloadOutput"
              @locate-error="onLocateFromPanel"
              @load-example="onExampleLoaded"
            />
          </div>
        </template>

        <template v-if="showToolbar && !isReadonly" #toolbar-left>
          <!-- File size mode indicator -->
          <div
            v-if="fileSizeCategory !== 'small'"
            class="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium"
            :class="fileSizeCategory === 'large'
              ? 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'
              : 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400'"
          >
            <Icon name="lucide:hard-drive" class="w-3.5 h-3.5" />
            {{ $t('largeFile.mode_' + fileSizeCategory) }}
          </div>
          <!-- Indent selector -->
          <div class="flex items-center gap-2">
            <label class="text-xs font-bold text-surface-600 dark:text-surface-400">{{ $t('embed.indent') || 'Indent:' }}</label>
            <select v-model="indent" class="rounded-lg border border-surface-200 bg-white px-2 py-1 text-xs dark:border-surface-700 dark:bg-surface-800">
              <option :value="1">{{ $t('formatter.1space') }}</option>
              <option :value="2">{{ $t('formatter.2spaces') }}</option>
              <option :value="3">{{ $t('formatter.3spaces') }}</option>
              <option :value="4">{{ $t('formatter.4spaces') }}</option>
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

          <!-- Validate -->
          <button
            @click="validateJson"
            class="text-xs text-surface-500 hover:text-surface-700 dark:text-surface-400 dark:hover:text-surface-200 ml-2"
          >
            {{ $t('system.validate') }}
          </button>
        </template>

        <template v-if="showToolbar && !isReadonly" #toolbar-right>
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
          </div>
        </template>
      </ResizablePanel>
    </div>

    <!-- Viewer mode -->
    <div v-else class="flex-1 flex flex-col overflow-hidden p-4" :style="{ minHeight: minHeight + 'px' }">
      <JsonOutputPanel
        :label="$t('embed.outputLabel') || 'JSON Viewer'"
        :content="outputJson"
        :error="error"
        :friendly-message="friendlyMessage"
        :view-mode="viewMode"
        :parsed-data="parsedData"
        :field-errors="fieldErrors"
        :show-copy="true"
        :show-download="true"
        :show-view-toggle="true"
        :editable="!isReadonly"
        :placeholder="$t('embed.viewerPlaceholder') || 'Paste JSON here to view...'"
        :empty-text="$t('embed.viewerEmpty') || 'Paste or type JSON to view its structure'"
        :file-size-category="fileSizeCategory"
        highlight="json"
        @update:view-mode="viewMode = $event"
        @copy="copyOutput"
        @download="downloadOutput"
      />
    </div>

    <!-- Large file warning -->
    <LargeFileWarning
      :visible="showLargeFileWarning"
      :formatted-size="formatBytes(fileSizeBytes)"
      @continue="handleLargeFileContinue"
      @parse-partial="handleLargeFilePartial"
      @cancel="handleLargeFileCancel"
    />

    <!-- Bottom branding -->
    <div
      v-if="showBranding"
      class="flex items-center justify-center gap-1.5 px-4 py-1.5 border-t border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900 shrink-0"
    >
      <span class="text-[11px] text-surface-400 dark:text-surface-500">
        {{ $t('embed.brandingText') || 'Runs locally in your browser ·' }}
      </span>
      <a
        href="https://jsontoolbox.cc"
        target="_blank"
        rel="noopener"
        class="text-[11px] text-primary-500 hover:text-primary-600 dark:text-primary-400"
      >
        JsonToolBox
      </a>
    </div>
  </div>
</template>
