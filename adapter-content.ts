// mock-content.ts

// 1. 模拟 queryCollection
// 当 Sitemap 试图获取 Content v3 数据时，给它一个空数组，让它安静地结束
export const queryCollection = () => {
  return {
    // 模拟 .all() 方法，返回空数组
    all: () => Promise.resolve([]),
    // 模拟 .where() 链式调用
    where: () => ({
      all: () => Promise.resolve([])
    })
  }
}

// 2. 模拟 serverQueryContent (Content v2 的旧 API)
// 以防 Sitemap 模块走的是 v2 的逻辑
export const serverQueryContent = () => {
  return {
    find: () => Promise.resolve([]),
    where: () => ({
      find: () => Promise.resolve([])
    })
  }
}

// 3. 默认导出，防止某些导入方式报错
export default {
  queryCollection,
  serverQueryContent
}
