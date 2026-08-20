import type { PhotoSwipeOptions } from 'photoswipe'
import type PhotoSwipeType from 'photoswipe'

export interface PreviewImage {
  url: string
  width: number
  height: number
  alt?: string
}

type PhotoSwipeInstance = InstanceType<typeof PhotoSwipeType>

export function useImagePreview() {
  let pswp: PhotoSwipeInstance | null = null
  const currentIndex = ref(0)
  const totalSlides = ref(0)
  const zoomLevel = ref(100)
  const isReady = ref(false)

  async function open(options: {
    files: PreviewImage[]
    startIndex: number
    appendToEl: HTMLElement
    padding?: { top: number; bottom: number; left: number; right: number }
  }) {
    const { files, startIndex, appendToEl } = options
    totalSlides.value = files.length
    currentIndex.value = startIndex
    isReady.value = false

    const topPad = options.padding?.top ?? 48
    const bottomPad = options.padding?.bottom ?? 120

    const opts: Partial<PhotoSwipeOptions> = {
      dataSource: files.map((f) => ({
        src: f.url,
        width: f.width,
        height: f.height,
        alt: f.alt,
      })),
      index: startIndex,
      appendToEl,
      padding: { top: topPad, bottom: bottomPad, left: 0, right: 0 },
      bgOpacity: 0.92,
      spacing: 0.1,
      loop: true,
      escKey: true,
      arrowKeys: true,
      wheelToZoom: true,
      pinchToClose: true,
      closeOnVerticalDrag: true,
      showHideAnimationType: 'fade',
      hideAnimationDuration: 200,
      showAnimationDuration: 333,
      zoomAnimationDuration: 333,
      preloaderDelay: 500,
      maxWidthToAnimate: 3000,
      errorMsg: 'Failed to load image',
      initialZoomLevel: 'fit',
      secondaryZoomLevel: 'fit',
      maxZoomLevel: 4,
    }

    const { default: PhotoSwipe } = await import('photoswipe')
    pswp = new PhotoSwipe(opts)

    pswp.on('change', () => {
      if (pswp) currentIndex.value = pswp.currIndex
    })

    pswp.on('zoomPanUpdate', ({ slide }) => {
      if (slide) zoomLevel.value = Math.round(slide.currZoomLevel * 100)
    })

    pswp.on('afterInit', () => {
      isReady.value = true
    })

    pswp.on('closingAnimationStart', () => {
      isReady.value = false
    })

    pswp.on('destroy', () => {
      pswp = null
    })

    pswp.init()
  }

  function close() {
    if (!pswp) return
    isReady.value = false
    pswp.close()
  }

  function destroy() {
    if (!pswp) return
    pswp.destroy()
    pswp = null
    isReady.value = false
  }

  function goTo(index: number) {
    if (!pswp) return
    const clamped = Math.max(0, Math.min(index, totalSlides.value - 1))
    pswp.goTo(clamped)
  }

  function next() {
    pswp?.next()
  }

  function prev() {
    pswp?.prev()
  }

  function zoomIn() {
    if (!pswp?.currSlide) return
    const curr = pswp.currSlide
    const next = Math.min(curr.currZoomLevel * 1.5, curr.zoomLevels.max)
    pswp.zoomTo(next, undefined, 200)
  }

  function zoomOut() {
    if (!pswp?.currSlide) return
    const curr = pswp.currSlide
    const next = Math.max(curr.currZoomLevel / 1.5, curr.zoomLevels.min)
    pswp.zoomTo(next, undefined, 200)
  }

  function resetZoom() {
    if (!pswp?.currSlide) return
    pswp.zoomTo(1, undefined, 200)
  }

  function onDestroy(cb: () => void) {
    if (!pswp) return
    pswp.on('destroy', cb)
  }

  return {
    currentIndex: readonly(currentIndex),
    totalSlides: readonly(totalSlides),
    zoomLevel: readonly(zoomLevel),
    isReady: readonly(isReady),
    open,
    close,
    destroy,
    goTo,
    next,
    prev,
    zoomIn,
    zoomOut,
    resetZoom,
    onDestroy,
    get pswpInstance() {
      return pswp
    },
  }
}
