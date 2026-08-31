<template>
  <ResizablePanel v-model:fullscreen="fullscreen" :initial-ratio="0.5" responsive>
    <template #first>
      <div class="h-full pr-3 overflow-hidden">
        <JsonInputEditor
          ref="inputEditorRef"
          v-model="inputJson"
          :label="tool.ui?.label_input || 'Input JSON'"
          placeholder='{"name": "JSON Toolbox", "version": "1.0"}'
          show-upload
          show-load-url
          example-slug="json-to-pdf"
          @clear="clearAll"
          @paste="onPaste"
          @example-loaded="onExampleLoaded"
        />
      </div>
    </template>

    <template #second>
      <div class="h-full pl-3 flex flex-col overflow-hidden">
        <!-- Header bar -->
        <div class="flex items-center justify-between mb-2 gap-3 shrink-0">
          <label class="text-sm font-bold text-surface-700 dark:text-surface-300">{{ tool.ui?.label_preview || 'Preview' }}</label>
          <div v-if="formattedJson" class="flex items-center gap-2">
            <button @click="copyOutput" class="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400">
              {{ $t('system.copy') }}
            </button>
            <button @click="downloadTxt" class="text-xs text-surface-500 hover:text-surface-700 dark:text-surface-400">
              {{ $t('system.download') }}
            </button>
          </div>
        </div>

        <!-- PDF paper preview -->
        <div class="flex-1 min-h-0 overflow-auto bg-surface-200 dark:bg-surface-900 rounded-xl p-4">
          <div v-if="!formattedJson && !error" class="flex h-full items-center justify-center text-surface-400 dark:text-surface-500 text-sm">
            {{ tool.ui?.placeholder_preview || 'Preview will appear here...' }}
          </div>
          <div v-else-if="error" class="flex h-full items-center justify-center">
            <div class="text-center">
              <span class="i-lucide-alert-circle w-8 h-8 text-red-400 dark:text-red-500 mx-auto block mb-2" />
              <p class="text-sm text-red-600 dark:text-red-400">{{ error }}</p>
            </div>
          </div>
          <div v-else class="flex flex-col items-center gap-6">
            <div
              v-for="(page, pi) in pages"
              :key="pi"
              class="paper-page relative bg-white dark:bg-white shadow-lg overflow-hidden"
              :style="paperStyle"
            >
              <!-- Page content area -->
              <div class="absolute inset-0 overflow-hidden" :style="marginStyle">
                <!-- Title on first page -->
                <div
                  v-if="pi === 0"
                  :style="{ fontSize: (fontSize + 4) + 'pt', fontWeight: 'bold', marginBottom: '3mm', fontFamily: 'ui-monospace, Menlo, Consolas, monospace' }"
                >JSON Output</div>
                <pre
                  class="m-0 whitespace-pre-wrap break-all"
                  :style="{ fontSize: fontSize + 'pt', lineHeight: '1.5', fontFamily: 'ui-monospace, Menlo, Consolas, monospace', color: '#000', margin: 0 }"
                >{{ page }}</pre>
              </div>
              <!-- Page number -->
              <div class="absolute bottom-1 right-3 text-[8pt] text-surface-400 font-mono">
                {{ pi + 1 }} / {{ pages.length }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <template #toolbar-left>
      <button @click="format" class="btn-primary px-5 py-2 text-xs">
        <Icon name="lucide:eye" class="h-4 w-4 mr-1.5" />
        {{ tool.ui?.btn_preview || 'Preview' }}
      </button>
      <button @click="downloadPdf" :disabled="!formattedJson" class="rounded-xl border border-surface-200 bg-white px-4 py-2 text-xs font-bold text-surface-700 hover:bg-surface-50 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-300 dark:hover:bg-surface-700 disabled:opacity-50">
        <Icon name="lucide:download" class="h-4 w-4 mr-1.5" />
        {{ tool.ui?.btn_download_pdf || 'PDF' }}
      </button>
      <button @click="downloadTxt" :disabled="!formattedJson" class="rounded-xl border border-surface-200 bg-white px-4 py-2 text-xs font-bold text-surface-700 hover:bg-surface-50 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-300 dark:hover:bg-surface-700 disabled:opacity-50">
        <Icon name="lucide:file-text" class="h-4 w-4 mr-1.5" />
        {{ tool.ui?.btn_download_txt || 'TXT' }}
      </button>

      <div class="flex items-center gap-2">
        <label class="text-xs font-bold text-surface-600 dark:text-surface-400">{{ tool.ui?.option_font_size || 'Font:' }}</label>
        <select v-model="fontSize" class="rounded-lg border border-surface-200 bg-white px-2 py-1 text-xs dark:border-surface-700 dark:bg-surface-800">
          <option :value="8">8pt</option>
          <option :value="10">10pt</option>
          <option :value="12">12pt</option>
          <option :value="14">14pt</option>
        </select>
      </div>
      <div class="flex items-center gap-2">
        <label class="text-xs font-bold text-surface-600 dark:text-surface-400">{{ tool.ui?.option_orientation || 'Orient:' }}</label>
        <select v-model="orientation" class="rounded-lg border border-surface-200 bg-white px-2 py-1 text-xs dark:border-surface-700 dark:bg-surface-800">
          <option value="portrait">{{ tool.ui?.option_portrait || 'Portrait' }}</option>
          <option value="landscape">{{ tool.ui?.option_landscape || 'Landscape' }}</option>
        </select>
      </div>
    </template>
  </ResizablePanel>
</template>

<script setup lang="ts">
import { jsPDF } from 'jspdf'
import html2canvas from 'html2canvas'

const props = defineProps<{ tool: any }>()
const { t } = useI18n()
const toast = useToast()

const inputJson = ref('')
const formattedJson = ref('')
const error = ref('')
const fontSize = ref(10)
const orientation = ref<'portrait' | 'landscape'>('portrait')
const fullscreen = ref(false)

const inputEditorRef = ref<InstanceType<typeof import('~/components/tool/JsonInputEditor.vue').default>>()

// ── Paper dimensions (mm) ──
const PAGE_W_MM = computed(() => orientation.value === 'landscape' ? 297 : 210)
const PAGE_H_MM = computed(() => orientation.value === 'landscape' ? 210 : 297)
const MARGIN_MM = 14

// ── Preview scale: 1mm ≈ 3.78px at 96dpi, then scale down to fit ──
const SCALE = 0.75
const MM_TO_PX = 3.78

const paperStyle = computed(() => ({
  width: (PAGE_W_MM.value * MM_TO_PX * SCALE) + 'px',
  height: (PAGE_H_MM.value * MM_TO_PX * SCALE) + 'px',
}))

const marginStyle = computed(() => ({
  top: (MARGIN_MM * MM_TO_PX * SCALE) + 'px',
  left: (MARGIN_MM * MM_TO_PX * SCALE) + 'px',
  right: (MARGIN_MM * MM_TO_PX * SCALE) + 'px',
  bottom: ((MARGIN_MM + 4) * MM_TO_PX * SCALE) + 'px', // extra for page number
  position: 'absolute' as const,
}))

// ── Pagination: split text into pages ──
const pages = computed(() => {
  if (!formattedJson.value) return []
  const text = formattedJson.value
  const lines = text.split('\n')

  // Calculate how many lines fit per page
  // Content area height in mm (minus margins and page number)
  const contentH_mm = PAGE_H_MM.value - MARGIN_MM * 2 - 6
  // Each line height: fontSize * lineHeight(1.5) in mm (1pt = 0.353mm)
  const lineH_mm = fontSize.value * 1.5 * 0.353
  const firstPageLines = Math.floor((contentH_mm - 10) / lineH_mm) // 10mm for title
  const normalPageLines = Math.floor(contentH_mm / lineH_mm)

  const result: string[] = []
  let i = 0
  while (i < lines.length) {
    const max = result.length === 0 ? firstPageLines : normalPageLines
    result.push(lines.slice(i, i + max).join('\n'))
    i += max
  }
  return result
})

// ── Auto-format & preview ──
const formatInputInPlace = () => {
  if (!inputJson.value.trim()) return
  try {
    const parsed = JSON.parse(inputJson.value)
    inputJson.value = JSON.stringify(parsed, null, 2)
  } catch {}
}
const debouncedFormatInPlace = useDebounceFn(() => { formatInputInPlace() }, 1500)
const debouncedFormat = useDebounceFn(() => { format(true) }, 300)

watch(inputJson, () => {
  debouncedFormat()
  debouncedFormatInPlace()
})

const onExampleLoaded = () => { nextTick(() => format()) }
const onPaste = () => { nextTick(() => { formatInputInPlace(); format() }) }

const format = (silent = false) => {
  error.value = ''
  if (!inputJson.value.trim()) { formattedJson.value = ''; return }
  try {
    formattedJson.value = JSON.stringify(JSON.parse(inputJson.value), null, 2)
    if (!silent) toast.success(t('toast.formatted'))
  }
  catch (e) { error.value = (e as Error).message; formattedJson.value = ''; if (!silent) toast.error((e as Error).message) }
}

const copyOutput = async () => { await copyToClipboard(formattedJson.value) }

// ── PDF export: html2canvas → image → jsPDF (reliable CJK support) ──
const downloadPdf = async () => {
  if (!formattedJson.value) return

  const isLandscape = orientation.value === 'landscape'
  const doc = new jsPDF({ orientation: orientation.value, unit: 'mm', format: 'a4' })

  // Build each page as an HTML element, render to canvas, add to PDF
  for (let pi = 0; pi < pages.value.length; pi++) {
    if (pi > 0) doc.addPage()

    // Create a visible container (clipped by overflow:hidden on parent)
    const wrapper = document.createElement('div')
    wrapper.style.cssText = 'position:fixed;left:0;top:0;overflow:hidden;width:1px;height:1px;opacity:0.01;pointer-events:none;'

    const container = document.createElement('div')
    const contentPx = Math.round((PAGE_W_MM.value - MARGIN_MM * 2) * MM_TO_PX)
    container.style.cssText = [
      `width:${contentPx}px`,
      `padding:${Math.round(MARGIN_MM * MM_TO_PX)}px`,
      `font-size:${fontSize.value}pt`,
      'font-family:ui-monospace,Menlo,Consolas,monospace',
      'white-space:pre-wrap', 'word-break:break-all',
      'line-height:1.5', 'color:#000', 'background:#fff',
      'box-sizing:border-box',
    ].join(';')

    // Title on first page
    if (pi === 0) {
      const title = document.createElement('div')
      title.style.cssText = `font-size:${fontSize.value + 4}pt;font-weight:bold;margin-bottom:8mm;font-family:ui-monospace,Menlo,Consolas,monospace;`
      title.textContent = 'JSON Output'
      container.appendChild(title)
    }

    const pre = document.createElement('pre')
    pre.style.cssText = `margin:0;font-size:${fontSize.value}pt;line-height:1.5;font-family:ui-monospace,Menlo,Consolas,monospace;white-space:pre-wrap;word-break:break-all;color:#000;`
    pre.textContent = pages.value[pi]
    container.appendChild(pre)

    wrapper.appendChild(container)
    document.body.appendChild(wrapper)

    try {
      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      })

      const imgData = canvas.toDataURL('image/png')
      const pageContentW = PAGE_W_MM.value - MARGIN_MM * 2
      // Use actual canvas aspect ratio to avoid stretching on the last page
      const imgH = pageContentW * (canvas.height / canvas.width)
      doc.addImage(imgData, 'PNG', MARGIN_MM, MARGIN_MM, pageContentW, imgH)
    } finally {
      document.body.removeChild(wrapper)
    }
  }

  doc.save('json-output.pdf')
}

const downloadTxt = () => {
  const blob = new Blob([formattedJson.value], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url; link.download = 'json-output.txt'
  document.body.appendChild(link); link.click(); document.body.removeChild(link); URL.revokeObjectURL(url)
}

const clearAll = () => { formattedJson.value = ''; error.value = '' }
</script>
