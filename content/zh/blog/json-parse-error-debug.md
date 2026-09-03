---
title: "JSON 解析失败怎么办？接口调试中的 10 个典型错误与排查步骤"
description: "从真实接口调试场景出发，总结 JSON.parse 报错的 10 类典型错误，并给出逐步排查方法与预防建议。"
category: "json_tools"
date: 2026-08-24
lastmod: 2026-09-03
author: "JSON Toolbox Team"
image: "/blog/cover/zh/json-parse-error-debug-cover.svg"
tags: ["JSON", "JSON Editor", "JSON Validator", "API Debugging", "Error Handling", "JSON.parse"]
locales: ["zh-CN", "en"]
promo:
  slug: "json-editor"
  text: "🚀 先检查你的 JSON 是否合法："
  btn: "打开 JSON Editor"
---

<!-- # JSON 解析失败怎么办？接口调试中的 10 个典型错误与排查步骤 -->

在前后端开发中，“JSON 解析失败”几乎是最常见的错误之一：前端调用接口，期望拿到 JSON，结果 `JSON.parse` 抛出异常，控制台一片红。  
这篇文章从真实开发场景出发，总结 **10 类典型 JSON 解析错误**，并给出可操作的排查步骤和预防建议，帮助你快速定位问题、减少调试时间。

> 如果你手边正好有一段”解析失败”的 JSON，可以先把它粘贴到 [JSON Editor](/tools/format/json-editor) 中，自动检查语法并查看错误位置。

## 典型错误信息总览

在不同环境和场景中，你可能会看到类似的报错：

- `SyntaxError: Unexpected token ':' in JSON at position 3`  
- `SyntaxError: Unexpected token '<' in JSON at position 0`  
- `SyntaxError: Unexpected token 'u' in JSON at position 20`  
- `SyntaxError: Unexpected token '/' in JSON at position 2`  
- `JSONParseError: Unexpected end of JSON input`  

这些错误信息的共同点是：  
- 都说明“输入不是合法的 JSON”；  
- 但真正原因可能完全不同：有的是格式错误，有的是接口返回了 HTML，有的是编码问题。

下面按场景分类，逐一拆解。

---

## 场景 1：后端返回了 HTML 错误页（500/404）

### 现象

- 前端调用接口，期望 JSON 响应。  
- 实际状态码是 500/404/503 等，Body 是 HTML 错误页。  
- 前端仍然执行 `JSON.parse(responseText)`，报错：

> `SyntaxError: Unexpected token '<' in JSON at position 0`

### 原因

HTML 通常以 `<!DOCTYPE html>` 或 `<html>` 开头，第一个字符是 `<`，不是合法 JSON。

### 排查步骤

1. 打开浏览器 Network 面板，找到该请求。  
2. 查看 **Status**：是否为 2xx？  
3. 查看 **Response Headers** 中的 `Content-Type`：  
   - 是否为 `application/json`？  
   - 还是 `text/html` / `text/plain`？  
4. 查看 **Response Body**：是否是 HTML 错误页？  

### 解决方式

- 前端在 `JSON.parse` 之前：  
  - 先检查状态码是否为 2xx；  
  - 再检查 `Content-Type` 是否包含 `application/json`。  
- 对非 2xx 响应，优先展示错误信息（例如 `error.message`），而不是尝试解析 JSON。  

---

## 场景 2：Content-Type 不是 `application/json`

### 现象

- 接口返回的内容“看起来像 JSON”，但 `Content-Type` 是 `text/html` 或 `text/plain`。  
- 某些框架/中间件会因此拒绝自动解析，或你在代码中不敢放心 `JSON.parse`。  

### 原因

- 后端框架配置问题（例如默认返回 `text/html`）。  
- 反向代理/网关修改了响应头。  
- 某些错误处理中间件统一返回 `text/html`。  

### 排查步骤

1. 在 Network 面板查看 `Content-Type`。  
2. 对比正常接口与异常接口的响应头差异。  
3. 检查后端代码/配置中是否显式设置了 `Content-Type`。  

### 解决方式

- 后端统一返回 `Content-Type: application/json`，并以 UTF-8 编码输出 body。很多框架也会输出 `application/json; charset=utf-8`；关键是响应 body 必须是合法 JSON，且编码一致。
- 前端对非 `application/json` 的响应，谨慎解析，或先记录日志再处理。

---

