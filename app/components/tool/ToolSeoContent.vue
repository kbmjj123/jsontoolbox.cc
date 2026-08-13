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

    <!-- Article -->
    <section v-if="tool.article?.content" class="prose prose-surface dark:prose-invert max-w-none">
      <h2 v-if="tool.article.title" class="mb-4 text-lg font-bold text-surface-900 dark:text-surface-100">
        {{ tool.article.title }}
      </h2>
      <div v-html="tool.article.content" class="text-surface-700 dark:text-surface-300"></div>
      <div v-if="tool.article.links?.length" class="mt-6 flex flex-wrap gap-4">
        <NuxtLinkLocale
          v-for="link in tool.article.links"
          :key="link.url"
          :to="link.url"
          class="text-primary-600 hover:text-primary-700 dark:text-primary-400 text-sm"
        >
          {{ link.text }} →
        </NuxtLinkLocale>
      </div>
    </section>

    <!-- Related Tools -->
    <section v-if="tool.nextSteps?.length || tool.recommends?.length">
      <ToolRelated
        :next-steps="tool.nextSteps"
        :recommends="tool.recommends"
        :current-slug="tool.slug"
      />
    </section>

		<!-- FAQ -->
    <section v-if="tool.faq?.length">
      <h2 class="mb-4 text-lg font-bold text-surface-900 dark:text-surface-100">
        {{ $t('tool.faq_title') }}
      </h2>
      <ToolFaq :faq="tool.faq" />
    </section>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  tool: ProcessedTool
}>()
</script>
