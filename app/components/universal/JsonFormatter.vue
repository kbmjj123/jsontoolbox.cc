<template>
  <div :class="fullscreen ? 'fixed inset-0 z-50 bg-white dark:bg-surface-900 p-4 flex flex-col' : ''">
    <!-- Input / Output resizable split -->
    <ResizablePanel :initial-ratio="0.5" responsive :class="fullscreen ? 'flex-1 min-h-0' : ''">
      <template #first>
        <div :class="fullscreen ? 'h-full pr-3' : 'pr-3'">
          <JsonInputEditor
            v-model="inputJson"
            :label="tool.ui?.label_input || 'Input JSON'"
            placeholder='{"name": "JSON Toolbox", "version": "1.0"}'
            :height="fullscreen ? 'h-full' : undefined"
            show-upload
            @clear="clearAll"
            @paste="onInputPaste"
          >
            <template #actions>
              <div v-if="hasExamples" class="relative">
                <button
                  @click="showExampleMenu = !showExampleMenu"
                  class="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400"
                >
                  {{ $t('system.example') }}
                </button>
                <div v-if="showExampleMenu" class="absolute left-0 top-full mt-1 bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-lg shadow-lg p-1 z-50 min-w-[140px]">
                  <button
                    v-for="ex in examples"
                    :key="ex.id"
                    @click="loadExampleById(ex.id); showExampleMenu = false"
                    class="w-full text-left px-3 py-1.5 text-xs hover:bg-surface-100 dark:hover:bg-surface-700 rounded"
                  >
                    {{ getExampleLabel(ex) }}
                  </button>
                </div>
              </div>
            </template>
          </JsonInputEditor>
        </div>
      </template>
      <template #second>
        <div :class="fullscreen ? 'h-full pl-3' : 'pl-3'">
          <JsonOutputPanel
            :label="tool.ui?.label_output || 'Output'"
            :content="outputJson"
            :error="error"
            :view-mode="viewMode"
            :height="fullscreen ? 'h-full' : undefined"
            show-mode-toggle
            :parsed-data="parsedData"
            :empty-text="$t('system.emptyOutput')"
            @update:view-mode="viewMode = $event"
            @copy="copyOutput"
            @download="downloadOutput"
            @copy-path="copyPath"
          >
            <template #actions>
              <button
                @click="fullscreen = !fullscreen"
                class="text-surface-400 hover:text-surface-600 dark:text-surface-500 dark:hover:text-surface-300"
                :title="fullscreen ? 'Exit fullscreen' : 'Fullscreen'"
              >
                <Icon :name="fullscreen ? 'lucide:minimize' : 'lucide:maximize'" class="w-4 h-4" />
              </button>
            </template>
          </JsonOutputPanel>
        </div>
      </template>
    </ResizablePanel>

    <!-- Bottom controls (hidden in fullscreen) -->
    <div v-if="!fullscreen">
    <!-- Load from URL -->
    <div class="mt-3">
      <button
        v-if="!showUrlInput"
        @click="showUrlInput = true"
        class="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400"
      >
        {{ $t('system.loadUrl') }}
      </button>
      <div v-else class="flex items-center gap-2">
        <input
          v-model="urlToFetch"
          type="url"
          placeholder="https://api.example.com/data.json"
          class="flex-1 rounded-lg border border-surface-200 bg-white px-3 py-1.5 text-xs dark:border-surface-700 dark:bg-surface-800 dark:text-surface-100"
          @keydown.enter="fetchFromUrl"
        />
        <button
          @click="fetchFromUrl"
          :disabled="urlLoading"
          class="rounded-lg bg-primary-600 px-3 py-1.5 text-xs text-white hover:bg-primary-700 disabled:opacity-50"
        >
          {{ urlLoading ? '...' : $t('system.fetch') }}
        </button>
        <button
          @click="showUrlInput = false; urlError = ''"
          class="text-xs text-surface-500 hover:text-surface-700 dark:text-surface-400"
        >
          {{ $t('system.close') }}
        </button>
      </div>
      <p v-if="urlError" class="mt-1 text-xs text-red-600 dark:text-red-400">{{ urlError }}</p>
    </div>

    <!-- Bottom action bar -->
    <div class="mt-3 flex items-center flex-wrap gap-2">
      <!-- Indent selector -->
      <div class="flex items-center gap-2">
        <label class="text-xs font-bold text-surface-600 dark:text-surface-400">{{ tool.ui?.option_indent || 'Indent:' }}</label>
        <select v-model="indent" class="rounded-lg border border-surface-200 bg-white px-2 py-1 text-xs dark:border-surface-700 dark:bg-surface-800">
          <option :value="1">1 space</option>
          <option :value="2">{{ tool.ui?.option_2_spaces || '2 spaces' }}</option>
          <option :value="3">3 spaces</option>
          <option :value="4">{{ tool.ui?.option_4_spaces || '4 spaces' }}</option>
          <option :value="6">6 spaces</option>
          <option :value="8">8 spaces</option>
          <option value="tab">Tab</option>
          <option :value="0">{{ tool.ui?.option_minified || 'Minified' }}</option>
        </select>
      </div>

      <button @click="formatJson" class="btn-primary px-4 py-2 text-xs">
        {{ $t('system.format') }}
      </button>
      <button @click="minifyJson" class="rounded-xl border border-surface-200 bg-white px-4 py-2 text-xs font-bold text-surface-700 hover:bg-surface-50 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-300">
        {{ $t('system.minify') }}
      </button>
      <button @click="validateJson" class="rounded-xl border border-surface-200 bg-white px-4 py-2 text-xs font-bold text-surface-700 hover:bg-surface-50 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-300">
        {{ $t('system.validate') }}
      </button>
      <button @click="fixJson" class="rounded-xl border border-surface-200 bg-white px-4 py-2 text-xs font-bold text-surface-700 hover:bg-surface-50 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-300">
        {{ $t('system.fix') }}
      </button>

      <!-- Share button -->
      <div class="relative ml-auto">
        <button @click="showShareMenu = !showShareMenu" class="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400">
          {{ $t('system.share') }}
        </button>
        <div v-if="showShareMenu" class="absolute right-0 top-full mt-1 bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-lg shadow-lg p-2 z-50 min-w-[200px]">
          <button @click="copyShareLink" class="w-full text-left px-3 py-2 text-xs hover:bg-surface-100 dark:hover:bg-surface-700 rounded">
            {{ shareCopied ? '✓ Copied!' : 'Copy Share Link' }}
          </button>
          <button @click="shareToTwitter" class="w-full text-left px-3 py-2 text-xs hover:bg-surface-100 dark:hover:bg-surface-700 rounded">
            Share on Twitter
          </button>
          <p class="px-3 pt-1 pb-0.5 text-[10px] text-amber-600 dark:text-amber-400 leading-tight">
            ⚠️ Share links encode JSON content in the URL. Do not share passwords, tokens, or sensitive data.
          </p>
        </div>
      </div>

      <!-- Auto-format toggle -->
      <label class="flex items-center gap-1.5 ml-auto cursor-pointer select-none">
        <span class="text-xs text-surface-600 dark:text-surface-400">{{ $t('system.autoFormat') }}</span>
        <button
          @click="autoFormat = !autoFormat"
          :class="autoFormat ? 'bg-primary-600' : 'bg-surface-300 dark:bg-surface-600'"
          class="relative inline-flex h-5 w-9 items-center rounded-full transition-colors"
          role="switch"
          :aria-checked="autoFormat"
        >
          <span
            :class="autoFormat ? 'translate-x-4' : 'translate-x-0.5'"
            class="inline-block h-4 w-4 rounded-full bg-white transition-transform"
          />
        </button>
      </label>
    </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ tool: any }>()