## 场景 3：多余逗号 / 单引号 / 注释（“伪 JSON”）

### 现象

- 从日志、文档、聊天工具中复制了一段“看起来像 JSON”的内容。  
- 粘贴到代码或工具中解析，报错：  
  - `Unexpected token ','`  
  - `Unexpected token ':'`  
  - `Unexpected token '/'`  

### 常见错误形式

1. **末尾多余逗号**  
   ```json
   {
     "name": "Alice",
     "age": 30,
   }
   ```
2. **使用单引号**  
   ```json
   {
     'name': 'Alice'
   }
   ```
3. **在 JSON 中写注释**  
   ```json
   {
     // user info
     "name": "Alice"
   }
   ```

### 排查步骤

1. 将原始响应/文本粘贴到 [JSON Editor](/tools/format/json-editor) 中。  
2. 让工具自动格式化并高亮错误位置。  
3. 根据提示修复：去掉多余逗号、改为双引号、删除注释。  

### 解决方式

- 对“从文档/日志复制来的 JSON”，永远先过一次校验工具。  
- 后端日志中如果需要“带注释的配置”，使用 JSONC 或 YAML，并明确标注“非标准 JSON”。

---

## 场景 4：后端返回了“双重序列化”的 JSON 字符串

### 现象

- 接口返回的 Body 是一个字符串，内容是 JSON 的文本表示，例如：  
  ```json
  "{\"key\":\"value\"}"
  ```
- 前端直接 `JSON.parse` 一次后，得到的是字符串，而不是对象；再对这个字符串 `JSON.parse` 才会得到对象。  
- 如果代码逻辑假设“一次 parse 就是对象”，就会出错。

### 原因

- 后端对已经是 JSON 字符串的数据又做了一次 `JSON.stringify`。  
- 或者在日志/消息队列中存储时多包了一层。  

### 排查步骤

1. 在 Network 面板查看原始响应：  
   - 是否以 `"` 开头和结尾？  
   - 内部是否有大量 `\"`？  
2. 在控制台执行：  
   ```js
   const once = JSON.parse(text);
   console.log(typeof once, once);
   ```
   - 如果 `typeof once === 'string'`，说明是双重序列化。  

### 解决方式

- 后端避免对已经是 JSON 字符串的数据再次 `JSON.stringify`。  
- 前端如果必须兼容这种接口，先解析外层，再显式验证结果是字符串后才二次解析。不要对所有响应都盲目调用两次 `JSON.parse`——应从源头修复接口约定：  
  ```ts
  export function parsePossiblyDoubleEncodedJson(text: string): unknown {
    const first = JSON.parse(text)
    if (typeof first !== 'string') {
      return first
    }
    return JSON.parse(first)
  }
  ```
  仅在接口约定明确文档化了双重编码时使用此方法。否则应将其视为后端契约 bug。

---

## 场景 5：大 JSON 导致超时 / 内存问题

大 JSON 通常是合法的。失败往往是性能、内存或传输问题，而不是 JSON 语法错误。

### 现象

- 接口返回非常大的 JSON（几 MB 甚至几十 MB）。  
- 前端执行 `JSON.parse` 时：  
  - 页面卡顿甚至崩溃；  
  - 或在某些环境中报 `Out of memory` / `Invalid argument` 等错误。  

### 原因

- 一次性解析超大 JSON 对主线程和内存压力很大。  
- 某些环境（如旧浏览器、低配设备）对单次 `JSON.parse` 的大小有限制。  

### 排查步骤

1. 查看响应大小（Network 面板中的 `Size` / `Transferred`）。  
2. 尝试在本地用工具打开该 JSON 文件，看是否同样卡顿。  

### 解决方式

- 后端：  
  - 对大列表使用分页或游标分页；  
  - 只返回必要字段，减少冗余。  
- 前端：  
  - 对大 JSON 做懒加载/虚拟列表；  
  - 如可能，使用流式解析（Node.js 中可用 stream + JSON stream 解析库）。  

---

## 场景 6：编码问题（非 UTF-8、BOM 头等）

### 现象

- 接口返回的文本在某些环境下解析失败，报错信息含糊。  
- 在文本编辑器中打开，发现文件带有 BOM 头（`EF BB BF`）或编码不是 UTF-8。  

### 原因

