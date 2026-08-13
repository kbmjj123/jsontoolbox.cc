<template>
  <div ref="containerRef" class="flex overflow-hidden" :class="direction === 'horizontal' ? 'flex-row' : 'flex-col'">
    <!-- Left / Top panel -->
    <div :style="firstStyle" class="min-w-0 min-h-0 overflow-hidden">
      <slot name="first" />
    </div>

    <!-- Drag handle -->
    <div
      class="flex-none flex items-center justify-center group"
      :class="direction === 'horizontal' ? 'w-3 cursor-col-resize' : 'h-3 cursor-row-resize'"
      @mousedown="onDragStart"
      @touchstart.passive="onTouchStart"
    >
      <div
        class="rounded-full transition-colors"
        :class="[
          dragging ? 'bg-primary-500' : 'bg-surface-300 group-hover:bg-primary-400 dark:bg-surface-600 dark:group-hover:bg-primary-500',
          direction === 'horizontal' ? 'w-1 h-8' : 'h-1 w-8'
        ]"
      />
    </div>

    <!-- Right / Bottom panel -->
    <div class="min-w-0 min-h-0 flex-1 overflow-hidden">
      <slot name="second" />
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  direction?: 'horizontal' | 'vertical'
  initialRatio?: number
  minFirst?: string
  minSecond?: string
}

const props = withDefaults(defineProps<Props>(), {
  direction: 'horizontal',
  initialRatio: 0.5,
  minFirst: '200px',
  minSecond: '200px',
})

const containerRef = ref<HTMLDivElement>()
const ratio = ref(props.initialRatio)
const dragging = ref(false)

const firstStyle = computed(() => {
  const size = `${ratio.value * 100}%`
  return props.direction === 'horizontal'
    ? { width: size, minWidth: props.minFirst }
    : { height: size, minHeight: props.minFirst }
})

const onDragStart = (e: MouseEvent) => {
  e.preventDefault()
  dragging.value = true
  document.addEventListener('mousemove', onDragMove)
  document.addEventListener('mouseup', onDragEnd)
}

const onDragMove = (e: MouseEvent) => {
  if (!containerRef.value || !dragging.value) return
  updateRatio(e.clientX, e.clientY)
}

const onDragEnd = () => {
  dragging.value = false
  document.removeEventListener('mousemove', onDragMove)
  document.removeEventListener('mouseup', onDragEnd)
}

const onTouchStart = (e: TouchEvent) => {
  dragging.value = true
  document.addEventListener('touchmove', onTouchMove, { passive: true })
  document.addEventListener('touchend', onTouchEnd)
}

const onTouchMove = (e: TouchEvent) => {
  if (!containerRef.value || !dragging.value) return
  const touch = e.touches[0]
  updateRatio(touch.clientX, touch.clientY)
}

const onTouchEnd = () => {
  dragging.value = false
  document.removeEventListener('touchmove', onTouchMove)
  document.removeEventListener('touchend', onTouchEnd)
}

const updateRatio = (clientX: number, clientY: number) => {
  if (!containerRef.value) return
  const rect = containerRef.value.getBoundingClientRect()

  if (props.direction === 'horizontal') {
    const offset = clientX - rect.left
    ratio.value = Math.max(0.15, Math.min(0.85, offset / rect.width))
  } else {
    const offset = clientY - rect.top
    ratio.value = Math.max(0.15, Math.min(0.85, offset / rect.height))
  }
}
</script>
