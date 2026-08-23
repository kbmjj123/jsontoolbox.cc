<template>
  <nav class="hidden xl:block sticky top-28 right-10 w-64 flex-shrink-0 self-start z-20">
    <div class="flex items-center gap-2 mb-6 text-surface-900 dark:text-surface-100 font-bold text-xs uppercase tracking-widest opacity-60">
      <Icon name="lucide:list-tree" class="w-4 h-4 text-primary-500" />
      {{ $t('common.toc') }}
    </div>
    
    <div class="relative border-l-2 border-surface-200 dark:border-surface-800 ml-1">
      <div 
        class="absolute left-[-2px] w-[2px] bg-primary-500 transition-all duration-300 shadow-[0_0_8px_rgba(59,130,246,0.5)]"
        :style="{ height: `${activeHeight}px`, top: `${activeTop}px`, opacity: activeId ? 1 : 0 }"
      ></div>

      <ul class="space-y-1">
        <li 
          v-for="link in links" 
          :key="link.id" 
          :class="[link.depth === 3 ? 'ml-4' : '']"
        >
          <a 
            :id="`toc-link-${link.id}`"
            :href="`#${link.id}`"
            @click.prevent="scrollTo(link.id)"
            class="block py-2 pl-4 text-[13px] leading-snug transition-all duration-200"
            :class="[
              activeId === link.id 
                ? 'text-primary-600 dark:text-primary-400 font-bold bg-primary-500/5' 
                : 'text-surface-500 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-100'
            ]"
          >
            <span class="line-clamp-2">{{ link.text }}</span>
          </a>
        </li>
      </ul>
    </div>
  </nav>

  <Teleport to="body">
    <div class="xl:hidden">
      <button 
        v-if="links.length > 0"
        @click="isMobileMenuOpen = true"
        class="fixed bottom-6 right-6 z-50 p-4 rounded-full bg-primary-600 text-white shadow-2xl hover:scale-110 active:scale-95 transition-all"
        aria-label="Open Table of Contents"
      >
        <Icon name="lucide:list-tree" class="w-6 h-6" />
      </button>

      <Transition name="fade">
        <div v-if="isMobileMenuOpen" class="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm" @click="isMobileMenuOpen = false" />
      </Transition>

      <Transition name="slide-up">
        <div 
          v-if="isMobileMenuOpen" 
          class="fixed bottom-0 inset-x-0 z-[70] w-full max-h-[80vh] bg-white dark:bg-surface-900 rounded-t-3xl shadow-2xl overflow-hidden flex flex-col"
        >
          <div class="p-6 border-b border-surface-100 dark:border-surface-800 flex justify-between items-center">
            <h3 class="font-bold text-xl dark:text-surface-100">目录内容</h3>
            <button @click="isMobileMenuOpen = false" class="p-2 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-full transition-colors">
              <Icon name="lucide:x" class="w-6 h-6 text-surface-400" />
            </button>
          </div>
          
          <div class="p-6 overflow-y-auto pb-12">
            <ul class="space-y-4">
              <li v-for="link in links" :key="link.id" :class="[link.depth === 3 ? 'ml-6' : '']">
                <a 
                  :href="`#${link.id}`" 
                  @click.prevent="scrollTo(link.id); isMobileMenuOpen = false"
                  class="block text-lg py-2 transition-colors"
                  :class="activeId === link.id ? 'text-primary-600 font-bold' : 'text-surface-600 dark:text-surface-300'"
                >
                  {{ link.text }}
                </a>
              </li>
            </ul>
          </div>
        </div>
      </Transition>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
interface TocLink {
  id: string
  text: string
  depth: number
}

const props = defineProps<{
  links: TocLink[]
}>()

const activeId = ref('')
const isMobileMenuOpen = ref(false)
const activeTop = ref(0)
const activeHeight = ref(0)

// 修复高亮错位的核心逻辑
const updateActiveId = () => {
  const headings = props.links.map(l => document.getElementById(l.id)).filter(Boolean)
  // 设置触发偏移量：当标题滚动到距离顶部 120px 处触发高亮（避开顶部导航栏）
  const triggerOffset = 120 
  
  let currentId = ''
  for (const heading of headings) {
    if (heading && heading.getBoundingClientRect().top <= triggerOffset) {
      currentId = heading.id
    } else {
      break
    }
  }
  activeId.value = currentId
}

// 监听 activeId 变化，同步指示器位置
watch(activeId, (newId) => {
  if (!newId) return
  nextTick(() => {
    const activeLink = document.getElementById(`toc-link-${newId}`)
    if (activeLink) {
      activeTop.value = activeLink.offsetTop
      activeHeight.value = activeLink.offsetHeight
    }
  })
})

const scrollTo = (id: string) => {
  const el = document.getElementById(id)
  if (el) {
    const offset = 100 // 跳转后上方留出的空间
    const y = el.getBoundingClientRect().top + window.pageYOffset - offset
    window.scrollTo({ top: y, behavior: 'smooth' })
  }
}

onMounted(() => {
  window.addEventListener('scroll', updateActiveId)
  updateActiveId() // 初始化执行一次
})

onUnmounted(() => window.removeEventListener('scroll', updateActiveId))
</script>
