<template>
  <div class="font-mono text-xs">
    <!-- Object -->
    <template v-if="isObject(data)">
      <div v-for="(value, key) in data" :key="key">
        <div
          :class="[
            'rounded px-1 cursor-pointer group transition-colors',
            isSelected(getFullPath(key))
              ? 'bg-primary-100 dark:bg-primary-900/30'
              : 'hover:bg-surface-100 dark:hover:bg-surface-700',
          ]"
          @click="isExpandable(value) ? toggle(key) : selectAndCopy(getFullPath(key))"
          @mouseenter="!isExpandable(value) && onNodeInteraction(getFullPath(key), 'hover')"
          @mouseleave="onNodeInteraction('', 'hover')"
        >
          <!-- Content -->
          <div class="flex items-start gap-1 min-w-0 leading-5">
            <!-- Expand indicator -->
            <button
              v-if="isExpandable(value)"
              @click.stop="toggle(key)"
              class="w-4 h-4 flex items-center justify-center text-surface-400 hover:text-surface-600 shrink-0"
            >
              <Icon :name="isExpanded(key) ? 'lucide:chevron-down' : 'lucide:chevron-right'" class="w-3 h-3" />
            </button>
            <span v-else class="w-4 shrink-0"></span>

            <span class="text-purple-600 dark:text-purple-400">"{{ key }}"</span>
            <span class="text-surface-400">:</span>

            <!-- Primitive with smart rendering -->
            <span v-if="!isExpandable(value)" class="flex items-center gap-1.5 min-w-0 flex-wrap">
              <span
                v-if="isColorValue(value)"
                class="inline-block w-3.5 h-3.5 rounded border border-surface-300 dark:border-surface-600 shrink-0"
                :style="{ backgroundColor: getColorStyle(value) || undefined }"
              />
              <span :class="valueColorClass(value)">{{ formatValue(value) }}</span>
            </span>
            <span v-else-if="isArray(value)" class="text-surface-400">[{{ value.length }}]</span>
            <span v-else class="text-surface-400">{...}</span>
          </div>
        </div>

        <!-- Image preview (any URL, hidden on load error) -->
        <div v-if="isPossibleImageUrl(value)">
          <img
            :src="value"
            :alt="String(key)"
            class="max-w-[160px] max-h-[100px] rounded-lg border border-surface-200 dark:border-surface-700 object-contain mt-1 mb-1 cursor-zoom-in"
            @click.stop="openPreview(String(key))"
            @error="(($event.target as HTMLImageElement).parentElement as HTMLElement).style.display = 'none'"
          />
        </div>

        <!-- Expanded children -->
        <div v-if="isExpanded(key) && isExpandable(value)" class="ml-4 border-l border-surface-200 dark:border-surface-700 pl-0">
          <RichValueNode :data="value" :path="getFullPath(key)" />
        </div>
      </div>
    </template>

    <!-- Array -->
    <template v-else-if="isArray(data)">
      <div v-for="(item, index) in data" :key="index">
        <div
          :class="[
            'rounded px-1 cursor-pointer transition-colors',
            isSelected(getFullPath(index))
              ? 'bg-primary-100 dark:bg-primary-900/30'
              : 'hover:bg-surface-100 dark:hover:bg-surface-700',
          ]"
          @click="isExpandable(item) ? toggle(index) : selectAndCopy(getFullPath(index))"
          @mouseenter="!isExpandable(item) && onNodeInteraction(getFullPath(index), 'hover')"
          @mouseleave="onNodeInteraction('', 'hover')"
        >
          <!-- Content -->
          <div class="flex items-start gap-1 min-w-0 leading-5">
            <!-- Expand indicator -->
            <button
              v-if="isExpandable(item)"
              @click.stop="toggle(index)"
              class="w-4 h-4 flex items-center justify-center text-surface-400 hover:text-surface-600 shrink-0"
            >
              <Icon :name="isExpanded(index) ? 'lucide:chevron-down' : 'lucide:chevron-right'" class="w-3 h-3" />
            </button>
            <span v-else class="w-4 shrink-0"></span>

            <span class="text-surface-400">[{{ index }}]</span>

            <!-- Primitive with smart rendering -->
            <span v-if="!isExpandable(item)" class="flex items-center gap-1.5 min-w-0 flex-wrap ml-1">
              <span
                v-if="isColorValue(item)"
                class="inline-block w-3.5 h-3.5 rounded border border-surface-300 dark:border-surface-600 shrink-0"
                :style="{ backgroundColor: getColorStyle(item) || undefined }"
              />
              <span :class="valueColorClass(item)">{{ formatValue(item) }}</span>
            </span>
            <span v-else-if="isArray(item)" class="text-surface-400 ml-1">[{{ item.length }}]</span>
            <span v-else class="text-surface-400 ml-1">{...}</span>
          </div>
        </div>

        <!-- Image preview (any URL, hidden on load error) -->
        <div v-if="isPossibleImageUrl(item)">
          <img
            :src="item"
            :alt="`[${index}]`"
            class="max-w-[160px] max-h-[100px] rounded-lg border border-surface-200 dark:border-surface-700 object-contain mt-1 mb-1 cursor-zoom-in"
            @click.stop="openPreview(`[${index}]`)"
            @error="(($event.target as HTMLImageElement).parentElement as HTMLElement).style.display = 'none'"
          />
        </div>

        <!-- Expanded children -->
        <div v-if="isExpanded(index) && isExpandable(item)" class="ml-4 border-l border-surface-200 dark:border-surface-700 pl-0">
          <RichValueNode :data="item" :path="getFullPath(index)" />
        </div>
      </div>
    </template>

    <!-- Primitive -->
    <template v-else>
      <div
        :class="[
          'rounded px-1 transition-colors',
          isSelected(props.path)
            ? 'bg-primary-100 dark:bg-primary-900/30'
            : '',
        ]"
      >
        <div class="flex items-start gap-1 leading-5">
          <span class="w-4 shrink-0"></span>
          <span class="flex items-center gap-1.5">
            <span
              v-if="isColorValue(data)"
              class="inline-block w-3.5 h-3.5 rounded border border-surface-300 dark:border-surface-600 shrink-0"
              :style="{ backgroundColor: getColorStyle(data) || undefined }"
            />
            <span :class="valueColorClass(data)">{{ formatValue(data) }}</span>
          </span>
        </div>
      </div>
    </template>

    <!-- Image lightbox -->
    <Preview
      v-if="showPreview && previewFiles.length"
      :files="previewFiles"
      :start-index="previewIndex"
      @close="showPreview = false"
    />
  </div>
