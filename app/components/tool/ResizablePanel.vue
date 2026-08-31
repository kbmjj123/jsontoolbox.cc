<template>
  <div
    ref="containerRef"
    class="rp-container"
    :class="[
      responsive && 'rp-responsive',
      isFullscreen ? 'fixed inset-0 z-50 bg-white dark:bg-surface-900 p-4 rp-fullscreen' : '',
      containerClass
    ]"
  >
    <!-- Header bar -->
    <div class="flex items-center justify-between mb-2">
      <slot name="header-left" />
      <div class="flex-1 flex justify-center">
        <Transition name="esc-hint">
          <span
            v-if="isFullscreen"
            class="text-xs text-surface-400 dark:text-surface-500 bg-surface-100 dark:bg-surface-800 px-3 py-1 rounded-full"
          >
            Press ESC to exit fullscreen
          </span>
        </Transition>
      </div>
      <slot name="header-right">
        <button
          @click="isFullscreen = !isFullscreen"
          class="rp-fullscreen-btn text-surface-400 hover:text-surface-600 dark:text-surface-500 dark:hover:text-surface-300"
          :title="isFullscreen ? 'Exit fullscreen' : 'Fullscreen'"
        >
          <Icon :name="isFullscreen ? 'lucide:minimize' : 'lucide:maximize'" class="w-4 h-4" />
        </button>
      </slot>
    </div>

    <!-- Resizable panels -->
    <div class="rp-panels" :class="effectiveDirection === 'horizontal' ? 'rp-panels-h' : 'rp-panels-v'">
      <!-- Left / Top panel -->
      <div :style="firstStyle" class="min-w-0 min-h-0 overflow-hidden rp-panel-first">
        <slot name="first" />
      </div>

      <!-- Drag handle (hidden on mobile via CSS) -->
      <div
        class="rp-handle flex-none flex items-center justify-center group"
        :class="effectiveDirection === 'horizontal' ? 'w-3 cursor-col-resize' : 'h-3 cursor-row-resize'"
        @mousedown="onDragStart"
        @touchstart.passive="onTouchStart"
      >
        <div
          class="rounded-full transition-colors"
          :class="[
            dragging ? 'bg-primary-500' : 'bg-surface-300 group-hover:bg-primary-400 dark:bg-surface-600 dark:group-hover:bg-primary-500',
            effectiveDirection === 'horizontal' ? 'w-1 h-8' : 'h-1 w-8'
          ]"
        />
      </div>

      <!-- Right / Bottom panel -->
      <div class="min-w-0 min-h-0 overflow-hidden rp-panel-second">
        <slot name="second" />
      </div>
    </div>

    <!-- Bottom toolbar -->
    <div class="mt-3 flex items-center flex-wrap gap-2">
      <slot name="toolbar-left" />
      <slot name="toolbar-right" />
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  direction?: 'horizontal' | 'vertical'
  initialRatio?: number
  minFirst?: string
  minSecond?: string
  responsive?: boolean
  class?: string
  fullscreen?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  direction: 'horizontal',
  initialRatio: 0.5,
  minFirst: '200px',
  minSecond: '200px',
  responsive: false,
  class: '',
  fullscreen: false
})

const emit = defineEmits<{ 'update:fullscreen': [value: boolean] }>()

const isFullscreen = computed({
  get: () => props.fullscreen,
  set: v => emit('update:fullscreen', v)
})

const containerClass = computed(() => props.class)

// JS fallback only for non-responsive mode or fullscreen exit key
const isMobile = ref(false)

onMounted(() => {
  if (props.responsive) {
    const check = () => { isMobile.value = window.innerWidth < 768 }
    check()
    window.addEventListener('resize', check)
    onUnmounted(() => window.removeEventListener('resize', check))
  }
})

// Escape to exit fullscreen
useEventListener('keydown', (e: KeyboardEvent) => {
  if (e.key === 'Escape' && isFullscreen.value) {
    isFullscreen.value = false
  }
})

// Lock body scroll in fullscreen
watch(isFullscreen, (v) => {
  document.body.style.overflow = v ? 'hidden' : ''
})

const containerRef = ref<HTMLDivElement>()
const ratio = ref(props.initialRatio)
const dragging = ref(false)

const effectiveDirection = computed(() => props.responsive && isMobile.value ? 'vertical' : props.direction)

const firstStyle = computed(() => {
  // Mobile: panels share space equally, no fixed size
  if (props.responsive && isMobile.value) {
    return { flex: '1 1 0', minHeight: 0 }
  }
  const size = `${ratio.value * 100}%`
  return effectiveDirection.value === 'horizontal'
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

  if (effectiveDirection.value === 'horizontal') {
    const offset = clientX - rect.left
    ratio.value = Math.max(0.15, Math.min(0.85, offset / rect.width))
  } else {
    const offset = clientY - rect.top
    ratio.value = Math.max(0.15, Math.min(0.85, offset / rect.height))
  }
}
</script>
