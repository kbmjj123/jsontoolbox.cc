<template>
  <!--
    Shared toolbar shell for tool panels (rich tree toolbar, table toolbar).
    `sticky` keeps the controls within reach while the content scrolls; `inset`
    pulls the bar over its parent's padding so it reads as a panel header.
  -->
  <div
    data-tool-bar
    :class="[
      'flex items-center gap-2 px-2 py-1.5',
      sticky
        ? 'sticky top-0 z-20 border-b border-surface-200 bg-surface-50/90 backdrop-blur rounded-t-xl dark:border-surface-700 dark:bg-surface-800/90'
        : 'border-b border-surface-200 bg-surface-50 dark:bg-surface-800 dark:border-surface-700',
    ]"
  >
    <slot />
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  /** Pin the bar to the top of the surrounding scroll container. */
  sticky?: boolean
}>(), {
  sticky: false,
})
</script>
