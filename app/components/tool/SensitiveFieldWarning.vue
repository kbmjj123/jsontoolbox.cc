<template>
  <Transition name="warning">
    <div
      v-if="fields.length > 0"
      class="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-400"
    >
      <Icon name="lucide:shield-alert" class="w-4 h-4 shrink-0 mt-0.5" />
      <div class="flex-1 min-w-0">
        <p class="font-bold">{{ $t('privacy_notice.sensitive_title') }}</p>
        <p class="mt-0.5">
          {{ sensitiveDescription }}
        </p>
      </div>
      <button
        @click="$emit('dismiss')"
        class="shrink-0 text-amber-400 hover:text-amber-600 dark:text-amber-500 dark:hover:text-amber-300"
      >
        <Icon name="lucide:x" class="w-3.5 h-3.5" />
      </button>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import type { SensitiveField } from '~/composables/useSensitiveFieldDetection'

const props = defineProps<{
  fields: SensitiveField[]
}>()

defineEmits<{
  dismiss: []
}>()

const { t } = useI18n()

const sensitiveDescription = computed(() => {
  // Show up to 3 field names
  const fieldNames = [...new Set(props.fields.map(f => f.key))].slice(0, 3)
  const fieldsStr = fieldNames.join(', ')
  return t('privacy_notice.sensitive_description', { fields: fieldsStr })
})
</script>
