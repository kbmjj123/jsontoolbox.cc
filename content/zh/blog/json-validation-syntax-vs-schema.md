---
title: "JSON 校验详解：语法校验、JSON Schema 与业务规则的区别"
description: "了解 JSON 语法校验、JSON Schema 结构校验与业务规则校验的区别，并通过 JavaScript 示例构建更可靠的 API 数据校验流程。"
h1: "JSON 校验详解：语法校验、JSON Schema 与业务规则的区别"
category: "json_tools"
date: 2026-09-03
lastmod: 2026-09-03
image: "/images/blog/zh/json-validation-syntax-vs-schema-cover.svg"
tags:
  - "JSON"
  - "JSON 校验"
  - "JSON Schema"
  - "JavaScript"
  - "API 校验"
  - "数据校验"
author: "JSON Toolbox Team"
promo:
  slug: "json-schema-validator"
  text: "先检查 JSON 语法是否正确："
  btn: "打开 JSON 校验工具"
locales:
  - "zh"
  - "en"
---

# JSON 校验详解：语法校验、JSON Schema 与业务规则的区别

很多开发者会把"JSON 能被 `JSON.parse()` 解析"理解成"JSON 数据已经有效"。但在真实接口开发中，这两件事并不相同。

一段文本能够被解析，只能说明它符合 JSON 的**语法规则**。它仍可能缺少必填字段、字段类型不正确、包含不允许的值，或者在当前业务场景中根本不能被系统接受。

例如，下面这段内容是合法 JSON：

```json
{
  "email": "not-an-email",
  "age": -3,
  "role": "superadmin",
  "marketingOptIn": "yes",
  "debug": true
}
```

但它很可能不符合"创建用户"接口的要求：

- `email` 不符合预期格式；
- `age` 不应该是负数；
- `role` 不一定允许 `superadmin`；
- `marketingOptIn` 应该是布尔值，而不是字符串；
- `debug` 可能是接口不允许接收的额外字段。

JSON 校验通常至少包括三个层次：

1. **语法校验**：这段文本是否为合法 JSON？
2. **结构校验**：字段、类型、范围和嵌套结构是否符合接口契约？
3. **业务规则校验**：即使结构正确，当前业务是否允许这份数据？

如果你的代码在 `JSON.parse()` 阶段就报错，可以先阅读 [JSON 解析失败：10 个常见 API 错误与排查方法](/blog/json-parse-error-debug)。

> 想先确认一段文本是否为合法 JSON，可以使用 [JSON Schema 校验器](/tools/format/json-schema-validator) 检查语法错误位置。

## JSON 校验不是单一步骤

下面这张表可以快速区分三种常见校验。

| 校验层级 | 核心问题 | 常见实现方式 | 常见失败示例 |
|---|---|---|---|
| 语法校验 | 文本能否被解析为 JSON？ | `JSON.parse()`、JSON Validator | 尾逗号、单引号、注释、缺少括号 |
| Schema 结构校验 | 数据是否符合预期字段、类型与约束？ | JSON Schema、Ajv、Zod | 缺少必填字段、类型错误、枚举值不合法 |
| 业务规则校验 | 当前系统是否允许接受这份数据？ | 服务端业务逻辑、权限系统、数据库查询 | 邮箱已注册、没有资源权限、库存不足 |

这三层应按顺序执行：

```text
原始文本
→ JSON 语法校验
→ JSON Schema 结构校验
→ 业务规则校验
→ 执行业务逻辑
```

不要跳过前两层，直接假设客户端或第三方系统传来的数据可信。

## 第一层：JSON 语法校验

语法校验解决的问题最基础：

```text
这段文本是不是符合 JSON 语法？
```

JavaScript 中最常用的方法是 `JSON.parse()`。

```ts
export type JsonSyntaxResult =
  | {
      valid: true
      value: unknown
    }
  | {
      valid: false
      error: string
    }

export function parseJsonSafely(text: string): JsonSyntaxResult {
  try {
    return {
      valid: true,
      value: JSON.parse(text)
    }
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : "无效 JSON"
    }
  }
}
```

如果输入不符合 JSON grammar，`JSON.parse()` 会抛出 `SyntaxError`。常见问题包括尾逗号、使用单引号、对象键未加双引号、注释、未闭合的对象或数组等。

### 常见的无效 JSON

#### 1. 尾逗号

```json
{
  "name": "Ada",
  "age": 36,
}
```

#### 2. 单引号

```json
{
  "name": "Ada"
}
```

#### 3. 注释

```json
{
  "name": "Ada"
}
```

#### 4. 未加引号的对象键

```json
{
  name: "Ada"
}
```

这些写法在 JavaScript 对象字面量、JSONC 或某些配置格式中可能可以出现，但它们不是标准 JSON。

