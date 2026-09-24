<template>
  <div ref="rootEl" :class="rootClass">
    <!-- IDLE: upload -->
    <div v-if="showDropzone" class="flex items-center justify-center py-6">
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
        class="lf-btn-primary"
        @click="lf.reset()"
      >
        {{ t('largeViewer.chooseAnother') }}
      </button>
    </div>

    <!-- ready / searching -->
    <div v-else class="flex min-h-0 flex-1">
      <div class="flex min-w-0 flex-1 flex-col">
      <!-- toolbar -->
      <div class="flex flex-wrap items-center gap-2">
        <div class="flex min-w-0 items-center gap-1.5 text-sm">
          <Icon :name="format === 'ndjson' ? 'lucide:list' : 'lucide:braces'" class="h-4 w-4 shrink-0 text-primary-600 dark:text-primary-400" />
          <span class="truncate font-medium text-surface-800 dark:text-surface-200">{{ lf.fileName.value }}</span>
          <span class="lf-chip">{{ formatBytes(lf.fileSize.value) }}</span>
          <span class="lf-chip uppercase">{{ format }}</span>
          <span class="lf-chip">{{ lineCount.toLocaleString() }} {{ t('largeViewer.lines') }}</span>
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
            <button type="button" class="lf-btn-sm" @click="exitArray">
              {{ t('largeViewer.backToRoot') }}
            </button>
          </template>
          <span v-else class="text-xs text-surface-500 dark:text-surface-400">
            {{ t('largeViewer.arrayItem', { n: arrayIndex + 1, m: arrayCount }) }}
          </span>

          <!-- jump to index -->
          <span class="text-xs text-surface-500 dark:text-surface-400">{{ t('largeViewer.jumpToIndex') }}</span>
          <div class="flex items-center gap-0.5">
            <button type="button" class="lf-btn-icon-sm" :title="t('largeViewer.first')" @click="gotoElement(0)">
              <Icon name="lucide:chevrons-left" class="h-4 w-4" />
            </button>
            <button type="button" class="lf-btn-icon-sm" :disabled="arrayIndex <= 0" @click="gotoElement(arrayIndex - 1)">
              <Icon name="lucide:chevron-left" class="h-4 w-4" />
            </button>
            <input
              type="number"
              min="1"
              :max="arrayCount"
              :value="arrayIndex + 1"
              class="lf-input-sm w-20 text-center"
              @change="onPageInput"
            >
            <button type="button" class="lf-btn-icon-sm" :disabled="arrayIndex >= arrayCount - 1" @click="gotoElement(arrayIndex + 1)">
              <Icon name="lucide:chevron-right" class="h-4 w-4" />
            </button>
            <button type="button" class="lf-btn-icon-sm" :title="t('largeViewer.last')" @click="gotoElement(arrayCount - 1)">
              <Icon name="lucide:chevrons-right" class="h-4 w-4" />
            </button>
          </div>

          <!-- page size + page navigation + current range -->
          <span class="flex items-center gap-1 text-xs text-surface-500 dark:text-surface-400">
            {{ t('largeViewer.pageSize') }}
            <select :value="pageSize" class="lf-select-sm" @change="onPageSize">
              <option v-for="s in pageSizes" :key="s" :value="s">{{ s }}</option>
            </select>
          </span>
          <div class="flex items-center gap-0.5">
            <button
              type="button"
              class="lf-btn-sm"
              :disabled="pageStart <= 0"
              @click="gotoElement(Math.max(0, pageStart - pageSize))"
            >
              {{ t('largeViewer.pagePrev') }}
            </button>
            <button
              type="button"
              class="lf-btn-sm"
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

        <div class="ml-auto flex items-center gap-1.5">
          <!-- structure overview toggle -->
          <button
            type="button"
            class="lf-btn-icon-sm"
            :class="structureOpen ? 'active' : ''"
            :title="t('largeViewer.structure')"
            @click="structureOpen = !structureOpen"
          >
            <Icon name="lucide:binary" class="h-4 w-4" />
          </button>

          <!-- go-to-path toggle -->
          <button
            type="button"
            class="lf-btn-icon-sm"
            :class="pathOpen ? 'active' : ''"
            :title="t('largeViewer.pathTitle')"
            @click="pathOpen = !pathOpen"
          >
            <Icon name="lucide:route" class="h-4 w-4" />
          </button>

          <!-- wrap toggle -->
          <button
            type="button"
            class="lf-btn-icon-sm"
            :class="wrap ? 'active' : ''"
            :title="t('largeViewer.wrap')"
            @click="wrap = !wrap"
          >
            <Icon name="lucide:wrap-text" class="h-4 w-4" />
          </button>

          <!-- fullscreen -->
          <button
            type="button"
            class="lf-btn-icon-sm"
            :title="isFullscreen ? t('largeViewer.exitFullscreen') : t('largeViewer.fullscreen')"
            @click="toggle"
          >
            <Icon :name="isFullscreen ? 'lucide:minimize' : 'lucide:maximize'" class="h-4 w-4" />
          </button>
        </div>
      </div>

      <!-- structure overview (collapsed by default) -->
      <div v-if="structureOpen && lf.scan.value?.ok" class="mt-2">
        <LargeFileStructure :scan="lf.scan.value" />
      </div>

      <!-- search bar -->
      <div class="mt-2">
        <LargeFileSearchBar
          :query="lf.searchQuery.value"
          :scope="lf.searchScope.value"
          :case-sensitive="lf.searchCaseSensitive.value"
          :regex="searchRegex"
          :searching="lf.status.value === 'searching'"
          :hit-count="lf.searchHits.value.length"
          :current-index="lf.currentHit.value"
          @update:query="lf.searchQuery.value = $event"
          @update:scope="lf.searchScope.value = $event"
          @update:case-sensitive="lf.searchCaseSensitive.value = $event"
          @update:regex="searchRegex = $event"
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
        <p
          v-if="lf.searchError.value"
          class="mt-1 text-xs text-red-600 dark:text-red-400"
        >
          {{ lf.searchError.value.text }}
        </p>
      </div>

      <!-- go-to-path bar (collapsed by default) -->
      <div v-if="pathOpen" class="mt-2 flex flex-wrap items-center gap-2">
        <div class="flex min-w-0 flex-1 items-center gap-2">
          <Icon name="lucide:route" class="h-4 w-4 shrink-0 text-surface-400" />
          <input
            v-model="pathInput"
            type="text"
            :placeholder="t('largeViewer.pathPlaceholder')"
            class="lf-input min-w-0 flex-1 font-mono"
            @keydown.enter="onGoPath"
          >
          <button type="button" class="lf-btn-primary" @click="onGoPath">
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
          class="flex shrink-0 flex-col overflow-hidden border-t border-surface-200 dark:border-surface-700"
          :style="{ height: resultsOpen && hasPanelContent ? resultsHeight + 'px' : '36px' }"
        >
          <!-- merged header: drag grip + tabs + hit counter + collapse -->
          <div class="flex h-9 shrink-0 items-center gap-2 border-b border-surface-200 px-2 dark:border-surface-700">
            <span
              class="flex h-8 w-6 shrink-0 cursor-row-resize items-center justify-center rounded text-surface-400 hover:bg-surface-100 hover:text-surface-600 dark:hover:bg-surface-800"
              :title="t('largeViewer.results')"
              @mousedown="onDragStart"
            >
              <Icon name="lucide:grip-horizontal" class="h-4 w-4" />
            </span>

            <div class="flex h-9 shrink-0 items-center gap-1">
              <button
                type="button"
                class="relative flex h-full items-center px-2.5 text-xs font-medium transition-colors"
                :class="panelTab === 'results' ? 'text-primary-600 dark:text-primary-400' : 'text-surface-500 hover:text-surface-700 dark:text-surface-400 dark:hover:text-surface-200'"
                @click="panelTab = 'results'"
              >
                {{ t('largeViewer.results') }}
                <span v-if="panelTab === 'results'" class="absolute inset-x-1.5 -bottom-px h-0.5 rounded-full bg-primary-500" />
              </button>
              <button
                type="button"
                class="relative flex h-full items-center px-2.5 text-xs font-medium transition-colors disabled:opacity-40"
                :class="panelTab === 'preview' ? 'text-primary-600 dark:text-primary-400' : 'text-surface-500 hover:text-surface-700 dark:text-surface-400 dark:hover:text-surface-200'"
                :disabled="!previewHit"
                @click="panelTab = 'preview'"
              >
                {{ t('largeViewer.preview') }}
                <span v-if="panelTab === 'preview'" class="absolute inset-x-1.5 -bottom-px h-0.5 rounded-full bg-primary-500" />
              </button>
              <button
                type="button"
                class="relative flex h-full items-center px-2.5 text-xs font-medium transition-colors disabled:opacity-40"
                :class="panelTab === 'context' ? 'text-primary-600 dark:text-primary-400' : 'text-surface-500 hover:text-surface-700 dark:text-surface-400 dark:hover:text-surface-200'"
                :disabled="!activeMatch"
                @click="panelTab = 'context'"
              >
                {{ t('largeViewer.context') }}
                <span v-if="panelTab === 'context'" class="absolute inset-x-1.5 -bottom-px h-0.5 rounded-full bg-primary-500" />
              </button>
            </div>

            <span class="ml-auto text-xs tabular-nums text-surface-500 dark:text-surface-400">
              {{ lf.searchHits.value.length ? `${lf.currentHit.value + 1}/${lf.searchHits.value.length}` : '' }}
            </span>
            <button
              type="button"
              class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-surface-500 hover:bg-surface-100 dark:text-surface-400 dark:hover:bg-surface-800"
              :title="resultsOpen ? t('largeViewer.collapse') : t('largeViewer.expand')"
              @click="resultsOpen = !resultsOpen"
            >
              <Icon :name="resultsOpen ? 'lucide:chevron-down' : 'lucide:chevron-up'" class="h-4 w-4" />
            </button>
          </div>

          <div v-if="resultsOpen && hasPanelContent" class="flex min-h-0 flex-1 flex-col">
            <!-- results list -->
            <div v-show="panelTab === 'results'" class="min-h-0 flex-1">
              <LargeFileResults
                class="h-full"
                :hits="lf.searchHits.value"
                :current-index="lf.currentHit.value"
                :truncated="lf.searchTruncated.value"
                :text="lf.rawText.value"
                :line-offsets="lineOffsets"
                :query="lf.searchQuery.value"
                :is-regex="searchRegex"
                :case-sensitive="lf.searchCaseSensitive.value"
                :file-name="lf.fileName.value"
                :format="lf.format.value"
                @select="onSelectHit"
                @export-records="exportRecords"
                @preview="openPreview"
              />
            </div>

            <!-- node preview -->
            <div v-if="panelTab === 'preview'" class="min-h-0 flex-1">
              <NodeInspector
                v-if="previewHit"
                class="h-full"
                :hit="previewHit"
                :raw-text="lf.rawText.value"
                :file-name="lf.fileName.value"
                @browse-array="enterArray"
              />
              <div v-else class="flex h-full items-center justify-center px-4 text-center text-sm text-surface-400 dark:text-surface-500">
                {{ t('largeViewer.selectToPreview') }}
              </div>
            </div>

            <!-- context lines around the current match -->
            <div v-if="panelTab === 'context'" class="min-h-0 flex-1">
              <LargeFileContext
                class="h-full"
                :hit="activeMatch"
                :text="lf.rawText.value"
                :line-offsets="lineOffsets"
                :query="lf.searchQuery.value"
                :is-regex="searchRegex"
                :case-sensitive="lf.searchCaseSensitive.value"
              />
            </div>
          </div>
        </div>
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
import LargeFileContext from '~/components/tool/LargeFileContext.vue'
import LargeFileStructure from '~/components/tool/LargeFileStructure.vue'
import NodeInspector from '~/components/tool/NodeInspector.vue'
import type { FileFormat } from '~/workers/recordStream.worker'
import type { SearchTextHit } from '~/utils/textSearch'
import { validateRegex } from '~/utils/textSearch'
import { toJsonPath } from '~/utils/jsonPath'

