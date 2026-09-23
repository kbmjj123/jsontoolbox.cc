<template>
  <div
    class="rounded-xl border-2 border-dashed border-surface-300 bg-transparent p-8 transition-colors dark:border-surface-600"
    :class="[
      dragging ? 'border-primary-400 bg-primary-50/50 dark:border-primary-500 dark:bg-primary-900/20' : '',
    ]"
    @dragover.prevent="dragging = true"
    @dragleave.prevent="dragging = false"
    @drop.prevent="onDrop"
  >
    <div class="flex flex-col items-center text-center gap-4">
      <div class="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center">
        <Icon name="lucide:upload" class="w-6 h-6 text-primary-600 dark:text-primary-400" />
      </div>

      <div>
        <p class="text-base font-medium text-surface-900 dark:text-surface-100">
          {{ t('largeViewer.dropzoneTitle') }}
        </p>
        <p class="mt-1 text-sm text-surface-500 dark:text-surface-400">
          {{ t('largeViewer.dropzoneHint') }}
        </p>
      </div>

      <button type="button" class="lf-btn-primary" @click="fileInput?.click()">
        {{ t('largeViewer.chooseFile') }}
      </button>

      <p class="text-xs text-surface-400 dark:text-surface-500">
        .json · .ndjson · .jsonl · .jsonlines
      </p>

      <input
        ref="fileInput"
        type="file"
        class="hidden"
        accept=".json,.ndjson,.jsonl,.jsonlines,application/json"
        @change="onFileChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n()

// Format is auto-detected from the file name (see `detectFormatFromName` in
// `useLargeFile`), so the dropzone only ever hands over the file itself.
const emit = defineEmits<{
  select: [file: File]
}>()

const fileInput = ref<HTMLInputElement>()
const dragging = ref(false)

function pick(file: File) {
  if (!file) return
  emit('select', file)
}

function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  if (input.files?.length) pick(input.files[0])
  input.value = ''
}

function onDrop(e: DragEvent) {
  dragging.value = false
  const file = e.dataTransfer?.files?.[0]
  if (file) pick(file)
}
</script>
