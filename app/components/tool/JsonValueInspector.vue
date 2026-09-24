<template>
  <Teleport to="body">
    <div
      v-if="value !== null"
      class="fixed inset-0 z-[9998] flex items-center justify-center bg-black/40 p-4"
      @click.self="emit('close')"
    >
      <div class="w-full max-w-lg max-h-[80vh] flex flex-col overflow-hidden rounded-xl border border-surface-200 bg-white shadow-xl dark:border-surface-700 dark:bg-surface-800">
        <!-- Header -->
        <div class="flex items-center justify-between border-b border-surface-200 px-4 py-2.5 dark:border-surface-700">
          <div class="flex items-center gap-2 min-w-0">
            <Icon :name="kindIcon" class="w-4 h-4 shrink-0 text-primary-600 dark:text-primary-400" />
            <span class="text-sm font-bold text-surface-800 dark:text-surface-100">{{ kindLabel }}</span>
            <span class="truncate font-mono text-[10px] text-surface-400 dark:text-surface-500">{{ headerText }}</span>
          </div>
          <button @click="emit('close')" class="shrink-0 text-surface-400 hover:text-surface-600 dark:hover:text-surface-300">
            <Icon name="lucide:x" class="w-4 h-4" />
          </button>
        </div>

        <!-- Safety banner: any preview that fetches a remote URL -->
        <div
          v-if="isRemote"
          class="flex items-start gap-2 border-b border-amber-200 bg-amber-50 px-4 py-2 text-[11px] text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300"
        >
          <Icon name="lucide:alert-triangle" class="mt-0.5 w-3.5 h-3.5 shrink-0" />
          <span>{{ t('media.remoteWarning') }}</span>
        </div>

        <!-- Body -->
        <div class="flex-1 min-h-0 overflow-auto p-4">
          <!-- Image (remote URL) -->
          <template v-if="kind === 'image'">
            <img
              v-if="!imageFailed"
              :src="stringValue"
              :alt="t('value.image')"
              class="max-w-[160px] max-h-40 rounded border border-surface-200 cursor-zoom-in dark:border-surface-700"
              @error="imageFailed = true"
              @click="openLightbox(stringValue)"
            />
            <p v-else class="text-xs text-surface-500">{{ t('media.loadFailed') }}</p>
            <p class="mt-1.5 break-all font-mono text-[10px] text-surface-400">{{ stringValue }}</p>
          </template>

          <!-- Base64 -->
          <template v-else-if="kind === 'base64'">
            <div v-if="!decoded">
              <p class="text-xs text-surface-600 dark:text-surface-300">
                {{ t('media.decodeOnClick', { size: formatBytes(base64Bytes) }) }}
              </p>
              <button
                @click="decodeConfirmed = true"
                class="mt-2 rounded bg-primary-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-700"
              >
                {{ t('media.decode') }}
              </button>
            </div>
            <template v-else-if="base64Result">
              <img
                v-if="base64Result.kind === 'image' && base64Result.dataUrl"
                :src="base64Result.dataUrl"
                :alt="t('value.image')"
                class="max-w-[160px] max-h-40 rounded border border-surface-200 cursor-zoom-in dark:border-surface-700"
                @click="openLightbox(base64Result.dataUrl)"
              />
              <pre v-else class="max-h-48 overflow-auto whitespace-pre-wrap break-all rounded bg-surface-50 p-2 text-[11px] dark:bg-surface-900">{{ truncatedText }}</pre>
              <p class="mt-1.5 text-[10px] text-surface-400">{{ formatBytes(base64Result.bytes) }}</p>
            </template>
            <p v-else class="text-xs text-red-600 dark:text-red-400">{{ t('media.decodeFailed') }}</p>
          </template>

          <!-- Audio / Video / PDF: nothing is fetched until the user opts in -->
          <template v-else-if="kind === 'audio' || kind === 'video' || kind === 'pdf'">
            <button
              v-if="!mediaLoaded"
              @click="mediaLoaded = true"
              class="rounded border border-surface-200 bg-white px-3 py-1.5 text-xs font-medium text-surface-700 hover:bg-surface-50 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-300"
            >
              {{ t('media.loadPreview') }}
            </button>
            <template v-else>
              <audio v-if="kind === 'audio'" :src="stringValue" controls preload="none" class="w-full" />
              <video v-else-if="kind === 'video'" :src="stringValue" controls preload="none" class="w-full max-h-64" />
              <iframe
                v-else
                :src="stringValue"
                class="w-full h-64 rounded border border-surface-200 dark:border-surface-700"
                :title="t('media.pdf')"
              />
            </template>
          </template>

          <!-- Color -->
          <div v-else-if="kind === 'color'" class="flex items-center gap-3">
            <span
              class="inline-block w-10 h-10 rounded border border-surface-300 dark:border-surface-600"
              :style="{ backgroundColor: stringValue }"
            />
            <span class="font-mono text-xs">{{ stringValue }}</span>
          </div>

          <!-- Timestamp -->
          <dl v-else-if="kind === 'timestamp' && timestamps" class="space-y-1.5 text-xs">
            <div class="flex gap-2">
              <dt class="w-14 shrink-0 text-surface-500">{{ t('value.timestampLocal') }}</dt>
              <dd class="font-mono">{{ timestamps.local }}</dd>
            </div>
            <div class="flex gap-2">
              <dt class="w-14 shrink-0 text-surface-500">{{ t('value.timestampUtc') }}</dt>
              <dd class="font-mono">{{ timestamps.utc }}</dd>
            </div>
            <div class="flex gap-2">
              <dt class="w-14 shrink-0 text-surface-500">{{ t('value.timestampIso') }}</dt>
              <dd class="font-mono">{{ timestamps.iso }}</dd>
            </div>
          </dl>

          <!-- JWT -->
          <div v-else-if="kind === 'jwt' && jwt" class="space-y-2">
            <div>
              <div class="mb-1 text-[10px] uppercase tracking-wider text-surface-400">{{ t('value.jwtHeader') }}</div>
              <pre class="max-h-40 overflow-auto rounded bg-surface-50 p-2 text-[11px] dark:bg-surface-900">{{ JSON.stringify(jwt.header, null, 2) }}</pre>
            </div>
            <div>
              <div class="mb-1 text-[10px] uppercase tracking-wider text-surface-400">{{ t('value.jwtPayload') }}</div>
              <pre class="max-h-48 overflow-auto rounded bg-surface-50 p-2 text-[11px] dark:bg-surface-900">{{ JSON.stringify(jwt.payload, null, 2) }}</pre>
            </div>
          </div>

          <!-- URL / email -->
          <div v-else-if="kind === 'url' || kind === 'email'" class="space-y-2">
            <a
              :href="kind === 'email' ? `mailto:${stringValue}` : stringValue"
              target="_blank"
              rel="noopener noreferrer"
              class="break-all text-xs text-primary-600 hover:underline dark:text-primary-400"
            >
              {{ stringValue }}
            </a>
          </div>

          <!-- Markdown: rendered locally, then sanitized -->
          <div v-else-if="kind === 'markdown'" class="rounded bg-surface-50 p-2 dark:bg-surface-900">
            <p class="mb-1.5 text-[11px] text-surface-500">{{ t('value.markdownNote') }}</p>
            <div
              v-if="renderedMarkdown"
              class="markdown-preview max-h-56 overflow-auto text-xs"
              v-html="renderedMarkdown"
            />
            <pre v-else class="max-h-56 overflow-auto whitespace-pre-wrap break-all text-[11px]">{{ stringValue }}</pre>
          </div>

          <!-- UUID / IP / regex / fallback -->
          <div v-else class="break-all font-mono text-xs">{{ stringValue }}</div>
        </div>

        <!-- Footer -->
        <div class="flex items-center justify-end gap-2 border-t border-surface-200 px-4 py-2 dark:border-surface-700">
          <button
            @click="copyValue"
            class="rounded border border-surface-200 px-3 py-1 text-xs font-medium text-surface-700 hover:bg-surface-50 dark:border-surface-700 dark:text-surface-300 dark:hover:bg-surface-700"
          >
            {{ copied ? '✓ Copied' : t('value.copyValue') }}
          </button>
          <button @click="emit('close')" class="rounded bg-surface-100 px-3 py-1 text-xs font-medium dark:bg-surface-700">
            {{ t('value.close') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Lightbox (supports both remote URLs and Base64 data URLs) -->
    <Preview
      v-if="lightboxFiles"
      :files="lightboxFiles"
      :start-index="0"
      @close="lightboxFiles = null"
    />
  </Teleport>
</template>

<script setup lang="ts">
import {
  BASE64_AUTO_DECODE_LIMIT,
  decodeBase64,
  decodeJwt,
  detectValueKind,
  formatBytes,
  formatTimestamps,
  base64ByteLength,
  isRemoteResource,
  truncate,
  type ValueKind,
} from '~/utils/mediaPreview'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import { copyToClipboard } from '~/utils'
import type { PreviewImage } from '~/composables/useImagePreview'

const props = defineProps<{ value: unknown }>()
const emit = defineEmits<{ close: [] }>()
const { t } = useI18n()

const kind = computed<ValueKind | null>(() => detectValueKind(props.value))
const stringValue = computed(() =>
  typeof props.value === 'string' ? props.value : String(props.value ?? ''),
)
const headerText = computed(() => truncate(stringValue.value, 120))
const isRemote = computed(() => isRemoteResource(kind.value))

const imageFailed = ref(false)
const mediaLoaded = ref(false)
const decodeConfirmed = ref(false)
const copied = ref(false)
const lightboxFiles = ref<PreviewImage[] | null>(null)

const base64Bytes = computed(() => (kind.value === 'base64' ? base64ByteLength(stringValue.value) : 0))
// Gate: only decode once confirmed, or when the payload is already small.
const decoded = computed(() => decodeConfirmed.value || base64Bytes.value <= BASE64_AUTO_DECODE_LIMIT)
const base64Result = computed(() =>
  kind.value === 'base64' && decoded.value ? decodeBase64(stringValue.value) : null,
)
const truncatedText = computed(() => truncate(base64Result.value?.text ?? '', 2000))

const timestamps = computed(() =>
  kind.value === 'timestamp' ? formatTimestamps(props.value as string | number) : null,
)

// Markdown is rendered client-side only: DOMPurify needs a real DOM, so during
// SSR (and the very first tick) we fall back to showing the source.
const mounted = ref(false)
onMounted(() => { mounted.value = true })

const renderedMarkdown = computed(() => {
  if (!mounted.value || kind.value !== 'markdown') return ''
  const html = marked.parse(stringValue.value, { async: false }) as string
  return DOMPurify.sanitize(html)
})
const jwt = computed(() => (kind.value === 'jwt' ? decodeJwt(stringValue.value) : null))

const kindIcons: Record<ValueKind, string> = {
  image: 'lucide:image',
  audio: 'lucide:music',
  video: 'lucide:video',
  pdf: 'lucide:file-text',
  url: 'lucide:link',
  email: 'lucide:mail',
  color: 'lucide:palette',
  timestamp: 'lucide:calendar',
  jwt: 'lucide:key',
  base64: 'lucide:binary',
  uuid: 'lucide:fingerprint',
  ip: 'lucide:globe',
  markdown: 'lucide:file-code',
  regex: 'lucide:regex',
}
const kindIcon = computed(() => (kind.value ? kindIcons[kind.value] : 'lucide:tag'))

const kindLabel = computed(() => {
  switch (kind.value) {
    case 'image': return t('value.image')
    case 'audio': return t('media.audio')
    case 'video': return t('media.video')
    case 'pdf': return t('media.pdf')
    case 'url': return t('value.url')
    case 'email': return t('value.email')
    case 'color': return t('value.color')
    case 'timestamp': return t('value.timestamp')
    case 'jwt': return t('value.jwt')
    case 'base64': return t('value.base64')
    case 'uuid': return t('value.uuid')
    case 'ip': return t('value.ip')
    case 'markdown': return t('value.markdown')
    case 'regex': return t('value.regex')
    default: return t('value.inspect')
  }
})

function openLightbox(src: string) {
  lightboxFiles.value = [{ url: src, width: 1200, height: 800, alt: t('value.image') }]
}

async function copyValue() {
  const ok = await copyToClipboard(stringValue.value)
  if (!ok) return
  copied.value = true
  setTimeout(() => { copied.value = false }, 2000)
}

// Reset per-value state whenever a different node is inspected.
watch(() => props.value, () => {
  imageFailed.value = false
  mediaLoaded.value = false
  decodeConfirmed.value = false
})
</script>

<style scoped>
/* v-html output is not scoped, so style the rendered Markdown via :deep(). */
.markdown-preview :deep(h1),
.markdown-preview :deep(h2),
.markdown-preview :deep(h3) {
  font-weight: 700;
  margin: 0.5em 0 0.25em;
  line-height: 1.3;
}
.markdown-preview :deep(h1) { font-size: 1.15rem; }
.markdown-preview :deep(h2) { font-size: 1.05rem; }
.markdown-preview :deep(h3) { font-size: 1rem; }
.markdown-preview :deep(p) { margin: 0.4em 0; }
.markdown-preview :deep(ul),
.markdown-preview :deep(ol) {
  margin: 0.4em 0;
  padding-left: 1.25em;
  list-style: revert;
}
.markdown-preview :deep(li) { margin: 0.15em 0; }
.markdown-preview :deep(code) {
  padding: 0.1em 0.35em;
  border-radius: 4px;
  background: rgb(0 0 0 / 0.06);
  font-family: ui-monospace, monospace;
}
:global(.dark) .markdown-preview :deep(code) {
  background: rgb(255 255 255 / 0.1);
}
.markdown-preview :deep(pre) {
  padding: 0.5em;
  overflow-x: auto;
  border-radius: 6px;
  background: rgb(0 0 0 / 0.06);
}
:global(.dark) .markdown-preview :deep(pre) {
  background: rgb(255 255 255 / 0.08);
}
.markdown-preview :deep(pre code) {
  padding: 0;
  background: none;
}
.markdown-preview :deep(a) {
  color: rgb(37 99 235);
  text-decoration: underline;
}
.markdown-preview :deep(blockquote) {
  margin: 0.4em 0;
  padding-left: 0.75em;
  border-left: 3px solid rgb(0 0 0 / 0.15);
}
.markdown-preview :deep(table) {
  border-collapse: collapse;
}
.markdown-preview :deep(th),
.markdown-preview :deep(td) {
  border: 1px solid rgb(0 0 0 / 0.15);
  padding: 0.25em 0.5em;
}
</style>
