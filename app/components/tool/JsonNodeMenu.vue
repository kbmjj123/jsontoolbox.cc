<template>
  <Teleport to="body">
    <!-- Click-away catcher -->
    <div
      v-if="node"
      class="fixed inset-0 z-[9999]"
      @click="close"
      @contextmenu.prevent="close"
    />
    <!-- Menu -->
    <div
      v-if="node"
      class="fixed z-[10000] min-w-[200px] max-h-[70vh] overflow-auto rounded-lg border border-surface-200 bg-white py-1 text-xs shadow-lg dark:border-surface-700 dark:bg-surface-800"
      :style="menuStyle"
      @click.stop
    >
      <div class="border-b border-surface-100 px-3 py-1.5 text-[10px] uppercase tracking-wider text-surface-400 dark:border-surface-700 dark:text-surface-500">
        {{ $t('largeViewer.nodeType') }}: {{ node.type }}<template v-if="node.isArrayIndex"> · {{ $t('largeViewer.arrayIndex') }} {{ node.index }}</template>
      </div>

      <!-- Copy actions -->
      <button class="block w-full px-3 py-1.5 text-left hover:bg-surface-100 dark:hover:bg-surface-700" @click="copy('jsonPath')">
        {{ $t('largeViewer.copyJsonPath') }}
      </button>
      <button class="block w-full px-3 py-1.5 text-left hover:bg-surface-100 dark:hover:bg-surface-700" @click="copy('value')">
        {{ $t('largeViewer.copyValue') }}
      </button>
      <button class="block w-full px-3 py-1.5 text-left hover:bg-surface-100 dark:hover:bg-surface-700" @click="copy('node')">
        {{ $t('largeViewer.copyNode') }}
      </button>
      <button
        v-if="clipboard?.canReplaceNode"
        class="block w-full px-3 py-1.5 text-left hover:bg-surface-100 dark:hover:bg-surface-700"
        @click="replaceFromClipboard"
      >
        {{ $t('clipboard.replaceNode') }}
      </button>
      <button class="block w-full px-3 py-1.5 text-left hover:bg-surface-100 dark:hover:bg-surface-700" @click="copy('parent')">
        {{ $t('largeViewer.copyParentPath') }}
      </button>

      <!-- Editing actions (only when a node-editing context is available) -->
      <template v-if="editing">
        <div class="mt-1 border-t border-surface-100 dark:border-surface-700" />

        <template v-if="!pending">
          <button v-if="isPrimitive" class="block w-full px-3 py-1.5 text-left hover:bg-surface-100 dark:hover:bg-surface-700" @click="start('value')">
            {{ $t('edit.editValue') }}
          </button>
          <button v-if="canRename" class="block w-full px-3 py-1.5 text-left hover:bg-surface-100 dark:hover:bg-surface-700" @click="start('rename')">
            {{ $t('edit.rename') }}
          </button>
          <button class="block w-full px-3 py-1.5 text-left hover:bg-surface-100 dark:hover:bg-surface-700" @click="start('type')">
            {{ $t('edit.changeType') }}
          </button>
          <button v-if="node.type === 'object'" class="block w-full px-3 py-1.5 text-left hover:bg-surface-100 dark:hover:bg-surface-700" @click="start('addField')">
            {{ $t('edit.addField') }}
          </button>
          <button v-if="node.type === 'array'" class="block w-full px-3 py-1.5 text-left hover:bg-surface-100 dark:hover:bg-surface-700" @click="start('addItem')">
            {{ $t('edit.addItem') }}
          </button>
          <button v-if="isArrayItem" class="block w-full px-3 py-1.5 text-left hover:bg-surface-100 disabled:opacity-40 disabled:cursor-not-allowed dark:hover:bg-surface-700" :disabled="!canMoveUp" @click="moveUp">
            {{ $t('edit.moveUp') }}
          </button>
          <button v-if="isArrayItem" class="block w-full px-3 py-1.5 text-left hover:bg-surface-100 disabled:opacity-40 disabled:cursor-not-allowed dark:hover:bg-surface-700" :disabled="!canMoveDown" @click="moveDown">
            {{ $t('edit.moveDown') }}
          </button>
          <button class="block w-full px-3 py-1.5 text-left hover:bg-surface-100 dark:hover:bg-surface-700" @click="start('copyNode')">
            {{ $t('edit.copyNode') }}
          </button>
          <button v-if="canDelete" class="block w-full px-3 py-1.5 text-left hover:bg-surface-100 dark:hover:bg-surface-700" @click="start('moveNode')">
            {{ $t('edit.moveNode') }}
          </button>
          <button v-if="canDelete" class="block w-full px-3 py-1.5 text-left text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30" @click="remove">
            {{ $t('edit.deleteField') }}
          </button>
        </template>

        <!-- Inline input for actions that need text -->
        <div v-else-if="pending !== 'type'" class="border-t border-surface-100 px-3 py-2 dark:border-surface-700">
          <div class="mb-1 text-[10px] uppercase tracking-wider text-surface-400 dark:text-surface-500">{{ pendingLabel }}</div>
          <input
            ref="firstInputRef"
            v-model="inputA"
            :placeholder="placeholderA"
            @keydown.enter="confirmPending"
            class="w-full rounded border border-surface-200 bg-white px-2 py-1 text-xs dark:border-surface-700 dark:bg-surface-900 dark:text-surface-100 focus:outline-none focus:ring-1 focus:ring-primary-400"
          />
          <input
            v-if="needsSecondInput"
            v-model="inputB"
            :placeholder="placeholderB"
            @keydown.enter="confirmPending"
            class="mt-1 w-full rounded border border-surface-200 bg-white px-2 py-1 text-xs dark:border-surface-700 dark:bg-surface-900 dark:text-surface-100 focus:outline-none focus:ring-1 focus:ring-primary-400"
          />
          <div class="mt-1.5 flex gap-1.5">
            <button @click="confirmPending" class="rounded bg-primary-600 px-2 py-1 text-[11px] font-medium text-white hover:bg-primary-700">
              {{ $t('edit.apply') }}
            </button>
            <button @click="cancelPending" class="rounded border border-surface-200 px-2 py-1 text-[11px] dark:border-surface-700">
              {{ $t('edit.cancel') }}
            </button>
          </div>
        </div>

        <!-- Type picker -->
        <div v-else class="border-t border-surface-100 px-3 py-2 dark:border-surface-700">
          <div class="mb-1 text-[10px] uppercase tracking-wider text-surface-400 dark:text-surface-500">{{ $t('edit.changeType') }}</div>
          <div class="flex flex-wrap gap-1">
            <button
              v-for="tp in typeOptions"
              :key="tp"
              @click="applyType(tp)"
              class="rounded border border-surface-200 px-2 py-1 text-[11px] hover:bg-surface-100 dark:border-surface-700 dark:hover:bg-surface-700"
            >
              {{ tp }}
            </button>
          </div>
          <button @click="cancelPending" class="mt-1.5 rounded border border-surface-200 px-2 py-1 text-[11px] dark:border-surface-700">
            {{ $t('edit.cancel') }}
          </button>
        </div>
      </template>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import { copyToClipboard } from '~/utils'
