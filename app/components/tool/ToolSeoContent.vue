<template>
  <div class="space-y-10">
    <!-- Privacy Trust Badge
    <div
      v-if="tool.hero?.trustHtml"
      class="flex items-center gap-2 rounded-full border border-accent-200 bg-accent-50 px-4 py-2 text-xs font-medium text-accent-700 dark:border-accent-800 dark:bg-accent-900/30 dark:text-accent-400"
    >
      <Icon name="lucide:shield-check" class="h-3.5 w-3.5" />
      <span>{{ tool.hero.trustHtml }}</span>
    </div> -->

    <!-- Features -->
    <section v-if="tool.features?.length">
      <h2 class="mb-4 text-lg font-bold text-surface-900 dark:text-surface-100">
        {{ $t('tool.features_title') }}
      </h2>
      <ToolFeatures :features="tool.features" />
    </section>

    <!-- Guide -->
    <section v-if="tool.guide?.length">
      <h2 class="mb-4 text-lg font-bold text-surface-900 dark:text-surface-100">
        {{ $t('tool.guide_title') }}
      </h2>
      <ToolGuide :guide="tool.guide" />
    </section>

    <!-- FAQ -->
    <section v-if="tool.faq?.length">
      <h2 class="mb-4 text-lg font-bold text-surface-900 dark:text-surface-100">
        {{ $t('tool.faq_title') }}
      </h2>
      <ToolFaq :faq="tool.faq" />
    </section>

    <!-- Related Tools -->
    <section v-if="tool.nextSteps?.length || tool.recommends?.length">
      <ToolRelated
        :next-steps="tool.nextSteps"
        :recommends="tool.recommends"
        :current-slug="tool.slug"
      />
    </section>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  tool: ProcessedTool
}>()
</script>
