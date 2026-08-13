<template>
  <header
    class="sticky top-0 z-50 w-full border-b transition-all duration-300 backdrop-blur-xl"
    :class="[
      isScrolled
        ? 'border-surface-200 bg-white/70 dark:border-surface-700 dark:bg-surface-900/80'
        : 'border-transparent bg-white/60 dark:bg-surface-900',
    ]">
    <div
      class="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-5">

      <!-- Logo -->
      <NuxtLinkLocale
        to="/"
        :title="$t('app.name')"
        class="flex items-center gap-2.5 group flex-shrink-0 mr-3"
        @click="drawerOpen = false">
        <img
          src="/favicon.svg"
          alt="JSON Toolbox Logo"
          class="h-8 w-8 transition-transform group-hover:scale-105"
        />
        <span class="text-2xl font-black tracking-tight text-surface-900 dark:text-surface-100">
          <span class="text-primary-600 dark:text-primary-400">JSON</span>Toolbox
        </span>
      </NuxtLinkLocale>

      <!-- 桌面端导航链接 -->
      <nav class="hidden md:flex items-center gap-1 flex-1" aria-label="Main navigation">
        <NuxtLinkLocale
          v-for="link in navLinks"
          :key="link.to"
          :to="link.to"
          class="rounded-lg px-3 py-1.5 text-sm text-surface-600 hover:bg-surface-100 hover:text-surface-900 dark:text-surface-400 dark:hover:bg-surface-800 dark:hover:text-surface-100 transition-colors"
        >
          {{ $t(link.labelKey) }}
        </NuxtLinkLocale>

        <!-- 快捷搜索 (Ctrl+K) -->
        <button
          @click="openQuickSearch()"
          class="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-surface-600 hover:bg-surface-100 hover:text-surface-900 dark:text-surface-400 dark:hover:bg-surface-800 dark:hover:text-surface-100 transition-colors"
        >
          <Icon name="lucide:command" class="h-4 w-4" />
          <span class="hidden xl:inline">{{ $t('app.menu.quick_search') }}</span>
          <kbd class="hidden lg:inline-flex items-center rounded border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 px-1.5 py-0.5 text-[10px] font-mono text-surface-400">⌘K</kbd>
        </button>
      </nav>

      <!-- 右侧工具栏 -->
      <div class="flex items-center gap-2">
        <!-- 本地标识 badge（桌面端） -->
        <div class="hidden md:flex items-center gap-1.5 rounded-full border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800/80 px-2.5 py-1 text-[11px] font-medium text-surface-500 dark:text-surface-400">
          <span class="h-1.5 w-1.5 rounded-full bg-accent-500"></span>
          {{ $t('nav.local_badge') }}
        </div>

        <!-- 语言切换 -->
        <LangSwitcher class="hidden md:flex" />

        <!-- 暗色模式 -->
        <ThemeToggle />

        <!-- GitHub -->
        <a
          href="https://github.com/kbmjj123/jsontoolbox.cc"
          target="_blank"
          rel="noopener"
          class="hidden md:flex h-8 w-8 items-center justify-center rounded-lg text-surface-500 hover:bg-surface-100 hover:text-surface-900 dark:text-surface-400 dark:hover:bg-surface-800 dark:hover:text-surface-100 transition-colors"
          :aria-label="$t('nav.github')"
        >
          <Icon name="lucide:github" class="h-4 w-4" />
        </a>

        <!-- 移动端汉堡菜单 -->
        <button
          class="flex md:hidden h-9 w-9 items-center justify-center rounded-lg border transition-colors border-surface-200 bg-white text-surface-500 hover:bg-surface-50 dark:border-surface-800 dark:bg-surface-900 dark:text-surface-400 dark:hover:bg-surface-800"
          :aria-label="$t('nav.open_menu')"
          :aria-expanded="drawerOpen"
          @click="drawerOpen = true"
        >
          <Icon name="lucide:menu" class="h-5 w-5" />
        </button>
      </div>
    </div>

    <!-- 移动端抽屉 -->
    <Drawer :open="drawerOpen" @close="drawerOpen = false" />
  </header>
</template>

<script setup lang="ts">
const drawerOpen = ref(false)
const isScrolled = ref(false)

const navLinks = [
  { to: '/tools',   labelKey: 'app.nav.tools' },
  // { to: '/blog',    labelKey: 'app.nav.blog' },
  { to: '/about',   labelKey: 'app.nav.about' },
  { to: '/contact', labelKey: 'app.nav.contact' },
]

// 全局快捷搜索
const { open: openQuickSearch } = useQuickToolSearch()

// 路由切换时关闭抽屉
const route = useRoute()
watch(() => route.fullPath, () => { drawerOpen.value = false })

// 滚动监听
const handleScroll = () => {
  isScrolled.value = window.scrollY > 10
}

onMounted(() => window.addEventListener('scroll', handleScroll))
onUnmounted(() => window.removeEventListener('scroll', handleScroll))
</script>
