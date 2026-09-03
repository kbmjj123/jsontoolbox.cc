# JSON Toolbox Content Production Plan

> 基于外部需求信号（SERP、Reddit、MDN、JSON Schema 官方文档、NDJSON 规范）的内容选题计划。
> 站点刚起步，暂无 GSC/Bing 历史数据。约 3 个月后切换为数据驱动模式。

---

## 研究方法与限制

目前没有 JsonToolBox 自己的 GSC 查询、页面表现或站内搜索数据，因此以下不是"已经验证会有流量"的承诺，而是基于公开检索意图的第一版内容假设。之后每篇发布后，应由 `json-blog-writer` Skill 读取：

- 文章 Markdown 与工具页内链；
- Google Search Console 的 query/page 报告；
- Search Console 中新增查询；
- 页面 CTR、平均排名、点击趋势；
- 分享示例点击、Formatter/Validator 跳转、复制与下载等站内行为；

再决定扩写、更新、合并还是停止某个内容集群。

### 外部信号来源

- Reddit：开发者对日常 JSON 工具、错误修复、浏览器校验、复杂 JSON 可视化的真实讨论
- MDN：`JSON.parse()` 在文本不符合 JSON grammar 时会抛出 `SyntaxError`，并列举了典型 bad parse 形态
- JSON Schema 官方文档：Schema 是对 JSON 结构、约束和数据类型进行描述与校验的声明式语言
- NDJSON 规范：一行一个独立 JSON 文本，不使用外层数组或逗号，适合流式逐行处理

---

## 最优先文章（P0）

### 1. JSON Parse Errors Explained: Unexpected Token, Unexpected End, and More

**优先级：P0。第一篇建议写它。**

这是现有"JSON 解析失败怎么办？"文章的英文深化/重构方向，而不是简单重复。要先读取现有文章 Markdown，确认它的语言、URL、覆盖内容和已有查询；若已有英文同主题文章，则应更新而不是新建。

#### 为什么优先

- `JSON.parse()` 语法错误是明确、持续、强问题导向的搜索需求
- 用户遇到报错时有立即解决问题的动机
- 容易自然链接到 JSON Validator、Formatter、Viewer
- 可用真实无效 JSON 示例做互动链接
- 容易形成后续错误专题集群
- MDN 的错误文档列出了 `unexpected end of data`、`unexpected character`、`unexpected keyword`、`unexpected non-whitespace character after JSON data` 等常见类别，说明该主题有稳定的官方语义基础

Reddit 也反复出现"合法/非法判断容易，但错误行号、定位和修复很难"的问题；社区讨论的工具价值集中在错误定位和可读性，而不仅是返回一个 `true/false`。

#### 文章必须覆盖

| 错误/现象 | 常见实际原因 | 应给出的处理动作 |
|---|---|---|
| `Unexpected token <` | 服务端返回 HTML 错误页、登录页、404/500 页面，而不是 JSON | 先读取 response text；检查 HTTP 状态码和 `Content-Type` |
| `Unexpected end of JSON input` | 空响应、截断响应、未闭合对象/数组 | 检查响应 body、网络中断、204 响应、缺失 `}`/`]` |
| `Unexpected token }` / `]` | 多余逗号、括号不匹配、错误字符 | 用 Validator 定位行列；检查前一项的逗号与括号 |
| `Unexpected token '` | 单引号、JavaScript 对象字面量被当 JSON | 改双引号，禁止 JSON 中使用单引号 |
| `Unexpected token o` | 对已是对象的值再次调用 `JSON.parse()` | 使用 `response.json()` 或 `JSON.parse(text)` 之一，而不是两者都用 |
| `Unexpected non-whitespace character` | 两段 JSON 被拼在一起、响应尾部有额外字符 | 检查拼接逻辑、NDJSON 场景、日志或 debug 输出 |
| `Bad control character` | 字符串内存在未转义换行、反斜杠、控制字符 | 使用 `\n`、`\\` 等有效 JSON 转义 |

#### 内链与互动示例

