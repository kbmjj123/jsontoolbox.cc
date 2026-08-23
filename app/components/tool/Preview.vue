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

<style scoped>
/* ═══════════════════════════════════════════════════
   Pixel Preview Overlay
   Matches blog theme: --bg-deep, --border-pixel,
   --accent-green, --accent-gold, --font-pixel
═══════════════════════════════════════════════════ */

.preview-overlay {
  position: fixed;
  inset: 0;
  z-index: 100001;
  pointer-events: none;
}

/* ── Top bar ──────────────────────────────────── */

.preview-top-bar {
  position: absolute;
  inset-inline: 0;
  top: 0;
  display: flex;
  align-items: center;
  gap: 12px;
  height: 48px;
  padding: 0 12px;
  pointer-events: auto;
  background: linear-gradient(180deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0) 100%);
}

.preview-spacer {
  flex: 1;
}

.preview-counter {
  font-size: 13px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.8);
  user-select: none;
  white-space: nowrap;
}

/* ── Bottom bar ───────────────────────────────── */

.preview-bottom-bar {
  position: absolute;
  inset-inline: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px 12px 12px;
  pointer-events: auto;
  background: linear-gradient(0deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0) 100%);
}

.preview-zoom-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.preview-zoom-level {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  min-width: 48px;
  text-align: center;
  user-select: none;
}

.preview-divider {
  width: 1px;
  height: 16px;
  background: rgba(255, 255, 255, 0.2);
  margin: 0 4px;
}

/* ── Buttons ──────────────────────────────────── */

.preview-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #e2e8f0;
  cursor: pointer;
  transition: all 0.15s ease;
  border-radius: 6px;
}

.preview-btn:hover {
  border-color: rgba(255, 255, 255, 0.4);
  color: #ffffff;
  background: rgba(255, 255, 255, 0.15);
}

.preview-icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: #94a3b8;
  cursor: pointer;
  transition: all 0.15s ease;
  border-radius: 4px;
}

.preview-icon-btn:hover:not(:disabled) {
  border-color: rgba(255, 255, 255, 0.3);
  color: #e2e8f0;
  background: rgba(255, 255, 255, 0.1);
}

.preview-icon-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

/* ── Navigation arrows ──────────────────────── */

.preview-arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 0.8);
  border-radius: 50%;
  cursor: pointer;
  pointer-events: auto;
  transition: all 0.2s ease;
  z-index: 1;
}

.preview-arrow:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.4);
  color: #fff;
}

.preview-arrow-left {
  left: 16px;
}

.preview-arrow-right {
  right: 16px;
}

/* ── Thumbnail strip ──────────────────────────── */

.preview-thumb-strip {
  display: flex;
  justify-content: center;
  gap: 6px;
  overflow-x: auto;
  padding: 2px 0;
  -webkit-overflow-scrolling: touch;
}

.preview-thumb-strip::-webkit-scrollbar {
  height: 4px;
}
.preview-thumb-strip::-webkit-scrollbar-track {
  background: transparent;
}
.preview-thumb-strip::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
}
.preview-thumb-strip::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.4);
}

.preview-thumb {
  flex-shrink: 0;
  width: 48px;
  height: 48px;
  border-radius: 4px;
  overflow: hidden;
  border: 2px solid rgba(255, 255, 255, 0.15);
  background: rgba(0, 0, 0, 0.4);
  cursor: pointer;
  padding: 0;
  transition: all 0.15s ease;
}

.preview-thumb:hover {
  border-color: rgba(255, 255, 255, 0.4);
}

.preview-thumb.active {
  border-color: rgba(255, 255, 255, 0.8);
  box-shadow: 0 0 8px rgba(255, 255, 255, 0.2);
}

.preview-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

/* ── Hide PhotoSwipe built-in close button ────── */
:deep(.pswp__button--close) {
  display: none !important;
}

/* ── Responsive ───────────────────────────────── */

@media (max-width: 480px) {
  .preview-top-bar {
    height: 42px;
    padding: 0 8px;
  }

  .preview-bottom-bar {
    padding: 8px 8px 10px;
    gap: 6px;
  }

  .preview-thumb {
    width: 40px;
    height: 40px;
  }

  .preview-counter {
    font-size: 8px;
  }

  .preview-zoom-level {
    font-size: 8px;
    min-width: 36px;
  }
}
</style>
