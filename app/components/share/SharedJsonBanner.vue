<template>
  <Transition name="warning">
    <div
      v-if="visible"
      class="flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2.5 dark:border-blue-800 dark:bg-blue-900/20"
    >
      <Icon name="lucide:link" class="w-4 h-4 shrink-0 text-blue-600 dark:text-blue-400" />
      <div class="flex-1 min-w-0">
        <p class="text-xs font-medium text-blue-700 dark:text-blue-300">
          {{ $t('share.sharedBanner') }}
        </p>
        <p class="text-[11px] text-blue-500 dark:text-blue-400 mt-0.5">
          {{ title ? `${title} — ` : '' }}{{ $t('share.sharedBannerDescription') }}
        </p>
      </div>
      <button
        @click="$emit('edit-copy')"
        class="shrink-0 px-3 py-1 text-xs font-medium text-blue-600 dark:text-blue-300 border border-blue-300 dark:border-blue-700 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-800/30 transition-colors"
      >
        {{ $t('share.editCopy') }}
      </button>
      <button
        @click="visible = false"
        class="shrink-0 text-blue-400 hover:text-blue-600 dark:text-blue-500 dark:hover:text-blue-300"
      >
        <Icon name="lucide:x" class="w-3.5 h-3.5" />
      </button>
    </div>
  </Transition>
</template>

<script setup lang="ts">
defineProps<{
  title?: string
  source?: string
}>()

defineEmits<{
  'edit-copy': []
}>()

const visible = ref(true)
</script>