- 首段：链接至 JSON Validator
- "多余逗号"示例：链接至预填充的无效 JSON Validator
- "格式化后更容易检查结构"段落：链接至 JSON Formatter
- "嵌套 payload 难读"段落：链接至 JSON Viewer
- 文末：链接到"JSON 是什么""AI JSON 修复""NDJSON vs JSON"

推荐 CTA：
```
Paste the response into the JSON Validator to see the exact error position.
```

#### 工具落点

JSON Validator、JSON Formatter

#### 文章类型

Troubleshooting

---

### 2. How to Validate JSON in JavaScript: Syntax Validation vs JSON Schema Validation

**优先级：P0。第二篇建议写它。**

这是一个高质量、很容易被写错的主题，因为大量内容把"能 `JSON.parse()`"和"满足业务字段规则"混为一谈。

#### 用户真正的问题

用户搜索 "validate JSON" 时可能是在问两件不同的事：

```
问题 A：这段文本是不是合法 JSON？
问题 B：这份合法 JSON 是否符合我的 API / 配置数据规则？
```

文章必须一开始就区分两者：

| 校验类型 | 解决的问题 | 示例 |
|---|---|---|
| JSON syntax validation | 是否符合 JSON 语法 | 是否有双引号、逗号、闭合括号 |
| JSON Schema validation | 是否符合预期的数据结构和约束 | 是否存在 `email`、`age` 是否为整数、数组最少元素数 |
| API runtime validation | 是否满足服务端业务规则 | 用户是否有权限、商品是否存在、日期是否可用 |

JSON Schema 官方将它定义为用于标注和验证 JSON 文档结构、约束和数据类型的声明式语言；它不等同于单纯 `JSON.parse()` 成功。

#### 必须包含的代码和边界

```ts
export function isValidJson(value: string): boolean {
  try {
    JSON.parse(value)
    return true
  } catch {
    return false
  }
}
```

然后立刻解释它**不能**保证：

```json
{
  "email": "not-an-email",
  "age": -999,
  "role": "unknown"
}
```

在语法上仍然合法。

应配套一个 JSON Schema 示例：

```json
{
  "type": "object",
  "required": ["email", "age"],
  "properties": {
    "email": {
      "type": "string",
      "format": "email"
    },
    "age": {
      "type": "integer",
      "minimum": 0
    }
  },
  "additionalProperties": false
}
```

再说明：不同 validator 对 `format` 的实现/启用方式可能不同，因此文章不要把它写成所有实现中自动强制的万能规则。

#### 内链规划

- `Validate JSON syntax online` → JSON Validator
- `Format valid JSON before inspecting it` → JSON Formatter
- `Inspect nested output` → JSON Viewer
- 后续可链接到 JSON Schema 专题页或 Schema Validator 工具（若未上线，则不虚构工具页）

#### 工具落点

JSON Validator、JSON Formatter

#### 文章类型

Technical guide

---

### 3. Why AI-Generated JSON Breaks—and How to Validate and Repair It Safely

**优先级：P0。第三篇建议写它。**

这是当前很有现实场景的内容方向。Reddit 中出现"从 Anthropic API 获得 malformed JSON""缺少逗号、键没有加双引号、尾逗号、字符串/转义问题"等讨论，用户实际在寻找的是可靠处理策略，而不是一句"用 JSON.parse"。

#### 为什么适合 JsonToolBox

用户已经在使用 AI 编程工具。AI 生成 JSON 的失败非常适合引向：

- JSON Validator
- JSON Formatter
- JSON Repair（**只有产品确实具备才链接**）
- JSON Viewer
- 后续的敏感数据脱敏与分享功能

#### 文章不应写成"AI 很笨"

高质量文章应该区分失败来源：

| 场景 | 常见失败模式 | 可靠应对 |
|---|---|---|
| LLM 直接输出 JSON | Markdown code fence、解释文本、截断、尾逗号 | 提示模型只返回 JSON；提取代码块前验证；限制输出 |
| Function calling / structured output | 仍可能是业务 schema 不合格 | 使用 JSON Schema/业务校验，不只检查 parse |
| 流式响应 | 读取未结束就 parse | 缓冲完整响应后再解析 |
| 用户复制 AI 输出 | 使用单引号、注释、`undefined`、`NaN` | 明确 JSON 与 JS object literal 的差异 |
| 自动修复 | 可能错误推断数据含义 | 只作为辅助；保存原始文本；让用户复核 |
| 生产接口 | Silent repair 掩盖上游问题 | 记录失败，保留原始响应，修复 prompt/contract |

