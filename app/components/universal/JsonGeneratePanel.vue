<template>
  <div class="h-full flex flex-col overflow-hidden">
    <!-- Tabs -->
    <div class="mb-2 flex gap-1">
      <button
        @click="tab = 'convert'"
        :class="tab === 'convert' ? 'bg-primary-600 text-white' : 'bg-white text-surface-600 hover:bg-surface-50 dark:bg-surface-800 dark:text-surface-400'"
        class="rounded-lg px-2.5 py-1 text-[11px] font-bold transition-colors"
      >
        {{ t('generate.convert') }}
      </button>
      <button
        @click="tab = 'api'"
        :class="tab === 'api' ? 'bg-primary-600 text-white' : 'bg-white text-surface-600 hover:bg-surface-50 dark:bg-surface-800 dark:text-surface-400'"
        class="rounded-lg px-2.5 py-1 text-[11px] font-bold transition-colors"
      >
        {{ t('generate.api') }}
      </button>
    </div>

    <p v-if="parsedData === null" class="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
      {{ t('generate.needValidJson') }}
    </p>

    <!-- Convert page (P1-5) -->
    <div v-else-if="tab === 'convert'" class="flex-1 min-h-0 flex gap-3">
      <div class="w-48 shrink-0 space-y-2 overflow-auto pr-1">
        <select
          v-model="format"
          class="w-full rounded-lg border border-surface-200 bg-white px-2 py-1 text-xs dark:border-surface-700 dark:bg-surface-800"
        >
          <option value="typescript">{{ t('generate.tsInterface') }}</option>
          <option value="tsType">{{ t('generate.tsType') }}</option>
          <option value="yaml">{{ t('generate.yaml') }}</option>
          <option value="csv">{{ t('generate.csv') }}</option>
          <option value="jsonSchema">{{ t('generate.jsonSchema') }}</option>
        </select>

        <input
          v-model="options.name"
          :placeholder="t('generate.rootName')"
          class="w-full rounded-lg border border-surface-200 bg-white px-2 py-1 text-xs dark:border-surface-700 dark:bg-surface-800"
        />

        <template v-if="format === 'typescript' || format === 'tsType'">
          <label v-for="opt in tsOptionKeys" :key="opt" class="flex items-center gap-1.5 text-[11px]">
            <input v-model="(options as any)[opt]" type="checkbox" class="rounded border-surface-300" />
            <span>{{ t(`generate.${opt}`) }}</span>
          </label>
        </template>
      </div>

      <div class="flex-1 min-h-0 flex flex-col">
        <div class="mb-1 flex justify-end gap-2">
          <button @click="copyOutput" class="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400">
            {{ copied ? '✓ Copied' : t('generate.copy') }}
          </button>
          <button @click="downloadOutput" class="text-xs text-surface-500 hover:text-surface-700 dark:text-surface-400">
            {{ t('generate.download') }}
          </button>
        </div>
        <pre class="flex-1 min-h-0 overflow-auto whitespace-pre rounded-xl border border-surface-200 bg-surface-50 p-3 font-mono text-[11px] dark:border-surface-700 dark:bg-surface-800">{{ output }}</pre>
      </div>
    </div>

    <!-- API page (P2-2): code only, nothing is ever sent -->
    <div v-else-if="tab === 'api'" class="flex-1 min-h-0 flex gap-3">
      <div class="w-56 shrink-0 space-y-2 overflow-auto pr-1">
        <select
          v-model="method"
          class="w-full rounded-lg border border-surface-200 bg-white px-2 py-1 text-xs dark:border-surface-700 dark:bg-surface-800"
        >
          <option v-for="m in methods" :key="m" :value="m">{{ m }}</option>
        </select>
        <input
          v-model="url"
          :placeholder="t('api.urlPlaceholder')"
          class="w-full rounded-lg border border-surface-200 bg-white px-2 py-1 text-xs dark:border-surface-700 dark:bg-surface-800"
        />

        <div class="space-y-1">
          <div class="flex items-center justify-between">
            <span class="text-[11px] font-bold text-surface-600 dark:text-surface-400">{{ t('api.headers') }}</span>
            <button @click="addHeader" class="text-[11px] text-primary-600 hover:text-primary-700 dark:text-primary-400">
              + {{ t('api.addHeader') }}
            </button>
          </div>
          <div v-for="(h, i) in headers" :key="i" class="flex gap-1">
            <input
              v-model="h.key"
              :placeholder="t('api.headerKey')"
              class="w-1/2 min-w-0 rounded border border-surface-200 bg-white px-1.5 py-1 text-[11px] dark:border-surface-700 dark:bg-surface-800"
            />
            <input
              v-model="h.value"
              :placeholder="t('api.headerValue')"
              class="w-1/2 min-w-0 rounded border border-surface-200 bg-white px-1.5 py-1 text-[11px] dark:border-surface-700 dark:bg-surface-800"
            />
            <button @click="removeHeader(i)" class="shrink-0 px-1 text-surface-400 hover:text-red-500">×</button>
          </div>
        </div>
        <p class="text-[10px] text-surface-400">{{ t('api.note') }}</p>
      </div>

      <div class="flex-1 min-h-0 space-y-3 overflow-auto">
        <div v-for="snippet in snippets" :key="snippet.kind" class="rounded-xl border border-surface-200 dark:border-surface-700">
          <div class="flex items-center justify-between border-b border-surface-200 px-3 py-1.5 dark:border-surface-700">
            <span class="text-[11px] font-bold text-surface-600 dark:text-surface-400">{{ snippet.label }}</span>
            <div class="flex gap-2">
              <button @click="copyText(snippet.code)" class="text-[11px] text-primary-600 hover:text-primary-700 dark:text-primary-400">
                {{ t('generate.copy') }}
              </button>
              <button @click="downloadText(snippet.code, snippet.filename)" class="text-[11px] text-surface-500 hover:text-surface-700 dark:text-surface-400">
                {{ t('generate.download') }}
              </button>
            </div>
          </div>
          <pre class="max-h-52 overflow-auto whitespace-pre p-3 font-mono text-[11px]">{{ snippet.code }}</pre>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { convert, generateApiSnippet, type ApiSnippetOptions, type ConvertFormat } from '~/utils/codegen'

