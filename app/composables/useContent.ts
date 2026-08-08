// Content management composable
export const useContent = () => {
  const { locale } = useI18n()

  // 获取当前语言的内容，如果没有则回退到英文
  const getLocalizedContent = (content: Record<string, any>, fallback: any = {}) => {
    return content[locale.value] || content['en'] || fallback
  }

  return {
    getLocalizedContent
  }
}
