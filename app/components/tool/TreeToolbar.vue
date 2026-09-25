<template>
  <!--
    Tree browsing + search controls. Lives inside the rich view (not the panel
    header) so the header stays a short "label / view toggle / copy / download"
    row, and so the controls stay within reach while the tree scrolls.
  -->
  <button
    @click="emit('toggle-expand-all')"
    class="shrink-0 text-xs text-surface-500 hover:text-surface-700 dark:text-surface-400 dark:hover:text-surface-200 whitespace-nowrap"
  >
    {{ allExpanded ? $t('tree.collapseAll') : $t('tree.expandAll') }}
  </button>

  <div class="relative shrink-0" ref="modeDropdownRef">
    <button
      @click="toggleModeDropdown"
      class="flex items-center gap-1 rounded-lg border border-surface-200 bg-white px-2.5 py-1.5 text-xs font-medium text-surface-600 hover:bg-surface-50 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-300 dark:hover:bg-surface-700"
    >
      {{ modeLabel }}
      <Icon name="lucide:chevron-down" class="w-3 h-3" />
    </button>
    <ToolFloatingPanel v-if="showModeDropdown" :anchor-el="modeDropdownRef">
      <div class="pointer-events-auto overflow-hidden rounded-lg border border-surface-200 bg-white shadow-lg dark:border-surface-700 dark:bg-surface-800">
        <button
          v-for="m in modes"
          :key="m.value"
          @click="selectSearchMode(m.value)"
          class="block w-full text-left px-3 py-1.5 text-xs hover:bg-surface-100 dark:hover:bg-surface-700"
          :class="treeSearch.mode.value === m.value ? 'text-primary-600 dark:text-primary-400 font-medium' : 'text-surface-600 dark:text-surface-300'"
        >
          {{ m.label }}
        </button>
      </div>
    </ToolFloatingPanel>
  </div>

  <div ref="searchBoxRef" class="relative min-w-0 flex-1">
    <Icon name="lucide:search" class="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-surface-400" />
    <input
      :value="treeSearch.query.value"
      @input="onSearchInput"
      @keydown.enter.prevent="onEnter"
      @keydown.escape="treeSearch.clear()"
      @focus="showHistory = true"
      type="text"
      :placeholder="searchPlaceholder"
      class="w-full min-w-[8rem] rounded-lg border border-surface-200 bg-white pl-8 pr-14 py-1.5 text-xs dark:border-surface-700 dark:bg-surface-800 dark:text-surface-100 focus:outline-none focus:ring-1 focus:ring-primary-400"
    />
    <span v-if="treeSearch.isSearching.value" class="absolute right-2 top-1/2 -translate-y-1/2">
      <span class="block w-3.5 h-3.5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
    </span>
    <span
      v-else-if="treeSearch.query.value"
      class="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-mono"
      :class="treeSearch.totalCount.value > 0 ? 'text-surface-400' : 'text-red-400'"
    >
      {{ treeSearch.totalCount.value > 0 ? `${treeSearch.currentIndex.value + 1}/${treeSearch.totalCount.value}` : '0/0' }}
    </span>

    <ToolFloatingPanel v-if="searchPanelVisible" :anchor-el="searchBoxRef">
      <!-- Unsupported / invalid JSONPath expression -->
      <div
        v-if="treeSearch.invalidExpression.value"
        class="pointer-events-auto self-end whitespace-nowrap rounded bg-red-600 px-1.5 py-0.5 text-[10px] text-white shadow"
      >
        {{ t('largeViewer.pathInvalid') }}
      </div>

      <!-- Recent searches -->
      <div
        v-if="showHistory && treeSearch.history.value.length > 0"
        class="pointer-events-auto overflow-hidden rounded-lg border border-surface-200 bg-white shadow-lg dark:border-surface-700 dark:bg-surface-800"
      >
        <div class="flex items-center justify-between border-b border-surface-100 px-3 py-1 text-[10px] uppercase tracking-wider text-surface-400 dark:border-surface-700 dark:text-surface-500">
          <span>{{ t('search.history') }}</span>
          <button class="hover:text-surface-600 dark:hover:text-surface-300" @click="treeSearch.clearHistory()">
            {{ t('edit.clear') }}
          </button>
        </div>
        <button
          v-for="item in treeSearch.history.value"
          :key="item"
          @click="applyHistory(item)"
          class="block w-full truncate px-3 py-1.5 text-left text-xs hover:bg-surface-100 dark:hover:bg-surface-700"
        >
          {{ item }}
        </button>
      </div>
    </ToolFloatingPanel>

    <!-- Search results drawer (anchored under this bar) -->
    <div
      v-if="showResultsDrawer && results.length"
      class="absolute left-0 right-0 top-full mt-1 z-30 max-h-80 overflow-auto rounded-lg border border-surface-200 bg-white shadow-lg dark:border-surface-700 dark:bg-surface-800"
    >
      <div class="sticky top-0 flex items-center justify-between border-b border-surface-200 bg-surface-50 px-3 py-1.5 text-xs font-medium text-surface-600 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-300">
        <span>{{ t('largeViewer.results') }} ({{ results.length }})</span>
        <div class="flex items-center gap-1">
          <button
            class="rounded px-1 py-0.5 text-surface-400 hover:text-surface-600 hover:bg-surface-100 dark:hover:text-surface-300 dark:hover:bg-surface-700"
            :title="t('largeViewer.exportTxt')"
            @click="emit('export-results', 'txt')"
          >
            <Icon name="lucide:file-text" class="w-3.5 h-3.5" />
          </button>
          <button
            class="rounded px-1 py-0.5 text-surface-400 hover:text-surface-600 hover:bg-surface-100 dark:hover:text-surface-300 dark:hover:bg-surface-700"
            :title="t('largeViewer.exportJson')"
            @click="emit('export-results', 'json')"
          >
            <Icon name="lucide:file-json" class="w-3.5 h-3.5" />
          </button>
          <button
            class="rounded px-1 py-0.5 text-surface-400 hover:text-surface-600 hover:bg-surface-100 dark:hover:text-surface-300 dark:hover:bg-surface-700"
            :title="t('largeViewer.exportCsv')"
            @click="emit('export-results', 'csv')"
          >
            <Icon name="lucide:table" class="w-3.5 h-3.5" />
          </button>
          <button class="text-surface-400 hover:text-surface-600 dark:hover:text-surface-300" @click="showResultsDrawer = false">
            <Icon name="lucide:x" class="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      <button
        v-for="(item, i) in results"
        :key="item.path"
        @click="jump(item.path, i)"
        class="block w-full border-b border-surface-100 px-3 py-1.5 text-left last:border-0 hover:bg-surface-50 dark:border-surface-800 dark:hover:bg-surface-700"
      >
        <div class="flex flex-wrap items-center gap-1.5 text-xs">
          <span class="font-mono text-primary-600 dark:text-primary-400">{{ item.snippet }}</span>
          <span class="rounded bg-surface-100 px-1 text-[10px] text-surface-500 dark:bg-surface-700">{{ item.kindLabel }}</span>
          <span class="rounded bg-surface-100 px-1 text-[10px] text-surface-500 dark:bg-surface-700">{{ item.type }}</span>
          <span v-if="item.parentArray" class="rounded bg-surface-100 px-1 text-[10px] text-surface-500 dark:bg-surface-700">@{{ item.parentArray }}</span>
        </div>
        <div class="mt-0.5 truncate font-mono text-[10px] text-surface-400 dark:text-surface-500">{{ item.path }}</div>
      </button>
    </div>
  </div>

  <template v-if="treeSearch.query.value">
    <button
      @click="showResultsDrawer = !showResultsDrawer"
      :title="t('largeViewer.results')"
      class="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg border border-surface-200 bg-white text-surface-500 hover:bg-surface-50 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-400 dark:hover:bg-surface-700"
      :class="showResultsDrawer ? 'text-primary-600 dark:text-primary-400' : ''"
    >
      <Icon name="lucide:list" class="w-3.5 h-3.5" />
    </button>
    <button
      @click="treeSearch.prev()"
      :disabled="treeSearch.totalCount.value === 0"
      class="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg border border-surface-200 bg-white text-surface-500 hover:bg-surface-50 disabled:opacity-30 disabled:cursor-not-allowed dark:border-surface-700 dark:bg-surface-800 dark:text-surface-400 dark:hover:bg-surface-700"
    >
      <Icon name="lucide:chevron-up" class="w-3.5 h-3.5" />
    </button>
    <button
      @click="treeSearch.next()"
      :disabled="treeSearch.totalCount.value === 0"
      class="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg border border-surface-200 bg-white text-surface-500 hover:bg-surface-50 disabled:opacity-30 disabled:cursor-not-allowed dark:border-surface-700 dark:bg-surface-800 dark:text-surface-400 dark:hover:bg-surface-700"
    >
      <Icon name="lucide:chevron-down" class="w-3.5 h-3.5" />
    </button>
  </template>
