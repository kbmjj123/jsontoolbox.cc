<template>
  <div v-if="relatedTools.length > 0">
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <NuxtLinkLocale
        v-for="item in relatedTools"
        :key="item.slug"
        :to="linkTo(item)"
        class="flex items-center gap-3 rounded-xl border border-surface-200 bg-white px-4 py-3 transition-colors hover:border-primary-200 hover:bg-primary-50/50 dark:border-surface-700 dark:bg-surface-900 dark:hover:border-primary-800 dark:hover:bg-primary-900/20"
      >
        <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
          <Icon :name="item.icon" class="h-4 w-4" />
        </div>
        <div class="min-w-0">
          <div class="text-sm font-medium text-surface-800 dark:text-surface-200 truncate">
            {{ item.name }}
          </div>
          <div class="text-xs text-surface-400 dark:text-surface-500 truncate">
            {{ item.description }}
          </div>
        </div>
      </NuxtLinkLocale>
    </div>
  </div>
</template>

<script setup lang="ts">
import { encodeInbound, INBOUND_HASH_PREFIX } from '~/utils/share/inbound'
import { useToolHandoff } from '~/composables/useToolHandoff'

const props = defineProps<{
  tools?: string[]
  currentSlug: string
}>()

const { getToolBySingleSlug } = useTools()
const { currentInput } = useToolHandoff()

const relatedTools = computed(() => {
  const all = props.tools || []
  const seen = new Set<string>()
  return all
    .filter(s => {
      if (s === props.currentSlug || seen.has(s)) return false
      seen.add(s)
      return true
    })
    .map(s => getToolBySingleSlug(s))
    .filter(t => t && t.icon) as ProcessedTool[]
})

// Carry the current tool's input into each recommended tool via the #in=
// inbound protocol, so navigation preserves the data the user is working on.
// Encoding is async (deflate-raw); results are cached per slug and the link
// falls back to a clean path when encoding fails (oversized input, etc.).
// This watch also runs during SSR, but `currentInput` is empty there, so no
// fragment is added and the rendered SEO links stay clean.
const encoded = reactive<Record<string, string>>({})

watch(
  currentInput,
  async (text) => {
    for (const key of Object.keys(encoded)) delete encoded[key]
    if (!text) return
    for (const item of relatedTools.value) {
      try {
        encoded[item.slug] = INBOUND_HASH_PREFIX + (await encodeInbound(text))
      } catch {
        // Oversized or malformed input — leave the link as a clean path.
      }
    }
  },
  { immediate: true },
)

function linkTo(item: ProcessedTool): string {
  return item.path + (encoded[item.slug] || '')
}
</script>
