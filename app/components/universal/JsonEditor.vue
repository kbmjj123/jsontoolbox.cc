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
    :detail="shareLoadDetail ?? undefined"
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
          :label="tool.ui?.label_input"
          :placeholder="tool.ui?.placeholder_input"
          :error-line="parseError?.line ?? 0"
          :error-column="parseError?.column ?? 0"
          :friendly-message="friendlyMessage"
          :error="error"
          :error-copied="errorCopied"
          :readonly="isSharedReadonly"
          :show-upload="!isSharedReadonly"
          :show-paste="!isSharedReadonly"
          :show-clear="!isSharedReadonly"
          example-slug="json-editor"
          block-oversized
          :show-sensitive-warning="false"
          @clear="clearAll"
          @paste="onInputPaste"
          @locate-error="onLocateFromPanel"
          @copy-error="copyErrorMessage"
          @example-loaded="onExampleLoaded"
          @file-size="onFileSize"
        />
      </div>
    </template>

    <!-- Output panel (L3: package TreeView / TableView) -->
    <template #second>
      <div class="h-full pl-3 flex flex-col overflow-hidden">
        <div class="flex items-center justify-between gap-2 mb-2 shrink-0">
          <span class="text-xs font-bold text-surface-600 dark:text-surface-400">{{ tool.ui?.label_output }}</span>
          <div
            v-if="props.showViewToggle"
            class="inline-flex rounded-lg border border-surface-200 dark:border-surface-700 overflow-hidden"
          >
            <button
              v-for="m in viewModes"
              :key="m.value"
              type="button"
              @click="viewMode = m.value"
              :class="viewMode === m.value
                ? 'bg-primary-600 text-white dark:bg-primary-500'
                : 'bg-white text-surface-600 hover:bg-surface-50 dark:bg-surface-800 dark:text-surface-400 dark:hover:bg-surface-700'"
              class="px-2.5 py-1 text-[11px] font-bold transition-colors"
            >{{ m.label }}</button>
          </div>
        </div>

        <div class="flex-1 overflow-hidden">
          <!-- Text view: the formatted output, copy/download handled by the
               site toolbar. -->
          <pre
            v-if="viewMode === 'text'"
            class="h-full overflow-auto whitespace-pre-wrap break-words text-xs leading-relaxed text-surface-700 dark:text-surface-200 font-mono"
          >{{ outputJson }}</pre>

          <!-- Rich view: package TreeView (5-mode search, node editing,
               undo/redo/batch, copy path — all from the package). Edits write
               back to inputJson via update:text. -->
          <TreeView
            v-else-if="viewMode === 'rich'"
            class="h-full"
            :text="inputJson"
            :locale="editorLocale"
            :editable="!isSharedReadonly"
            :indent="indent"
            :masked="masked"
            :sensitive-paths="[...sensitivePathSet]"
            @update:text="inputJson = $event"
            @select="onTreeSelect"
          />

          <!-- Table view: package TableView (sort / column toggle / CSV export). -->
          <TableView
            v-else
            class="h-full"
            :value="parsedData"
            :locale="editorLocale"
          />
        </div>
      </div>
    </template>

    <!-- Toolbar left: indent + action buttons -->
    <template #toolbar-left>
      <div class="flex flex-wrap items-center gap-2 shrink-0">
        <div class="flex items-center gap-2">
          <label class="text-xs font-bold text-surface-600 dark:text-surface-400">{{ tool.ui?.option_indent }}</label>
          <select v-model="indent" class="rounded-lg border border-surface-200 bg-white px-2 py-1 text-xs dark:border-surface-700 dark:bg-surface-800">
            <option :value="1">{{ $t('formatter.1space') }}</option>
            <option :value="2">{{ tool.ui?.option_indent_2 || $t('formatter.2spaces') }}</option>
            <option :value="3">{{ $t('formatter.3spaces') }}</option>
            <option :value="4">{{ tool.ui?.option_indent_4 || $t('formatter.4spaces') }}</option>
            <option :value="6">{{ $t('formatter.6spaces') }}</option>
            <option :value="8">{{ $t('formatter.8spaces') }}</option>
            <option value="tab">{{ $t('formatter.tab') }}</option>
            <option :value="0">{{ tool.ui?.option_indent_minified || $t('system.minify') }}</option>
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
            {{ tool.ui?.btn_minify || $t('system.minify') }}
          </button>
          <button
            @click="setFormatted"
            :class="!isMinified
              ? 'bg-primary-600 text-white dark:bg-primary-500'
              : 'bg-white text-surface-600 hover:bg-surface-50 dark:bg-surface-800 dark:text-surface-400 dark:hover:bg-surface-700'"
            class="px-2.5 py-1 text-[11px] font-bold transition-colors"
          >
            {{ tool.ui?.btn_format || $t('system.format') }}
          </button>
        </div>
        <button
          @click="validateJson"
          class="px-2.5 py-1 text-[11px] font-bold transition-colors rounded-lg border border-surface-200 bg-white text-surface-600 hover:bg-surface-50 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-400 dark:hover:bg-surface-700"
        >
          {{ tool.ui?.btn_validate || $t('system.validate') }}
        </button>
      </div>
    </template>

    <!-- Toolbar right: copy + download + share -->
    <template #toolbar-right>
      <div class="flex items-center gap-2 shrink-0">
        <button
          v-if="outputJson"
          @click="copyOutput"
          class="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400"
        >
          {{ clipboard.copied.value ? $t('system.copied') : (tool.ui?.btn_copy || $t('system.copy')) }}
        </button>
        <button
          v-if="outputJson"
          @click="clipboard.copyMinified()"
          class="text-xs text-surface-500 hover:text-surface-700 dark:text-surface-400"
        >
          {{ $t('clipboard.copyMinifiedLabel') }}
        </button>
        <button
          v-if="outputJson"
          @click="downloadOutput"
          class="text-xs text-surface-500 hover:text-surface-700 dark:text-surface-400"
        >
          {{ tool.ui?.btn_download || $t('system.download') }}
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

  <!-- Over the size limit: hand the content to the Large JSON Explorer -->
  <LargeFileWarning
    :visible="largeFile.visible.value"
    :formatted-size="formatBytes(largeFile.bytes.value)"
    @open-explorer="largeFile.openExplorer()"
    @cancel="handleLargeFileCancel"
  />

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
import type { ParseError } from '~/types/jsonErrors'
import type { LoadFailureReason } from '~/composables/useSharedPayloadLoader'
// L1: JSON 纯函数统一走 @kbmjj123/json-editor/core，站点只在外层叠加自己的
// 增强（jsonrepair 修复、友好错误文案）。包的 core 保持纯 JSON.parse 语义。
// L3: 树 / 表格渲染层用包的 TreeView / TableView（P4）。站点只保留 L4 外壳
// （分享 / 大文件 / 敏感遮罩 / 示例下拉 / Nuxt i18n），不再自带树组件。
import { buildSourceMap, parseJson } from '@kbmjj123/json-editor/core'
import { TreeView, TableView } from '@kbmjj123/json-editor/vue'
import { useLargeFileGate } from '~/composables/useLargeFile'
import { useClipboardActions } from '~/composables/useClipboardActions'

