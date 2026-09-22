<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useLargeFile, useLargeFileHandoff, type ExportOptions } from '~/composables/useLargeFile'
import type { ArrayMode } from '~/workers/recordStream.worker'

const lf = useLargeFile()
const handoff = useLargeFileHandoff()

const formatChoice = ref<'auto' | 'json' | 'ndjson'>('auto')
const dragOver = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)

const delimiter = ref(',')
const includeHeader = ref(true)
const bom = ref(true)
const arrayMode = ref<ArrayMode>('json')

const isScanning = computed(() => lf.status.value === 'scanning')
const isReady = computed(() => lf.status.value === 'ready')
const isInvalid = computed(() => lf.status.value === 'invalid')
const isExporting = computed(() => lf.status.value === 'exporting')
const isSearching = computed(() => lf.status.value === 'searching')

const collectionLabel = (path: string) => {
  if (!path) return formatChoiceForScan.value === 'ndjson' || lf.scan.value?.format === 'ndjson' ? 'Records (one per line)' : 'Root array'
  return path
}

const formatChoiceForScan = computed(() => lf.format.value)

const recordCount = computed(() => lf.scan.value?.recordCount ?? 0)
const exportPercent = computed(() => {
  const total = recordCount.value || 1
  return Math.min(100, Math.round((lf.exportTotal.value / total) * 100))
})

async function onFilePicked(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) await pickFile(file)
}

async function pickFile(file: File) {
  const fmt = formatChoice.value === 'auto' ? undefined : (formatChoice.value as 'json' | 'ndjson')
  await lf.loadFile(file, fmt)
}

async function onDrop(e: DragEvent) {
  dragOver.value = false
  const file = e.dataTransfer?.files?.[0]
  if (file) await pickFile(file)
}

function selectAll() {
  lf.selectedColumns.value = lf.fields.value.map(f => f.path)
}
function selectNone() {
  lf.selectedColumns.value = []
}
function toggleCol(path: string) {
  const i = lf.selectedColumns.value.indexOf(path)
  if (i >= 0) lf.selectedColumns.value.splice(i, 1)
  else lf.selectedColumns.value.push(path)
}

const previewRows = computed(() => parseCsvPreview(lf.previewCsv.value))
const previewHeaders = computed(() => previewRows.value[0] ?? [])

function parseCsvPreview(text: string): string[][] {
  if (!text) return []
  const lines = text.split(/\r\n|\n/).filter(l => l.length > 0).slice(0, 51)
  return lines.map(parseCsvLine)
}

function parseCsvLine(line: string): string[] {
  const out: string[] = []
  let cur = ''
  let inQ = false
  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (inQ) {
      if (c === '"') {
        if (line[i + 1] === '"') { cur += '"'; i++ }
        else inQ = false
      } else cur += c
    } else if (c === '"') inQ = true
    else if (c === delimiter.value) { out.push(cur); cur = '' }
    else cur += c
  }
  out.push(cur)
  return out
}

async function doPreview() {
  if (!lf.selectedColumns.value.length) return
  await lf.runPreview(buildOptions())
}
async function doExport() {
  if (!lf.selectedColumns.value.length) return
  await lf.startExport(buildOptions())
}
function buildOptions(): ExportOptions {
  return {
    columns: lf.selectedColumns.value,
    delimiter: delimiter.value,
    includeHeader: includeHeader.value,
    bom: bom.value,
    arrayMode: arrayMode.value,
  }
}

async function doSearch() {
  if (!lf.searchQuery.value.trim()) { lf.searchHits.value = []; return }
  await lf.search(lf.searchQuery.value, lf.searchMode.value)
}

function chooseAnother() {
  lf.reset()
  if (fileInput.value) fileInput.value.value = ''
}

watch(() => lf.scan.value, async (s) => {
  if (s?.ok) await lf.fetchFields()
}, { immediate: false })

watch(() => lf.selectedCollection.value, async (p) => {
  void p
  if (lf.scan.value?.ok) await lf.fetchFields()
})

