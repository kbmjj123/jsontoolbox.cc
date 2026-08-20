<template>
  <div class="h-full flex flex-col">
    <!-- Header -->
    <div class="flex items-center justify-between mb-2">
      <label class="text-sm font-bold text-surface-700 dark:text-surface-300">{{ label }}</label>
      <div class="flex gap-2 items-center">
        <!-- View mode toggle -->
        <div
          v-if="showModeToggle"
          class="flex rounded-lg border border-surface-200 dark:border-surface-700 overflow-hidden"
        >
          <button
            @click="emit('update:viewMode', 'text')"
            :class="viewMode === 'text' ? 'bg-primary-600 text-white' : 'bg-white text-surface-600 dark:bg-surface-800 dark:text-surface-400'"
            class="px-2 py-0.5 text-xs transition-colors"
          >
            Text
          </button>
          <button
            @click="emit('update:viewMode', 'tree')"
            :class="viewMode === 'tree' ? 'bg-primary-600 text-white' : 'bg-white text-surface-600 dark:bg-surface-800 dark:text-surface-400'"
            class="px-2 py-0.5 text-xs transition-colors"
          >
            Tree
          </button>
          <button
            v-if="parsedData !== null"
            @click="emit('update:viewMode', 'rich')"
            :class="viewMode === 'rich' ? 'bg-primary-600 text-white' : 'bg-white text-surface-600 dark:bg-surface-800 dark:text-surface-400'"
            class="px-2 py-0.5 text-xs transition-colors"
          >
            Rich
          </button>
        </div>

        <slot name="actions" />

        <button
          v-if="showCopy"
          @click="handleCopy"
          class="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400"
        >
          {{ copied ? '✓ Copied!' : $t('system.copy') }}
        </button>
        <button
          v-if="showDownload"
          @click="emit('download')"
          class="text-xs text-surface-500 hover:text-surface-700 dark:text-surface-400"
        >
          {{ $t('system.download') }}
        </button>
      </div>
    </div>

    <!-- Text view -->
    <div v-show="currentMode === 'text'" class="relative flex-1 min-h-0">
      <div
        :class="[hasContent ? 'text-surface-900 dark:text-surface-100' : 'text-surface-400 dark:text-surface-500']"
        class="w-full h-full rounded-xl border border-surface-200 bg-surface-50 font-mono text-sm overflow-auto dark:border-surface-700 dark:bg-surface-800"
      >
        <div v-if="hasContent" class="flex">
          <div class="flex-none select-none text-right pr-3 pl-2 py-4 text-surface-400 dark:text-surface-500 border-r border-surface-200 dark:border-surface-700 leading-[1.5]">
            <div v-for="n in contentLines.length" :key="n">{{ n }}</div>
          </div>
          <pre class="flex-1 p-4 overflow-x-auto whitespace-pre">{{ content }}</pre>
        </div>
        <div v-else class="p-4">{{ emptyText }}</div>
      </div>
      <div
        v-if="error"
        class="absolute bottom-2 left-2 right-2 rounded-lg bg-red-50 border border-red-200 p-2 text-xs text-red-700 dark:bg-red-900/30 dark:border-red-800 dark:text-red-400"
      >
        {{ error }}
      </div>
    </div>

    <!-- Tree view -->
    <div
      v-show="currentMode === 'tree'"
      class="flex-1 min-h-0 overflow-auto rounded-xl border border-surface-200 bg-surface-50 p-4 dark:border-surface-700 dark:bg-surface-800"
    >
      <TreeNode
        v-if="parsedData !== null"
        :data="parsedData"
        :path="''"
        :search="''"
        @copy="(path: string) => emit('copyPath', path)"
      />
      <div v-else class="flex items-center justify-center h-full text-surface-400 text-sm">
        {{ error || emptyText }}
      </div>
    </div>

    <!-- Rich view -->
    <div
      v-show="currentMode === 'rich'"
      class="flex-1 min-h-0 overflow-auto rounded-xl border border-surface-200 bg-surface-50 p-4 dark:border-surface-700 dark:bg-surface-800"
    >
      <RichValueNode
        v-if="parsedData !== null"
        :data="parsedData"
        :path="''"
      />
      <div v-else class="flex items-center justify-center h-full text-surface-400 text-sm">
        {{ error || emptyText }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  label?: string
  content?: string
  error?: string
  viewMode?: 'text' | 'tree' | 'rich'
  showModeToggle?: boolean
  parsedData?: unknown | null
  showCopy?: boolean
  showDownload?: boolean
  downloadFilename?: string
  emptyText?: string
}

const props = withDefaults(defineProps<Props>(), {
  label: 'Output',
  content: '',
  error: '',
  viewMode: 'text',
  showModeToggle: false,
  parsedData: null,
  showCopy: true,
  showDownload: true,
  downloadFilename: 'output.json',
  emptyText: 'Result will appear here',
})

const emit = defineEmits<{
  'update:viewMode': [mode: 'text' | 'tree' | 'rich']
  copy: []
  download: []
  copyPath: [path: string]
}>()

const copied = ref(false)

const currentMode = computed(() => props.viewMode)
const hasContent = computed(() => !!props.content)
const contentLines = computed(() => (props.content || '').split('\n'))

const handleCopy = async () => {
  emit('copy')
  copied.value = true
  setTimeout(() => {
    copied.value = false
  }, 2000)
}
</script>
