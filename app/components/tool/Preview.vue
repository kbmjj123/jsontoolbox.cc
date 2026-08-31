<template>
  <!-- PhotoSwipe mount — must be fixed so it doesn't push body height -->
  <Teleport to="body">
    <div ref="pswpMount" style="position:fixed;inset:0;z-index:100000" />
  </Teleport>

  <!-- Pixel-style custom UI overlay -->
  <Teleport to="body">
    <div
      v-if="preview.isReady.value"
      class="preview-overlay"
    >
      <!-- ════ Top bar: counter + close ════ -->
      <div class="preview-top-bar">
        <span class="preview-counter">
          {{ preview.currentIndex.value + 1 }} / {{ preview.totalSlides.value }}
        </span>

        <div class="preview-spacer" />

        <button
          type="button"
          class="preview-btn"
          title="Close (Esc)"
          @click="handleClose"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- ════ Navigation arrows ════ -->
      <button
        v-if="preview.totalSlides.value > 1"
        type="button"
        class="preview-arrow preview-arrow-left"
        title="Previous"
        @click="preview.prev()"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>
      <button
        v-if="preview.totalSlides.value > 1"
        type="button"
        class="preview-arrow preview-arrow-right"
        title="Next"
        @click="preview.next()"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>

      <!-- ════ Bottom bar: zoom + thumbnails ════ -->
      <div class="preview-bottom-bar">
        <!-- Zoom controls -->
        <div class="preview-zoom-row">
          <button
            type="button"
            class="preview-icon-btn"
            :disabled="!canZoomOut"
            title="Zoom out"
            @click="preview.zoomOut()"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35M8 11h6" />
            </svg>
          </button>

          <span class="preview-zoom-level">{{ preview.zoomLevel.value }}%</span>

          <button
            type="button"
            class="preview-icon-btn"
            :disabled="!canZoomIn"
            title="Zoom in"
            @click="preview.zoomIn()"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35M8 11h6M11 8v6" />
            </svg>
          </button>

          <div class="preview-divider" />

          <button
            type="button"
            class="preview-icon-btn"
            title="Download"
            @click="handleDownload"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
            </svg>
          </button>
        </div>

        <!-- Thumbnail strip -->
        <div ref="thumbScrollRef" class="preview-thumb-strip">
          <button
            v-for="(file, i) in files"
            :key="i"
            type="button"
            class="preview-thumb"
            :class="{ active: preview.currentIndex.value === i }"
            @click="preview.goTo(i)"
          >
            <img
              :src="file.url"
              :alt="file.alt || ''"
              loading="lazy"
              draggable="false"
            />
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import type { PreviewImage } from '~/composables/useImagePreview'

const props = defineProps<{
  files: PreviewImage[]
  startIndex: number
}>()

const emit = defineEmits<{
  close: []
}>()

// PhotoSwipe mount
const pswpMount = ref<HTMLDivElement>()
const thumbScrollRef = ref<HTMLDivElement>()

const preview = useImagePreview()

// Zoom boundaries
const canZoomOut = computed(() => preview.zoomLevel.value > 10)
const canZoomIn = computed(() => preview.zoomLevel.value < 500)

// ── Lifecycle ─────────────────────────────────────────

onMounted(() => {
  if (!pswpMount.value) return

  preview.open({
    files: props.files,
    startIndex: props.startIndex,
    appendToEl: pswpMount.value,
    padding: { top: 48, bottom: 120, left: 0, right: 0 },
  }).then(() => {
    preview.onDestroy(() => {
      emit('close')
    })
  })
})

onUnmounted(() => {
  preview.destroy()
})

// ── Handlers ─────────────────────────────────────────

function handleClose() {
  preview.close()
}

function handleDownload() {
  const file = props.files[preview.currentIndex.value]
  if (!file) return
  const a = document.createElement('a')
  a.href = file.url
  a.download = file.url.split('/').pop() || 'image'
  a.click()
}

// Auto-scroll thumbnail to center active one
watch(
  () => preview.currentIndex.value,
  (idx) => {
    const el = thumbScrollRef.value
    if (!el) return
    const child = el.children[idx] as HTMLElement | undefined
    if (!child) return
    const scrollLeft = child.offsetLeft - el.offsetWidth / 2 + child.offsetWidth / 2
    el.scrollTo({ left: scrollLeft, behavior: 'smooth' })
  },
)
</script>
