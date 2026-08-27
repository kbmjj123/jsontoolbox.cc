<template>
  <div class="h-full flex flex-col">
    <!-- Header -->
    <div v-if="showHeader" class="flex items-center justify-between mb-2">
      <label class="text-sm font-bold text-surface-700 dark:text-surface-300">{{ label }}</label>
      <div class="flex gap-2 items-center">
        <!-- Built-in example dropdown -->
        <div v-if="hasExamples" ref="exampleMenuRef" class="relative">
          <button @click="showExampleMenu = !showExampleMenu"
            class="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400">
            {{ $t('system.example') }}
          </button>
          <div v-if="showExampleMenu"
            class="absolute right-0 top-full mt-1 bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-lg shadow-lg p-1 z-50 min-w-[140px]">
            <button v-for="ex in examples" :key="ex.id"
              @click="onExampleSelect(ex.id)"
              class="w-full text-left px-3 py-1.5 text-xs hover:bg-surface-100 dark:hover:bg-surface-700 rounded">
              {{ getLabel(ex) }}
            </button>
          </div>
        </div>
        <slot name="actions" />
        <button
          v-if="showLoadUrl"
          @click="showUrlModal = true"
          class="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400"
        >
          {{ $t('system.loadUrl') }}
        </button>
        <button
          v-if="showUpload"
          @click="triggerUpload"
          class="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400"
        >
          {{ $t('system.upload') }}
        </button>
        <button
          v-if="showPaste"
          @click="handlePaste"
          class="text-xs transition-colors"
          :class="pasted
            ? 'text-green-600 dark:text-green-400'
            : pasteError
              ? 'text-red-500 dark:text-red-400'
              : 'text-primary-600 hover:text-primary-700 dark:text-primary-400'"
        >
          {{ pasted ? '✓ ' + $t('system.pasted') : pasteError ? $t('system.pasteFailed') : $t('system.paste') }}
        </button>
        <button
          v-if="showClear"
          @click="handleClear"
          class="text-xs text-surface-500 hover:text-surface-700 dark:text-surface-400"
        >
          {{ $t('system.clear') }}
        </button>
        <input
          ref="fileInputRef"
          type="file"
          :accept="accept"
          class="hidden"
          @change="onFileChange"
        />
      </div>
    </div>

    <!-- File info -->
    <div v-if="fileInfo" class="mb-2 flex items-center gap-2 text-xs text-surface-500 dark:text-surface-400">
      <span>📄 {{ fileInfo.name }} ({{ fileInfo.size }})</span>
      <button @click="fileInfo = null" class="text-surface-400 hover:text-surface-600 dark:hover:text-surface-300">✕</button>
    </div>

    <!-- Editor: line numbers + textarea -->
    <div
      class="relative flex flex-1 min-h-0 rounded-xl border border-surface-200 bg-surface-50 dark:border-surface-700 dark:bg-surface-800"
      :class="[dragging ? 'border-primary-400 dark:border-primary-500 bg-primary-50/50 dark:bg-primary-900/20' : '']"
      @dragover.prevent="onDragOver"
      @dragleave="onDragLeave"
      @drop.prevent="onDrop"
    >
      <!-- Line numbers gutter -->
      <div
        ref="gutterRef"
        class="flex-none w-10 select-none overflow-hidden py-4 pr-2 text-right font-mono text-sm leading-[1.5] text-surface-400 dark:text-surface-500 border-r border-surface-200 dark:border-surface-700"
        aria-hidden="true"
      >
        <div
          v-for="n in lineCount"
          :key="n"
          :class="n === errorLine ? 'text-red-500 dark:text-red-400 font-bold' : ''"
        >{{ n }}</div>
      </div>

      <!-- Textarea -->
      <textarea
        ref="textareaRef"
        :value="modelValue"
        @input="onInput"
        @scroll="onScrollWithHighlight"
        @paste="onPaste"
        wrap="off"
        class="flex-1 min-w-0 resize-none bg-transparent py-4 px-4 font-mono text-sm leading-[1.5] text-surface-900 outline-none dark:text-surface-100 whitespace-pre"
        :placeholder="placeholder"
        spellcheck="false"
      ></textarea>

      <!-- Line highlight overlay -->
      <div
        v-if="highlight.active"
        ref="highlightOverlayRef"
        class="absolute right-0 pointer-events-none transition-opacity duration-300"
        :class="highlight.style === 'flash'
          ? 'bg-orange-200/50 dark:bg-orange-700/30 animate-pulse'
          : 'bg-blue-100/40 dark:bg-blue-900/20'"
        :style="{ top: highlight.top + 'px', left: '2.5rem', height: highlight.height + 'px', opacity: highlight.opacity }"
      />

      <!-- Error line overlay (persistent red highlight) -->
      <div
        v-if="errorLine > 0"
        class="absolute right-0 h-[1.5em] pointer-events-none border-l-2 border-red-400 dark:border-red-500 bg-red-100/30 dark:bg-red-900/15"
        :style="{ top: errorLineTop + 'px', left: '2.5rem', right: '0' }"
      >
        <!-- Error position wavy underline -->
        <div
          v-if="errorColumn > 0"
          class="absolute bottom-0 h-[3px] -translate-x-1/2 pointer-events-none"
          :style="{ left: errorColumnLeft + 'px', width: errorRangeWidth + 'px' }"
        >
          <svg class="absolute bottom-0 left-0 w-full h-[3px]" :viewBox="`0 0 ${errorRangeWidth} 3`" preserveAspectRatio="none">
            <path
              :d="wavyPath"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              class="text-red-500 dark:text-red-400"
            />
          </svg>
        </div>
      </div>

      <!-- Drop overlay -->
      <div
        v-if="dragging"
        class="absolute inset-0 flex items-center justify-center rounded-xl bg-primary-50/80 dark:bg-primary-900/40 border-2 border-dashed border-primary-400 dark:border-primary-500 z-10 pointer-events-none"
      >
        <span class="text-sm font-medium text-primary-600 dark:text-primary-400">Drop .json file here</span>
      </div>
    </div>

    <!-- Error status bar (persistent, always visible when error exists) -->
    <Transition name="fade">
      <div
        v-if="error"
        class="mt-2 flex items-center gap-3 rounded-lg border px-3 py-2 text-xs border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20"
      >
        <span class="i-lucide-x-circle w-4 h-4 text-red-500 shrink-0" />
        <div class="flex-1 min-w-0">
          <span class="font-bold text-red-700 dark:text-red-400">
            {{ $t('errorBar.invalid') }}
          </span>
          <span v-if="errorLine > 0" class="text-red-600 dark:text-red-400">
            · {{ $t('errors.lineCol', { line: errorLine, col: errorColumn }) }}
          </span>
          <span class="text-red-600 dark:text-red-400"> — </span>
          <span class="text-red-700 dark:text-red-300">{{ friendlyMessage || error }}</span>
        </div>
        <div class="flex gap-1.5 shrink-0">
          <button
            @click="emit('locateError')"
            class="rounded px-2 py-0.5 text-[10px] font-medium text-red-600 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/30 transition-colors"
          >
            {{ $t('errorBar.locateError') }}
          </button>
          <button
            @click="emit('copyError')"
            class="rounded px-2 py-0.5 text-[10px] font-medium transition-colors"
            :class="errorCopied
              ? 'text-green-600 dark:text-green-400'
              : 'text-red-600 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/30'"
          >
            {{ errorCopied ? '✓' : $t('errorBar.copyError') }}
          </button>
        </div>
      </div>
    </Transition>

    <!-- Load URL Modal -->
    <LoadUrlModal
      :visible="showUrlModal"
      @close="showUrlModal = false"
      @loaded="onUrlLoaded"
    />
  </div>
