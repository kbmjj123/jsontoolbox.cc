import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

// 首页推荐工具配置
const FEATURED_CONFIG = [
  {
    slug: 'json-editor',
    category: 'format',
    badge: {
      key: 'trending',
      icon: '🔥',
      class: 'bg-gradient-to-r from-primary-500 to-emerald-400 !text-surface-950'
    }
  },
  {
    slug: 'json-schema-validator',
    category: 'format',
  },
  {
    slug: 'json-to-csv',
    category: 'convert',
  },
  {
    slug: 'json-to-yaml',
    category: 'convert',
  },
  {
    slug: 'json-to-typescript',
    category: 'convert',
  },
  {
    slug: 'json-compare',
    category: 'convert',
  },
  {
    slug: 'json-path-tester',
    category: 'format',
  },
  {
    slug: 'json-minifier',
    category: 'format',
  },
  {
    slug: 'json-to-xml',
    category: 'convert',
  },
]

// 1. 预加载所有 JSON 文件
const metaFiles = import.meta.glob('~/assets/data/*/_meta.json', { eager: true })
const toolFiles = import.meta.glob('~/assets/data/**/*.json', { eager: true })

const getLangContent = (obj: any, lang: string) => {
  return obj[lang] || obj['en'] || {}
}

export const useTools = () => {
  const { locale, t } = useI18n()
  const searchQuery = ref('')

  // 获取所有分类元数据
  const getCategoriesMeta = (): ToolCategory[] => {
    const categories: ToolCategory[] = []
    for (const path in metaFiles) {
      const meta = (metaFiles[path] as any).default || metaFiles[path]
      if (meta && meta.slug) {
        categories.push(meta as ToolCategory)
      }
    }
    return categories.sort((a, b) => (a.sort || 99) - (b.sort || 99))
  }

  const categoryMetaList = getCategoriesMeta()

  // 初始化原始数据
  const rawToolList = Object.entries(toolFiles)
    .filter(([path]) => !path.endsWith('_meta.json') && !path.includes('/examples/'))
    .map(([path, module]: [string, any]) => {
      const data = module.default || module

      if (!data.category || !data.slug) {
        const normalizedPath = path.replace(/\\/g, '/')
        const parts = normalizedPath.split('/')
        const fileName = parts.pop()?.replace('.json', '')
        const folderName = parts.pop()

        data.slug = data.slug || fileName
        data.category = data.category || folderName
      }
      return data
    })

  // 将原始工具数据转为 ProcessedTool
  const toProcessedTool = (tool: any, currentLang: string): ProcessedTool => {
    const content = tool[currentLang] || tool['en'] || {}
    return {
      ...tool,
      ...content,
      slug: tool.slug,
      icon: tool.icon,
      category: tool.category,
      name: content.name || '',
      description: content.description || '',
      path: `/tools/${tool.category}/${tool.slug}`
    }
  }

  // 核心计算属性
  const filteredTools = (subOnly: boolean) =>
    computed<ProcessedTool[]>(() => {
      const currentLang = locale.value
      return rawToolList
        .filter(tool => subOnly ? tool.isSub === true : !tool.isSub)
        .map(tool => toProcessedTool(tool, currentLang))
    })

  const allTools = filteredTools(false)
  const subTools = filteredTools(true)

  // 分类列表
  const categories = computed<ToolCategory[]>(() => {
    const query = searchQuery.value.toLowerCase().trim()
    const currentLang = locale.value
    const result: ToolCategory[] = []

    categoryMetaList.forEach(meta => {
      const filteredTools = allTools.value.filter(tool => {
        const isCategoryMatch = tool.category === meta.slug
        const isSearchMatch = !query ||
          tool.name.toLowerCase().includes(query) ||
          tool.description.toLowerCase().includes(query)

        return isCategoryMatch && isSearchMatch
      })

      const subToolsForCategory = subTools.value.filter(t =>
        t.category === meta.slug &&
        (!query || t.name.toLowerCase().includes(query) || t.description.toLowerCase().includes(query))
      )

      const combined = [...filteredTools, ...subToolsForCategory]

      if (combined.length > 0) {
        result.push({
          slug: meta.slug,
          type: meta.slug,
          theme: meta.theme,
          sort: meta.sort,
          icon: meta.icon,
          tools: combined,
          ...getLangContent(meta, currentLang)
        })
      }
    })

    return result
  })

  const allCategories = computed<ToolCategory[]>(() => {
    const result: ToolCategory[] = []
    const currentLang = locale.value

    categoryMetaList.forEach(meta => {
      const tools = allTools.value.filter(tool => tool.category === meta.slug)
      if (tools.length > 0) {
        result.push({
          type: meta.slug,
          icon: meta.icon,
          tools: tools,
          sort: meta.sort,
          slug: meta.slug,
          theme: meta.theme,
          ...meta[currentLang]
        })
      }
    })
    return result
  })

  const getToolsByCategory = (category: string) => {
    return computed(() => allTools.value.filter(t => t.category === category))
  }

  const getToolBySlug = (category: string, slug: string) => {
    return computed(() => allTools.value.find(t => t.category === category && t.slug === slug))
  }

  const getToolBySingleSlug = (slug: string) => {
    if ('home' === slug) {
      return { path: "/" }
    }
    return allTools.value.find(t => t.slug === slug)
  }

  // 获取首页推荐工具列表
  const featuredTools = computed(() => {
    return FEATURED_CONFIG.map(config => {
      const tool = allTools.value.find(item =>
        item.slug === config.slug &&
        (config.category ? item.category === config.category : true)
      )

      if (!tool) return null

      const badge = config.badge ? {
        text: `${config.badge.icon} ${t(`home.featured.badge.${config.badge.key}`)}`,
        class: config.badge.class
      } : null

      return {
        ...tool,
        badge
      }
    }).filter(Boolean) as (ProcessedTool & { badge: any })[]
  })

  const getToolDetail = (category: string, slug: string, subOnly?: boolean) => {
    const tool = rawToolList.find(t =>
      t.category === category && t.slug === slug &&
      (subOnly ? t.isSub === true : true)
    )
    if (!tool) return null
    return toProcessedTool(tool, locale.value)
  }

  const getSubToolDetail = (category: string, slug: string) =>
    getToolDetail(category, slug, true)

  const getSubToolsByCategory = (category: string) => {
    const currentLang = locale.value
    return rawToolList
      .filter(t => t.category === category && t.isSub === true)
      .map(tool => toProcessedTool(tool, currentLang))
  }

  const getCategories = () => {
    const currentLang = locale.value
    return categoryMetaList.map(meta => ({
      ...meta,
      ...getLangContent(meta, currentLang)
    }))
  }

  const getCategoryBySlug = (slug: string) => {
    return categoryMetaList.find(c => c.slug === slug)
  }

  const getSiblings = (slug: string) => {
    const tool = allTools.value.find(t => t.slug === slug) || subTools.value.find(t => t.slug === slug)
    if (!tool) return []
    const pool = allTools.value.filter(t => t.category === tool.category)
    const subPool = subTools.value.filter(t => t.category === tool.category)
    return [...pool, ...subPool].filter(t => t.slug !== slug)
  }

  return {
    searchQuery,
    allTools,
    subTools,
    allCategories,
    categories,
    getToolsByCategory,
    getToolBySlug,
    getToolBySingleSlug,
    featuredTools,
    getToolDetail,
    getSubToolDetail,
    getSubToolsByCategory,
    getCategories,
    getCategoryBySlug,
    getSiblings
  }
}
