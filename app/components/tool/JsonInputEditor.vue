<template>
  <div class="h-full flex flex-col">
    <!-- Header -->
    <div v-if="showHeader" class="flex items-center justify-between mb-2">
      <label class="text-sm font-bold text-surface-700 dark:text-surface-300">{{ label }}</label>
      <div class="flex gap-2 items-center">
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
          class="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400"
        >
          {{ $t('system.paste') }}
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
        <div v-for="n in lineCount" :key="n">{{ n }}</div>
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
        class="absolute right-0 h-[1.5em] pointer-events-none transition-opacity duration-300"
        :class="highlight.style === 'flash'
          ? 'bg-orange-200/50 dark:bg-orange-700/30 animate-pulse'
          : 'bg-blue-100/40 dark:bg-blue-900/20'"
        :style="{ top: highlight.top + 'px', left: '2.5rem', opacity: highlight.opacity }"
      />

      <!-- Drop overlay -->
      <div
        v-if="dragging"
        class="absolute inset-0 flex items-center justify-center rounded-xl bg-primary-50/80 dark:bg-primary-900/40 border-2 border-dashed border-primary-400 dark:border-primary-500 z-10 pointer-events-none"
      >
        <span class="text-sm font-medium text-primary-600 dark:text-primary-400">Drop .json file here</span>
      </div>
    </div>

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
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  paste: [text: string]
  clear: []
  upload: [text: string]
  loadUrl: [text: string]
}>()

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

const handlePaste = async () => {
  try {
    const text = await navigator.clipboard.readText()
    emit('update:modelValue', text)
    emit('paste', text)
  } catch (e) {
    console.error('Failed to read clipboard:', e)
  }
}

// ── Line highlight & scroll-to-line ────────────────────────────
const highlightOverlayRef = ref<HTMLDivElement>()
const highlight = reactive({
  active: false,
  line: 0,
  style: 'subtle' as 'flash' | 'subtle',
  top: 0,
  opacity: 1,
})

const LINE_HEIGHT = 21 // 14px * 1.5
const PADDING_TOP = 16 // py-4

function updateHighlightPosition() {
  if (!highlight.active || !textareaRef.value) return
  highlight.top = PADDING_TOP + (highlight.line - 1) * LINE_HEIGHT - textareaRef.value.scrollTop
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

function highlightLine(line: number, style: 'flash' | 'subtle') {
  if (line <= 0) {
    highlight.active = false
    return
  }
  highlight.active = false
  nextTick(() => {
    highlight.line = line
    highlight.style = style
    highlight.opacity = 1
    highlight.active = true
    updateHighlightPosition()

    if (style === 'flash') {
      setTimeout(() => { highlight.opacity = 0 }, 1500)
      setTimeout(() => { highlight.active = false }, 2000)
    }
  })
}

// Sync highlight position on scroll
const origOnScroll = onScroll
const onScrollWithHighlight = () => {
  origOnScroll()
  updateHighlightPosition()
}

defineExpose({ scrollToLine, highlightLine })

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
