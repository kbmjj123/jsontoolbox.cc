<template>
  <Teleport to="body">
    <transition name="fade">
      <div
        v-if="open"
        class="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 dark:bg-black/60"
        @click.self="emit('close')"
      >
        <div
          class="flex max-h-[82vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-surface-200 bg-white shadow-2xl dark:border-surface-700 dark:bg-surface-900"
        >
          <!-- header -->
          <div class="flex items-center gap-2 border-b border-surface-200 px-4 py-3 dark:border-surface-700">
            <Icon name="lucide:file-json" class="h-4 w-4 text-primary-600 dark:text-primary-400" />
            <span class="text-sm font-semibold text-surface-800 dark:text-surface-200">{{ t('largeViewer.preview') }}</span>
            <code
              v-if="jsonPath"
              class="truncate rounded bg-surface-100 px-2 py-0.5 font-mono text-xs text-surface-600 dark:bg-surface-800 dark:text-surface-300"
            >{{ jsonPath }}</code>
            <div class="ml-auto flex items-center gap-1">
              <button
                type="button"
                class="rounded-lg border border-surface-200 px-2.5 py-1 text-xs hover:text-surface-700 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-400"
                @click="copyNode"
              >
                {{ copied ? '✓' : t('largeViewer.copyPath') }}
              </button>
              <button
                type="button"
                class="rounded-lg p-1.5 text-surface-500 hover:text-surface-700 dark:text-surface-400"
                :title="t('largeViewer.preview')"
                @click="emit('close')"
              >
                <Icon name="lucide:x" class="h-4 w-4" />
              </button>
            </div>
          </div>

          <!-- body -->
          <div class="min-h-0 flex-1 overflow-auto bg-surface-50 p-4 dark:bg-surface-950">
            <pre
              class="whitespace-pre font-mono text-xs leading-relaxed text-surface-700 dark:text-surface-300"
            >{{ nodeText }}</pre>
            <p
              v-if="isTruncated"
              class="mt-3 rounded-lg bg-amber-100 px-3 py-2 text-xs text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
            >
              {{ t('largeViewer.nodeTooLarge', { n: 200 }) }}
            </p>
          </div>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { extractNodeAt } from '~/utils/textSearch'

const props = defineProps<{
  open: boolean
  text: string
  offset: number
  jsonPath?: string
}>()
const emit = defineEmits<{ (e: 'close'): void }>()

const { t } = useI18n()

const nodeText = ref('')
const isTruncated = ref(false)
const copied = ref(false)

const raw = computed(() => {
  if (!props.open || !props.text) return ''
  const r = extractNodeAt(props.text, props.offset)
  isTruncated.value = r.truncated
  return r.raw
})

watch(
  () => [props.open, props.offset, props.text],
  () => {
    copied.value = false
    const r = extractNodeAt(props.text, props.offset)
    isTruncated.value = r.truncated
    try {
      nodeText.value = JSON.stringify(JSON.parse(r.raw), null, 2)
    } catch {
      nodeText.value = r.raw
    }
  },
  { immediate: true },
)

async function copyNode() {
  try {
    await navigator.clipboard.writeText(nodeText.value)
    copied.value = true
    setTimeout(() => (copied.value = false), 1200)
  } catch { /* clipboard unavailable */ }
}
</script>
