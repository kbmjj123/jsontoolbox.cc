<template>
  <button
    @click="toggleDark()"
    class="flex h-8 w-8 items-center justify-center rounded-lg text-surface-500 hover:bg-surface-100 hover:text-surface-900 dark:text-surface-400 dark:hover:bg-surface-800 dark:hover:text-surface-100 transition-colors"
    :aria-label="$t('nav.toggle_theme')"
  >
    <Icon :name="isDark ? 'lucide:sun' : 'lucide:moon'" class="h-4 w-4" />
  </button>
</template>

<script setup lang="ts">
const colorMode = useColorMode()
const isDark = computed(() => colorMode.value === 'dark')

const toggleDark = () => {
  colorMode.preference = isDark.value ? 'light' : 'dark'
}
</script>
