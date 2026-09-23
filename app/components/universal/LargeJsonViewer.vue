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
        {{ invalidMessage }}
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

        <!-- array pager (root sequence or a focused nested array) -->
        <div v-if="arrayCount > 1" class="flex flex-wrap items-center gap-x-3 gap-y-1">
          <!-- focused-array context -->
          <template v-if="lf.currentArrayPath.value">
            <span class="flex items-center gap-1 text-xs text-surface-500 dark:text-surface-400">
              <Icon name="lucide:list" class="h-3.5 w-3.5 text-primary-600 dark:text-primary-400" />
              <span>{{ t('largeViewer.currentArray') }}</span>
              <code class="rounded bg-surface-100 px-1.5 py-0.5 font-mono text-surface-600 dark:bg-surface-800 dark:text-surface-300">{{ lf.currentArrayPath.value }}</code>
              <span class="text-surface-400 dark:text-surface-500">·</span>
              <span class="font-mono">{{ arrayCount.toLocaleString() }}</span>
            </span>
            <button
              type="button"
              class="rounded border border-surface-200 px-2 py-1 text-xs hover:text-surface-700 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-400"
              @click="exitArray"
            >
              {{ t('largeViewer.backToRoot') }}
            </button>
          </template>
          <span v-else class="text-xs text-surface-500 dark:text-surface-400">
            {{ t('largeViewer.arrayItem', { n: arrayIndex + 1, m: arrayCount }) }}
          </span>

          <!-- jump to index -->
          <span class="text-xs text-surface-500 dark:text-surface-400">{{ t('largeViewer.jumpToIndex') }}</span>
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
              class="w-20 rounded border border-surface-200 bg-white px-2 py-1 text-center text-xs text-surface-700 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-200"
              @change="onPageInput"
            >
            <button type="button" class="rounded p-1 text-surface-500 hover:text-surface-700 disabled:opacity-30 dark:text-surface-400" :disabled="arrayIndex >= arrayCount - 1" @click="gotoElement(arrayIndex + 1)">
              <Icon name="lucide:chevron-right" class="h-4 w-4" />
            </button>
            <button type="button" class="rounded p-1 text-surface-500 hover:text-surface-700 disabled:opacity-30 dark:text-surface-400" :title="t('largeViewer.last')" @click="gotoElement(arrayCount - 1)">
              <Icon name="lucide:chevrons-right" class="h-4 w-4" />
            </button>
          </div>

          <!-- page size + page navigation + current range -->
          <span class="flex items-center gap-1 text-xs text-surface-500 dark:text-surface-400">
            {{ t('largeViewer.pageSize') }}
            <select
              :value="pageSize"
              class="rounded border border-surface-200 bg-white px-1 py-1 text-xs text-surface-700 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-200"
              @change="onPageSize"
            >
              <option v-for="s in pageSizes" :key="s" :value="s">{{ s }}</option>
            </select>
          </span>
          <div class="flex items-center gap-0.5">
            <button
              type="button"
              class="rounded px-2 py-1 text-xs text-surface-600 hover:bg-surface-100 disabled:opacity-30 dark:text-surface-400 dark:hover:bg-surface-700"
              :disabled="pageStart <= 0"
              @click="gotoElement(Math.max(0, pageStart - pageSize))"
            >
              {{ t('largeViewer.pagePrev') }}
            </button>
            <button
              type="button"
              class="rounded px-2 py-1 text-xs text-surface-600 hover:bg-surface-100 disabled:opacity-30 dark:text-surface-400 dark:hover:bg-surface-700"
              :disabled="pageStart + pageSize >= arrayCount"
              @click="gotoElement(Math.min(arrayCount - 1, pageStart + pageSize))"
            >
              {{ t('largeViewer.pageNext') }}
            </button>
          </div>
          <span class="font-mono text-xs text-surface-500 dark:text-surface-400">
            {{ t('largeViewer.range', { a: pageStart + 1, b: Math.min(pageStart + pageSize, arrayCount), m: arrayCount }) }}
          </span>
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

      <!-- structure overview -->
      <div v-if="lf.scan.value?.ok" class="mt-2">
        <LargeFileStructure :scan="lf.scan.value" />
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

      <!-- go-to-path bar -->
      <div class="mt-2 flex flex-wrap items-center gap-2">
        <div class="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-surface-200 bg-surface-50 px-2 py-1 dark:border-surface-700 dark:bg-surface-900">
          <Icon name="lucide:route" class="h-4 w-4 shrink-0 text-surface-400" />
          <input
            v-model="pathInput"
            type="text"
            :placeholder="t('largeViewer.pathPlaceholder')"
            class="min-w-0 flex-1 bg-transparent font-mono text-xs text-surface-700 outline-none dark:text-surface-200"
            @keydown.enter="onGoPath"
          >
          <button
            type="button"
            class="rounded-md bg-primary-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-primary-700 dark:bg-primary-500"
            @click="onGoPath"
          >
            {{ t('largeViewer.pathGo') }}
          </button>
        </div>
        <p
          v-if="pathMessage"
          class="text-xs"
          :class="pathMessage.kind === 'error' ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'"
        >
          {{ pathMessage.text }}
        </p>
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
              {{ previewHit ? t('largeViewer.preview') : t('largeViewer.results') }}
            </button>
            <span>{{ lf.searchHits.value.length ? `${lf.currentHit.value + 1}/${lf.searchHits.value.length}` : '' }}</span>
          </div>
          <!-- inline node inspector (replaces the old modal) -->
          <div v-if="resultsOpen && previewHit" class="flex h-[calc(100%-34px)] min-h-0 flex-col">
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
                  v-if="previewNodeType === 'array' && previewHit"
                  type="button"
                  class="flex items-center gap-1 rounded-md border border-primary-300 px-2 py-1 text-xs text-primary-700 hover:bg-primary-50 dark:border-primary-700 dark:bg-surface-800 dark:text-primary-300"
                  :title="t('largeViewer.arrayBrowse')"
                  @click="enterArray(previewJsonPath, previewHit.offset)"
                >
                  <Icon name="lucide:list" class="h-3.5 w-3.5" />
                  {{ t('largeViewer.arrayBrowse') }}
                </button>
                <button
                  type="button"
                  class="rounded-md p-1 text-surface-500 hover:text-surface-700 dark:text-surface-400"
                  :title="t('largeViewer.closeInspector')"
                  @click="previewHit = null"
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

          <LargeFileResults
            v-else-if="resultsOpen"
            class="h-[calc(100%-34px)]"
            :hits="lf.searchHits.value"
            :current-index="lf.currentHit.value"
            :truncated="lf.searchTruncated.value"
            :text="lf.rawText.value"
            :line-offsets="lineOffsets"
            :file-name="lf.fileName.value"
            :format="lf.format.value"
            @select="onSelectHit"
            @export-records="exportRecords"
            @preview="openPreview"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import LargeFileDropzone from '~/components/tool/LargeFileDropzone.vue'
