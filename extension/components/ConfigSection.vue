<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useExtensionOptions } from '../composables/useExtensionOptions'
import type { AppLocale, EditorView, IndentOption, ThemeOption } from '../utils/options'

const { t } = useI18n()
const { options, update } = useExtensionOptions()

// Explicit computeds (no generic arrow helper — `<K extends …>` is ambiguous
// inside a .vue <script setup> block).
const indent = computed({
  get: () => String(options.value.indent),
  set: (value: string) => void update({ indent: (value === 'tab' ? 'tab' : Number(value)) as IndentOption }),
})
const theme = computed({
  get: () => options.value.theme,
  set: (value: string) => void update({ theme: value as ThemeOption }),
})
const locale = computed({
  get: () => options.value.locale,
  set: (value: string) => void update({ locale: value as AppLocale }),
})
const view = computed({
  get: () => options.value.view,
  set: (value: string) => void update({ view: value as EditorView }),
})
const auto = computed({
  get: () => options.value.auto,
  set: (value: boolean) => void update({ auto: value }),
})
const imagePreview = computed({
  get: () => options.value.imagePreview,
  set: (value: boolean) => void update({ imagePreview: value }),
})
</script>

<template>
  <section class="card flex flex-col gap-2.5 p-3">
    <h2 class="text-xs font-bold text-surface-700 dark:text-surface-200">
      {{ t('config.title') }}
    </h2>

    <label class="flex items-center justify-between gap-3 text-xs font-medium">
      <span>{{ t('options.indent') }}</span>
      <select v-model="indent" class="input-field !w-36 !py-1.5">
        <option value="2">2</option>
        <option value="4">4</option>
        <option value="tab">Tab</option>
      </select>
    </label>

    <label class="flex items-center justify-between gap-3 text-xs font-medium">
      <span>{{ t('options.theme') }}</span>
      <select v-model="theme" class="input-field !w-36 !py-1.5">
        <option value="auto">{{ t('options.themeAuto') }}</option>
        <option value="light">{{ t('options.themeLight') }}</option>
        <option value="dark">{{ t('options.themeDark') }}</option>
      </select>
    </label>

    <label class="flex items-center justify-between gap-3 text-xs font-medium">
      <span>{{ t('options.locale') }}</span>
      <select v-model="locale" class="input-field !w-36 !py-1.5">
        <option value="en">English</option>
        <option value="zh">中文</option>
      </select>
    </label>

    <label class="flex items-center justify-between gap-3 text-xs font-medium">
      <span>{{ t('options.view') }}</span>
      <select v-model="view" class="input-field !w-36 !py-1.5">
        <option value="both">{{ t('options.viewBoth') }}</option>
        <option value="editor">{{ t('options.viewEditor') }}</option>
        <option value="tree">{{ t('options.viewTree') }}</option>
        <option value="table">{{ t('options.viewTable') }}</option>
      </select>
    </label>

    <label class="flex items-center justify-between gap-3 text-xs font-medium">
      <span>{{ t('config.auto') }}</span>
      <input v-model="auto" type="checkbox" class="h-4 w-4 accent-primary-600" />
    </label>
    <p class="text-[10px] leading-snug text-surface-500">
      {{ t('config.autoHint') }}
    </p>

    <label class="flex items-center justify-between gap-3 text-xs font-medium">
      <span>{{ t('config.imagePreview') }}</span>
      <input v-model="imagePreview" type="checkbox" class="h-4 w-4 accent-primary-600" />
    </label>
    <p class="text-[10px] leading-snug text-surface-500">
      {{ t('config.imagePreviewHint') }}
    </p>
  </section>
</template>
