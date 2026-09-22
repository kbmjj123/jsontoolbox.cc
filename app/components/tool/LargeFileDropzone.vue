<template>
  <div
    class="rounded-xl border border-surface-200 bg-surface-50 dark:border-surface-700 dark:bg-surface-800 p-8"
    :class="[
      dragging ? 'border-primary-400 dark:border-primary-500 bg-primary-50/50 dark:bg-primary-900/20' : '',
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

      <div class="flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          class="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 transition-colors"
          @click="fileInput?.click()"
        >
          {{ t('largeViewer.chooseFile') }}
        </button>

        <label class="flex items-center gap-2 text-sm text-surface-600 dark:text-surface-400">
          <span>{{ t('largeViewer.format') }}</span>
          <select
            v-model="format"
            class="rounded-md border border-surface-200 bg-white px-2 py-1.5 text-sm text-surface-800 dark:border-surface-700 dark:bg-surface-900 dark:text-surface-200"
          >
            <option value="auto">{{ t('largeViewer.formatAuto') }}</option>
            <option value="json">JSON</option>
            <option value="ndjson">NDJSON</option>
          </select>
        </label>
      </div>

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
import type { FileFormat } from '~/workers/recordStream.worker'

const { t } = useI18n()

const emit = defineEmits<{
  select: [payload: { file: File; format: 'auto' | FileFormat }]
}>()

const fileInput = ref<HTMLInputElement>()
const dragging = ref(false)
const format = ref<'auto' | FileFormat>('auto')

function pick(file: File) {
  if (!file) return
  emit('select', { file, format: format.value })
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