import LargeFileTextViewer from '~/components/tool/LargeFileTextViewer.vue'
import LargeFileSearchBar from '~/components/tool/LargeFileSearchBar.vue'
import LargeFileResults from '~/components/tool/LargeFileResults.vue'
import JsonOutputPanel from '~/components/tool/JsonOutputPanel.vue'
import LargeFileStructure from '~/components/tool/LargeFileStructure.vue'
import type { FileFormat } from '~/workers/recordStream.worker'
import type { SearchTextHit } from '~/utils/textSearch'
import { toJsonPath, extractNodeAt } from '~/utils/textSearch'

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
const pathInput = ref('')
const pathMessage = ref<{ kind: 'error' | 'approx'; text: string } | null>(null)

const lineOffsets = computed<Uint32Array | null>(() => lf.scan.value?.lineOffsets ?? null)
const lineCount = computed(() => lineOffsets.value?.length ?? 0)
const format = computed<FileFormat>(() => lf.format.value)
const loading = computed(() => lf.status.value === 'scanning' || lf.status.value === 'loading')
const showDropzone = computed(() => lf.status.value === 'idle' && !lf.rawText.value)
const arrayCount = computed(() => lf.currentArrayCount.value)

const activeMatch = computed<SearchTextHit | null>(
  () => lf.searchHits.value[lf.currentHit.value] ?? null,
)
const currentLine = computed(() => activeMatch.value?.line ?? focusLine.value)
const invalidMessage = computed(() => {
  const r = lf.scanError.value?.reason
  if (r === 'eof') return t('largeViewer.invalidReasonEof')
  if (r === 'token') return t('largeViewer.invalidReasonToken')
  if (r === 'empty') return t('largeViewer.invalidReasonEmpty')
  if (r === 'scanner') return t('largeViewer.invalidReasonScanner')
  return lf.scanError.value?.message ?? ''
})
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
  // In a paged document (NDJSON / root array) every line is a record, so a
  // click can also locate that node and surface its JSONPath.
  const ak = lf.arrayKind.value
  if (ak) {
    const idx = lf.elementIndexAtLine(line)
    if (idx >= 0) {
      const off = ak === 'ndjson'
        ? (lf.scan.value?.lineOffsets?.[idx] ?? 0)
        : (lf.topArray.value?.[idx] ?? 0)
      if (off) openPathResult({ offset: off, line, path: `[${idx}]` })
    }
  }
}