</template>

<script setup lang="ts">
import type { useTreeSearch, SearchMode } from '~/composables/useTreeSearch'

export interface SearchResultRow {
  path: string
  snippet: string
  kindLabel: string
  type: string
  parentArray: string
}

const props = defineProps<{
  /** Search state owned by the parent panel — never re-created here. */
  treeSearch: ReturnType<typeof useTreeSearch>
  allExpanded: boolean
  results: SearchResultRow[]
}>()

const emit = defineEmits<{
  'toggle-expand-all': []
  jump: [path: string, index: number]
  'export-results': [kind: 'txt' | 'json' | 'csv']
}>()

const { t } = useI18n()

const showModeDropdown = ref(false)
const showHistory = ref(false)
const showResultsDrawer = ref(false)
const modeDropdownRef = ref<HTMLElement>()
const searchBoxRef = ref<HTMLElement>()

const modes = computed(() => [
  { value: 'all' as const, label: t('largeViewer.scopeAll') },
  { value: 'key' as const, label: t('tree.searchByKey') },
  { value: 'value' as const, label: t('tree.searchByValue') },
  { value: 'path' as const, label: t('tree.searchByPath') },
  { value: 'jsonpath' as const, label: t('tree.searchByJsonPath') },
])

const modeLabel = computed(() => modes.value.find(m => m.value === props.treeSearch.mode.value)?.label ?? 'Key')

