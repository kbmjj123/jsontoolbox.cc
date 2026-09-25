<template>
  <ResizablePanel v-model:fullscreen="fullscreen" :initial-ratio="0.5" responsive>
    <template #first>
      <div class="h-full pr-3 overflow-hidden">
        <JsonInputEditor
          ref="inputEditorRef"
          v-model="inputJson"
          :label="ui.label_input_json"
          :placeholder="SAMPLE_PLACEHOLDER"
          show-upload
          example-slug="json-to-code"
          @clear="clearAll"
          @paste="onPaste"
          @example-loaded="onExampleLoaded"
        />
      </div>
    </template>

    <template #second>
      <div class="h-full pl-3 flex flex-col overflow-hidden">
        <!-- Sample-based disclaimer: every shape, null and optional flag below
             is inferred from the current JSON document, not from a contract. -->
        <div
          v-if="showSampleWarning"
          class="mb-2 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300"
        >
          <Icon name="lucide:info" class="h-3.5 w-3.5 mt-0.5 shrink-0" />
          <span>{{ ui.warning_sample_based }}</span>
        </div>
        <JsonOutputPanel
          :label="ui.label_output"
          :content="outputCode"
          :error="error"
          :empty-text="ui.placeholder_output"
          :download-filename="downloadFilename"
          @load-example="loadExample"
        />
      </div>
    </template>

    <template #toolbar-left>
      <div class="flex flex-wrap items-center gap-3 shrink-0">
        <button @click="generate(false)" class="btn-primary px-5 py-2 text-xs">
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
          <label class="text-xs font-bold text-surface-600 dark:text-surface-400">{{ ui.label_language }}</label>
          <select v-model="language" class="rounded-lg border border-surface-200 bg-white px-2 py-1 text-xs dark:border-surface-700 dark:bg-surface-800 dark:text-surface-100">
            <option value="typescript">TypeScript</option>
            <option value="python">Python</option>
            <option value="go">Go</option>
            <option value="rust">Rust</option>
          </select>
        </div>

        <div class="flex items-center gap-2">
          <label class="text-xs font-bold text-surface-600 dark:text-surface-400">{{ ui.label_root_name }}</label>
          <input
            v-model="rootName"
            class="w-28 rounded-lg border border-surface-200 bg-white px-2 py-1 text-xs dark:border-surface-700 dark:bg-surface-800 dark:text-surface-100"
            :placeholder="ui.placeholder_name"
          />
        </div>

        <!-- Only the options that apply to the selected target are rendered.
             Go exports fields through capitalisation, so there is nothing to
             toggle; Rust has no date type in its standard library, so the
             format hint would be misleading. -->
        <label v-if="supportsExport" class="flex items-center gap-1.5 cursor-pointer select-none">
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
        <label v-if="supportsFormat" class="flex items-center gap-1.5 cursor-pointer select-none">
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
// ── IR: what a JSON position can hold ────────────────────────────────────
type Lang = 'typescript' | 'python' | 'go' | 'rust'
type Prim = 'string' | 'int' | 'float' | 'bool' | 'null' | 'unknown'
type StrFormat = 'date-time' | 'date' | 'email' | 'uuid' | 'uri' | null

interface PrimNode { kind: 'prim'; prim: Prim; format: StrFormat }
interface FieldIR { key: string; node: NodeIR; missingInSome: boolean }
interface ObjectNode { kind: 'object'; fields: FieldIR[] }
interface ArrayNode { kind: 'array'; item: NodeIR | null }
interface UnionNode { kind: 'union'; of: NodeIR[] }
type NodeIR = PrimNode | ObjectNode | ArrayNode | UnionNode

/** Resolved type of one position: text plus the flags a target may need. */
interface TypeIR {
  text: string
  nullable: boolean
  nullOnly: boolean
  unknownish: boolean
  format: StrFormat
}

interface GenOptions {
  language: Lang
  root: string
  addExport: boolean
  markOptional: boolean
  preserveNull: boolean
  detectFormats: boolean
  indent: string
}

interface Ectx {
  opts: GenOptions
  used: Set<string>
  decls: string[]
  names: string[]
  needs: Set<'Any' | 'datetime' | 'uuid' | 'time'>
}

