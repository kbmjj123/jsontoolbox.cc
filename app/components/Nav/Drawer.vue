<template>
  <Teleport to="body">
    <Transition name="drawer-fade">
      <div v-if="open" class="fixed inset-0 z-[99] bg-black/50 backdrop-blur-sm" @click="$emit('close')"></div>
    </Transition>
    <Transition name="drawer-slide">
      <div v-if="open" class="fixed inset-y-0 left-0 z-[100] w-80 max-w-[85vw] bg-white dark:bg-surface-900 shadow-xl overflow-y-auto">
        <div class="p-5">
          <!-- Header -->
          <div class="flex items-center justify-between mb-6">
            <NuxtLinkLocale to="/" class="flex items-center gap-2" @click="$emit('close')">
              <img
                src="/favicon.svg"
                alt="JSON Toolbox Logo"
                class="h-8 w-8"
              />
              <span class="text-xl font-black text-surface-900 dark:text-surface-100">
                <span class="text-primary-600">JSON</span>Toolbox
              </span>
            </NuxtLinkLocale>
            <button
              @click="$emit('close')"
              class="flex h-8 w-8 items-center justify-center rounded-lg text-surface-500 hover:bg-surface-100 dark:text-surface-400 dark:hover:bg-surface-800"
            >
              <Icon name="lucide:x" class="h-5 w-5" />
            </button>
          </div>

          <!-- Navigation Links -->
          <nav class="space-y-1">
            <NuxtLinkLocale
              v-for="link in navLinks"
              :key="link.to"
              :to="link.to"
              class="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-surface-700 hover:bg-surface-100 dark:text-surface-300 dark:hover:bg-surface-800 transition-colors"
              @click="$emit('close')"
            >
              <Icon :name="link.icon" class="h-4 w-4 text-surface-400" />
              {{ $t(link.labelKey) }}
            </NuxtLinkLocale>
          </nav>

          <!-- Language Switcher -->
          <div class="mt-6 pt-6 border-t border-surface-200 dark:border-surface-700">
            <p class="text-xs font-bold text-surface-500 uppercase tracking-wider mb-3">{{ $t('nav.language') }}</p>
            <div class="grid grid-cols-2 gap-2">
              <button
                v-for="loc in locales"
                :key="loc.code"
                @click="setLocale(loc.code); $emit('close')"
                class="flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors"
                :class="loc.code === locale ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400' : 'text-surface-600 hover:bg-surface-50 dark:text-surface-400 dark:hover:bg-surface-800'"
              >
                <span>{{ (loc as any).flag }}</span>
                <span>{{ loc.name }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
defineProps<{
  open: boolean
}>()

defineEmits<{
  close: []
}>()

const { locale, locales, setLocale } = useI18n()

const navLinks = [
  { to: '/tools',   labelKey: 'app.nav.tools',   icon: 'lucide:wrench' },
  { to: '/blog',    labelKey: 'app.nav.blog',     icon: 'lucide:file-text' },
  { to: '/about',   labelKey: 'app.nav.about',    icon: 'lucide:info' },
  { to: '/contact', labelKey: 'app.nav.contact',  icon: 'lucide:mail' },
]
</script>
