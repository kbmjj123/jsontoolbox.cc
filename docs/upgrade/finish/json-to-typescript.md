下面是基于原始 Semrush 报告和本次真实 SERP 结果升级后的 JSON 配置。

这个页面方向是可做的，但原配置存在几个需要修正的事实问题：

- `JSON to TypeScript` 不只是简单类型映射，数组样本和多种对象结构需要合并推断。
- “optional fields based on null or missing values”不能仅靠单个 JSON 样本可靠判断。
- `null` 不应简单等同于 optional。
- `interface`、`type`、`export` 是不同输出策略，当前 UI 只明确了 interface name 和 export label，功能描述不能过度扩展。
- “The file is ready to import”过于绝对，生成结果仍然需要人工审查。
- `json to ts`、`json to typescript` 与 `json to typescript interface` 是核心意图；`online typescript generator` 太泛，不宜作为主要关键词。

实际 SERP 中，竞争页面和工具已经普遍支持：

- nested interfaces。
- arrays。
- optional properties。
- interface/type 选择。
- export 关键字。
- null 和 union types。
- 多样本或目录输入。
- runtime validation。
- JSON Schema、GraphQL、API response 输入。
- 浏览器本地处理。

 [jsonic](https://jsonic.io/json-to-ts)

你提供的 Semrush 报告中：

- `json to ts`：480，KD 28。
- `json to typescript`：480，KD 23。
- `json to csharp`：480，KD 24。
- `json to dart`：480，KD 27。
- 相关 TypeScript 转换词的 KD 中等，工具意图明确，适合作为开发者工具页面，但真实 SERP 的产品成熟度高于普通 JSON 转换页。 [ppl-ai-file-upload.s3.amazonaws](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/47793863/edc8fc68-b83f-44ba-9d4a-11e1b6fef6a9/kd-json-2-2.md?AWSAccessKeyId=ASIA2F3EMEYETIJBNT2Z&Signature=x9bZXod%2FBBfEs4KF6yBObBfz0Gk%3D&x-amz-security-token=IQoJb3JpZ2luX2VjEHQaCXVzLWVhc3QtMSJGMEQCIAK6SyVAJwjfFZyHR4TtMQBH61ycEoIpG87ptXhq9mbfAiAyOE3sIR7huf6EWpINyxK8pik%2BLmXpWb6xsT0fFTreHSrzBAg8EAEaDDY5OTc1MzMwOTcwNSIMmZ6KQl%2FMP67ptpFqKtAE8CEpvFwWpfy4rRaeYjR2CWKyi7TkQqQ8UejKilShBKEPemDgJmeZOvXyWXMoVR8Yod2E46vqodowrquQSyXI7a5UcJe5OQ7kRrvrAFjx9qqUzKfW6s%2F%2BhCrzUPk%2Fq9kAcIiw06vF2u4In73sb4bQiBytAvdK2KucC%2BtSw%2BNF%2Bm%2Bo6z7nXJfTnkj0p%2BIu9LbiWjCDAyMPznnXz5gn2vaDAfbWtacMuhzR%2BTMY%2BPbVzJt8tuITMaFAjFLCozzMnhw2xf7zp39Nz8WdGfBUCb7TxtpFf195NsJcH16yjpYPCJ7GRsFFl2ebBZl7t%2FojepeenCeBl9oWqEJZabnMjFGUR58ycqHEoc4BSq9KOxfOvlLIzybJf1zT36FLwxeK%2FfnD72bbcLrIhEMfC3yUV5do7QYsTb2LQoab2bdgTLQsrSWaJ4p%2BcmzBWTWdOQxFcCTcQlLGAAY0vX13XLgiJF14m5klzJy19wMe1VH5Fn10lUdRQ%2BR5BiCCUBPK%2BYs5GFQsF1CShj%2BC6jYAveOsXToHXmz01K%2BG0Ok1JhAKIMPX6ybEBekadGn7RwhA1cUc%2BiWJusa%2BDx5KbsC8nCIHpQcGd4o7SxDGuMSyJ443oI5VnWF6qZoMi5F5AXDlXLy0kRu2vv%2FYEHdUmbhofnWp1vI3SAqiXVkZaBcd5o6vEnT0eEc37jtcAkOvNV8siFQdVpB4Qvx8MHiho8%2BLbQNim6QD2a4jA7SifmdIhGJR5rwtxxDPnMvVpK94xS%2FDspJJDJSmYlsK%2BrzV1Bws9QBG7oGC%2FjCo4rLVBjqZAZjkyfovRmho2HWxUOfb%2FkTJHz7vZ0JJque9UC3iM4FnhyGrqF%2Fix6gSVdRvlA%2Fnb0iMwU5jc85a3xvd1X15ZGeEmjJLtGrysB0ttM16gBizZw%2BDocTHfw7HOs%2BZ6ADx3tWCbv%2FefrZOyeMjPguIpPPUE7LYp6HhgITlITSn47zDrq4L6yDbEGWKv7cw1uBCOwhYzO%2FvB1l5mA%3D%3D&Expires=1789705979)

```json
{
  "name": "JSON to TypeScript Converter",
  "ui": {
    "labelInputJson": "Input JSON",
    "labelOutput": "TypeScript Types",
    "labelInterfaceName": "Root Type Name:",
    "labelExport": "Export declarations",
    "btnGenerate": "Generate TypeScript",
    "btnExample": "Load Example",
    "placeholderOutput": "Generated TypeScript types will appear here...",
    "placeholderName": "RootObject",
    "option_output_interface": "Interfaces",
    "option_output_type": "Type aliases",
    "option_export": "Add export",
    "option_optional": "Mark fields optional",
    "option_null": "Preserve null in types",
    "option_format": "Detect common string formats",
    "option_indent": "Indent:",
    "option_indent_2": "2 spaces",
    "option_indent_4": "4 spaces",
    "errorInvalidInput": "Input must be valid JSON",
    "errorEmptyInput": "Enter JSON or open a JSON file first",
    "errorEmptyArray": "The JSON array is empty",
    "errorInvalidName": "The root type name is not a valid TypeScript identifier",
    "errorGeneration": "TypeScript types could not be generated",
    "warningSampleBased": "Generated types are inferred from the provided JSON sample"
  },
  "description": "Generate TypeScript interfaces or type aliases from JSON data online. The converter infers objects, arrays, primitive types, nullable values, and nested structures, then produces editable TypeScript declarations that you can copy or download for API responses, configuration data, and frontend projects.",
  "hero": {
    "trustHtml": "Runs in your browser. Your JSON is not uploaded by this tool."
  },
  "meta": {
    "title": "JSON to TypeScript Converter – Generate Interfaces Online",
    "description": "Convert JSON to TypeScript interfaces or type aliases online. Infer nested objects, arrays, optional fields, and null values, then copy or download the generated .ts code. Free and browser-based.",
    "keywords": [
      "json to typescript",
      "json to ts",
      "json to typescript interface",
      "json to typescript online",
      "generate typescript from json",
      "json interface generator",
      "json to typescript converter",
      "json to ts interface"
    ]
  },
  "features": [
    {
      "icon": "lucide:file-code-2",
      "title": "Generate TypeScript Types",
      "description": "Infer TypeScript declarations from representative JSON data, including strings, numbers, booleans, null, arrays, objects, and nested structures."
    },
    {
      "icon": "lucide:git-branch",
      "title": "Nested Interfaces and Arrays",
      "description": "Nested objects can become separately named interfaces or type aliases, while arrays are represented with typed item declarations such as string[] or User[]."
    },
    {
      "icon": "lucide:layers-2",
      "title": "Interface or Type Alias Output",
      "description": "Choose interfaces or type aliases when the option is available. Interfaces are useful for object contracts, while type aliases are better suited to unions, intersections, and other composed types."
    },
    {
      "icon": "lucide:settings-2",
      "title": "Optional and Nullable Fields",
      "description": "Configure how the generator represents optional properties and null values. These choices are inferred from the sample and should be reviewed against the actual API or data contract."
    },
    {
      "icon": "lucide:scan-search",
      "title": "Common Format Hints",
      "description": "Optionally detect common string patterns such as email, URL, UUID, date, or date-time when supported. These hints may be emitted as comments or selected type output depending on the implementation."
    },
    {
      "icon": "lucide:copy",
      "title": "Copy TypeScript Code",
      "description": "Copy the generated declarations to your clipboard and place them in a .ts file, API model file, frontend type module, or project documentation."
    },
    {
      "icon": "lucide:download",
      "title": "Download a .ts File",
      "description": "Download the generated TypeScript source as a .ts file. Review names, optionality, nullability, unions, and array item types before importing it into your project."
    },
    {
      "icon": "lucide:shield-check",
      "title": "Browser-Based Generation",
      "description": "JSON parsing and TypeScript generation happen in your browser. The page does not require an account or upload the input data to a remote service."
    }
  ],
  "guide": [
    {
      "title": "Enter representative JSON",
      "description": "Paste a JSON object or array of objects, or open a local JSON file if file input is available. Use representative data that includes important optional fields and variations."
    },
    {
      "title": "Choose the output style",
      "description": "Select interfaces or type aliases, set the root type name, and decide whether generated declarations should include export."
    },
    {
      "title": "Configure nullability and optional fields",
      "description": "Choose how null values and optional properties should be represented. A field being nullable is not automatically the same as a field being optional."
    },
    {
      "title": "Generate and review",
      "description": "Click Generate TypeScript and inspect nested names, array item types, unions, optional markers, null types, and property names that required quoting or sanitization."
    },
    {
      "title": "Copy or download",
      "description": "Copy the TypeScript code or download a .ts file. Refine the generated declarations and add runtime validation when the input comes from an external API."
    }
  ],
  "example": {
    "input": "{\n  \"id\": 1,\n  \"name\": \"Alice\",\n  \"email\": \"alice@example.com\",\n  \"isActive\": true\n}",
    "output": "export interface RootObject {\n  id: number;\n  name: string;\n  email: string;\n  isActive: boolean;\n}",
    "useCase": "Generate a starting TypeScript model from an API response example."
  },
  "faq": [
    {
      "question": "What does JSON to TypeScript conversion generate?",
      "answer": "The converter generates TypeScript interfaces or type aliases that describe the observed JSON structure. The output is a static type declaration; it does not validate runtime data by itself."
    },
    {
      "question": "Does it generate interfaces or type aliases?",
      "answer": "The output depends on the selected mode. Interfaces are commonly used for object-shaped contracts, while type aliases can represent unions, intersections, primitive aliases, and more complex compositions."
    },
    {
      "question": "Does the generated TypeScript validate API responses at runtime?",
      "answer": "No. TypeScript types are removed during compilation and do not validate unknown runtime data. If API data must be checked at runtime, use a validator or schema-based library such as Zod, Valibot, io-ts, or JSON Schema validation."
    },
    {
      "question": "How are nested JSON objects handled?",
      "answer": "Nested objects can be emitted as separate named interfaces or type aliases and referenced from the parent declaration. Generated names are inferred from property names and may need manual refinement."
    },
    {
      "question": "How are JSON arrays handled?",
      "answer": "Arrays are represented with TypeScript array types such as string[], number[], or User[]. If an array contains multiple object shapes or incompatible value types, the result may require a union type or manual editing."
    },
    {
      "question": "Can I generate types from a JSON array?",
      "answer": "Yes. The generator can create an array type and infer the item declaration. For an array of objects, it may generate a root array type that references a named item interface."
    },
    {
      "question": "What is the difference between optional and nullable?",
      "answer": "An optional property may be absent, such as name?: string. A nullable property is present but may contain null, such as name: string | null. A field can be both optional and nullable when both states are valid."
    },
    {
      "question": "Can one JSON example determine optional fields?",
      "answer": "No. A single example cannot prove that a field is optional or required. The generator can use configured heuristics, but you should compare multiple representative responses or confirm the API contract manually."
    },
    {
      "question": "How are null values represented?",
      "answer": "When null preservation is enabled, a field may become a union such as string | null or a null type. The correct result depends on whether null is a valid value in the actual data contract."
    },
    {
      "question": "What happens when array items have different shapes?",
      "answer": "The generator may merge compatible object fields, mark some fields optional, or produce a union of object types. Review mixed arrays carefully because a single generated interface may be too broad or too strict."
    },
    {
      "question": "Does it detect dates, email addresses, or URLs?",
      "answer": "The generator can optionally recognize common string patterns, but TypeScript normally still represents these values as string. A detected format may be emitted as a comment or affect an optional output mode; it does not create a runtime-branded type unless explicitly implemented."
    },
    {
      "question": "Can JSON keys be used directly as TypeScript property names?",
      "answer": "Many JSON keys are valid TypeScript identifiers, but keys containing spaces, hyphens, leading digits, or reserved words may require quoting or sanitization. Review generated property names before using the output."
    },
    {
      "question": "Can I customize interface names?",
      "answer": "Yes. Set the root type name, and use the generated nested names as a starting point. Nested names may need manual changes when property names are generic, abbreviated, or reused in different contexts."
    },
    {
      "question": "Is the generated file ready to import into my project?",
      "answer": "It is valid starting TypeScript when the input and generator output are valid, but you should review naming, optionality, nullability, unions, and array rules before treating it as a stable project contract."
    },
    {
      "question": "Can I use generated types instead of API validation?",
      "answer": "No. Static TypeScript declarations help during development but do not protect your application from malformed or unexpected runtime JSON. Add runtime validation when data comes from a network, user input, files, or another untrusted source."
    },
    {
      "question": "Is my JSON uploaded to a server?",
      "answer": "This page is designed to parse JSON and generate TypeScript in your browser without requiring a server upload. You should still avoid entering passwords, API keys, access tokens, private customer data, or confidential production payloads into any browser-based tool."
    },
    {
      "question": "Is this a free JSON to TypeScript converter?",
      "answer": "Yes. You can paste or open JSON, generate TypeScript declarations, and copy or download the result without creating an account."
    }
  ],
  "article": {
    "title": "How to Generate TypeScript Interfaces from JSON",
    "content": "<h2>What Does JSON to TypeScript Mean?</h2><p>JSON to TypeScript conversion generates static type declarations from representative JSON data. The result may use interfaces, type aliases, arrays, unions, optional properties, and nullable types to describe the shape observed in the input.</p><p>Generated declarations reduce repetitive typing work, especially for API responses and nested payloads. They are a starting point rather than a complete guarantee that all future runtime data will match the sample.</p><h2>Common Use Cases</h2><ul><li><strong>API response models:</strong> Create an initial type definition for data returned by a REST or GraphQL endpoint.</li><li><strong>Frontend development:</strong> Add types to fetch, Axios, Vue, React, Angular, or other application code.</li><li><strong>Configuration data:</strong> Describe the structure of JSON configuration or feature-flag files.</li><li><strong>Test fixtures:</strong> Generate types for mock data, snapshots, and test payloads.</li><li><strong>Database exports:</strong> Create a starting model from JSON records exported from a data system.</li></ul><h2>How to Generate TypeScript from JSON</h2><ol><li><strong>Provide representative JSON:</strong> Paste an object, array, or API response sample that includes the fields and variations that matter.</li><li><strong>Name the root type:</strong> Use a meaningful name such as UserResponse, Product, or ApiResult instead of leaving the generic RootObject name.</li><li><strong>Choose the output style:</strong> Select interfaces or type aliases and decide whether to add export.</li><li><strong>Configure optionality:</strong> Choose how optional fields and null values should be represented, then compare the result with the real data contract.</li><li><strong>Generate:</strong> Create the TypeScript declarations and review nested names, arrays, unions, and property names.</li><li><strong>Copy or download:</strong> Put the code in a .ts file and refine it before using it throughout the project.</li></ol><h2>Basic JSON to TypeScript Mapping</h2><ul><li><strong>String:</strong> Becomes <code>string</code>.</li><li><strong>Number:</strong> Becomes <code>number</code>; TypeScript does not distinguish integer and floating-point numbers in the usual type syntax.</li><li><strong>Boolean:</strong> Becomes <code>boolean</code>.</li><li><strong>Null:</strong> May require a union such as <code>string | null</code> when a field has both string and null values.</li><li><strong>Object:</strong> Becomes an interface or type alias with properties.</li><li><strong>Array:</strong> Becomes an array type such as <code>User[]</code> or <code>Array&lt;User&gt;</code>.</li></ul><h2>Nested Objects and Arrays</h2><p>Nested objects are usually emitted as separate named declarations:</p><pre><code>interface User {\n  profile: Profile;\n}\n\ninterface Profile {\n  displayName: string;\n}</code></pre><p>Arrays require additional inference. If every object has the same shape, a single item interface may be sufficient. If objects differ, the generator may need optional fields or a union type such as <code>Admin | Member</code>. Review the output when arrays contain multiple shapes.</p><h2>Optional Fields and Nullable Fields</h2><p>Optional and nullable mean different things:</p><ul><li><strong>Optional:</strong> <code>email?: string</code> means the property may be absent.</li><li><strong>Nullable:</strong> <code>email: string | null</code> means the property is present but may contain null.</li><li><strong>Both:</strong> <code>email?: string | null</code> means the property may be missing or explicitly null.</li></ul><p>One JSON example cannot prove whether a missing field is optional. Use multiple samples or confirm the API contract before choosing the final declaration.</p><h2>Interfaces and Type Aliases</h2><p>Interfaces are often convenient for object-shaped models and can participate in declaration merging. Type aliases can represent primitives, unions, intersections, tuples, and mapped types. A generator that defaults to interfaces is useful for common object payloads, but type aliases may be a better output for mixed arrays or union-heavy data.</p><h2>TypeScript Types Do Not Validate Runtime JSON</h2><p>A TypeScript declaration helps the compiler and editor understand code, but it is not automatically a runtime validator. Data loaded from an API still needs validation if it can be malformed, incomplete, or controlled by another system. Use JSON Schema, Zod, Valibot, io-ts, typia, or another runtime validation approach when the application requires runtime guarantees.</p><h2>String Formats Are Still Strings</h2><p>An email address, URL, UUID, date, or IP address is normally still a <code>string</code> in TypeScript. A generator can add comments, branded types, or validation metadata when supported, but pattern detection alone does not validate future values.</p><h2>Property Names and Naming Rules</h2><p>JSON keys may contain characters that are inconvenient or invalid for ordinary TypeScript identifier syntax:</p><pre><code>{\"first-name\":\"Alice\",\"user id\":42}</code></pre><p>These properties may need quoted keys, such as <code>\"first-name\": string</code>, or a configured naming transformation. Renaming keys in the generated type does not rename the keys in the runtime JSON object, so use a separate transformation when the data shape must change.</p><h2>Use More Than One Example</h2><p>One sample often misses optional fields or alternate response shapes. If your API returns different variants, collect representative examples and merge them before generating types, or use a tool that accepts multiple files or samples. Then review which properties are always present, which are optional, and which require a union.</p><h2>Keep Generated Types in Sync</h2><p>Generated types can drift from the API when the backend changes. Regenerate them from updated fixtures or schema definitions, and add runtime validation or contract tests where correctness matters. Treat generated code as part of the development workflow rather than a permanent substitute for an API contract.</p><h2>Browser-Based Privacy</h2><p>This converter is designed to parse the JSON and generate TypeScript in the browser instead of sending input to a remote conversion service. That can be convenient for development samples and private configuration snippets, but it is not a secure secret-management system. Avoid entering credentials, tokens, private customer records, or production secrets into any online tool.</p>"
  }
}
```

## 主要调整说明

### 1. 将页面从“自动生成最终类型”改为“生成起始类型”

原配置中多次使用：

> automatically  
> proper type inference  
> ready to import

这些表达容易高估自动推断的准确性。真实 SERP 中，Jsonic、PlayCode、Quicktype 和 JSONNova 都提供自动推断，但更强的工具已经开始支持：

- union types。
- optional fields。
- nullable fields。
- 多样本输入。
- runtime validation。
- JSON Schema 输入。
- API response 和目录样本。

 [playcode](https://playcode.io/json-to-typescript)

因此新版将定位改为：

> Generate TypeScript declarations from representative JSON data.

并明确生成结果需要审查。

### 2. `null` 不等于 optional

原配置把：

> optional fields based on null or missing values

放在一起，技术上不够准确。

这三种类型不同：

```ts
name?: string
```

属性可能不存在。

```ts
name: string | null
```

属性存在，但值可能为 null。

```ts
name?: string | null
```

属性可能缺失，也可能是 null。

新版在 FAQ、article 和 UI 中明确区分这三种情况。

### 3. 增加 `interface` / `type alias` 选择

原页面名是 JSON to TypeScript，但 UI 只有：

```text
Interface Name
Export
```

真实 SERP 中 PlayCode、FormatJSONOnline 和 Quicktype 等工具已经允许用户选择：

- interface。
- type。
- export。
- optional properties。
- strict mode。
- naming conventions。

 [quicktype](https://quicktype.io/typescript)

如果当前实现仍然只生成 interface，则应删除：

```text
option_output_type
```

并将 description 改为：

> Generate TypeScript interfaces from JSON data.

如果增加 type alias 输出，才保留新版配置。

### 4. 不能把 format detection 当成 TypeScript 类型

原配置中的：

> detect date, email, URI, UUID, IPv4, and hostname formats

需要特别谨慎。TypeScript 原生类型通常仍然是：

```ts
email: string;
createdAt: string;
id: string;
```

即使工具识别出了 email 或 date，也不代表 TypeScript 能自动生成一个真正的运行时 email 类型。

新版改为：

> These hints may be emitted as comments or selected type output depending on the implementation.

如果你没有实现 branded types 或 comments，应删除 `option_format` 和对应 feature。

### 5. 增加运行时校验边界

这是开发者用户非常关心的问题。JSON 转 TypeScript 只生成编译时声明：

```ts
interface User {
  id: number;
}
```

它不会在运行时验证：

```json
{
  "id": "not-a-number"
}
```

如果 API 返回未知数据，TypeScript 类型断言并不能保护应用。JsonEditorOnline 的相关内容也强调，仅进行 type cast 不等于验证，建议结合 JSON Schema 或 runtime validation。 [jsoneditoronline](https://jsoneditoronline.org/indepth/parse/json-to-typescript/)

因此新版加入：

- `Does generated TypeScript validate API responses at runtime?`
- Zod、Valibot、io-ts、JSON Schema 等说明。
- `Static types do not validate runtime JSON` 文章章节。

这类内容有助于避免把工具包装成不具备的安全能力。

### 6. 增加非法 JSON key 处理

JSON key 可能是：

```json
{
  "first-name": "Alice",
  "user id": 42,
  "123value": true
}
```

TypeScript 输出不能总是简单生成：

```ts
interface User {
  first-name: string;
  user id: number;
}
```

可能需要：

```ts
interface User {
  "first-name": string;
  "user id": number;
  "123value": boolean;
}
```

或者做命名转换：

```ts
interface User {
  firstName: string;
  userId: number;
  value123: boolean;
}
```

但命名转换只改变类型声明，不会改变实际 JSON key。新版因此增加了 property naming 的 FAQ 和文章说明。

### 7. 对数组推断更加客观

原配置：

> arrays are typed based on their element types

这还不够，因为数组可能是：

```json
[
  { "id": 1 },
  { "id": 2, "name": "Alice" }
]
```

或者：

```json
[1, "two", null]
```

可能需要输出：

```ts
type Value = number | string | null;
```

或者：

```ts
interface Item {
  id: number;
  name?: string;
}
```

更复杂的情况则需要：

```ts
type Item = Admin | Member;
```

新版加入了 mixed arrays、union types 和 optional fields 的限制说明。

## 这页的实际竞争情况

真实 SERP 中，基础工具竞争者包括：

- Jsonic。
- PlayCode。
- JSONNova。
- JSONSimple。
- FormatJSONOnline。
- Transform.tools。
- JSON Swiss。
- KB Cafe。

更强的技术型竞品包括：

- Quicktype。
- JSON Editor Online。
- VS Code extensions。
- Chrome DevTools JSON-to-TypeScript extensions。

 [jsonic](https://jsonic.io/json-to-ts)

它们的差异主要在：

| 竞品类型 | 主要能力 |
|---|---|
| 基础在线转换器 | 单个 JSON → interface |
| 开发者工具 | interface/type、export、optional、命名 |
| Quicktype 类工具 | 多样本、JSON Schema、GraphQL、runtime validation |
| 编辑器插件 | 直接从选中 JSON 生成 TypeScript |
| AI 工具 | 从模糊结构、代码或接口描述生成类型 |

如果 JsonToolBox 只实现单个 JSON → interface，页面可以获取长尾流量，但很难与 Quicktype 等强工具竞争头部词。

## 推荐的功能优先级

### 第一版

- JSON object/array 输入。
- 基础类型推断。
- nested object。
- arrays。
- root interface name。
- export 开关。
- optional fields 开关。
- null union。
- copy/download。
- invalid JSON error。
- local processing。

### 第二版

- interface/type alias。
- mixed array union。
- multiple sample merge。
- property naming strategy。
- format comments。
- type-only export。
- JSON file upload。

### 第三版

- JSON Schema → TypeScript。
- OpenAPI → TypeScript。
- GraphQL → TypeScript。
- runtime validation。
- Zod/Valibot schema output。
- Quicktype-style multiple input files。
- API response collection。
- generated type tests。

## 页面优先级判断

| 维度 | 评价 |
|---|---|
| 搜索需求 | 中高 |
| 工具意图 | 很强 |
| KD | 中等 |
| 竞争成熟度 | 高 |
| 技术复杂度 | 中等—高 |
| 与 JsonToolBox 匹配度 | 高 |
| 初期流量难度 | 中等偏高 |
| 长期开发者价值 | 很高 |

建议主页面覆盖：

```text
json to typescript
json to ts
json to typescript interface
generate typescript from json
json interface generator
```

不建议将以下词作为当前页面重点：

```text
online typescript generator
typescript type generator
json to typescript code
```

这些词更泛，或者可能对应代码生成器、AI 工具、编辑器插件等不同意图。

最终判断是：**JSON to TypeScript Converter 值得做，且开发者使用价值较高；但必须把“生成类型声明”和“运行时验证”区分清楚。** 第一版可以从单样本 JSON → interface 开始，但页面应明确说明这是 inferred starting types；等支持多样本、union、optional/nullability 和 type alias 后，再扩大 SEO 承诺。