const { t } = useI18n()
// Shared CSS fullscreen state (same composable `ResizablePanel` uses): it locks
// body scroll while active and exits on ESC. It takes a boolean initial value —
// not a DOM target.
const { isFullscreen, toggle } = useFullscreen()
/** Root element ref — used to scroll the loaded viewer into view. */
const rootEl = ref<HTMLElement>()

// Anchor the component to a definite height. The tool page renders universal
// components inside a normal-flow card (no height constraint), so without this
// the `flex-1` chains collapse, the text viewer expands to its full content
// height and the virtual list renders every line — freezing the tab.
// While "fullscreen" the component becomes a fixed overlay filling the viewport.
const rootClass = computed(() => {
  if (isFullscreen.value) {
    return 'fixed inset-0 z-50 flex h-screen min-h-0 flex-col bg-white p-4 dark:bg-surface-900'
  }
  // Idle state: the dropzone must not reserve a full viewport of height — it
  // would leave a tall empty card and push the rest of the page far down.
  // `scroll-mt-20` offsets the scroll target below the sticky site header
  // (h-16 + border) so the whole viewer lands inside the viewport.
  if (showDropzone.value) return 'flex min-h-0 flex-col scroll-mt-20'
  return 'flex h-[calc(100vh_-_9rem)] min-h-0 flex-col scroll-mt-20'
})