#### 内链规划

- "Validate before using the output" → JSON Validator
- "Make malformed output easier to inspect" → JSON Formatter
- "Inspect a deeply nested response" → JSON Viewer
- "Share a minimal reproducible example safely" → 分享功能上线后链接到 Share JSON 页面或博客

#### 工具落点

JSON Validator、JSON Formatter、JSON Viewer

#### 文章类型

Scenario guide

---

## 第一优先级文章（P1）

### 4. JSON Lines vs JSON: When to Use NDJSON/JSONL and How to Parse It

**优先级：P1。建议在前三篇后写。**

这是一个更专业、内容密度高、能体现开发者工具站技术质量的主题。

NDJSON / JSON Lines 是"每一行一个独立 JSON 文本"的格式：没有外层数组、没有行间逗号；规范要求每个 JSON text 符合 JSON 标准，并以换行分隔。它支持逐行读取和处理，而不必把整个数据集放入内存。

#### 用户意图

用户可能遇到：

```
Unexpected non-whitespace character after JSON data
JSON.parse fails on a .jsonl file
How to read OpenAI batch JSONL
How to parse NDJSON stream
JSONL vs JSON array
```

#### 必须回答

| 问题 | 文章应给出的明确答案 |
|---|---|
| JSON 和 JSONL 是否相同？ | 每一行是合法 JSON，但整个 `.jsonl` 文件通常不是一个单独 JSON document |
| 为什么 `JSON.parse(fileText)` 会失败？ | 因为多个 JSON 文本连续出现，不能作为一个 JSON 值整体解析 |
| 何时用 JSON array？ | 小规模一次性数据、常规 API 返回、整体读取 |
| 何时用 NDJSON？ | 日志、流式传输、批处理、大数据逐行处理 |
| 空行怎么办？ | 规范允许实现决定是否忽略，但行为应明确；代码需可配置 |
| 某一行坏了怎么办？ | 记录行号和原文；选择 fail-fast 或跳过坏记录 |
| 后续还需要 Schema 吗？ | 需要；先逐行 parse，再对每条记录做结构/业务校验 |

#### 示例代码

```ts
export function parseNdjson(text: string) {
  const rows = text.split(/\r?\n/)
  const results: unknown[] = []

  for (const [index, row] of rows.entries()) {
    const line = row.trim()

    if (!line) continue

    try {
      results.push(JSON.parse(line))
    } catch (error) {
      throw new Error(`Invalid JSON on line ${index + 1}: ${String(error)}`)
    }
  }

  return results
}
```

注意：这只是读取完整字符串的入门示例；真正大文件/流场景应使用流式读取，不应承诺这段代码适合任意规模的文件。

#### 对产品的价值

可以先只写文章和提供 JSON Validator/Viewer 的入口；不要为了文章立即开发"NDJSON Formatter"。如果后续 GSC 出现 `ndjson formatter`、`jsonl validator`、`json lines viewer`、`format jsonl online` 等查询，再评估增加一个轻量 NDJSON/JSONL 工具。

#### 工具落点

JSON Validator、JSON Viewer

#### 文章类型

Technical explainer

---

### 5. How to Read Large and Deeply Nested JSON Without Losing Context

**优先级：P1。适合 JSON Viewer 的核心内容页。**

Reddit 的日常工具讨论给了一个很实际的差异化信号：IDE 内置格式化通常足够，但"理解大型、复杂嵌套 payload"时，开发者才会寻找专门 Viewer、Tree 或 Graph 工具。

这篇不是"如何格式化 JSON"的重复文章，而是解决：

```
API 返回很大
→ 展开层级迷路
→ 不知道某字段在哪里
→ 不知道数组中哪个对象有问题
→ 想定位某个 key / value
→ 需要查看结构但不想改内容
```

