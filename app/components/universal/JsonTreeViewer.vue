<template>
  <div>
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <!-- Input -->
      <div>
        <div class="flex items-center justify-between mb-2">
          <label class="text-sm font-bold text-surface-700 dark:text-surface-300">Input JSON</label>
          <div class="flex gap-2">
            <button @click="pasteFromClipboard" class="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400">
              Paste
            </button>
            <button @click="clearInput" class="text-xs text-surface-500 hover:text-surface-700 dark:text-surface-400">
              Clear
            </button>
          </div>
        </div>
        <textarea
          v-model="inputJson"
          class="w-full h-64 rounded-xl border border-surface-200 bg-surface-50 p-4 font-mono text-sm text-surface-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-100 resize-none"
          placeholder='{"name": "JSON Toolbox", "features": ["format", "validate", "convert"]}'
        ></textarea>
      </div>

      <!-- Tree View -->
      <div>
        <div class="flex items-center justify-between mb-2">
          <label class="text-sm font-bold text-surface-700 dark:text-surface-300">Tree View</label>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search..."
            class="w-40 rounded-lg border border-surface-200 bg-white px-2 py-1 text-xs dark:border-surface-700 dark:bg-surface-800"
          />
        </div>
        <div class="h-64 rounded-xl border border-surface-200 bg-surface-50 p-4 overflow-auto dark:border-surface-700 dark:bg-surface-800">
          <div v-if="error" class="text-red-600 dark:text-red-400 text-sm">{{ error }}</div>
          <div v-else-if="treeData">
            <TreeNode :data="treeData" :path="''" :search="searchQuery" @copy="copyPath" />
          </div>
          <div v-else class="flex items-center justify-center h-full text-surface-400 text-sm">
            Paste JSON and click "View Tree"
          </div>
        </div>
      </div>
    </div>

    <!-- View Button -->
    <div class="mt-4">
      <button @click="parseJson" class="btn-primary px-6 py-2.5 text-sm">
        View Tree
      </button>
    </div>

    <!-- Copied toast -->
    <Transition name="fade">
      <div v-if="showCopied" class="fixed bottom-4 right-4 rounded-lg bg-green-600 px-4 py-2 text-sm text-white shadow-lg">
        Path copied!
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
const inputJson = ref('')
const treeData = ref<any>(null)
const error = ref('')
const searchQuery = ref('')
const showCopied = ref(false)

const parseJson = () => {
  try {
    treeData.value = JSON.parse(inputJson.value)
    error.value = ''
  } catch (e) {
    error.value = (e as Error).message
    treeData.value = null
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
  treeData.value = null
  error.value = ''
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
