<template>
  <ResizablePanel v-model:fullscreen="fullscreen" :initial-ratio="0.5" responsive>
    <!-- Header left: label -->
    <template #header-left>
      <span />
    </template>

    <!-- Input editor -->
    <template #first>
      <div class="h-full pr-3">
        <JsonInputEditor
          v-model="inputJson"
          :label="tool.ui?.label_input || 'Input JSON'"
          placeholder='{"name": "JSON Toolbox", "version": "1.0"}'
          show-upload
          show-load-url
          @clear="clearAll"
          @paste="onInputPaste"
        >
          <template #actions>
            <template v-if="hasExamples">
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
            </template>
          </template>
        </JsonInputEditor>
      </div>
    </template>

    <!-- Output panel -->
    <template #second>
      <div class="h-full pl-3">
        <JsonOutputPanel
          :label="tool.ui?.label_output || 'Output'"
          :content="outputJson"
          :error="error"
          :view-mode="viewMode"
          :parsed-data="parsedData"
          :field-errors="fieldErrors"
          :locate-target="locateTarget"
          :show-copy="false"
          :show-download="false"
          :empty-text="$t('system.emptyOutput')"
          @update:view-mode="viewMode = $event"
          @copy="copyOutput"
          @download="downloadOutput"
          @copy-path="copyPath"
        />
        <JsonErrorsPanel
          :parse-errors="parseErrors"
          :field-errors="fieldErrors"
          @locate-parse-error="onLocateParseError"
          @locate-field-error="onLocateFieldError"
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
          <option :value="0">{{ tool.ui?.option_minified || $t('system.minify') }}</option>
        </select>
      </div>

      <button @click="formatJson" class="btn-primary px-4 py-2 text-xs">
        {{ $t('system.format') }}
      </button>
      <button @click="minifyJson" class="rounded-xl border border-surface-200 bg-white px-4 py-2 text-xs font-bold text-surface-700 hover:bg-surface-50 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-300">
        {{ $t('system.minify') }}
      </button>
      <button @click="validateJson" class="rounded-xl border border-surface-200 bg-white px-4 py-2 text-xs font-bold text-surface-700 hover:bg-surface-50 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-300">
        {{ $t('system.validate') }}
      </button>
      <button @click="fixJson" class="rounded-xl border border-surface-200 bg-white px-4 py-2 text-xs font-bold text-surface-700 hover:bg-surface-50 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-300">
        {{ $t('system.fix') }}
      </button>

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

const { tool } = defineProps<{ tool: any }>()

const inputJson = ref('')
const outputJson = ref('')
const error = ref('')
const parseError = ref<ParseError | null>(null)
const indent = ref<number | string>(2)
const autoFormat = ref(true)
const viewMode = ref<'text' | 'rich'>('rich')
const fullscreen = ref(false)
const lastAction = ref<'formatted' | 'minified' | 'validated'>('formatted')

// Structured errors for the errors panel
const parseErrors = computed<ParseError[]>(() => parseError.value ? [parseError.value] : [])
const fieldErrors = ref<FieldError[]>([]) // placeholder for future field-level validation

const showShareMenu = ref(false)
const shareCopied = ref(false)
const copyJustCopied = ref(false)
const shareMenuRef = ref<HTMLElement>()

const { fixJson: fixJsonAuto, getJsonError } = useJsonFixer()
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
  try {
    await navigator.clipboard.writeText(path)
  } catch {}
}

const { t } = useI18n()

const formatJson = () => {
  if (!inputJson.value.trim()) { error.value = ''; parseError.value = null; outputJson.value = ''; return }
  try {
    const parsed = JSON.parse(inputJson.value)
    const space = indent.value === 'tab' ? '\t' : Number(indent.value)
    outputJson.value = JSON.stringify(parsed, null, space)
    lastAction.value = 'formatted'
    error.value = ''
    parseError.value = null
  } catch {
    const err = getJsonError(inputJson.value)
    parseError.value = err
    error.value = err ? t('errors.lineCol', { line: err.line, col: err.column }) + ': ' + err.message : t('formatter.invalidJson')
  }
}

const minifyJson = () => {
  if (!inputJson.value.trim()) { error.value = ''; parseError.value = null; outputJson.value = ''; return }
  try {
    const parsed = JSON.parse(inputJson.value)
    outputJson.value = JSON.stringify(parsed)
    lastAction.value = 'minified'
    error.value = ''
    parseError.value = null
  } catch {
    const err = getJsonError(inputJson.value)
    parseError.value = err
    error.value = err ? t('errors.lineCol', { line: err.line, col: err.column }) + ': ' + err.message : t('formatter.invalidJson')
  }
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

const fixJson = () => {
  const { fixed, fixes } = fixJsonAuto(inputJson.value)

  if (fixed) {
    inputJson.value = fixed
    outputJson.value = `${t('formatter.fixedIssues', { count: fixes.length })}\n${fixes.map(f => `• ${f}`).join('\n')}`
    error.value = ''
    parseError.value = null
    nextTick(() => formatJson())
  } else {
    error.value = t('formatter.unableToFix')
  }
}

const clearAll = () => {
  outputJson.value = ''
  error.value = ''
  parseError.value = null
}

const onLocateParseError = (err: ParseError) => {
  // Switch to text view to show line-based error location
  viewMode.value = 'text'
  // TODO: scroll to line in text editor when line-number support is added
  console.log('Locate parse error:', err.line, err.column)
}

// Locate field error in tree — expand ancestors + scroll + flash
const locateTarget = ref('')
const onLocateFieldError = (err: FieldError) => {
  // Convert JSON Pointer ("/users/2/email") to dot path ("users.2.email")
  const dotPath = err.instancePath.replace(/^\//, '').replace(/\//g, '.')
  locateTarget.value = ''
  nextTick(() => { locateTarget.value = dotPath })
}

const onInputPaste = () => {
  if (autoFormat.value) {
    nextTick(() => formatJson())
  }
}

const debouncedFormat = useDebounceFn(() => { formatJson() }, 300)
watch(inputJson, () => { if (autoFormat.value) debouncedFormat() })

useEventListener('keydown', (e: KeyboardEvent) => {
  if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
    e.preventDefault()
    formatJson()
  }
})

const copyOutput = async () => {
  try {
    await navigator.clipboard.writeText(outputJson.value)
    copyJustCopied.value = true
    setTimeout(() => { copyJustCopied.value = false }, 2000)
  } catch (e) {
    console.error('Failed to copy:', e)
  }
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
  if (!target.closest('[ref="exampleMenuRef"]') && !target.closest('.relative')) {
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
