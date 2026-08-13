<template>
  <div>
    <!-- Input -->
    <JsonInputEditor
      v-model="inputJson"
      :label="tool.ui?.label_input || 'Input JSON'"
      placeholder='Paste your JSON here...'
      show-upload
      @clear="clearAll"
      @paste="onInputPaste"
    />

    <!-- Action Buttons -->
    <div class="mt-4 flex flex-wrap items-center gap-3">
      <button @click="validate" class="btn-primary px-6 py-2.5 text-sm">
        <Icon name="lucide:check-circle" class="h-4 w-4 mr-1.5" />
        {{ tool.ui?.btn_validate || 'Validate JSON' }}
      </button>

      <!-- Fix button (only show when invalid) -->
      <button
        v-if="result && !result.valid"
        @click="fixJson"
        class="rounded-xl border border-surface-200 bg-white px-4 py-2 text-sm font-bold text-surface-700 hover:bg-surface-50 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-300"
      >
        <Icon name="lucide:wrench" class="h-4 w-4 mr-1.5" />
        {{ tool.ui?.btn_fix || 'Fix JSON' }}
      </button>

      <!-- Copy Input -->
      <button
        v-if="inputJson"
        @click="copyInput"
        class="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400"
      >
        {{ copied ? '✓ Copied!' : 'Copy Input' }}
      </button>

      <!-- Copy Result -->
      <button
        v-if="result && !result.valid && result.error"
        @click="copyError"
        class="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400"
      >
        {{ copyErrorCopied ? '✓ Copied!' : 'Copy Error' }}
      </button>
    </div>

    <!-- Result card -->
    <Transition name="fade">
      <div v-if="result !== null" class="mt-4">
        <!-- Valid -->
        <div v-if="result.valid" class="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20">
          <div class="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/40">
            <Icon name="lucide:check" class="h-5 w-5 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <p class="text-sm font-bold text-green-700 dark:text-green-400">{{ tool.ui?.status_valid || 'Valid JSON' }}</p>
            <p class="text-xs text-green-600 dark:text-green-500 mt-0.5">
              {{ tool.ui?.hint_valid || 'Your JSON is syntactically correct.' }}
            </p>
          </div>
        </div>

        <!-- Invalid -->
        <div v-else class="rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
          <div class="flex items-center gap-2 mb-2">
            <Icon name="lucide:x-circle" class="h-5 w-5 text-red-600 dark:text-red-400" />
            <span class="text-sm font-bold text-red-700 dark:text-red-400">{{ tool.ui?.status_invalid || 'Invalid JSON' }}</span>
          </div>
          <div class="rounded-lg bg-red-100/50 border border-red-200 p-3 dark:bg-red-900/30 dark:border-red-800">
            <p class="text-sm text-red-700 dark:text-red-400 font-mono">{{ result.error }}</p>
            <p v-if="result.line" class="text-xs text-red-600 dark:text-red-500 mt-1.5">
              {{ tool.ui?.label_line || 'Line:' }} {{ result.line }}, {{ tool.ui?.label_column || 'Column:' }} {{ result.column }}
            </p>
          </div>

          <!-- Fix suggestions -->
          <div v-if="result.fixes && result.fixes.length > 0" class="mt-3 rounded-lg bg-yellow-50 border border-yellow-200 p-3 dark:bg-yellow-900/20 dark:border-yellow-800">
            <p class="text-xs font-bold text-yellow-700 dark:text-yellow-400 mb-1">Applied fixes:</p>
            <ul class="text-xs text-yellow-600 dark:text-yellow-500 list-disc list-inside">
              <li v-for="fix in result.fixes" :key="fix">{{ fix }}</li>
            </ul>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Auto-load from URL -->
    <div v-if="urlLoaded" class="mt-3 text-xs text-primary-600 dark:text-primary-400">
      Data loaded from URL. <button @click="clearUrlData" class="underline">Clear</button>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ tool: any }>()

const inputJson = ref('')
const result = ref<{
  valid: boolean
  error?: string
  line?: number
  column?: number
  fixes?: string[]
} | null>(null)
const urlLoaded = ref(false)

// Composables
const { fixJson: fixJsonAuto } = useJsonFixer()
const { copied, copyToClipboard } = useClipboard()
const { loadDataFromUrl, clearAllParams } = useUrlParams()

const copyErrorCopied = ref(false)

// Load data from URL on mount
onMounted(() => {
  const urlData = loadDataFromUrl('json') || loadDataFromUrl('data')
  if (urlData) {
    inputJson.value = urlData
    urlLoaded.value = true
    nextTick(() => validate())
  }
})

const validate = () => {
  try {
    JSON.parse(inputJson.value)
    result.value = { valid: true }
  } catch (e) {
    const error = e as SyntaxError
    const match = error.message.match(/position (\d+)/)
    let line: number | undefined
    let column: number | undefined

    if (match) {
      const pos = parseInt(match[1])
      const lines = inputJson.value.substring(0, pos).split('\n')
      line = lines.length
      column = lines[lines.length - 1].length + 1
    }

    result.value = {
      valid: false,
      error: error.message,
      line,
      column
    }
  }
}

const fixJson = () => {
  const { fixed, fixes } = fixJsonAuto(inputJson.value)

  if (fixed) {
    inputJson.value = fixed
    result.value = {
      valid: true,
      fixes
    }
  }
}

const clearAll = () => {
  result.value = null
  urlLoaded.value = false
}

const clearUrlData = () => {
  clearAllParams()
  urlLoaded.value = false
}

const onInputPaste = () => {
  nextTick(() => validate())
}

const copyInput = async () => {
  await copyToClipboard(inputJson.value)
}

const copyError = async () => {
  if (result.value?.error) {
    const errorText = `Error: ${result.value.error}\nLine: ${result.value.line}, Column: ${result.value.column}`
    await copyToClipboard(errorText)
    copyErrorCopied.value = true
    setTimeout(() => {
      copyErrorCopied.value = false
    }, 2000)
  }
}
</script>
