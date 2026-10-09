<template>
  <JsonEditor
    :model-value="modelValue"
    @update:model-value="emit('update:modelValue', $event)"
    :view="view"
    @update:view="emit('update:view', $event)"
    :theme="editorTheme"
    :locale="editorLocale"
    :height="height"
    :attribution="attribution"
    :attribution-url="attributionUrl"
  />
</template>

<script setup lang="ts">
import { JsonEditor } from '@kbmjj123/json-editor'
import type { JsonEditorView } from '@kbmjj123/json-editor/vue'

const props = defineProps<{
  modelValue: string
  view?: JsonEditorView
  height?: string
  attribution?: boolean
  attributionUrl?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'update:view': [view: JsonEditorView]
}>()

const { locale } = useI18n()
const colorMode = useColorMode()

const editorLocale = computed(() => (locale.value === 'zh' ? 'zh' : 'en'))
const editorTheme = computed(() =>
  colorMode.value === 'dark' ? 'dark' : 'light'
)
</script>