import { toJsonPath } from '~/utils/jsonPath'
import { useToast } from '~/composables/useToast'
import { useClipboardActions } from '~/composables/useClipboardActions'
import { useNodeEditing, type JsonTypeName } from '~/composables/useNodeEditing'

interface NodeMenuInfo {
  path: string
  parentPath: string
  value: unknown
  type: string
  isArrayIndex: boolean
  index?: number
  /** Length of the parent array, when the node is an array item. */
  siblingCount?: number
}

const props = defineProps<{
  node: NodeMenuInfo | null
  x: number
  y: number
}>()

const emit = defineEmits<{ close: [] }>()
const toast = useToast()
const { t } = useI18n()

// Provided by JsonEditor. Null in read-only contexts (validator, large viewer),
// where the editing section is hidden entirely.
const editing = inject<ReturnType<typeof useNodeEditing> | null>('nodeEditing', null)

// Provided by JsonEditor (F12). Null in read-only contexts.
const clipboard = inject<ReturnType<typeof useClipboardActions> | null>('clipboardActions', null)

type PendingKind = 'value' | 'rename' | 'addField' | 'addItem' | 'type' | 'copyNode' | 'moveNode' | null
const pending = ref<PendingKind>(null)
const inputA = ref('')
const inputB = ref('')
const firstInputRef = ref<HTMLInputElement | null>(null)

const typeOptions: JsonTypeName[] = ['string', 'number', 'boolean', 'null']

const menuStyle = computed(() => {
  if (!props.node) return {}
  const w = 208
  const h = 340
  const left = Math.min(props.x, window.innerWidth - w - 8)
  const top = Math.min(props.y, window.innerHeight - h - 8)
  return { left: `${left}px`, top: `${Math.max(top, 8)}px` }
})

