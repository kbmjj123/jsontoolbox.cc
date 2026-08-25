<template>
  <div class="text-xs font-mono leading-relaxed">
    <template v-if="isObject(data)">
      <div class="text-surface-400">{</div>
      <div v-for="(value, key, index) in data" :key="key" class="pl-4">
        <span class="text-purple-600 dark:text-purple-400">"{{ key }}"</span>
        <span class="text-surface-400">: </span>
        <template v-if="isPrimitive(value)">
          <span :class="valueColorClass(value)">{{ formatPrimitive(value) }}</span>
        </template>
        <template v-else>
          <JsonSyntaxBlock :data="value" :depth="depth + 1" :inline="true" />
        </template>
        <span v-if="index < Object.keys(data).length - 1" class="text-surface-400">,</span>
      </div>
      <div class="text-surface-400">}</div>
    </template>
    <template v-else-if="isArray(data)">
      <div class="text-surface-400">[</div>
      <div v-for="(item, index) in data" :key="index" class="pl-4">
        <template v-if="isPrimitive(item)">
          <span :class="valueColorClass(item)">{{ formatPrimitive(item) }}</span>
        </template>
        <template v-else>
          <JsonSyntaxBlock :data="item" :depth="depth + 1" :inline="true" />
        </template>
        <span v-if="index < data.length - 1" class="text-surface-400">,</span>
      </div>
      <div class="text-surface-400">]</div>
    </template>
    <template v-else>
      <span :class="valueColorClass(data)">{{ formatPrimitive(data) }}</span>
    </template>
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  data: unknown
  depth?: number
  inline?: boolean
}>(), {
  depth: 0,
  inline: false,
})

function isObject(val: unknown): val is Record<string, unknown> {
  return val !== null && typeof val === 'object' && !Array.isArray(val)
}

function isArray(val: unknown): val is unknown[] {
  return Array.isArray(val)
}

function isPrimitive(val: unknown): boolean {
  return val === null || val === undefined || typeof val !== 'object'
}

function formatPrimitive(val: unknown): string {
  if (val === null) return 'null'
  if (val === undefined) return 'undefined'
  if (typeof val === 'string') return `"${val}"`
  return String(val)
}

function valueColorClass(val: unknown): string {
  if (val === null || val === undefined) return 'text-surface-400 italic'
  switch (typeof val) {
    case 'string': return 'text-emerald-600 dark:text-emerald-400'
    case 'number': return 'text-blue-600 dark:text-blue-400'
    case 'boolean': return 'text-orange-600 dark:text-orange-400'
    default: return 'text-surface-700 dark:text-surface-300'
  }
}
</script>
