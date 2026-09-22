<template>
  <div :class="rootClass">
    <!-- IDLE: upload -->
    <div v-if="showDropzone" class="flex flex-1 items-center justify-center p-2">
      <LargeFileDropzone @select="onSelect" />
    </div>

    <!-- scanning -->
    <div v-else-if="loading" class="flex flex-1 flex-col items-center justify-center gap-3 text-surface-500 dark:text-surface-400">
      <Icon name="lucide:loader-circle" class="w-7 h-7 animate-spin" />
      <p class="text-sm">{{ t('largeViewer.scanning') }}</p>
    </div>

    <!-- invalid -->
    <div v-else-if="lf.status.value === 'invalid'" class="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
      <div class="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
        <Icon name="lucide:alert-triangle" class="w-6 h-6 text-amber-600 dark:text-amber-400" />
      </div>
      <h3 class="text-lg font-semibold text-surface-900 dark:text-surface-100">{{ t('largeViewer.invalidTitle') }}</h3>
      <p class="max-w-md text-sm text-surface-600 dark:text-surface-400">
        {{ lf.scanError.value?.message }}
      </p>
      <pre
        v-if="lf.scanError.value?.snippet"
        class="max-w-md overflow-x-auto rounded-lg bg-surface-100 p-3 text-left font-mono text-xs text-surface-600 dark:bg-surface-800 dark:text-surface-300"
      >{{ lf.scanError.value.snippet }}</pre>
      <button
        type="button"
        class="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600"
        @click="lf.reset()"
      >
        {{ t('largeViewer.chooseAnother') }}
      </button>
    </div>

    <!-- ready / searching -->
    <div v-else class="flex min-h-0 flex-1 flex-col">
      <!-- toolbar -->
      <div class="flex flex-wrap items-center gap-2">
        <div class="flex min-w-0 items-center gap-2 text-sm">
          <Icon :name="format === 'ndjson' ? 'lucide:list' : 'lucide:braces'" class="w-4 h-4 text-primary-600 dark:text-primary-400" />
          <span class="truncate font-medium text-surface-800 dark:text-surface-200">{{ lf.fileName.value }}</span>
          <span class="text-surface-400 dark:text-surface-500">·</span>
          <span class="text-surface-500 dark:text-surface-400">{{ formatBytes(lf.fileSize.value) }}</span>
          <span class="text-surface-400 dark:text-surface-500">·</span>
          <span class="uppercase text-surface-500 dark:text-surface-400">{{ format }}</span>
          <span class="text-surface-400 dark:text-surface-500">·</span>
          <span class="text-surface-500 dark:text-surface-400">{{ lineCount.toLocaleString() }} {{ t('largeViewer.lines') }}</span>
        </div>

        <!-- array pager (NDJSON lines / root JSON array) -->
        <div v-if="arrayCount > 1" class="flex flex-wrap items-center gap-2">
          <span class="text-xs text-surface-500 dark:text-surface-400">
            {{ t('largeViewer.arrayItem', { n: arrayIndex + 1, m: arrayCount }) }}
          </span>
          <div class="flex items-center gap-0.5">
            <button type="button" class="rounded p-1 text-surface-500 hover:text-surface-700 disabled:opacity-30 dark:text-surface-400" :title="t('largeViewer.first')" @click="gotoElement(0)">
              <Icon name="lucide:chevrons-left" class="h-4 w-4" />
            </button>
            <button type="button" class="rounded p-1 text-surface-500 hover:text-surface-700 disabled:opacity-30 dark:text-surface-400" :disabled="arrayIndex <= 0" @click="gotoElement(arrayIndex - 1)">
              <Icon name="lucide:chevron-left" class="h-4 w-4" />
            </button>
            <input
              type="number"
              min="1"
              :max="arrayCount"
              :value="arrayIndex + 1"
              class="w-16 rounded border border-surface-200 bg-white px-2 py-1 text-center text-xs text-surface-700 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-200"
              @change="onPageInput"
            >
            <button type="button" class="rounded p-1 text-surface-500 hover:text-surface-700 disabled:opacity-30 dark:text-surface-400" :disabled="arrayIndex >= arrayCount - 1" @click="gotoElement(arrayIndex + 1)">
              <Icon name="lucide:chevron-right" class="h-4 w-4" />
            </button>
            <button type="button" class="rounded p-1 text-surface-500 hover:text-surface-700 disabled:opacity-30 dark:text-surface-400" :title="t('largeViewer.last')" @click="gotoElement(arrayCount - 1)">
              <Icon name="lucide:chevrons-right" class="h-4 w-4" />
            </button>
          </div>
        </div>

        <div class="ml-auto flex items-center gap-2">
          <!-- wrap toggle -->
          <button
            type="button"
            class="rounded-lg border px-2.5 py-1.5 text-xs transition-colors"
            :class="wrap
              ? 'border-primary-400 bg-primary-50 text-primary-700 dark:border-primary-500 dark:bg-primary-900/30 dark:text-primary-300'
              : 'border-surface-200 text-surface-500 hover:text-surface-700 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-400'"
            :title="t('largeViewer.wrap')"
            @click="wrap = !wrap"
          >
            {{ t('largeViewer.wrap') }}
          </button>

          <!-- fullscreen -->
          <button
            type="button"
            class="rounded-lg border border-surface-200 p-1.5 text-surface-500 hover:text-surface-700 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-400"
            :title="isFullscreen ? t('largeViewer.exitFullscreen') : t('largeViewer.fullscreen')"
            @click="toggle"
          >
            <Icon :name="isFullscreen ? 'lucide:minimize' : 'lucide:maximize'" class="w-4 h-4" />
          </button>
        </div>
      </div>

      <!-- search bar -->
      <div class="mt-2">
        <LargeFileSearchBar
          :query="lf.searchQuery.value"
          :scope="lf.searchScope.value"
          :case-sensitive="lf.searchCaseSensitive.value"
          :searching="lf.status.value === 'searching'"
          :hit-count="lf.searchHits.value.length"
          :current-index="lf.currentHit.value"
          @update:query="lf.searchQuery.value = $event"
          @update:scope="lf.searchScope.value = $event"
          @update:case-sensitive="lf.searchCaseSensitive.value = $event"
          @search="runSearch"
          @cancel="lf.cancelSearch()"
          @prev="lf.prevHit()"
          @next="lf.nextHit()"
        />
        <!-- progress -->
        <div v-if="lf.status.value === 'searching'" class="mt-2 h-1 w-full overflow-hidden rounded bg-surface-100 dark:bg-surface-800">
          <div
            class="h-full bg-primary-500 transition-[width] duration-150"
            :style="{ width: progressPct + '%' }"
          />
        </div>
      </div>

      <!-- viewport + results -->
      <div class="mt-2 flex min-h-0 flex-1 flex-col">
        <LargeFileTextViewer
          :text="lf.rawText.value"
          :line-offsets="lineOffsets"
          :current-line="currentLine"
          :active-match="activeMatch"
          :match-query="lf.searchQuery.value"
          :wrap="wrap"
          class="min-h-0 flex-1"
          @line-click="onLineClick"
        />

        <!-- results panel -->
        <div
          class="shrink-0 overflow-hidden border-t border-surface-200 dark:border-surface-700"
          :style="{ height: resultsOpen ? resultsHeight + 'px' : '34px' }"
        >
          <div
            class="flex h-[34px] cursor-row-resize items-center justify-between px-3 text-xs text-surface-500 dark:text-surface-400"
            @mousedown="onDragStart"
          >
            <button type="button" class="flex items-center gap-1 hover:text-surface-700 dark:hover:text-surface-200" @click="resultsOpen = !resultsOpen">
              <Icon :name="resultsOpen ? 'lucide:chevron-down' : 'lucide:chevron-up'" class="w-4 h-4" />
              {{ t('largeViewer.results') }}
            </button>
            <span>{{ lf.searchHits.value.length ? `${lf.currentHit.value + 1}/${lf.searchHits.value.length}` : '' }}</span>
          </div>
          <LargeFileResults
            v-if="resultsOpen"
            class="h-[calc(100%-34px)]"
            :hits="lf.searchHits.value"
            :current-index="lf.currentHit.value"
            :truncated="lf.searchTruncated.value"
            :text="lf.rawText.value"
            :line-offsets="lineOffsets"
            :file-name="lf.fileName.value"
            :format="lf.format.value"
            @select="lf.gotoHit"
            @export-records="exportRecords"
            @preview="openPreview"
          />
        </div>
      </div>

      <!-- node preview modal -->
      <LargeFileNodePreview
        :open="!!previewHit"
        :text="lf.rawText.value"
        :offset="previewHit?.offset ?? 0"
        :json-path="previewHit ? toJsonPath(previewHit.path ?? '') : ''"
        @close="previewHit = null"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import LargeFileDropzone from '~/components/tool/LargeFileDropzone.vue'