const inputJson = ref('')
const outputJson = ref('')
const error = ref('')
const indent = ref<number | string>(2)
const autoFormat = ref(false)
const viewMode = ref<'text' | 'tree'>('text')
const fullscreen = ref(false)
const lastAction = ref<'formatted' | 'minified' | 'validated'>('formatted')
const showUrlInput = ref(false)
const urlToFetch = ref('')
const urlLoading = ref(false)
const urlError = ref('')

const showShareMenu = ref(false)
const shareCopied = ref(false)

const { fixJson: fixJsonAuto, getJsonError } = useJsonFixer()
const { generateShareUrl, copyShareUrl, shareToSocial } = useShareJson()
const { examples, hasExamples, getLabel: getExampleLabel, loadById } = useToolExample('json-formatter')

const showExampleMenu = ref(false)

const loadDefaultExample = () => {
  const ex = examples.value[0]
  if (ex) {
    inputJson.value = ex.input
    nextTick(() => formatJson())
  }
}

const loadExampleById = (id: string) => {
  loadById(id, inputJson)
  nextTick(() => formatJson())
}

const fetchFromUrl = async () => {
  const url = urlToFetch.value.trim()
  if (!url) return

  urlLoading.value = true
  urlError.value = ''
  try {
    const res = await fetch(url)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const text = await res.text()
    JSON.parse(text)
    inputJson.value = text
    showUrlInput.value = false
    urlToFetch.value = ''
  } catch (e) {
    urlError.value = (e as Error).message
  } finally {
    urlLoading.value = false
  }
}