const props = withDefaults(defineProps<{
  tool: any
  showViewToggle?: boolean
  defaultViewMode?: 'text' | 'rich' | 'table'
}>(), {
  showViewToggle: true,
  defaultViewMode: 'rich',
})

/** Reactive view of the tool config (re-resolves when the locale changes). */
const tool = computed(() => props.tool)

const inputJson = ref('')
const inboxApplied = ref(false)
onMounted(() => {
  const text = useJsonInbox().consumeInbox()
  if (text != null) {
    inputJson.value = text
    inboxApplied.value = true
  }
})
const outputJson = ref('')
const error = ref('')
const parseError = ref<ParseError | null>(null)
const indent = ref<number | string>(2)

// ── Clipboard workflow (F12): copy formatted / minified JSON. Node editing now
// lives inside the package TreeView (P4), so "replace node from clipboard" is
// no longer offered on the flagship tree. ──
const clipboard = useClipboardActions({ inputJson, indent })

const viewMode = ref<'text' | 'rich' | 'table'>(props.defaultViewMode)
// View-mode toggle labels — wired to json-editor.json `ui.view_*`, both langs.
const viewModes = computed(() => [
  { value: 'text' as const, label: props.tool.ui?.view_text },
  { value: 'rich' as const, label: props.tool.ui?.view_rich },
  { value: 'table' as const, label: props.tool.ui?.view_table },
])
const fullscreen = ref(false)
const lastAction = ref<'formatted' | 'minified' | 'validated'>('formatted')

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

