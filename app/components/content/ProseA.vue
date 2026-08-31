<script setup lang="ts">
// 接收 Markdown 链接传来的参数
const props = defineProps({
  href: {
    type: String,
    default: ''
  },
	title: {
		type: String,
		default: ''
	},
  target: {
    type: String,
    default: undefined,
    required: false
  }
})

const localePath = useLocalePath()

// 判断逻辑：
// 1. 必须以 / 开头
// 2. 不能以 // 开头 (防止 //google.com 这种协议无关链接)
// 3. 不是锚点链接 (#)
const isInternalRoute = computed(() => {
  const href = props.href
  return href && href.startsWith('/') && !href.startsWith('//') && !href.startsWith('https://')
})

// 计算最终路径
const finalPath = computed(() => {
  if (isInternalRoute.value) {
    // 核心魔法：使用 localePath 自动处理语言前缀
    // 输入 '/contact' -> 在中文下变成 '/zh/contact'
    return localePath(props.href)
  }
  return props.href
})
</script>

<template>
  <NuxtLink
    v-if="isInternalRoute"
		:title="title"
    :to="finalPath"
    :target="target"
  >
    <slot />
  </NuxtLink>

  <a
    v-else
    :href="href"
		:title="title"
    :target="target"
    :rel="target === '_blank' ? 'noopener noreferrer' : undefined"
  >
    <slot />
  </a>
</template>