</template>

<script setup lang="ts">
interface Props {
  modelValue: string
  label?: string
  placeholder?: string
  showHeader?: boolean
  showPaste?: boolean
  showClear?: boolean
  showUpload?: boolean
  showLoadUrl?: boolean
  accept?: string
  /** Line number with a parse error (1-based) */
  errorLine?: number
  /** Column number of the error within the line (1-based) */
  errorColumn?: number
  /** Friendly localized error message (shown in error bar) */
  friendlyMessage?: string
  /** Raw error string (used as boolean + display fallback) */
  error?: string
  /** Whether error was just copied (shows feedback) */
  errorCopied?: boolean
  /** Tool slug for loading examples (e.g. 'json-minifier') */
  exampleSlug?: string
}

const props = withDefaults(defineProps<Props>(), {
  label: 'Input JSON',
  placeholder: '{\n  "key": "value"\n}',
  showHeader: true,
  showPaste: true,
  showClear: true,
  showUpload: false,
  showLoadUrl: true,
  accept: '.json,.txt,.jsonl,.geojson,.ndjson',
  errorLine: 0,
  errorColumn: 0,
  friendlyMessage: '',
  error: '',
  errorCopied: false,
  exampleSlug: '',
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  paste: [text: string]
  clear: []
  upload: [text: string]
  loadUrl: [text: string]
  locateError: []
  copyError: []
  'example-loaded': [input: string]
}>()

// Example dropdown (built-in when exampleSlug is provided)
const { examples, hasExamples, getLabel, loadById, loadDefault } = useToolExample(props.exampleSlug)
const showExampleMenu = ref(false)
const exampleMenuRef = ref<HTMLElement>()
const onExampleSelect = (id: string) => {
  const ex = examples.value.find(e => e.id === id)
  if (ex) { emit('update:modelValue', ex.input); emit('example-loaded', ex.input) }
  showExampleMenu.value = false
}
const loadDefaultExample = () => {
  const ex = examples.value[0]
  if (ex) { emit('update:modelValue', ex.input); emit('example-loaded', ex.input) }
}
const handleClickOutside = (e: MouseEvent) => {
  if (exampleMenuRef.value && !exampleMenuRef.value.contains(e.target as HTMLElement)) showExampleMenu.value = false
}
onMounted(() => { document.addEventListener('click', handleClickOutside) })
onUnmounted(() => { document.removeEventListener('click', handleClickOutside) })

const gutterRef = ref<HTMLDivElement>()
const textareaRef = ref<HTMLTextAreaElement>()
const fileInputRef = ref<HTMLInputElement>()
const dragging = ref(false)
const fileInfo = ref<{ name: string; size: string } | null>(null)
const showUrlModal = ref(false)

const onUrlLoaded = (text: string) => {
  emit('update:modelValue', text)
  emit('loadUrl', text)
  showUrlModal.value = false
}

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const processFile = (file: File) => {
  const reader = new FileReader()
  reader.onload = (ev) => {
    const text = ev.target?.result as string
    emit('update:modelValue', text)
    emit('upload', text)
    fileInfo.value = { name: file.name, size: formatFileSize(file.size) }
  }
  reader.readAsText(file)
}

const onDragOver = () => { dragging.value = true }
const onDragLeave = () => { dragging.value = false }
const onDrop = (e: DragEvent) => {
  dragging.value = false
  const file = e.dataTransfer?.files?.[0]
  if (file) processFile(file)
}

const lineCount = computed(() => {
  const lines = props.modelValue.split('\n').length
  return Math.max(lines, 1)
})

const onInput = (e: Event) => {
  const target = e.target as HTMLTextAreaElement
  emit('update:modelValue', target.value)
}

const onScroll = () => {
  if (gutterRef.value && textareaRef.value) {
    gutterRef.value.scrollTop = textareaRef.value.scrollTop
  }
}

const onPaste = (e: ClipboardEvent) => {
  const text = e.clipboardData?.getData('text') ?? ''
  if (text) emit('paste', text)
}

const pasted = ref(false)
const pasteError = ref(false)
let pasteTimer: ReturnType<typeof setTimeout> | null = null

const clearPasteFeedback = () => {
  if (pasteTimer) clearTimeout(pasteTimer)
  pasteTimer = setTimeout(() => {
    pasted.value = false
    pasteError.value = false
  }, 2000)
}

const handlePaste = async () => {
  // Reset previous feedback
  pasted.value = false
  pasteError.value = false

  // Ensure textarea is focused for the fallback to work
  textareaRef.value?.focus()

  // Try modern Clipboard API first
  if (navigator.clipboard?.readText) {
    try {
      const text = await navigator.clipboard.readText()
      if (text) {
        emit('update:modelValue', text)
        emit('paste', text)
        pasted.value = true
        clearPasteFeedback()
        return
      }
    } catch {
      // Fall through to execCommand fallback
    }
  }

  // Fallback: trigger native paste event via execCommand
  const success = document.execCommand('paste')
  if (!success) {
    pasteError.value = true
    clearPasteFeedback()
  }
}

// ── Line highlight & scroll-to-line ────────────────────────────
const highlightOverlayRef = ref<HTMLDivElement>()
const highlight = reactive({
  active: false,
  line: 0,
  endLine: 0, // 0 means single line; > line means range
  style: 'subtle' as 'flash' | 'subtle',
  top: 0,
  height: LINE_HEIGHT,
  opacity: 1,
})

const LINE_HEIGHT = 21 // 14px * 1.5
const PADDING_TOP = 16 // py-4
const CHAR_WIDTH = 8.4 // approximate monospace char width at 14px

// Error line positioning (scroll-aware)
const scrollTop = ref(0)

const errorLineTop = computed(() => {
  if (props.errorLine <= 0) return 0
  return PADDING_TOP + (props.errorLine - 1) * LINE_HEIGHT - scrollTop.value
})

const errorColumnLeft = computed(() => {
  if (props.errorColumn <= 0) return 0
  return props.errorColumn * CHAR_WIDTH
})

/** Width of the wavy underline (span ~4 chars or remaining line width) */
const errorRangeWidth = computed(() => {
  if (props.errorColumn <= 0) return 0
  // Try to get the line content to calculate remaining width
  const lines = props.modelValue.split('\n')
  const lineIdx = props.errorLine - 1
  if (lineIdx >= 0 && lineIdx < lines.length) {
    const lineLen = lines[lineIdx].length
    const remainingChars = lineLen - props.errorColumn + 1
    const spanChars = Math.max(Math.min(remainingChars, 4), 2)
    return spanChars * CHAR_WIDTH
  }
  return 4 * CHAR_WIDTH
})

/** SVG path for wavy underline */
const wavyPath = computed(() => {
  const w = errorRangeWidth.value
  if (w <= 0) return ''
  const segments = Math.max(Math.floor(w / 6), 2)
  let d = `M 0 1.5`
  for (let i = 0; i < segments; i++) {
    const x1 = (w / segments) * (i + 0.5)
    const x2 = (w / segments) * (i + 1)
    const y1 = i % 2 === 0 ? 0 : 3
    d += ` Q ${x1} ${y1} ${x2} 1.5`
  }
  return d
})

function updateHighlightPosition() {
  if (!highlight.active || !textareaRef.value) return
  highlight.top = PADDING_TOP + (highlight.line - 1) * LINE_HEIGHT - textareaRef.value.scrollTop
  const lineCount = highlight.endLine > highlight.line ? highlight.endLine - highlight.line + 1 : 1
  highlight.height = lineCount * LINE_HEIGHT
}

function scrollToLine(line: number) {
  if (!textareaRef.value) return
  const targetScroll = Math.max(0, (line - 1) * LINE_HEIGHT - textareaRef.value.clientHeight / 3)
  textareaRef.value.scrollTop = targetScroll
  gutterRef.value && (gutterRef.value.scrollTop = targetScroll)
  // Set cursor to the start of the target line
  const lines = props.modelValue.split('\n')
  let offset = 0
  for (let i = 0; i < line - 1 && i < lines.length; i++) {
    offset += lines[i].length + 1
  }
  textareaRef.value.setSelectionRange(offset, offset)
  textareaRef.value.focus()
}

let flashTimers: ReturnType<typeof setTimeout>[] = []

function highlightLine(line: number, style: 'flash' | 'subtle') {
  // Clear pending flash timers
  flashTimers.forEach(clearTimeout)
  flashTimers = []

  if (line <= 0) {
    highlight.active = false
    return
  }

  highlight.line = line
  highlight.endLine = 0
  highlight.style = style
  highlight.opacity = 1
  highlight.active = true
  updateHighlightPosition()

  if (style === 'flash') {
    flashTimers.push(setTimeout(() => { highlight.opacity = 0 }, 1500))
    flashTimers.push(setTimeout(() => { highlight.active = false }, 2000))
  }
}

function highlightLines(startLine: number, endLine: number, style: 'flash' | 'subtle') {
  flashTimers.forEach(clearTimeout)
  flashTimers = []

  if (startLine <= 0 || endLine < startLine) {
    highlight.active = false
    return
  }

  highlight.line = startLine
  highlight.endLine = endLine
  highlight.style = style
  highlight.opacity = 1
  highlight.active = true
  updateHighlightPosition()

  if (style === 'flash') {
    flashTimers.push(setTimeout(() => { highlight.opacity = 0 }, 1500))
    flashTimers.push(setTimeout(() => { highlight.active = false }, 2000))
  }
}

// Sync highlight + error line position on scroll
const origOnScroll = onScroll
const onScrollWithHighlight = () => {
  origOnScroll()
  if (textareaRef.value) scrollTop.value = textareaRef.value.scrollTop
  updateHighlightPosition()
}

defineExpose({ scrollToLine, highlightLine, highlightLines, loadDefaultExample })

const handleClear = () => {
  emit('update:modelValue', '')
  emit('clear')
  fileInfo.value = null
}

const triggerUpload = () => {
  fileInputRef.value?.click()
}

const onFileChange = (e: Event) => {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  processFile(file)
  // Reset so the same file can be re-uploaded
  input.value = ''
}
</script>
