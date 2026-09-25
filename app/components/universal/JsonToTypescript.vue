<template>
  <ResizablePanel v-model:fullscreen="fullscreen" :initial-ratio="0.5" responsive>
    <template #first>
      <div class="h-full pr-3 overflow-hidden">
        <JsonInputEditor
          ref="inputEditorRef"
          v-model="inputJson"
          :label="ui.label_input_json"
          placeholder='{"name": "Alice", "age": 30, "active": true}'
          show-upload
          example-slug="json-to-typescript"
          :tool="props.tool"
          @clear="clearAll"
          @paste="onPaste"
          @example-loaded="onExampleLoaded"
        />
      </div>
    </template>

    <template #second>
      <div class="h-full pl-3 flex flex-col overflow-hidden">
        <!-- Sample-based disclaimer: generated declarations are a starting
             point inferred from one sample, not a verified API contract. -->
        <div
          v-if="showSampleWarning"
          class="mb-2 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300"
        >
          <Icon name="lucide:info" class="h-3.5 w-3.5 mt-0.5 shrink-0" />
          <span>{{ ui.warning_sample_based }}</span>
        </div>
        <JsonOutputPanel
          :label="ui.label_output"
          :content="outputTs"
          :error="error"
          :empty-text="ui.placeholder_output"
          download-filename="types.ts"
          @copy="copyOutput"
          @download="downloadOutput"
        />
      </div>
    </template>

    <template #toolbar-left>
      <div class="flex items-center gap-3 shrink-0">
        <button @click="generateTypescript(false)" class="btn-primary px-5 py-2 text-xs">
          <Icon name="lucide:code" class="h-4 w-4 mr-1.5" />
          {{ ui.btn_generate }}
        </button>

        <button
          @click="loadExample"
          class="rounded-lg border border-surface-200 bg-white px-3 py-2 text-xs font-medium text-surface-600 hover:bg-surface-50 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-300 dark:hover:bg-surface-700"
        >
          {{ ui.btn_example }}
        </button>

        <div class="flex items-center gap-2">
          <label class="text-xs font-bold text-surface-600 dark:text-surface-400">{{ ui.label_interface_name }}</label>
          <input
            v-model="rootName"
            class="w-28 rounded-lg border border-surface-200 bg-white px-2 py-1 text-xs dark:border-surface-700 dark:bg-surface-800 dark:text-surface-100"
            :placeholder="ui.placeholder_name"
          />
        </div>

        <!-- Output style: interface or type alias -->
        <div class="flex rounded-lg border border-surface-200 dark:border-surface-700 overflow-hidden">
          <button
            @click="outputKind = 'interface'"
            :class="outputKind === 'interface'
              ? 'bg-primary-600 text-white'
              : 'bg-white text-surface-600 dark:bg-surface-800 dark:text-surface-400'"
            class="px-2 py-1 text-xs transition-colors"
          >
            {{ ui.option_output_interface }}
          </button>
          <button
            @click="outputKind = 'type'"
            :class="outputKind === 'type'
              ? 'bg-primary-600 text-white'
              : 'bg-white text-surface-600 dark:bg-surface-800 dark:text-surface-400'"
            class="px-2 py-1 text-xs transition-colors"
          >
            {{ ui.option_output_type }}
          </button>
        </div>

        <label class="flex items-center gap-1.5 cursor-pointer select-none">
          <input type="checkbox" v-model="addExport" class="rounded border-surface-300">
          <span class="text-xs font-bold text-surface-600 dark:text-surface-400">{{ ui.option_export }}</span>
        </label>
        <label class="flex items-center gap-1.5 cursor-pointer select-none">
          <input type="checkbox" v-model="markOptional" class="rounded border-surface-300">
          <span class="text-xs font-bold text-surface-600 dark:text-surface-400">{{ ui.option_optional }}</span>
        </label>
        <label class="flex items-center gap-1.5 cursor-pointer select-none">
          <input type="checkbox" v-model="preserveNull" class="rounded border-surface-300">
          <span class="text-xs font-bold text-surface-600 dark:text-surface-400">{{ ui.option_null }}</span>
        </label>
        <label class="flex items-center gap-1.5 cursor-pointer select-none">
          <input type="checkbox" v-model="detectFormats" class="rounded border-surface-300">
          <span class="text-xs font-bold text-surface-600 dark:text-surface-400">{{ ui.option_format }}</span>
        </label>

        <div class="flex items-center gap-2">
          <label class="text-xs font-bold text-surface-600 dark:text-surface-400">{{ ui.option_indent }}</label>
          <select
            v-model="indentSize"
            class="rounded-lg border border-surface-200 bg-white px-2 py-1 text-xs dark:border-surface-700 dark:bg-surface-800 dark:text-surface-100"
          >
            <option :value="2">{{ ui.option_indent_2 }}</option>
            <option :value="4">{{ ui.option_indent_4 }}</option>
          </select>
        </div>
      </div>
    </template>
  </ResizablePanel>
