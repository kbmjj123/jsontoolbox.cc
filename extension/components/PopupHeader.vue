<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { Braces, ExternalLink } from 'lucide-vue-next'
import { SITE_URL } from '../utils/constants'

const { t } = useI18n()
</script>

<template>
  <header class="flex items-center gap-2 border-b border-surface-200 pb-2.5 dark:border-surface-700">
    <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-600 text-white">
      <Braces :size="18" />
    </div>

    <div class="min-w-0 flex-1">
      <div class="truncate text-sm font-bold leading-tight text-surface-900 dark:text-surface-100">
        {{ t('app.name') }}
      </div>
      <div class="truncate text-[10px] leading-tight text-surface-500">
        {{ t('app.tagline') }}
      </div>
    </div>

    <a
      :href="SITE_URL"
      target="_blank"
      rel="noopener"
      class="btn-ghost !px-2 !py-1.5"
      :title="t('action.openSite')"
      :aria-label="t('action.openSite')"
    >
      <ExternalLink :size="14" />
    </a>
  </header>
</template>