const props = defineProps<{ tool: any }>()
const { t } = useI18n()
const toast = useToast()

// Every visible string comes from `tool.ui`; there is deliberately no English
// fallback so a missing key can never leak into another locale.
const ui = computed<Record<string, string>>(() => (props.tool?.ui ?? {}) as Record<string, string>)

const SAMPLE_PLACEHOLDER = '{\n  "id": 1,\n  "name": "Alice",\n  "email": "alice@example.com"\n}'

const inputJson = ref('')
const outputCode = ref('')
const error = ref('')
const language = ref<Lang>('typescript')
const rootName = ref('RootObject')
const addExport = ref(true)
const markOptional = ref(false)
const preserveNull = ref(true)
const detectFormats = ref(false)
const indentSize = ref(2)
const fullscreen = ref(false)

const inputEditorRef = ref<InstanceType<typeof import('~/components/tool/JsonInputEditor.vue').default>>()

const EXTENSION: Record<Lang, string> = { typescript: 'ts', python: 'py', go: 'go', rust: 'rs' }

const downloadFilename = computed(() => {
  const base = rootName.value.trim() || 'RootObject'
  return `${base}.${EXTENSION[language.value]}`
})

// Go exports identifiers by capitalising them, so there is no per-declaration
// export modifier to toggle. Rust has no standard date type, so a "format"
// hint there would either lie or pull in a third-party crate.
const supportsExport = computed(() => language.value !== 'go')
const supportsFormat = computed(() => language.value !== 'rust')

const showSampleWarning = computed(() => !!outputCode.value && !error.value)

// ── Target type tables ───────────────────────────────────────────────────
const PRIM_TYPE: Record<Lang, Record<Prim, string>> = {
  typescript: { string: 'string', int: 'number', float: 'number', bool: 'boolean', null: 'null', unknown: 'unknown' },
  python: { string: 'str', int: 'int', float: 'float', bool: 'bool', null: 'None', unknown: 'Any' },
  go: { string: 'string', int: 'int', float: 'float64', bool: 'bool', null: 'interface{}', unknown: 'interface{}' },
  rust: { string: 'String', int: 'i64', float: 'f64', bool: 'bool', null: 'serde_json::Value', unknown: 'serde_json::Value' },
}

const UNKNOWN_TYPE: Record<Lang, string> = {
  typescript: 'unknown', python: 'Any', go: 'interface{}', rust: 'serde_json::Value',
}

/** Shape with `null` as the only witness, kept as-is when "preserve null" is on. */
const NULL_ONLY_TYPE: Record<Lang, string> = {
  typescript: 'null', python: 'Any | None', go: 'interface{}', rust: 'Option<serde_json::Value>',
}

const EMPTY_ARRAY_TYPE: Record<Lang, string> = {
  typescript: 'unknown[]', python: 'list[Any]', go: '[]interface{}', rust: 'Vec<serde_json::Value>',
}

/** Richer types used when "detect common formats" is enabled. */
const FORMAT_TYPE: Record<Lang, Partial<Record<NonNullable<StrFormat>, string>>> = {
  typescript: {},
  python: { 'date-time': 'datetime.datetime', date: 'datetime.date', uuid: 'uuid.UUID' },
  go: { 'date-time': 'time.Time', date: 'time.Time' },
  rust: {},
}

// ── Naming rules ─────────────────────────────────────────────────────────
const PY_KEYWORDS = new Set([
  'and', 'as', 'assert', 'async', 'await', 'break', 'class', 'continue', 'def', 'del', 'elif',
  'else', 'except', 'False', 'finally', 'for', 'from', 'global', 'if', 'import', 'in', 'is',
  'lambda', 'None', 'nonlocal', 'not', 'or', 'pass', 'raise', 'return', 'True', 'try', 'while',
  'with', 'yield',
])

const RS_KEYWORDS = new Set([
  'as', 'async', 'await', 'break', 'const', 'continue', 'crate', 'dyn', 'else', 'enum', 'extern',
  'false', 'fn', 'for', 'if', 'impl', 'in', 'let', 'loop', 'match', 'mod', 'move', 'mut', 'pub',
  'ref', 'return', 'self', 'static', 'struct', 'super', 'trait', 'true', 'type', 'unsafe', 'use',
  'where', 'while',
])