</template>

<script setup lang="ts">
type Sample = Record<string, unknown>
type OutputKind = 'interface' | 'type'

interface Field {
  key: string
  type: string
  optional: boolean
  format: string
}

interface Ctx {
  /** Nested declarations, emitted before the root declaration. */
  decls: string[]
  /** Type names already taken, used to disambiguate duplicates. */
  used: Set<string>
  indent: string
}

const props = defineProps<{ tool: any }>()
const { t } = useI18n()
const toast = useToast()

// Every string shown by this component comes from `tool.ui`; there is no
// English fallback so a missing key can never leak into the zh page.
const ui = computed<Record<string, string>>(() => (props.tool?.ui ?? {}) as Record<string, string>)

const inputJson = ref('')
const outputTs = ref('')
const error = ref('')
const rootName = ref('RootObject')
const outputKind = ref<OutputKind>('interface')
const addExport = ref(true)
const markOptional = ref(false)
const preserveNull = ref(true)
const detectFormats = ref(false)
const indentSize = ref(2)
const fullscreen = ref(false)

const inputEditorRef = ref<InstanceType<typeof import('~/components/tool/JsonInputEditor.vue').default>>()

const showSampleWarning = computed(() => !!outputTs.value && !error.value)

// Auto-format input in-place (debounced 1.5s after user stops typing)
const formatInputInPlace = () => {
  if (!inputJson.value.trim()) return
  try {
    const parsed = JSON.parse(inputJson.value)
    inputJson.value = JSON.stringify(parsed, null, 2)
  } catch {}
}
const debouncedFormatInPlace = useDebounceFn(() => { formatInputInPlace() }, 1500)

// Auto-generate on input change (debounced 300ms)
const debouncedGenerate = useDebounceFn(() => { generateTypescript(true) }, 300)
watch(inputJson, () => {
  debouncedGenerate()
  debouncedFormatInPlace()
})

// Re-generate when options change
watch([rootName, outputKind, addExport, markOptional, preserveNull, detectFormats, indentSize], () => {
  if (inputJson.value.trim()) generateTypescript(true)
})

const onExampleLoaded = () => {
  nextTick(() => generateTypescript(true))
}

const loadExample = () => {
  inputEditorRef.value?.loadDefaultExample()
}

const onPaste = () => {
  nextTick(() => {
    formatInputInPlace()
    generateTypescript(true)
  })
}

// ── Identifier and naming rules ──────────────────────────────────────────
const IDENTIFIER = /^[A-Za-z_$][A-Za-z0-9_$]*$/

/** Words that are legal as property names but confusing, so they get quoted. */
const RESERVED = new Set([
  'any', 'as', 'bigint', 'boolean', 'break', 'case', 'catch', 'class', 'const', 'continue',
  'debugger', 'declare', 'default', 'delete', 'do', 'else', 'enum', 'export', 'extends', 'false',
  'finally', 'for', 'from', 'function', 'get', 'if', 'implements', 'import', 'in', 'infer',
  'instanceof', 'interface', 'is', 'keyof', 'let', 'module', 'namespace', 'never', 'new', 'null',
  'number', 'object', 'of', 'package', 'private', 'protected', 'public', 'readonly', 'return',
  'satisfies', 'set', 'static', 'string', 'super', 'switch', 'symbol', 'this', 'throw', 'true',
  'try', 'type', 'typeof', 'undefined', 'unique', 'unknown', 'var', 'void', 'while', 'with',
  'yield',
])

const isValidIdentifier = (name: string): boolean => IDENTIFIER.test(name) && !RESERVED.has(name)