#### 建议结构

1. 先给直接答案：不要一上来全文展开；先格式化、折叠、搜索和按路径定位
2. Tree View 与 Code View 的适用场景
3. 按键名搜索与按值搜索的区别
4. 对大数组只检查代表性记录与异常项
5. 如何用 JSON Path 思维描述位置，例如：`users.orders[0].shipping.address.city`
6. 如何创建最小可复现 JSON
7. 当 payload 可能有敏感数据时，如何脱敏后再分享
8. 使用 Viewer 的实际步骤

#### 内链

- 首段与关键步骤 → JSON Viewer
- "格式化作为第一步" → JSON Formatter
- "数据不合法先排错" → JSON Validator
- "最小可复现示例/安全分享" → 未来 Share JSON 功能

#### 工具落点

JSON Viewer、JSON Formatter、JSON Validator

#### 文章类型

Workflow guide

---

## 第二优先级文章（P1/P2）

### 6. How to Compare Two JSON Objects: API Response Diffing Without Missing Changes

**优先级：P1/P2，取决于产品是否已有 JSON Diff。**

只有 JsonToolBox 已有可用、稳定的 JSON Diff 工具时才写。否则先不排入生产队列。

#### 真实场景

- 前后端接口升级后字段变了
- staging / production API response 不一致
- webhook 重试 payload 出现差异
- 两份配置文件是否一致
- 数组顺序改变究竟算不算差异

#### 文章必须说明的比较策略

| 维度 | 是否可能影响 diff |
|---|---|
| Object key 顺序 | 通常不应影响语义 |
| Array 顺序 | 通常可能影响语义 |
| 缺失字段 vs `null` | 不同 |
| 数字 `1` vs 字符串 `"1"` | 不同 |
| 时间戳、ID、随机值 | 可能需要忽略或先脱敏 |
| 格式化空白 | 不应影响结构 diff |

#### 工具落点

JSON Diff（若已上线）

#### 文章类型

Tutorial

---

### 7. JSON to CSV: How to Flatten Nested JSON Without Losing Meaning

**优先级：P2。**

仅当 JsonToolBox 已存在 JSON to CSV / Converter 功能时写。

#### 用户的真实痛点

不是"按一下转换按钮"，而是：

```
嵌套对象怎么办？
数组怎么办？
字段缺失怎么办？
哪些字段应该作为列？
一行代表什么？
转换后如何避免误导分析？
```

文章可以围绕数组对象、嵌套路径、缺失值、数组展开策略、列选择、Excel 注入风险等高质量内容展开。

#### 工具落点

JSON to CSV / Converter（若已上线）

#### 文章类型

Tutorial

---

### 8. JSON Formatting vs Minifying: When Each Is Useful in Development

**优先级：P2。**

这是工具关联度高、难度低的补充文章，但不应最先写，因为信息密度容易不足。

#### 正确角度

- Format 是为了阅读、调试、代码审查
- Minify 是为了减小传输体积或嵌入静态 payload
- API 的响应压缩通常应交给 HTTP Content-Encoding，不是手工将 JSON 去空格
- Minify 不会替代 gzip/Brotli
- 不要 minify 后直接失去可调试性
- 合法 JSON、字符串空白、编码和大小统计的注意事项

#### 工具落点

JSON Formatter、JSON Minifier

#### 文章类型

Explainer

---

## SharePoint 内容：先不排入第一批

SharePoint JSON Formatting 的确是独立、强意图的市场：Microsoft 官方说明 JSON 可用于定制 SharePoint Lists 和 Libraries 中列/视图的显示，而 PnP 社区维护了大量可直接复制的示例库。

但当前不建议让它占据首批通用 JSON 内容的前 3 位，原因是：

- 它是 Microsoft/SharePoint 垂直生态，读者与泛 JSON 工具用户不完全重叠
- 搜索结果里有微软官方、PnP 示例库等强权威站
- 需要提供真正有差异的模板、截图、字段解释和验证逻辑
- 如果只写泛泛"SharePoint JSON Formatting 是什么"，很容易成为低价值教程
- 在没有 GSC 或站内需求之前，不应因 Autocomplete 的噪声把主内容战略带偏

