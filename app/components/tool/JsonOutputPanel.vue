<template>
  <div class="h-full flex flex-col">
    <!-- Header -->
    <div class="flex items-center justify-between mb-2 gap-3">
      <div class="flex items-center gap-2 shrink-0">
        <label class="text-sm font-bold text-surface-700 dark:text-surface-300">{{ label }}</label>
        <!-- View mode toggle -->
        <div
          v-if="parsedData !== null"
          class="flex rounded-lg border border-surface-200 dark:border-surface-700 overflow-hidden"
        >
          <button
            @click="emit('update:viewMode', 'rich')"
            :class="viewMode === 'rich' ? 'bg-primary-600 text-white' : 'bg-white text-surface-600 dark:bg-surface-800 dark:text-surface-400'"
            class="px-2 py-0.5 text-xs transition-colors"
          >
            Rich
          </button>
          <button
            @click="emit('update:viewMode', 'text')"
            :class="viewMode === 'text' ? 'bg-primary-600 text-white' : 'bg-white text-surface-600 dark:bg-surface-800 dark:text-surface-400'"
            class="px-2 py-0.5 text-xs transition-colors"
          >
            Text
          </button>
        </div>
      </div>
      <div class="flex gap-2 items-center flex-1 justify-end">

        <!-- Search bar (rich mode only) -->
        <template v-if="currentMode === 'rich' && parsedData !== null">
          <button
            @click="toggleExpandAll"
            class="text-xs text-surface-500 hover:text-surface-700 dark:text-surface-400 dark:hover:text-surface-200 whitespace-nowrap"
          >
            {{ allExpanded ? $t('tree.collapseAll') : $t('tree.expandAll') }}
          </button>

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
                  v-for="m in modes"
                  :key="m.value"
                  @click="treeSearch.mode.value = m.value; showModeDropdown = false"
                  class="block w-full text-left px-3 py-1.5 text-xs hover:bg-surface-100 dark:hover:bg-surface-700"
                  :class="treeSearch.mode.value === m.value ? 'text-primary-600 dark:text-primary-400 font-medium' : 'text-surface-600 dark:text-surface-300'"
                >
                  {{ m.label }}
                </button>
              </div>
            </Transition>
          </div>

          <div class="relative">
            <Icon name="lucide:search" class="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-surface-400" />
            <input
              :value="treeSearch.query.value"
              @input="onSearchInput"
              @keydown.enter.prevent="onEnter"
              @keydown.escape="treeSearch.clear()"
              type="text"
              :placeholder="searchPlaceholder"
              class="w-48 rounded-lg border border-surface-200 bg-white pl-8 pr-14 py-1.5 text-xs dark:border-surface-700 dark:bg-surface-800 dark:text-surface-100 focus:outline-none focus:ring-1 focus:ring-primary-400"
            />
            <span
              v-if="treeSearch.query.value"
              class="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-mono"
              :class="treeSearch.totalCount.value > 0 ? 'text-surface-400' : 'text-red-400'"
            >
              {{ treeSearch.totalCount.value > 0 ? `${treeSearch.currentIndex.value + 1}/${treeSearch.totalCount.value}` : '0/0' }}
            </span>
          </div>

          <template v-if="treeSearch.query.value">
            <button
              @click="treeSearch.prev()"
              :disabled="treeSearch.totalCount.value === 0"
              class="w-7 h-7 flex items-center justify-center rounded-lg border border-surface-200 bg-white text-surface-500 hover:bg-surface-50 disabled:opacity-30 disabled:cursor-not-allowed dark:border-surface-700 dark:bg-surface-800 dark:text-surface-400 dark:hover:bg-surface-700"
            >
              <Icon name="lucide:chevron-up" class="w-3.5 h-3.5" />
            </button>
            <button
              @click="treeSearch.next()"
              :disabled="treeSearch.totalCount.value === 0"
              class="w-7 h-7 flex items-center justify-center rounded-lg border border-surface-200 bg-white text-surface-500 hover:bg-surface-50 disabled:opacity-30 disabled:cursor-not-allowed dark:border-surface-700 dark:bg-surface-800 dark:text-surface-400 dark:hover:bg-surface-700"
            >
              <Icon name="lucide:chevron-down" class="w-3.5 h-3.5" />
            </button>
          </template>
        </template>

        <slot name="actions" />

        <button
          v-if="showCopy"
          @click="handleCopy"
          class="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400"
        >
          {{ copied ? '✓ Copied!' : $t('system.copy') }}
        </button>
        <button
          v-if="showDownload"
          @click="emit('download')"
          class="text-xs text-surface-500 hover:text-surface-700 dark:text-surface-400"
        >
          {{ $t('system.download') }}
        </button>
      </div>
    </div>

    <!-- Text view -->
    <div v-show="currentMode === 'text'" class="relative flex-1 min-h-0">
      <div
        :class="[hasContent ? 'text-surface-900 dark:text-surface-100' : 'text-surface-400 dark:text-surface-500']"
        class="w-full h-full rounded-xl border border-surface-200 bg-surface-50 font-mono text-sm overflow-auto dark:border-surface-700 dark:bg-surface-800"
      >
        <div v-if="hasContent" class="flex">
          <div class="flex-none select-none text-right pr-3 pl-2 py-4 text-surface-400 dark:text-surface-500 border-r border-surface-200 dark:border-surface-700 leading-[1.5]">
            <div v-for="n in contentLines.length" :key="n">{{ n }}</div>
          </div>
          <pre class="flex-1 p-4 m-0 overflow-x-auto whitespace-pre leading-[1.5]">{{ content }}</pre>
        </div>
        <div v-else class="p-4">{{ emptyText }}</div>
      </div>
      <div
        v-if="error"
        class="absolute bottom-2 left-2 right-2 rounded-lg bg-red-50 border border-red-200 p-2 text-xs text-red-700 dark:bg-red-900/30 dark:border-red-800 dark:text-red-400"
      >
        {{ error }}
      </div>
    </div>

    <!-- Rich view -->
    <div
      v-show="currentMode === 'rich'"
      class="flex-1 min-h-0 overflow-auto rounded-xl border border-surface-200 bg-surface-50 p-4 dark:border-surface-700 dark:bg-surface-800"
    >
      <JsonTreeNode
        v-if="parsedData !== null"
        :data="parsedData"
        :path="''"
      />
      <div v-else class="flex items-center justify-center h-full text-surface-400 text-sm">
        {{ error || emptyText }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n()

interface Props {
  label?: string
  content?: string
  error?: string
  viewMode?: 'text' | 'rich'
  parsedData?: unknown | null
  showCopy?: boolean
  showDownload?: boolean
  downloadFilename?: string
  emptyText?: string
}

const props = withDefaults(defineProps<Props>(), {
  label: 'Output',
  content: '',
  error: '',
  viewMode: 'text',
  parsedData: null,
  showCopy: true,
  showDownload: true,
  downloadFilename: 'output.json',
  emptyText: 'Result will appear here',
})

const emit = defineEmits<{
  'update:viewMode': [mode: 'text' | 'rich']
  copy: []
  download: []
  copyPath: [path: string]
}>()

const copied = ref(false)
const showModeDropdown = ref(false)
const modeDropdownRef = ref<HTMLElement>()

const currentMode = computed(() => props.viewMode)
const hasContent = computed(() => !!props.content)
const contentLines = computed(() => (props.content || '').replace(/\n$/, '').split('\n'))

// Search
const parsedDataRef = computed(() => props.parsedData)
const treeSearch = useTreeSearch(parsedDataRef)

const modes = computed(() => [
  { value: 'key' as const, label: t('tree.searchByKey') },
  { value: 'value' as const, label: t('tree.searchByValue') },
  { value: 'path' as const, label: t('tree.searchByPath') },
])

const modeLabel = computed(() => modes.value.find(m => m.value === treeSearch.mode.value)?.label ?? 'Key')

const searchPlaceholder = computed(() => {
  switch (treeSearch.mode.value) {
    case 'key': return t('tree.placeholderKey')
    case 'value': return t('tree.placeholderValue')
    case 'path': return t('tree.placeholderPath')
  }
})

function onSearchInput(e: Event) {
  treeSearch.query.value = (e.target as HTMLInputElement).value
}

function onEnter(e: KeyboardEvent) {
  if (e.shiftKey) treeSearch.prev()
  else treeSearch.next()
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
provide('treeSearch', treeSearch)

// Expand/collapse all signals
const allExpanded = ref(true)
const expandAllSignal = ref(0)
const collapseAllSignal = ref(0)
provide('expandAllSignal', expandAllSignal)
provide('collapseAllSignal', collapseAllSignal)

function toggleExpandAll() {
  if (allExpanded.value) {
    collapseAllSignal.value++
    allExpanded.value = false
  } else {
    expandAllSignal.value++
    allExpanded.value = true
  }
}

const handleCopy = async () => {
  emit('copy')
  copied.value = true
  setTimeout(() => {
    copied.value = false
  }, 2000)
}
</script>
