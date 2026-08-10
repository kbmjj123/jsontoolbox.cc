<template>
  <div>
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <!-- Input -->
      <div>
        <div class="flex items-center justify-between mb-2">
          <label class="text-sm font-bold text-surface-700 dark:text-surface-300">Input JSON</label>
          <div class="flex gap-2">
            <button @click="pasteFromClipboard" class="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400">
              Paste
            </button>
            <button @click="clearInput" class="text-xs text-surface-500 hover:text-surface-700 dark:text-surface-400">
              Clear
            </button>
          </div>
        </div>
        <textarea
          v-model="inputJson"
          class="w-full h-64 rounded-xl border border-surface-200 bg-surface-50 p-4 font-mono text-sm text-surface-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-100 resize-none"
          placeholder='{"name": "Alice", "age": 30, "active": true}'
        ></textarea>
      </div>

      <!-- Output -->
      <div>
        <div class="flex items-center justify-between mb-2">
          <label class="text-sm font-bold text-surface-700 dark:text-surface-300">JSON Schema</label>
          <div class="flex gap-2">
            <button @click="copyOutput" class="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400">
              Copy
            </button>
            <button @click="downloadOutput" class="text-xs text-surface-500 hover:text-surface-700 dark:text-surface-400">
              Download
            </button>
          </div>
        </div>
        <div class="relative">
          <textarea
            v-model="outputSchema"
            readonly
            class="w-full h-64 rounded-xl border border-surface-200 bg-surface-50 p-4 font-mono text-sm text-surface-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-100 resize-none"
            placeholder="JSON Schema will appear here..."
          ></textarea>
          <div v-if="error" class="absolute bottom-2 left-2 right-2 rounded-lg bg-red-50 border border-red-200 p-2 text-xs text-red-700 dark:bg-red-900/30 dark:border-red-800 dark:text-red-400">
            {{ error }}
          </div>
        </div>
      </div>
    </div>

    <!-- Actions -->
    <div class="mt-4 flex flex-wrap gap-3">
      <button @click="generate" class="btn-primary px-5 py-2 text-xs">
        <Icon name="lucide:file-json" class="h-4 w-4 mr-1.5" />
        Generate Schema
      </button>
      <button @click="clearAll" class="rounded-xl border border-surface-200 bg-white px-4 py-2 text-xs font-bold text-surface-700 hover:bg-surface-50 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-300 dark:hover:bg-surface-700">
        Clear All
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
const inputJson = ref('')
const outputSchema = ref('')
const error = ref('')

const inferSchema = (value: any): any => {
  if (value === null) {
    return { type: 'null' }
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return { type: 'array' }
    }
    return {
      type: 'array',
      items: inferSchema(value[0])
    }
  }

  if (typeof value === 'object') {
    const properties: any = {}
    const required: string[] = []

    for (const [key, val] of Object.entries(value)) {
      properties[key] = inferSchema(val)
      required.push(key)
    }

    return {
      type: 'object',
      properties,
      required
    }
  }

  if (typeof value === 'string') {
    const schema: any = { type: 'string' }
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      schema.format = 'date'
    } else if (/^[^@]+@[^@]+$/.test(value)) {
      schema.format = 'email'
    } else if (/^https?:\/\//.test(value)) {
      schema.format = 'uri'
    }
    return schema
  }

  if (typeof value === 'number') {
    if (Number.isInteger(value)) {
      return { type: 'integer' }
    }
    return { type: 'number' }
  }

  if (typeof value === 'boolean') {
    return { type: 'boolean' }
  }

  return {}
}

const generate = () => {
  error.value = ''
  try {
    const parsed = JSON.parse(inputJson.value)
    const schema = {
      $schema: 'http://json-schema.org/draft-07/schema#',
      ...inferSchema(parsed)
    }
    outputSchema.value = JSON.stringify(schema, null, 2)
  } catch (e) {
    error.value = (e as Error).message
    outputSchema.value = ''
  }
}

const pasteFromClipboard = async () => {
  try {
    inputJson.value = await navigator.clipboard.readText()
  } catch (e) {
    console.error('Failed to read clipboard:', e)
  }
}

const clearInput = () => {
  inputJson.value = ''
  error.value = ''
}

const clearAll = () => {
  inputJson.value = ''
  outputSchema.value = ''
  error.value = ''
}

const copyOutput = async () => {
  try {
    await navigator.clipboard.writeText(outputSchema.value)
  } catch (e) {
    console.error('Failed to copy:', e)
  }
}

const downloadOutput = () => {
  const blob = new Blob([outputSchema.value], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'schema.json'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
</script>
