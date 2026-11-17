/**
 * Tool Example Composable
 * Manages loading, displaying, and clearing example data for tools.
 */

interface ToolExample {
  id: string
  label_en: string
  label_zh: string
  label_de: string
  input: string
  input2?: string  // For tools with two inputs (e.g., JSON Compare)
}

// Build-time import of all example JSON files
const exampleModules = import.meta.glob<{ default: ToolExample[] }>(
  '~/assets/data/examples/*.json',
  { eager: true }
)

const examplesMap: Record<string, ToolExample[]> = {}
for (const [path, mod] of Object.entries(exampleModules)) {
  const slug = path.split('/').pop()?.replace('.json', '') || ''
  examplesMap[slug] = mod.default
}

export const useToolExample = (toolSlug: string) => {
  const { locale } = useI18n()

  const examples = computed<ToolExample[]>(() => examplesMap[toolSlug] || [])
  const hasExamples = computed(() => examples.value.length > 0)

  /**
   * Get the default (first) example
   */
  const getDefaultExample = (): ToolExample | null => {
    return examples.value[0] || null
  }

  /**
   * Get example label based on current locale
   */
  const getLabel = (example: ToolExample): string => {
    if (locale.value === 'zh') return example.label_zh
    if (locale.value === 'de') return example.label_de
    return example.label_en
  }

  /**
   * Load default example into a ref
   */
  const loadDefault = (target: { value: string }) => {
    const ex = getDefaultExample()
    if (ex) {
      target.value = ex.input
    }
  }

  /**
   * Load a specific example by id
   */
  const loadById = (id: string, target: { value: string }) => {
    const ex = examples.value.find(e => e.id === id)
    if (ex) {
      target.value = ex.input
    }
  }

  return {
    examples,
    hasExamples,
    getDefaultExample,
    getLabel,
    loadDefault,
    loadById,
  }
}
