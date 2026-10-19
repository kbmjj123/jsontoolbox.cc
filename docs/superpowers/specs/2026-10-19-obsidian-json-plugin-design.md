# Obsidian 富 JSON 查看器插件 — 设计文档

- **日期**：2026-10-19
- **状态**：待用户审查（brainstorming 产出，未进入实现）
- **项目**：`jsontoolbox.cc`（面向开发者的 JSON 工具国际站，SEO 驱动）

---

## 1. 背景与目标

`jsontoolbox.cc` 是 SEO 驱动的 JSON 开发者工具站，增长依赖自然搜索。本插件的目标是开发一个**免费、开源的 Obsidian 插件**，作为 **linkable asset**（可被引用的资产）获取指向 `jsontoolbox.cc` 的高质量反向链接，从而提升站点 SEO。

插件本身必须对开发者真实有用——外链是"顺带"结果，不是靠硬塞链接获得。

### 成功标准
1. 插件通过 Obsidian 社区市场审核并上线（形成 `obsidian.md/plugins/<id>` 外链页）。
2. GitHub README 与社区市场页自然包含指向 `jsontoolbox.cc` 的链接。
3. 插件功能完整可用（富 JSON 查看 + 工具），用户愿意安装使用。

---

## 2. 决策记录（已逐项确认）

| 决策项 | 结论 | 理由 |
|---|---|---|
| 外链性质 | **SEO 反向链接**（linkable asset 策略），非"笔记外部链接管理"功能 | 目标是站点 SEO |
| 插件定位 | **JSON 工具型**（与站点同主题） | 同主题反链 SEO 权重更高、更自然，非 spam |
| 架构路线 | **方案 C：先 B 后 A** | MVP 先上线验证，降低风险 |
| 资源预览 | **移植现有 jsoneditor 全部 14 类** | 这是真正差异化卖点，区别于普通格式化器 |
| 仓库策略 | **先同仓开发，后续剥离独立 repo** | 开发期享受 monorepo 便利；发布期满足社区市场硬约束 |
| 目录 | 顶层 `plugins/obsidian-json-toolbox/`，`pnpm-workspace.yaml` 追加 `plugins/*` | 语义清晰，不与 `packages/` 组件库混淆 |
| 复用方式 | `mediaPreview.ts` 复制进插件（自包含）；其余能力装成熟 npm 包 | 最终要独立，自包含最利于剥离；避免跨层引用 |

### 关键硬约束
Obsidian 社区插件提交要求 GitHub 仓库**根目录**包含 `manifest.json`（release 再挂 `main.js` / `styles.css`）。当前 monorepo 根是站点，不可能在根放插件 manifest，因此**插件最终必须作为独立 repo 发布**——这正是"先同仓开发、后续剥离"路线的原因。

---

## 3. 功能范围

### 3.1 MVP（方案 B：命令触发模态）

| 命令 | Command ID | 作用 |
|---|---|---|
| Open JSON Viewer | `open-json-viewer` | 选中文本 → Modal 富树视图 + 全部 14 类资源预览 |
| Format JSON | `format-json` | 美化选中 JSON（2 空格缩进） |
| Validate JSON | `validate-json` | 校验并定位错误行 |
| JSON ↔ YAML | `json-yaml-toggle` | 自动检测输入是 JSON 还是 YAML，转为另一种格式 |
| JSON → Table/CSV | `json-to-table` | 数组 / 对象转表格 |

### 3.2 后续迭代（方案 A：代码块内联）
注册 ```` ```json ```` / ```` ```yaml ```` 的 `MarkdownPostProcessor`，阅读模式下代码块直接渲染为可折叠富树 + 内联资源预览。复用同一套 `mediaPreview` 检测与树渲染逻辑。

---

## 4. 资源预览（14 类，移植自现有 jsoneditor）

来源：`app/utils/mediaPreview.ts`（纯 TS、零依赖）的检测/解码逻辑；渲染参考 `app/components/tool/RichValueNode.vue` 与 `JsonValuePreview.vue`。

