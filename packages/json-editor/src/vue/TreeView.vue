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
      <select v-model="mode" class="je-mode" :aria-label="t('search_mode')">
        <option value="key">{{ t('mode_key') }}</option>
        <option value="value">{{ t('mode_value') }}</option>
        <option value="path">{{ t('mode_path') }}</option>
        <option value="all">{{ t('mode_all') }}</option>
        <option value="jsonpath">{{ t('mode_jsonpath') }}</option>
      </select>
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
      <template v-if="editable">
        <button
          type="button"
          class="je-btn je-btn-icon"
          :disabled="!editing.canUndo.value"
          :title="t('undo')"
          :aria-label="t('undo')"
          @click="editing.undo()"
        >
          <span v-html="icons.undo" />
        </button>
        <button
          type="button"
          class="je-btn je-btn-icon"
          :disabled="!editing.canRedo.value"
          :title="t('redo')"
          :aria-label="t('redo')"
          @click="editing.redo()"
        >
          <span v-html="icons.redo" />
        </button>
        <button
          type="button"
          class="je-btn"
          :class="{ 'je-btn-active': editing.batchMode.value }"
          :title="t('batch_mode')"
          @click="toggleBatchMode"
        >
          {{ t('batch_mode') }}
        </button>
      </template>
      <span v-if="query.trim()" class="je-count" :class="{ 'is-error': result.invalid }">
        {{ result.invalid ? t('invalid_expression') : result.total ? t('matches', { n: result.total }) : t('no_matches') }}
      </span>
    </div>

    <div v-if="editable && editing.batchMode.value && editing.batchSelected.value.size" class="je-batch-bar">
      <input v-model="batchValue" type="text" :placeholder="t('batch_value')" class="je-batch-input" />
      <button type="button" class="je-btn" @click="applyBatch">
        {{ t('batch_apply', { n: editing.batchSelected.value.size }) }}
      </button>
      <button type="button" class="je-btn je-btn-icon" :title="t('batch_clear')" @click="editing.clearBatch()">
        <span v-html="icons.x" />
      </button>
    </div>

    <div v-if="!root || root.children.length === 0" class="je-empty">
      {{ t('empty') }}
    </div>
    <div v-else class="je-tree" role="tree">
      <div
        v-for="node in visible"
        :key="node.path || '__root__'"
        class="je-row"
        :class="{
          'is-match': result.matches.has(node.path),
          'is-batch': editing.batchSelected.value.has(node.path),
        }"
        role="treeitem"
        :aria-level="node.depth + 1"
        :aria-expanded="node.children.length ? expanded.has(node.path) : undefined"
        @click="onRowClick(node)"
      >
        <span class="je-indent" :style="{ width: (node.depth * 16) + 'px' }" />

        <input
          v-if="editable && editing.batchMode.value && node.path"
          type="checkbox"
          class="je-batch-check"
          :checked="editing.batchSelected.value.has(node.path)"
          @click.stop="editing.toggleBatch(node.path)"
        />

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
          <input
            v-if="editable && renamingPath && renamingPath === node.path"
            v-model="renameDraft"
            class="je-inline-input"
            @keyup.enter="commitRename(node)"
            @keyup.esc="renamingPath = ''"
            @click.stop
          />
          <span v-else class="je-key">
            <span v-for="(chunk, i) in keyChunks(node)" :key="i" :class="chunk.hit && 'je-mark'">{{ chunk.text }}</span>
          </span>
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
          <input
            v-if="editable && editingValuePath && editingValuePath === node.path"
            v-model="valueDraft"
            class="je-inline-input"
            @keyup.enter="commitValue(node)"
            @keyup.esc="editingValuePath = ''"
            @click.stop
          />
          <span v-else class="je-value" :class="'is-' + node.type">{{ displayValue(node) }}</span>
        </template>

        <span class="je-row-actions">
          <!-- Array element ordering -->
          <template v-if="editable && isArrayElement(node)">
            <button type="button" :title="t('move_up')" :disabled="!canMoveUp(node)" @click.stop="moveUp(node)">
              <span v-html="icons.chevronUp" />
            </button>
            <button type="button" :title="t('move_down')" :disabled="!canMoveDown(node)" @click.stop="moveDown(node)">
              <span v-html="icons.chevronDown" />
            </button>
          </template>

          <button
            v-if="node.path"
            type="button"
            :title="t('copy_path')"
            :aria-label="t('copy_path')"
            @click.stop="copyPath(node)"
          >
            <span v-html="icons.brackets" />
          </button>
          <button
            type="button"
            :title="t('copy_jsonpath')"
            :aria-label="t('copy_jsonpath')"
            @click.stop="copyJsonPath(node)"
          >
            <span v-html="icons.braces" />
          </button>
          <button type="button" :title="t('copy_value')" :aria-label="t('copy_value')" @click.stop="copyValue(node)">
            <span v-html="icons.copy" />
          </button>

          <template v-if="editable && node.path">
            <button
              v-if="(editingValuePath && editingValuePath === node.path) || (renamingPath && renamingPath === node.path) || (addFieldPath && addFieldPath === node.path) || (addItemPath && addItemPath === node.path)"
              type="button"
              :title="t('batch_clear')"
              @click.stop="cancelInline"
            >
              <span v-html="icons.x" />
            </button>
            <button type="button" :title="t('actions')" :aria-label="t('actions')" @click.stop="toggleMenu(node)">
              <span v-html="icons.dots" />
            </button>
            <span v-if="openMenuPath === node.path" class="je-menu" @click.stop>
              <button
                v-if="isObjectField(node)"
                type="button"
                @click="startRename(node)"
              >{{ t('rename') }}</button>
              <button
                v-if="node.children.length === 0"
                type="button"
                @click="startSetType(node)"
              >{{ t('set_type') }}</button>
              <button
                v-if="node.type === 'object'"
                type="button"
                @click="startAddField(node)"
              >{{ t('add_field') }}</button>
              <button
                v-if="node.type === 'array'"
                type="button"
                @click="startAddItem(node)"
              >{{ t('add_item') }}</button>
              <button
                v-if="node.children.length === 0"
                type="button"
                @click="startEditValue(node)"
              >{{ t('edit_value') }}</button>
              <button type="button" @click="startCopyMove(node, 'copy')">{{ t('copy_to') }}</button>
              <button type="button" @click="startCopyMove(node, 'move')">{{ t('move_to') }}</button>
              <button type="button" class="je-menu-danger" @click="editing.removeField(node.path)">{{ t('remove_node') }}</button>
            </span>
          </template>
        </span>

        <!-- Inline add-field form -->
        <span v-if="editable && addFieldPath && addFieldPath === node.path" class="je-inline-form" @click.stop>
          <input v-model="addKeyDraft" :placeholder="t('new_key')" class="je-inline-input" />
          <input v-model="addValueDraft" :placeholder="t('new_value')" class="je-inline-input" @keyup.enter="commitAddField(node)" />
          <button type="button" class="je-btn" @click="commitAddField(node)">+</button>
        </span>

        <!-- Inline set-type form -->
        <select
          v-if="editable && setTypePath && setTypePath === node.path"
          v-model="typeDraft"
          class="je-inline-input"
          @change="commitSetType(node)"
          @click.stop
        >
          <option value="string">{{ t('type_string') }}</option>
          <option value="number">{{ t('type_number') }}</option>
          <option value="boolean">{{ t('type_boolean') }}</option>
          <option value="null">{{ t('type_null') }}</option>
        </select>

        <!-- Inline copy/move form -->
        <span v-if="editable && copyMovePath && copyMovePath === node.path" class="je-inline-form" @click.stop>
          <input v-model="copyMoveTarget" :placeholder="t('target_path')" class="je-inline-input" />
          <button type="button" class="je-btn" @click="commitCopyMove(node)">OK</button>
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
  type TreeSearchMode,
} from '../core/tree'
import type { IndentOption } from '../core/format'
import { toJsonPath } from '../core/path'
import { createTranslator, type Locale, type Messages } from '../i18n'
import { icons } from './icons'
import { copyText } from './clipboard'
import { useJsonEditorOptions } from './options'
import { useNodeEditing, coerceScalarInput, type JsonPrimitiveType } from './useNodeEditing'
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
    /** Show node-editing controls (rename, add, remove, batch, undo/redo). */
    editable?: boolean
    /** Re-indent used when writing edits back to text. */
    indent?: IndentOption
    /** Surface edit errors/success to the host. */
    onNotify?: (message: string, kind: 'error' | 'success') => void
    /** Localize a plain English message before notifying. */
    localize?: (message: string) => string
  }>(),
  {
    value: undefined,
    text: undefined,
    messages: undefined,
    defaultExpandDepth: 2,
    editable: true,
    indent: 2,
  }
)

