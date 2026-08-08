import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useTools } from './useTools'

export const useBreadcrumbs = () => {
  const route = useRoute()
  const { t } = useI18n()
  const localePath = useLocalePath()
  const { allCategories, allTools, subTools } = useTools()

  const breadcrumbs = computed(() => {
    const path = route.path
    const segments = decodeURIComponent(path).split('/').filter(Boolean)
    const toolsIndex = segments.indexOf('tools')

    let urlCategory = null
    let urlSlug = null

    if (toolsIndex !== -1) {
      urlCategory = segments[toolsIndex + 1] || null
      urlSlug = segments[toolsIndex + 2] || null
    }

    const items = [
      {
        name: t('app.nav.home'),
        path: '/'
      }
    ]

    if (toolsIndex !== -1) {
      items.push({
        name: t('app.nav.tools'),
        path: '/tools'
      })
    }

    if (urlSlug) {
      const toolConfig = allTools.value.find(t => t.slug === urlSlug)
        || subTools.value.find(t => t.slug === urlSlug)

      if (toolConfig) {
        const realCategoryId = toolConfig.category || urlCategory
        const catConfig = allCategories.value.find(c => c.type === realCategoryId)

        items.push({
          name: catConfig ? catConfig.h2 : realCategoryId,
          path: `/tools/${realCategoryId}`
        })

        items.push({
          name: toolConfig.name,
          path: route.path
        })

        return processPaths(items)
      }
    }

    if (urlCategory && !urlSlug) {
      const catConfig = allCategories.value.find(c => c.type === urlCategory)

      items.push({
        name: catConfig ? catConfig.title : urlCategory,
        path: `/tools/${urlCategory}`
      })
    }

    return processPaths(items)
  })

  const processPaths = (items: any[]) => {
    return items.map((item: any) => ({
      ...item,
      path: item.path // 不使用 localePath，避免 undefined 前缀
    }))
  }

  return {
    breadcrumbs
  }
}
