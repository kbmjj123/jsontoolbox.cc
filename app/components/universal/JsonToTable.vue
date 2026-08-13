<template>
  <div>
    <div class="mb-4">
      <JsonInputEditor
        v-model="inputJson"
        :label="ui?.labelInputJson ?? 'Input JSON Array'"
        height="h-40"
        placeholder='[{"name": "Alice", "age": 30, "city": "New York"}, {"name": "Bob", "age": 25, "city": "San Francisco"}]'
        @clear="clearAll"
      />
    </div>

    <!-- Actions -->
    <div class="mb-4 flex flex-wrap gap-3">
      <button @click="renderTable" class="btn-primary px-5 py-2 text-xs">
        <Icon name="lucide:table" class="h-4 w-4 mr-1.5" />
        {{ ui?.btnRender ?? 'Render Table' }}
      </button>
      <button @click="clearAll" class="rounded-xl border border-surface-200 bg-white px-4 py-2 text-xs font-bold text-surface-700 hover:bg-surface-50 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-300 dark:hover:bg-surface-700">
        {{ $t('system.clearAll') }}
      </button>
    </div>

    <!-- Table -->
    <div v-if="headers.length > 0" class="rounded-xl border border-surface-200 bg-white dark:border-surface-700 dark:bg-surface-900 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-surface-50 dark:bg-surface-800">
              <th
                v-for="header in headers"
                :key="header"
                class="px-4 py-3 text-left font-bold text-surface-700 dark:text-surface-300 border-b border-surface-200 dark:border-surface-700"
              >
                {{ header }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(row, index) in rows"
              :key="index"
              class="border-b border-surface-100 dark:border-surface-800 last:border-0"
            >
              <td
                v-for="header in headers"
                :key="header"
                class="px-4 py-3 text-surface-900 dark:text-surface-100"
              >
                {{ formatCell(row[header]) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Stats -->
    <div v-if="rows.length > 0" class="mt-4 flex flex-wrap gap-3">
      <div class="stat-chip">
        <Icon name="lucide:rows" class="h-3 w-3" />
        {{ (ui?.statusRows ?? '{count} rows').replace('{count}', String(rows.length)) }}
      </div>
      <div class="stat-chip">
        <Icon name="lucide:columns" class="h-3 w-3" />
        {{ (ui?.statusColumns ?? '{count} columns').replace('{count}', String(headers.length)) }}
      </div>
    </div>

    <!-- Error -->
    <div v-if="error" class="mt-4 rounded-lg bg-red-50 border border-red-200 p-3 text-xs text-red-700 dark:bg-red-900/30 dark:border-red-800 dark:text-red-400">
      {{ error }}
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ tool: any }>()
const ui = computed(() => props.tool?.ui)

const inputJson = ref('')
const error = ref('')
const headers = ref<string[]>([])
const rows = ref<any[]>([])

const formatCell = (value: any): string => {
  if (value === null || value === undefined) return ''
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

const renderTable = () => {
  error.value = ''
  headers.value = []
  rows.value = []

  try {
    const data = JSON.parse(inputJson.value)
    if (!Array.isArray(data)) {
      error.value = ui.value?.errorInvalidInput ?? 'Input must be a JSON array'
      return
    }
    if (data.length === 0) {
      error.value = ui.value?.errorEmptyArray ?? 'Array is empty'
      return
    }

    const allHeaders = new Set<string>()
    data.forEach(item => {
      if (typeof item === 'object' && item !== null) {
        Object.keys(item).forEach(key => allHeaders.add(key))
      }
    })

    headers.value = Array.from(allHeaders)
    rows.value = data
  } catch (e) {
    error.value = (e as Error).message
  }
}

const clearAll = () => {
  error.value = ''
  headers.value = []
  rows.value = []
}
</script>
