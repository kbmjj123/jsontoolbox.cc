<script setup lang="ts">
interface OgImageProps {
  title?: string
  description?: string
  icon?: 'json' | 'formatter' | 'validator' | 'compare' | 'convert' | 'csv' | 'yaml' | 'xml' | 'tree' | 'schema'
  variant?: 'home' | 'tool' | 'convert' | 'scenario'
  accent?: 'blue' | 'green' | 'purple' | 'orange'
}

const props = withDefaults(defineProps<OgImageProps>(), {
  title: 'JSON Toolbox',
  description: 'Free online JSON tools for developers. Format, validate, compare, and convert JSON in your browser.',
  icon: 'json',
  variant: 'home',
  accent: 'blue'
})

// icon 映射
const iconMap: Record<string, string> = {
  json: '{}',
  formatter: '{ }',
  validator: '✓',
  compare: '⇔',
  convert: '→',
  csv: 'CSV',
  yaml: 'YML',
  xml: '<>',
  tree: '🌳',
  schema: '{}'
}

const iconText = computed(() => iconMap[props.icon] || '{}')

// accent 颜色映射
const accentColors: Record<string, { primary: string; glow: string }> = {
  blue: { primary: 'bg-primary-600', glow: 'bg-primary-600' },
  green: { primary: 'bg-emerald-600', glow: 'bg-emerald-400' },
  purple: { primary: 'bg-violet-600', glow: 'bg-violet-400' },
  orange: { primary: 'bg-amber-600', glow: 'bg-amber-400' }
}

const colors = computed(() => accentColors[props.accent] || accentColors.blue)

// 根据 variant 调整字号
const titleSize = computed(() => {
  switch (props.variant) {
    case 'home': return 'text-7xl'
    case 'tool': return 'text-6xl'
    case 'convert': return 'text-6xl'
    case 'scenario': return 'text-5xl'
    default: return 'text-6xl'
  }
})

const descSize = computed(() => {
  switch (props.variant) {
    case 'home': return 'text-4xl'
    case 'tool': return 'text-3xl'
    case 'convert': return 'text-3xl'
    case 'scenario': return 'text-2xl'
    default: return 'text-3xl'
  }
})
</script>

<template>
  <div
    class="w-full h-full flex flex-col items-center justify-center bg-slate-50 relative overflow-hidden"
  >
    <!-- 光晕装饰 -->
    <div class="absolute -top-20 -left-20 w-[600px] h-[600px] rounded-full opacity-15 blur-[120px]" :class="colors.glow"></div>
    <div class="absolute -bottom-20 -right-20 w-[600px] h-[600px] bg-emerald-400 rounded-full opacity-15 blur-[120px]"></div>

    <!-- grid -->
    <div class="absolute inset-0 bg-[linear-gradient(to_right,#0000000a_1px,transparent_1px),linear-gradient(to_bottom,#0000000a_1px,transparent_1px)] bg-[size:40px_40px]"></div>

    <!-- 品牌 -->
    <div class="absolute top-12 left-12 z-20 flex flex-row items-center gap-4 opacity-95">
      <div class="flex flex-row w-14 h-14 rounded-2xl overflow-hidden shadow-lg border border-slate-200 items-center justify-center" :class="colors.primary">
        <span class="text-white font-black text-3xl">{}</span>
      </div>
      <span class="text-4xl font-black text-slate-800 tracking-widest drop-shadow-sm">
        <span class="text-primary-600">JSON</span>Toolbox
      </span>
    </div>

    <!-- 主内容 -->
    <div class="relative z-10 flex flex-col items-center justify-center text-center px-20 mt-4">
      <h1 class="font-black text-slate-900 leading-tight mb-6 tracking-tight drop-shadow-sm" :class="titleSize">
        {{ title }}
      </h1>
      <p class="text-slate-500 font-medium leading-normal line-clamp-2 max-w-5xl opacity-90" :class="descSize">
        {{ description }}
      </p>
    </div>

    <!-- 底部 badge 行 -->
    <div class="absolute bottom-12 left-0 right-0 z-20 flex flex-row items-center justify-center gap-8">
      <div class="flex flex-row items-center gap-4 px-6 py-3 rounded-full bg-white border border-slate-200 shadow-md">
        <div class="flex flex-row items-center justify-center w-8 h-8">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="3"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        </div>
        <span class="text-slate-700 text-2xl font-bold tracking-wide mt-1">Client-Side</span>
      </div>
      <div class="flex flex-row items-center gap-4 px-6 py-3 rounded-full bg-white border border-slate-200 shadow-md">
        <div class="flex items-center justify-center w-8 h-8">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="3"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
        </div>
        <span class="text-slate-700 text-2xl font-bold tracking-wide mt-1">No Upload</span>
      </div>
      <div class="flex flex-row items-center gap-4 px-6 py-3 rounded-full bg-white border border-slate-200 shadow-md">
        <div class="flex flex-row items-center justify-center w-8 h-8">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m22 11-1.296-1.296a2.4 2.4 0 0 0-3.408 0L11 16"/><path d="M4 8a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2"/><circle cx="13" cy="7" r="1" fill="currentColor"/><rect x="8" y="2" width="14" height="14" rx="2"/></svg>
        </div>
        <span class="text-slate-700 text-2xl font-bold tracking-wide mt-1">Free to Use</span>
      </div>
    </div>
  </div>
</template>
