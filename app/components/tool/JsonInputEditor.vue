<template>
  <div>
    <!-- Header -->
    <div v-if="showHeader" class="flex items-center justify-between mb-2">
      <label class="text-sm font-bold text-surface-700 dark:text-surface-300">{{ label }}</label>
      <div class="flex gap-2 items-center">
        <slot name="actions" />
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
      class="relative flex rounded-xl border border-surface-200 bg-surface-50 dark:border-surface-700 dark:bg-surface-800"
      :class="[height, dragging ? 'border-primary-400 dark:border-primary-500 bg-primary-50/50 dark:bg-primary-900/20' : '']"
      @dragover.prevent="onDragOver"
      @dragleave="onDragLeave"
      @drop.prevent="onDrop"
    >
      <!-- Line numbers gutter -->
      <div
        ref="gutterRef"
        class="flex-none w-10 select-none overflow-hidden py-4 pr-2 text-right font-mono text-xs leading-[1.5] text-surface-400 dark:text-surface-500 border-r border-surface-200 dark:border-surface-700"
        aria-hidden="true"
      >
        <div v-for="n in lineCount" :key="n">{{ n }}</div>
      </div>

      <!-- Textarea -->
      <textarea
        ref="textareaRef"
        :value="modelValue"
        @input="onInput"
        @scroll="onScroll"
        @paste="onPaste"
        class="flex-1 min-w-0 resize-none bg-transparent py-4 px-4 font-mono text-sm leading-[1.5] text-surface-900 outline-none dark:text-surface-100"
        :placeholder="placeholder"
        spellcheck="false"
      ></textarea>

      <!-- Drop overlay -->
      <div
        v-if="dragging"
        class="absolute inset-0 flex items-center justify-center rounded-xl bg-primary-50/80 dark:bg-primary-900/40 border-2 border-dashed border-primary-400 dark:border-primary-500 z-10 pointer-events-none"
      >
        <span class="text-sm font-medium text-primary-600 dark:text-primary-400">Drop .json file here</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  modelValue: string
  label?: string
  placeholder?: string
  height?: string
  showHeader?: boolean
  showPaste?: boolean
  showClear?: boolean
  showUpload?: boolean
  accept?: string
}

const props = withDefaults(defineProps<Props>(), {
  label: 'Input JSON',
  placeholder: '{\n  "key": "value"\n}',
  height: 'h-64',
  showHeader: true,
  showPaste: true,
  showClear: true,
  showUpload: false,
  accept: '.json,.txt,.jsonl,.geojson,.ndjson',
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  paste: [text: string]
  clear: []
  upload: [text: string]
}>()

const gutterRef = ref<HTMLDivElement>()
const textareaRef = ref<HTMLTextAreaElement>()
const fileInputRef = ref<HTMLInputElement>()
const dragging = ref(false)
const fileInfo = ref<{ name: string; size: string } | null>(null)

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
