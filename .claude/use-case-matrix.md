# JSON 使用场景矩阵（按角色与结构）

## 1. 按角色分类的典型场景

### 1.1 前端工程师

- 场景：调试 API 响应
  - 使用工具：
    - Format API response JSON.
    - JSON Tree Viewer。
- 场景：生成类型定义
  - 使用工具：
    - Generate TypeScript interfaces from JSON。
    - JSON to Go structs（如果前后端共用）。

- 场景：管理前端配置和 i18n
  - 使用工具：
    - Validate JSON config structure。
    - Extract i18n keys from JSON。
    - Diff two config JSON versions。

### 1.2 后端工程师 / API 开发者

- 场景：定义与验证接口 payload
  - 使用工具：
    - JSON Formatter / Validator。
    - JSON Schema Generator / Validator。
    - Generate sample/mock JSON from schema。

- 场景：日志分析
  - 使用工具：
    - Format minified JSON logs。
    - Extract specific fields from JSON logs。
    - JSON → CSV for log analysis。

### 1.3 测试工程师 / QA

- 场景：接口测试
  - 使用工具：
    - Compare expected vs actual JSON response。
    - Validate JSON response structure。
- 场景：生成测试用数据
  - 使用工具：
    - Generate mock JSON from schema。
    - Sample N records from JSON array。

### 1.4 数据分析师 / 数据工程师

- 场景：API 导出数据 → Excel 分析
  - 使用工具：
    - JSON array → CSV (for Excel/Google Sheets)。
- 场景：嵌套数据展平
  - 使用工具：
    - Flatten nested JSON → CSV。
- 场景：数据抽样
  - 使用工具：
    - Sample random records from JSON array。

### 1.5 DevOps / SRE

- 场景：配置转换
  - 使用工具：
    - JSON ↔ YAML (Kubernetes/Docker Compose)。
- 场景：云日志解析
  - 使用工具：
    - Format CloudWatch/ELK JSON logs。
    - Extract error messages from JSON logs。

### 1.6 移动开发（iOS / Android / Flutter）

- 场景：生成模型类
  - 使用工具：
    - JSON → Swift structs。
    - JSON → Kotlin data classes。
    - JSON → Dart models。

### 1.7 安全工程师

- 场景：解析 JWT
  - 使用工具：
    - Decode JWT payload into JSON。
- 场景：敏感数据检测
  - 使用工具：
    - Scan JSON for sensitive fields like email/phone/token。

---

## 2. 按 JSON 结构形态分类的场景

### 2.1 JSON 数组（对象列表）

- 常见场景：
  - 用户列表、订单列表、事件列表。
- 工具场景：
  - JSON array → CSV。
  - Filter JSON array by condition (e.g. status = "paid")。
  - Group JSON array by field (e.g. group by `country`)。
  - Sample random records from JSON array。

### 2.2 深度嵌套 JSON

- 常见场景：
  - 复杂配置、嵌套对象、多层级关系。
- 工具场景：
  - Flatten deeply nested JSON (with configurable path flattening)。
  - Extract all paths from nested JSON (for analysis/Mapping)。
  - JSONPath tester with nested JSON。

### 2.3 JSONL（JSON Lines）

- 常见场景：
  - 日志数据、流式数据、大数据存储格式。
- 工具场景：
  - JSONL → JSON array。
  - JSONL → CSV。
  - Filter JSONL by condition。

### 2.4 带注释的 JSON（JSON5 / comment-style JSON）

- 常见场景：
  - 配置文件中附带说明注释。
- 工具场景：
  - Strip comments from JSON (convert JSON5-style to pure JSON)。
  - Validate JSON with comments (tolerant mode)。

### 2.5 超大 JSON 文件

- 常见场景：
  - 大批量数据、日志、导出文件。
- 工具场景：
  - Split large JSON array into multiple smaller chunks。
  - Sample N records from large JSON for quick inspection。

---

## 3. 按行业场景分类（示例）

### 3.1 电商

- JSON 类型：
  - 订单（订单头 + 行项目）。
  - 商品（SKU、多规格）。
  - 用户行为事件。
- 工具场景：
  - Convert order JSON to CSV for finance/billing。
  - Extract order items from JSON。
  - Convert product catalog JSON to CSV (for Excel import)。

### 3.2 SaaS / B2B

- JSON 类型：
  - 客户数据、订阅计划、账单。
- 工具场景：
  - Convert customer JSON to CSV for CRM import。
  - Generate invoice summary JSON → CSV。

### 3.3 物联网（IoT）

- JSON 类型：
  - 设备状态、传感器数据。
- 工具场景：
  - Convert sensor JSON to CSV。
  - Filter sensor JSON by time range or threshold。

### 3.4 游戏

- JSON 类型：
  - 玩家信息、背包内容、关卡配置、活动配置。
- 工具场景：
  - Convert player data JSON to CSV。
  - Visualize game config JSON as editable tree。

### 3.5 金融 / 支付

- JSON 类型：
  - 交易流水、对账记录、风控事件。
- 工具场景：
  - Convert transaction JSON to CSV。
  - Extract failed transaction records from JSON。
