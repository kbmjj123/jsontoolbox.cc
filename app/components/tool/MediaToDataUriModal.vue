<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div
        class="fixed inset-0 z-[10001] flex items-center justify-center p-4"
        @click.self="emit('close')"
      >
        <div class="fixed inset-0 bg-black/50 backdrop-blur-sm" @click="emit('close')" />
        <div
          class="relative w-full max-w-md rounded-2xl border border-surface-200 bg-white shadow-xl dark:border-surface-700 dark:bg-surface-900"
        >
          <!-- Header -->
          <div class="flex items-center justify-between border-b border-surface-100 px-5 py-4 dark:border-surface-700">
            <h3 class="text-sm font-bold text-surface-900 dark:text-surface-100">
              {{ t('media.insertTitle') }}
            </h3>
            <button class="text-surface-400 hover:text-surface-600 dark:hover:text-surface-300" @click="emit('close')">
              <Icon name="lucide:x" class="h-4 w-4" />
            </button>
          </div>

          <!-- Body -->
          <div class="space-y-4 px-5 py-4">
            <!-- Drop / paste / pick zone -->
            <label
              class="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-surface-300 px-4 py-6 text-center transition-colors hover:border-primary-400 hover:bg-surface-50 dark:border-surface-600 dark:hover:bg-surface-800"
              :class="{ 'border-primary-400 bg-surface-50 dark:bg-surface-800': dragOver }"
              @dragover.prevent="dragOver = true"
              @dragleave.prevent="dragOver = false"
              @drop.prevent="onDrop"
              @paste.prevent="onPaste"
            >
              <Icon name="lucide:image-plus" class="h-7 w-7 text-surface-400" />
              <p class="text-xs text-surface-600 dark:text-surface-300">{{ t('media.dropOrPaste') }}</p>
              <p class="text-[10px] text-surface-400">{{ t('media.pasteHint') }}</p>
              <input
                ref="fileInputRef"
                type="file"
                class="hidden"
                @change="onInputFile"
              />
              <span
                class="mt-1 rounded bg-primary-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-700"
                @click.prevent="fileInputRef?.click()"
              >
                {{ t('system.upload') }}
              </span>
            </label>

            <p v-if="error" class="text-xs text-red-600 dark:text-red-400">{{ error }}</p>

            <!-- Readout -->
            <div v-if="file" class="space-y-3 rounded-lg border border-surface-200 p-3 dark:border-surface-700">
              <!-- Preview -->
              <img
                v-if="isImage && previewUrl"
                :src="previewUrl"
                :alt="file.name"
                class="max-h-32 rounded border border-surface-200 dark:border-surface-700"
              />
              <div v-else class="flex items-center gap-2 text-surface-500">
                <Icon name="lucide:file" class="h-5 w-5" />
                <span class="truncate text-xs">{{ file.name }}</span>
              </div>

              <dl class="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                <dt class="text-surface-500">{{ t('media.mime') }}</dt>
                <dd class="truncate font-mono text-surface-800 dark:text-surface-200">{{ mime }}</dd>
                <dt class="text-surface-500">{{ t('media.encodedSize') }}</dt>
                <dd class="font-mono text-surface-800 dark:text-surface-200">{{ formatBytes(bytes) }}</dd>
              </dl>

              <p
                v-if="sizeWarn"
                class="flex items-start gap-2 rounded border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-[11px] text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300"
              >
                <Icon name="lucide:alert-triangle" class="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>{{ t('media.sizeWarning', { size: formatBytes(bytes) }) }}</span>
              </p>
            </div>

            <!-- Output mode -->
            <div v-if="file" class="space-y-2">
              <div class="text-[10px] uppercase tracking-wider text-surface-400">
                {{ t('media.outputMode') }}
              </div>
              <div class="flex flex-col gap-1.5">
                <label class="flex items-center gap-2 text-xs">
                  <input v-model="mode" type="radio" value="dataUri" class="accent-primary-600" />
                  {{ t('media.modeDataUri') }}
                </label>
                <label class="flex items-center gap-2 text-xs">
                  <input v-model="mode" type="radio" value="chunked" class="accent-primary-600" />
                  {{ t('media.modeChunked') }}
                  <span v-if="mode === 'chunked' && chunkCount > 1" class="text-surface-400">
                    ({{ t('media.chunkCount', { n: chunkCount }) }})
                  </span>
                </label>
                <label class="flex items-center gap-2 text-xs">
                  <input v-model="mode" type="radio" value="externalUrl" class="accent-primary-600" />
                  {{ t('media.modeExternalUrl') }}
                </label>
              </div>

              <input
                v-if="mode === 'externalUrl'"
                v-model="externalUrl"
                type="text"
                :placeholder="t('media.externalUrlPlaceholder')"
                class="w-full rounded border border-surface-200 bg-white px-2 py-1.5 text-xs dark:border-surface-700 dark:bg-surface-900 dark:text-surface-100 focus:outline-none focus:ring-1 focus:ring-primary-400"
              />
              <p v-else-if="mode === 'chunked'" class="text-[11px] text-surface-400">
                {{ t('media.chunkedNote') }}
              </p>
            </div>
          </div>

          <!-- Footer -->
          <div class="flex items-center justify-end gap-2 border-t border-surface-100 px-5 py-3 dark:border-surface-700">
            <button
              class="rounded border border-surface-200 px-3 py-1.5 text-xs font-medium dark:border-surface-700"
              @click="emit('close')"
            >
              {{ t('system.cancel') }}
            </button>
            <button
              :disabled="!canInsert"
              class="rounded bg-primary-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-40"
              @click="doInsert"
            >
              {{ t('media.insert') }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  MEDIA_EMBED_WARN_BYTES,
  buildDataUri,
  bytesToBase64,
  formatBytes,
  sniffImageMime,
  splitBase64Chunks,
} from '~/utils/mediaPreview'

