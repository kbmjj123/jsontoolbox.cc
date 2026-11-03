---
title: "JSON 里能写注释吗？为什么不行，以及 4 种能用的替代办法"
description: "标准 JSON 没有注释语法，加了就是非法文件。讲清原因、各语言解析器的报错形态、_comment 键的坑，以及 JSONC / JSON5 / HJSON 怎么选，怎么把 JSONC 安全转成标准 JSON。"
h1: "JSON 里能写注释吗？"
category: "json_tools"
date: 2026-11-03
lastmod: 2026-11-03
image: "/blog/cover/zh/json-comments-cover.svg"
tags: ["JSON", "JSONC", "JSON5", "配置文件", "最佳实践"]
author: "JSON Toolbox Team"
promo:
  slug: "jsonc-to-json"
  text: "要去掉注释、拿到标准 JSON："
  btn: "打开 JSONC 转 JSON"
locales: ["zh-CN", "en"]
---

不能。标准 JSON 没有注释语法，`//`、`/* */`、`#` 三种都不行，写了这个文件的其余部分再正确也不是合法 JSON。

这不是某个解析器的脾气问题。两份现行规范里都没有注释这个记号：[RFC 8259](https://www.rfc-editor.org/rfc/rfc8259) 和 [ECMA-404](https://www.ecma-international.org/publications-and-standards/standards/ecma-404/)。下面这段是最常见的写法，也是最典型的非法 JSON：

```jsonc
{
  // 界面上显示的名字
  "name": "Ada",
  "age": 30
}
```

`JSON.parse()` 会直接抛错。所以真正要解决的不是「怎么写注释」，而是「哪里能写、哪里不能写、以及已经写了怎么清掉」。

## 加了注释之后，各语言怎么报错

同一份文件，不同解析器的报错长得完全不一样，但结局一致：拒绝。

| 解析器 | 结果 |
|---|---|
| `JSON.parse()`（Node 18 及更早） | `SyntaxError: Unexpected token / in JSON at position 4` |
| `JSON.parse()`（Node 20 起，新版 V8） | 报错里会带上出错位置附近的原文，形如 `Unexpected token '/', "{" ... is not valid JSON` |
| Python `json.loads()` | `json.decoder.JSONDecodeError: Expecting property name enclosed in double quotes` |
| Java Jackson | `JsonParseException`，提示遇到非法字符 `/`（`ALLOW_COMMENTS` 默认关闭） |
| `jq` | `parse error: Invalid literal` |
| npm 读 `package.json` | `npm ERR! JSON.parse Failed to parse json` |

报错信息里那个 position / column 指的是文件里的字符位置，不是你写的第几行注释。注释一旦进去，文件在规范意义上就不再是 JSON 了：按你额外用了哪种语法，它变成 JSONC、JSON5、HJSON，或者一个没有名字的自定义变体——只有对应变体的解析器能读它。

如果报错不是注释引起的，先去看 [JSON 解析失败：10 个常见 API 错误与排查方法](/blog/json-parse-error-debug)，那里逐条对着报错信息拆。

## 为什么规范里不要注释

JSON 是**数据交换格式**，不是配置语言，也不是编程语言。

Douglas Crockford 在早期草案里是有注释的，后来删掉了。他给出的理由是：有人开始把解析指令写进注释里——这些指令会改变文档该怎么被解释。于是同一个文件在不同实现里读出来的含义不一样，共享格式的意义就没了。删掉注释，歧义也就没了。

代价很清楚：格式好写、好解析、跨语言一致；代价是 JSON 文件没法就地写说明。这也是为什么「JSON 支持注释」常年排在最想要的功能第一位，而所有答案都是绕路或者换格式。

## 文件必须保持标准 JSON 时的两种做法

场景很常见：`package.json` 要交给 npm，配置要交给只认 `application/json` 的接口，数据要交给后端同事写的 Python 脚本。这些地方注释一律不能进。

### 办法一：留一个注释键

约定一个键专门放说明，值就是你的注释：

```json
{
  "_comment": "埋点事件结构，版本单独维护，跟 API 版本无关",
  "version": "1.2.0",
  "fields": [
    {
      "name": "user_id",
      "type": "string",
      "_comment": "主键，单个租户内唯一"
    }
  ]
}
```

常用的键名有 `_comment`、`__comment__`、`//`、`description`、`doc`。文件保持合法，`JSON.parse` 照常工作，注释还能跟着数据一起走——做示例报文、自描述 schema 时挺顺手。

坑也在这：注释变成了数据的一部分。

- 遍历键的代码会看见它。`Object.keys()`、模板渲染、字段映射全都多一个 `_comment`。
- 消费方必须主动忽略。拿 Java 说：原生 `ObjectMapper` 的 `FAIL_ON_UNKNOWN_PROPERTIES` 默认是开的，一个没人认识的 `_comment` 会抛 `UnrecognizedPropertyException`。Spring Boot 默认把它关了，所以很多人从没见过这个错，直到哪天在别的地方用了原生 ObjectMapper。Gson 和 fastjson 默认忽略未知字段，不会报错，但字段会留在对象外面。
- 如果这个 JSON 是从接口出去的，`_comment` 也一起发给客户端，日志里多一堆噪音。
- Schema 里写了 `additionalProperties: false` 的话，一个没声明的 `_comment` 直接校验失败。

适合测试夹具、示例报文、schema 一类的文档。不适合量大、在意体积的报文，也不适合会被严格反序列化的数据。

### 办法二：说明写在文件外面

`config.json` 保持严格，说明放 README、JSON Schema 或者文档站里。

运行时文件最小、永远合法；说明可以是 Markdown，能写例子、能画图、能记变更历史。代价是说明和数据容易走散，除非有东西强制它们同步。

对外接口和共享数据管道基本都该走这条路。最强版本是 [JSON Schema](https://json-schema.org/docs)：必填字段、类型、范围写清楚，还能机器校验。两层校验怎么分工，见 [JSON 校验讲清楚：语法校验和 JSON Schema 校验不是一回事](/blog/json-validation-syntax-vs-schema)。

## 真要写注释，就换成这三种格式

| | JSON（RFC 8259） | JSONC | JSON5 | HJSON |
|---|---|---|---|---|
| `//` 注释 | 不支持 | 支持 | 支持 | 支持 |
| `/* */` 注释 | 不支持 | 支持 | 支持 | 支持 |
| `#` 注释 | 不支持 | 不支持 | 不支持 | 支持 |
| 尾随逗号 | 不支持 | 看解析器 | 支持 | 逗号本就可省 |
| 键不加引号 | 不支持 | 不支持 | 支持 | 支持 |
| 单引号字符串 | 不支持 | 不支持 | 支持 | 支持 |
| 十六进制、`NaN`、`Infinity` | 不支持 | 不支持 | 支持 | 部分 |
| 有没有规范 | RFC 8259 / ECMA-404 | 没有，约定俗成 | [json5.org](https://json5.org/) | [hjson.github.io](https://hjson.github.io/) |
| 主要用途 | 接口、数据文件 | 编辑器配置 | 手写配置 | 小众配置 |

**JSONC** 是离标准 JSON 最近的一步：只加 `//` 和 `/* */`，键仍然要引号，字符串仍然双引号，数字仍然按 JSON 语法。没有正式规范，「JSONC」只是工具间的一个说法；尾随逗号不算它的定义，但不少解析器顺手也吃了。

```jsonc
{
  // 和 CI 里的部署目标保持一致
  "region": "eu-central-1",
  /* 调这个值时要一起调网关超时 */
  "timeoutMs": 30000
}
```

**JSON5** 走得远得多，瞄准手写：不加引号的键、单引号字符串、尾随逗号、十六进制、`NaN`、`Infinity`、字符串续行。

```json5
{
  // JSON5 里的用户配置
  name: 'Ada',
  age: 30,
  roles: [
    'admin',
    'editor', // 尾随逗号没问题
  ],
}
```

写得舒服，也是离标准 JSON 最远的。任何只认标准 JSON 的东西都不保证能读 JSON5。

**HJSON** 往「人读着舒服」走得更远（`#` 注释、引号基本可省、逗号可省），生态是三个里最小的，多出现在小众配置工具里。

选哪个：只是想要注释就用 JSONC，它离标准 JSON 只差一次「删注释」。还要 JS 那种写法就用 JSON5。HJSON 只在你确实想要它那套可读性规则时才用。

## 为什么 VS Code 的 settings.json 能写注释

因为读它的那一端同意了。

VS Code 把 `settings.json`、`keybindings.json` 这类文件当 **JSON with Comments** 处理：打开状态栏的语言模式，显示的不是 JSON，而是 JSON with Comments。TypeScript 对 `tsconfig.json` 也是同理，所以注释和尾随逗号在那儿都能过。

容易混淆的是名字：扩展名是 `.json`，文档里写的是「JSON」，注释却能用。把这同一份内容复制到任何严格解析器里，立刻报错。

规律就一句话：**注释是读取方的属性，不是文件的属性。** 带注释的文件能不能解析，取决于对面那个工具同不同意。

## 删注释为什么不能用正则

总有一天 JSONC 要变回标准 JSON：CI 里某个工具不接受注释、请求体要发 `application/json`、某个库只收严格 JSON。这时候最容易想到的一行代码是正则，把 `//…` 和 `/*…*/` 删掉。

它能过掉大部分文件，然后在下面这种上翻车：

```jsonc
{
  "url": "https://cdn.example.com//assets",
  "pattern": "/* 匹配全部 */",
  "note": "代码里用 // 写注释，别在 JSON 里写"
}
```

按行删 `//` 的正则会把 URL 砍成 `"https://cdn.example.com"`，把 note 清空。删 `/* */` 的正则会把 pattern 弄坏。输出还是能解析的——这才是最糟的地方，错得悄无声息。

根因是：**注释标记和字符串内容可以是同一批字符。** 只有知道当前是不是在引号里面，才能区分二者。

安全的做法就四步：

1. 逐字符走一遍输入（或者解析成 AST），引号内的内容原样复制。
2. 丢掉注释记号；顺手的话，也丢掉 `}` 或 `]` 前面那个多余的逗号。
3. 用严格 JSON 解析器解析清洗后的文本，确认结果合法。
4. 不合法就报出行号和列号。

## 三种实际的落地办法

### 代码里直接读 JSONC

读的一端在你手里，就让它接受注释，源文件继续留着注释：

```js
import { parse } from 'jsonc-parser'

// JSONC 语法错了会抛异常，否则返回普通 JS 对象
const config = parse(await fs.readFile('config.jsonc', 'utf8'))
```

```python
import json5

with open("config.json5", "r", encoding="utf-8") as f:
    config = json5.load(f)
```

适合自己程序消费、人手工改的配置。

### 构建时剥掉注释

仓库里留 JSONC，构建时产出 `.json`，运行时永远看不到注释：

```bash
npm install --save-dev strip-json-comments
```

在打包或部署前转一次。开发有注释，产物是标准 JSON。工具链混杂的流水线里这是最稳的。

### 临时转换就丢进浏览器

一次性转换用 [JSONC 转 JSON](/tools/convert/jsonc-to-json)。粘进去，或者打开 `.jsonc` / `.json` / `.txt` 文件，出来就是标准 JSON。

![JSONC 转 JSON：粘贴带注释的配置，转换后输出标准 JSON 并给出删除统计](/blog/screenshots/zh/json-comments/01-jsonc-to-json-converted.webp)

*左侧是带 `//`、`/* */` 和尾随逗号的 JSONC，右侧是转换后的标准 JSON。`endpoint` 里的 `//` 因为属于字符串内容被原样保留；面板下方显示这次删掉了 3 条注释、2 个尾随逗号。*

它会做的事，和界面上的三个开关一一对应：

- 删行注释、删块注释、删尾随逗号，三个开关默认全开（`JsoncToJson.vue:229-231`）。
- 逐字符扫描输入，字符串内容原样复制，所以 `"https://example.com/a//b"` 里的 `//` 不会被误删。
- 转换结果按严格 JSON 解析，报错带行号列号（行号列号计算见 `JsoncToJson.vue:221-224`），块注释没闭合、逗号前面没有值都在这层报出来。
- 顶部统计删掉了多少条注释、多少个尾随逗号。
- 输出可选 2 空格、4 空格、压缩成一行，能复制也能下载 `.json`（`JsoncToJson.vue:79-81`）。

它不做的事，别指望它：

- **不解析 JSON5。** 键不加引号、单引号字符串、十六进制、`NaN`、`Infinity` 都按语法错误报出来。
- **不保留注释。** 标准 JSON 没有注释语法，没有工具能把注释留在输出里，所以原文件要自己留着。
- **不校验配置的语义。** 转一个 `tsconfig.json` 只查 JSON 语法，不查 TypeScript、ESLint 或 Webpack 的配置含义。
- **不适合特别大的文件。** 渲染受浏览器内存影响，超大文件用本地解析器或构建期转换更合适。

转换在你浏览器里跑，这个工具不会上传你的 JSONC。

配置文件要是需要大段说明、多行字符串、锚点和引用，那 JSON 本身就选错了。YAML 是 CI 流水线和 Kubernetes manifest 的默认值，`#` 注释是一等公民；TOML 就是为手写配置设计的。需要在这两种之间挪动时，[JSON 转 YAML](/tools/convert/json-to-yaml) 负责 JSON 到 YAML 这一个方向。

## FAQ

### JSON 文件里可以加注释吗？

不行。标准 JSON 的文档里任何位置都没有注释语法：顶层 `{` 之前不行，里面不行，结尾 `}` 之后也不行。出现 `//`、`/* */` 或 `#`，文件就是非法的。

### package.json 能写注释吗？

不能。npm 用严格的 JSON 解析读它，加了注释 `npm install` 会直接报 `Failed to parse json`。想写说明就放到 README 里，或者用 `description` 这类本来就是数据的字段。

### JSONC 是合法 JSON 吗？

严格说不是。所有合法 JSON 都是合法 JSONC，但真正带注释的 JSONC 不属于 RFC 8259 下的合法 JSON。标称支持 JSONC 的工具是自己选了接受超集。

### 怎么去掉 JSON 里的注释？

用认得 JSONC 的解析器，不要用查找替换。流水线里 `strip-json-comments` 或 `jsonc-parser` 都能做；单个文件就粘进 [JSONC 转 JSON](/tools/convert/jsonc-to-json)，删注释和尾随逗号的同时保住字符串内容，并顺手校验结果。别对别人写的文件用正则剥注释——悄悄改坏一个 URL，比当场报错难查得多。

### 用 `_comment` 键会不会有问题？

文件本身没问题，它就是普通键。要留意的是消费方：确保它们忽略这个键，别让它漏进对外响应和日志，Schema 校验要把它算进去。写了 `additionalProperties: false` 的 Schema 会直接拒绝没声明的 `_comment`。

### 该用 JSONC 还是 JSON5？

只需要注释就用 JSONC。它贴着标准 JSON，删一遍注释就是任何解析器都能吃的文件。要同时想要不加引号的键、尾随逗号、单引号字符串，再用 JSON5。

### 为什么编辑器认我的注释，接口却报 400？

因为两端是不同的读取方。VS Code 把 `settings.json`、`tsconfig.json` 当 JSONC 读；声明 `application/json` 的接口几乎都是严格解析器，按设计拒绝注释。请求体也一样——别往收 JSON 的接口发带注释的内容。

## 接着看

- 手上有个带注释的 JSONC 要清：[JSONC 转 JSON](/tools/convert/jsonc-to-json)。
- 输出是标准 JSON 了，接下来格式化和校验：[JSON 编辑器](/tools/format/json-editor)。
- 配置需要的不只是注释：[JSON 转 YAML](/tools/convert/json-to-yaml)。
- 报错还没解决：[JSON 解析失败：10 个常见 API 错误与排查方法](/blog/json-parse-error-debug)。

---

*本站所有工具都在你的浏览器里运行，数据不会离开你的设备。*
