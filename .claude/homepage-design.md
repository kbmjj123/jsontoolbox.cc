# JSON 工具站首页布局与开源项目设计细节

## 1. 首页布局设计

### 1.1 顶部区域（Hero 区）

- 组件内容：
  - H1：例如 `Free Online JSON Tools – Beautify, Validate, Convert & More`
  - 简短说明：
    - "Format, validate, convert, and explore JSON data directly in your browser. 100% client-side – your data never leaves your device."
  - 主操作按钮：
    - "Open JSON Formatter"
    - "See All Tools"

- 主工具嵌入：
  - 在 Hero 区内直接嵌入 JSON Formatter 组件：
    - 左侧输入、右侧输出。
    - Format / Minify / Validate / Clear 按钮。
  - 让用户无需跳转就能体验核心功能。

### 1.2 工具网格区域

- 标题：`JSON Toolbox – All the Tools You Need`
- 工具卡片示例：
  - JSON Formatter
  - JSON Validator
  - JSON Compare
  - JSON to CSV
  - JSON to YAML
  - JSON to XML
  - JSON to TypeScript / Go / Python
  - JSONPath Tester
  - JSON Tree Viewer
  - JSON Minifier

- 每个卡片包含：
  - 图标（例如简单的 `{}` 或表格图标）。
  - 工具名。
  - 一行说明：
    - "Beautify and validate JSON with error location."
    - "Compare two JSON documents and highlight differences."
    - "Convert JSON arrays to CSV for Excel."

### 1.3 底部说明区域

- About JSON Tools（简介）：
  - 简要介绍 JSON 的用途和站点的目标。
- Privacy & Security：
  - 强调纯前端处理、不上传数据。
- General FAQ：
  - "Is my JSON data uploaded?"
  - "What are the size limits?"
  - "Which browsers are supported?"
- Blog/Docs 入口：
  - 列出 3–5 篇核心 JSON 文章的链接。

## 2. 开源项目设计

### 2.1 仓库结构

- 根目录：
  - `README.md`：项目说明。
  - `LICENSE`：许可证（推荐 MIT）。
  - `package.json`：依赖和脚本。
  - `nuxt.config.ts`：Nuxt 配置。
- 源码目录：
  - `src/` 或 `app/`：
    - `components/`：
      - 工具相关 Vue 组件。
    - `pages/`：
      - 首页：`index.vue`
      - 工具页：`tools/*.vue`
      - 场景页：`tools/*-scenario.vue` 或类似命名。
    - `lib/jsonEngine.ts`：
      - 统一处理 JSON 操作的工具函数集合。

### 2.2 README 结构建议

- 标题：`JSON Tools – Free, Client-Side Online JSON Toolbox`
- 段落结构：
  1. 项目简介：
     - 说明站点提供哪些 JSON 工具。
     - 强调纯前端、不上传数据。
  2. 功能列表：
     - 列出所有工具及其功能点。
  3. 技术栈：
     - Nuxt/Vue、使用的第三方库。
  4. 隐私说明：
     - 用一段英文明确说明数据不出浏览器。
  5. 部署指南：
     - 如：`npm install`, `npm run build`, 部署到某平台。
  6. 本地开发：
     - `npm run dev` 等。
  7. 贡献指南：
     - 如何添加新工具。
     - 如何添加新语言。
  8. License：
     - MIT License 文本或简要说明。

### 2.3 贡献指南要点

- Issue 与 PR 流程说明。
- 代码风格要求（lint/prettier 配置）。
- 如何新增工具：
  - 新增 Vue 组件。
  - 在首页网格和工具列表中注册。
- 如何新增多语言：
  - 使用 i18n 插件。
  - 新增语言 JSON 文件。
  - 更新对应页面文案。

### 2.4 开源后的传播路径

- 在 README 中添加 "Live Demo" 链接指向正式站点。
- 在开发者社区分享：
  - Reddit `/r/webdev`、`/r/frontend`、`/r/javascript`。
  - Dev.to、Hashnode、Hacker News（Show HN 一类）。
- 与「JSON 工具集合」类文章建立联系：
  - 例如 `best json tools` 的博文会列出多个在线工具，你可以提 PR 或留言让作者加入你的站点。