import LargeFileTextViewer from '~/components/tool/LargeFileTextViewer.vue'
import LargeFileSearchBar from '~/components/tool/LargeFileSearchBar.vue'
import LargeFileResults from '~/components/tool/LargeFileResults.vue'
import LargeFileNodePreview from '~/components/tool/LargeFileNodePreview.vue'
import type { FileFormat } from '~/workers/recordStream.worker'
import type { SearchTextHit } from '~/utils/textSearch'
import { toJsonPath } from '~/utils/textSearch'

const { t } = useI18n()
const { isFullscreen, toggle } = useFullscreen()

// Anchor the component to a definite height. The tool page renders universal
// components inside a normal-flow card (no height constraint), so without this
// the `flex-1` chains collapse, the text viewer expands to its full content
// height and the virtual list renders every line — freezing the tab.
const rootClass = 'flex h-[calc(100vh_-_9rem)] min-h-0 flex-col'

const lf = useLargeFile()
const handoff = useLargeFileHandoff()

const wrap = ref(false)
const focusLine = ref(0)
const resultsOpen = ref(true)
const resultsHeight = ref(300)
const previewHit = ref<SearchTextHit | null>(null)
const arrayIndex = ref(0)

const lineOffsets = computed<Uint32Array | null>(() => lf.scan.value?.lineOffsets ?? null)
const lineCount = computed(() => lineOffsets.value?.length ?? 0)
const format = computed<FileFormat>(() => lf.format.value)
const loading = computed(() => lf.status.value === 'scanning' || lf.status.value === 'loading')
const showDropzone = computed(() => lf.status.value === 'idle' && !lf.rawText.value)
const arrayCount = computed(() => lf.arrayCount.value)

