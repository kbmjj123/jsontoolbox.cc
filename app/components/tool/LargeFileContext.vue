<template>
  <div class="flex h-full min-h-0 flex-col">
    <div class="flex items-center gap-2 border-b border-surface-200 px-3 py-1.5 dark:border-surface-700">
      <Icon name="lucide:rows-3" class="h-4 w-4 shrink-0 text-primary-600 dark:text-primary-400" />
      <span class="min-w-0 flex-1 truncate text-xs text-surface-500 dark:text-surface-400">
        {{ t('largeViewer.context') }} · L{{ hit?.line ?? '—' }}
      </span>
      <button
        type="button"
        class="lf-btn-sm"
        :disabled="!rows.length"
        :title="t('largeViewer.copyContext')"
        @click="copyContext"
      >
        <Icon :name="copied ? 'lucide:check' : 'lucide:copy'" class="h-3.5 w-3.5" />
        {{ t('largeViewer.copyContext') }}
      </button>
    </div>

    <div class="min-h-0 flex-1 overflow-auto">
      <div
        v-for="row in rows"
        :key="row.line"
        class="flex font-mono text-[12px] leading-[20px]"
        :class="row.isHit ? 'bg-amber-50 dark:bg-amber-900/20' : ''"
      >
        <span class="w-14 shrink-0 select-none border-r border-surface-200 px-2 text-right text-surface-400 dark:border-surface-700 dark:text-surface-500">
          {{ row.line }}
        </span>
        <span class="min-w-0 flex-1 whitespace-pre-wrap break-words px-3"><template v-if="row.segs"><span
          v-for="(s, si) in row.segs"
          :key="si"
          :class="s.match ? 'rounded bg-amber-300 text-surface-900 dark:bg-amber-400' : ''"
        >{{ s.text }}</span></template><template v-else>{{ row.text }}</template></span>
      </div>

      <p v-if="!rows.length" class="px-3 py-6 text-center text-sm text-surface-400 dark:text-surface-500">
        {{ t('largeViewer.noResults') }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { SearchTextHit } from '~/utils/textSearch'
import { lineMatchSegments } from '~/utils/textSearch'

const props = withDefaults(defineProps<{
  hit: SearchTextHit | null
  text: string
  lineOffsets: Uint32Array | null
  query: string
  isRegex: boolean
  caseSensitive: boolean
  /** Lines rendered before and after the matched line. */
  contextLines?: number
}>(), { contextLines: 3 })

const { t } = useI18n()

const copied = ref(false)

/** The matched line plus `contextLines` neighbours, with the match highlighted. */
const rows = computed(() => {
  const offs = props.lineOffsets
  const hit = props.hit
  if (!offs || !hit) return []
  const out: {
    line: number
    text: string
    isHit: boolean
    segs: { text: string; match: boolean }[] | null
  }[] = []
  const from = Math.max(1, hit.line - props.contextLines)
  const to = Math.min(offs.length, hit.line + props.contextLines)
  for (let l = from; l <= to; l++) {
    const s = offs[l - 1] ?? 0
    const e = l < offs.length ? offs[l] : props.text.length
    const text = props.text.slice(s, e).replace(/\r?\n$/, '')
    out.push({
      line: l,
      text,
      isHit: l === hit.line,
      segs: l === hit.line
        ? lineMatchSegments(text, hit.offset - s, props.query, props.isRegex, props.caseSensitive)
        : null,
    })
  }
  return out
})

const contextText = computed(() => rows.value.map(r => r.text).join('\n'))

async function copyContext() {
  if (!contextText.value) return
  try { await navigator.clipboard.writeText(contextText.value) } catch {}
  copied.value = true
  setTimeout(() => { copied.value = false }, 1200)
}
</script>