const GO_INITIALISMS = new Set([
  'API', 'ASCII', 'CPU', 'CSS', 'DNS', 'EOF', 'GDPR', 'GUID', 'HTML', 'HTTP', 'HTTPS', 'ID', 'IP',
  'JSON', 'LHS', 'QPS', 'RAM', 'RHS', 'RPC', 'SLA', 'SMTP', 'SQL', 'SSH', 'TCP', 'TLS', 'TTL',
  'UDP', 'UI', 'UID', 'URI', 'URL', 'UTF8', 'UUID', 'VM', 'XML', 'XMPP', 'XSRF', 'XSS',
])

const wordPieces = (key: string): string[] =>
  key.split(/[^A-Za-z0-9]+/).filter(Boolean)
    .flatMap((word) => word.replace(/([a-z0-9])([A-Z])/g, '$1 $2').split(' '))
    .filter(Boolean)

/** `user-profile` / `user id` / `123value` → `UserProfile` / `UserId` / `_123value`. */
const pascalName = (key: string): string => {
  const parts = wordPieces(key)
  let name = parts.map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join('')
  if (!name) name = 'Item'
  if (/^[0-9]/.test(name)) name = `_${name}`
  return name
}

/** Go field names must start with an upper-case letter to be exported. */
const goName = (key: string): string => {
  const name = wordPieces(key)
    .map((p) => {
      const word = p.charAt(0).toUpperCase() + p.slice(1)
      return GO_INITIALISMS.has(word.toUpperCase()) ? word.toUpperCase() : word
    })
    .join('')
  const safe = name || 'Field'
  return /^[A-Z]/.test(safe) ? safe : `X${safe}`
}

const snakeName = (key: string): string => {
  const name = key.replace(/[^A-Za-z0-9]+/g, '_')
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .toLowerCase()
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
  const safe = name || 'field'
  return /^[0-9]/.test(safe) ? `_${safe}` : safe
}

/** Keep the original key where possible; Python field names map 1:1 to JSON. */
const pyName = (key: string): string => {
  let name = key.replace(/[^A-Za-z0-9_]/g, '_')
  if (!name) name = 'field'
  if (/^[0-9]/.test(name)) name = `_${name}`
  if (PY_KEYWORDS.has(name)) name = `${name}_`
  return name
}

const tsKey = (key: string): string => (/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(key) ? key : JSON.stringify(key))

const rsName = (key: string): string => {
  const name = snakeName(key)
  return RS_KEYWORDS.has(name) ? `r#${name}` : name
}

const singularize = (word: string): string => {
  if (/ies$/i.test(word)) return word.replace(/ies$/i, 'y')
  if (/(ch|sh|ss|x|s)$/i.test(word)) return word.replace(/s$/i, '')
  return word
}

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

// ── Inference: JSON samples → IR ─────────────────────────────────────────
const MAX_DEPTH = 24

const detectFormat = (value: string): StrFormat => {
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) return 'uuid'
  if (/^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(:\d{2})?(\.\d+)?(Z|[+-]\d{2}:?\d{2})?$/.test(value)) return 'date-time'
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return 'date'
  if (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) return 'email'
  if (/^https?:\/\/\S+$/.test(value)) return 'uri'
  return null
}

const primOf = (value: unknown): { prim: Prim; format: StrFormat } => {
  if (value === null) return { prim: 'null', format: null }
  if (typeof value === 'string') return { prim: 'string', format: detectFormat(value) }
  if (typeof value === 'number') return { prim: Number.isInteger(value) ? 'int' : 'float', format: null }
  if (typeof value === 'boolean') return { prim: 'bool', format: null }
  return { prim: 'unknown', format: null }
}

const buildFields = (samples: Record<string, unknown>[], hint: string, depth: number): FieldIR[] => {
  const keys: string[] = []
  const counts = new Map<string, number>()
  for (const sample of samples) {
    for (const key of Object.keys(sample)) {
      if (!counts.has(key)) { counts.set(key, 0); keys.push(key) }
      counts.set(key, (counts.get(key) ?? 0) + 1)
    }
  }
  return keys.map((key) => {
    const values = samples
      .filter((sample) => Object.prototype.hasOwnProperty.call(sample, key))
      .map((sample) => sample[key])
    return {
      key,
      node: buildNode(values, `${hint}${pascalName(key)}`, depth + 1),
      missingInSome: (counts.get(key) ?? 0) < samples.length,
    }
  })
}

