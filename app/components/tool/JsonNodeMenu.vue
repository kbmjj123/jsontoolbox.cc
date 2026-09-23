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
      class="fixed z-[10000] min-w-[200px] rounded-lg border border-surface-200 bg-white py-1 text-xs shadow-lg dark:border-surface-700 dark:bg-surface-800"
      :style="menuStyle"
      @click.stop
    >
      <div class="border-b border-surface-100 px-3 py-1.5 text-[10px] uppercase tracking-wider text-surface-400 dark:border-surface-700 dark:text-surface-500">
        {{ $t('largeViewer.nodeType') }}: {{ node.type }}<template v-if="node.isArrayIndex"> · {{ $t('largeViewer.arrayIndex') }} {{ node.index }}</template>
      </div>
      <button class="block w-full px-3 py-1.5 text-left hover:bg-surface-100 dark:hover:bg-surface-700" @click="copy('jsonPath')">
        {{ $t('largeViewer.copyJsonPath') }}
      </button>
      <button class="block w-full px-3 py-1.5 text-left hover:bg-surface-100 dark:hover:bg-surface-700" @click="copy('value')">
        {{ $t('largeViewer.copyValue') }}
      </button>
      <button class="block w-full px-3 py-1.5 text-left hover:bg-surface-100 dark:hover:bg-surface-700" @click="copy('node')">
        {{ $t('largeViewer.copyNode') }}
      </button>
      <button class="block w-full px-3 py-1.5 text-left hover:bg-surface-100 dark:hover:bg-surface-700" @click="copy('parent')">
        {{ $t('largeViewer.copyParentPath') }}
      </button>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { copyToClipboard } from '~/utils'
import { toJsonPath } from '~/utils/jsonPath'
import { useToast } from '~/composables/useToast'

interface NodeMenuInfo {
  path: string
  parentPath: string
  value: unknown
  type: string
  isArrayIndex: boolean
  index?: number
}

const props = defineProps<{
  node: NodeMenuInfo | null
  x: number
  y: number
}>()

const emit = defineEmits<{ close: [] }>()
const toast = useToast()

const menuStyle = computed(() => {
  if (!props.node) return {}
  const w = 208
  const h = 168
  const left = Math.min(props.x, window.innerWidth - w - 8)
  const top = Math.min(props.y, window.innerHeight - h - 8)
  return { left: `${left}px`, top: `${top}px` }
})

function serializeValue(v: unknown): string {
  if (v === null || v === undefined) return 'null'
  if (typeof v === 'object') return JSON.stringify(v, null, 2)
  return String(v)
}

async function copy(kind: 'jsonPath' | 'value' | 'node' | 'parent') {
  if (!props.node) return
  let text = ''
  if (kind === 'jsonPath') text = toJsonPath(props.node.path)
  else if (kind === 'parent') text = toJsonPath(props.node.parentPath)
  else text = serializeValue(props.node.value)
  const ok = await copyToClipboard(text)
  if (ok) toast.success('✓ Copied')
  emit('close')
}

function close() {
  emit('close')
}
</script>
