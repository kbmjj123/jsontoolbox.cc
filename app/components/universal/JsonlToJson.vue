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
          example-slug="jsonl-to-json"
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
        />
      </div>
    </template>

    <template #toolbar-right>
      <div class="flex items-center gap-2 shrink-0">
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
      </div>
    </template>

    <template #toolbar-left>
      <button @click="convert" class="btn-primary px-5 py-2 text-xs">
        <Icon name="lucide:file-json" class="h-4 w-4 mr-1.5" />
        {{ props.tool.ui?.btn_convert }}
      </button>
      <button @click="clearAll" class="rounded-xl border border-surface-200 bg-white px-4 py-2 text-xs font-bold text-surface-700 hover:bg-surface-50 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-300 dark:hover:bg-surface-700">
        {{ $t('system.clearAll') }}
      </button>
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
const error = ref('')
const friendlyError = ref('')
const fullscreen = ref(false)
const inputEditorRef = ref()

const convert = () => {
  error.value = ''
  friendlyError.value = ''
  if (!inputJson.value.trim()) {
    error.value = 'empty'
    friendlyError.value = props.tool.ui?.error_empty_input
    toast.error(friendlyError.value)
    return
  }

  const lines = inputJson.value.split('\n')
  const values: unknown[] = []
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue
    try {
      values.push(JSON.parse(line))
    } catch {
      const msg = props.tool.ui?.error_invalid_json?.replace('{line}', String(i + 1)) ?? ''
      error.value = 'invalid'
      friendlyError.value = msg
      outputJson.value = ''
      toast.error(msg)
      return
    }
  }

  if (values.length === 0) {
    error.value = 'empty'
    friendlyError.value = props.tool.ui?.error_empty_input
    toast.error(friendlyError.value)
    return
  }

  outputJson.value = JSON.stringify(values, null, 2)
  toast.success(t('toast.converted'))
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
  downloadFile(outputJson.value, 'output.json', 'application/json')
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

onMounted(() => { if (!inboxApplied.value) inputEditorRef.value?.loadDefaultExample() })
</script>
