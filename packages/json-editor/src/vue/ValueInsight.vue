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
      <img v-if="insight.image && insight.dataUrl" class="je-insight-img" :src="insight.dataUrl" alt="" />
      <span v-else class="je-insight-sub">{{ truncate(insight.text || '') }}</span>
    </template>
  </span>
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
  }>(),
  { locale: 'en' }
)

const t = computed(() => createTranslator(props.locale, props.messages))
const open = ref(false)

const insight = computed<ValueInsightResult | null>(() => inspectValue(props.value))

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
