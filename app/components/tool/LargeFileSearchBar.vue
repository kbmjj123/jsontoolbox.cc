<template>
  <div class="flex flex-wrap items-center gap-2">
    <!-- query -->
    <div class="relative min-w-[180px] flex-1">
      <Icon
        name="lucide:search"
        class="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400"
      />
      <input
        :value="query"
        type="text"
        :placeholder="t('largeViewer.searchPlaceholder')"
        class="lf-input w-full !pl-8"
        @input="emit('update:query', ($event.target as HTMLInputElement).value)"
        @keyup.enter="emit('search')"
      />
    </div>

    <!-- scope -->
    <select
      :value="scope"
      class="lf-select"
      @change="emit('update:scope', ($event.target as HTMLSelectElement).value as Scope)"
    >
      <option value="all">{{ t('largeViewer.scopeAll') }}</option>
      <option value="value">{{ t('largeViewer.scopeValue') }}</option>
      <option value="key">{{ t('largeViewer.scopeKey') }}</option>
      <option value="path">{{ t('largeViewer.scopePath') }}</option>
    </select>

    <!-- case sensitive -->
    <button
      type="button"
      :title="t('largeViewer.caseSensitive')"
      class="lf-btn-ghost font-semibold"
      :class="caseSensitive ? 'active' : ''"
      @click="emit('update:caseSensitive', !caseSensitive)"
    >
      Aa
    </button>

    <!-- regex toggle -->
    <button
      type="button"
      :title="t('largeViewer.regex')"
      class="lf-btn-ghost font-mono font-semibold"
      :class="regex ? 'active' : ''"
      @click="emit('update:regex', !regex)"
    >
      .*
    </button>

    <!-- prev / next -->
    <div class="flex shrink-0 items-center gap-1">
      <button
        type="button"
        class="lf-btn-icon"
        :disabled="hitCount === 0"
        :title="t('largeViewer.prev')"
        @click="emit('prev')"
      >
        <Icon name="lucide:chevron-up" class="h-4 w-4" />
      </button>
      <span class="min-w-[3.5rem] text-center text-xs tabular-nums text-surface-500 dark:text-surface-400">
        {{ hitCount ? `${currentIndex + 1}/${hitCount}` : '–' }}
      </span>
      <button
        type="button"
        class="lf-btn-icon"
        :disabled="hitCount === 0"
        :title="t('largeViewer.next')"
        @click="emit('next')"
      >
        <Icon name="lucide:chevron-down" class="h-4 w-4" />
      </button>
    </div>

    <!-- search / cancel -->
    <button
      type="button"
      class="lf-btn-primary"
      :title="searching ? t('largeViewer.cancel') : t('largeViewer.search')"
      @click="searching ? emit('cancel') : emit('search')"
    >
      <Icon v-if="searching" name="lucide:loader-circle" class="h-4 w-4 animate-spin" />
      <Icon v-else name="lucide:search" class="h-4 w-4" />
      {{ searching ? t('largeViewer.cancel') : t('largeViewer.search') }}
    </button>
  </div>

  <!-- regex validation feedback (live) -->
  <p
    v-if="regexError"
    class="w-full text-xs text-red-600 dark:text-red-400"
  >
    {{ regexError }}
  </p>
</template>

<script setup lang="ts">
import { validateRegex } from '~/utils/textSearch'

type Scope = 'key' | 'value' | 'path' | 'all'

const props = defineProps<{
  query: string
  scope: Scope
  caseSensitive: boolean
  regex: boolean
  searching: boolean
  hitCount: number
  currentIndex: number
}>()

const emit = defineEmits<{
  'update:query': [value: string]
  'update:scope': [value: Scope]
  'update:caseSensitive': [value: boolean]
  'update:regex': [value: boolean]
  search: []
  cancel: []
  prev: []
  next: []
}>()

const { t } = useI18n()

/** Live regex syntax/complexity feedback shown as the user types. */
const regexError = computed(() => {
  if (!props.regex || !props.query) return ''
  const v = validateRegex(props.query, props.caseSensitive ? '' : 'i')
  if (v.ok) return ''
  return v.error === 'regexTooComplex'
    ? t('largeViewer.regexTooComplex')
    : (v.error || t('largeViewer.regexInvalid'))
})
</script>
