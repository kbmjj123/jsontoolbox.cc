<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="isOpen" class="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] p-4" @click.self="$emit('close')">
        <div class="fixed inset-0 bg-black/50 backdrop-blur-sm" @click="$emit('close')"></div>
        <div class="relative w-full max-w-lg rounded-2xl bg-white shadow-xl dark:bg-surface-900 overflow-hidden">
          <!-- Search Input -->
          <div class="p-4 border-b border-surface-200 dark:border-surface-700">
            <div class="relative">
              <Icon name="lucide:search" class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-400" />
              <input
                v-model="query"
                type="text"
                placeholder="Search tools..."
                class="w-full rounded-xl border-0 bg-surface-50 py-2.5 pl-10 pr-4 text-sm text-surface-900 placeholder-surface-400 focus:ring-2 focus:ring-primary-500/20 dark:bg-surface-800 dark:text-surface-100"
                autofocus
              />
              <kbd class="absolute right-3 top-1/2 -translate-y-1/2 rounded border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 px-1.5 py-0.5 text-[10px] font-mono text-surface-400">
                ESC
              </kbd>
            </div>
          </div>

          <!-- Results -->
          <div class="max-h-[50vh] overflow-y-auto p-2">
            <div v-if="filteredTools.length === 0" class="py-8 text-center text-sm text-surface-500 dark:text-surface-400">
              No tools found.
            </div>
            <NuxtLink
              v-for="tool in filteredTools"
              :key="tool.slug"
              :to="tool.path"
              class="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors hover:bg-surface-50 dark:hover:bg-surface-800"
              @click="$emit('close')"
            >
              <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
                <Icon :name="tool.icon" class="h-4 w-4" />
              </div>
              <div>
                <div class="font-medium text-surface-900 dark:text-surface-100">{{ tool.name }}</div>
                <div class="text-xs text-surface-500 dark:text-surface-400 line-clamp-1">{{ tool.description }}</div>
              </div>
            </NuxtLink>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
defineProps<{
  isOpen: boolean
  files?: File[]
}>()

defineEmits<{
  close: []
}>()

const { allTools } = useTools()
const query = ref('')

const filteredTools = computed(() => {
  if (!query.value.trim()) return allTools.value.slice(0, 10)
  const q = query.value.toLowerCase()
  return allTools.value.filter(tool =>
    tool.name.toLowerCase().includes(q) ||
    tool.description.toLowerCase().includes(q)
  ).slice(0, 10)
})

// ESC to close
const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape') {
    query.value = ''
  }
}

onMounted(() => window.addEventListener('keydown', handleKeydown))
onUnmounted(() => window.removeEventListener('keydown', handleKeydown))
</script>
