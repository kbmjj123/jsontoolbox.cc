<template>
  <ResizablePanel v-model:fullscreen="fullscreen" :initial-ratio="0.5" responsive>
    <template #first>
      <div class="h-full pr-3 overflow-hidden">
        <JsonInputEditor
          ref="inputEditorRef"
          v-model="inputText"
          :label="props.tool.ui?.label_input"
          :placeholder="props.tool.ui?.placeholder_input"
          :error="error"
          example-slug="json-escape"
          show-upload
          @clear="clearInput"
        />
      </div>
    </template>

    <template #second>
      <div class="h-full pl-3 flex flex-col overflow-hidden">
        <JsonOutputPanel
          :label="props.tool.ui?.label_output"
          :content="outputText"
          :error="error"
          view-mode="text"
          :show-view-toggle="false"
          :show-copy="false"
          :show-download="false"
          :empty-text="props.tool.ui?.placeholder_output"
        >
          <template #actions>
            <button
              v-if="outputText && !error"
              @click="copyOutput"
              class="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400"
            >
              {{ props.tool.ui?.btn_copy }}
            </button>
            <button
              v-if="outputText && !error"
              @click="downloadOutput"
              class="text-xs text-surface-500 hover:text-surface-700 dark:text-surface-400"
            >
              {{ props.tool.ui?.btn_download }}
            </button>
          </template>
        </JsonOutputPanel>
      </div>
    </template>

    <template #toolbar-left>
      <button @click="escapeText" class="btn-primary px-5 py-2 text-xs">
        <Icon name="lucide:lock" class="h-4 w-4 mr-1.5" />
        {{ props.tool.ui?.btn_escape }}
      </button>
      <button @click="unescapeText" class="rounded-xl border border-surface-200 bg-white px-4 py-2 text-xs font-bold text-surface-700 hover:bg-surface-50 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-300 dark:hover:bg-surface-700">
        <Icon name="lucide:lock-open" class="h-4 w-4 mr-1.5" />
        {{ props.tool.ui?.btn_unescape }}
      </button>
      <button @click="swap" :title="props.tool.ui?.btn_swap" class="rounded-xl border border-surface-200 bg-white p-2 text-xs font-bold text-surface-700 hover:bg-surface-50 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-300 dark:hover:bg-surface-700">
        <Icon name="lucide:arrow-left-right" class="h-4 w-4" />
      </button>
      <button @click="clearAll" class="rounded-xl border border-surface-200 bg-white px-4 py-2 text-xs font-bold text-surface-700 hover:bg-surface-50 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-300 dark:hover:bg-surface-700">
        {{ $t('system.clearAll') }}
      </button>

      <label class="flex items-center gap-1.5 cursor-pointer select-none">
        <input v-model="includeQuotes" type="checkbox" class="w-3.5 h-3.5 rounded border-surface-300 text-primary-600 focus:ring-primary-500" />
        <span class="text-xs text-surface-600 dark:text-surface-400">{{ props.tool.ui?.option_include_quotes }}</span>
      </label>
      <label class="flex items-center gap-1.5 cursor-pointer select-none">
        <input v-model="decodeOneLayer" type="checkbox" class="w-3.5 h-3.5 rounded border-surface-300 text-primary-600 focus:ring-primary-500" />
        <span class="text-xs text-surface-600 dark:text-surface-400">{{ props.tool.ui?.option_decode_layers }}</span>
      </label>

      <div v-if="statusLabel" class="stat-chip">
        <Icon name="lucide:info" class="h-3 w-3" />
        {{ statusLabel }}
      </div>
    </template>
  </ResizablePanel>
</template>

<script setup lang="ts">
const props = defineProps<{ tool: any }>()
const { t } = useI18n()
const toast = useToast()

/** Safety bound when "decode one layer" is turned off. */
const MAX_LAYERS = 10

const inputText = ref('')
const outputText = ref('')
const error = ref('')
const statusLabel = ref('')
const fullscreen = ref(false)
const inputEditorRef = ref()

/** Escape output mode: full JSON string literal vs. inner escaped content. */
const includeQuotes = ref(true)
/** Unescape depth: one layer (default) vs. repeat until no layer is left. */
const decodeOneLayer = ref(true)

/**
 * Decode one escaping layer.
 * Accepts both representations: a complete JSON string literal (with the
 * surrounding quotes) and bare escaped string content (without them).
 */
const decodeLayer = (text: string): unknown => {
  const trimmed = text.trim()
  if (trimmed.length >= 2 && trimmed.startsWith('"') && trimmed.endsWith('"')) {
    try {
      return JSON.parse(trimmed)
    } catch {
      // Not a valid literal (unbalanced quote, trailing text, ...) — retry as
      // escaped string content below.
    }
  }
  return JSON.parse(`"${text}"`)
}

const escapeText = () => {
  error.value = ''
  // JSON.stringify applies the full JSON escape set (\" \\ \n \r \t \b \f and
  // the mandatory control-character escapes) and never alters other Unicode
  // characters, unlike a hand-written replace() chain.
  const literal = JSON.stringify(inputText.value)
  outputText.value = includeQuotes.value ? literal : literal.slice(1, -1)
  statusLabel.value = props.tool.ui?.status_escaped
  toast.success(props.tool.ui?.status_escaped)
}

const unescapeText = () => {
  error.value = ''
  let current = inputText.value
  let layers = 0

  while (layers < MAX_LAYERS) {
    let decoded: unknown
    try {
      decoded = decodeLayer(current)
    } catch {
      break
    }
    if (typeof decoded !== 'string' || decoded === current) break
    current = decoded
    layers++
    if (decodeOneLayer.value) break
  }

  if (layers === 0) {
    outputText.value = ''
    error.value = props.tool.ui?.status_invalid
    statusLabel.value = props.tool.ui?.status_invalid
    toast.error(props.tool.ui?.status_invalid)
    return
  }

  outputText.value = current
  statusLabel.value = props.tool.ui?.status_unescaped
  toast.success(props.tool.ui?.status_unescaped)
}

const swap = () => {
  const temp = inputText.value
  inputText.value = outputText.value
  outputText.value = temp
}

const copyOutput = async () => {
  if (!outputText.value) return
  try {
    await navigator.clipboard.writeText(outputText.value)
    toast.success(t('toast.copied'))
  } catch {
    toast.error(props.tool.ui?.status_invalid)
  }
}

const downloadOutput = () => {
  if (!outputText.value) return
  downloadFile(outputText.value, 'output.txt', 'text/plain')
}

const clearInput = () => { outputText.value = ''; error.value = ''; statusLabel.value = '' }
const clearAll = () => {
  inputText.value = ''
  outputText.value = ''
  error.value = ''
  statusLabel.value = ''
}

onMounted(() => { inputEditorRef.value?.loadDefaultExample() })
</script>