const buildNode = (values: unknown[], hint: string, depth: number): NodeIR => {
  if (values.length === 0 || depth > MAX_DEPTH) return { kind: 'prim', prim: 'unknown', format: null }

  const objects = values.filter(isPlainObject)
  const arrays = values.filter((value): value is unknown[] => Array.isArray(value))
  const scalars = values.filter((value) => !isPlainObject(value) && !Array.isArray(value))
  const kinds: NodeIR[] = []

  if (objects.length > 0) kinds.push({ kind: 'object', fields: buildFields(objects, hint, depth) })
  if (arrays.length > 0) {
    const items = arrays.flat()
    kinds.push({ kind: 'array', item: items.length > 0 ? buildNode(items, singularize(hint), depth) : null })
  }
  if (scalars.length > 0) {
    const prims: NodeIR[] = []
    for (const value of scalars) {
      const found = primOf(value)
      const duplicate = prims.some(
        (node) => node.kind === 'prim' && node.prim === found.prim && node.format === found.format,
      )
      if (!duplicate) prims.push({ kind: 'prim', prim: found.prim, format: found.format })
    }
    kinds.push(prims.length === 1 ? prims[0] : { kind: 'union', of: prims })
  }

  if (kinds.length === 1) return kinds[0]
  if (kinds.length === 0) return { kind: 'prim', prim: 'unknown', format: null }
  return { kind: 'union', of: kinds }
}

// ── Emission: IR → target source ─────────────────────────────────────────
const unknownText = (ctx: Ectx): string => {
  if (ctx.opts.language === 'python') ctx.needs.add('Any')
  return UNKNOWN_TYPE[ctx.opts.language]
}

const wrapNullable = (text: string, lang: Lang): string => {
  if (lang === 'typescript') return `${text} | null`
  if (lang === 'python') return `${text} | None`
  if (lang === 'go') return `*${text}`
  return `Option<${text}>`
}

const arrayOf = (text: string, lang: Lang): string => {
  if (lang === 'typescript') return text.includes(' | ') ? `(${text})[]` : `${text}[]`
  if (lang === 'python') return `list[${text}]`
  if (lang === 'go') return `[]${text}`
  return `Vec<${text}>`
}

const scalarText = (prim: Prim, format: StrFormat, ctx: Ectx): string => {
  if (prim === 'string' && format && ctx.opts.detectFormats) {
    const mapped = FORMAT_TYPE[ctx.opts.language][format]
    if (mapped) {
      if (mapped.startsWith('datetime.')) ctx.needs.add('datetime')
      if (mapped.startsWith('uuid.')) ctx.needs.add('uuid')
      if (mapped === 'time.Time') ctx.needs.add('time')
      return mapped
    }
  }
  return PRIM_TYPE[ctx.opts.language][prim]
}

const plain = (text: string, format: StrFormat = null): TypeIR =>
  ({ text, nullable: false, nullOnly: false, unknownish: false, format })

const nullOnlyIR = (): TypeIR => ({ text: '', nullable: false, nullOnly: true, unknownish: false, format: null })
const unknownIR = (): TypeIR => ({ text: '', nullable: false, nullOnly: false, unknownish: true, format: null })

const nullOnlyText = (ctx: Ectx): string => {
  if (!ctx.opts.preserveNull) return unknownText(ctx)
  if (ctx.opts.language === 'python') ctx.needs.add('Any')
  return NULL_ONLY_TYPE[ctx.opts.language]
}

const irText = (ir: TypeIR, ctx: Ectx): string => {
  if (ir.unknownish) return unknownText(ctx)
  if (ir.nullOnly) return nullOnlyText(ctx)
  if (ir.nullable) {
    if (!ctx.opts.preserveNull) return unknownText(ctx)
    return wrapNullable(ir.text, ctx.opts.language)
  }
  return ir.text
}

