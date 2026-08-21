<template>
  <ResizablePanel v-model:fullscreen="fullscreen" :initial-ratio="0.3" responsive>
    <template #first>
      <div class="h-full pr-3">
        <JsonInputEditor
          v-model="inputJson"
          :label="ui?.labelInputJson ?? 'Input JSON'"
          placeholder='{"name": "JSON Toolbox", "features": ["format", "validate"]}'
          show-upload
          show-load-url
          @clear="clearAll"
        />
      </div>
    </template>
    <template #second>
      <div class="h-full pl-3 flex flex-col">
        <!-- Header: label + search bar -->
        <div class="flex items-center justify-between mb-2 gap-3">
          <label class="text-sm font-bold text-surface-700 dark:text-surface-300 shrink-0">{{ ui?.labelTreeView ?? 'Tree View' }}</label>

          <!-- Search bar -->
          <div v-if="treeData" class="flex items-center gap-1.5 flex-1 justify-end">
            <!-- Mode dropdown -->
            <div class="relative" ref="modeDropdownRef">
              <button
                @click="showModeDropdown = !showModeDropdown"
                class="flex items-center gap-1 rounded-lg border border-surface-200 bg-white px-2.5 py-1.5 text-xs font-medium text-surface-600 hover:bg-surface-50 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-300 dark:hover:bg-surface-700"
              >
                {{ modeLabel }}
                <Icon name="lucide:chevron-down" class="w-3 h-3" />
              </button>
              <Transition name="fade">
                <div v-if="showModeDropdown" class="absolute top-full mt-1 left-0 z-50 rounded-lg border border-surface-200 bg-white shadow-lg dark:border-surface-700 dark:bg-surface-800 overflow-hidden">
                  <button
                    v-for="m in modes.value"
                    :key="m.value"
                    @click="search.mode.value = m.value; showModeDropdown = false"
                    class="block w-full text-left px-3 py-1.5 text-xs hover:bg-surface-100 dark:hover:bg-surface-700"
                    :class="search.mode.value === m.value ? 'text-primary-600 dark:text-primary-400 font-medium' : 'text-surface-600 dark:text-surface-300'"
                  >
                    {{ m.label }}
                  </button>
                </div>
              </Transition>
            </div>

            <!-- Search input -->
            <div class="relative">
              <Icon name="lucide:search" class="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-surface-400" />
              <input
                :value="search.query.value"
                @input="onSearchInput"
                @keydown.enter.prevent="onEnter"
                @keydown.escape="search.clear()"
                type="text"
                :placeholder="searchPlaceholder"
                class="w-48 rounded-lg border border-surface-200 bg-white pl-8 pr-14 py-1.5 text-xs dark:border-surface-700 dark:bg-surface-800 dark:text-surface-100 focus:outline-none focus:ring-1 focus:ring-primary-400"
                ref="searchInputRef"
              />
              <!-- Counter inside input -->
              <span
                v-if="search.query.value"
                class="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-mono"
                :class="search.totalCount.value > 0 ? 'text-surface-400' : 'text-red-400'"
              >
                {{ search.totalCount.value > 0 ? `${search.currentIndex.value + 1}/${search.totalCount.value}` : '0/0' }}
              </span>
            </div>

            <!-- Nav buttons -->
            <button
              @click="search.prev()"
              :disabled="search.totalCount.value === 0"
              class="w-7 h-7 flex items-center justify-center rounded-lg border border-surface-200 bg-white text-surface-500 hover:bg-surface-50 disabled:opacity-30 disabled:cursor-not-allowed dark:border-surface-700 dark:bg-surface-800 dark:text-surface-400 dark:hover:bg-surface-700"
            >
              <Icon name="lucide:chevron-up" class="w-3.5 h-3.5" />
            </button>
            <button
              @click="search.next()"
              :disabled="search.totalCount.value === 0"
              class="w-7 h-7 flex items-center justify-center rounded-lg border border-surface-200 bg-white text-surface-500 hover:bg-surface-50 disabled:opacity-30 disabled:cursor-not-allowed dark:border-surface-700 dark:bg-surface-800 dark:text-surface-400 dark:hover:bg-surface-700"
            >
              <Icon name="lucide:chevron-down" class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <!-- Tree container -->
        <div
          ref="treeContainerRef"
          class="rounded-xl border border-surface-200 bg-surface-50 p-4 overflow-auto dark:border-surface-700 dark:bg-surface-800 flex-1"
          :class="fullscreen ? '' : 'min-h-[20rem] max-h-[40rem]'"
        >
          <div v-if="error" class="text-red-600 dark:text-red-400 text-sm">{{ error }}</div>
          <div v-else-if="treeData">
            <JsonTreeNode :data="treeData" :path="''" @copy="copyPath" />
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
const { t } = useI18n()

const inputJson = ref('')
const treeData = ref<any>(null)
const error = ref('')
const showCopied = ref(false)
const fullscreen = ref(false)
const showModeDropdown = ref(false)
const treeContainerRef = ref<HTMLElement>()
const searchInputRef = ref<HTMLInputElement>()
const modeDropdownRef = ref<HTMLElement>()

// Search
const search = useTreeSearch(treeData)

const modes = computed(() => [
  { value: 'key' as const, label: t('tree.searchByKey') },
  { value: 'value' as const, label: t('tree.searchByValue') },
  { value: 'path' as const, label: t('tree.searchByPath') },
])

const modeLabel = computed(() => modes.value.find(m => m.value === search.mode.value)?.label ?? 'Key')

const searchPlaceholder = computed(() => {
  switch (search.mode.value) {
    case 'key': return t('tree.placeholderKey')
    case 'value': return t('tree.placeholderValue')
    case 'path': return t('tree.placeholderPath')
  }
})

function onSearchInput(e: Event) {
  search.query.value = (e.target as HTMLInputElement).value
}

function onEnter(e: KeyboardEvent) {
  if (e.shiftKey) search.prev()
  else search.next()
}

// Close mode dropdown on outside click
onMounted(() => {
  const handler = (e: MouseEvent) => {
    if (modeDropdownRef.value && !modeDropdownRef.value.contains(e.target as Node)) {
      showModeDropdown.value = false
    }
  }
  document.addEventListener('click', handler)
  onUnmounted(() => document.removeEventListener('click', handler))
})

// Provide search state to tree nodes
provide('treeSearch', search)

const parseJson = () => {
  try { treeData.value = JSON.parse(inputJson.value); error.value = '' }
  catch (e) { error.value = (e as Error).message; treeData.value = null }
}

const clearAll = () => { inputJson.value = ''; treeData.value = null; error.value = ''; search.clear() }

const copyPath = async (path: string) => {
  try {
    await navigator.clipboard.writeText(path)
    showCopied.value = true
    setTimeout(() => { showCopied.value = false }, 2000)
  } catch (e) { console.error('Failed to copy:', e) }
}
</script>
