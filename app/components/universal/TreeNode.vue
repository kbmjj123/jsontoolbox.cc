<template>
  <div class="font-mono text-xs">
    <!-- Object -->
    <template v-if="isObject(data)">
      <div v-for="(value, key) in data" :key="key">
        <div
          class="flex items-start gap-1 py-0.5 hover:bg-surface-100 dark:hover:bg-surface-700 rounded px-1 cursor-pointer"
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
          <span v-if="!isObject(value) && !isArray(value)" class="text-surface-700 dark:text-surface-300">{{ formatValue(value) }}</span>
          <span v-else-if="isArray(value)" class="text-surface-400">[{{ value.length }}]</span>
          <span v-else class="text-surface-400">{...}</span>
        </div>

        <div v-if="isExpanded(key) && (isObject(value) || isArray(value))" class="ml-4 border-l border-surface-200 dark:border-surface-700 pl-2">
          <TreeNode :data="value" :path="getFullPath(key)" :search="search" @copy="$emit('copy', $event)" />
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
          <span v-if="!isObject(item) && !isArray(item)" class="text-surface-700 dark:text-surface-300 ml-1">{{ formatValue(item) }}</span>
          <span v-else-if="isArray(item)" class="text-surface-400 ml-1">[{{ item.length }}]</span>
          <span v-else class="text-surface-400 ml-1">{...}</span>
        </div>

        <div v-if="isExpanded(index) && (isObject(item) || isArray(item))" class="ml-4 border-l border-surface-200 dark:border-surface-700 pl-2">
          <TreeNode :data="item" :path="getFullPath(index)" :search="search" @copy="$emit('copy', $event)" />
        </div>
      </div>
    </template>

    <!-- Primitive -->
    <template v-else>
      <span class="text-surface-700 dark:text-surface-300">{{ formatValue(data) }}</span>
    </template>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  data: any
  path: string
  search: string
}>()

defineEmits<{
  copy: [path: string]
}>()

const expanded = ref<Set<string | number>>(new Set())

const isObject = (val: any) => val !== null && typeof val === 'object' && !Array.isArray(val)
const isArray = (val: any) => Array.isArray(val)

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

const formatValue = (val: any) => {
  if (val === null) return 'null'
  if (val === undefined) return 'undefined'
  if (typeof val === 'string') return `"${val}"`
  return String(val)
}

const matchesSearch = (key: any, value: any) => {
  if (!props.search) return false
  const q = props.search.toLowerCase()
  const keyStr = String(key).toLowerCase()
  const valueStr = String(value).toLowerCase()
  return keyStr.includes(q) || valueStr.includes(q)
}

const copyPath = (path: string) => {
  emit('copy', path)
}
</script>