const emit = defineEmits<{
  select: [info: { path: string; jsonPath: string; value: unknown }]
  copied: [info: { kind: 'path' | 'jsonPath' | 'value'; text: string }]
  'update:text': [text: string]
}>()

const pluginOptions = useJsonEditorOptions()
const t = computed(() =>
  createTranslator(
    props.locale ?? pluginOptions?.locale ?? 'en',
    props.messages ?? pluginOptions?.messages
  )
)

// ── Document (editable text source) ────────────────────────────────────────
function initialText(): string {
  if (props.text != null && props.text !== '') return props.text
  if (props.value !== undefined) {
    try {
      return JSON.stringify(props.value, null, props.indent)
    } catch {
      return ''
    }
  }
  return props.text ?? ''
}

const document = ref<string>(initialText())
watch(
  () => props.text,
  (v) => {
    if (v != null && v !== document.value) document.value = v
  }
)
watch(document, (v) => emit('update:text', v))

const root = computed<TreeNode | null>(() => {
  if (!document.value.trim()) return null
  try {
    return buildTree(JSON.parse(document.value))
  } catch {
    return null
  }
})

const editing = useNodeEditing({
  text: document,
  indent: () => props.indent,
  onNotify: props.onNotify,
  localize: props.localize,
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
watch(
  () => [props.value, props.text],
  () => {
    // External document load: reset expansion to the default depth. Internal
    // edits flow through `document` and intentionally keep the user's layout.
    if (root.value) resetExpanded()
  },
  { deep: true }
)

const query = ref('')
const mode = ref<TreeSearchMode>('key')

const result = computed(() =>
  root.value
    ? searchTree(root.value, query.value, { mode: mode.value })
    : { matches: new Set<string>(), ancestors: new Set<string>(), total: 0, invalid: false }
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

/** Copies the internal path form (`users[0].profile`). */
async function copyPath(node: TreeNode) {
  const ok = await copyText(node.path)
  if (ok) emit('copied', { kind: 'path', text: node.path })
}

/** Copies the JSONPath form (`$.users[0].profile`). */
async function copyJsonPath(node: TreeNode) {
  const text = toJsonPath(node.path)
  const ok = await copyText(text)
  if (ok) emit('copied', { kind: 'jsonPath', text })
}

async function copyValue(node: TreeNode) {
  const text = node.children.length ? JSON.stringify(node.value) : formatScalar(node.value)
  const ok = await copyText(text)
  if (ok) emit('copied', { kind: 'value', text })
}

function select(node: TreeNode) {
  emit('select', { path: node.path, jsonPath: toJsonPath(node.path), value: node.value })
}

// ── Row interaction (select vs batch toggle) ───────────────────────────────
function onRowClick(node: TreeNode) {
  if (!props.editable) return select(node)
  if (editing.batchMode.value && node.path) {
    editing.toggleBatch(node.path)
    return
  }
  select(node)
}

// ── Editing menus & inline forms ───────────────────────────────────────────
const openMenuPath = ref('')
const renamingPath = ref('')
const renameDraft = ref('')
const editingValuePath = ref('')
const valueDraft = ref('')
const addFieldPath = ref('')
const addKeyDraft = ref('')
const addValueDraft = ref('')
const addItemPath = ref('')
const setTypePath = ref('')
const typeDraft = ref<JsonPrimitiveType>('string')
const copyMovePath = ref('')
const copyMoveTarget = ref('')
const copyMoveMode = ref<'copy' | 'move'>('copy')
const batchValue = ref('')

function isObjectField(node: TreeNode): boolean {
  return !!node.path && !/\[\d+\]$/.test(node.path)
}
function isArrayElement(node: TreeNode): boolean {
  return /\[\d+\]$/.test(node.path)
}
function arrayParentPath(node: TreeNode): string {
  return node.path.replace(/\[\d+\]$/, '')
}
function arrayIndex(node: TreeNode): number {
  return Number(node.path.match(/(\d+)\]$/)?.[1])
}
function canMoveUp(node: TreeNode): boolean {
  return isArrayElement(node) && arrayIndex(node) > 0
}
function canMoveDown(node: TreeNode): boolean {
  const parent = findNode(arrayParentPath(node))
  return isArrayElement(node) && parent !== null && arrayIndex(node) < parent.childCount - 1
}

function findNode(path: string): TreeNode | null {
  if (!root.value) return null
  if (path === '') return root.value
  for (const node of flattenVisible(root.value, new Set(allContainerPaths.value))) {
    if (node.path === path) return node
  }
  return null
}

function toggleMenu(node: TreeNode) {
  openMenuPath.value = openMenuPath.value === node.path ? '' : node.path
}
function toggleBatchMode() {
  editing.batchMode.value = !editing.batchMode.value
  if (!editing.batchMode.value) editing.clearBatch()
}

function cancelInline() {
  renamingPath.value = ''
  editingValuePath.value = ''
  addFieldPath.value = ''
  addItemPath.value = ''
  setTypePath.value = ''
  copyMovePath.value = ''
  openMenuPath.value = ''
}

function startRename(node: TreeNode) {
  renamingPath.value = node.path
  renameDraft.value = node.key
  openMenuPath.value = ''
}
function commitRename(node: TreeNode) {
  if (editing.renameKey(node.path, renameDraft.value)) renamingPath.value = ''
}

function startEditValue(node: TreeNode) {
  editingValuePath.value = node.path
  valueDraft.value = displayValue(node)
  openMenuPath.value = ''
}
function commitValue(node: TreeNode) {
  if (editing.setValue(node.path, coerceScalarInput(valueDraft.value))) editingValuePath.value = ''
}

function startSetType(node: TreeNode) {
  setTypePath.value = node.path
  typeDraft.value = (node.type === 'string' || node.type === 'number' || node.type === 'boolean' || node.type === 'null')
    ? node.type
    : 'string'
  openMenuPath.value = ''
}
function commitSetType(node: TreeNode) {
  if (editing.setType(node.path, typeDraft.value)) setTypePath.value = ''
}

function startAddField(node: TreeNode) {
  addFieldPath.value = node.path
  addKeyDraft.value = ''
  addValueDraft.value = ''
  openMenuPath.value = ''
}
function commitAddField(node: TreeNode) {
  if (editing.addField(node.path, addKeyDraft.value, coerceScalarInput(addValueDraft.value))) addFieldPath.value = ''
}

function startAddItem(node: TreeNode) {
  addItemPath.value = node.path
  editing.addArrayItem(node.path, null)
  addItemPath.value = ''
  openMenuPath.value = ''
}

function startCopyMove(node: TreeNode, kind: 'copy' | 'move') {
  copyMovePath.value = node.path
  copyMoveMode.value = kind
  copyMoveTarget.value = ''
  openMenuPath.value = ''
}
function commitCopyMove(node: TreeNode) {
  const ok = copyMoveMode.value === 'copy'
    ? editing.copyNode(node.path, copyMoveTarget.value)
    : editing.moveNode(node.path, copyMoveTarget.value)
  if (ok) copyMovePath.value = ''
}

function moveUp(node: TreeNode) {
  editing.moveArrayItem(arrayParentPath(node), arrayIndex(node), arrayIndex(node) - 1)
}
function moveDown(node: TreeNode) {
  editing.moveArrayItem(arrayParentPath(node), arrayIndex(node), arrayIndex(node) + 1)
}

function applyBatch() {
  if (editing.batchSelected.value.size === 0) return
  editing.batchSetValue([...editing.batchSelected.value], coerceScalarInput(batchValue.value))
  editing.clearBatch()
  batchValue.value = ''
}
</script>
