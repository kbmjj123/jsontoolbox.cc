// Blog content management composable
export const useBlog = () => {
  const { locale } = useI18n()

  // Helper: check if a post supports the current locale
  const matchesLocale = (post: any): boolean => {
    const locales = post.locales || []
    // Support both exact match ('en') and prefix match ('zh' matches 'zh-CN')
    return locales.some((l: string) => l === locale.value || l.startsWith(locale.value + '-'))
  }

  // Helper: content paths carry a locale prefix (`/en/blog/what-is-json`),
  // while routes do not (strategy `prefix_except_default` → `/blog/what-is-json`).
  // Always run a post path through this before feeding it to NuxtLink / NuxtLinkLocale,
  // otherwise the link keeps the `/en` (or double-prefixes) and breaks.
  const getCleanPath = (postPath: string): string => {
    if (!postPath) return '/'
    return postPath.replace(/^\/(en|zh|zh-HK|zh-TW|ja)(?=\/|$)/, '') || '/'
  }

  // Helper: drafts (frontmatter `draft: true`) never surface on the site
  const isPublished = (post: any): boolean => post?.draft !== true

  // Helper: locale match + published
  const isVisible = (post: any): boolean => isPublished(post) && matchesLocale(post)

  /**
   * Get all blog posts for the current locale, sorted by date DESC
   * Draft posts (`draft: true`) are excluded.
   * @param limit - Max number of posts to return (optional)
   */
  const getBlogList = (limit?: number) => {
    const key = `blog-list-${locale.value}${limit ? `-${limit}` : ''}`

    return useAsyncData(key, async () => {
      const allPosts = await queryCollection('blog')
				.where('path', 'LIKE', `/${locale.value}/blog/%`)
        .order('date', 'DESC')
        .all()

      const filtered = allPosts.filter(isVisible)
      return limit ? filtered.slice(0, limit) : filtered
    }, {
      watch: [locale]
    })
  }

  /**
   * Get a single blog post by slug
   * Returns null for draft posts, so the page can 404/redirect.
   * @param slug - The post slug (e.g. 'what-is-json')
   */
  const getBlogPost = (slug: string) => {
    const key = `blog-post-${locale.value}-${slug}`

		return useAsyncData(key, async () => {
			const post = await queryCollection('blog')
				// 精准匹配：路径必须等于 /en/blog/slug
				.where('path', '=', `/${locale.value}/blog/${slug}`)
				.first()

			// 草稿不对外可见
			return isPublished(post) ? post : null
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
        .filter(post => isVisible(post) && !post.path?.endsWith(`/${currentSlug}`))
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

      const localePosts = allPosts.filter(isVisible)
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
        return slugSet.has(slug) && isVisible(post)
      })
    }, {
      watch: [locale]
    })
  }

  /**
   * Get all blog posts across all locales (for sitemap generation)
   * This is locale-unaware — returns every published post (drafts excluded).
   */
  const getAllBlogPostsForSitemap = async () => {
    const posts = await queryCollection('blog')
      .select('path', 'date', 'lastmod', 'draft')
      .all()

    return posts.filter(isPublished)
  }

  return {
    getCleanPath,
    getBlogList,
    getBlogPost,
    getRelatedPosts,
    getSurroundingPosts,
    getPostsBySlugs,
    getAllBlogPostsForSitemap
  }
}
