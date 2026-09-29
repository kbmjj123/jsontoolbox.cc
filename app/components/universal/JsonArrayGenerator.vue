<template>
  <ResizablePanel v-model:fullscreen="fullscreen" :initial-ratio="0.5" responsive>
    <template #first>
      <div class="h-full pr-3 flex flex-col gap-4 overflow-auto">
        <div>
          <label class="block text-xs font-bold text-surface-600 dark:text-surface-300 mb-1.5">{{ props.tool.ui?.label_count }}</label>
          <input
            v-model="count"
            type="number"
            min="1"
            class="w-32 rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm dark:border-surface-700 dark:bg-surface-800"
          />
        </div>
        <div>
          <label class="block text-xs font-bold text-surface-600 dark:text-surface-300 mb-1.5">{{ props.tool.ui?.label_fields }}</label>
          <input
            v-model="fields"
            type="text"
            :placeholder="props.tool.ui?.placeholder_fields"
            class="w-full rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm dark:border-surface-700 dark:bg-surface-800"
          />
          <p v-if="props.tool.ui?.hint_fields" class="mt-1.5 text-xs text-surface-400 dark:text-surface-500 leading-relaxed">
            {{ props.tool.ui?.hint_fields }}
          </p>
        </div>
        <button @click="generate" class="btn-primary px-5 py-2 text-xs self-start">
          <Icon name="lucide:boxes" class="h-4 w-4 mr-1.5" />
          {{ props.tool.ui?.btn_generate }}
        </button>
        <p v-if="error" class="text-xs text-red-500">{{ friendlyError }}</p>
      </div>
    </template>

    <template #second>
      <div class="h-full pl-3 overflow-hidden flex flex-col">
        <JsonOutputPanel
          :label="props.tool.ui?.label_output"
          :content="outputJson"
          :parsed-data="parsedData"
          :error="error"
          :friendly-message="friendlyError"
          :view-mode="viewMode"
          :show-view-toggle="false"
          :show-copy="false"
          :show-download="false"
          :enable-tree-search="true"
          :empty-text="props.tool.ui?.placeholder_output"
        >
          <template #actions>
            <div class="flex rounded-lg border border-surface-200 dark:border-surface-700 overflow-hidden">
              <button
                v-for="m in viewModes"
                :key="m"
                @click="viewMode = m"
                :class="viewMode === m ? 'bg-primary-600 text-white' : 'bg-white text-surface-600 dark:bg-surface-800 dark:text-surface-400'"
                class="px-2 py-0.5 text-xs transition-colors"
              >
                {{ props.tool.ui?.[`btn_view_${m}`] }}
              </button>
            </div>
          </template>
        </JsonOutputPanel>
      </div>
    </template>

    <template #toolbar-right>
      <div class="flex items-center gap-2 shrink-0">
        <button
          v-if="outputJson && !error"
          @click="copyOutput"
          class="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400"
        >
          {{ props.tool.ui?.btn_copy }}
        </button>
        <button
          v-if="outputJson && !error"
          @click="downloadOutput"
          class="text-xs text-surface-500 hover:text-surface-700 dark:text-surface-400"
        >
          {{ props.tool.ui?.btn_download }}
        </button>
      </div>
    </template>
  </ResizablePanel>
</template>

<script setup lang="ts">
const props = defineProps<{ tool: any }>()
const { t } = useI18n()
const toast = useToast()

const count = ref(2)
const fields = ref('id, name, email')
const outputJson = ref('')
const parsedData = ref<unknown>(null)
const error = ref('')
const friendlyError = ref('')
const fullscreen = ref(false)
const viewMode = ref<'text' | 'rich' | 'table'>('text')
const viewModes = ['text', 'rich', 'table'] as const

// ---------- value generators ----------
const randInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min
const randFloat = (min: number, max: number) => Math.random() * (max - min) + min
const round = (n: number, d: number) => Number(n.toFixed(d))
const phone = (i: number) => `+1-555-${String(100 + (i % 900)).padStart(3, '0')}`
const uuid = () =>
  globalThis.crypto?.randomUUID?.() ??
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
const isoDate = (i: number) => {
  const d = new Date(Date.UTC(2023, 0, 1))
  d.setUTCDate(d.getUTCDate() + i)
  return d.toISOString().slice(0, 10)
}
const isoDateTime = (i: number) => {
  const d = new Date(Date.UTC(2023, 0, 1, 0, 0, 0))
  d.setUTCDate(d.getUTCDate() + i)
  return d.toISOString()
}

const sampleLabel = (key: 'sample_name' | 'sample_value' | 'sample_text', index: number) =>
  (props.tool.ui?.[key] ?? '{n}').replace('{n}', String(index + 1))

// ---------- spec parsing ----------
interface FieldSpec {
  path: string[]
  type?: string
  rule: string[]
}

function parseSpecs(raw: string): FieldSpec[] {
  return raw
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
    .map(spec => {
      const parts = spec.split(':')
      const path = parts[0]
        .split('.')
        .map(k => k.trim())
        .filter(Boolean)
      const type = parts[1]?.trim().toLowerCase()
      const rule = parts.slice(2).map(r => r.trim())
      return { path, type: type || undefined, rule }
    })
}