> 如果只是想快速查看缩进、括号和嵌套结构，可以先使用 [JSON Editor](/tools/format/json-editor) 格式化合法 JSON；如果内容本身无法解析，应先使用 [JSON Schema 校验器](/tools/format/json-schema-validator) 定位语法问题。

### `JSON.parse()` 没有检查什么？

下面这些内容即使解析成功，`JSON.parse()` 也不会判断它们是否符合接口要求：

- 是否缺少 `email`、`id`、`name` 等必填字段；
- `age` 是否应该为非负整数；
- `role` 是否只能是 `user`、`editor` 或 `admin`；
- `email` 是否符合邮箱格式；
- 是否出现了接口未声明的额外字段；
- 当前用户是否有权限提交这份数据；
- 数据库中是否已经存在相同邮箱。

因此，`JSON.parse()` 成功只是校验的起点，不是终点。

## 第二层：JSON Schema 结构校验

JSON Schema 是一种声明 JSON 数据结构、类型和约束的规则语言。它可以描述"一个合法请求体应该长什么样"，并让校验器根据这些规则检查输入。

例如，一个创建用户接口可能希望接收：

```json
{
  "email": "ada@example.com",
  "age": 36,
  "role": "editor",
  "marketingOptIn": true
}
```

对应的 JSON Schema 可以写成：

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "additionalProperties": false,
  "required": ["email", "age", "role", "marketingOptIn"],
  "properties": {
    "email": {
      "type": "string",
      "format": "email"
    },
    "age": {
      "type": "integer",
      "minimum": 0,
      "maximum": 150
    },
    "role": {
      "type": "string",
      "enum": ["user", "editor", "admin"]
    },
    "marketingOptIn": {
      "type": "boolean"
    }
  }
}
```

[JSON Schema](https://json-schema.org/docs) 用于声明与验证 JSON 的结构、类型和约束。

### 关键字段说明

| Schema 关键字 | 作用 | 示例 |
|---|---|---|
| `type` | 限制值的数据类型 | `"type": "object"` |
| `properties` | 定义对象中已知字段的校验规则 | `"email": { "type": "string" }` |
| `required` | 声明哪些字段必须存在 | `["email", "age"]` |
| `enum` | 限制字段只能取指定值之一 | `["user", "editor", "admin"]` |
| `minimum` / `maximum` | 限制数字范围 | `"minimum": 0` |
| `items` | 定义数组元素的校验规则 | `"items": { "type": "string" }` |
| `additionalProperties` | 是否允许未声明的额外字段 | `false` |

有两个常见误解需要特别注意：

1. `properties` 中出现字段，并不表示字段自动必填；必须通过 `required` 单独声明。
2. 默认情况下，JSON Schema 允许额外字段。只有显式设置 `"additionalProperties": false`，才会拒绝未被 [properties](https://json-schema.org/understanding-json-schema/reference/object) 或 `patternProperties` 声明的属性。

### `format: "email"` 不一定总会强制校验

很多 Schema 示例会写：

```json
{
  "type": "string",
  "format": "email"
}
```

但不要假设所有 JSON Schema 校验器都会自动把它当成严格错误。

`format` 的具体执行方式取决于你使用的校验器和配置。例如 [Ajv](https://ajv.js.org/api.html) 从 v7 开始不再默认内置常见 format 校验，需要通过 [`ajv-formats`](https://ajv.js.org/guide/formats.html) 提供 `email`、`date-time`、`uri` 等格式支持。

因此，生产环境中应确认：

- 你使用的是哪一个 JSON Schema draft；
- 所使用的 validator 是否启用了 format 校验；
- `format` 是 annotation、warning，还是会直接导致校验失败；
- 邮箱、URL、日期等规则是否需要更严格的业务层验证。

你可以把上面的 Schema 和请求体粘贴到 [JSON Schema 校验器](/tools/format/json-schema-validator) 中，实际查看校验结果。

## 第三层：业务规则校验

即使输入是合法 JSON，也通过了 JSON Schema，它仍然可能无法在当前系统中执行。

例如：

```json
{
  "email": "ada@example.com",
  "age": 36,
  "role": "editor",
  "marketingOptIn": true
}
```

结构完全正确，但服务端仍然可能拒绝它，因为：

- `ada@example.com` 已被其他账户使用；
- 当前管理员无权创建 `editor` 角色；
- 当前租户不允许新增用户；
- 用户数量已达到套餐上限；
- 关联组织不存在或已停用；
- 请求中的资源 ID 不属于当前用户。

这类规则依赖数据库、权限、租户上下文、库存、时间、状态机或第三方服务结果，通常不能仅凭 JSON Schema 静态判断。

因此，一个可靠的 API 校验流程通常应当是：

```text
1. 限制请求体大小
2. 解析 JSON
3. 校验 Schema
4. 检查权限、资源状态和业务规则
5. 执行业务逻辑
6. 返回结构化响应
```

## 如何在 JavaScript 中校验 JSON

### 只检查 JSON 语法

如果你的目标只是判断文本能否被解析，使用 `JSON.parse()` 和 `try...catch` 即可：

```ts
export function isValidJson(text: string): boolean {
  try {
    JSON.parse(text)
    return true
  } catch {
    return false
  }
}
```

但在应用代码中，通常更建议保留错误信息，而不是只返回 `true` 或 `false`。

### 使用 Ajv 进行 JSON Schema 校验

[Ajv](https://ajv.js.org/api.html) 是 JavaScript 生态中常用的 JSON Schema validator，支持多个 JSON Schema draft，并将 Schema 编译为可复用的校验函数。

安装依赖：

```bash
npm install ajv ajv-formats
```

定义并编译 Schema：

```ts
import Ajv from "ajv"
import addFormats from "ajv-formats"