const uniqueName = (base: string, ctx: Ectx): string => {
  let name = base
  let suffix = 2
  while (ctx.used.has(name)) { name = `${base}${suffix}`; suffix++ }
  ctx.used.add(name)
  return name
}

const uniqueMember = (base: string, used: Set<string>): string => {
  let name = base
  let suffix = 2
  while (used.has(name)) { name = `${base}${suffix}`; suffix++ }
  used.add(name)
  return name
}

const describe = (node: NodeIR, hint: string, ctx: Ectx): TypeIR => {
  const lang = ctx.opts.language

  if (node.kind === 'prim') {
    if (node.prim === 'null') return nullOnlyIR()
    return plain(scalarText(node.prim, node.format, ctx), node.format)
  }

  if (node.kind === 'array') {
    if (!node.item) {
      if (lang === 'python') ctx.needs.add('Any')
      return plain(EMPTY_ARRAY_TYPE[lang])
    }
    const inner = irText(describe(node.item, singularize(hint), ctx), ctx)
    return plain(arrayOf(inner, lang))
  }

  if (node.kind === 'object') return plain(declareStruct(node, hint, ctx))

  // Union: `null` is separated from the other members so every target can
  // represent "present but null" in its own way.
  const nullish = node.of.filter((member): member is PrimNode => member.kind === 'prim' && member.prim === 'null')
  const rest = node.of.filter((member) => !(member.kind === 'prim' && member.prim === 'null'))
  if (rest.length === 0) return nullOnlyIR()

  const parts = rest.map((member) => describe(member, hint, ctx))
  if (parts.some((part) => part.unknownish)) return unknownIR()
  // Go and Rust have no union types: a mixed position degrades to "any JSON".
  if (parts.length > 1 && (lang === 'go' || lang === 'rust')) return unknownIR()

  if (parts.length === 1) {
    const [part] = parts
    const text = irText(part, ctx)
    const nullable = nullish.length > 0 && !part.nullable && !part.nullOnly
    return { text, nullable, nullOnly: false, unknownish: false, format: part.format }
  }

  const texts: string[] = []
  let innerNullable = false
  for (const part of parts) {
    if (part.nullable || part.nullOnly) innerNullable = true
    const text = irText(part, ctx)
    if (!texts.includes(text)) texts.push(text)
  }
  return {
    text: texts.join(' | '),
    nullable: nullish.length > 0 && !innerNullable,
    nullOnly: false,
    unknownish: false,
    format: null,
  }
}

interface Row {
  key: string
  name: string
  rename: boolean
  type: string
  optional: boolean
  hasDefault: boolean
  format: StrFormat
}

const buildRows = (node: ObjectNode, owner: string, ctx: Ectx): Row[] => {
  const lang = ctx.opts.language
  const used = new Set<string>()
  const rows: Row[] = node.fields.map((field) => {
    const ir = describe(field.node, `${owner}${pascalName(field.key)}`, ctx)
    const optional = ctx.opts.markOptional || field.missingInSome
    const base = irText(ir, ctx)
    let type = base
    if (lang === 'rust' && optional && !type.startsWith('Option<')) type = `Option<${type}>`
    let name = field.key
    if (lang === 'typescript') name = tsKey(field.key)
    else if (lang === 'python') name = pyName(field.key)
    else if (lang === 'go') name = goName(field.key)
    else name = rsName(field.key)
    if (lang !== 'typescript') name = uniqueMember(name, used)
    return { key: field.key, name, rename: name !== field.key, type, optional, hasDefault: optional, format: ir.format }
  })

  // A dataclass field without a default may not follow one with a default, so
  // once any field becomes optional every field gets `= None`.
  if (lang === 'python' && rows.some((row) => row.optional)) {
    for (const row of rows) {
      row.hasDefault = true
      const members = row.type.split(' | ')
      if (!members.includes('None') && row.type !== 'Any') row.type = `${row.type} | None`
    }
  }
  return rows
}

