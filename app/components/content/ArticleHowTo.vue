<template>
  <div v-if="howtoData" class="my-8">
    <h3 class="text-xl font-bold mb-4">{{ howtoData.name }}</h3>
    
    <div class="space-y-4">
      <div v-for="(step, index) in howtoData.steps" :key="index" class="flex gap-4">
        <div class="flex-shrink-0 w-8 h-8 rounded-full bg-primary-600 text-white flex items-center justify-center font-bold">
          {{ index + 1 }}
        </div>
        <div>
          <h4 class="font-bold text-lg">{{ step.name }}</h4>
          <p class="text-surface-600 dark:text-surface-400">{{ step.text }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
export type HowTo = {
	name: string,
	steps: {
		name: string,
		text: string
	}[]
}
const props = defineProps<{
	howto: HowTo
}>()
// 读取 frontmatter 中的 'howto' 字段
const howtoData = computed(() => props.howto)

// 注入 HowTo Schema
useHead(() => {
  if (!howtoData.value) return {}

  const schema = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "name": howtoData.value.name,
    "step": howtoData.value.steps.map(step => ({
      "@type": "HowToStep",
      "name": step.name,
      "text": step.text,
      // 如果需要更高级，还可以在 frontmatter 里加 image 字段
      // "url": page.value._path + "#step" // 简单的锚点链接
    }))
  }

  return {
    script: [{ type: 'application/ld+json', children: JSON.stringify(schema) }]
  }
})
</script>