/** Renders `status_error_at` — "Error at line {line}, column {column}". */
function errorLocationText(err: ParseError): string {
  const template = props.tool.ui?.status_error_at
  if (typeof template === 'string' && template) {
    return template.replace('{line}', String(err.line)).replace('{column}', String(err.column))
  }
  return t('errors.lineCol', { line: err.line, col: err.column })
}

/** Full user-facing error: "<Invalid JSON> — <Error at line L, column C>: <detail>". */
function errorTextFor(err: ParseError | null): string {
  const invalid = props.tool.ui?.status_invalid
    || props.tool.ui?.error_invalid_json
    || t('formatter.invalidJson')
  if (!err) return props.tool.ui?.error_invalid_json || invalid
  return `${invalid} — ${errorLocationText(err)}: ${friendlyMessage.value || err.message}`
}


// ── Input editor ref & source map ─────────────────────────────
const inputEditorRef = ref<InstanceType<typeof import('~/components/tool/JsonInputEditor.vue').default>>()
const sourceMap = ref<Map<string, number>>(new Map())

watch(inputJson, useDebounceFn(() => {
  sourceMap.value = inputJson.value ? buildSourceMap(inputJson.value) : new Map()
}, 500))

// Tree node selection (package TreeView `select`): reveal the matching line in
// the input editor via the site's source map. Replaces the old provide().
function onTreeSelect(info: { path: string; jsonPath: string; value: unknown }) {
  if (!info.path) return
  const line = sourceMap.value.get(info.path)
  if (!line) return
  inputEditorRef.value?.scrollToLine(line)
  inputEditorRef.value?.highlightLine(line, 'flash')
}

const { repairJson, getJsonError } = useJsonFixer()
const share = useShareJson()
const sharedPayloadLoader = useSharedPayloadLoader()
const { formatBytes } = useFileSize()
// Single entry point for "this input is too big for a regular tool".
const largeFile = useLargeFileGate()

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
const shareLoadError = ref<LoadFailureReason | null>(null)
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
  largeFile.close()
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

    // Restore content. A shared link can carry a document that is too big for
    // this page — hand it off instead of loading it into the editor.
    if (largeFile.check(payload.content.rawText)) return
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

// Regular tools always parse on the main thread. Anything above
// LARGE_FILE_MAX_BYTES never reaches here — it is handed off to the Large JSON
// Explorer by `largeFile` instead of being parsed here.
const parsedData = computed(() => {
  if (largeFile.blocked.value) return null
  return parseJson(inputJson.value).data
})

const { t, locale } = useI18n()
const editorLocale = computed(() => (locale.value === 'zh' ? 'zh' : 'en'))
const toast = useToast()

const formatJson = (silent = false) => {
  if (!inputJson.value.trim()) { error.value = ''; parseError.value = null; outputJson.value = ''; return }
  // Oversized input is waiting to be handed off to the Large JSON Explorer —
  // never parse it here.
  if (largeFile.blocked.value) return

  try {
    const parsed = JSON.parse(inputJson.value)
    const space = indent.value === 'tab' ? '\t' : Number(indent.value)
    outputJson.value = JSON.stringify(parsed, null, space)
    lastAction.value = Number(indent.value) === 0 ? 'minified' : 'formatted'
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
      lastAction.value = Number(indent.value) === 0 ? 'minified' : 'formatted'
      error.value = ''
      parseError.value = null
      if (!silent) toast.success(Number(indent.value) === 0 ? t('toast.minified') : t('toast.formatted'))
      return
    }
    const err = getJsonError(inputJson.value)
    parseError.value = err
    error.value = errorTextFor(err)
    if (!silent) toast.error(error.value)
  }
}

