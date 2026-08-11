<template>
  <div class="space-y-10">
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

    <!-- Related Tools (推荐工具) -->
    <section v-if="tool.nextSteps?.length">
      <h2 class="mb-4 text-lg font-bold text-surface-900 dark:text-surface-100">
        {{ $t('tool.related_title') }}
      </h2>
      <ToolRelated
        :tools="tool.nextSteps"
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
