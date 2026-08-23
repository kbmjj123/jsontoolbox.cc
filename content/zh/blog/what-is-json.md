---
title: "JSON 是什么？结构、语法与常见错误（2026 开发者实战指南）"
description: "从真实开发场景讲解 JSON 是什么、数据结构与语法规则，并剖析接口调试中最常见的 JSON 错误与排查方法。"
category: "json_tools"
date: 2026-08-23
lastmod: 2026-08-23
author: "BulkPicTools Team"
image: "https://img.yoursite.com/blog/what-is-json-cover.webp"
tags: ["JSON", "JSON Formatter", "JSON Validator", "API Debugging", "Web Development"]
locales: ["zh-CN", "en"]
promo:
  slug: "json-formatter"
  text: "🚀 直接开始格式化你的 JSON："
  btn: "JSON Formatter"
---

# JSON 是什么？结构、语法与常见错误（开发者实战版）

JSON（JavaScript Object Notation）是一种轻量级的数据交换格式，几乎出现在所有现代 Web 开发和 API 设计中：从浏览器与后端通信，到配置文件（如 `package.json`、`tsconfig.json`），再到日志和消息队列。[1][2]  
与“教科书式介绍”不同，这篇文章会从**真实开发场景**出发，解释 JSON 的结构与语法，并重点剖析你在日常开发中最容易遇到的错误及其排查方法。

## 为什么开发者必须懂 JSON？

在现代 Web 开发中，JSON 几乎无处不在：

- **前后端通信**：RESTful API 和大多数 GraphQL 服务使用 JSON 作为请求/响应体。  
- **配置文件**：Node.js 项目中的 `package.json`、TypeScript 的 `tsconfig.json` 等都是 JSON 或 JSON 的超集。  
- **日志与监控**：许多日志系统（如 ELK、Cloudflare Logs）使用 JSON 格式存储结构化日志。  
- **第三方服务集成**：支付、短信、邮件、分析平台等 SDK 通常返回或接收 JSON。  

不理解 JSON 的严格语法规则，很容易在调试接口、解析响应、处理配置时浪费大量时间。

## JSON 的数据类型：不只是“对象和数组”

JSON 只支持有限的几种数据类型，这也是它简单且易解析的原因：[1][3]

- **对象（Object）**：键值对集合，用 `{}` 包裹。  
- **数组（Array）**：有序列表，用 `[]` 包裹。  
- **字符串（String）**：必须用双引号 `"` 包裹。  
- **数字（Number）**：整数或浮点数，不支持十六进制、八进制。  
- **布尔值（Boolean）**：`true` 或 `false`。  
- **空值（null）**：表示“无值”。  

JSON 不支持：函数、日期对象、正则、`undefined`、注释等。[1][3]  
在真实项目中，日期通常用 ISO 8601 字符串表示，如 `"2026-08-23T08:00:00Z"`。

## 真实接口中的 JSON 长什么样？

### 典型 REST API 响应

```json
{
  "success": true,
  "data": {
    "id": 12345,
    "name": "Alice",
    "email": "alice@example.com",
    "roles": ["user", "editor"],
    "createdAt": "2026-08-23T08:00:00Z"
  },
  "meta": {
    "requestId": "req_abc123",
    "version": "v1"
  }
}
```

特点：

- 顶层是对象，便于扩展（`success`、`data`、`meta` 等字段）。  
- 使用嵌套对象和数组表达复杂结构。  
- 日期用字符串表示，而不是 `new Date()`。

### 列表接口（分页）

```json
{
  "success": true,
  "data": [
    { "id": 1, "title": "JSON Guide" },
    { "id": 2, "title": "API Design Tips" }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 58
  }
}
```

这种结构在后台管理系统、内容列表中非常常见。

### 错误响应（容易被忽略）

```json
{
  "success": false,
  "error": {
    "code": "INVALID_JSON",
    "message": "Unexpected token ':' in JSON at position 3",
    "details": {
      "line": 2,
      "column": 5
    }
  }
}
```

当后端校验 JSON 失败时，往往返回类似结构。前端如果直接 `JSON.parse` 原始响应，而没检查 `success` 字段，就容易在错误处理上踩坑。