const renderStruct = (node: ObjectNode, name: string, ctx: Ectx): string => {
  const { opts } = ctx
  const rows = buildRows(node, name, ctx)
  const pad = opts.indent

  if (opts.language === 'typescript') {
    const exp = opts.addExport ? 'export ' : ''
    if (rows.length === 0) return `${exp}interface ${name} {}`
    const lines: string[] = []
    for (const row of rows) {
      if (opts.detectFormats && row.format) lines.push(`${pad}/** format: ${row.format} */`)
      lines.push(`${pad}${row.name}${row.optional ? '?' : ''}: ${row.type};`)
    }
    return `${exp}interface ${name} {\n${lines.join('\n')}\n}`
  }

  if (opts.language === 'python') {
    const body = rows.length === 0
      ? `${pad}pass`
      : rows.map((row) => `${pad}${row.name}: ${row.type}${row.hasDefault ? ' = None' : ''}`).join('\n')
    return `@dataclass\nclass ${name}:\n${body}`
  }

  if (opts.language === 'go') {
    if (rows.length === 0) return `type ${name} struct {\n}`
    const nameWidth = Math.max(...rows.map((row) => row.name.length))
    const typeWidth = Math.max(...rows.map((row) => row.type.length))
    const lines = rows.map((row) => {
      const tag = `json:"${row.key.replace(/[`\\]/g, '')}${row.optional ? ',omitempty' : ''}"`
      return `${pad}${row.name.padEnd(nameWidth)} ${row.type.padEnd(typeWidth)} \`${tag}\``
    })
    return `type ${name} struct {\n${lines.join('\n')}\n}`
  }

  const pub = opts.addExport ? 'pub ' : ''
  if (rows.length === 0) return `#[derive(Debug, Serialize, Deserialize)]\n${pub}struct ${name} {}`
  const lines: string[] = []
  for (const row of rows) {
    if (row.rename) lines.push(`${pad}#[serde(rename = ${JSON.stringify(row.key)})]`)
    lines.push(`${pad}${pub}${row.name}: ${row.type},`)
  }
  return `#[derive(Debug, Serialize, Deserialize)]\n${pub}struct ${name} {\n${lines.join('\n')}\n}`
}

const declareStruct = (node: ObjectNode, hint: string, ctx: Ectx, explicitName?: string): string => {
  const name = uniqueName(explicitName ?? pascalName(hint), ctx)
  ctx.names.push(name)
  ctx.decls.push(renderStruct(node, name, ctx))
  return name
}

const arrayRootAlias = (itemText: string, ctx: Ectx): string => {
  const { opts } = ctx
  const exp = opts.addExport ? 'export ' : ''
  const pub = opts.addExport ? 'pub ' : ''
  if (opts.language === 'typescript') return `${exp}type ${opts.root} = ${arrayOf(itemText, 'typescript')}`
  if (opts.language === 'python') return `${opts.root} = list[${itemText}]`
  if (opts.language === 'go') return `type ${opts.root} []${itemText}`
  return `${pub}type ${opts.root} = Vec<${itemText}>;`
}

const scalarRootAlias = (text: string, ctx: Ectx): string => {
  const { opts } = ctx
  const exp = opts.addExport ? 'export ' : ''
  const pub = opts.addExport ? 'pub ' : ''
  if (opts.language === 'typescript') return `${exp}type ${opts.root} = ${text}`
  if (opts.language === 'python') return `${opts.root} = ${text}`
  if (opts.language === 'go') return `type ${opts.root} ${text}`
  return `${pub}type ${opts.root} = ${text};`
}

