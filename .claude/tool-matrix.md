# 核心 JSON 工具矩阵与功能设计

## 1. JSON Formatter / Beautifier（格式化/美化）

### 功能目标

- 将杂乱或压缩的一行 JSON 字符串转换为易读的、带缩进的结构。
- 支持错误检测与错误位置提示。
- 提供树形折叠视图便于查看复杂 JSON。

### 具体功能点

- 输入方式：
  - 文本框粘贴。
  - 文件上传（`.json`、任意文本文件）。
- 输出方式：
  - 美化 JSON（可选 2/4 空格或 Tab）。
  - 单行压缩 JSON（Minified）。
  - 可复制输出、下载为文件。
- 错误处理：
  - 调用 `JSON.parse`，捕获异常。
  - 显示错误行列（通过简单行号计算）。
  - 提示常见错误原因（缺少逗号、引号不配对等）。
- UI 细节：
  - 左侧输入、右侧输出。
  - 按钮：Format、Minify、Validate、Clear。

### 可支持的长尾场景

- Format API response JSON.
- Format JSON logs.
- Format JSON from browser DevTools.
- Beautify JSON with custom indentation.

---

## 2. JSON Validator（验证器）

### 功能目标

- 判断输入是否是合法 JSON。
- 对错误进行清晰提示，帮助开发者快速修复。

### 具体功能点

- 输入方式同 Formatter。
- 功能：
  - Validate：校验 JSON 语法。
  - Error details：错误信息 + 行列号。
- 可选高级功能：
  - 容错模式：尝试自动修复简单错误（例如多余的逗号）。

### 场景示例

- Validate webhook payload JSON.
- Validate JSON config file before deployment.
- Validate JSON API response recorded in logs.

---

## 3. JSON Diff / Compare（差分/比较）

### 功能目标

- 方便比较两个 JSON 数据的差异，用于 API 改版、配置变更等场景。

### 具体功能点

- 左右两栏输入两个 JSON。
- 功能：
  - Format both inputs。
  - 解析后进行深度比较：
    - 找出新增/删除的 key。
    - 找出值变化（含类型变化）。
- 输出：
  - 高亮显示差异：
    - 增加（绿色）。
    - 删除（红色）。
    - 修改（黄色）。
- 可选：
  - 路径显示（例如 `user.profile.name`）。

---

## 4. JSON to CSV / CSV to JSON（数据格式转换）

### 4.1 JSON to CSV

#### 功能目标

- 将 JSON 数组（通常是对象数组）转换为 CSV 表格方便在 Excel/Sheets 中使用。

#### 功能点

- 输入：JSON array，如 `[{ "name": "Alice", "age": 30 }, ...]`
- 提取字段：
  - 自动识别字段名（基于第一条记录）。
  - 提供字段选择界面。
- 导出：
  - 生成 CSV 文本。
  - 可下载 `.csv` 文件。
- 处理嵌套：
  - V1：仅支持扁平对象。
  - V2：提供简单的嵌套展平配置（如 `user.name` → 列名）。

### 4.2 CSV to JSON

- 输入：CSV 文本或文件。
- 字段行解析：
  - 第一行作为字段名。
- 输出：
  - JSON 数组：`[{...},{...}]`.

---

## 5. JSON ↔ YAML / JSON ↔ XML

### 5.1 JSON to YAML / YAML to JSON

- 使用 `js-yaml` 等库实现互转。
- 功能：
  - JSON → YAML：保留结构，适合配置文件。
  - YAML → JSON：便于在前端/后端使用。

### 5.2 JSON to XML / XML to JSON

- 使用 XML 处理库实现结构转换。
- 注意事项：
  - JSON → XML 需决定如何映射数组/对象。
  - XML → JSON 需处理属性与文本节点。

---

## 6. JSON to Types（TypeScript / Go / Python 等）

### 功能目标

- 从 JSON 推断出类型定义，用于快速生成代码结构。

### 目标语言与格式

- TypeScript：`interface` 或 `type`.
- Go：`struct`.
- Python：`dataclass` 或普通类。

### 推断过程

- 解析 JSON，递归推断：
  - 字符串 → `string` / `String`.
  - 数字 → `number` / `int` / `float`（根据规则）。
  - 布尔 → `boolean` / `bool`.
  - 数组：
    - 统一类型推断（例如 `User[]`）。
  - 对象：
    - 每个键一个字段。

### 高级点

- 可选：生成注释（基于示例值）。
- 可选：可配置字段名转换（驼峰/蛇形）。

---

## 7. JSONPath Tester（JSON 路径测试）

### 功能目标

- 帮助开发者验证 JSONPath 表达式对某个 JSON 的选择结果。

### 功能点

- 输入：
  - JSON 文本。
  - JSONPath 表达式（如 `$.store.book[0].title`）。
- 输出：
  - 匹配结果列表（值 + 路径）。
- UI：
  - JSON 预览区域。
  - JSONPath 输入框。
  - 结果列表区域。

---

## 8. JSON Tree Viewer / Parser

### 功能目标

- 提供树形视图，方便分析复杂 JSON。

### 功能点

- 解析 JSON 至树结构。
- UI：
  - 折叠/展开节点。
  - 显示 key / type / value。
  - 支持节点路径复制（例如复制 `user.profile.email`）。
- 可选：
  - 搜索功能（按 key/value 搜索节点）。

---

## 9. JSON Minifier / One Line

### 功能目标

- 删除所有无用空格和换行，生成最紧凑的一行 JSON。

### 功能点

- 输入 JSON → 输出单行 JSON。
- 适合：
  - 日志压缩。
  - 在 URL 中嵌入 JSON 时。

---

## 10. 扩展工具示例（可选）

- JSONL（JSON Lines）处理：
  - JSONL → JSON array.
  - JSONL → CSV.
- JSON Escape / Unescape：
  - 处理带转义字符的 JSON 字符串。
- JSON Schema 生成 / 校验：
  - 从 JSON 生成简单 schema。
  - 使用 schema 校验 JSON。