const props = defineProps<{ path: string }>()
const emit = defineEmits<{ insert: [value: unknown]; close: [] }>()
const { t } = useI18n()

const fileInputRef = ref<HTMLInputElement | null>(null)
const file = ref<File | null>(null)
const base64 = ref<string | null>(null)
const mime = ref<string | null>(null)
const bytes = ref(0)
const previewUrl = ref<string | null>(null)
const mode = ref<'dataUri' | 'externalUrl' | 'chunked'>('dataUri')
const externalUrl = ref('')
const error = ref<string | null>(null)
const dragOver = ref(false)

const isImage = computed(() => !!mime.value?.startsWith('image/'))
const sizeWarn = computed(() => bytes.value > MEDIA_EMBED_WARN_BYTES)
const dataUri = computed(() =>
  base64.value && mime.value ? buildDataUri(mime.value, base64.value) : '',
)
const chunkCount = computed(() => (base64.value ? splitBase64Chunks(base64.value).length : 0))
const canInsert = computed(() => {
  if (mode.value === 'externalUrl') return externalUrl.value.trim().length > 0
  return base64.value !== null
})

async function handleFile(f: File | null | undefined) {
  if (!f) return
  error.value = null
  file.value = f
  try {
    const buf = await f.arrayBuffer()
    const arr = new Uint8Array(buf)
    base64.value = bytesToBase64(arr)
    bytes.value = f.size
    let detected = f.type || 'application/octet-stream'
    // Verify image MIME by magic bytes, not just the file extension/type.
    if (detected.startsWith('image/') || f.type === '') {
      const head = arr.subarray(0, 32)
      let bin = ''
      for (const b of head) bin += String.fromCharCode(b)
      const sniffed = sniffImageMime(bin)
      if (sniffed) detected = sniffed
    }
    mime.value = detected
    previewUrl.value = isImage.value ? buildDataUri(detected, base64.value) : null
  } catch {
    error.value = t('media.readFailed')
    base64.value = null
    mime.value = null
  }
}

function onInputFile(e: Event) {
  const input = e.target as HTMLInputElement
  handleFile(input.files?.[0])
}
function onDrop(e: DragEvent) {
  dragOver.value = false
  handleFile(e.dataTransfer?.files?.[0])
}
function onPaste(e: ClipboardEvent) {
  const items = e.clipboardData?.items
  if (!items) return
  for (const item of items) {
    if (item.kind === 'file') {
      handleFile(item.getAsFile())
      break
    }
  }
}

function doInsert() {
  if (mode.value === 'externalUrl') {
    emit('insert', externalUrl.value.trim())
  } else if (mode.value === 'chunked' && base64.value) {
    emit('insert', splitBase64Chunks(base64.value))
  } else if (dataUri.value) {
    emit('insert', dataUri.value)
  }
}
</script>