const searchPlaceholder = computed(() => {
  switch (props.treeSearch.mode.value) {
    case 'key': return t('tree.placeholderKey')
    case 'value': return t('tree.placeholderValue')
    case 'path': return t('tree.placeholderPath')
    case 'jsonpath': return t('largeViewer.pathPlaceholder')
    default: return t('tree.placeholderKey')
  }
})

// Recent searches + invalid-path hint share the search box as their anchor.
const searchPanelVisible = computed(
  () => props.treeSearch.invalidExpression.value
    || (showHistory.value && props.treeSearch.history.value.length > 0),
)

function toggleModeDropdown() {
  showModeDropdown.value = !showModeDropdown.value
}

function selectSearchMode(value: SearchMode) {
  props.treeSearch.mode.value = value
  showModeDropdown.value = false
}

function onSearchInput(e: Event) {
  props.treeSearch.query.value = (e.target as HTMLInputElement).value
}

function onEnter(e: KeyboardEvent) {
  // Only a committed query (Enter) enters history — not every keystroke.
  props.treeSearch.rememberQuery(props.treeSearch.query.value)
  showHistory.value = false
  if (e.shiftKey) props.treeSearch.prev()
  else props.treeSearch.next()
}

function applyHistory(value: string) {
  props.treeSearch.query.value = value
  showHistory.value = false
}

function jump(path: string, index: number) {
  props.treeSearch.currentIndex.value = index
  emit('jump', path, index)
  showResultsDrawer.value = false
}

// Close the dropdown / history panel when the click lands outside them.
onMounted(() => {
  const handler = (e: MouseEvent) => {
    if (modeDropdownRef.value && !modeDropdownRef.value.contains(e.target as Node)) {
      showModeDropdown.value = false
    }
    if (searchBoxRef.value && !searchBoxRef.value.contains(e.target as Node)) {
      showHistory.value = false
    }
  }
  document.addEventListener('click', handler)
  onUnmounted(() => document.removeEventListener('click', handler))
})
</script>
