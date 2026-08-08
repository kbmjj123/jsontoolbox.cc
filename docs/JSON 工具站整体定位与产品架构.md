# JSON 工具站整体定位与产品架构

## 1. 站点定位

- **目标用户**
  - 前端工程师（Web / 移动）
  - 后端/API 开发者
  - 测试工程师（QA）
  - 数据分析师 / 数据工程师
  - DevOps / SRE
  - 安全工程师
  - 产品 / 运营（需要处理导出数据）

- **核心卖点**
  - 100% 纯前端（client-side），数据不上传服务器。
  - 专注 JSON 垂直领域，而不是杂合“所有格式”的工具站。
  - 面向真实开发场景的工具矩阵（API、日志、配置、数据导入导出等）。
  - 多语言国际站（英文为主，逐步扩展 es/pt/id/zh 等）。

- **核心目标**
  - 为开发者提供一套完整的「JSON 工作流工具箱」：
    - 格式化、美化、压缩
    - 校验、容错、错误定位
    - 比较、差分
    - 转换（CSV/YAML/XML/Types）
    - 解析、查看、树形浏览
    - 按场景：API、日志、配置、Schema、Mock 数据等

## 2. 信息架构（IA）

- **首页**
  - 顶部：主工具（JSON Formatter）+ 核心卖点说明。
  - 中部：JSON 工具网格（分类 + 入口）。
  - 底部：关于 JSON 的简要介绍、隐私声明、通用 FAQ。
  - 可选：博客/文章入口。

- **工具页**
  - 每个工具一个基础页，例如：
    - `/tools/json-formatter`
    - `/tools/json-validator`
    - `/tools/json-diff`
    - `/tools/json-to-csv`
    - `/tools/json-to-yaml`
    - `/tools/json-to-xml`
    - `/tools/json-to-typescript`
    - `/tools/jsonpath-tester`
    - `/tools/json-tree-viewer`
    - `/tools/json-minifier`

- **场景化落地页**
  - 在基础工具之上，针对具体高价值场景拆分长尾页，例如：
    - `/tools/json-array-to-csv-for-excel`
    - `/tools/flatten-nested-json-to-csv`
    - `/tools/json-to-typescript-api-response`
    - `/tools/generate-mock-json-from-schema`
    - `/tools/jsonl-to-csv`
    - `/tools/format-api-response-json`

- **文章/内容页**
  - 少量高质量的 JSON 主题文章：
    - 入门/基础（What is JSON）
    - 如何使用工具解决具体问题（How to convert JSON to CSV for Excel）
    - 最佳实践（Common JSON mistakes & fixes）

## 3. 技术架构（概览）

- **前端框架**
  - Nuxt 3/4 + Vue 3（SSR 或 SSG），方便 SEO。
  - 单页组件模式，每个工具封装成独立 Vue 组件。

- **数据处理**
  - 仅使用浏览器内存处理 JSON：
    - `JSON.parse` / `JSON.stringify` 做基础解析。
    - 辅助库：
      - YAML：`js-yaml`
      - XML：`xml-js` 或类似库
      - CSV：自定义逻辑或 `json2csv` 等
      - Diff：`deep-diff` / `json-diff`
      - JSONPath：JSONPath 实现库
      - Types 生成：自定义递归推断逻辑

- **隐私与安全**
  - 所有数据处理在浏览器本地完成，不通过网络发送 JSON 内容。
  - 工具页面显著位置展示隐私声明：
    - “All processing happens in your browser. Your JSON is never sent to any server.”
  - 可选：通过开源代码公开实现细节，增强信任。

## 4. 开源与项目结构

- **开源目标**
  - 将整个 JSON 工具站作为开源项目发布：
    - 提供完整前端代码和基础配置。
    - 容易被其他开发者 fork、二次开发。

- **项目结构建议**
  - `src/`
    - `components/`
      - `JsonFormatter.vue`
      - `JsonValidator.vue`
      - `JsonDiff.vue`
      - `JsonToCsv.vue`
      - `JsonToYaml.vue`
      - `JsonToXml.vue`
      - `JsonToTypes.vue`
      - `JsonPathTester.vue`
      - `JsonTreeViewer.vue`
      - `JsonMinifier.vue`
    - `pages/`
      - `index.vue`（首页）
      - `tools/json-formatter.vue`
      - `tools/json-validator.vue`
      - `...`
      - 场景化页：`tools/json-array-to-csv-for-excel.vue` 等
    - `lib/jsonEngine.ts`（核心 JSON 操作引擎）

- **README 内容要点**
  - 项目介绍（目标、卖点、受众）。
  - 功能列表（对应工具矩阵）。
  - 技术栈说明（Nuxt/Vue + 使用的库）。
  - 隐私说明与纯前端架构描述。
  - 部署指南（例如部署到 Cloudflare Pages、Vercel）。
  - 贡献指南（如何添加新工具、如何增加多语言支持）。
  - License（MIT 或 Apache 2.0 推荐）。