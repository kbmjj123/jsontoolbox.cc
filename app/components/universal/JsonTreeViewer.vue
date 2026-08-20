<template>
  <ResizablePanel v-model:fullscreen="fullscreen" :initial-ratio="0.3" responsive>
    <template #first>
      <div class="h-full pr-3">
        <JsonInputEditor
          v-model="inputJson"
          :label="ui?.labelInputJson ?? 'Input JSON'"
          placeholder='{"name": "JSON Toolbox", "features": ["format", "validate"]}'
          :height="fullscreen ? 'h-full' : 'h-64'"
          show-upload
          show-load-url
          @clear="clearAll"
        />
      </div>
    </template>
    <template #second>
      <div class="h-full pl-3">
        <div class="flex items-center justify-between mb-2">
          <label class="text-sm font-bold text-surface-700 dark:text-surface-300">{{ ui?.labelTreeView ?? 'Tree View' }}</label>
          <input
            v-model="searchQuery"
            type="text"
            :placeholder="ui?.placeholderSearch ?? 'Search keys or values...'"
            class="w-56 rounded-lg border border-surface-200 bg-white px-3 py-1.5 text-xs dark:border-surface-700 dark:bg-surface-800 dark:text-surface-100"
          />
        </div>
        <div class="rounded-xl border border-surface-200 bg-surface-50 p-4 overflow-auto dark:border-surface-700 dark:bg-surface-800" :class="fullscreen ? 'h-full' : 'min-h-[20rem] max-h-[40rem]'">
          <div v-if="error" class="text-red-600 dark:text-red-400 text-sm">{{ error }}</div>
          <div v-else-if="treeData">
            <TreeNode :data="treeData" :path="''" :search="searchQuery" @copy="copyPath" />
          </div>
          <div v-else class="flex items-center justify-center h-full text-surface-400 text-sm">
            {{ ui?.emptyState ?? 'Paste JSON and click "View Tree"' }}
          </div>
        </div>
      </div>
    </template>

    <template #toolbar-left>
      <button @click="parseJson" class="btn-primary px-5 py-2 text-xs">
        {{ ui?.btnViewTree ?? 'View Tree' }}
      </button>
      <button @click="clearAll" class="rounded-xl border border-surface-200 bg-white px-4 py-2 text-xs font-bold text-surface-700 hover:bg-surface-50 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-300 dark:hover:bg-surface-700">
        {{ $t('system.clearAll') }}
      </button>
    </template>
  </ResizablePanel>

  <!-- Copied toast -->
  <Transition name="fade">
    <div v-if="showCopied" class="fixed bottom-4 right-4 rounded-lg bg-green-600 px-4 py-2 text-sm text-white shadow-lg">
      {{ ui?.toastPathCopied ?? 'Path copied!' }}
    </div>
  </Transition>
</template>

<script setup lang="ts">
const props = defineProps<{ tool: any }>()
const ui = computed(() => props.tool?.ui)

const inputJson = ref('')
const treeData = ref<any>(null)
const error = ref('')
const searchQuery = ref('')
const showCopied = ref(false)
const fullscreen = ref(false)

const parseJson = () => {
  try { treeData.value = JSON.parse(inputJson.value); error.value = '' }
  catch (e) { error.value = (e as Error).message; treeData.value = null }
}

const clearAll = () => { inputJson.value = ''; treeData.value = null; error.value = ''; searchQuery.value = '' }

const copyPath = async (path: string) => {
  try {
    await navigator.clipboard.writeText(path)
    showCopied.value = true
    setTimeout(() => { showCopied.value = false }, 2000)
  } catch (e) { console.error('Failed to copy:', e) }
}
</script>
