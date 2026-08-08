// 设备检测工具函数

/**
 * 检测是否为移动设备
 */
export function isMobile(): boolean {
  if (typeof window === 'undefined') return false
  return window.innerWidth < 768
}

/**
 * 检测是否为平板设备
 */
export function isTablet(): boolean {
  if (typeof window === 'undefined') return false
  return window.innerWidth >= 768 && window.innerWidth < 1024
}

/**
 * 检测是否为桌面设备
 */
export function isDesktop(): boolean {
  if (typeof window === 'undefined') return false
  return window.innerWidth >= 1024
}
