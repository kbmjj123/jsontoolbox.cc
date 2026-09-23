<template>
  <div class="flex h-full min-h-0 flex-col">
    <div class="flex items-center gap-2 border-b border-surface-200 px-3 py-1.5 dark:border-surface-700">
      <Icon name="lucide:file-json" class="h-4 w-4 shrink-0 text-primary-600 dark:text-primary-400" />
      <code class="min-w-0 flex-1 truncate rounded bg-surface-100 px-2 py-0.5 font-mono text-xs text-surface-600 dark:bg-surface-800 dark:text-surface-300">{{ previewJsonPath }}</code>
      <div class="flex shrink-0 items-center gap-1">
        <button
          type="button"
          class="rounded-md border border-surface-200 px-2 py-1 text-xs hover:text-surface-700 disabled:opacity-40 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-400"
          :disabled="!previewJsonPath || previewJsonPath === '$'"
          :title="t('largeViewer.copyJsonPath')"
          @click="copyJsonPath"
        >
          {{ copiedPath === 'path' ? '✓' : t('largeViewer.copyJsonPath') }}
        </button>
        <button
          type="button"
          class="rounded-md border border-surface-200 px-2 py-1 text-xs hover:text-surface-700 disabled:opacity-40 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-400"
          :disabled="!previewJsonPath || previewJsonPath === '$'"
          :title="t('largeViewer.copyParentPath')"
          @click="copyParentPath"
        >
          {{ copiedPath === 'parent' ? '✓' : t('largeViewer.copyParentPath') }}
        </button>
        <button
          v-if="previewNodeType === 'array'"
          type="button"
          class="flex items-center gap-1 rounded-md border border-primary-300 px-2 py-1 text-xs text-primary-700 hover:bg-primary-50 dark:border-primary-700 dark:bg-surface-800 dark:text-primary-300"
          :title="t('largeViewer.arrayBrowse')"
          @click="emit('browse-array', previewJsonPath, props.hit.offset)"
        >
          <Icon name="lucide:list" class="h-3.5 w-3.5" />
          {{ t('largeViewer.arrayBrowse') }}
        </button>
        <button
          type="button"
          class="rounded-md p-1 text-surface-500 hover:text-surface-700 dark:text-surface-400"
          :title="t('largeViewer.closeInspector')"
          @click="emit('close')"
        >
          <Icon name="lucide:x" class="h-4 w-4" />
        </button>
      </div>
    </div>

    <!-- node metadata -->
    <div class="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-surface-200 px-3 py-1.5 text-xs dark:border-surface-700">
      <span class="flex items-center gap-1.5 text-surface-500 dark:text-surface-400">
        <span class="font-medium text-surface-600 dark:text-surface-300">{{ t('largeViewer.nodeType') }}</span>
        <code class="rounded bg-surface-100 px-1.5 py-0.5 font-mono text-surface-600 dark:bg-surface-800 dark:text-surface-300">{{ previewNodeType }}</code>
      </span>
      <span class="flex items-center gap-1.5 text-surface-500 dark:text-surface-400">
        <span class="font-medium text-surface-600 dark:text-surface-300">{{ t('largeViewer.nodeSize') }}</span>
        <span class="font-mono text-surface-600 dark:text-surface-300">{{ formatBytes(previewNodeSize) }}</span>
      </span>
      <span class="flex items-center gap-1.5 text-surface-500 dark:text-surface-400">
        <span class="font-medium text-surface-600 dark:text-surface-300">{{ t('largeViewer.childCount') }}</span>
        <span class="font-mono text-surface-600 dark:text-surface-300">{{ previewChildCount === null ? '—' : previewChildCount }}</span>
      </span>
    </div>

    <JsonOutputPanel
      class="min-h-0 flex-1"
      :label="t('largeViewer.preview')"
      :content="previewPretty"
      :parsed-data="previewParsed"
      :view-mode="previewViewMode"
      :show-view-toggle="previewParsed !== null"
      :show-copy="true"
      :show-download="true"
      :download-filename="inspectorFilename"
      highlight="json"
      @update:view-mode="previewViewMode = $event"
    />
    <p
      v-if="previewTruncated"
      class="border-t border-surface-200 bg-amber-100 px-3 py-2 text-xs text-amber-700 dark:border-surface-700 dark:bg-amber-900/30 dark:text-amber-300"
    >
      {{ t('largeViewer.nodeTooLarge', { n: 200 }) }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { extractNodeAt, toJsonPath, type SearchTextHit } from '~/utils/textSearch'

const props = defineProps<{
  hit: SearchTextHit
  rawText: string
  fileName: string
}>()

const emit = defineEmits<{
  'browse-array': [path: string, offset: number]
  close: []
}>()

const { t } = useI18n()

const previewViewMode = ref<'text' | 'rich' | 'table'>('rich')
const copiedPath = ref<'' | 'path' | 'parent'>('')

const previewExtract = computed(() => extractNodeAt(props.rawText, props.hit.offset))
const previewRaw = computed(() => previewExtract.value?.raw ?? '')
const previewTruncated = computed(() => previewExtract.value?.truncated ?? false)
const previewJsonPath = computed(() => toJsonPath(props.hit.path ?? ''))
const previewPretty = computed(() => {
  const raw = previewRaw.value
  if (!raw || raw.length > 200_000) return raw
  try { return JSON.stringify(JSON.parse(raw), null, 2) } catch { return raw }
})
const previewParsed = computed(() => {
  const raw = previewRaw.value
  if (!raw || raw.length > 200_000) return null
  try { return JSON.parse(raw) } catch { return null }
})
const inspectorFilename = computed(() => (props.fileName || 'node') + '.node.json')

const previewNodeSize = computed(() => previewExtract.value?.size ?? 0)
const previewNodeType = computed<string>(() => {
  const p = previewParsed.value
  if (p !== null) {
    if (Array.isArray(p)) return 'array'
    if (typeof p === 'object') return 'object'
    return typeof p
  }
  const raw = previewRaw.value.trimStart()
  if (!raw) return '—'
  const c = raw[0]
  if (c === '{') return 'object'
  if (c === '[') return 'array'
  if (c === '"') return 'string'
  if (c === 't' || c === 'f') return 'boolean'
  if (c === 'n') return 'null'
  if (c === '-' || (c >= '0' && c <= '9')) return 'number'
  return '—'
})
const previewChildCount = computed<number | null>(() => {
  const p = previewParsed.value
  if (p === null) return null
  if (Array.isArray(p)) return p.length
  if (typeof p === 'object' && p !== null) return Object.keys(p).length
  return 0
})

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / 1024 / 1024).toFixed(1)} MB`
}

function parentOf(p: string): string {
  if (!p || p === '$') return '$'
  const m = p.match(/(.*)(?:\.([^.\[\]]+)|\[(\d+)\])$/)
  if (!m) return '$'
  return m[1] || '$'
}

function flashPath(which: 'path' | 'parent') {
  copiedPath.value = which
  setTimeout(() => { if (copiedPath.value === which) copiedPath.value = '' }, 1200)
}
async function copyJsonPath() {
  if (!previewJsonPath.value || previewJsonPath.value === '$') return
  try { await navigator.clipboard.writeText(previewJsonPath.value); flashPath('path') } catch {}
}
async function copyParentPath() {
  if (!previewJsonPath.value || previewJsonPath.value === '$') return
  try { await navigator.clipboard.writeText(parentOf(previewJsonPath.value)); flashPath('parent') } catch {}
}

watch(() => props.hit, () => {
  copiedPath.value = ''
  previewViewMode.value = previewParsed.value ? 'rich' : 'text'
})
</script>
