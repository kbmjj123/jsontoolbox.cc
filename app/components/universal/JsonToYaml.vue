<template>
  <div>
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <!-- Input -->
      <JsonInputEditor
        v-model="inputJson"
        :label="tool.ui?.label_input || 'Input JSON'"
        placeholder='{"name": "JSON Toolbox", "version": "1.0"}'
        @clear="clearAll"
      />

      <!-- Output -->
      <div>
        <div class="flex items-center justify-between mb-2">
          <label class="text-sm font-bold text-surface-700 dark:text-surface-300">{{ tool.ui?.label_output || 'YAML Output' }}</label>
          <div class="flex gap-2">
            <button @click="copyOutput" class="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400">
              {{ copied ? '✓ Copied!' : $t('system.copy') }}
            </button>
            <button @click="downloadOutput" class="text-xs text-surface-500 hover:text-surface-700 dark:text-surface-400">
              {{ $t('system.download') }}
            </button>
          </div>
        </div>
        <div class="relative">
          <textarea
            v-model="outputYaml"
            readonly
            class="w-full h-64 rounded-xl border border-surface-200 bg-surface-50 p-4 font-mono text-sm text-surface-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-100 resize-none"
            :placeholder="tool.ui?.placeholder_output || 'YAML output will appear here...'"
          ></textarea>
          <div v-if="error" class="absolute bottom-2 left-2 right-2 rounded-lg bg-red-50 border border-red-200 p-2 text-xs text-red-700 dark:bg-red-900/30 dark:border-red-800 dark:text-red-400">
            {{ error }}
          </div>
        </div>
      </div>
    </div>

    <!-- Options -->
    <div class="mt-4 flex flex-wrap items-center gap-4">
      <button @click="convertToYaml" class="btn-primary px-5 py-2 text-xs">
        <Icon name="lucide:arrow-right" class="h-4 w-4 mr-1.5" />
        {{ tool.ui?.btn_convert || 'Convert to YAML' }}
      </button>
      <button @click="clearAll" class="rounded-xl border border-surface-200 bg-white px-4 py-2 text-xs font-bold text-surface-700 hover:bg-surface-50 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-300 dark:hover:bg-surface-700">
        {{ $t('system.clearAll') }}
      </button>

      <!-- Indent options -->
      <div class="flex items-center gap-2">
        <label class="text-xs text-surface-600 dark:text-surface-400">Indent:</label>
        <select v-model="indent" class="rounded-lg border border-surface-200 bg-white px-2 py-1 text-xs dark:border-surface-700 dark:bg-surface-800">
          <option :value="2">2 spaces</option>
          <option :value="4">4 spaces</option>
        </select>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import yaml from 'js-yaml'

const props = defineProps<{ tool: any }>()

const inputJson = ref('')
const outputYaml = ref('')
const error = ref('')
const indent = ref(2)

// Composables
const { copied, copyToClipboard } = useClipboard()
const { loadDataFromUrl } = useUrlParams()

// Load from URL on mount
onMounted(() => {
  const urlData = loadDataFromUrl('json') || loadDataFromUrl('data')
  if (urlData) {
    inputJson.value = urlData
    nextTick(() => convertToYaml())
  }
})

const convertToYaml = () => {
  error.value = ''
  try {
    const parsed = JSON.parse(inputJson.value)
    outputYaml.value = yaml.dump(parsed, {
      indent: indent.value,
      lineWidth: -1,
      noRefs: true,
    })
  } catch (e) {
    error.value = (e as Error).message
    outputYaml.value = ''
  }
}

const clearAll = () => {
  outputYaml.value = ''
  error.value = ''
}

const copyOutput = async () => {
  await copyToClipboard(outputYaml.value)
}

const downloadOutput = () => {
  const blob = new Blob([outputYaml.value], { type: 'text/yaml' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'output.yaml'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
</script>