function parseRange(s: string | undefined, defMin: number, defMax: number): [number, number] {
  if (!s) return [defMin, defMax]
  const m = /(-?\d+)\s*-\s*(-?\d+)/.exec(s)
  if (m) return [Number(m[1]), Number(m[2])]
  return [defMin, defMax]
}

// ---------- value by type ----------
function typedValue(type: string, rule: string[], fieldName: string, index: number): unknown {
  switch (type) {
    case 'int':
    case 'integer': {
      const [min, max] = parseRange(rule[0], 1, 100)
      return randInt(min, max)
    }
    case 'number':
    case 'float': {
      const [min, max] = parseRange(rule[0], 0, 1000)
      return round(randFloat(min, max), 2)
    }
    case 'bool':
    case 'boolean':
      return index % 2 === 0
    case 'email':
      return `user${index + 1}@example.com`
    case 'date':
      return isoDate(index)
    case 'datetime':
      return isoDateTime(index)
    case 'uuid':
      return uuid()
    case 'url':
    case 'link':
      return `https://example.com/${fieldName}/${index + 1}`
    case 'phone':
    case 'mobile':
      return phone(index)
    case 'enum': {
      const opts = (rule[0] || '').split('|').filter(Boolean)
      if (opts.length === 0) return sampleLabel('sample_value', index)
      return opts[index % opts.length]
    }
    case 'array': {
      const elemType = rule[0] || 'string'
      const elemRule = rule.slice(1)
      const arr: unknown[] = []
      for (let k = 0; k < 3; k++) arr.push(typedValue(elemType, elemRule, fieldName, index * 10 + k))
      return arr
    }
    case 'object':
      return {}
    case 'string':
    default:
      return heuristicValue(fieldName, index)
  }
}

// ---------- heuristic fallback (no explicit type) ----------
function heuristicValue(field: string, index: number): unknown {
  const f = field.toLowerCase()
  if (f.includes('id')) return index + 1
  if (f.includes('email')) return `user${index + 1}@example.com`
  if (f.includes('name')) return sampleLabel('sample_name', index)
  if (f.includes('age')) return randInt(18, 65)
  if (f.includes('price') || f.includes('amount') || f.includes('cost') || f.includes('salary'))
    return round(randFloat(10, 1000), 2)
  if (f.includes('phone') || f.includes('mobile')) return phone(index)
  if (f.includes('date') || f.includes('created') || f.includes('updated') || f.includes('time') || f.endsWith('at'))
    return isoDate(index)
  if (f.includes('url') || f.includes('link') || f.includes('website') || f.includes('homepage'))
    return `https://example.com/${field}/${index + 1}`
  if (f.includes('uuid')) return uuid()
  if (f.includes('avatar') || f.includes('image') || f.includes('photo') || f.includes('picture'))
    return `https://example.com/img/${index + 1}.png`
  if (
    f.includes('city') ||
    f.includes('country') ||
    f.includes('address') ||
    f.includes('description') ||
    f.includes('remark') ||
    f.includes('note') ||
    f.includes('comment') ||
    f.includes('bio') ||
    f.includes('content')
  )
    return sampleLabel('sample_text', index)
  return sampleLabel('sample_value', index)
}

function generateValue(spec: FieldSpec, index: number): unknown {
  const fieldName = spec.path[spec.path.length - 1]
  if (spec.type) return typedValue(spec.type, spec.rule, fieldName, index)
  return heuristicValue(fieldName, index)
}

function setDeep(obj: Record<string, unknown>, path: string[], value: unknown) {
  let cur = obj
  for (let i = 0; i < path.length - 1; i++) {
    const key = path[i]
    if (typeof cur[key] !== 'object' || cur[key] === null) cur[key] = {}
    cur = cur[key] as Record<string, unknown>
  }
  cur[path[path.length - 1]] = value
}

// ---------- generate ----------
const generate = () => {
  error.value = ''
  friendlyError.value = ''
  parsedData.value = null
  const n = Number(count.value)
  if (!Number.isInteger(n) || n <= 0) {
    error.value = 'count'
    friendlyError.value = props.tool.ui?.error_invalid_count
    toast.error(friendlyError.value)
    return
  }
  const specs = parseSpecs(fields.value)
  if (specs.length === 0) {
    error.value = 'fields'
    friendlyError.value = props.tool.ui?.error_empty_fields
    toast.error(friendlyError.value)
    return
  }

  const arr: Record<string, unknown>[] = []
  for (let i = 0; i < n; i++) {
    const obj: Record<string, unknown> = {}
    for (const spec of specs) setDeep(obj, spec.path, generateValue(spec, i))
    arr.push(obj)
  }
  parsedData.value = arr
  outputJson.value = JSON.stringify(arr, null, 2)
  toast.success(t('toast.generated') ?? t('toast.converted'))
}

const copyOutput = async () => {
  if (!outputJson.value) return
  try {
    await navigator.clipboard.writeText(outputJson.value)
    toast.success(t('toast.copied'))
  } catch {
    toast.error(props.tool.ui?.error_processing)
  }
}

const downloadOutput = () => {
  if (!outputJson.value) return
  downloadFile(outputJson.value, 'output.json', 'application/json')
}
</script>