- 某些后端/代理在输出时使用了带 BOM 的 UTF-8 或其他编码。  
- 在系统间交换的 JSON 必须使用 UTF-8 编码。生产端不得添加字节序标记（BOM）；解析端可以选择忽略 BOM，但不能依赖所有解析器都容忍它。  

### 排查步骤

1. 将响应保存为文件，用支持编码查看的编辑器打开（如 VS Code、Notepad++）。  
2. 检查是否有 BOM 头，或编码是否为 UTF-8。  

### 解决方式

- 后端统一使用无 BOM 的 UTF-8 输出 JSON。  
- 在网关/代理层确保不额外添加 BOM 或改变编码。  
- 在浏览器 Fetch 场景中，解码链会处理部分 BOM 情况，但真正问题可能是：服务器输出了非 UTF-8、文件内容以 `U+FEFF` 进入 JavaScript 字符串、代理/转码层破坏了字节、JSON 字符串内有未转义控制字符、或文本被错误解码。不要把所有"模糊 parse error"都归因于 BOM。

---

## 场景 7：截断的 JSON（网络中断/超时）

### 现象

- 接口在传输过程中被中断，响应不完整。  
- 报错类似：  
  > `SyntaxError: Unexpected end of JSON input`  

### 原因

- 网络不稳定、超时、代理中断等导致 JSON 被截断。  

### 排查步骤

1. 查看 Network 面板中该请求的状态：  
   - 是否显示 `(failed)`、`timeout`、`aborted` 等？  
2. 查看响应内容是否明显截断（例如最后一个字符不是 `}` 或 `]`）。  

### 解决方式

- 前端增加重试逻辑（尤其是移动端/不稳定网络）。  
- 后端/运维侧优化超时设置和重试策略。  

---

## 场景 8：混入额外文本（前后缀垃圾数据）

### 现象

- 响应前后被加上了额外文本，例如：  
  ```text
  Data: {"key":"value"}
  ```
  或  
  ```text
  {"key":"value"}---END---
  ```
- 直接 `JSON.parse` 整个字符串会失败。  

### 原因

- 某些旧系统/调试逻辑在响应前后拼接了额外信息。  
- 日志/代理层添加了前缀/后缀。  

### 排查步骤

1. 在 Network 面板查看完整响应文本。  
2. 确认是否前后有多余字符。  

### 解决方式

- 尽量从源头修复，保证响应是”纯 JSON”。  
- **不要在生产环境中用正则从混合响应中提取任意 JSON。** JSON 是嵌套结构，字符串中可以包含花括号，简单的正则表达式无法可靠识别目标 JSON 值。问题包括：顶层可能是数组 `[]`、字符串字段内可能有 `{` 或 `}`、文本中可能有多个 JSON 片段、贪婪匹配可能吞掉不属于 JSON 的内容、以及掩盖协议层应修复的问题。  
- 可靠的替代方案：  
  1. 修复 API，使响应 body 始终为纯 JSON。  
  2. 为不同内容类型设计不同的 endpoint。  
  3. 如果协议采用已知的包装格式（SSE、NDJSON、JSONP 或特定日志格式），使用对应的 parser。  
  4. 临时排查时，将原始内容复制到 [JSON Editor](/tools/format/json-editor) 中，人工找出 JSON 边界。  
  5. 在代码中记录有限的、脱敏的响应片段，不要盲目猜测 JSON 边界。

---

## 场景 9：后端返回了“半 JSON 半文本”的混合内容

### 现象

- 响应前半部分是 JSON，后半部分是纯文本或 HTML。  
- 例如：  
  ```text
  {"success":true}
  <script>...</script>
  ```
- `JSON.parse` 只能处理纯 JSON，遇到后面部分就报错。  

### 原因

- 错误处理逻辑在输出 JSON 后又输出了 HTML/脚本。  
- 某些框架在异常时会追加调试信息。  

### 排查步骤

1. 查看完整响应文本，确认是否在 JSON 之后还有内容。  
2. 检查后端日志，看是否有异常堆栈被输出到响应中。  

### 解决方式

- 后端确保每个响应要么是纯 JSON，要么是纯 HTML，不要混用。  
- 对错误响应，统一使用 JSON 结构（如 `error` 字段），不再追加 HTML。

---

## 场景 10：用户输入或第三方数据未校验就 `JSON.parse`

### 现象

