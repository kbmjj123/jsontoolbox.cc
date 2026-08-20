<template>
  <div class="font-mono text-xs">
    <!-- Object -->
    <template v-if="isObject(data)">
      <div v-for="(value, key) in data" :key="key">
        <div
          class="flex items-start gap-1 hover:bg-surface-100 dark:hover:bg-surface-700 rounded px-1 cursor-pointer group"
          @click="isExpandable(value) ? toggle(key) : copyPath(getFullPath(key))"
        >
          <!-- Line number -->
          <span class="flex-none w-8 text-right pr-2 text-surface-400 dark:text-surface-500 select-none">{{ nextLine() }}</span>

          <!-- Expand indicator -->
          <button
            v-if="isExpandable(value)"
            @click.stop="toggle(key)"
            class="w-4 h-4 flex items-center justify-center text-surface-400 hover:text-surface-600 shrink-0"
          >
            <Icon :name="isExpanded(key) ? 'lucide:chevron-down' : 'lucide:chevron-right'" class="w-3 h-3" />
          </button>
          <span v-else class="w-4 shrink-0"></span>

          <span class="text-purple-600 dark:text-purple-400">"{{ key }}"</span>
          <span class="text-surface-400">:</span>

          <!-- Primitive with smart rendering -->
          <span v-if="!isExpandable(value)" class="flex items-center gap-1.5 min-w-0">
            <span
              v-if="isColorValue(value)"
              class="inline-block w-3.5 h-3.5 rounded border border-surface-300 dark:border-surface-600 shrink-0"
              :style="{ backgroundColor: getColorStyle(value) || undefined }"
            />
            <span :class="valueColorClass(value)">{{ formatValue(value) }}</span>
          </span>
          <span v-else-if="isArray(value)" class="text-surface-400">[{{ value.length }}]</span>
          <span v-else class="text-surface-400">{...}</span>
        </div>

        <!-- Image preview (any URL, hidden on load error) -->
        <div v-if="isPossibleImageUrl(value)" class="flex">
          <span class="flex-none w-8 text-right pr-2 select-none" />
          <span class="w-4 shrink-0" />
          <img
            :src="value"
            :alt="String(key)"
            class="max-w-[160px] max-h-[100px] rounded-lg border border-surface-200 dark:border-surface-700 object-contain mt-1 mb-1"
            @error="(($event.target as HTMLImageElement).parentElement as HTMLElement).style.display = 'none'"
          />
        </div>

        <!-- Expanded children -->
        <div v-if="isExpanded(key) && isExpandable(value)" class="ml-4 border-l border-surface-200 dark:border-surface-700 pl-0">
          <RichValueNode :data="value" :path="getFullPath(key)" />
        </div>
      </div>
    </template>

    <!-- Array -->
    <template v-else-if="isArray(data)">
      <div v-for="(item, index) in data" :key="index">
        <div
          class="flex items-start gap-1 hover:bg-surface-100 dark:hover:bg-surface-700 rounded px-1 cursor-pointer"
          @click="isExpandable(item) ? toggle(index) : copyPath(getFullPath(index))"
        >
          <!-- Line number -->
          <span class="flex-none w-8 text-right pr-2 text-surface-400 dark:text-surface-500 select-none">{{ nextLine() }}</span>

          <!-- Expand indicator -->
          <button
            v-if="isExpandable(item)"
            @click.stop="toggle(index)"
            class="w-4 h-4 flex items-center justify-center text-surface-400 hover:text-surface-600 shrink-0"
          >
            <Icon :name="isExpanded(index) ? 'lucide:chevron-down' : 'lucide:chevron-right'" class="w-3 h-3" />
          </button>
          <span v-else class="w-4 shrink-0"></span>

          <span class="text-surface-400">[{{ index }}]</span>

          <!-- Primitive with smart rendering -->
          <span v-if="!isExpandable(item)" class="flex items-center gap-1.5 min-w-0 ml-1">
            <span
              v-if="isColorValue(item)"
              class="inline-block w-3.5 h-3.5 rounded border border-surface-300 dark:border-surface-600 shrink-0"
              :style="{ backgroundColor: getColorStyle(item) || undefined }"
            />
            <span :class="valueColorClass(item)">{{ formatValue(item) }}</span>
          </span>
          <span v-else-if="isArray(item)" class="text-surface-400 ml-1">[{{ item.length }}]</span>
          <span v-else class="text-surface-400 ml-1">{...}</span>
        </div>

        <!-- Image preview (any URL, hidden on load error) -->
        <div v-if="isPossibleImageUrl(item)" class="flex">
          <span class="flex-none w-8 text-right pr-2 select-none" />
          <span class="w-4 shrink-0" />
          <img
            :src="item"
            :alt="`[${index}]`"
            class="max-w-[160px] max-h-[100px] rounded-lg border border-surface-200 dark:border-surface-700 object-contain mt-1 mb-1"
            @error="(($event.target as HTMLImageElement).parentElement as HTMLElement).style.display = 'none'"
          />
        </div>

        <!-- Expanded children -->
        <div v-if="isExpanded(index) && isExpandable(item)" class="ml-4 border-l border-surface-200 dark:border-surface-700 pl-0">
          <RichValueNode :data="item" :path="getFullPath(index)" />
        </div>
      </div>
    </template>

    <!-- Primitive -->
    <template v-else>
      <div class="flex items-start gap-1 px-1">
        <span class="flex-none w-8 text-right pr-2 text-surface-400 dark:text-surface-500 select-none">{{ nextLine() }}</span>
        <span class="w-4 shrink-0"></span>
        <span class="flex items-center gap-1.5">
          <span
            v-if="isColorValue(data)"
            class="inline-block w-3.5 h-3.5 rounded border border-surface-300 dark:border-surface-600 shrink-0"
            :style="{ backgroundColor: getColorStyle(data) || undefined }"
          />
          <span :class="valueColorClass(data)">{{ formatValue(data) }}</span>
        </span>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  data: unknown
  path: string
}>()

const expanded = ref<Set<string | number>>(new Set())

// Shared line counter across recursive instances
const lineCounter = inject<Ref<number>>('richLineCounter', ref(1))
if (!props.path) {
  // Root instance: reset counter
  lineCounter.value = 1
}
provide('richLineCounter', lineCounter)

const nextLine = () => lineCounter.value++

const isObject = (val: unknown): val is Record<string, unknown> =>
  val !== null && typeof val === 'object' && !Array.isArray(val)

const isArray = (val: unknown): val is unknown[] => Array.isArray(val)

const isExpandable = (val: unknown): val is Record<string, unknown> | unknown[] =>
  isObject(val) || isArray(val)

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

const valueColorClass = (val: unknown): string => {
  if (val === null || val === undefined) return 'text-surface-400 italic'
  switch (typeof val) {
    case 'string': return 'text-emerald-600 dark:text-emerald-400'
    case 'number': return 'text-blue-600 dark:text-blue-400'
    case 'boolean': return 'text-orange-600 dark:text-orange-400'
    default: return 'text-surface-700 dark:text-surface-300'
  }
}

const copyPath = (path: string) => {
  navigator.clipboard.writeText(path).catch(() => {})
}
</script>
