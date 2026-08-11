<template>
  <div>
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <!-- Input -->
      <div>
        <div class="flex items-center justify-between mb-2">
          <label class="text-sm font-bold text-surface-700 dark:text-surface-300">{{ tool.ui?.label_input || 'Input JSON' }}</label>
          <div class="flex gap-2">
            <button @click="pasteFromClipboard" class="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400">
              {{ $t('system.paste') }}
            </button>
            <button @click="clearInput" class="text-xs text-surface-500 hover:text-surface-700 dark:text-surface-400">
              {{ $t('system.clear') }}
            </button>
          </div>
        </div>
        <textarea
          v-model="inputJson"
          class="w-full h-64 rounded-xl border border-surface-200 bg-surface-50 p-4 font-mono text-sm text-surface-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-100 resize-none"
          placeholder='Paste your JSON here...'
        ></textarea>
      </div>

      <!-- Result -->
      <div>
        <div class="flex items-center justify-between mb-2">
          <label class="text-sm font-bold text-surface-700 dark:text-surface-300">{{ tool.ui?.label_result || 'Validation Result' }}</label>
        </div>
        <div class="h-64 rounded-xl border border-surface-200 bg-surface-50 p-4 overflow-auto dark:border-surface-700 dark:bg-surface-800">
          <div v-if="result === null" class="flex items-center justify-center h-full text-surface-400 text-sm">
            {{ tool.ui?.placeholder_hint || 'Click "Validate" to check your JSON' }}
          </div>
          <div v-else-if="result.valid" class="flex flex-col items-center justify-center h-full gap-3">
            <div class="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <Icon name="lucide:check" class="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <p class="text-lg font-bold text-green-700 dark:text-green-400">{{ tool.ui?.status_valid || 'Valid JSON' }}</p>
          </div>
          <div v-else class="space-y-3">
            <div class="flex items-center gap-2 text-red-600 dark:text-red-400">
              <Icon name="lucide:x-circle" class="h-5 w-5" />
              <span class="font-bold">{{ tool.ui?.status_invalid || 'Invalid JSON' }}</span>
            </div>
            <div class="rounded-lg bg-red-50 border border-red-200 p-3 dark:bg-red-900/30 dark:border-red-800">
              <p class="text-sm text-red-700 dark:text-red-400">{{ result.error }}</p>
              <p v-if="result.line" class="text-xs text-red-600 dark:text-red-500 mt-1">
                {{ tool.ui?.label_line || 'Line:' }} {{ result.line }}, {{ tool.ui?.label_column || 'Column:' }} {{ result.column }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Validate Button -->
    <div class="mt-4">
      <button @click="validate" class="btn-primary px-6 py-2.5 text-sm">
        {{ tool.ui?.btn_validate || 'Validate JSON' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ tool: any }>()

const inputJson = ref('')
const result = ref<{ valid: boolean; error?: string; line?: number; column?: number } | null>(null)

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

const pasteFromClipboard = async () => {
  try {
    inputJson.value = await navigator.clipboard.readText()
  } catch (e) {
    console.error('Failed to read clipboard:', e)
  }
}

const clearInput = () => {
  inputJson.value = ''
  result.value = null
}
</script>