| 类别 | 检测规则 | 渲染形式 |
|---|---|---|
| 颜色 | `#hex` / `rgb()` / `hsl()` | 内联色块 |
| 图片 | 扩展名 / 图片 host / 路径；任意 http(s) URL 亦尝试 | 缩略图（限宽），点击放大 |
| 音频 | `.mp3 .wav .ogg .m4a .flac .aac .opus .weba` | 播放器 / 类型标识 |
| 视频 | `.mp4 .webm .ogv .mov .m4v` | 播放器 / 类型标识 |
| PDF | `.pdf` | 类型标识 + 打开 |
| URL | `http(s)://` | 可点击链接 + 复制 |
| Email | `x@y.z` | `mailto:` 链接 |
| 时间戳 | 10/13 位 epoch、ISO 日期 | 格式化为 local / utc / iso |
| JWT | 三段式 | 解码 header / payload |
| Base64 | 标准 Base64 与 `data:` URI | 解码；嗅探内联图片并渲染 |
| UUID | 标准 UUID 格式 | 类型标识 |
| IP | IPv4 | 类型标识 |
| Markdown | 标题 / 加粗 / 代码块 / 列表语法 | Markdown 渲染 |
| 正则 | `/.../flags` | 类型标识 |

检测顺序按"最具体到最宽泛"（`detectValueKind` 现有顺序），确保 `.pdf` 优于 `url` 等。

---

## 5. 架构与目录结构

### 5.1 自包含目录（剥离后即 repo 根）

```
plugins/obsidian-json-toolbox/
  manifest.json        ← 剥离后位于 repo 根（社区市场硬要求）
  package.json         ← 开发依赖：obsidian / esbuild / typescript / js-yaml
  esbuild.config.mjs
  tsconfig.json
  README.md            ← 含 jsontoolbox.cc 外链；剥离后即社区市场页内容源
  styles.css
  src/
    main.ts            (入口：注册命令、设置、Modal)
    mediaPreview.ts    (复制自 app/utils/mediaPreview.ts，纯 TS 零依赖)
    jsonTree.ts        (JSON → 树模型)
    treeView.ts        (HTMLElement 渲染可折叠树 + 内联资源预览)
    yaml.ts            (js-yaml 封装)
    commands.ts        (命令集)
    settings.ts        (设置页 + About 外链)
```

### 5.2 自包含原则（为剥离铺路）
- **禁止** import `~/` 或 `app/` 内部路径 —— 只依赖公开 npm 包与自身 `src/`。
- 依赖只用公开包：`js-yaml`（JSON↔YAML）、`jsonrepair`（可选，JSON 修复）、`obsidian`（API 类型）、`esbuild`、`typescript`。
- 格式化 / 校验 / 表格转换等能力直接装成熟 npm 包，**不从站点复制**；站点本身就是靠这些包实现的。
- 剥离时整个目录 `git mv` 出去即可，无需修改任何 import。

### 5.3 分层（决定复用边界）
| 层 | 内容 | 共享范围 |
|---|---|---|
| L1 纯逻辑 | `mediaPreview`、自研 JSON 工具 | 站点 / 组件库 / 插件均可（纯 TS） |
| L2 Vue 渲染 | `RichValueNode` 等 Vue 组件 | 仅站点与组件库（插件非 Vue 环境） |
| L3 DOM 渲染 | 插件内 `treeView.ts` | 插件独有，渲染 L1 分类结果 |

---

## 6. 数据流

1. 用户执行命令（或选中文本后执行命令）。
2. 读取 editor 选区文本；无选区时取当前行 / 整个文档块。
3. `JSON.parse`（try/catch）→ 构建树模型（`jsonTree.ts`）。
4. 渲染 Obsidian `Modal`：`treeView.ts` 用 `HTMLElement` 生成可折叠树。
5. 每个叶子值经 `detectValueKind` 分类，按类渲染（`img` / 色块 / `a` / 文本格式化）。
6. 交互：折叠展开、复制路径、打开链接、点击放大图片。

---

## 7. 错误处理（沿用现有逻辑）

- **解析失败**：Modal 内显示错误信息与大致行号（参考现有 `JsonErrorsPanel` 的错误定位思路）。
- **图片加载失败**：`@error` 隐藏预览元素（同 `RichValueNode` 现有行为）。
- **远程资源**（image / audio / video / pdf）：提示"将向第三方发起请求"（复用 `isRemoteResource`），符合站点隐私友好定位。

