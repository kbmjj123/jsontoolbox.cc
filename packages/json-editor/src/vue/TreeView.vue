<template>
  <div class="je-pane">
    <div class="je-toolbar">
      <span class="je-search">
        <span v-html="icons.search" />
        <input
          v-model="query"
          type="search"
          :placeholder="t('search_placeholder')"
          :aria-label="t('search')"
        />
      </span>
      <button
        type="button"
        class="je-btn je-btn-icon"
        :title="allExpanded ? t('collapse_all') : t('expand_all')"
        :aria-label="allExpanded ? t('collapse_all') : t('expand_all')"
        @click="toggleAll"
      >
        <span v-html="allExpanded ? icons.collapse : icons.expand" />
      </button>
      <span class="je-toolbar-spacer" />
      <span v-if="query.trim()" class="je-count">
        {{ result.total ? t('matches', { n: result.total }) : t('no_matches') }}
      </span>
    </div>

    <div v-if="!root || root.children.length === 0" class="je-empty">
      {{ t('empty') }}
    </div>
    <div v-else class="je-tree" role="tree">
      <div
        v-for="node in visible"
        :key="node.path || '__root__'"
        class="je-row"
        :class="{ 'is-match': result.matches.has(node.path) }"
        role="treeitem"
        :aria-level="node.depth + 1"
        :aria-expanded="node.children.length ? expanded.has(node.path) : undefined"
        @click="select(node)"
      >
        <span class="je-indent" :style="{ width: `${node.depth * 16}px` }" />
        <button
          v-if="node.children.length"
          type="button"
          class="je-twisty"
          :class="{ 'is-open': expanded.has(node.path) }"
          :aria-label="expanded.has(node.path) ? t('collapse_all') : t('expand_all')"
          @click.stop="toggle(node.path)"
        >
          <span v-html="icons.chevronRight" />
        </button>
        <span v-else class="je-twisty-placeholder" />

        <template v-if="node.key">
          <span class="je-key"><span v-for="(chunk, i) in keyChunks(node)" :key="i" :class="chunk.hit && 'je-mark'">{{ chunk.text }}</span></span>
        </template>

        <template v-if="node.children.length">
          <span class="je-punct">{{ node.type === 'array' ? '[' : '{' }}</span>
          <span v-if="!expanded.has(node.path)" class="je-value">
            <span v-for="(chunk, i) in previewChunks(node)" :key="i" :class="chunk.hit && 'je-mark'">{{ chunk.text }}</span>
          </span>
          <span v-if="!expanded.has(node.path)" class="je-punct">{{ node.type === 'array' ? ']' : '}' }}</span>
          <span class="je-count">
            {{
              node.type === 'array'
                ? t('items', { n: node.childCount })
                : t('keys', { n: node.childCount })
            }}
          </span>
        </template>
        <template v-else>
          <span class="je-value" :class="`is-${node.type}`">{{ displayValue(node) }}</span>
        </template>

        <span class="je-row-actions">
          <button type="button" :title="t('copy_path')" :aria-label="t('copy_path')" @click.stop="copyPath(node)">
            <span v-html="icons.braces" />
          </button>
          <button type="button" :title="t('copy_value')" :aria-label="t('copy_value')" @click.stop="copyValue(node)">
            <span v-html="icons.copy" />
          </button>
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  buildTree,
  collectContainerPaths,
  flattenVisible,
  searchTree,
  splitByQuery,
  formatScalar,
  type TreeNode,
} from '../core/tree'
import { toJsonPath } from '../core/path'
import { createTranslator, type Locale, type Messages } from '../i18n'
import { icons } from './icons'
import { copyText } from './clipboard'
import { useJsonEditorOptions } from './options'
import '../styles/index.css'

const props = withDefaults(
  defineProps<{
    /** Parsed JSON value, or the raw text to parse. */
    value?: unknown
    text?: string
    locale?: Locale
    messages?: Partial<Messages>
    /** Expand container nodes up to this depth on first render. */
    defaultExpandDepth?: number
  }>(),
  { value: undefined, text: undefined, messages: undefined, defaultExpandDepth: 2 }
)

const emit = defineEmits<{
  select: [info: { path: string; jsonPath: string; value: unknown }]
  copied: [info: { kind: 'path' | 'value'; text: string }]
}>()

const pluginOptions = useJsonEditorOptions()
const t = computed(() =>
  createTranslator(
    props.locale ?? pluginOptions?.locale ?? 'en',
    props.messages ?? pluginOptions?.messages
  )
)

const root = computed<TreeNode | null>(() => {
  let data = props.value
  if (data === undefined && props.text != null) {
    try {
      data = JSON.parse(props.text)
    } catch {
      return null
    }
  }
  if (data === undefined || data === null) return null
  return buildTree(data)
})

const expanded = ref<Set<string>>(new Set())

function resetExpanded() {
  if (!root.value) {
    expanded.value = new Set()
    return
  }
  const next = new Set<string>()
  const walk = (node: TreeNode) => {
    if (node.children.length === 0) return
    if (node.depth < props.defaultExpandDepth) next.add(node.path)
    for (const child of node.children) walk(child)
  }
  walk(root.value)
  expanded.value = next
}

resetExpanded()
watch(() => [props.value, props.text], resetExpanded, { deep: true })

const query = ref('')

const result = computed(() =>
  root.value ? searchTree(root.value, query.value) : { matches: new Set<string>(), ancestors: new Set<string>(), total: 0 }
)

// Reveal matches as the user types, without fighting manual expand/collapse:
// only ancestors of the current query are merged in.
watch(result, (next) => {
  if (!next.total) return
  const merged = new Set(expanded.value)
  for (const path of next.ancestors) merged.add(path)
  expanded.value = merged
})

const visible = computed(() => (root.value ? flattenVisible(root.value, expanded.value) : []))

const allContainerPaths = computed(() => (root.value ? collectContainerPaths(root.value) : []))
const allExpanded = computed(
  () => allContainerPaths.value.length > 0 && allContainerPaths.value.every((p) => expanded.value.has(p))
)

function toggle(path: string) {
  const next = new Set(expanded.value)
  if (next.has(path)) next.delete(path)
  else next.add(path)
  expanded.value = next
}

function toggleAll() {
  expanded.value = allExpanded.value ? new Set<string>() : new Set(allContainerPaths.value)
}

function keyChunks(node: TreeNode) {
  return splitByQuery(node.key, query.value)
}

function displayValue(node: TreeNode): string {
  return node.type === 'string' ? `"${formatScalar(node.value)}"` : formatScalar(node.value)
}

function previewChunks(node: TreeNode) {
  const preview = node.children
    .slice(0, 3)
    .map((child) => child.key)
    .join(', ')
  const more = node.childCount > 3 ? ', …' : ''
  return splitByQuery(preview + more, query.value)
}

async function copyPath(node: TreeNode) {
  const text = toJsonPath(node.path)
  const ok = await copyText(text)
  if (ok) emit('copied', { kind: 'path', text })
}

async function copyValue(node: TreeNode) {
  const text = node.children.length ? JSON.stringify(node.value) : formatScalar(node.value)
  const ok = await copyText(text)
  if (ok) emit('copied', { kind: 'value', text })
}

function select(node: TreeNode) {
  emit('select', { path: node.path, jsonPath: toJsonPath(node.path), value: node.value })
}
</script>
