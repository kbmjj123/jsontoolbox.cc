// Blog content management composable
export const useBlog = () => {
  const { locale } = useI18n()

  // Helper: check if a post supports the current locale
  const matchesLocale = (post: any): boolean => {
    const locales = post.locales || []
    // Support both exact match ('en') and prefix match ('zh' matches 'zh-CN')
    return locales.some((l: string) => l === locale.value || l.startsWith(locale.value + '-'))
  }

  /**
   * Get all blog posts for the current locale, sorted by date DESC
   * @param limit - Max number of posts to return (optional)
   */
  const getBlogList = (limit?: number) => {
    const key = `blog-list-${locale.value}${limit ? `-${limit}` : ''}`

    return useAsyncData(key, async () => {
      const allPosts = await queryCollection('blog')
        .order('date', 'DESC')
        .all()

      const filtered = allPosts.filter(matchesLocale)
      return limit ? filtered.slice(0, limit) : filtered
    }, {
      watch: [locale]
    })
  }

  /**
   * Get a single blog post by slug
   * @param slug - The post slug (e.g. 'what-is-json')
   */
  const getBlogPost = (slug: string) => {
    const key = `blog-post-${locale.value}-${slug}`

    return useAsyncData(key, async () => {
      // Query all posts and find by path suffix to avoid path-format mismatches
      const allPosts = await queryCollection('blog').all()
      return allPosts.find(post => {
        const path: string = post.path || ''
        return path.endsWith(`/${slug}`) && matchesLocale(post)
      }) || null
    }, {
      watch: [locale]
    })
  }

  /**
   * Get related blog posts (excluding the current post)
   * @param currentSlug - The slug of the current post to exclude
   * @param limit - Number of related posts to return
   */
  const getRelatedPosts = (currentSlug: string, limit: number = 3) => {
    const key = `blog-related-${locale.value}-${currentSlug}-${limit}`

    return useAsyncData(key, async () => {
      const allPosts = await queryCollection('blog')
        .order('date', 'DESC')
        .all()

      return allPosts
        .filter(post => matchesLocale(post) && !post.path?.endsWith(`/${currentSlug}`))
        .slice(0, limit)
    }, {
      watch: [locale]
    })
  }

  /**
   * Get previous and next posts relative to the current post path
   * Used for post navigation (prev/next article links)
   * @param path - The full path of the current post
   */
  const getSurroundingPosts = (path: string) => {
    return useAsyncData(`surround-${path}`, async () => {
      const allPosts = await queryCollection('blog')
        .order('date', 'DESC')
        .all()

      const localePosts = allPosts.filter(matchesLocale)
      const currentIndex = localePosts.findIndex(p => p.path === path)

      if (currentIndex === -1) return [null, null]

      const prev = currentIndex > 0 ? localePosts[currentIndex - 1] : null
      const next = currentIndex < localePosts.length - 1 ? localePosts[currentIndex + 1] : null

      return [
        prev ? { path: prev.path, title: prev.title } : null,
        next ? { path: next.path, title: next.title } : null
      ]
    }, {
      watch: [locale]
    })
  }

  /**
   * Get blog posts by a list of slugs (batch fetch)
   * @param slugs - Array of post slugs
   */
  const getPostsBySlugs = (slugs: string[]) => {
    const key = `blog-batch-${locale.value}-${slugs.join('-')}`

    return useAsyncData(key, async () => {
      const allPosts = await queryCollection('blog').all()
      const slugSet = new Set(slugs)

      return allPosts.filter(post => {
        const path: string = post.path || ''
        const slug = path.split('/').pop() || ''
        return slugSet.has(slug) && matchesLocale(post)
      })
    }, {
      watch: [locale]
    })
  }

  /**
   * Get all blog posts across all locales (for sitemap generation)
   * This is locale-unaware — returns every published post.
   */
  const getAllBlogPostsForSitemap = async () => {
    return queryCollection('blog')
      .select('path', 'date', 'lastmod')
      .all()
  }

  return {
    getBlogList,
    getBlogPost,
    getRelatedPosts,
    getSurroundingPosts,
    getPostsBySlugs,
    getAllBlogPostsForSitemap
  }
}
