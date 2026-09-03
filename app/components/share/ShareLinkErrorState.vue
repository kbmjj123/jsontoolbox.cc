<template>
  <div class="flex flex-col items-center gap-4 py-12 px-4">
    <div class="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
      <Icon name="lucide:alert-triangle" class="w-6 h-6 text-red-600 dark:text-red-400" />
    </div>

    <div class="text-center space-y-2">
      <h3 class="text-sm font-bold text-surface-900 dark:text-surface-100">
        {{ $t('share.invalidLinkTitle') }}
      </h3>
      <p class="text-xs text-surface-500 dark:text-surface-400 max-w-sm">
        {{ description }}
      </p>
      <p v-if="detail" class="text-[11px] text-surface-400 dark:text-surface-500 max-w-sm font-mono">
        {{ detail }}
      </p>
    </div>

    <div class="flex items-center gap-3">
      <button
        @click="$emit('open-empty')"
        class="px-4 py-1.5 text-xs font-medium text-surface-600 dark:text-surface-300 border border-surface-200 dark:border-surface-600 rounded-lg hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors"
      >
        {{ $t('share.openEmpty') }}
      </button>
      <button
        @click="$emit('paste-manual')"
        class="btn-primary px-4 py-1.5 text-xs"
      >
        {{ $t('share.pasteManually') }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { LoadFailureReason } from '~/composables/useSharedPayloadLoader'

const props = defineProps<{
  reason: LoadFailureReason
  detail?: string
}>()

defineEmits<{
  'open-empty': []
  'paste-manual': []
}>()

const { t } = useI18n()

const description = computed(() => {
  switch (props.reason) {
    case 'invalid_header':
    case 'decode_error':
      return t('share.invalidLinkDescription')
    case 'too_large':
      return t('share.linkTooLargeDescription')
    case 'unsupported':
      return t('share.unsupportedVersion')
    case 'invalid_payload':
      return t('share.invalidPayloadDescription')
    default:
      return t('share.invalidLinkDescription')
  }
})
</script>