const lf = useLargeFile()
const handoff = useLargeFileHandoff()

const wrap = ref(false)
const structureOpen = ref(false)
const pathOpen = ref(false)
const focusLine = ref(0)
const resultsOpen = ref(true)
const resultsHeight = ref(300)
const previewHit = ref<SearchTextHit | null>(null)
const panelTab = ref<'results' | 'preview' | 'context'>('results')
const arrayIndex = ref(0)
const pathInput = ref('')
const searchRegex = ref(false)
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
/** Nothing to list or preview until a search produced hits or a node was
 *  picked — until then the results panel collapses to just its tab row. */
const hasPanelContent = computed(() => lf.searchHits.value.length > 0 || !!previewHit.value)
const currentLine = computed(() => activeMatch.value?.line ?? focusLine.value)

/** True once a document is loaded and scanned (i.e. the working view exists). */
const contentReady = computed(
  () => !!lf.rawText.value && !loading.value && lf.status.value !== 'invalid',
)
// Bring the freshly loaded viewer into view so the toolbar, search bar, text
// viewport and results panel are all visible without manual scrolling.
watch(contentReady, (ready) => {
  if (!ready) return
  nextTick(() => rootEl.value?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
})
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

function onSelect(file: File) {
  lf.loadFile(file)
}

function runSearch() {
  const q = lf.searchQuery.value
  if (searchRegex.value) {
    const v = validateRegex(q, lf.searchCaseSensitive.value ? '' : 'i')
    if (!v.ok) {
      lf.searchError.value = {
        kind: 'error',
        text: v.error === 'regexTooComplex' ? t('largeViewer.regexTooComplex') : (v.error || t('largeViewer.regexInvalid')),
      }
      return
    }
  }
  const job = lf.searchText(lf.searchQuery.value, lf.searchScope.value, lf.searchCaseSensitive.value, 5000, searchRegex.value)
  if (job instanceof Promise) job.catch(() => {})
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
  panelTab.value = 'preview'
}

/** Scroll to and preview a node located by an offset/line/path triple. */
function openPathResult(r: { offset: number; line: number; path: string }) {
  focusLine.value = r.line
  previewHit.value = { index: 0, line: r.line, column: 1, offset: r.offset, path: r.path, preview: '' }
  panelTab.value = 'preview'
}

/** Clicking a search result row both jumps the viewport and opens the node
 *  preview so its JSONPath is visible. */
function onSelectHit(index: number) {
  lf.gotoHit(index)
  const hit = lf.searchHits.value[index]
  if (hit) { previewHit.value = hit; panelTab.value = 'preview' }
}



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
  if (!resultsOpen.value || !hasPanelContent.value) return
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
