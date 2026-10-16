import { defineContentConfig, defineCollection, z } from '@nuxt/content'

export default defineContentConfig({
  collections: {
    // 1. 博客文章集合 (Blog)
    blog: defineCollection({
      type: 'page',
      source: '**/blog/*.md',
      schema: z.object({
        title: z.string(),
        description: z.string(),
        category: z.string(),
        h1: z.string().optional(),
        date: z.date(),
        lastmod: z.date().optional(),
        draft: z.boolean().default(false),
        image: z.string().optional(),
        tags: z.array(z.string()).optional(),
        author: z.string().default('JSON Toolbox Team'),
        promo: z.object({
          slug: z.string(),
          text: z.string(),
          btn: z.string()
        }).optional(),
        // "Which translations exist" — informational only. Do NOT use it to
        // decide whether a post belongs to the current locale: several files
        // list both languages. Language membership comes from the content path
        // (`/en/blog/...` vs `/zh/blog/...`), see `useBlog.ts#matchesLocale`.
        locales: z.array(z.string())
      })
    }),

    // 2. 通用页面集合 (Pages: Privacy, Terms)
    general: defineCollection({
      type: 'page',
      source: {
        include: '**/*.md',
        exclude: ['**/blog/**']
      },
      schema: z.object({
        title: z.string(),
        description: z.string().optional(),
        updatedAt: z.date().optional()
      })
    })
  }
})
