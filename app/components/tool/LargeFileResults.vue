<template>
  <div class="flex h-full flex-col">
    <!-- header -->
    <div class="flex items-center justify-between gap-2 border-b border-surface-200 px-3 py-2 dark:border-surface-700">
      <span class="text-sm font-medium text-surface-700 dark:text-surface-300">
        {{ t('largeViewer.results') }}
        <span class="text-surface-400 dark:text-surface-500">({{ hits.length }})</span>
      </span>

      <div class="relative flex items-center gap-1">
        <span v-if="truncated" class="text-xs text-amber-600 dark:text-amber-400">
          {{ t('largeViewer.resultsTruncated') }}
        </span>

        <button
          type="button"
          class="rounded-md border border-surface-200 px-2 py-1 text-xs text-surface-600 hover:bg-surface-100 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-300"
          @click="showExport = !showExport"
        >
          <Icon name="lucide:download" class="inline w-3.5 h-3.5" /> {{ t('largeViewer.export') }}
        </button>

        <div
          v-if="showExport"
          class="absolute right-0 top-full z-20 mt-1 w-56 rounded-lg border border-surface-200 bg-white p-1 shadow-lg dark:border-surface-700 dark:bg-surface-800"
        >
          <button class="export-item" @click="doExport('txt')">{{ t('largeViewer.exportTxt') }}</button>
          <button class="export-item" @click="doExport('json')">{{ t('largeViewer.exportJson') }}</button>
          <button class="export-item" @click="doExport('csv')">{{ t('largeViewer.exportCsv') }}</button>
          <div class="my-1 border-t border-surface-200 dark:border-surface-700" />
          <button class="export-item" @click="emit('exportRecords'); showExport = false">{{ t('largeViewer.exportRecordsCsv') }}</button>
          <p class="px-2 py-1 text-[11px] text-surface-400 dark:text-surface-500">{{ t('largeViewer.exportRecordsHint') }}</p>
        </div>
      </div>
    </div>

    <!-- list -->
    <div ref="listRef" class="min-h-0 flex-1 overflow-auto" @scroll.passive="onScroll">
      <div class="relative" :style="{ height: listHeight + 'px' }">
        <div
          v-for="row in visibleRows"
          :key="row.index"
          class="absolute left-0 right-0 flex cursor-pointer flex-col items-start gap-0.5 border-b border-surface-100 px-3 py-2 text-left hover:bg-surface-100 dark:border-surface-800 dark:hover:bg-surface-800"
          :class="row.index === currentIndex ? 'bg-primary-50/70 dark:bg-primary-900/30' : ''"
          :style="{ top: row.top + 'px', height: ROW_H + 'px' }"
          @click="emit('select', row.index)"
        >
          <div class="flex w-full items-center justify-between gap-2">
            <span class="truncate text-xs font-medium text-primary-600 dark:text-primary-400">
              #{{ row.index + 1 }}/{{ hits.length }} · L{{ row.hit.line }}:{{ row.hit.column }}
            </span>
            <div class="flex shrink-0 items-center gap-1" @click.stop>
              <code
                v-if="row.hit.path"
                class="max-w-[160px] truncate rounded bg-surface-100 px-1.5 py-0.5 font-mono text-[11px] text-surface-500 dark:bg-surface-800 dark:text-surface-400"
                :title="toJsonPath(row.hit.path)"
              >{{ toJsonPath(row.hit.path) }}</code>
              <button
                v-if="row.hit.path"
                type="button"
                class="rounded p-1 text-surface-400 hover:text-surface-700 dark:hover:text-surface-200"
                :title="t('largeViewer.copyPath')"
                @click.stop="copyPath(row.hit.path!)"
              >
                <Icon name="lucide:copy" class="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                class="rounded p-1 text-surface-400 hover:text-surface-700 dark:hover:text-surface-200"
                :title="t('largeViewer.copyMatch')"
                @click.stop="copyMatch(row.hit)"
              >
                <Icon name="lucide:clipboard-list" class="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                class="rounded p-1 text-surface-400 hover:text-surface-700 dark:hover:text-surface-200"
                :title="t('largeViewer.preview')"
                @click.stop="emit('preview', row.hit)"
              >
                <Icon name="lucide:eye" class="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
          <span
            v-if="row.segs"
            class="w-full truncate font-mono text-[12px] text-surface-600 dark:text-surface-400"
          ><span
            v-for="(s, si) in row.segs"
            :key="si"
            :class="s.match ? 'rounded bg-amber-200 text-surface-900 dark:bg-amber-700/70 dark:text-surface-50' : ''"
          >{{ s.text }}</span></span>
          <span v-else class="w-full truncate font-mono text-[12px] text-surface-600 dark:text-surface-400">{{ row.hit.preview }}</span>
        </div>
      </div>
      <p v-if="!hits.length" class="px-3 py-6 text-center text-sm text-surface-400 dark:text-surface-500">
        {{ t('largeViewer.noResults') }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { SearchTextHit } from '~/utils/textSearch'
import { toJsonPath } from '~/utils/textSearch'
import type { FileFormat } from '~/workers/recordStream.worker'

const props = defineProps<{
  hits: SearchTextHit[]
  currentIndex: number
  truncated: boolean
  text: string
  lineOffsets: Uint32Array | null
  query: string
  isRegex: boolean
  caseSensitive: boolean
  fileName: string
  format: FileFormat
}>()

const emit = defineEmits<{
  select: [index: number]
  exportRecords: []
  preview: [hit: SearchTextHit]
}>()

const { t } = useI18n()

const showExport = ref(false)

const ROW_H = 56
const listRef = ref<HTMLDivElement>()
const scrollTop = ref(0)

const listHeight = computed(() => props.hits.length * ROW_H)

const visibleRows = computed(() => {
  const vh = listRef.value?.clientHeight ?? 300
  const start = Math.max(0, Math.floor(scrollTop.value / ROW_H) - 4)
  const end = Math.min(props.hits.length - 1, Math.ceil((scrollTop.value + vh) / ROW_H) + 4)
  const out: { index: number; hit: SearchTextHit; top: number; segs: { text: string; match: boolean }[] | null }[] = []
  for (let i = start; i <= end; i++) {
    out.push({ index: i, hit: props.hits[i], top: i * ROW_H, segs: lineSegs(props.hits[i]) })
  }
  return out
})

/**
 * Build the matched line's text split into highlighted segments. We derive the
 * line from `text`/`lineOffsets`, then locate the exact match inside it using
 * `hit.offset` (the absolute match start) so the highlight lands on the right
 * substring even for regex queries.
 */
function lineSegs(hit: SearchTextHit): { text: string; match: boolean }[] | null {
  const offs = props.lineOffsets
  if (!offs || !props.query) return null
  const ls = offs[hit.line - 1] ?? 0
  const le = hit.line < offs.length ? offs[hit.line] : props.text.length
  let line = props.text.slice(ls, le).replace(/\r?\n$/, '')
  const local = hit.offset - ls
  if (local < 0 || local > line.length) return null
  let start = -1
  let end = -1
  if (props.isRegex) {
    try {
      const re = new RegExp(props.query, props.caseSensitive ? '' : 'i')
      let m: RegExpExecArray | null
      while ((m = re.exec(line))) {
        if (m.index === local) { start = m.index; end = m.index + m[0].length; break }
        if (m.index > local) break
        if (m.index === re.lastIndex) re.lastIndex++
      }
    } catch {
      /* leave unhighlighted if the pattern is somehow invalid here */
    }
  } else {
    const q = props.caseSensitive ? props.query : props.query.toLowerCase()
    const hay = props.caseSensitive ? line : line.toLowerCase()
    const idx = hay.indexOf(q, local)
    if (idx === local) { start = idx; end = idx + props.query.length }
  }
  if (start < 0) return null
  return [
    { text: line.slice(0, start), match: false },
    { text: line.slice(start, end), match: true },
    { text: line.slice(end), match: false },
  ]
}

function onScroll() {
  if (listRef.value) scrollTop.value = listRef.value.scrollTop
}

async function copyMatch(hit: SearchTextHit | null) {
  if (!hit || !props.lineOffsets) return
  const start = props.lineOffsets[hit.line - 1]
  const end = hit.line < props.lineOffsets.length ? props.lineOffsets[hit.line] : props.text.length
  let s = props.text.slice(start, end)
  if (s.endsWith('\n')) s = s.slice(0, -1)
  if (s.endsWith('\r')) s = s.slice(0, -1)
  try {
    await navigator.clipboard.writeText(s)
  } catch {
    /* clipboard may be unavailable; ignore */
  }
}

async function copyPath(path: string) {
  try {
    await navigator.clipboard.writeText(toJsonPath(path))
  } catch {
    /* clipboard may be unavailable; ignore */
  }
}

function csvEscape(v: string): string {
  if (/[",\n\r]/.test(v)) return `"${v.replace(/"/g, '""')}"`
  return v
}

function download(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function baseName(): string {
  return (props.fileName || 'large-json').replace(/\.(json|ndjson|jsonl|jsonlines)$/i, '')
}

function doExport(kind: 'txt' | 'json' | 'csv') {
  showExport.value = false
  if (!props.hits.length) return
  const base = baseName()
  if (kind === 'txt') {
    const content = props.hits
      .map(h => `#${h.index + 1} line ${h.line}, col ${h.column}\n${h.preview}`)
      .join('\n\n')
    download(`${base}-matches.txt`, content, 'text/plain;charset=utf-8')
  } else if (kind === 'json') {
    const content = JSON.stringify(
      props.hits.map(h => ({ line: h.line, column: h.column, offset: h.offset, path: h.path ?? null, preview: h.preview })),
      null,
      2,
    )
    download(`${base}-matches.json`, content, 'application/json;charset=utf-8')
  } else {
    const header = 'line,column,offset,path,preview'
    const rows = props.hits.map(h =>
      [h.line, h.column, h.offset, h.path ?? '', h.preview].map(v => csvEscape(String(v))).join(','),
    )
    download(`${base}-matches.csv`, `${header}\n${rows.join('\n')}`, 'text/csv;charset=utf-8')
  }
}
</script>

<style scoped>
.export-item {
  display: block;
  width: 100%;
  text-align: left;
  border-radius: 0.375rem;
  padding: 0.375rem 0.5rem;
  font-size: 0.75rem;
  color: rgb(71 85 105);
}
.export-item:hover {
  background-color: rgb(241 245 249);
}
.dark .export-item {
  color: rgb(148 163 184);
}
.dark .export-item:hover {
  background-color: rgb(30 41 59);
}
</style>