const isPrimitive = computed(() => {
  const tp = props.node?.type
  return tp !== 'object' && tp !== 'array'
})
const isArrayItem = computed(() => !!props.node?.isArrayIndex && props.node?.index !== undefined)
const canRename = computed(() => !!props.node?.path && !props.node?.isArrayIndex)
const canDelete = computed(() => !!props.node?.path)
const canMoveUp = computed(() => isArrayItem.value && (props.node?.index ?? 0) > 0)
// Without a known sibling count we allow the click; `moveArrayItem` validates
// the bounds and reports the failure instead of silently doing nothing.
const canMoveDown = computed(() => {
  if (!isArrayItem.value) return false
  const count = props.node?.siblingCount
  if (!count) return true
  return (props.node?.index ?? 0) < count - 1
})

const needsSecondInput = computed(() => pending.value === 'addField')

const pendingLabel = computed(() => {
  switch (pending.value) {
    case 'value': return t('edit.newValue')
    case 'rename': return t('edit.newKey')
    case 'addField': return t('edit.fieldName')
    case 'addItem': return t('edit.newValue')
    case 'copyNode': return t('edit.targetPath')
    case 'moveNode': return t('edit.targetPath')
    default: return ''
  }
})
const placeholderA = computed(() => {
  switch (pending.value) {
    case 'rename': return t('edit.newKey')
    case 'addField': return t('edit.fieldName')
    case 'copyNode':
    case 'moveNode': return 'users[0].profile'
    default: return t('edit.newValue')
  }
})
const placeholderB = computed(() => t('edit.newValue'))

function serializeValue(v: unknown): string {
  if (v === null || v === undefined) return 'null'
  if (typeof v === 'object') return JSON.stringify(v, null, 2)
  return String(v)
}

/** Parse user text as JSON when possible, otherwise keep it as a string. */
function parseValue(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

async function copy(kind: 'jsonPath' | 'value' | 'node' | 'parent') {
  if (!props.node) return
  // Node copy routes through the shared clipboard workflow when available.
  if (kind === 'node' && clipboard) {
    await clipboard.copyNode(props.node.value)
    emit('close')
    return
  }
  let text = ''
  if (kind === 'jsonPath') text = toJsonPath(props.node.path)
  else if (kind === 'parent') text = toJsonPath(props.node.parentPath)
  else text = serializeValue(props.node.value)
  const ok = await copyToClipboard(text)
  if (ok) toast.success('✓ Copied')
  emit('close')
}

async function replaceFromClipboard() {
  if (!props.node || !clipboard?.canReplaceNode) return
  await clipboard.replaceNode(props.node.path)
  emit('close')
}

function start(kind: NonNullable<PendingKind>) {
  if (!props.node) return
  pending.value = kind
  inputA.value = ''
  inputB.value = ''
  if (kind !== 'type') {
    nextTick(() => firstInputRef.value?.focus())
  }
}

function cancelPending() {
  pending.value = null
  inputA.value = ''
  inputB.value = ''
}

function succeed(ok: boolean) {
  if (!ok) return
  cancelPending()
  emit('close')
}

function confirmPending() {
  const node = props.node
  if (!node || !editing || !pending.value) return
  switch (pending.value) {
    case 'value':
      succeed(editing.setValue(node.path, parseValue(inputA.value)))
      break
    case 'rename':
      succeed(editing.renameKey(node.path, inputA.value))
      break
    case 'addField':
      succeed(editing.addField(node.path, inputA.value, parseValue(inputB.value)))
      break
    case 'addItem':
      succeed(editing.addArrayItem(node.path, parseValue(inputA.value)))
      break
    case 'copyNode':
      succeed(editing.copyNode(node.path, inputA.value))
      break
    case 'moveNode':
      succeed(editing.moveNode(node.path, inputA.value))
      break
  }
}

function applyType(tp: JsonTypeName) {
  if (!props.node || !editing) return
  succeed(editing.setType(props.node.path, tp))
}

function moveUp() {
  const node = props.node
  if (!node || !editing || node.index === undefined) return
  succeed(editing.moveArrayItem(node.parentPath, node.index, node.index - 1))
}

function moveDown() {
  const node = props.node
  if (!node || !editing || node.index === undefined) return
  succeed(editing.moveArrayItem(node.parentPath, node.index, node.index + 1))
}

function remove() {
  const node = props.node
  if (!node || !editing) return
  const ok = node.isArrayIndex && node.index !== undefined
    ? editing.removeArrayItem(node.parentPath, node.index)
    : editing.removeField(node.path)
  succeed(ok)
}

function close() {
  emit('close')
}
</script>
