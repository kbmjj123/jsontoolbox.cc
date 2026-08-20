<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="visible" class="fixed inset-0 z-[100] flex items-center justify-center bg-black/40" @click.self="$emit('close')">
        <div class="w-full max-w-lg mx-4 rounded-2xl bg-white dark:bg-surface-800 shadow-xl border border-surface-200 dark:border-surface-700">
          <!-- Header -->
          <div class="flex items-center justify-between px-5 py-4 border-b border-surface-100 dark:border-surface-700">
            <h3 class="text-sm font-bold text-surface-900 dark:text-surface-100">{{ $t('system.loadUrl') }}</h3>
            <button @click="$emit('close')" class="text-surface-400 hover:text-surface-600 dark:hover:text-surface-300">
              <Icon name="lucide:x" class="w-4 h-4" />
            </button>
          </div>

          <!-- Body -->
          <div class="px-5 py-4 space-y-3">
            <input
              ref="inputRef"
              v-model="url"
              type="url"
              placeholder="https://api.example.com/data.json"
              class="w-full rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm dark:border-surface-700 dark:bg-surface-900 dark:text-surface-100 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
              @keydown.enter="fetchUrl"
            />
            <p v-if="error" class="text-xs text-red-500 dark:text-red-400">{{ error }}</p>
            <p class="text-[11px] text-surface-400 dark:text-surface-500">
              {{ $t('system.loadUrlHint') }}
            </p>
          </div>

          <!-- Footer -->
          <div class="flex items-center justify-end gap-2 px-5 py-3 border-t border-surface-100 dark:border-surface-700">
            <button
              @click="$emit('close')"
              class="px-4 py-1.5 text-xs font-medium text-surface-600 dark:text-surface-400 hover:text-surface-800 dark:hover:text-surface-200"
            >
              {{ $t('system.cancel') }}
            </button>
            <button
              @click="fetchUrl"
              :disabled="loading || !url.trim()"
              class="btn-primary px-4 py-1.5 text-xs disabled:opacity-50"
            >
              {{ loading ? $t('system.loading') : $t('system.fetch') }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  close: []
  loaded: [text: string]
}>()

const inputRef = ref<HTMLInputElement>()
const url = ref('')
const error = ref('')
const loading = ref(false)

watch(() => url.value, () => { error.value = '' })

const fetchUrl = async () => {
  const target = url.value.trim()
  if (!target) return

  loading.value = true
  error.value = ''
  try {
    const res = await fetch(target)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const text = await res.text()
    JSON.parse(text)
    emit('loaded', text)
    url.value = ''
  } catch (e) {
    error.value = (e as Error).message
  } finally {
    loading.value = false
  }
}

defineExpose({ inputRef })
</script>
