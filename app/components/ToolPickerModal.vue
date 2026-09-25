<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="isPickerOpen"
        class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-surface-900/50 p-4 backdrop-blur-sm"
        @click.self="close"
      >
        <div
          class="relative my-10 w-full max-w-3xl rounded-2xl border border-surface-200 bg-white shadow-2xl dark:border-surface-700 dark:bg-surface-900"
        >
          <!-- Header -->
          <div
            class="flex items-center justify-between border-b border-surface-200 px-5 py-4 dark:border-surface-700"
          >
            <h2 class="text-lg font-bold text-surface-900 dark:text-surface-100">
              {{ $t('picker.title') }}
            </h2>
            <button
              type="button"
              class="rounded-lg p-1.5 text-surface-400 transition hover:bg-surface-100 hover:text-surface-700 dark:hover:bg-surface-800 dark:hover:text-surface-200"
              :aria-label="$t('picker.close')"
              @click="close"
            >
              <Icon name="lucide:x" class="h-5 w-5" />
            </button>
          </div>

          <!-- Input area -->
          <div class="border-b border-surface-200 px-5 py-4 dark:border-surface-700">
            <label
              class="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-6 text-center transition"
              :class="dragOver ? 'border-primary-400 bg-primary-50/60 dark:bg-primary-900/20' : 'border-surface-300 hover:border-primary-400 dark:border-surface-600'"
              @dragover.prevent="dragOver = true"
              @dragleave.prevent="dragOver = false"
              @drop.prevent="onDrop"
            >
              <Icon name="lucide:upload-cloud" class="h-7 w-7 text-primary-500" />
              <p class="text-sm font-medium text-surface-700 dark:text-surface-200">
                {{ $t('picker.drop_or_click') }}
              </p>
              <p class="text-xs text-surface-400">{{ $t('picker.hint') }}</p>
              <input type="file" class="hidden" @change="onFile" />
            </label>

            <textarea
              v-model="pasted"
              :placeholder="$t('picker.paste_placeholder')"
              class="mt-3 h-28 w-full resize-none rounded-xl border border-surface-200 bg-surface-50 p-3 font-mono text-sm text-surface-800 outline-none transition focus:border-primary-400 dark:border-surface-700 dark:bg-surface-950 dark:text-surface-100"
            ></textarea>

            <p v-if="pendingName" class="mt-2 truncate text-xs text-surface-500 dark:text-surface-400">
              {{ pendingName }}
            </p>
          </div>

          <!-- Tool grid -->
          <div class="px-5 py-4">
            <div class="relative">
              <Icon
                name="lucide:search"
                class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400"
              />
              <input
                v-model="query"
                :placeholder="$t('picker.search')"
                class="w-full rounded-xl border border-surface-200 bg-surface-50 py-2 pl-9 pr-3 text-sm text-surface-800 outline-none transition focus:border-primary-400 dark:border-surface-700 dark:bg-surface-950 dark:text-surface-100"
              />
            </div>

            <div class="mt-4 max-h-[42vh] space-y-5 overflow-y-auto pr-1">
              <div v-for="cat in filteredCategories" :key="cat.slug">
                <h3 class="mb-2 text-xs font-bold uppercase tracking-widest text-surface-400">
                  {{ cat.title || cat.h2 || cat.slug }}
                </h3>
                <div class="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  <button
                    v-for="tool in cat.tools"
                    :key="tool.path"
                    type="button"
                    class="flex items-center gap-2 rounded-lg border border-surface-200 px-3 py-2 text-left text-sm font-medium text-surface-700 transition hover:border-primary-200 hover:bg-primary-50 dark:border-surface-700 dark:text-surface-200 dark:hover:border-primary-800 dark:hover:bg-primary-900/20"
                    @click="choose(tool)"
                  >
                    <Icon :name="tool.icon" class="h-4 w-4 shrink-0 text-primary-500" />
                    <span class="truncate">{{ tool.name }}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div
            class="flex items-center justify-center gap-1.5 border-t border-surface-200 px-5 py-3 text-center text-xs text-surface-400 dark:border-surface-700"
          >
            <Icon name="lucide:shield-check" class="h-3.5 w-3.5 text-green-500" />
            {{ $t('picker.privacy') }}
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useToolPicker } from '~/composables/useToolPicker'
import { useJsonInbox } from '~/composables/useJsonInbox'
import { useTools } from '~/composables/useTools'
import {
  LARGE_FILE_MAX_BYTES,
  LARGE_FILE_EXPLORER_PATH,
  useLargeFileHandoff,
  byteLength,
  detectDocumentFormat,
} from '~/composables/useLargeFile'

const { isPickerOpen, closePicker } = useToolPicker()
const { setInbox } = useJsonInbox()
const { categories } = useTools()

const pasted = ref('')
const pendingFile = ref<File | null>(null)
const pendingName = ref('')
const dragOver = ref(false)
const query = ref('')

const filteredCategories = computed<any[]>(() => {
  const q = query.value.toLowerCase().trim()
  if (!q) return categories.value as any[]
  return (categories.value as any[])
    .map((cat: any) => ({
      ...cat,
      tools: cat.tools.filter(
        (t: any) =>
          t.name.toLowerCase().includes(q) ||
          (t.description || '').toLowerCase().includes(q),
      ),
    }))
    .filter((cat: any) => cat.tools.length)
})

function reset() {
  pasted.value = ''
  pendingFile.value = null
  pendingName.value = ''
  query.value = ''
}

function close() {
  closePicker()
  reset()
}

function onFile(e: Event) {
  const input = e.target as HTMLInputElement
  if (input.files?.length) handleFile(input.files[0])
}

function onDrop(e: DragEvent) {
  dragOver.value = false
  if (e.dataTransfer?.files?.length) handleFile(e.dataTransfer.files[0])
}

async function handleFile(file: File) {
  pendingFile.value = file
  const large = file.size > LARGE_FILE_MAX_BYTES
  pendingName.value = large
    ? `${file.name} · ${$t('picker.large_file_note')}`
    : file.name
  // Only read small files into the textarea; large ones ride the handoff as a File.
  if (!large) {
    pasted.value = await file.text()
  }
}

async function choose(tool: any) {
  const file = pendingFile.value
  const text = pasted.value

  // Nothing provided: just open the tool.
  if (!file && !text.trim()) {
    await navigateTo(tool.path)
    close()
    return
  }

  const isLargeViewer = tool.path === LARGE_FILE_EXPLORER_PATH

  // Oversized input → always hand off to the dedicated Large JSON / NDJSON viewer.
  if (file && file.size > LARGE_FILE_MAX_BYTES) {
    useLargeFileHandoff().value = { file, format: 'json', fileName: file.name }
    await navigateTo(LARGE_FILE_EXPLORER_PATH)
    close()
    return
  }
  if (text && byteLength(text) > LARGE_FILE_MAX_BYTES) {
    useLargeFileHandoff().value = {
      text,
      format: detectDocumentFormat(text),
      fileName: pendingName.value || 'pasted.json',
    }
    await navigateTo(LARGE_FILE_EXPLORER_PATH)
    close()
    return
  }

  // Chose the viewer with small content → hand off the text.
  if (isLargeViewer) {
    useLargeFileHandoff().value = {
      text: text || '',
      format: detectDocumentFormat(text || ''),
      fileName: pendingName.value || 'pasted.json',
    }
    await navigateTo(LARGE_FILE_EXPLORER_PATH)
    close()
    return
  }

  // Normal tool → drop content in the inbox, then navigate.
  setInbox({ text, fileName: pendingName.value || 'pasted.json' })
  await navigateTo(tool.path)
  close()
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