### 适合后续验证的 SharePoint 第一篇

```
SharePoint JSON Formatting Not Working? 12 Common Problems and Fixes
```

这个比"SharePoint JSON Formatting Examples"更适合先验证，因为它能提供明确诊断价值，并自然连接到通用 JSON Validator。

但发布前必须确认能正确覆盖：

- Column Formatting 与 View Formatting
- `@currentField` 与 `[$InternalFieldName]`
- Person / Lookup / Choice 字段差异
- SharePoint Online / Microsoft Lists / SharePoint Server 2019 的兼容性
- JSON 合法但 SharePoint formatter 无效的典型原因

---

## 不建议现在写的主题

### "Best Free JSON Tools for Frontend Developers in 2026"

暂不建议。理由：

- 竞争性高
- 搜索意图容易偏商业对比
- 必然需要评价竞争产品
- 自己的网站进入名单会有明显自荐偏差
- 很难在起步阶段形成可信、可引用的独特结论
- 需要长期维护年份、产品功能、隐私政策和价格变化

### "7 Free Online JSON Formatters Compared"

暂不建议。风险高：

- 需要真实、持续的测试
- "隐私、速度、广告、上传行为"必须逐一核实
- 竞品变化快
- 容易被搜索引擎视为缺少独特研究的 affiliate-style comparison
- 需要维护截图、方法论、测试样本和更新日期

如果未来要写，应变成一份有明确方法论的研究：
```
How We Tested Online JSON Formatters:
Privacy, Local Processing, Error Diagnostics, Large-File Behavior, and Accessibility
```

### "What Is JSON?"

站内已有"JSON 是什么？结构、语法与常见错误"文章。不要重复建设同一意图页面；应优先更新、翻译、扩展或从它自然拆出专题。

### "How to Format JSON Online"

也不是首批优先，因为它通常是典型红海工具词。除非现有 GSC 已经显示该主题有曝光、且文章能加入独特内容——例如"合法 JSON、无效 JSON、API response、隐私、本地处理、分享示例"的真实工作流——否则不要只写一个基础教程。

---

## 生产序列总结

| 顺序 | 建议英文标题 | 用户意图 | 工具落点 | 文章类型 |
|---:|---|---|---|---|
| 1 | JSON Parse Errors Explained: Unexpected Token, Unexpected End, and More | 排查报错 | Validator、Formatter | Troubleshooting |
| 2 | How to Validate JSON in JavaScript: Syntax Validation vs JSON Schema Validation | 理解/实现校验 | Validator、Formatter | Technical guide |
| 3 | Why AI-Generated JSON Breaks—and How to Validate and Repair It Safely | 修复 AI 输出 | Validator、Formatter、Viewer | Scenario guide |
| 4 | JSON Lines vs JSON: When to Use NDJSON/JSONL and How to Parse It | 处理 JSONL | Validator、Viewer | Technical explainer |
| 5 | How to Read Large and Deeply Nested JSON Without Losing Context | 检查复杂 payload | Viewer、Formatter | Workflow guide |
| 6 | How to Compare Two JSON Objects: API Response Diffing Without Missing Changes | 比较接口/配置 | JSON Diff（若已上线） | Tutorial |
| 7 | JSON to CSV: How to Flatten Nested Data Without Losing Meaning | 导出/分析数据 | Converter（若已上线） | Tutorial |
| 8 | JSON Formatting vs Minifying: When Each Is Useful in Development | 格式化与压缩选择 | Formatter、Minifier | Explainer |

## 第一篇的差异化目标

```
错误信息
→ 它真正告诉你的是什么
→ 最常见的根因
→ 如何在浏览器 Network / response text 中确认
→ 修复代码
→ 可立即打开的 JSON Validator 示例
→ 与 JSON Schema / NDJSON / AI 输出问题的边界
```

这比泛泛的"JSON 格式化工具推荐"更符合开发者真实工作流，也更能让已有的 Validator、Formatter 和 Viewer 成为文章里自然的解决动作。
