# jsontoolbox.cc

一个由独立开发者维护的纯前端开源 JSON 工具箱：提供 **31 个基于浏览器的工具**，覆盖格式化、校验、修复、对比、转换、查看和代码生成，并附带一套持续更新的开发者指南。

所有处理都在浏览器本地完成。你的 JSON 在本地解析、转换和渲染，不会上传到任何服务器，也无需注册账号。

**在线站点：** [https://jsontoolbox.cc](https://jsontoolbox.cc)

## Languages

- [English](../README.md)
- [简体中文](./README.zh-CN.md)

---

## 我们的特色

- **100% 纯客户端。** 每个工具（包括大文件查看器）都在浏览器中读取和处理数据。没有后端，没有上传接口，也没有保存你数据的遥测通道。
- **只做 JSON，且是刻意的。** 不是"什么格式都能转"的杂合站。工具矩阵围绕真实的 JSON 工作流展开：API 报文、配置文件、日志、数据管道，以及喂给 LLM 的提示词。
- **为大型文件而生。** 超过 5 MB 的文件会自动交给专门的查看器：只渲染可见行、在 Web Worker 中搜索，让几十 MB 的 JSON 和 NDJSON 依然可用，而不是把标签页卡死。
- **如实说明边界。** 工具会主动告诉你"这次转换没有收益"——例如 JSON ↔ TOON 转换器会在 TOON 比压缩 JSON 更大时直接提示，JSON 修复工具在无法恢复时报错，而不是返回半成品。
- **不止有工具，还有指南。** 讲解格式背后"为什么"的教程与对比：JSON vs JSONL、JSON vs YAML、JSON vs TOON、JSON 里的注释等等。
- **可嵌入。** 用 [jsontoolbox.cc/embed](https://jsontoolbox.cc/embed) 生成的 iframe，把 JSON 编辑器或查看器放进你自己的文档。

---

## 使用方式

- **在线使用：** [https://jsontoolbox.cc](https://jsontoolbox.cc)
- **嵌入文档：** 用 [嵌入生成器](https://jsontoolbox.cc/embed) 生成 iframe 代码片段（编辑器/查看器、亮色/暗色、高度、只读、是否显示品牌）
- **自建部署：** 在你的基础设施上部署完整工具箱
- **复用组件：** 工具组件是 `app/components/universal/` 下的普通 Vue 3 单文件组件，可复制到其他 Nuxt/Vue 3 项目中使用（目前尚未发布 npm 包）

---

## 功能

共 31 个工具，按任务分组。链接均指向在线版本。

### 格式化、校验与修复

| 工具 | 说明 |
|---|---|
| [JSON Editor（JSON 编辑器）](https://jsontoolbox.cc/tools/format/json-editor) | 编辑、校验、格式化和压缩 JSON：实时语法校验、树视图与表格视图、搜索、复制或下载 |
| [JSON Repair（JSON 修复）](https://jsontoolbox.cc/tools/format/json-repair) | 修复损坏的 JSON：尾随逗号、单引号、未加引号的键、缺失括号、注释、Python 常量 |
| [JSON Minifier（JSON 压缩）](https://jsontoolbox.cc/tools/format/json-minifier) | 移除 JSON 记号之间的无意义空白，生成紧凑输出，并对比字符数与字节数 |
| [JSON Escape & Unescape（转义/反转义）](https://jsontoolbox.cc/tools/format/json-escape) | 把文本转义成 JSON 安全字符串，或把 JSON 字符串字面量反转义回可读文本 |
| [JSON Schema Validator（Schema 校验器）](https://jsontoolbox.cc/tools/format/json-schema-validator) | 按 JSON Schema 校验数据，给出字段级别的详细错误 |
| [JSONPath Tester（JSONPath 测试器）](https://jsontoolbox.cc/tools/format/json-path-tester) | 对数据求值 JSONPath 表达式，查看命中值与路径 |

### 大型文件

| 工具 | 说明 |
|---|---|
| [Large JSON Viewer（大型 JSON 查看器）](https://jsontoolbox.cc/tools/view/large-json-viewer) | 只读打开大型 JSON 与 NDJSON：行号、虚拟滚动、Web Worker 搜索，命中结果可导出为 TXT / JSON / CSV |

### 对比

| 工具 | 说明 |
|---|---|
| [JSON Compare（JSON 对比）](https://jsontoolbox.cc/tools/convert/json-compare) | 高亮新增、删除、修改与类型变化的值，可忽略键顺序或指定字段 |

### 转换：其他格式 → JSON

| 工具 | 说明 |
|---|---|
| [CSV to JSON](https://jsontoolbox.cc/tools/convert/csv-to-json) | 把 CSV、TSV 或分隔符文本转成 JSON 对象数组 |
| [Excel to JSON](https://jsontoolbox.cc/tools/convert/excel-to-json) | 把 `.xlsx` / `.xls` / `.csv` 的每行转成 JSON 对象 |
| [HTML Table to JSON](https://jsontoolbox.cc/tools/convert/html-to-json) | 把 HTML 表格提取为 JSON 数组 |
| [TXT to JSON](https://jsontoolbox.cc/tools/convert/txt-to-json) | 把纯文本或分隔符记录转成 JSON |
| [XML to JSON](https://jsontoolbox.cc/tools/convert/xml-to-json) | 把 XML 转成 JSON，可配置属性与文本节点的处理方式 |
| [YAML to JSON](https://jsontoolbox.cc/tools/convert/yaml-to-json) | 把 YAML 转成 JSON，支持多文档（每个文档对应数组一项） |

### 转换：JSON → 其他格式

| 工具 | 说明 |
|---|---|
| [JSON to YAML](https://jsontoolbox.cc/tools/convert/json-to-yaml) | 生成易读的块式 YAML，适合配置与文档 |
| [JSON to CSV](https://jsontoolbox.cc/tools/convert/json-to-csv) | 把 JSON 数组展平为 CSV，供 Excel / Google Sheets 使用 |
| [JSON to Excel](https://jsontoolbox.cc/tools/convert/json-to-excel) | 把 JSON 数组转成电子表格 |
| [JSON to HTML Table](https://jsontoolbox.cc/tools/convert/json-to-html) | 把 JSON 数组渲染为 HTML 表格 |
| [JSON to Table](https://jsontoolbox.cc/tools/convert/json-to-table) | 以可排序、可筛选的表格查看 JSON 数组 |
| [JSON to XML](https://jsontoolbox.cc/tools/convert/json-to-xml) | 把 JSON 转成 XML |
| [JSON to Text](https://jsontoolbox.cc/tools/convert/json-to-text) | 把 JSON 展平为纯文本 |
| [JSON to PDF](https://jsontoolbox.cc/tools/convert/json-to-pdf) | 从 JSON 数据生成可打印的 PDF |

### 转换：JSON 变体

| 工具 | 说明 |
|---|---|
| [JSONC to JSON](https://jsontoolbox.cc/tools/convert/jsonc-to-json) | 移除 `//` 与 `/* */` 注释以及尾随逗号，并保留字符串内类似注释的文本 |
| [JSON to JSONL](https://jsontoolbox.cc/tools/convert/json-to-jsonl) | 把 JSON 数组转成每行一个 JSON 值 |
| [JSONL to JSON](https://jsontoolbox.cc/tools/convert/jsonl-to-json) | 逐行解析为值并汇总成 JSON 数组，并报出失败的行号 |
| [JSON to TOON](https://jsontoolbox.cc/tools/convert/json-to-toon) | 面向 LLM 提示词的 TOON 双向转换，并与压缩 JSON 并列对比体积 |
| [JSON Parse and Stringify](https://jsontoolbox.cc/tools/convert/json-parse-stringify) | 把 JSON 文本解析为值，或把值序列化为 JSON 文本 |

### 生成代码、Schema 与数据

| 工具 | 说明 |
|---|---|
| [JSON to Code（JSON 生成代码）](https://jsontoolbox.cc/tools/convert/json-to-code) | 生成 8 种语言的起始数据模型：TypeScript、Python、Go、Rust、Java、Kotlin、C#、Swift |
| [JSON to TypeScript](https://jsontoolbox.cc/tools/convert/json-to-typescript) | 从 JSON 示例生成 TypeScript 接口 |
| [JSON Schema Generator（Schema 生成器）](https://jsontoolbox.cc/tools/convert/json-schema-generator) | 从代表性 JSON 数据推断 JSON Schema 草稿 |
| [JSON Array Generator（JSON 数组生成器）](https://jsontoolbox.cc/tools/convert/json-array-generator) | 设定条数与字段名，生成示例 JSON 数组 |

---

## 指南

站点在 `/blog` 下持续发布开发者指南（英文，其中一部分有中文版）。近期主题包括：

- [JSON 中的注释](https://jsontoolbox.cc/blog/json-comments) —— 为什么 JSON 不支持注释，以及该用什么替代
- [如何创建 JSON 文件](https://jsontoolbox.cc/blog/how-to-create-json-file) —— 在 Windows、macOS、Linux 上编写、保存与校验
- [如何创建 manifest.json 文件](https://jsontoolbox.cc/blog/how-to-create-manifest-json) —— PWA 与 Chrome 扩展示例
- [JSON vs JSONL](https://jsontoolbox.cc/blog/json-vs-jsonl) —— 什么时候应该"每行一条记录"
- [JSON vs TOON](https://jsontoolbox.cc/blog/json-vs-toon) —— token 节省究竟取决于什么
- [JSON vs YAML](https://jsontoolbox.cc/blog/json-vs-yaml) —— 机器 vs 人类，以及转换中什么会丢失
- [如何在 Python 中读写 JSON 文件](https://jsontoolbox.cc/blog/read-json-file-python) —— `load` / `loads` / `dump` / `dumps`、编码与异常

指南以带 frontmatter 的 Markdown 形式放在 `content/en/blog/` 与 `content/zh/blog/`。

---

## 技术栈

- **框架：** Nuxt 4（Vue 3）
- **语言：** TypeScript
- **样式：** Tailwind CSS
- **内容：** Nuxt Content（Markdown 指南）
- **国际化：** `@nuxtjs/i18n`（English 与简体中文）
- **构建：** 静态站点生成（Nuxt `preset: "static"`），可部署到 Cloudflare Pages、Vercel、GitHub Pages 等任意静态托管
- **架构：** 纯前端，无后端、无数据库

---

## 自建与部署

### 环境要求

- Node.js 20 或更高版本（Nuxt 4 要求）
- pnpm 10（见 `package.json` 中的 `packageManager`）

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

# 生成的静态文件位于 `.output/public` 目录
# 将该目录部署到任意静态托管服务即可
#（如 Cloudflare Pages、Vercel、GitHub Pages 等）
```

也可以用 `pnpm generate` 做完整预渲染，或用 `pnpm preview` 在本地预览构建结果。

### 注意事项

- 本项目为纯前端静态站点，无需后端服务。
- 如需自定义域名、HTTPS 等，请在托管平台中配置。
- 请设置 `NUXT_PUBLIC_SITE_URL` 为你自己的域名，使 canonical URL 与 sitemap 指向正确的源站。
- 自建版本请遵守 [自建与品牌归属](#自建与品牌归属) 中的指引。

### 目录结构

| 路径 | 内容 |
|---|---|
| `app/components/universal/` | 每个工具一个 Vue 组件 |
| `app/assets/data/{category}/{slug}.json` | 工具元数据：文案、功能、使用步骤、FAQ、SEO |
| `app/composables/` | 共享逻辑（解析、大文件处理、工具注册表） |
| `app/utils/` | 纯函数工具，包含 JSONC 与 TOON 的编解码 |
| `content/{en,zh}/blog/` | Markdown 指南 |
| `i18n/locales/` | 界面文案（`en.json`、`zh-CN.json`） |

---

## 自建与品牌归属

本项目完全免费，允许个人和商业用途的自建与二次开发。  
作为独立开发者，我持续维护和更新此项目。如果你使用本代码部署自己的站点，我们希望你保留简单的来源说明和反链，以支持项目的持续开发。

### 指引

如果你自建或基于本项目二次开发并对外提供服务，我们希望你：

1. **保留品牌信息**  
   - 在页面底部（footer）或 "About" 页保留如下文字及链接：  
     - "JSON tools powered by [jsontoolbox.cc](https://jsontoolbox.cc)"  
   - 请不要通过配置或简单修改刻意移除该信息。

2. **添加反链**  
   - 在首页或 About 页添加一个指向 [https://jsontoolbox.cc](https://jsontoolbox.cc) 的链接。  
   - 建议使用普通链接（不带 `rel="nofollow"`），以便搜索引擎识别来源，但这不是强制要求。  
   - 无需在每个页面都添加链接；在 footer 或 About 页添加一个链接即可。

3. **注明来源（推荐）**  
   - 在文档、README 或 About 页中可以说明：  
     - "本工具基于 jsontoolbox.cc 开源项目构建。"  
   - 附上项目主页或 GitHub 仓库链接会更好。

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
这是可选的，仅适用于需要完全白标解决方案的场景；带品牌归属的常规自建在 MIT 许可证下仍然免费。

**联系方式：** [kbmjj123@gmail.com]

---

## 贡献

欢迎通过 GitHub Issues 反馈 bug 或提出新功能建议。  
这包括对在线工具、可嵌入版本或 Vue 组件（如果你在自己的项目中集成）的反馈。

如果你希望贡献代码（例如新增一个 JSON 工具、优化现有功能、改进多语言等），请先开一个 issue 说明你的想法，我们一起讨论实现方案。

当前主要由我本人维护和开发，但非常乐意接受社区的反馈和建议。

---

## 许可证

本项目采用 [MIT 许可证](../LICENSE.md)。

---

## 联系与支持

如果你有任何问题、合作意向，或需要去品牌授权（white-label license），可以通过以下方式联系我：

- **邮箱：** [kbmjj123@gmail.com]  
- **GitHub Issues：** [https://github.com/kbmjj123/jsontoolbox.cc/issues](https://github.com/kbmjj123/jsontoolbox.cc/issues)  
- **网站：** [https://jsontoolbox.cc](https://jsontoolbox.cc)