function gotoElement(i: number) {
  const count = lf.currentArrayCount.value
  if (!count) return
  const idx = Math.max(0, Math.min(count - 1, i))
  arrayIndex.value = idx
  const line = lf.elementLine(idx)
  if (line) focusLine.value = line
}

// --- array-aware pager extras (page size / range / focused-array context) ---
const pageSizes = [50, 100, 200, 500, 1000]
const pageSize = ref(100)
const pageStart = computed(() => Math.floor(arrayIndex.value / pageSize.value) * pageSize.value)
function onPageSize(e: Event) {
  pageSize.value = Number((e.target as HTMLSelectElement).value) || 100
}
function enterArray(path: string, offset: number) {
  if (!path || path === '$') return
  lf.setCurrentArray(path, offset)
  arrayIndex.value = 0
  const line = lf.elementLine(0)
  if (line) focusLine.value = line
}
function exitArray() {
  lf.clearCurrentArray()
  arrayIndex.value = 0
}

function onPageInput(e: Event) {
  const v = Number((e.target as HTMLInputElement).value)
  if (!Number.isNaN(v)) gotoElement(v - 1)
}

function openPreview(hit: SearchTextHit) {
  previewHit.value = hit
}

/** Scroll to and preview a node located by an offset/line/path triple. */
function openPathResult(r: { offset: number; line: number; path: string }) {
  focusLine.value = r.line
  previewHit.value = { index: 0, line: r.line, column: 1, offset: r.offset, path: r.path, preview: '' }
  if (!resultsOpen.value) resultsOpen.value = true
}

/** Clicking a search result row both jumps the viewport and opens the node
 *  preview so its JSONPath is visible. */
function onSelectHit(index: number) {
  lf.gotoHit(index)
  const hit = lf.searchHits.value[index]
  if (hit) previewHit.value = hit
}

// --- inline node inspector (replaces the old modal) ---
const previewViewMode = ref<'text' | 'rich' | 'table'>('rich')
const copiedPath = ref<'' | 'path' | 'parent'>('')

const previewExtract = computed(() =>
  previewHit.value ? extractNodeAt(lf.rawText.value, previewHit.value.offset) : null,
)
const previewRaw = computed(() => previewExtract.value?.raw ?? '')
const previewTruncated = computed(() => previewExtract.value?.truncated ?? false)
const previewJsonPath = computed(() => (previewHit.value ? toJsonPath(previewHit.value.path ?? '') : ''))
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
const inspectorFilename = computed(() => (lf.fileName.value || 'node') + '.node.json')

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

watch(previewHit, () => {
  copiedPath.value = ''
  previewViewMode.value = previewParsed.value ? 'rich' : 'text'
})

/** Resolve a typed JSONPath and jump to it. */
function onGoPath() {
  const raw = pathInput.value.trim()
  if (!raw) return
  const r = lf.gotoPath(raw)
  if (r.ok) {
    openPathResult(r)
    // If the resolved node itself is an array (e.g. $.orders), switch the
    // pager into that array's context. Root-sequence elements (`$[N]`, NDJSON
    // lines) report a path starting with `[` and are excluded.
    if (lf.rawText.value[r.offset] === '[' && r.path && !r.path.startsWith('[')) {
      enterArray(toJsonPath(r.path), r.offset)
    }
    pathMessage.value = r.approximate ? { kind: 'approx', text: t('largeViewer.pathApprox') } : null
  } else {
    pathMessage.value = { kind: 'error', text: t(r.messageKey, r.params) }
  }
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
