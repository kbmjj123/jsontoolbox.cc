<template>
  <span v-if="insight" class="je-insight" :class="'is-' + insight.kind">
    <template v-if="insight.kind === 'color'">
      <span class="je-swatch" :style="{ background: insight.css }" />
      <span class="je-insight-val">{{ insight.value }}</span>
    </template>

    <template v-else-if="insight.kind === 'timestamp'">
      <span class="je-insight-val">{{ insight.views.local }}</span>
      <span class="je-insight-sub">{{ insight.views.utc }}</span>
    </template>

    <template v-else-if="insight.kind === 'jwt'">
      <button type="button" class="je-btn je-btn-sm" @click="open = !open">
        {{ t('insight_jwt') }}
      </button>
      <pre v-if="open" class="je-insight-pre">{{ pretty(insight.payload) }}</pre>
    </template>

    <template v-else-if="insight.kind === 'base64'">
      <span class="je-insight-val">{{ t('insight_base64') }} · {{ t('bytes', { n: insight.bytes }) }}</span>
      <img
        v-if="insight.image && insight.dataUrl"
        class="je-insight-img"
        :src="insight.dataUrl"
        alt=""
        @click="zoom(insight.dataUrl ?? '')"
      />
      <span v-else class="je-insight-sub">{{ truncate(insight.text || '') }}</span>
    </template>

    <template v-else-if="insight.kind === 'image'">
      <span class="je-insight-val">{{ t('insight_image') }}</span>
      <img
        v-if="imagePreview && !imageFailed"
        class="je-insight-img"
        :src="insight.url"
        alt=""
        loading="lazy"
        @error="imageFailed = true"
        @click="zoom(insight.url)"
      />
      <a
        v-else
        :href="insight.url"
        target="_blank"
        rel="noopener noreferrer"
        class="je-insight-link"
      >{{ truncate(insight.url) }}</a>
    </template>

    <template v-else-if="insight.kind === 'audio' || insight.kind === 'video' || insight.kind === 'pdf'">
      <span class="je-insight-val">{{ t('insight_' + insight.kind) }}</span>
      <button v-if="!mediaLoaded" type="button" class="je-btn je-btn-sm" @click="mediaLoaded = true">
        {{ t('media_load_preview') }}
      </button>
      <audio v-else-if="insight.kind === 'audio'" :src="insight.url" controls preload="none" class="je-insight-media" />
      <video v-else-if="insight.kind === 'video'" :src="insight.url" controls preload="none" class="je-insight-media" />
      <iframe v-else :src="insight.url" class="je-insight-media" :title="t('insight_pdf')" />
    </template>

    <template v-else-if="insight.kind === 'url'">
      <a :href="insight.url" target="_blank" rel="noopener noreferrer" class="je-insight-link">{{ truncate(insight.url) }}</a>
    </template>

    <template v-else-if="insight.kind === 'email'">
      <a :href="'mailto:' + insight.value" class="je-insight-link">{{ insight.value }}</a>
    </template>

    <template v-else-if="insight.kind === 'uuid' || insight.kind === 'ip' || insight.kind === 'regex'">
      <span class="je-insight-val je-mono">{{ t('insight_' + insight.kind) }}: {{ insight.kind === 'regex' ? insight.source : insight.value }}</span>
    </template>

    <template v-else-if="insight.kind === 'markdown'">
      <span class="je-insight-val">{{ t('insight_markdown') }}</span>
      <span class="je-insight-sub">{{ truncate(insight.text, 80) }}</span>
    </template>
  </span>

  <div v-if="zoomSrc" class="je-lightbox" @click="zoomSrc = ''">
    <img :src="zoomSrc" alt="" />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { inspectValue, type ValueInsight as ValueInsightResult } from '../core/valueInspector'
import { createTranslator, type Locale, type Messages } from '../i18n'

const props = withDefaults(
  defineProps<{
    value: unknown
    locale?: Locale
    messages?: Partial<Messages>
    /** Show remote image/URL previews (default ON). Local base64/data-URI images always render. */
    imagePreview?: boolean
  }>(),
  { locale: 'en', imagePreview: true }
)

const t = computed(() => createTranslator(props.locale, props.messages))
const open = ref(false)
const mediaLoaded = ref(false)
const imageFailed = ref(false)
const zoomSrc = ref<string>('')

const insight = computed<ValueInsightResult | null>(() => inspectValue(props.value))

function zoom(src: string): void {
  zoomSrc.value = src
}

function pretty(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}

function truncate(value: string, max = 120): string {
  return value.length > max ? value.slice(0, max) + '…' : value
}
</script>