/** Quote keys that cannot be written as a bare TypeScript property. */
const safeKey = (key: string): string =>
  IDENTIFIER.test(key) && !RESERVED.has(key) ? key : JSON.stringify(key)

/** `user-profile` / `user id` / `123value` → `UserProfile` / `UserId` / `_123value`. */
const pascalName = (key: string): string => {
  const parts = key.split(/[^A-Za-z0-9]+/).filter(Boolean)
  let name = parts.map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join('')
  if (!name) name = 'Item'
  if (/^[0-9]/.test(name)) name = `_${name}`
  return name
}

const singularize = (word: string): string => {
  if (/ies$/i.test(word)) return word.replace(/ies$/i, 'y')
  if (/(ch|sh|ss|x|s)$/i.test(word)) return word.replace(/s$/i, '')
  return word
}

const isPlainObject = (value: unknown): value is Sample =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const scalarType = (value: unknown): string =>
  typeof value === 'string' ? 'string'
    : typeof value === 'number' ? 'number'
      : typeof value === 'boolean' ? 'boolean'
        : 'unknown'

/** `null` is kept as `null` only when the "preserve null" option is on. */
const nullType = (): string => (preserveNull.value ? 'null' : 'unknown')

/** Merge duplicate members; `unknown` absorbs every other member. */
const union = (types: string[]): string => {
  const list: string[] = []
  for (const type of types) if (!list.includes(type)) list.push(type)
  if (list.length === 0) return 'unknown'
  if (list.includes('unknown')) return 'unknown'
  return list.length === 1 ? list[0] : list.join(' | ')
}

// ── Common string format hints (comments only, never branded types) ──────
const FORMAT_PATTERNS: Array<[string, RegExp]> = [
  ['uuid', /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i],
  ['date-time', /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(:\d{2})?(\.\d+)?(Z|[+-]\d{2}:?\d{2})?$/],
  ['date', /^\d{4}-\d{2}-\d{2}$/],
  ['email', /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/],
  ['url', /^https?:\/\/\S+$/],
  ['ipv4', /^(\d{1,3}\.){3}\d{1,3}$/],
]

/** Only report a format when every sampled string agrees on the same one. */
const detectFormat = (values: unknown[]): string => {
  const strings = values.filter((v): v is string => typeof v === 'string')
  if (strings.length === 0) return ''
  let found = ''
  for (const value of strings) {
    const match = FORMAT_PATTERNS.find(([, re]) => re.test(value))
    if (!match) return ''
    if (!found) found = match[0]
    else if (found !== match[0]) return ''
  }
  return found
}

// ── Declaration building ─────────────────────────────────────────────────
const uniqueName = (base: string, ctx: Ctx): string => {
  let name = base
  let suffix = 2
  while (ctx.used.has(name)) { name = `${base}${suffix}`; suffix++ }
  ctx.used.add(name)
  return name
}

const renderDecl = (name: string, fields: Field[], ctx: Ctx): string => {
  const pad = ctx.indent
  const exp = addExport.value ? 'export ' : ''
  if (fields.length === 0) {
    return outputKind.value === 'interface'
      ? `${exp}interface ${name} {}`
      : `${exp}type ${name} = {}`
  }
  const lines: string[] = []
  for (const field of fields) {
    if (field.format) lines.push(`${pad}/** format: ${field.format} */`)
    lines.push(`${pad}${safeKey(field.key)}${field.optional ? '?' : ''}: ${field.type}`)
  }
  return outputKind.value === 'interface'
    ? `${exp}interface ${name} {\n${lines.join('\n')}\n}`
    : `${exp}type ${name} = {\n${lines.join('\n')}\n}`
}

/**
 * Infer one type for several samples of the same position. Mixing shapes at
 * the same position is what produces unions such as `string | null` or
 * `(Admin | Member)[]`.
 */