- 前端/后端直接对用户输入、第三方 Webhook、消息队列中的数据调用 `JSON.parse`。  
- 一旦数据不合法，就导致异常，甚至影响整个请求处理流程。  

### 原因

- 缺少前置校验：长度、字符集、结构等。  
- 假设“对方一定会发合法 JSON”。  

### 排查步骤

1. 检查代码中所有 `JSON.parse` 调用点：  
   - 数据来源是否可信？  
   - 是否有 `try...catch` 包裹？  
2. 对报错的输入样本，粘贴到 [JSON Editor](/tools/format/json-editor) 中查看具体错误。  

### 解决方式

- 对所有外部输入：  
  - 在解析前设置合理的字节大小限制（例如最大 1MB）。  
  - 以 UTF-8 解码输入。  
  - 在平台暴露解码错误时，拒绝编码格式不正确的输入。  
  - 用 `try...catch` 包裹 `JSON.parse`。  
  - 用 schema 或业务规则校验解析后的值。  
  - 避免记录完整的不可信 payload，特别是可能包含敏感信息的内容。  
- JSON 允许 Unicode 字符串——不要限制为"可打印 ASCII"，否则会拒绝合法的国际化数据，如 `"São Paulo"` 或 `"日本語"`。

文本能解析后，语法校验只是第一步。在应用中接受数据之前，用 [JSON Schema 校验来检查必填字段、数据类型和允许值](/blog/json-validation-syntax-vs-schema)。

---

## 排查步骤清单（可收藏）

遇到“JSON 解析失败”时，可以按以下顺序快速排查：

1. **看状态码**：是否为 2xx？  
2. **看 Content-Type**：是否为 `application/json`？  
3. **看响应内容**：  
   - 是纯 JSON，还是 HTML/文本？  
   - 是否前后有多余字符？  
4. **看大小**：是否异常大（几 MB 以上）？  
5. **用工具校验**：  
   - 将响应粘贴到 [JSON Editor](/tools/format/json-editor) 中，自动检查语法错误。  
6. **看编码**：是否有 BOM 头或非 UTF-8 编码？  
7. **看日志**：后端是否有异常堆栈输出到响应中？  
8. **看代码**：  
   - `JSON.parse` 是否有 `try...catch`？  
   - 是否对非 2xx 响应也尝试解析？  

---

## 如何预防 JSON 解析失败？

1. **统一接口规范**  
   - 成功响应：`{ "success": true, "data": {...} }`  
   - 错误响应：`{ "success": false, "error": { "code": "...", "message": "..." } }`  
   - 所有响应均为纯 JSON，无额外文本。  

2. **前端统一解析逻辑**  
   - 封装一个 `fetchJson` 工具函数：  
     - 检查状态码  
     - 检查 `Content-Type`  
     - 再 `JSON.parse`  
   - 所有接口调用都通过这个函数，减少重复错误。  

3. **日志与监控**  
   - 对解析失败的请求，记录：  
     - 状态码  
     - Content-Type  
     - 响应前 1KB（脱敏后）  
   - 便于后续定位是后端问题还是网络问题。  

4. **善用工具**  
   - 开发阶段：  
     - 用 [JSON Editor](/tools/format/json-editor) 快速校验接口返回的 JSON。  
     - 对复杂结构，先格式化再阅读。  
   - 生产问题排查：  
     - 将问题样本粘贴到编辑器中，快速定位错误位置。  

---

## 小结

- “JSON 解析失败”背后可能有多种原因：HTML 错误页、格式错误、编码问题、截断、双重序列化等。  
- 通过系统的排查步骤（状态码 → Content-Type → 响应内容 → 工具校验），可以大幅缩短调试时间。  
- 从长远看，统一接口规范、封装解析逻辑、善用校验工具，是减少这类问题的关键。  

> 下次遇到 JSON 解析报错时，可以先将响应粘贴到 [JSON Editor](/tools/format/json-editor) 中，快速确认是否是语法问题，再决定是前端处理还是找后端排查。

## 下一步

- 文本能解析后，语法校验只是第一层。了解如何使用 [JSON Schema 校验来检查数据结构、必填字段和数据类型](/blog/json-validation-syntax-vs-schema)。
- 如果需要 JSON 结构和语法规则的基础 overview，请参阅 [JSON 是什么？](/blog/what-is-json)。
- 关于接口设计模式和响应结构的最佳实践，请参阅 [JSON 最佳实践](/blog/json-best-practices)。