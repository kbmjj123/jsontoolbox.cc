<template>
  <div class="flex h-full min-h-0 flex-col">
    <!-- path + node metadata + actions on one row (wraps when the panel is narrow) -->
    <div class="flex flex-wrap items-center gap-x-2 gap-y-1 border-b border-surface-200 px-3 py-1.5 dark:border-surface-700">
      <Icon name="lucide:file-json" class="h-4 w-4 shrink-0 text-primary-600 dark:text-primary-400" />
      <code class="min-w-0 flex-1 truncate rounded bg-surface-100 px-2 py-0.5 font-mono text-xs text-surface-600 dark:bg-surface-800 dark:text-surface-300">{{ previewJsonPath }}</code>

      <span class="lf-chip shrink-0">
        <span class="opacity-60">{{ t('largeViewer.nodeType') }}</span>
        <span class="font-mono">{{ previewNodeType }}</span>
      </span>
      <span class="lf-chip shrink-0">
        <span class="opacity-60">{{ t('largeViewer.nodeSize') }}</span>
        <span class="font-mono">{{ formatBytes(previewNodeSize) }}</span>
      </span>
      <span class="lf-chip shrink-0">
        <span class="opacity-60">{{ t('largeViewer.childCount') }}</span>
        <span class="font-mono">{{ previewChildCount === null ? '—' : previewChildCount }}</span>
      </span>
      <!-- only when a leaf match was promoted to its container -->
      <span v-if="previewPromoted" class="lf-chip shrink-0">
        <span class="opacity-60">{{ t('largeViewer.matchedPath') }}</span>
        <span class="font-mono">{{ matchedJsonPath }}</span>
      </span>

      <div ref="pathMenuRef" class="relative flex shrink-0 items-center gap-1">
        <!-- single copy action; the two path variants live in its menu -->
        <button
          type="button"
          class="lf-btn-sm"
          :disabled="!previewJsonPath || previewJsonPath === '$'"
          :title="t('largeViewer.copyPath')"
          @click="showPathMenu = !showPathMenu"
        >
          <Icon :name="copiedPath ? 'lucide:check' : 'lucide:copy'" class="h-3.5 w-3.5" />
          {{ t('largeViewer.copyPath') }}
        </button>
        <div
          v-if="showPathMenu"
          class="absolute right-0 top-full z-20 mt-1 w-48 rounded-lg border border-surface-200 bg-white p-1 shadow-lg dark:border-surface-700 dark:bg-surface-800"
        >
          <button
            type="button"
            class="block w-full rounded-md px-2 py-1.5 text-left text-xs text-surface-600 hover:bg-surface-100 dark:text-surface-300 dark:hover:bg-surface-700"
            @click="copyJsonPath"
          >
            {{ t('largeViewer.copyJsonPath') }}
          </button>
          <button
            type="button"
            class="block w-full rounded-md px-2 py-1.5 text-left text-xs text-surface-600 hover:bg-surface-100 dark:text-surface-300 dark:hover:bg-surface-700"
            @click="copyParentPath"
          >
            {{ t('largeViewer.copyParentPath') }}
          </button>
        </div>

        <button
          v-if="previewNodeType === 'array'"
          type="button"
          class="lf-btn-sm-primary"
          :title="t('largeViewer.arrayBrowse')"
          @click="emit('browse-array', previewJsonPath, props.hit.offset)"
        >
          <Icon name="lucide:list" class="h-3.5 w-3.5" />
          {{ t('largeViewer.arrayBrowse') }}
        </button>
      </div>
    </div>

    <JsonOutputPanel
      class="min-h-0 flex-1"
      :label="''"
      :enable-tree-search="false"
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
import { enclosingContainerStart, extractNodeAt, toJsonPath, type SearchTextHit } from '~/utils/textSearch'

const props = defineProps<{
  hit: SearchTextHit
  rawText: string
  fileName: string
}>()

const emit = defineEmits<{
  'browse-array': [path: string, offset: number]
}>()

const { t } = useI18n()

const previewViewMode = ref<'text' | 'rich' | 'table'>('rich')
const copiedPath = ref<'' | 'path' | 'parent'>('')
const showPathMenu = ref(false)
const pathMenuRef = ref<HTMLElement>()

onMounted(() => {
  const handler = (e: MouseEvent) => {
    if (pathMenuRef.value && !pathMenuRef.value.contains(e.target as Node)) {
      showPathMenu.value = false
    }
  }
  document.addEventListener('click', handler)
  onUnmounted(() => document.removeEventListener('click', handler))
})

// `hit.offset` points at the matched character (inside a string/primitive) and
// is not a valid node start — `nodeOffset` is the enclosing node's start.
const nodeOffset = computed(() => props.hit.nodeOffset ?? props.hit.offset)

/**
 * A leaf match (`"account-000097"`, `42`, …) is already visible on the match
 * line, so previewing it alone adds nothing — promote to the object/array that
 * contains it, which is the "node" worth inspecting.
 */
const previewOffset = computed(() => {
  const base = nodeOffset.value
  const t = props.rawText
  let i = base
  while (i < t.length && (t[i] === ' ' || t[i] === '\t' || t[i] === '\n' || t[i] === '\r')) i++
  if (t[i] === '{' || t[i] === '[') return base
  const parent = enclosingContainerStart(t, base)
  // Promoting into a container larger than the extraction cap would render a
  // truncated fragment — in that case the leaf itself is the better preview.
  if (parent >= 0 && !extractNodeAt(t, parent).truncated) return parent
  return base
})

/** True when the panel shows the container instead of the matched leaf. */
const previewPromoted = computed(() => previewOffset.value !== nodeOffset.value)

const previewExtract = computed(() => extractNodeAt(props.rawText, previewOffset.value))
const previewRaw = computed(() => previewExtract.value?.raw ?? '')
const previewTruncated = computed(() => previewExtract.value?.truncated ?? false)
const matchedJsonPath = computed(() => toJsonPath(props.hit.path ?? ''))
const previewJsonPath = computed(() =>
  previewPromoted.value ? parentOf(matchedJsonPath.value) : matchedJsonPath.value,
)
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
  showPathMenu.value = false
  if (!previewJsonPath.value || previewJsonPath.value === '$') return
  try { await navigator.clipboard.writeText(previewJsonPath.value); flashPath('path') } catch {}
}
async function copyParentPath() {
  showPathMenu.value = false
  if (!previewJsonPath.value || previewJsonPath.value === '$') return
  try { await navigator.clipboard.writeText(parentOf(previewJsonPath.value)); flashPath('parent') } catch {}
}

watch(() => props.hit, () => {
  copiedPath.value = ''
  showPathMenu.value = false
  // Nodes that are too large to parse have no rich view — fall back to text so
  // the panel never opens on an empty "no data" state.
  previewViewMode.value = previewParsed.value ? 'rich' : 'text'
}, { immediate: true })
</script>