</template>

<script setup lang="ts">
import type { PreviewImage } from '~/composables/useImagePreview'

const props = defineProps<{
  data: unknown
  path: string
}>()

// ── Shared expanded state ──────────────────────────────────────────
const expanded = inject<Ref<Set<string>>>('richExpanded', ref(new Set()))
provide('richExpanded', expanded)

// ── Selected path ──────────────────────────────────────────────────
const selectedPath = inject<Ref<string>>('richSelectedPath', ref(''))
provide('richSelectedPath', selectedPath)

// ── Node interaction callback (click/hover → source line) ──────────
const onNodeInteraction = inject<(path: string, type: 'click' | 'hover') => void>('onNodeInteraction', () => {})

// ── Image preview state ────────────────────────────────────────────
const showPreview = ref(false)
const previewIndex = ref(0)
const previewFiles = ref<PreviewImage[]>([])

// Collect image URLs from current data level
const imageUrls = computed(() => {
  const urls: { url: string; alt: string }[] = []
  if (isObject(props.data)) {
    for (const [k, v] of Object.entries(props.data)) {
      if (typeof v === 'string' && isPossibleImageUrl(v)) urls.push({ url: v, alt: k })
    }
  } else if (isArray(props.data)) {
    for (let i = 0; i < props.data.length; i++) {
      const item = props.data[i]
      if (typeof item === 'string' && isPossibleImageUrl(item)) urls.push({ url: item, alt: `[${i}]` })
    }
  }
  return urls
})

// Preload a single image and return its natural dimensions
function loadDimensions(url: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight })
    img.onerror = () => resolve({ width: 800, height: 600 })
    img.src = url
  })
}

async function openPreview(altKey: string) {
  const sources = imageUrls.value
  const idx = sources.findIndex(s => s.alt === altKey)
  previewIndex.value = idx >= 0 ? idx : 0

  // Preload all images to get real dimensions
  const loaded = await Promise.all(
    sources.map(async (s) => {
      const dim = await loadDimensions(s.url)
      return { url: s.url, alt: s.alt, ...dim }
    }),
  )
  previewFiles.value = loaded
  showPreview.value = true
}

const isObject = (val: unknown): val is Record<string, unknown> =>
  val !== null && typeof val === 'object' && !Array.isArray(val)

const isArray = (val: unknown): val is unknown[] => Array.isArray(val)

const isExpandable = (val: unknown): val is Record<string, unknown> | unknown[] =>
  isObject(val) || isArray(val)

const toggle = (key: string | number) => {
  const fullPath = getFullPath(key)
  const next = new Set(expanded.value)
  if (next.has(fullPath)) {
    next.delete(fullPath)
  } else {
    next.add(fullPath)
  }
  expanded.value = next
}

const isExpanded = (key: string | number) => expanded.value.has(getFullPath(key))

const isSelected = (path: string) => selectedPath.value === path

const selectAndCopy = (path: string) => {
  selectedPath.value = path
  copyToClipboard(path)
  onNodeInteraction(path, 'click')
}

const getFullPath = (key: string | number) => {
  if (props.path) {
    return typeof key === 'number' ? `${props.path}[${key}]` : `${props.path}.${key}`
  }
  return String(key)
}

const formatValue = (val: unknown): string => {
  if (val === null) return 'null'
  if (val === undefined) return 'undefined'
  if (typeof val === 'string') return `"${val}"`
  return String(val)
}

const valueColorClass = (val: unknown): string => {
  if (val === null || val === undefined) return 'text-surface-400 italic'
  switch (typeof val) {
    case 'string': return 'text-emerald-600 dark:text-emerald-400'
    case 'number': return 'text-blue-600 dark:text-blue-400'
    case 'boolean': return 'text-orange-600 dark:text-orange-400'
    default: return 'text-surface-700 dark:text-surface-300'
  }
}
</script>