const parsedData = computed(() => {
  try {
    return JSON.parse(inputJson.value)
  } catch {
    return null
  }
})

const copyPath = async (path: string) => {
  try {
    await navigator.clipboard.writeText(path)
  } catch {}
}

const formatJson = () => {
  if (!inputJson.value.trim()) { error.value = ''; outputJson.value = ''; return }
  try {
    const parsed = JSON.parse(inputJson.value)
    const space = indent.value === 'tab' ? '\t' : Number(indent.value)
    outputJson.value = JSON.stringify(parsed, null, space)
    lastAction.value = 'formatted'
    error.value = ''
  } catch {
    const err = getJsonError(inputJson.value)
    error.value = err ? `Line ${err.line}, Column ${err.column}: ${err.message}` : 'Invalid JSON'
  }
}

const minifyJson = () => {
  if (!inputJson.value.trim()) { error.value = ''; outputJson.value = ''; return }
  try {
    const parsed = JSON.parse(inputJson.value)
    outputJson.value = JSON.stringify(parsed)
    lastAction.value = 'minified'
    error.value = ''
  } catch {
    const err = getJsonError(inputJson.value)
    error.value = err ? `Line ${err.line}, Column ${err.column}: ${err.message}` : 'Invalid JSON'
  }
}

const validateJson = () => {
  if (!inputJson.value.trim()) { error.value = ''; outputJson.value = ''; return }
  try {
    JSON.parse(inputJson.value)
    outputJson.value = '✅ Valid JSON'
    lastAction.value = 'validated'
    error.value = ''
  } catch {
    const err = getJsonError(inputJson.value)
    error.value = err ? `Line ${err.line}, Column ${err.column}: ${err.message}` : 'Invalid JSON'
    outputJson.value = ''
  }
}

const fixJson = () => {
  const { fixed, fixes } = fixJsonAuto(inputJson.value)

  if (fixed) {
    inputJson.value = fixed
    outputJson.value = `✅ Fixed ${fixes.length} issue(s):\n${fixes.map(f => `• ${f}`).join('\n')}`
    error.value = ''
    nextTick(() => formatJson())
  } else {
    error.value = 'Unable to auto-fix JSON. Please check the syntax.'
  }
}

const clearAll = () => {
  outputJson.value = ''
  error.value = ''
}

const onInputPaste = () => {
  if (autoFormat.value) {
    nextTick(() => formatJson())
  }
}

const debouncedFormat = useDebounceFn(() => { formatJson() }, 300)
watch(inputJson, () => { if (autoFormat.value) debouncedFormat() })

useEventListener('keydown', (e: KeyboardEvent) => {
  if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
    e.preventDefault()
    formatJson()
  }
  if (e.key === 'Escape' && fullscreen.value) {
    fullscreen.value = false
  }
})

const copyOutput = async () => {
  try {
    await navigator.clipboard.writeText(outputJson.value)
  } catch (e) {
    console.error('Failed to copy:', e)
  }
}

const downloadOutput = () => {
  const blob = new Blob([outputJson.value], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${lastAction.value}.json`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

const copyShareLink = async () => {
  if (!outputJson.value) return

  const url = generateShareUrl(outputJson.value)
  const success = await copyShareUrl(url)
  shareCopied.value = success

  setTimeout(() => {
    shareCopied.value = false
    showShareMenu.value = false
  }, 2000)
}

const shareToTwitter = () => {
  if (!outputJson.value) return

  const url = generateShareUrl(outputJson.value)
  shareToSocial(url, 'Check out this formatted JSON', 'twitter')
  showShareMenu.value = false
}

const handleClickOutside = (e: MouseEvent) => {
  const target = e.target as HTMLElement
  if (!target.closest('.relative')) {
    showShareMenu.value = false
    showExampleMenu.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  loadDefaultExample()
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>
