# jsontoolbox.cc

一个由独立开发者维护的纯前端开源 JSON 工具箱，提供格式化、校验、转换、对比和代码生成等工具。  
本项目完全免费，可用于个人和商业自建；所有处理都在浏览器本地完成，数据不会上传到任何服务器。

**在线演示：** https://jsontoolbox.cc

## Languages

- [English](../README.md)
- [简体中文](./README.zh-CN.md)

---

## 功能

jsontoolbox.cc 提供一组基于浏览器的 JSON 工具，按开发者常见任务分类。  
所有工具均 100% 在客户端运行，数据不会上传到任何服务器。

### 1. 查看与编辑 JSON

- **JSON Editor（JSON 编辑器）**  
  带语法高亮和实时校验的在线 JSON 编辑器。
- **JSON Escape & Unescape（JSON 转义/反转义）**  
  对特殊字符、引号和反斜杠进行 JSON 转义/反转义。
- **JSON Minifier（JSON 压缩）**  
  移除空白和注释，生成最小化的紧凑 JSON。

### 2. 校验与调试

- **JSON Schema Validator（JSON Schema 校验器）**  
  基于 JSON Schema 校验 JSON 数据，检查结构和数据类型。
- **JSONPath Tester（JSONPath 测试器）**  
  测试 JSONPath 表达式，从 JSON 文档中提取值。

### 3. 对比 JSON

- **JSON Compare（JSON 对比）**  
  对比两个 JSON 文档，高亮显示新增、删除和变更的值。

### 4. 格式互转

- **CSV ↔ JSON**  
  在 CSV 文件与 JSON 数组之间互转。
- **YAML ↔ JSON**  
  在 YAML 配置与 JSON 之间互转。
- **XML ↔ JSON**  
  在 XML 文档与结构化 JSON 之间互转。
- **JSON → Excel / CSV**  
  将 JSON 数组展平为适合电子表格的 CSV/Excel 格式。
- **JSON → PDF**  
  从 JSON 数据生成可打印的 PDF 文档。
- **JSON → HTML Table（JSON → HTML 表格）**  
  将 JSON 数组可视化为格式化的 HTML 表格。

### 5. 生成代码与 Schema

- **JSON to Code（JSON 生成代码）**  
  从 JSON 示例生成 10 种语言的类型定义和数据模型：  
  TypeScript、Python、Go、Rust、Java、Kotlin、C#、Swift、MySQL、Protobuf。
- **JSON to TypeScript（JSON 生成 TypeScript）**  
  从 JSON 示例快速生成 TypeScript 接口。
- **JSON Schema Generator（JSON Schema 生成器）**  
  从示例 JSON 数据自动生成 JSON Schema。

---

## 技术栈

- **前端框架：** Nuxt 4（Vue 3）
- **语言：** TypeScript
- **构建与部署：** 静态站点生成（SSG），可部署到 Cloudflare Pages、Vercel、GitHub Pages 等任意静态托管
- **国际化：** 多语言支持（i18n）
- **其他：** 纯前端实现，无后端依赖

---

## 自建与部署

### 本地开发

```bash
# 安装依赖
pnpm install

# 启动本地开发服务器
pnpm dev
```

### 构建与部署

```bash
# 构建静态文件
pnpm build

# 生成的静态文件位于 `dist` 目录
# 将 `dist` 目录部署到任意静态托管服务即可
#（如 Cloudflare Pages、Vercel、GitHub Pages 等）
```

### 注意事项

- 本项目为纯前端静态站点，无需后端服务。
- 如需自定义域名、HTTPS 等，请在托管平台中配置。
- 自建版本请遵守 [自建与品牌归属](#自建与品牌归属) 中的要求。

---

## 自建与品牌归属

本项目完全免费，允许个人和商业用途的自建与二次开发。  
作为独立开发者，我持续维护和更新此项目。如果你使用本代码部署自己的站点，请在页面中保留来源信息和反链，以支持项目持续发展。

### 要求

如果你自建或基于本项目二次开发并对外提供服务，请满足以下要求：

1. **保留品牌信息**  
   - 在页面底部（footer）或 "About" 页保留如下文字及链接：  
     - "JSON tools powered by [jsontoolbox.cc](https://jsontoolbox.cc)"  
   - 不要通过配置或简单修改刻意移除该信息。

2. **添加反链**  
   - 请在首页或 About 页添加一个指向 https://jsontoolbox.cc 的链接。  
   - 链接建议使用 `dofollow`（不要添加 `rel="nofollow"`），以便搜索引擎识别来源。

3. **注明来源（推荐）**  
   - 在文档、README 或 About 页中说明：  
     - "本工具基于 jsontoolbox.cc 开源项目构建。"  
   - 并附上项目主页或 GitHub 仓库链接。

### 示例代码

你可以在页面 footer 或 About 页中使用类似如下 HTML：

```html
<p>
  JSON tools powered by
  <a href="https://jsontoolbox.cc" target="_blank" rel="noopener">jsontoolbox.cc</a>.
</p>
```

或使用 Markdown：

```md
JSON tools powered by [jsontoolbox.cc](https://jsontoolbox.cc).
```

### 去品牌授权（可选）

如果你需要完全去品牌的版本（例如企业内网白标部署），可以联系我获取单独授权。  
联系方式：[your-email@example.com]

---

## 贡献

欢迎通过 GitHub Issues 反馈 bug 或提出新功能建议。  
如果你希望贡献代码（例如新增一个 JSON 工具、优化现有功能、改进多语言等），请先开一个 issue 说明你的想法，我们一起讨论实现方案。

当前主要由我本人维护和开发，但非常乐意接受社区的反馈和建议。

---

## 许可证

本项目采用 [MIT 许可证](../LICENSE)。

---

## 联系与支持

如果你有任何问题、合作意向，或需要去品牌授权（white-label license），可以通过以下方式联系我：

- **邮箱：** [kbmjj123@gmail.com]  
- **GitHub Issues：** https://github.com/kbmjj123/jsontoolbox.cc/issues  
- **网站：** https://jsontoolbox.cc