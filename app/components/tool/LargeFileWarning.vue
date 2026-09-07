<template>
  <Modal :show="visible" size="sm" @close="emit('cancel')">
    <div class="p-6">
      <div class="flex items-center gap-3 mb-4">
        <div class="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
          <Icon name="lucide:alert-triangle" class="w-5 h-5 text-amber-600 dark:text-amber-400" />
        </div>
        <h3 class="text-lg font-semibold text-surface-900 dark:text-surface-100">
          {{ $t('largeFile.warning_title') }}
        </h3>
      </div>

      <p class="text-sm text-surface-600 dark:text-surface-400 mb-6">
        {{ $t('largeFile.warning_desc', { size: formattedSize }) }}
      </p>

      <div class="flex flex-col gap-2">
        <button
          @click="emit('continue')"
          class="w-full rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 transition-colors"
        >
          {{ $t('largeFile.continue') }}
        </button>
        <button
          @click="emit('parse-partial')"
          class="w-full rounded-lg border border-surface-200 bg-white px-4 py-2.5 text-sm font-medium text-surface-700 hover:bg-surface-50 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-300 dark:hover:bg-surface-700 transition-colors"
        >
          {{ $t('largeFile.parse_partial') }}
        </button>
        <button
          @click="emit('cancel')"
          class="w-full rounded-lg px-4 py-2 text-sm text-surface-500 hover:text-surface-700 dark:text-surface-400 dark:hover:text-surface-200 transition-colors"
        >
          {{ $t('largeFile.cancel') }}
        </button>
      </div>
    </div>
  </Modal>
</template>

<script setup lang="ts">
defineProps<{
  visible: boolean
  formattedSize: string
}>()

const emit = defineEmits<{
  continue: []
  'parse-partial': []
  cancel: []
}>()
</script>