const inferValues = (values: unknown[], hint: string, ctx: Ctx): string => {
  const present = values.filter((v) => v !== undefined)
  const rest = present.filter((v) => v !== null)
  const hasNull = rest.length !== present.length
  if (rest.length === 0) return hasNull ? nullType() : 'unknown'

  const types: string[] = []

  const objects = rest.filter(isPlainObject)
  if (objects.length > 0) {
    const shaped = shapeObject(objects, hint, ctx)
    ctx.decls.push(shaped.decl)
    types.push(shaped.name)
  }

  const arrays = rest.filter((v): v is unknown[] => Array.isArray(v))
  if (arrays.length > 0) {
    const items = arrays.flat()
    if (items.length === 0) {
      types.push('unknown[]')
    } else {
      const itemType = inferValues(items, singularize(hint), ctx)
      types.push(itemType.includes(' | ') ? `(${itemType})[]` : `${itemType}[]`)
    }
  }

  for (const value of rest) {
    if (typeof value === 'object') continue
    types.push(scalarType(value))
  }

  if (hasNull) types.push(nullType())
  return union(types)
}

/**
 * Merge every sample of one object position into a single declaration.
 * A key missing from some samples becomes optional; a key holding different
 * types across samples becomes a union.
 */
const shapeObject = (samples: Sample[], hint: string, ctx: Ctx, explicitName?: string) => {
  const name = uniqueName(explicitName ?? pascalName(hint), ctx)

  const keys: string[] = []
  const counts = new Map<string, number>()
  for (const sample of samples) {
    for (const key of Object.keys(sample)) {
      if (!counts.has(key)) { counts.set(key, 0); keys.push(key) }
      counts.set(key, (counts.get(key) ?? 0) + 1)
    }
  }

  const fields: Field[] = []
  for (const key of keys) {
    const values: unknown[] = []
    for (const sample of samples) {
      if (Object.prototype.hasOwnProperty.call(sample, key)) values.push(sample[key])
    }
    fields.push({
      key,
      type: inferValues(values, `${name}${pascalName(key)}`, ctx),
      optional: markOptional.value || (counts.get(key) ?? 0) < samples.length,
      format: detectFormats.value ? detectFormat(values) : '',
    })
  }

  return { name, decl: renderDecl(name, fields, ctx) }
}

const buildTypescript = (input: unknown): string => {
  const ctx: Ctx = { decls: [], used: new Set(), indent: ' '.repeat(indentSize.value) }
  const root = rootName.value.trim() || 'RootObject'
  const exp = addExport.value ? 'export ' : ''

  let rootDecl = ''
  if (Array.isArray(input)) {
    // An array root becomes a type alias referencing the item declaration.
    const itemType = inferValues(input, `${root}Item`, ctx)
    rootDecl = `${exp}type ${root} = ${itemType.includes(' | ') ? `(${itemType})[]` : `${itemType}[]`}`
  } else if (isPlainObject(input)) {
    rootDecl = shapeObject([input], root, ctx, root).decl
  } else {
    rootDecl = `${exp}type ${root} = ${inferValues([input], root, ctx)}`
  }

  return [...ctx.decls, rootDecl].join('\n\n')
}

const generateTypescript = (silent = false) => {
  error.value = ''
  if (!inputJson.value.trim()) {
    outputTs.value = ''
    if (!silent) {
      error.value = ui.value.error_empty_input
      toast.error(error.value)
    }
    return
  }

  const name = rootName.value.trim() || 'RootObject'
  if (!isValidIdentifier(name)) {
    outputTs.value = ''
    error.value = ui.value.error_invalid_name
    if (!silent) toast.error(error.value)
    return
  }

  try {
    const parsed = JSON.parse(inputJson.value)
    if (Array.isArray(parsed) && parsed.length === 0) {
      outputTs.value = ''
      error.value = ui.value.error_empty_array
      if (!silent) toast.error(error.value)
      return
    }
    outputTs.value = buildTypescript(parsed)
    if (!silent) toast.success(t('toast.generated'))
  } catch (e) {
    outputTs.value = ''
    // JSON.parse failures are syntax problems; anything else is a generation failure.
    error.value = e instanceof SyntaxError ? ui.value.error_invalid_input : ui.value.error_generation
    if (!silent) toast.error(error.value)
  }
}

const clearAll = () => { outputTs.value = ''; error.value = '' }

const copyOutput = async () => {
  await copyToClipboard(outputTs.value)
}

const downloadOutput = () => {
  const blob = new Blob([outputTs.value], { type: 'text/typescript' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url; link.download = 'types.ts'
  document.body.appendChild(link); link.click(); document.body.removeChild(link); URL.revokeObjectURL(url)
}
</script>
