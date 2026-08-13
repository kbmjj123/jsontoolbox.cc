<template>
  <div class="relative" ref="dropdownRef">
    <button
      @click="isOpen = !isOpen"
      class="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-surface-600 hover:bg-surface-100 hover:text-surface-900 dark:text-surface-400 dark:hover:bg-surface-800 dark:hover:text-surface-100 transition-colors"
    >
      <Icon name="lucide:globe" class="h-4 w-4" />
      <span class="hidden lg:inline">{{ currentLocale?.name }}</span>
      <Icon name="lucide:chevron-down" class="h-3 w-3 transition-transform" :class="{ 'rotate-180': isOpen }" />
    </button>

    <Transition name="lang-drop">
      <div v-if="isOpen" class="absolute right-0 top-full mt-1 w-48 rounded-xl border border-surface-200 bg-white p-1.5 shadow-lg dark:border-surface-700 dark:bg-surface-800 z-50">
        <button
          v-for="loc in availableLocales"
          :key="loc.code"
          @click="switchLocale(loc.code)"
          class="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors"
          :class="loc.code === locale ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400' : 'text-surface-600 hover:bg-surface-50 dark:text-surface-400 dark:hover:bg-surface-700'"
        >
					<Icon :name="loc.flag" class="w-4 h-4"></Icon>
          <span>{{ loc.name }}</span>
        </button>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
const { locale, locales, setLocale } = useI18n()
const isOpen = ref(false)
const dropdownRef = ref<HTMLElement>()

const currentLocale = computed(() => {
  const locs = locales.value as Array<{ code: string; name: string; flag?: string }>
  return locs.find(l => l.code === locale.value)
})

const availableLocales = computed(() => {
  return locales.value as Array<{ code: string; name: string; flag?: string }>
})

const switchLocale = (code: string) => {
  setLocale(code)
  isOpen.value = false
}

const handleClickOutside = (e: MouseEvent) => {
  if (dropdownRef.value && !dropdownRef.value.contains(e.target as Node)) {
    isOpen.value = false
  }
}

onMounted(() => document.addEventListener('click', handleClickOutside))
onUnmounted(() => document.removeEventListener('click', handleClickOutside))
</script>
