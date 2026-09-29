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
          :placeholder="props.tool.ui?.placeholder_input"
          example-slug="json-repair"
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
      <button @click="repairJson" class="btn-primary px-5 py-2 text-xs">
        <Icon name="lucide:wrench" class="h-4 w-4 mr-1.5" />
        {{ props.tool.ui?.btn_repair }}
      </button>
      <div class="flex items-center gap-1.5 rounded-xl border border-surface-200 bg-white px-3 py-2 text-xs text-surface-600 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-300">
        <Icon name="lucide:indent-increase" class="h-4 w-4" />
        <span>{{ props.tool.ui?.label_indent }}</span>
        <select v-model="indent" class="bg-transparent font-bold outline-none">
          <option :value="2">{{ props.tool.ui?.indent_2 }}</option>
          <option :value="4">{{ props.tool.ui?.indent_4 }}</option>
          <option value="tab">{{ props.tool.ui?.indent_tab }}</option>
        </select>
      </div>
      <button @click="clearAll" class="rounded-xl border border-surface-200 bg-white px-4 py-2 text-xs font-bold text-surface-700 hover:bg-surface-50 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-300 dark:hover:bg-surface-700">
        {{ $t('system.clearAll') }}
      </button>

      <!-- Stats -->
      <template v-if="outputJson && !error">
        <div class="stat-chip">
          <Icon name="lucide:file-text" class="h-3 w-3" />
          {{ props.tool.ui?.label_input_size }}: {{ inputChars }} {{ props.tool.ui?.unit_chars }} · {{ inputBytes }} {{ props.tool.ui?.unit_bytes }}
        </div>
        <div class="stat-chip">
          <Icon name="lucide:check-circle-2" class="h-3 w-3" />
          {{ props.tool.ui?.label_output_size }}: {{ outputChars }} {{ props.tool.ui?.unit_chars }} · {{ outputBytes }} {{ props.tool.ui?.unit_bytes }}
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
const inboxApplied = ref(false)
onMounted(() => {
  const text = useJsonInbox().consumeInbox()
  if (text != null) {
    inputJson.value = text
    inboxApplied.value = true
  }
})
const outputJson = ref('')
const parsedOutputData = ref<unknown>(null)
const error = ref('')
const friendlyError = ref('')
const fullscreen = ref(false)
const inputEditorRef = ref()
const indent = ref<number | 'tab'>(2)

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

const indentValue = (): string | number => (indent.value === 'tab' ? '\t' : indent.value)

const fail = (messageKey: string) => {
  outputJson.value = ''
  parsedOutputData.value = null
  error.value = 'repair-failed'
  friendlyError.value = props.tool.ui?.[messageKey]
  toast.error(friendlyError.value ?? messageKey)
}

const repairJson = () => {
  error.value = ''
  friendlyError.value = ''
  if (!inputJson.value.trim()) {
    outputJson.value = ''
    parsedOutputData.value = null
    error.value = 'empty'
    friendlyError.value = props.tool.ui?.error_empty_input
    toast.error(friendlyError.value)
    return
  }

  const { repairJson: repair, fixJson } = useJsonFixer()
  // Primary path: the jsonrepair library handles a broad range of cases,
  // including Python/JS constants and comments.
  let repaired = repair(inputJson.value)
  if (repaired == null) {
    // Fallback: conservative structural fixes.
    const res = fixJson(inputJson.value)
    repaired = res.fixed
  }

  if (repaired == null) {
    fail('error_cannot_repair')
    return
  }

  try {
    // Re-serialize with the chosen indent so the displayed result is valid
    // and consistently formatted. If parsing somehow fails, show raw output.
    const parsed = JSON.parse(repaired)
    parsedOutputData.value = parsed
    outputJson.value = JSON.stringify(parsed, null, indentValue())
    toast.success(t('toast.fixed'))
  } catch {
    parsedOutputData.value = null
    outputJson.value = repaired
  }
}

// Re-format the existing repaired output when the indent changes.
watch(indent, () => {
  if (parsedOutputData.value !== null) {
    outputJson.value = JSON.stringify(parsedOutputData.value, null, indentValue())
  }
})

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
  downloadFile(outputJson.value, 'repaired.json', 'application/json')
}

const clearInput = () => {
  outputJson.value = ''
  parsedOutputData.value = null
  error.value = ''
  friendlyError.value = ''
}

const clearAll = () => {
  inputJson.value = ''
  outputJson.value = ''
  parsedOutputData.value = null
  error.value = ''
  friendlyError.value = ''
}

onMounted(() => { if (!inboxApplied.value) inputEditorRef.value?.loadDefaultExample() })
</script>
