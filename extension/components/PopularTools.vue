<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { ArrowUpRight, Wrench } from 'lucide-vue-next'
import { useExtensionOptions } from '../composables/useExtensionOptions'
import { POPULAR_TOOLS, allToolsUrl, toolUrl } from '../utils/popularTools'
import type { AppLocale } from '../utils/options'
import type { PopularTool } from '../utils/popularTools'

const { t } = useI18n()
const { options } = useExtensionOptions()

const locale = computed<AppLocale>(() => options.value.locale)
const label = (tool: PopularTool): string => (locale.value === 'zh' ? tool.zh : tool.en)
const href = (tool: PopularTool): string => toolUrl(tool, locale.value)
const allHref = computed<string>(() => allToolsUrl(locale.value))
</script>

<template>
  <section class="card flex flex-col gap-1.5 p-3">
    <h2 class="mb-0.5 text-xs font-bold text-surface-700 dark:text-surface-200">
      {{ t('tools.title') }}
    </h2>

    <!-- All links point at real site tool pages; the popup hosts no tools itself. -->
    <a
      v-for="tool in POPULAR_TOOLS"
      :key="tool.slug"
      :href="href(tool)"
      target="_blank"
      rel="noopener"
      class="btn-ghost w-full !justify-start !px-2.5 !py-1.5"
    >
      <Wrench :size="13" />
      <span>{{ label(tool) }}</span>
      <ArrowUpRight :size="12" class="ml-auto opacity-60" />
    </a>

    <a :href="allHref" target="_blank" rel="noopener" class="btn-primary mt-1 w-full">
      {{ t('tools.viewAll') }} →
    </a>
  </section>
</template>
