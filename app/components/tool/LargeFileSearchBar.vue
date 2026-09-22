<template>
  <div class="flex flex-wrap items-center gap-2">
    <!-- query -->
    <div class="relative flex-1 min-w-[180px]">
      <Icon
        name="lucide:search"
        class="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400"
      />
      <input
        :value="query"
        type="text"
        :placeholder="t('largeViewer.searchPlaceholder')"
        class="w-full rounded-lg border border-surface-200 bg-white py-2 pl-8 pr-3 text-sm text-surface-800 placeholder-surface-400 focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-100"
        @input="emit('update:query', ($event.target as HTMLInputElement).value)"
        @keyup.enter="emit('search')"
      />
    </div>

    <!-- scope -->
    <select
      :value="scope"
      class="rounded-lg border border-surface-200 bg-white px-2 py-2 text-sm text-surface-700 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-200"
      @change="emit('update:scope', ($event.target as HTMLSelectElement).value as Scope)"
    >
      <option value="value">{{ t('largeViewer.scopeValue') }}</option>
      <option value="key">{{ t('largeViewer.scopeKey') }}</option>
      <option value="path">{{ t('largeViewer.scopePath') }}</option>
    </select>

    <!-- case sensitive -->
    <button
      type="button"
      :title="t('largeViewer.caseSensitive')"
      class="rounded-lg border px-2.5 py-2 text-sm font-semibold transition-colors"
      :class="caseSensitive
        ? 'border-primary-400 bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300 dark:border-primary-500'
        : 'border-surface-200 text-surface-500 hover:text-surface-700 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-400'"
      @click="emit('update:caseSensitive', !caseSensitive)"
    >
      Aa
    </button>

    <!-- prev / next -->
    <div class="flex items-center rounded-lg border border-surface-200 dark:border-surface-700">
      <button
        type="button"
        class="px-2 py-2 text-surface-500 hover:text-surface-800 disabled:opacity-40 dark:text-surface-400 dark:hover:text-surface-100"
        :disabled="hitCount === 0"
        :title="t('largeViewer.prev')"
        @click="emit('prev')"
      >
        <Icon name="lucide:chevron-up" class="w-4 h-4" />
      </button>
      <span class="px-1 text-xs tabular-nums text-surface-500 dark:text-surface-400">
        {{ hitCount ? `${currentIndex + 1}/${hitCount}` : '–' }}
      </span>
      <button
        type="button"
        class="px-2 py-2 text-surface-500 hover:text-surface-800 disabled:opacity-40 dark:text-surface-400 dark:hover:text-surface-100"
        :disabled="hitCount === 0"
        :title="t('largeViewer.next')"
        @click="emit('next')"
      >
        <Icon name="lucide:chevron-down" class="w-4 h-4" />
      </button>
    </div>

    <!-- search / cancel -->
    <button
      v-if="searching"
      type="button"
      class="rounded-lg border border-surface-200 px-3 py-2 text-sm text-surface-600 hover:bg-surface-100 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-300"
      @click="emit('cancel')"
    >
      {{ t('largeViewer.cancel') }}
    </button>
    <button
      v-else
      type="button"
      class="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600"
      @click="emit('search')"
    >
      {{ t('largeViewer.search') }}
    </button>
  </div>
</template>

<script setup lang="ts">
type Scope = 'key' | 'value' | 'path'

defineProps<{
  query: string
  scope: Scope
  caseSensitive: boolean
  searching: boolean
  hitCount: number
  currentIndex: number
}>()

const emit = defineEmits<{
  'update:query': [value: string]
  'update:scope': [value: Scope]
  'update:caseSensitive': [value: boolean]
  search: []
  cancel: []
  prev: []
  next: []
}>()

const { t } = useI18n()
</script>
