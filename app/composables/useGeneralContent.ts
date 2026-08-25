// General content pages composable (Privacy, Terms, etc.)
export const useGeneralContent = () => {
  const { locale } = useI18n()

  /**
   * Get a single general page by slug
   * @param slug - The page slug (e.g. 'privacy', 'terms-of-service')
   */
  const getGeneralPage = (slug: string) => {
    const key = `general-page-${locale.value}-${slug}`

    return useAsyncData(key, () => {
      return queryCollection('general')
        .where('path', '=', `/${locale.value}/${slug}`)
        .first()
    }, {
      watch: [locale]
    })
  }

  return {
    getGeneralPage
  }
}
