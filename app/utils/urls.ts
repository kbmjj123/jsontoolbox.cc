// URL 工具函数

/**
 * 获取当前页面的完整 URL
 */
export function getFullUrl(path: string, baseUrl?: string): string {
  const base = baseUrl || (typeof window !== 'undefined' ? window.location.origin : '')
  return `${base}${path}`
}

/**
 * 规范化 URL 路径
 */
export function normalizePath(path: string): string {
  return path.replace(/\/+/g, '/').replace(/\/$/, '') || '/'
}
