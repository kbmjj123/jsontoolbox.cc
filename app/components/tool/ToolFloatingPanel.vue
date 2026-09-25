<template>
  <!--
    The single place in the app that renders a floating panel into `body`.
    Panels placed inside a scroll container get clipped (see useAnchoredPanel),
    so they are teleported out and positioned against their trigger instead.
  -->
  <Teleport to="body">
    <div
      :style="style"
      class="tool-floating-panel pointer-events-none fixed z-[100] flex flex-col items-stretch gap-1"
    >
      <slot />
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { useAnchoredPanel } from '~/composables/useAnchoredPanel'

const props = withDefaults(defineProps<{
  /** Trigger element to anchor to. Pass the resolved element (refs unwrap in templates). */
  anchorEl?: HTMLElement | null
  /** Distance in px between the trigger's bottom edge and the panel. */
  offset?: number
}>(), {
  anchorEl: null,
  offset: 4,
})

const { style, startTracking, stopTracking } = useAnchoredPanel(
  () => props.anchorEl,
  { offset: props.offset },
)

onMounted(startTracking)
onBeforeUnmount(stopTracking)
</script>