const props = defineProps<{ parsedData: unknown | null }>()
const { t } = useI18n()

const tab = ref<'convert' | 'api'>('convert')
const copied = ref(false)

// ── Convert (P1-5) ─────────────────────────────────────────────
const format = ref<ConvertFormat>('typescript')
const options = reactive({
  name: 'Root',
  optional: false,
  useNull: true,
  expand: true,
  comments: false,
  camelCase: false,
  singularArray: true,
})
const tsOptionKeys = ['optional', 'useNull', 'expand', 'comments', 'camelCase', 'singularArray'] as const

const output = computed(() => {
  if (props.parsedData === null) return ''
  try {
    return convert(props.parsedData, format.value, { ...options })
  } catch (e) {
    return (e as Error).message
  }
})

const fileMeta = computed(() => {
  switch (format.value) {
    case 'typescript':
    case 'tsType': return { name: 'types.ts', mime: 'text/plain' }
    case 'yaml': return { name: 'output.yaml', mime: 'text/yaml' }
    case 'csv': return { name: 'output.csv', mime: 'text/csv' }
    case 'jsonSchema': return { name: 'schema.json', mime: 'application/json' }
  }
})

async function copyOutput() {
  if (!output.value) return
  const ok = await copyToClipboard(output.value)
  if (!ok) return
  copied.value = true
  setTimeout(() => { copied.value = false }, 2000)
}

function downloadOutput() {
  if (!output.value) return
  downloadFile(output.value, fileMeta.value.name, fileMeta.value.mime)
}

// ── API snippets (P2-2) ────────────────────────────────────────
const methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
const method = ref('POST')
const url = ref('https://api.example.com/resource')
const headers = ref<{ key: string; value: string }[]>([{ key: 'Content-Type', value: 'application/json' }])

function addHeader() {
  headers.value = [...headers.value, { key: '', value: '' }]
}
function removeHeader(index: number) {
  headers.value = headers.value.filter((_, i) => i !== index)
}

const apiOptions = computed<ApiSnippetOptions>(() => ({
  method: method.value,
  url: url.value,
  headers: Object.fromEntries(
    headers.value.filter((h) => h.key.trim()).map((h) => [h.key.trim(), h.value]),
  ),
  body: props.parsedData ?? undefined,
}))

const snippets = computed(() => {
  const opts = apiOptions.value
  return [
    { kind: 'fetch', label: t('api.fetch'), filename: 'request.js', code: generateApiSnippet('fetch', opts) },
    { kind: 'curl', label: t('api.curl'), filename: 'request.sh', code: generateApiSnippet('curl', opts) },
    { kind: 'axios', label: t('api.axios'), filename: 'request-axios.js', code: generateApiSnippet('axios', opts) },
    { kind: 'python', label: t('api.python'), filename: 'request.py', code: generateApiSnippet('python', opts) },
  ]
})

async function copyText(text: string) {
  await copyToClipboard(text)
}

function downloadText(text: string, filename: string) {
  downloadFile(text, filename, 'text/plain')
}
</script>