## JSON 的语法规则：从“能跑”到“严格正确”

### 对象（Object）

- 用 `{}` 包裹。  
- 内部是零个或多个 `"key": value` 对，用逗号分隔。  
- 键必须是**双引号字符串**。  

```json
{
  "id": 123,
  "name": "JSON Guide",
  "active": true,
  "meta": null
}
```

### 数组（Array）

- 用 `[]` 包裹。  
- 内部是零个或多个值，用逗号分隔。  
- 值可以是任意合法 JSON 值，类型可混合。  

```json
[
  "apple",
  42,
  true,
  { "key": "value" },
[1][2][3]
]
```

### 字符串与转义

- 必须使用双引号 `"`。  
- 常见转义：`\"`、`\\`、`\n`、`\t`、`\uXXXX`。  

```json
{
  "message": "He said \"hello\"",
  "path": "C:\\Users\\Alice",
  "multiline": "Line1\nLine2"
}
```

### 数字、布尔、null

```json
{
  "int": 10,
  "float": 3.14,
  "negative": -0.5,
  "exp": 1.23e10,
  "enabled": true,
  "deleted": false,
  "optional": null
}
```

## 常见 JSON 错误：从报错信息到修复步骤

下面列出真实开发中最常见的 JSON 错误，并配上典型报错信息和排查思路。

### 使用单引号或无引号的键

错误示例：

```json
{
  'name': 'Alice',
  name: "Alice"
}
```

典型报错（浏览器 / Node.js）：

> `SyntaxError: Unexpected token ':' in JSON at position 1`

修复：

```json
{
  "name": "Alice"
}
```

**要点**：JSON 中所有字符串（包括键）都必须用双引号。[1][3]

### 末尾多余的逗号

错误示例：

```json
{
  "name": "Alice",
  "age": 30,
}
```

或：

```json
[1, 2, 3,]
```

典型报错：

> `SyntaxError: Unexpected token '}' in JSON at position 27`

修复：

```json
{
  "name": "Alice",
  "age": 30
}
```

```json
[1][2][3]
```

**要点**：JSON 不允许在最后一个元素后有多余逗号。[3]

### 在 JSON 中写注释

错误示例：

```json
{
  // 用户信息
  "name": "Alice",
  "age": 30
}
```

或：

```json
{
  "name": "Alice", /* 年龄 */ "age": 30
}
```

典型报错：

> `SyntaxError: Unexpected token '/' in JSON at position 2`

修复：去掉所有注释。

```json
{
  "name": "Alice",
  "age": 30
}
```

**要点**：标准 JSON 不支持任何注释。[1][3]  
如果确实需要“带注释的配置”，可以考虑 JSONC 或 YAML，但它们不是标准 JSON。

### 使用非法值：`undefined`、函数、日期对象等

错误示例：

```json
{
  "name": "Alice",
  "created": undefined,
  "handler": function() {},
  "date": new Date()
}
```

典型报错：

> `SyntaxError: Unexpected token 'u' in JSON at position 20`

修复：

```json
{
  "name": "Alice",
  "created": null,
  "handler": null,
  "date": "2026-08-23T08:00:00Z"
}
```

**要点**：JSON 只支持对象、数组、字符串、数字、布尔和 `null`。[1][3]

### 字符串中包含未转义的引号或换行

错误示例：

```json
{
  "message": "He said "hello""
}
```

或：

```json
{
  "text": "Line1
Line2"
}
```

典型报错：

> `SyntaxError: Unexpected token 'h' in JSON at position 15`

修复：

```json
{
  "message": "He said \"hello\""
}
```

```json
{
  "text": "Line1\nLine2"
}
```

**要点**：字符串中的双引号必须转义为 `\"`，换行等控制字符必须用转义序列表示。[1]

### 把“HTML 错误页”当成 JSON 解析

真实场景：

- 请求接口时，服务器返回 500/404，Body 是 HTML 错误页，而不是 JSON。  
- 前端仍然执行 `JSON.parse(responseText)`，结果报错。

典型报错：

> `SyntaxError: Unexpected token '<' in JSON at position 0`

原因：HTML 以 `<` 开头（如 `<!DOCTYPE html>`），不是合法 JSON。

