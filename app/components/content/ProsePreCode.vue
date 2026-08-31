<template>
  <code :class="['prose-code', language]">
    <slot />
  </code>
</template>

<script setup>
defineProps({
  language: {
    type: String,
    default: 'plaintext'
  },
  filename: {
    type: String,
    default: null
  },
  highlights: {
    type: Array,
    default: () => []
  }
})
</script>
