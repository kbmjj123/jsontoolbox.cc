<template>
  <div>
    <!-- Compact input -->
    <div class="mb-4">
      <div class="flex items-center justify-between mb-2">
        <label class="text-sm font-bold text-surface-700 dark:text-surface-300">{{ ui?.labelInputJson ?? 'Input JSON' }}</label>
        <div class="flex gap-2">
          <button @click="handlePaste" class="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400">
            {{ $t('system.paste') }}
          </button>
          <button @click="handleUpload" class="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400">
            {{ $t('system.upload') }}
          </button>
          <button @click="clearAll" class="text-xs text-surface-500 hover:text-surface-700 dark:text-surface-400">
            {{ $t('system.clear') }}
          </button>
        </div>
      </div>
      <textarea
        v-model="inputJson"
        class="w-full h-32 rounded-xl border border-surface-200 bg-surface-50 p-4 font-mono text-sm text-surface-900 resize-none dark:border-surface-700 dark:bg-surface-800 dark:text-surface-100"
        :placeholder="ui?.placeholderInput ?? '{\"name\": \"JSON Toolbox\", \"features\": [\"format\", \"validate\", \"convert\"]}'"
        spellcheck="false"
      ></textarea>
      <input ref="fileInputRef" type="file" accept=".json,.txt,.jsonl" class="hidden" @change="onFileChange" />
      <div class="mt-2">
        <button @click="parseJson" class="btn-primary px-5 py-2 text-xs">
          {{ ui?.btnViewTree ?? 'View Tree' }}
        </button>
      </div>
    </div>

    <!-- Tree view (full width) -->
    <div>
      <div class="flex items-center justify-between mb-2">
        <label class="text-sm font-bold text-surface-700 dark:text-surface-300">{{ ui?.labelTreeView ?? 'Tree View' }}</label>
        <input
          v-model="searchQuery"
          type="text"
          :placeholder="ui?.placeholderSearch ?? 'Search keys or values...'"
          class="w-56 rounded-lg border border-surface-200 bg-white px-3 py-1.5 text-xs dark:border-surface-700 dark:bg-surface-800 dark:text-surface-100"
        />
      </div>
      <div class="min-h-[20rem] max-h-[40rem] rounded-xl border border-surface-200 bg-surface-50 p-4 overflow-auto dark:border-surface-700 dark:bg-surface-800">
        <div v-if="error" class="text-red-600 dark:text-red-400 text-sm">{{ error }}</div>
        <div v-else-if="treeData">
          <TreeNode :data="treeData" :path="''" :search="searchQuery" @copy="copyPath" />
        </div>
        <div v-else class="flex items-center justify-center h-full text-surface-400 text-sm">
          {{ ui?.emptyState ?? 'Paste JSON and click "View Tree"' }}
        </div>
      </div>
    </div>

    <!-- Copied toast -->
    <Transition name="fade">
      <div v-if="showCopied" class="fixed bottom-4 right-4 rounded-lg bg-green-600 px-4 py-2 text-sm text-white shadow-lg">
        {{ ui?.toastPathCopied ?? 'Path copied!' }}
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ tool: any }>()
const ui = computed(() => props.tool?.ui)

const inputJson = ref('')
const treeData = ref<any>(null)
const error = ref('')
const searchQuery = ref('')
const showCopied = ref(false)
const fileInputRef = ref<HTMLInputElement>()

const parseJson = () => {
  try {
    treeData.value = JSON.parse(inputJson.value)
    error.value = ''
  } catch (e) {
    error.value = (e as Error).message
    treeData.value = null
  }
}

const clearAll = () => {
  inputJson.value = ''
  treeData.value = null
  error.value = ''
  searchQuery.value = ''
}

const handlePaste = async () => {
  try {
    inputJson.value = await navigator.clipboard.readText()
  } catch (e) {
    console.error('Failed to read clipboard:', e)
  }
}

const handleUpload = () => {
  fileInputRef.value?.click()
}

const onFileChange = (e: Event) => {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (ev) => {
    inputJson.value = ev.target?.result as string
  }
  reader.readAsText(file)
  input.value = ''
}

const copyPath = async (path: string) => {
  try {
    await navigator.clipboard.writeText(path)
    showCopied.value = true
    setTimeout(() => { showCopied.value = false }, 2000)
  } catch (e) {
    console.error('Failed to copy:', e)
  }
}
</script>
