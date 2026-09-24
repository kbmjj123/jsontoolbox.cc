<template>
  <div class="h-full flex flex-col overflow-hidden">
    <!-- Draft support notice -->
    <div class="flex items-center gap-1.5 px-1 pb-2 text-[11px] text-surface-400 dark:text-surface-500">
      <Icon name="lucide:shield-check" class="w-3.5 h-3.5" />
      <span>{{ t('schema.draft7') }}</span>
    </div>

    <div class="flex-1 min-h-0 flex gap-3">
      <!-- Left column: schema editor -->
      <div class="w-1/2 h-full flex flex-col overflow-hidden pr-1.5">
        <div class="flex items-center justify-between mb-1.5">
          <label class="text-xs font-bold text-surface-600 dark:text-surface-400">{{ t('schema.paste') }}</label>
          <button
            @click="generateFromJson"
            :disabled="parsedData === null"
            :title="parsedData === null ? '' : t('schema.generateFromJson')"
            class="rounded-lg border border-surface-200 bg-white px-2.5 py-1 text-[11px] font-medium text-primary-600 hover:bg-surface-50 disabled:opacity-40 disabled:cursor-not-allowed dark:border-surface-700 dark:bg-surface-800 dark:text-primary-400 dark:hover:bg-surface-700"
          >
            <Icon name="lucide:file-json" class="w-3 h-3 mr-1 inline" />
            {{ t('schema.generateFromJson') }}
          </button>
        </div>
        <div class="flex-1 min-h-0">
          <JsonInputEditor
            v-model="schemaText"
            :label="t('schema.paste')"
            placeholder='{"type": "object", "properties": {"name": {"type": "string"}}, "required": ["name"]}'
            @clear="schemaText = ''"
          />
        </div>
        <p v-if="validation.schemaError" class="mt-1.5 text-xs text-red-600 dark:text-red-400">{{ validation.schemaError }}</p>
      </div>

      <!-- Right column: validation result + tree -->
      <div class="w-1/2 h-full flex flex-col overflow-hidden pl-1.5">
        <div class="flex items-center justify-between mb-1.5">
          <label class="text-xs font-bold text-surface-600 dark:text-surface-400">{{ t('schema.sideBySide') }}</label>
          <span
            v-if="schemaText.trim() && parsedData !== null"
            class="text-[11px] font-medium"
            :class="validation.errors.length === 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'"
          >
            {{ validation.errors.length === 0 ? t('schema.valid') : t('schema.invalidCount', { count: validation.errors.length }) }}
          </span>
        </div>
        <div class="flex-1 min-h-0 overflow-auto rounded-xl border border-surface-200 bg-surface-50 p-3 dark:border-surface-700 dark:bg-surface-800">
          <JsonErrorsPanel
            v-if="validation.errors.length"
            :field-errors="validation.errors"
            @locate-field-error="onLocateFieldError"
          />
          <JsonTreeNode v-if="parsedData !== null" :data="parsedData" path="" />
          <div v-else class="flex items-center justify-center h-full text-surface-400 text-sm">
            {{ t('system.emptyOutput') }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { FieldError } from '~/types/jsonErrors'
import { useSchemaValidation } from '~/composables/useSchemaValidation'
import { generateSchemaText } from '~/composables/useSchemaGenerate'

const props = defineProps<{ parsedData: unknown | null }>()
const { t } = useI18n()

const schemaText = ref('')
const { validateWithSchemaText } = useSchemaValidation()

const validation = computed(() => {
  if (!schemaText.value.trim() || props.parsedData === null) {
    return { errors: [] as FieldError[], schemaError: null as string | null }
  }
  return validateWithSchemaText(props.parsedData, schemaText.value)
})

// JSON Pointer (/users/0/name) → dot-path (users[0].name) so the tree — which
// keys nodes by dot-path — can match errors and show red dots / tooltips.
function toDotPath(pointer: string): string {
  if (!pointer || pointer === '/') return ''
  const parts = pointer.split('/').slice(1).map((s) => s.replace(/~1/g, '/').replace(/~0/g, '~'))
  let dot = ''
  for (const part of parts) {
    if (/^\d+$/.test(part)) dot += `[${part}]`
    else dot += dot ? `.${part}` : part
  }
  return dot
}

const errorMap = computed<Record<string, FieldError[]>>(() => {
  const map: Record<string, FieldError[]> = {}
  for (const err of validation.value.errors) {
    const p = toDotPath(err.instancePath)
    if (!map[p]) map[p] = []
    map[p].push(err)
  }
  return map
})
provide('jsonErrors', errorMap)

const locatePath = ref('')
provide('locatePath', locatePath)

// Expand the whole tree by default so validation dots are visible immediately.
function getAllExpandablePaths(data: unknown, parentPath = ''): string[] {
  const paths: string[] = []
  const isObj = (v: unknown) => typeof v === 'object' && v !== null && !Array.isArray(v)
  const isArr = Array.isArray
  const isExp = (v: unknown) => isObj(v) || isArr(v)
  if (isObj(data)) {
    for (const key of Object.keys(data as Record<string, unknown>)) {
      const cp = parentPath ? `${parentPath}.${key}` : key
      if (isExp((data as Record<string, unknown>)[key])) {
        paths.push(cp)
        paths.push(...getAllExpandablePaths((data as Record<string, unknown>)[key], cp))
      }
    }
  } else if (isArr(data)) {
    ;(data as unknown[]).forEach((item, i) => {
      const cp = `${parentPath}[${i}]`
      if (isExp(item)) {
        paths.push(cp)
        paths.push(...getAllExpandablePaths(item, cp))
      }
    })
  }
  return paths
}
const richExpanded = ref<Set<string>>(new Set())
watch(() => props.parsedData, (data) => {
  richExpanded.value = new Set(getAllExpandablePaths(data))
}, { immediate: true })
provide('richExpanded', richExpanded)

const expandAllSignal = ref(0)
const collapseAllSignal = ref(0)
provide('expandAllSignal', expandAllSignal)
provide('collapseAllSignal', collapseAllSignal)
provide('treeSearch', null)

const onLocateFieldError = (err: FieldError) => {
  locatePath.value = ''
  nextTick(() => { locatePath.value = toDotPath(err.instancePath) })
}

const generateFromJson = () => {
  if (props.parsedData === null) return
  schemaText.value = generateSchemaText(props.parsedData, { indent: 2, includeRequired: true })
}
</script>
