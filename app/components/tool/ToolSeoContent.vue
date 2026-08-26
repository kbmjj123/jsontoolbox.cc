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

    <!-- Static Example -->
    <section v-if="tool.example">
      <h2 class="mb-4 text-lg font-bold text-surface-900 dark:text-surface-100">
        {{ tool.example.title }}
      </h2>
      <p v-if="tool.example.description" class="mb-5 text-sm text-surface-600 dark:text-surface-400">
        {{ tool.example.description }}
      </p>

      <!-- Input -->
      <div class="mb-4">
        <div class="mb-1 text-xs font-bold text-surface-500 dark:text-surface-400">
          {{ tool.example.inputLabel || $t('tool.example_input') }}
        </div>
        <pre class="rounded-xl border border-surface-200 bg-surface-50 p-4 font-mono text-xs overflow-auto dark:border-surface-700 dark:bg-surface-800 text-surface-800 dark:text-surface-200">{{ tool.example.input }}</pre>
        <p v-if="tool.example.inputExplanation" class="mt-2 text-xs text-surface-500 dark:text-surface-400">
          {{ tool.example.inputExplanation }}
        </p>
      </div>

      <!-- Output -->
      <div class="mb-4">
        <div class="mb-1 text-xs font-bold text-surface-500 dark:text-surface-400">
          {{ tool.example.outputLabel || $t('tool.example_output') }}
        </div>
        <pre class="rounded-xl border border-surface-200 bg-surface-50 p-4 font-mono text-xs overflow-auto dark:border-surface-700 dark:bg-surface-800 text-surface-800 dark:text-surface-200">{{ tool.example.output }}</pre>
        <p v-if="tool.example.outputExplanation" class="mt-2 text-xs text-surface-500 dark:text-surface-400">
          {{ tool.example.outputExplanation }}
        </p>
      </div>

      <!-- Note -->
      <p v-if="tool.example.note" class="text-xs text-surface-500 dark:text-surface-400">
        {{ tool.example.note }}
      </p>
    </section>

    <!-- Article -->
    <section v-if="tool.article?.content" class="prose prose-surface dark:prose-invert max-w-none">
      <h2 v-if="tool.article.title" class="mb-4 text-lg font-bold text-surface-900 dark:text-surface-100">
        {{ tool.article.title }}
      </h2>
      <div v-html="tool.article.content" class="text-surface-700 dark:text-surface-300"></div>
      <div v-if="articleLinks.length" class="mt-6 flex flex-wrap gap-4">
        <NuxtLinkLocale
          v-for="link in articleLinks"
          :key="link.path"
          :to="link.path"
          class="text-primary-600 hover:text-primary-700 dark:text-primary-400 text-sm"
        >
          {{ link.name }} →
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
const props = defineProps<{
  tool: ProcessedTool
}>()

const { getToolBySingleSlug } = useTools()

// Derive article links from nextSteps + recommends (no need to maintain article.links in JSON)
const articleLinks = computed(() => {
  const slugs = [...(props.tool.nextSteps || []), ...(props.tool.recommends || [])]
  return slugs
    .map(slug => getToolBySingleSlug(slug))
    .filter(t => t && t.slug !== props.tool.slug)
    .map(t => ({ name: t!.name, path: t!.path }))
})
</script>
