<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { ShieldCheck } from 'lucide-vue-next'
import { SITE_URL } from '../utils/constants'

const { t } = useI18n()
</script>

<template>
  <footer class="flex flex-col gap-1.5 border-t border-surface-200 pt-2.5 dark:border-surface-700">
    <p class="flex items-start gap-1.5 text-[11px] leading-snug text-surface-500">
      <ShieldCheck :size="13" class="mt-px shrink-0" />
      <span>{{ t('privacy.label') }}</span>
    </p>
    <a
      :href="SITE_URL"
      target="_blank"
      rel="noopener"
      class="text-[11px] font-semibold text-primary-600 hover:underline dark:text-primary-400"
    >
      {{ t('action.openSite') }} →
    </a>
  </footer>
</template>
