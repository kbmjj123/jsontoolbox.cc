<template>
  <div v-if="faqList && faqList.length > 0" class="my-8 border rounded-xl overflow-hidden bg-surface-50 dark:bg-surface-800/50">
    <div v-for="(item, index) in faqList" :key="index" class="border-b last:border-0 border-surface-200 dark:border-surface-700/50">
      <details class="group p-4 cursor-pointer">
        <summary class="font-bold flex items-center justify-between list-none text-surface-900 dark:text-surface-100">
          <span>{{ item.question }}</span>
          <span class="transition-transform group-open:rotate-180">▼</span>
        </summary>
        <p class="mt-2 text-surface-600 dark:text-surface-400 text-sm leading-relaxed">
          {{ item.answer }}
        </p>
      </details>
    </div>
  </div>
</template>

<script setup lang="ts">

const props = defineProps<{
	faq: Array<{
		question: string
		answer: string
	}>
}>()
// 计算属性：自动从 frontmatter 中读取 'faq' 字段
const faqList = computed(() => {
  return props.faq || []
})


// 2. SEO Schema 部分 (JSON-LD)
// 只有当有数据时才注入
if(faqList.value && faqList.value.length > 0){
	useSchemaOrg([
		defineWebPage({
			'@type': 'FAQPage',
			'mainEntity': faqList.value.map(item => defineQuestion({
				name: item.question,
				acceptedAnswer: item.answer
			}))
		})
	])
}
</script>