---

## 8. 外链布局（核心 SEO 目标）

| 来源 | 外链形式 | 价值 |
|---|---|---|
| **Obsidian 社区市场页** | 提交 repo 后自动抓取 README，生成 `obsidian.md/plugins/<id>`，含站链接 | **最高**（权威、dofollow、开发者精准流量） |
| **GitHub README** | 顶部 "🌐 Full online version: https://jsontoolbox.cc"，并对比"插件 vs 在线版" | 高 |
| **`manifest.json` 的 `authorUrl`** | 指向 `https://jsontoolbox.cc`，社区市场页显示为作者链接 | 高（易被忽略的一条） |
| 插件设置页 About | "Powered by JSON Toolbox · jsontoolbox.cc" | 中 |
| Modal 底部 | 固定 "JSON Toolbox · jsontoolbox.cc" 文案 | 中 |
| 可选内容/社区 | 站点博客发一篇英文"我们做了个 Obsidian 插件"；Obsidian 论坛 / Reddit 发帖 | 自然外链增量 |

**锚文本规范**：使用品牌名 "JSON Toolbox" 或裸域名，不堆砌关键词，避免被判定为 spam。

**插件 id**：建议 `json-toolbox`（与品牌一致，市场页 URL 最简洁）；若已被占用则回退 `json-toolbox-viewer`。

---

## 9. 开发、剥离与发布流程

### 9.1 开发期
1. 新建 `plugins/obsidian-json-toolbox/`，`pnpm-workspace.yaml` 追加 `plugins/*`。
2. 从 `app/utils/mediaPreview.ts` 复制 `src/mediaPreview.ts`，文件头注明"同源：jsontoolbox.cc `app/utils/mediaPreview.ts`，改动请双向同步"。
3. `npm run dev`（esbuild watch）→ 产物通过 symlink 挂到测试 vault 的 `.obsidian/plugins/json-toolbox/` 调试。
4. 构建由开发者本地执行；AI 只写代码、文档与静态检查（遵守"AI 不跑 build"约束）。

### 9.2 剥离期
1. 将 `plugins/obsidian-json-toolbox/` 整体迁出为独立 GitHub repo（`manifest.json` 位于根，满足社区市场要求）。
2. README 补全：功能说明、截图、安装方式、外链。
3. 发 GitHub release，附 `main.js` / `manifest.json` / `styles.css`。

### 9.3 发布期
1. 向 `obsidianmd/obsidian-releases` 提交社区插件 PR（需 repo 地址、README、描述、截图）。
2. 审核通过 → 市场可搜 → 社区市场页外链生效。

---

## 10. 测试

- **单元测试**（vitest）：覆盖 `mediaPreview.ts` 的 `detectValueKind` 分类与 `decodeJwt` / `decodeBase64` / `formatTimestamps` 解码，沿用站点现有测试思路。
- **手动 E2E**：在 Obsidian 沙盒 vault 中验证 5 个命令、14 类预览渲染、错误提示。
- 构建与发布由开发者本地验证。

---

## 11. 风险与权衡

| 风险 | 缓解 |
|---|---|
| `mediaPreview.ts` 双份导致逻辑分叉 | 文件头同步注释；该类检测规则极稳定；未来可随时抽 `@kbmjj123/json-core` 统一（退路保留） |
| 社区市场审核不通过 | 严格遵循官方插件指南：README 完整、无遥测追踪、无强制联网、提供截图 |
| 图片预览触发第三方请求 | 复用 `isRemoteResource` 给出提示，保持隐私友好 |
| 代码块内联（方案 A）实现复杂度 | 已推迟到 MVP 之后迭代，不阻塞首发 |

---

## 12. 未包含（YAGNI 明确排除）

- 生成 TypeScript / Go 类型定义（用户未选入 MVP）。
- JSON 压缩（Minify）—— MVP 只做美化格式化。
- 插件内置遥测、账号体系、云同步。
- 依赖站点在线 API（插件必须离线可用）。
