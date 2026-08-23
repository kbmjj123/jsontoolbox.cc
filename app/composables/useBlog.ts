// Blog content management composable
export const useBlog = () => {
  const { locale } = useI18n()

  /**
   * Get all blog posts for the current locale, sorted by date DESC
   * @param limit - Max number of posts to return (optional)
   */
  const getBlogList = (limit?: number) => {
    const key = `blog-list-${locale.value}${limit ? `-${limit}` : ''}`

    return useAsyncData(key, () => {
      let query = queryCollection('blog')
        .where('locales', 'LIKE', `%"${locale.value}"%`)
        .order('date', 'DESC')

      if (limit) {
        query = query.limit(limit)
      }

      return query.all()
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

    return useAsyncData(key, () => {
      return queryCollection('blog')
        .where('path', '=', `/${locale.value}/blog/${slug}`)
        .first()
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

    return useAsyncData(key, () => {
      return queryCollection('blog')
        .where('locales', 'LIKE', `%"${locale.value}"%`)
        .where('slug', '<>', currentSlug)
        .order('date', 'DESC')
        .limit(limit)
        .all()
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
      const res = await queryCollectionItemSurroundings('blog', path)
        .where('locales', 'LIKE', `%"${locale.value}"%`)
      return res
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

    return useAsyncData(key, () => {
      const prefix = `/${locale.value}/blog`
      const targetPaths = slugs.map(slug => `${prefix}/${slug}`)

      return queryCollection('blog')
        .where('path', 'IN', targetPaths)
        .all()
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
