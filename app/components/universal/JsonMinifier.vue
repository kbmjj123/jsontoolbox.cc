<template>
  <ResizablePanel v-model:fullscreen="fullscreen" :initial-ratio="0.5" responsive>
    <template #first>
      <div class="h-full pr-3 overflow-hidden">
        <JsonInputEditor
          ref="inputEditorRef"
          v-model="inputJson"
          :label="props.tool.ui?.label_input"
          :error="error"
          :friendly-message="friendlyError"
          placeholder='{"name": "JSON Toolbox", "version": "1.0"}'
          example-slug="json-minifier"
          show-upload
          @clear="clearInput"
        />
      </div>
    </template>

    <template #second>
      <div class="h-full pl-3 overflow-hidden flex flex-col">
        <JsonOutputPanel
          :label="props.tool.ui?.label_output"
          :content="outputJson"
          :error="error"
          :friendly-message="friendlyError"
          view-mode="text"
          :show-view-toggle="false"
          :show-copy="false"
          :show-download="false"
          :empty-text="props.tool.ui?.placeholder_output"
        >
          <template #actions>
            <button
              v-if="outputJson && !error"
              @click="copyOutput"
              class="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400"
            >
              {{ props.tool.ui?.btn_copy }}
            </button>
            <button
              v-if="outputJson && !error"
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
      <button @click="minifyJson" class="btn-primary px-5 py-2 text-xs">
        <Icon name="lucide:minimize" class="h-4 w-4 mr-1.5" />
        {{ props.tool.ui?.btn_minify }}
      </button>
      <button @click="beautifyInput" class="rounded-xl border border-surface-200 bg-white px-4 py-2 text-xs font-bold text-surface-700 hover:bg-surface-50 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-300 dark:hover:bg-surface-700">
        <Icon name="lucide:align-left" class="h-4 w-4 mr-1.5" />
        {{ props.tool.ui?.btn_beautify }}
      </button>
      <button @click="clearAll" class="rounded-xl border border-surface-200 bg-white px-4 py-2 text-xs font-bold text-surface-700 hover:bg-surface-50 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-300 dark:hover:bg-surface-700">
        {{ $t('system.clearAll') }}
      </button>

      <!-- Stats -->
      <template v-if="outputJson && !error">
        <div class="stat-chip">
          <Icon name="lucide:file-text" class="h-3 w-3" />
          {{ props.tool.ui?.label_original_size }}: {{ inputChars }} {{ props.tool.ui?.unit_chars }} · {{ inputBytes }} {{ props.tool.ui?.unit_bytes }}
        </div>
        <div class="stat-chip">
          <Icon name="lucide:minimize" class="h-3 w-3" />
          {{ props.tool.ui?.label_minified_size }}: {{ outputChars }} {{ props.tool.ui?.unit_chars }} · {{ outputBytes }} {{ props.tool.ui?.unit_bytes }}
        </div>
        <div class="stat-chip" :class="savedBytes > 0 ? 'text-green-600 dark:text-green-400' : ''">
          <Icon name="lucide:trending-down" class="h-3 w-3" />
          {{ props.tool.ui?.label_savings }}: {{ savedBytes }} {{ props.tool.ui?.unit_bytes }} {{ props.tool.ui?.unit_saved }} · {{ savedPercent }}% {{ props.tool.ui?.unit_smaller }}
        </div>
      </template>
    </template>
  </ResizablePanel>
</template>

<script setup lang="ts">
const props = defineProps<{ tool: any }>()
const { t } = useI18n()
const toast = useToast()

const inputJson = ref('')
const outputJson = ref('')
const error = ref('')
const friendlyError = ref('')
const fullscreen = ref(false)
const inputEditorRef = ref()

/**
 * UTF-8 byte count. TextEncoder is only guaranteed in the browser, so the
 * SSR pass returns 0 instead of touching an unavailable global.
 */
const utf8Length = (text: string): number => {
  if (!text || !import.meta.client || typeof TextEncoder === 'undefined') return 0
  return new TextEncoder().encode(text).length
}

const inputChars = computed(() => inputJson.value.length)
const outputChars = computed(() => outputJson.value.length)
const inputBytes = computed(() => utf8Length(inputJson.value))
const outputBytes = computed(() => utf8Length(outputJson.value))
const savedBytes = computed(() => (outputJson.value ? inputBytes.value - outputBytes.value : 0))
const savedPercent = computed(() => {
  if (!inputBytes.value || !outputJson.value) return 0
  return Math.round((1 - outputBytes.value / inputBytes.value) * 100)
})

const fail = (e: unknown) => {
  const raw = (e as Error)?.message ?? ''
  outputJson.value = ''
  error.value = raw
  friendlyError.value = e instanceof SyntaxError
    ? props.tool.ui?.error_invalid_json
    : props.tool.ui?.error_processing
  toast.error(friendlyError.value ?? raw)
}

const minifyJson = () => {
  error.value = ''
  friendlyError.value = ''
  if (!inputJson.value.trim()) {
    outputJson.value = ''
    error.value = props.tool.ui?.error_empty_input
    toast.error(props.tool.ui?.error_empty_input)
    return
  }
  try {
    // Whitespace-only changes must never touch string contents, so serialize
    // the parsed document instead of stripping spaces with a regex.
    const parsed = JSON.parse(inputJson.value)
    outputJson.value = JSON.stringify(parsed)
    toast.success(t('toast.minified'))
  } catch (e) {
    fail(e)
  }
}

const beautifyInput = () => {
  error.value = ''
  friendlyError.value = ''
  if (!inputJson.value.trim()) {
    error.value = props.tool.ui?.error_empty_input
    toast.error(props.tool.ui?.error_empty_input)
    return
  }
  try {
    const parsed = JSON.parse(inputJson.value)
    inputJson.value = JSON.stringify(parsed, null, 2)
    // The previous output described older input text; drop it so the size
    // comparison always refers to the current document.
    outputJson.value = ''
  } catch (e) {
    error.value = (e as Error).message
    friendlyError.value = props.tool.ui?.error_invalid_json
    toast.error(friendlyError.value ?? (e as Error).message)
  }
}

const copyOutput = async () => {
  if (!outputJson.value) return
  try {
    await navigator.clipboard.writeText(outputJson.value)
    toast.success(t('toast.copied'))
  } catch {
    toast.error(props.tool.ui?.error_processing)
  }
}

const downloadOutput = () => {
  if (!outputJson.value) return
  downloadFile(outputJson.value, 'minified.json', 'application/json')
}

const clearInput = () => {
  outputJson.value = ''
  error.value = ''
  friendlyError.value = ''
}

const clearAll = () => {
  inputJson.value = ''
  outputJson.value = ''
  error.value = ''
  friendlyError.value = ''
}

onMounted(() => { inputEditorRef.value?.loadDefaultExample() })
</script>