const activeMatch = computed<SearchTextHit | null>(
  () => lf.searchHits.value[lf.currentHit.value] ?? null,
)
const currentLine = computed(() => activeMatch.value?.line ?? focusLine.value)
const progressPct = computed(() => {
  const p = lf.searchProgress.value
  if (!p.total) return 0
  return Math.min(100, Math.round((p.scanned / p.total) * 100))
})

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / 1024 / 1024).toFixed(1)} MB`
}

function onSelect(payload: { file: File; format: 'auto' | FileFormat }) {
  const fmt = payload.format === 'auto' ? undefined : payload.format
  lf.loadFile(payload.file, fmt)
}

function runSearch() {
  lf.searchText(lf.searchQuery.value, lf.searchScope.value, lf.searchCaseSensitive.value)
}

function onLineClick(line: number) {
  focusLine.value = line
}

function gotoElement(i: number) {
  const count = lf.arrayCount.value
  if (!count) return
  const idx = Math.max(0, Math.min(count - 1, i))
  arrayIndex.value = idx
  const line = lf.elementLine(idx)
  if (line) focusLine.value = line
}

function onPageInput(e: Event) {
  const v = Number((e.target as HTMLInputElement).value)
  if (!Number.isNaN(v)) gotoElement(v - 1)
}

function openPreview(hit: SearchTextHit) {
  previewHit.value = hit
}

async function exportRecords() {
  if (!lf.scan.value?.ok) return
  lf.selectedCollection.value = lf.scan.value.candidates[0]?.path ?? ''
  await lf.fetchFields()
  await lf.startExport({ columns: lf.fields.value.map(f => f.path) })
}

function onDragStart(e: MouseEvent) {
  if (!resultsOpen.value) return
  e.preventDefault()
  const startY = e.clientY
  const startH = resultsHeight.value
  const move = (ev: MouseEvent) => {
    resultsHeight.value = Math.min(640, Math.max(120, startH + (startY - ev.clientY)))
  }
  const up = () => {
    document.removeEventListener('mousemove', move)
    document.removeEventListener('mouseup', up)
  }
  document.addEventListener('mousemove', move)
  document.addEventListener('mouseup', up)
}

onMounted(() => {
  // §4: on mobile the results panel defaults to collapsed to leave room for the
  // text viewport. Set here (client-only) to avoid an SSR hydration mismatch.
  if (window.innerWidth < 768) resultsOpen.value = false

  const h = handoff.value
  if (h?.text) {
    lf.loadText(h.text, h.format ?? 'json', h.fileName || 'pasted.json')
    handoff.value = {}
  } else if (h?.file) {
    lf.loadFile(h.file, h.format)
    handoff.value = {}
  }
})
</script>