onMounted(async () => {
  const h = handoff.value
  if (h && (h.file || h.text)) {
    if (h.file) await lf.loadFile(h.file, h.format)
    else if (h.text) await lf.loadText(h.text, h.format || 'json', h.fileName)
    handoff.value = {}
  }
})
</script>

<template>
  <div class="mx-auto w-full max-w-5xl">
    <!-- ── Dropzone ───────────────────────────────────── -->
    <div
      v-if="lf.status.value === 'idle' || lf.status.value === 'error'"
      class="rounded-xl border border-border bg-surface-200/40 p-8"
    >
      <div
        class="flex flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed border-border p-10 text-center transition"
        :class="{ 'border-primary bg-primary/5': dragOver }"
        @dragover.prevent="dragOver = true"
        @dragleave.prevent="dragOver = false"
        @drop.prevent="onDrop"
      >
        <div class="text-3xl">📂</div>
        <div class="text-lg font-semibold">Upload a JSON or NDJSON file</div>
        <p class="max-w-md text-sm text-muted">
          Files are processed entirely in your browser. Nothing is uploaded to a server.
          Optimized for files up to 20&nbsp;MB; larger files are supported locally.
        </p>
        <input
          ref="fileInput"
          type="file"
          accept=".json,.ndjson,.jsonl,.jsonlines,application/json"
          class="hidden"
          @change="onFilePicked"
        >
        <button class="btn btn-primary" @click="fileInput?.click()">Choose file</button>
        <div class="mt-2 flex items-center gap-3 text-sm text-muted">
          <span>Format:</span>
          <label class="flex items-center gap-1"><input v-model="formatChoice" type="radio" value="auto"> Auto</label>
          <label class="flex items-center gap-1"><input v-model="formatChoice" type="radio" value="json"> JSON</label>
          <label class="flex items-center gap-1"><input v-model="formatChoice" type="radio" value="ndjson"> NDJSON</label>
        </div>
        <p v-if="lf.errorMsg.value" class="text-sm text-red-500">{{ lf.errorMsg.value }}</p>
      </div>
    </div>

    <!-- ── Scanning ──────────────────────────────────── -->
    <div v-else-if="isScanning" class="rounded-xl border border-border bg-surface-200/40 p-10 text-center">
      <div class="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      <p class="text-muted">Scanning {{ lf.fileName.value }} ({{ (lf.fileSize.value / 1048576).toFixed(1) }} MB)…</p>
    </div>

    <!-- ── Invalid ───────────────────────────────────── -->
    <div v-else-if="isInvalid" class="rounded-xl border border-red-300 bg-red-50 p-6">
      <h3 class="mb-2 font-semibold text-red-700">Invalid {{ lf.scan.value?.format === 'ndjson' ? 'NDJSON' : 'JSON' }}</h3>
      <p class="text-sm text-red-700">{{ lf.scanError.value?.message }}</p>
      <pre
        v-if="lf.scanError.value?.snippet"
        class="mt-2 overflow-x-auto rounded bg-white p-2 text-xs"
      >{{ (lf.scanError.value?.line ? `line ${lf.scanError.value.line}` + (lf.scanError.value.column ? `:${lf.scanError.value.column}` : '') + '\n' : '') + (lf.scanError.value?.snippet || '') }}</pre>
      <button class="btn btn-outline mt-4" @click="chooseAnother">Choose another file</button>
    </div>

    <!-- ── Ready / workflow ──────────────────────────── -->
    <div v-else-if="isReady" class="space-y-6">
      <!-- meta bar -->
      <div class="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg border border-border bg-surface-200/40 px-4 py-3 text-sm">
        <span class="font-medium">{{ lf.fileName.value }}</span>
        <span class="text-muted">{{ (lf.fileSize.value / 1048576).toFixed(1) }} MB</span>
        <span class="rounded bg-primary/10 px-2 py-0.5 text-xs text-primary">{{ lf.scan.value?.format === 'ndjson' ? 'NDJSON' : 'JSON' }}</span>
        <span class="text-muted">root: {{ lf.scan.value?.rootType }}</span>
        <span class="text-muted">{{ lf.scan.value?.recordCount.toLocaleString() }} records</span>
        <button class="ml-auto text-xs text-muted underline" @click="chooseAnother">Change file</button>
      </div>

      <!-- collection picker -->
      <section class="rounded-xl border border-border p-5">
        <h3 class="mb-3 font-semibold">Record collection</h3>
        <p class="mb-3 text-sm text-muted">Pick the array of records (or NDJSON lines) to export as rows.</p>
        <div class="space-y-2">
          <label
            v-for="c in lf.scan.value?.candidates"
            :key="c.path"
            class="flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition"
            :class="lf.selectedCollection.value === c.path ? 'border-primary bg-primary/5' : 'border-border'"
          >
            <input v-model="lf.selectedCollection.value" type="radio" :value="c.path" class="mt-1">
            <div class="min-w-0">
              <div class="font-mono text-sm">{{ collectionLabel(c.path) }}</div>
              <div class="text-xs text-muted">{{ c.count.toLocaleString() }} records</div>
              <div v-if="c.sampleKeys.length" class="mt-1 flex flex-wrap gap-1">
                <span
                  v-for="k in c.sampleKeys.slice(0, 10)"
                  :key="k"
                  class="rounded bg-surface-200 px-1.5 py-0.5 text-[11px]"
                >{{ k }}</span>
              </div>
            </div>
          </label>
        </div>
      </section>

      <!-- fields / columns -->
      <section class="rounded-xl border border-border p-5">
        <div class="mb-3 flex items-center justify-between">
          <h3 class="font-semibold">Columns ({{ lf.selectedColumns.value.length }} / {{ lf.fields.value.length }})</h3>
          <div class="flex gap-2 text-xs">
            <button class="text-primary underline" @click="selectAll">All</button>
            <button class="text-muted underline" @click="selectNone">None</button>
          </div>
        </div>
        <p class="mb-3 text-sm text-muted">
          Fields are sampled from the first 200 records. Later records may contain additional fields.
        </p>
        <div class="max-h-72 overflow-auto rounded-lg border border-border">
          <table class="w-full text-left text-sm">
            <thead class="sticky top-0 bg-surface-200 text-xs text-muted">
              <tr>
                <th class="w-8 px-2 py-1.5"></th>
                <th class="px-2 py-1.5">Field</th>
                <th class="px-2 py-1.5">Type</th>
                <th class="px-2 py-1.5">Present</th>
                <th class="px-2 py-1.5">Example</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="f in lf.fields.value"
                :key="f.path"
                class="border-t border-border"
                :class="lf.selectedColumns.value.includes(f.path) ? 'bg-primary/5' : ''"
              >
                <td class="px-2 py-1.5">
                  <input
                    type="checkbox"
                    :checked="lf.selectedColumns.value.includes(f.path)"
                    @change="toggleCol(f.path)"
                  >
                </td>
                <td class="px-2 py-1.5 font-mono text-xs">{{ f.path }}</td>
                <td class="px-2 py-1.5">
                  <span class="rounded bg-surface-200 px-1.5 py-0.5 text-[11px]">{{ f.type }}{{ f.isArray ? '[]' : '' }}</span>
                </td>
                <td class="px-2 py-1.5 text-muted">{{ Math.round(f.presence * 100) }}%</td>
                <td class="max-w-[14rem] truncate px-2 py-1.5 font-mono text-xs text-muted">{{ f.example }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- options -->
        <div class="mt-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
          <label class="flex flex-col gap-1">
            <span class="text-xs text-muted">Delimiter</span>
            <select v-model="delimiter" class="rounded border border-border bg-surface-200 px-2 py-1">
              <option value=",">Comma ,</option>
              <option value=";">Semicolon ;</option>
              <option value="\t">Tab</option>
              <option value="|">Pipe |</option>
            </select>
          </label>
          <label class="flex flex-col gap-1">
            <span class="text-xs text-muted">Arrays</span>
            <select v-model="arrayMode" class="rounded border border-border bg-surface-200 px-2 py-1">
              <option value="json">As JSON</option>
              <option value="first">First item</option>
              <option value="skip">Skip</option>
            </select>
          </label>
          <label class="flex items-end gap-2 pb-1">
            <input v-model="includeHeader" type="checkbox"> <span class="text-xs text-muted">Header row</span>
          </label>
          <label class="flex items-end gap-2 pb-1">
            <input v-model="bom" type="checkbox"> <span class="text-xs text-muted">UTF-8 BOM</span>
          </label>
        </div>
      </section>

      <!-- search -->
      <section class="rounded-xl border border-border p-5">
        <h3 class="mb-3 font-semibold">Search records</h3>
        <div class="flex gap-2">
          <input
            v-model="lf.searchQuery.value"
            type="text"
            placeholder="Search value…"
            class="flex-1 rounded border border-border bg-surface-200 px-3 py-2 text-sm"
            @keyup.enter="doSearch"
          >
          <select v-model="lf.searchMode.value" class="rounded border border-border bg-surface-200 px-2 py-2 text-sm">
            <option value="value">Value</option>
            <option value="key">Field name</option>
          </select>
          <button class="btn btn-outline" :disabled="isSearching" @click="doSearch">Search</button>
        </div>
        <p v-if="lf.searchTruncated.value" class="mt-2 text-xs text-amber-600">Showing first matches only; search stops early on very large files.</p>
        <div v-if="lf.searchHits.value.length" class="mt-3 space-y-1">
          <div
            v-for="h in lf.searchHits.value.slice(0, 50)"
            :key="h.recordIndex + h.path"
            class="rounded border border-border bg-surface-200/40 px-3 py-1.5 text-xs"
          >
            <span class="font-mono text-primary">#{{ h.recordIndex }}</span>
            <span class="font-mono text-muted"> · {{ h.path }}</span>
            <span class="ml-2">{{ h.preview }}</span>
          </div>
        </div>
      </section>

      <!-- actions -->
      <section class="flex flex-wrap items-center gap-3">
        <button class="btn btn-primary" :disabled="!lf.selectedColumns.value.length" @click="doPreview">Preview 50 rows</button>
        <button class="btn btn-primary" :disabled="!lf.selectedColumns.value.length" @click="doExport">Export CSV</button>
        <a class="text-xs text-muted underline" href="/tools/json-editor">Need to edit a smaller file? Open the JSON Editor</a>
      </section>

      <!-- preview -->
      <section v-if="previewRows.length" class="rounded-xl border border-border p-5">
        <h3 class="mb-3 font-semibold">Preview</h3>
        <div class="max-h-80 overflow-auto rounded-lg border border-border">
          <table class="w-full text-left text-xs">
            <thead class="sticky top-0 bg-surface-200 text-muted">
              <tr>
                <th v-for="(h, i) in previewHeaders" :key="i" class="px-2 py-1.5 font-mono">{{ h }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, ri) in previewRows.slice(1)" :key="ri" class="border-t border-border">
                <td v-for="(cell, ci) in row" :key="ci" class="max-w-[16rem] truncate px-2 py-1.5 font-mono">{{ cell }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <p class="text-center text-xs text-muted">
        Your file never leaves this browser. Validation, search, structure browsing and CSV export all run locally.
      </p>
    </div>

    <!-- ── Exporting ─────────────────────────────────── -->
    <div v-else-if="isExporting" class="rounded-xl border border-border bg-surface-200/40 p-10 text-center">
      <p class="mb-3 text-sm text-muted">
        Generating CSV… {{ lf.exportTotal.value.toLocaleString() }} / {{ recordCount.toLocaleString() }} rows
      </p>
      <div class="mx-auto h-2 w-64 overflow-hidden rounded-full bg-surface-200">
        <div class="h-full bg-primary transition-all" :style="{ width: exportPercent + '%' }" />
      </div>
      <button class="btn btn-outline mt-4" @click="lf.cancel()">Cancel</button>
    </div>
  </div>
</template>
