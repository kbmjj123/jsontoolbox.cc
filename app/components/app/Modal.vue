<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="show" class="fixed inset-0 z-[100] flex items-center justify-center p-4" @click.self="$emit('close')">
        <div class="fixed inset-0 bg-black/50 backdrop-blur-sm" @click="$emit('close')"></div>
        <div class="relative w-full rounded-2xl bg-white shadow-xl dark:bg-surface-900" :class="sizeClass">
          <slot />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  show: boolean
  size?: 'sm' | 'md' | 'lg' | 'xl'
}>(), {
  size: 'md'
})

defineEmits<{
  close: []
}>()

const sizeClass = computed(() => {
  const sizes: Record<string, string> = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  }
  return sizes[props.size] || sizes.md
})
</script>
