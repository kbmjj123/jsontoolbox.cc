<template>
  <div class="font-mono text-xs">
    <!-- Object -->
    <template v-if="isObject(data)">
      <div v-for="(value, key) in data" :key="key">
        <div
          class="flex items-start gap-1 py-0.5 hover:bg-surface-100 dark:hover:bg-surface-700 rounded px-1 cursor-pointer group"
          :class="{ 'bg-yellow-100 dark:bg-yellow-900/30': matchesSearch(key, value) }"
          @click="copyPath(getFullPath(key))"
        >
          <button
            v-if="isObject(value) || isArray(value)"
            @click.stop="toggle(key)"
            class="w-4 h-4 flex items-center justify-center text-surface-400 hover:text-surface-600"
          >
            <Icon :name="isExpanded(key) ? 'lucide:chevron-down' : 'lucide:chevron-right'" class="w-3 h-3" />
          </button>
          <span v-else class="w-4"></span>

          <span class="text-purple-600 dark:text-purple-400">"{{ key }}"</span>
          <span class="text-surface-400">:</span>
          <span v-if="!isObject(value) && !isArray(value)" :class="valueColorClass(value)">{{ formatValue(value) }}</span>
          <span v-else-if="isArray(value)" class="text-surface-400">[{{ value.length }}]</span>
          <span v-else class="text-surface-400">{...}</span>

          <!-- Image URL hover preview -->
          <div
            v-if="isImageUrl(value)"
            class="hidden group-hover:block absolute left-full ml-2 z-50"
          >
            <img
              :src="value"
              :alt="String(key)"
              class="max-w-xs max-h-48 rounded-lg shadow-lg border border-surface-200 dark:border-surface-700"
              @error="($event.target as HTMLImageElement).style.display = 'none'"
            />
          </div>
        </div>

        <div v-if="isExpanded(key) && (isObject(value) || isArray(value))" class="ml-4 border-l border-surface-200 dark:border-surface-700 pl-2">
          <UniversalTreeNode :data="value" :path="getFullPath(key)" :search="search" @copy="$emit('copy', $event)" />
        </div>
      </div>
    </template>

    <!-- Array -->
    <template v-else-if="isArray(data)">
      <div v-for="(item, index) in data" :key="index">
        <div
          class="flex items-start gap-1 py-0.5 hover:bg-surface-100 dark:hover:bg-surface-700 rounded px-1 cursor-pointer"
          :class="{ 'bg-yellow-100 dark:bg-yellow-900/30': matchesSearch(index, item) }"
          @click="copyPath(getFullPath(index))"
        >
          <button
            v-if="isObject(item) || isArray(item)"
            @click.stop="toggle(index)"
            class="w-4 h-4 flex items-center justify-center text-surface-400 hover:text-surface-600"
          >
            <Icon :name="isExpanded(index) ? 'lucide:chevron-down' : 'lucide:chevron-right'" class="w-3 h-3" />
          </button>
          <span v-else class="w-4"></span>

          <span class="text-surface-400">[{{ index }}]</span>
          <span v-if="!isObject(item) && !isArray(item)" :class="['ml-1', valueColorClass(item)]">{{ formatValue(item) }}</span>
          <span v-else-if="isArray(item)" class="text-surface-400 ml-1">[{{ item.length }}]</span>
          <span v-else class="text-surface-400 ml-1">{...}</span>
        </div>

        <div v-if="isExpanded(index) && (isObject(item) || isArray(item))" class="ml-4 border-l border-surface-200 dark:border-surface-700 pl-2">
          <UniversalTreeNode :data="item" :path="getFullPath(index)" :search="search" @copy="$emit('copy', $event)" />
        </div>
      </div>
    </template>

    <!-- Primitive -->
    <template v-else>
      <span :class="valueColorClass(data)">{{ formatValue(data) }}</span>
    </template>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  data: unknown
  path: string
  search: string
}>()

const emit = defineEmits<{
  copy: [path: string]
}>()

// --- helpers (hoisted before use) ---

const isObject = (val: unknown): val is Record<string, unknown> =>
  val !== null && typeof val === 'object' && !Array.isArray(val)

const isArray = (val: unknown): val is unknown[] => Array.isArray(val)

function getAllExpandableKeys(data: unknown): (string | number)[] {
  const keys: (string | number)[] = []
  if (isObject(data)) {
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      if (isObject(value) || isArray(value)) {
        keys.push(key)
        keys.push(...getAllExpandableKeys(value).map(k => `${key}.${k}`))
      }
    }
  } else if (isArray(data)) {
    for (const [index, item] of (data as unknown[]).entries()) {
      if (isObject(item) || isArray(item)) {
        keys.push(index)
        keys.push(...getAllExpandableKeys(item).map(k => `${index}.${k}`))
      }
    }
  }
  return keys
}

// --- state ---

const expanded = ref<Set<string | number>>(new Set(getAllExpandableKeys(props.data)))

// Support expand/collapse all via provide/inject
const expandAllSignal = inject<Ref<number> | null>('treeExpandAll', null)
const collapseAllSignal = inject<Ref<number> | null>('treeCollapseAll', null)

if (expandAllSignal) {
  watch(expandAllSignal, () => {
    expanded.value = new Set(getAllExpandableKeys(props.data))
  })
}

if (collapseAllSignal) {
  watch(collapseAllSignal, () => {
    expanded.value = new Set()
  })
}

const toggle = (key: string | number) => {
  if (expanded.value.has(key)) {
    expanded.value.delete(key)
  } else {
    expanded.value.add(key)
  }
}

const isExpanded = (key: string | number) => expanded.value.has(key)

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

/**
 * Color class based on value type
 */
const valueColorClass = (val: unknown): string => {
  if (val === null || val === undefined) return 'text-surface-400 italic'
  switch (typeof val) {
    case 'string':
      return 'text-emerald-600 dark:text-emerald-400'
    case 'number':
      return 'text-blue-600 dark:text-blue-400'
    case 'boolean':
      return 'text-orange-600 dark:text-orange-400'
    default:
      return 'text-surface-700 dark:text-surface-300'
  }
}

const matchesSearch = (key: unknown, value: unknown) => {
  if (!props.search) return false
  const q = props.search.toLowerCase()
  const keyStr = String(key).toLowerCase()
  const valueStr = String(value).toLowerCase()
  return keyStr.includes(q) || valueStr.includes(q)
}

const copyPath = (path: string) => {
  navigator.clipboard.writeText(path).catch(() => {})
}
</script>

<style scoped>
.group {
  position: relative;
}
</style>
