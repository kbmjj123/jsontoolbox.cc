<template>
  <aside v-if="links?.length" class="hidden xl:block xl:w-64 xl:shrink-0">
    <div class="sticky top-24 space-y-3">
      <h4 class="text-sm font-bold uppercase tracking-wider text-surface-900 dark:text-surface-100">
        {{ $t('blog.toc') || 'On This Page' }}
      </h4>
      <nav class="space-y-1">
        <a
          v-for="link in links"
          :key="link.id"
          :href="`#${link.id}`"
          :class="[
            'block text-sm leading-snug transition-colors hover:text-primary-600 dark:hover:text-primary-400',
            link.depth === 2 ? 'font-medium text-surface-700 dark:text-surface-300' : 'pl-3 text-surface-500 dark:text-surface-400'
          ]"
        >
          {{ link.text }}
        </a>
      </nav>
    </div>
  </aside>
</template>

<script setup lang="ts">
interface TocLink {
  id: string
  text: string
  depth: number
}

defineProps<{
  links?: TocLink[]
}>()
</script>