const generateCode = (input: unknown, opts: GenOptions): string => {
  const ctx: Ectx = {
    opts,
    used: new Set(),
    decls: [],
    names: [],
    needs: new Set(),
  }

  let rootDecl: string
  if (Array.isArray(input)) {
    const node = buildNode(input, `${opts.root}Item`, 0)
    rootDecl = arrayRootAlias(irText(describe(node, `${opts.root}Item`, ctx), ctx), ctx)
    ctx.names.push(opts.root)
    ctx.decls.push(rootDecl)
  } else {
    const node = buildNode([input], opts.root, 0)
    if (node.kind === 'object') {
      // Nested declarations are registered while their fields are described,
      // so the root struct is simply the last declaration rendered.
      declareStruct(node, opts.root, ctx, opts.root)
    } else {
      rootDecl = scalarRootAlias(irText(describe(node, opts.root, ctx), ctx), ctx)
      ctx.names.push(opts.root)
      ctx.decls.push(rootDecl)
    }
  }

  const parts = ctx.decls

  if (opts.language === 'typescript') return parts.join('\n\n')

  if (opts.language === 'python') {
    const head = ['from __future__ import annotations']
    // Only emitted when at least one dataclass actually exists.
    if (parts.some((decl) => decl.startsWith('@dataclass'))) head.push('from dataclasses import dataclass')
    if (ctx.needs.has('Any')) head.push('from typing import Any')
    if (ctx.needs.has('datetime')) head.push('import datetime')
    if (ctx.needs.has('uuid')) head.push('import uuid')
    const exportLine = opts.addExport
      ? `\n\n__all__ = [${ctx.names.map((name) => JSON.stringify(name)).join(', ')}]`
      : ''
    return `${head.join('\n')}\n\n${parts.join('\n\n')}${exportLine}`
  }

  if (opts.language === 'go') {
    const head = ['package main']
    if (ctx.needs.has('time')) head.push('', 'import "time"')
    return `${head.join('\n')}\n\n${parts.join('\n\n')}`
  }

  const usesSerde = parts.some((decl) => decl.includes('struct '))
  return `${usesSerde ? 'use serde::{Deserialize, Serialize};\n\n' : ''}${parts.join('\n\n')}`
}

// ── Component wiring ─────────────────────────────────────────────────────
const ROOT_NAME = /^[A-Za-z_][A-Za-z0-9_]*$/

const formatInputInPlace = () => {
  if (!inputJson.value.trim()) return
  try {
    const parsed = JSON.parse(inputJson.value)
    inputJson.value = JSON.stringify(parsed, null, 2)
  } catch {}
}
const debouncedFormatInPlace = useDebounceFn(() => { formatInputInPlace() }, 1500)

const buildOptions = (): GenOptions => ({
  language: language.value,
  root: rootName.value.trim() || ui.value.placeholder_name || 'RootObject',
  addExport: addExport.value,
  markOptional: markOptional.value,
  preserveNull: preserveNull.value,
  detectFormats: detectFormats.value,
  indent: ' '.repeat(indentSize.value),
})

const generate = (silent = false) => {
  error.value = ''
  outputCode.value = ''

  if (!inputJson.value.trim()) {
    error.value = ui.value.error_empty_input
    if (!silent) toast.error(error.value)
    return
  }

  const opts = buildOptions()

  // A root name that is not a valid identifier in the selected target cannot
  // produce compilable code, so report it instead of silently rewriting it.
  if (!ROOT_NAME.test(opts.root)) {
    error.value = ui.value.error_invalid_name
    if (!silent) toast.error(error.value)
    return
  }

  // Defence in depth: every target in the selector has an emitter, but an
  // unsupported state must never render an empty panel without an explanation.
  if (!EXTENSION[opts.language]) {
    error.value = ui.value.error_unsupported
    if (!silent) toast.error(error.value)
    return
  }

  try {
    const parsed = JSON.parse(inputJson.value)
    if (Array.isArray(parsed) && parsed.length === 0) {
      error.value = ui.value.error_empty_array
      if (!silent) toast.error(error.value)
      return
    }
    outputCode.value = generateCode(parsed, opts)
    if (!silent) toast.success(t('toast.generated'))
  } catch (e) {
    // JSON.parse failures are syntax problems; anything else is a generation bug.
    error.value = e instanceof SyntaxError ? ui.value.error_invalid_input : ui.value.error_generation
    if (!silent) toast.error(error.value)
  }
}

const debouncedGenerate = useDebounceFn(() => { generate(true) }, 300)
watch(inputJson, () => {
  debouncedGenerate()
  debouncedFormatInPlace()
})

watch([language, rootName, addExport, markOptional, preserveNull, detectFormats, indentSize], () => {
  if (inputJson.value.trim()) generate(true)
})

const loadExample = () => {
  inputEditorRef.value?.loadDefaultExample()
}

const onExampleLoaded = () => {
  nextTick(() => generate(true))
}

const onPaste = () => {
  nextTick(() => {
    formatInputInPlace()
    generate(true)
  })
}

const clearAll = () => {
  outputCode.value = ''
  error.value = ''
}
</script>