const ajv = new Ajv({
  allErrors: true,
  strict: true
})

addFormats(ajv)

const createUserSchema = {
  type: "object",
  additionalProperties: false,
  required: ["email", "age", "role", "marketingOptIn"],
  properties: {
    email: {
      type: "string",
      format: "email"
    },
    age: {
      type: "integer",
      minimum: 0,
      maximum: 150
    },
    role: {
      type: "string",
      enum: ["user", "editor", "admin"]
    },
    marketingOptIn: {
      type: "boolean"
    }
  }
} as const

const validateCreateUser = ajv.compile(createUserSchema)

export function validateCreateUserPayload(value: unknown) {
  const valid = validateCreateUser(value)

  return {
    valid: Boolean(valid),
    errors: validateCreateUser.errors ?? []
  }
}
```

将语法校验和 Schema 校验组合起来：

```ts
export function validateIncomingUserJson(text: string) {
  const parsed = parseJsonSafely(text)

  if (!parsed.valid) {
    return {
      ok: false as const,
      stage: "syntax" as const,
      errors: [parsed.error]
    }
  }

  const schemaResult = validateCreateUserPayload(parsed.value)

  if (!schemaResult.valid) {
    return {
      ok: false as const,
      stage: "schema" as const,
      errors: schemaResult.errors
    }
  }

  return {
    ok: true as const,
    value: parsed.value
  }
}
```

这段流程仍然没有完成业务规则校验。通过 Schema 后，服务端仍应继续检查权限、唯一性和资源状态。

## API 应如何返回校验错误？

对调用方而言，能看懂错误比只收到一个泛泛的 `400 Bad Request` 更有帮助。

### JSON 语法错误

许多 API 会将无法解析的请求体视为 `400 Bad Request`：

```json
{
  "error": {
    "code": "INVALID_JSON",
    "message": "请求体不是合法的 JSON。"
  }
}
```

### Schema 结构错误

很多团队会对"JSON 可解析但不符合请求契约"的情况使用 `422 Unprocessable Content`，也有团队统一使用 `400`。没有一种状态码适合所有 API；更重要的是在整个 API 中保持一致，并在文档中说明规则。

```json
{
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "请求数据不符合预期的 Schema。",
    "fields": [
      {
        "path": "/email",
        "message": "必须匹配 email 格式"
      },
      {
        "path": "/age",
        "message": "必须 >= 0"
      },
      {
        "path": "/marketingOptIn",
        "message": "必须是布尔值"
      }
    ]
  }
}
```

### 业务规则错误

对于资源冲突或当前状态不允许操作的情况，可以返回更明确的业务错误：

```json
{
  "error": {
    "code": "EMAIL_ALREADY_EXISTS",
    "message": "该邮箱地址已被注册。"
  }
}
```

不要在错误响应中暴露密码、访问令牌、数据库连接串、完整第三方响应、内部堆栈或其他敏感信息。

## 常见 JSON 校验误区

### 误区 1：`JSON.parse()` 成功等于接口数据有效

`JSON.parse()` 只解决语法问题。它不会验证必填字段、类型、枚举值、数值范围或业务规则。

### 误区 2：只看 `Content-Type`

`Content-Type: application/json` 说明服务端声称响应是 JSON，但不保证 body 一定能被解析，也不保证解析后的数据符合预期结构。

如果 API 响应在 `JSON.parse()` 阶段失败，可以先阅读 [JSON 解析失败：10 个常见 API 错误与排查方法](/blog/json-parse-error-debug)。

### 误区 3：没有明确处理额外字段

如果接口只应接受固定字段，应考虑：

```json
{
  "additionalProperties": false
}
```

但这并非所有 API 都适合。对于需要向前兼容、允许客户端传递扩展字段，或使用动态字段映射的接口，拒绝所有额外字段可能会过于严格。

### 误区 4：自动类型转换，却没有记录规则

例如：

```text
"age": "36"
```

有的框架或工具会把它自动转换为数字 `36`，有的则直接校验失败。

自动转换可以改善部分表单体验，但也会让接口契约变模糊。若要启用，必须写入 API 文档并在前后端保持一致；对于安全、财务或关键业务字段，通常应更严格。

### 误区 5：只在前端校验

前端校验可以快速提示用户，但不能作为信任边界：

- 客户端 JavaScript 可以被绕过；
- API 可以被脚本、curl、Postman 或其他客户端直接调用；
- 请求可能来自旧版本应用；
- 攻击者可以构造任意请求体。

因此，后端必须重新校验所有不可信输入。

### 误区 6：将完整无效请求体写入日志

排查问题时记录上下文很重要，但完整 payload 可能包含邮箱、电话、地址、Cookie、Authorization header、API Key 或其他隐私数据。

建议：

- 限制日志长度；
- 对 token、密码、邮箱等字段脱敏；
- 只记录必要的错误路径和请求 ID；
- 为敏感数据设置更严格的访问控制与保留策略。

## 一个实用的 API 校验流程

下面是一个适合大多数 JSON API 的基本流程：

```text
接收请求
→ 限制 body 大小
→ 以 UTF-8 解码请求体
→ 尝试解析 JSON
→ 返回语法错误，或继续
→ 用 Schema 校验数据结构
→ 返回字段级错误，或继续
→ 执行业务与权限校验
→ 返回业务错误，或继续
→ 执行业务操作并返回成功响应
```

如果请求数据很复杂，可以先用 [JSON Editor](/tools/format/json-editor) 整理结构，再用 [JSONPath 测试工具](/tools/format/json-path-tester) 检查嵌套字段和数组层级。

## 常见问题

### `JSON.parse()` 能校验 JSON Schema 吗？

不能。`JSON.parse()` 只将符合 JSON 语法的字符串转换为 JavaScript 值，不会验证必填字段、字段类型、允许值、数据范围或额外字段。

### 合法 JSON 一定能被 API 接受吗？

不一定。它可能语法正确，但缺少字段、类型不对、数值超范围、枚举值不允许，或者不符合权限、唯一性、库存和资源状态等业务规则。

### `format: "email"` 一定会校验邮箱吗？

不一定。是否强制校验取决于 JSON Schema validator 及其配置。以 [Ajv](https://ajv.js.org/api.html) 为例，常见 formats 由 [`ajv-formats`](https://ajv.js.org/guide/formats.html) 提供，因此应确认项目已经正确注册对应插件。

### 前端和后端都需要校验 JSON 吗？

建议两端都做，但职责不同。前端校验主要改善交互体验，帮助用户更早发现问题；后端校验负责安全和数据完整性，必须始终执行。

### JSON Schema 和 TypeScript 有什么区别？

TypeScript 类型主要帮助开发阶段的静态检查，通常在编译后不会自动校验运行时传入的数据。JSON Schema 描述的是运行时数据应满足的结构与约束，可用于验证 HTTP 请求、Webhook、配置文件和第三方 API 数据。

## 总结

JSON 校验不是单一的"能否解析"检查：

1. **语法校验**：确认文本是否为合法 JSON；
2. **Schema 校验**：确认字段、类型、约束和嵌套结构是否符合接口契约；
3. **业务规则校验**：确认数据在当前权限、资源和系统状态下是否可被接受。

`JSON.parse()` 成功只是第一步。对于 API、Webhook、配置文件和第三方输入，应该将语法、Schema 和业务规则校验组合起来，并在后端重新执行关键校验。

> 想快速确认一段文本是否为合法 JSON，可以先使用 [JSON Schema 校验器](/tools/format/json-schema-validator)。如果错误发生在 API 响应解析阶段，查看 [JSON 解析失败：10 个常见 API 错误与排查方法](/blog/json-parse-error-debug)。

## 下一步

- **已有解析失败的 JSON？** 先看[接口调试中的 10 个典型 JSON 错误](/blog/json-parse-error-debug)，找到并修复语法错误。
- **需要用 Schema 校验 JSON？** 用 [JSON Schema 校验器](/tools/format/json-schema-validator) 把数据和 Schema 分别粘贴，查看校验结果。
- **想查看复杂 JSON 的结构？** [用交互式树形视图浏览 JSON](/tools/format/json-path-tester)，探索嵌套字段。
- **从零构建 API？** 看我们的 [JSON 最佳实践](/blog/json-best-practices) 指南，涵盖错误处理、校验和响应设计。

---

*JSON Toolbox 的所有工具完全在浏览器中运行，数据不会离开你的设备。*