const isMinified = computed(() => Number(indent.value) === 0)
const lastIndent = ref<number | string>(2)

const setMinified = () => {
  if (!isMinified.value) lastIndent.value = indent.value
  indent.value = 0
}

const setFormatted = () => {
  indent.value = lastIndent.value
}

const validateJson = () => {
  if (!inputJson.value.trim()) {
    error.value = ''
    parseError.value = null
    outputJson.value = ''
    toast.error(props.tool.ui?.error_empty_input || t('edit.emptyInput'))
    return
  }
  if (largeFile.blocked.value) return

  try {
    JSON.parse(inputJson.value)
    outputJson.value = props.tool.ui?.status_valid || t('formatter.validJson')
    lastAction.value = 'validated'
    error.value = ''
    parseError.value = null
    toast.success(t('toast.validated'))
  } catch {
    const err = getJsonError(inputJson.value)
    parseError.value = err
    error.value = errorTextFor(err)
    outputJson.value = ''
    toast.error(error.value)
  }
}

const clearAll = () => {
  largeFile.close()
  outputJson.value = ''
  error.value = ''
  parseError.value = null
}

// ── Over the limit → Large JSON Explorer ─────────────────────
// This page only ever handles input up to LARGE_FILE_MAX_BYTES. Anything bigger
// is refused here and carried over (in memory) to the one page that owns
// large-file processing, so the user never re-uploads or re-pastes.
const onFileSize = (info: { bytes: number; oversized: boolean; text: string; fileName?: string }) => {
  if (!info.oversized) return
  largeFile.check(info.text, info.fileName || 'data.json', info.bytes)
}

// The oversized text was never loaded into the editor, so backing out keeps
// whatever the user had before — nothing to clear.
const handleLargeFileCancel = () => {
  largeFile.close()
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
  const text = `${errorLocationText(parseError.value)}: ${friendlyMessage.value || parseError.value.message}`
  await copyToClipboard(text)
  errorCopied.value = true
  setTimeout(() => { errorCopied.value = false }, 2000)
}

// In-place format: replace inputJson with formatted version
const formatInputInPlace = () => {
  if (!inputJson.value.trim()) return
  if (largeFile.blocked.value) return

  try {
    const parsed = JSON.parse(inputJson.value)
    const space = indent.value === 'tab' ? '\t' : Number(indent.value)
    inputJson.value = JSON.stringify(parsed, null, space)
  } catch {}
}

// Paste: immediately format input in-place
const onInputPaste = () => {
  nextTick(() => {
    formatInputInPlace()
    // Hint only — URL / Base64 are reported, never silently rewritten.
    clipboard.hintAfterPaste(inputJson.value)
  })
}

// 300ms debounce: update output panel only (non-intrusive)
const debouncedFormat = useDebounceFn(() => { formatJson(true) }, 300)
// 1.5s debounce: format input in-place (after user stops typing)
const debouncedFormatInPlace = useDebounceFn(() => { formatInputInPlace() }, 1500)

watch(inputJson, () => {
  // Oversized input is parked for hand-off — skip every normal parse path.
  if (largeFile.blocked.value) return
  debouncedFormat()
  debouncedFormatInPlace()
})

// Indent change: immediate re-format (deliberate user action, no debounce)
watch(indent, () => {
  if (!inputJson.value.trim()) return
  formatJson()
  formatInputInPlace()
})

useEventListener('keydown', (e: KeyboardEvent) => {
  if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
    e.preventDefault()
    formatJson()
  }
})

const copyOutput = () => clipboard.copyFormatted()

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

  // If no shared content (and no content handed over from the hero picker),
  // load default example
  if (!isSharedSession.value && !inboxApplied.value) {
    loadDefaultExample()
  }
})
</script>