排查步骤：

1. 打开浏览器 Network 面板，查看该请求的 **Response**。  
2. 确认返回的 `Content-Type` 是否为 `application/json`。  
3. 检查状态码是否为 2xx，以及 Body 是否为真正的 JSON。  

解决方式：

- 在前端解析前，先检查 `Content-Type` 和状态码。  
- 对非 2xx 响应，优先读取错误信息，而不是直接 `JSON.parse`。

## 如何快速检查 JSON 是否正确？

### 使用在线 JSON 验证与格式化工具

把你的 JSON 粘贴到在线工具中，可以：

- 自动检查语法错误，并提示错误位置（行/列）。  
- 一键格式化（缩进、换行），方便阅读和调试。  
- 支持压缩（minify），减少传输体积。

如果你正在构建工具站，可以在这里自然引导用户使用你的工具，例如：

> 把你的 JSON 粘贴到我们的 [JSON Formatter & Validator](/tools/json-formatter) 中，自动检查语法错误并格式化输出。

### 浏览器控制台快速验证

```js
const text = `你的 JSON 字符串`;
JSON.parse(text);
```

如果有语法错误，会抛出异常，并在控制台显示错误信息和大致位置。

### 在代码中安全解析

Node.js / 前端中：

```js
try {
  const data = JSON.parse(text);
  // 合法 JSON，继续处理
} catch (e) {
  // 不合法 JSON
  console.error('JSON 解析失败:', e.message);
}
```

在生产环境中，建议：

- 不要直接 `JSON.parse` 用户输入或不可信来源的数据。  
- 先做长度限制、字符白名单校验，再解析。  
- 对解析后的数据结构做 schema 校验（如使用 JSON Schema、Zod、Joi 等）。

## JSON 与 JavaScript 对象字面量的区别

很多人会把 JSON 和 JavaScript 对象字面量混淆，它们并不完全相同：[1][3]

- **键的引号**  
  - JS：`{ name: "Alice" }` 合法  
  - JSON：必须写成 `{ "name": "Alice" }`  

- **值的类型**  
  - JS：可以是函数、日期、正则、`undefined` 等  
  - JSON：只能是对象、数组、字符串、数字、布尔、`null`  

- **注释**  
  - JS：支持 `//` 和 `/* */`  
  - JSON：不支持任何注释  

- **引号风格**  
  - JS：字符串可以用单引号或双引号  
  - JSON：只能用双引号  

因此，不能简单地把 JS 对象当作 JSON 直接发给后端，需要使用 `JSON.stringify()` 进行序列化。

## 实战建议：如何在项目中用好 JSON？

1. **接口设计阶段**  
   - 统一响应结构（如 `success` + `data` + `error`）。  
   - 明确日期、时间使用 ISO 8601 字符串。  
   - 避免在 JSON 中返回敏感信息（密钥、内部 ID、调试信息）。

2. **前端处理**  
   - 解析前检查 `Content-Type` 和状态码。  
   - 对大 JSON 做分页或按需加载，避免一次性解析过大数据。  
   - 使用 TypeScript 或 JSON Schema 对接口数据结构做类型约束。

3. **调试与排查**  
   - 遇到 `SyntaxError` 时，先用工具格式化 JSON，再根据提示定位错误行。  
   - 对“看起来像 JSON 的字符串”保持警惕，尤其是从日志、第三方文档复制过来的内容。  

> 如果你经常需要检查和格式化 JSON，可以把我们的 [JSON Formatter & Validator](/tools/json-formatter) 加入书签，快速验证任意 JSON 片段。

## 小结

- JSON 是现代 Web 开发中最基础也最重要的数据格式之一，理解其严格语法能显著减少接口调试时间。[1][2]  
- 常见错误多来自“写得像 JavaScript 对象”，而不是“严格按 JSON 规范”：单引号、多余逗号、注释、非法值等。[1][3]  
- 在真实项目中，要结合接口设计、前端解析、错误处理一起考虑，而不是只停留在“语法层面”。  
- 配合在线 JSON 工具（格式化、校验、压缩）可以大幅提升开发效率，也能为你的站点带来持续的搜索流量和使用场景。