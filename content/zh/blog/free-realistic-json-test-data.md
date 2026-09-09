---
title: "免费 JSON 测试数据集 — 订单、用户、日志、支付、商品"
description: "下载免费的真实感 JSON 测试数据集，包含订单、用户、日志、工单、支付和商品场景，适用于 JSON 查看器、编辑器、解析器和性能测试。"
category: "json_tools"
date: 2026-09-08
lastmod: 2026-09-08
author: "JSON Toolbox Team"
tags: ["JSON", "测试数据", "JSON 编辑器", "性能测试", "JSON 查看器", "开发者工具"]
locales: ["zh"]
promo:
  slug: "json-editor"
  text: "🚀 想直接打开这些文件？试试 JSON 编辑器："
  btn: "打开 JSON 编辑器"
---

小型 JSON 示例适合学习语法，但不足以测试真实应用。

一个生产环境的 JSON 文档可能包含嵌套对象、数组、可选字段、时间戳、图片 URL、颜色值、元数据、用户资料、支付详情、库存记录和错误信息。大型 JSON 文件还会暴露解析器、编辑器、查看器、搜索功能和虚拟渲染组件的性能问题。

为了方便测试，JsonToolBox 提供了一套免费的真实感 JSON 测试数据集，面向开发者、测试人员、学生和技术写作者。

这些数据集由程序合成生成，可以直接下载用于本地开发、UI 测试、JSON 解析和性能基准测试。

## 下载 JSON 测试数据

数据集涵盖多种常见业务场景：

| 数据集 | 说明 | 适用测试场景 |
|---|---|---|
| 订单 | 电商订单、客户、商品、税费、折扣 | 嵌套对象、数组、金额汇总、关联关系 |
| 用户 | 用户资料、地址、偏好、公司、社交链接 | 可选字段、元数据、头像、用户界面 |
| 日志 | 应用和 API 日志，含错误、请求、时间戳 | 宽对象、日志级别、错误字段、搜索 |
| 工单 | 类 Jira 的项目工单，含工作日志和自定义字段 | 深层嵌套、动态字段、用户、状态值 |
| 支付 | 类 Stripe 的扣款、支付意向、客户、付款 | 支付状态、ID、金额、嵌套资源 |
| 商品 | 电商商品，含变体、库存、选项、图片 | 数组、商品变体、图片、库存数据 |

### 订单

电商订单数据包含客户、地址、商品行、商品图片、税费、折扣、支付状态、履约状态和订单元数据。

- [下载订单 — 1 MB](https://github.com/kbmjj123/jsontoolbox.cc/raw/develop/libs/json-generator/output/orders-1mb.json)
- [下载订单 — 5 MB](https://github.com/kbmjj123/jsontoolbox.cc/raw/develop/libs/json-generator/output/orders-5mb.json)
- [下载订单 — 10 MB](https://github.com/kbmjj123/jsontoolbox.cc/raw/develop/libs/json-generator/output/orders-10mb.json)
- [下载订单 — 20 MB](https://github.com/kbmjj123/jsontoolbox.cc/raw/develop/libs/json-generator/output/orders-20mb.json)

示例结构：

```json
{
  "id": 1001,
  "order_number": "#1001",
  "created_at": "2026-08-12T14:23:45.000Z",
  "customer": {
    "id": 5021,
    "first_name": "Alice",
    "last_name": "Johnson",
    "email": "customer5021@example.com"
  },
  "line_items": [
    {
      "product_id": 2001,
      "title": "Premium Wireless Headphones",
      "quantity": 2,
      "price": "129.99",
      "variant": { "color": "#1E293B", "size": "One Size" }
    }
  ],
  "total_price": "281.43",
  "currency": "USD",
  "financial_status": "paid",
  "fulfillment_status": "fulfilled"
}
```

该数据集适合测试可展开树、嵌套数组、金额汇总、筛选和订单详情界面。

### 用户

用户数据集包含真实感的用户资料，含姓名、邮箱、头像、地址、公司、职位、偏好、角色和可选的社交链接。

- [下载用户 — 1 MB](https://github.com/kbmjj123/jsontoolbox.cc/raw/develop/libs/json-generator/output/users-1mb.json)
- [下载用户 — 15 MB](https://github.com/kbmjj123/jsontoolbox.cc/raw/develop/libs/json-generator/output/users-15mb.json)
- [下载用户 — 40 MB](https://github.com/kbmjj123/jsontoolbox.cc/raw/develop/libs/json-generator/output/users-40mb.json)

可用于测试：

- 用户管理界面
- 资料卡片和表格
- 头像和图片 URL 渲染
- 可选和缺失字段
- 偏好和嵌套设置
- 按角色、语言或状态搜索和筛选

### 应用日志

日志数据集模拟 Web 应用和后端服务产生的日志记录。

- [下载日志 — 1 MB](https://github.com/kbmjj123/jsontoolbox.cc/raw/develop/libs/json-generator/output/logs-1mb.json)
- [下载日志 — 10 MB](https://github.com/kbmjj123/jsontoolbox.cc/raw/develop/libs/json-generator/output/logs-10mb.json)
- [下载日志 — 30 MB](https://github.com/kbmjj123/jsontoolbox.cc/raw/develop/libs/json-generator/output/logs-30mb.json)
- [下载日志 — 50 MB](https://github.com/kbmjj123/jsontoolbox.cc/raw/develop/libs/json-generator/output/logs-50mb.json)

日志记录可能包含：

- 日志级别：`DEBUG`、`INFO`、`WARN`、`ERROR`、`FATAL`
- 请求 ID 和用户 ID
- HTTP 方法和状态码
- API 路径和查询参数
- 处理耗时
- 错误消息和堆栈跟踪
- 服务、主机、区域和环境元数据

适合测试日志查看器、JSON 搜索、语法高亮、错误筛选和宽记录渲染。

### 类 Jira 工单

工单数据集模拟项目管理和问题跟踪记录。

- [下载工单 — 1 MB](https://github.com/kbmjj123/jsontoolbox.cc/raw/develop/libs/json-generator/output/issues-1mb.json)
- [下载工单 — 10 MB](https://github.com/kbmjj123/jsontoolbox.cc/raw/develop/libs/json-generator/output/issues-10mb.json)
- [下载工单 — 20 MB](https://github.com/kbmjj123/jsontoolbox.cc/raw/develop/libs/json-generator/output/issues-20mb.json)
- [下载工单 — 40 MB](https://github.com/kbmjj123/jsontoolbox.cc/raw/develop/libs/json-generator/output/issues-40mb.json)

每条工单可能包含：

- 项目标识和工单编号
- 标题和描述
- 工单类型、优先级和状态
- 报告人和指派人
- 标签和组件
- 修复版本
- 工作日志和评论
- 故事点和自定义字段
- Epic 关联

这个场景特别适合测试不一致的对象形状和动态字段。不是每条工单都包含相同的可选属性，这更贴近真实业务系统的数据。

### 类 Stripe 支付

支付数据集表示常见的支付相关对象，如扣款、支付意向、客户、支付方式和付款。

- [下载支付 — 1 MB](https://github.com/kbmjj123/jsontoolbox.cc/raw/develop/libs/json-generator/output/payments-1mb.json)
- [下载支付 — 10 MB](https://github.com/kbmjj123/jsontoolbox.cc/raw/develop/libs/json-generator/output/payments-10mb.json)
- [下载支付 — 20 MB](https://github.com/kbmjj123/jsontoolbox.cc/raw/develop/libs/json-generator/output/payments-20mb.json)
- [下载支付 — 40 MB](https://github.com/kbmjj123/jsontoolbox.cc/raw/develop/libs/json-generator/output/payments-40mb.json)

生成的记录可能包含：

- 支付 ID 和客户 ID
- 以分为单位的金额
- 货币代码
- 卡品牌和脱敏卡号
- 支付状态流转
- 退款金额
- 失败代码和消息
- 支付元数据
- 付款到账日期

所有支付记录均为合成数据，不关联真实支付账户或交易，不可用作财务记录。

### 电商商品

商品数据集包含目录数据，含商品图片、选项、变体、价格、库存、标签、SEO 元数据和发布状态。

- [下载商品 — 1 MB](https://github.com/kbmjj123/jsontoolbox.cc/raw/develop/libs/json-generator/output/products-1mb.json)
- [下载商品 — 10 MB](https://github.com/kbmjj123/jsontoolbox.cc/raw/develop/libs/json-generator/output/products-10mb.json)
- [下载商品 — 20 MB](https://github.com/kbmjj123/jsontoolbox.cc/raw/develop/libs/json-generator/output/products-20mb.json)
- [下载商品 — 40 MB](https://github.com/kbmjj123/jsontoolbox.cc/raw/develop/libs/json-generator/output/products-40mb.json)

一个商品可能包含：

- 多张图片，含 URL、尺寸和位置
- 颜色和尺寸选项
- 多个商品变体和 SKU
- 库存数量和可用状态
- 促销价和对比价
- 商品标签和分类
- SEO 标题和描述
- 外部图片 URL

适合测试商品网格、变体选择器、库存面板、目录导入和嵌套 JSON 结构。

## 在线测试 JSON 工具

下载数据集后，可以在 JsonToolBox 的免费 JSON 工具中打开。

[JsonToolBox 工具页](/tools) 提供基于浏览器的 JSON 处理工具。工具直接在浏览器中运行，无需上传到服务器即可格式化、验证、编辑、比较和转换 JSON。

常用工具包括：

- [JSON 编辑器](/tools/format/json-editor) — 编辑、格式化、验证和导出 JSON
- [JSON 转 CSV](/tools/convert/json-to-csv) — 将对象数组转换为 CSV 文件
- [JSON 转 Excel](/tools/convert/json-to-excel) — 将 JSON 数组直接转换为 Excel 表格
- [JSON 转义/反转义](/tools/format/json-escape) — 处理引号、反斜杠、换行等特殊字符
- [JSON 压缩](/tools/format/json-minifier) — 移除空白压缩 JSON
- [JSON 比较](/tools/format/json-compare) — 高亮两个 JSON 文档的差异
- [JSON 转 TypeScript](/tools/convert/json-to-typescript) — 从 JSON 生成 TypeScript 接口

JsonToolBox 专为浏览器端 JSON 工作流设计，数据在本地处理，无需注册或上传文件。

## 使用场景

这些数据集可用于多种开发和测试工作流。

### 测试 JSON 查看器

用较大的文件测试：

- 初始加载时间
- 树形展开和折叠
- 虚拟渲染
- 深层嵌套结构
- 大型数组
- 搜索和筛选
- 内存占用
- 滚动性能

### 测试 JSON 编辑器

数据集可帮助测试编辑器是否能：

- 打开大型文档
- 格式化和压缩 JSON
- 高亮语法错误
- 编辑嵌套值
- 在大文件中搜索
- 保持数组和对象结构
- 导出修改后的文档

### 测试 API 和解析器

开发者可将文件用作：

- 单元测试夹具
- 集成测试数据
- 导入导出工作流
- Schema 验证
- 数据转换
- JSON 转 CSV
- 数据库种子脚本

### 构建演示和教程

较小的数据集适合：

- 文档示例
- 前端演示
- 表格和树组件
- API 响应示例
- 数据可视化原型
- 编程练习

## 文件大小

不同文件大小适用于不同类型的测试。

| 大小 | 推荐用途 |
|---|---|
| 1 MB | 快速演示、单元测试、本地开发 |
| 5–10 MB | 编辑器、查看器、解析器测试 |
| 20–30 MB | 大文件渲染和内存测试 |
| 40–50 MB | 压力测试和性能基准测试 |

实际记录数取决于数据集类型。订单、工单和商品通常每条记录包含更多嵌套数据。

## 合成数据与隐私

所有记录均为生成数据，不来自真实的客户、支付系统、项目跟踪器或生产数据库。

生成数据可能包含：

- 假名
- 示例邮箱
- 测试电话号码
- 合成地址
- 随机 ID
- 公共占位图片 URL
- 生成的颜色和元数据

使用前仍建议根据具体场景审查数据。支付数据集仅用于界面和解析器测试，不包含真实支付信息，不能用于处理交易。

## 外部图片 URL

部分记录包含公共图片 URL，如头像和商品图片字段。这些 URL 适用于测试需要渲染远程图片的应用。

```json
{
  "avatar_url": "https://i.pravatar.cc/300?u=5021",
  "image_url": "https://picsum.photos/seed/product-2001/400/400"
}
```

外部图片服务可能有速率限制或可用性变化。如需长期稳定测试，可替换为自有域名图片或使用本地资源版本。

## 生成自定义数据

如果需要不同大小或结构的文件，可以用配套的 Node.js 脚本自行生成。

```bash
# 克隆仓库
git clone https://github.com/kbmjj123/jsontoolbox.cc.git
cd jsontoolbox.cc/libs/json-generator

# 安装 tsx
pnpm add -D tsx

# 生成数据集（默认输出到 ./output/）
tsx scripts/generate.ts orders 10
tsx scripts/generate.ts users 10
tsx scripts/generate.ts logs 10
tsx scripts/generate.ts issues 10
tsx scripts/generate.ts payments 10
tsx scripts/generate.ts products 10
```

第一个参数选择数据集类型，第二个参数是目标大小（MB）。

各数据集类型的平均记录大小：

| 类型 | 平均记录大小 | 主要特征 |
|---|---|---|
| `orders` | ~1.8 KB | 客户、商品行、税费、折扣、配送 |
| `users` | ~0.7 KB | 资料、地址、偏好、社交链接 |
| `logs` | ~0.5 KB | 时间戳、请求信息、错误、元数据 |
| `issues` | ~1.5 KB | 工作日志、自定义字段、组件、标签 |
| `payments` | ~0.5 KB | 扣款、支付意向、卡信息、付款 |
| `products` | ~2.3 KB | 变体、图片、选项、库存、SEO |

源代码和生成说明见 JsonToolBox 仓库：

[查看 JSON 测试数据生成器（GitHub）](https://github.com/kbmjj123/jsontoolbox.cc/tree/develop/libs/json-generator)

## 常见问题

### 这些 JSON 文件免费吗？

是的。数据集面向开发、测试、教育和演示用途免费提供。

### 记录是真实的吗？

不是。记录由程序合成生成，不代表真实用户、支付、订单或项目。

### 可以用来测试 JSON 查看器吗？

可以。数据集专为 JSON 查看器、编辑器、格式化器、验证器、解析器、导入工具和大文件渲染系统设计。

### 数据集包含图片吗？

部分数据集包含图片 URL 字段，如头像和商品图片。URL 指向 `pravatar.cc` 和 `picsum.photos` 等公共占位图片服务。

### 可以生成更大的文件吗？

可以。使用 Node.js 生成器创建自定义大小或记录数的文件，没有硬性限制。

### 可以商用吗？

生成器源代码为开源。你可以在项目、演示和文档中使用生成的文件。详见仓库中的许可证。

## 结论

真实感测试数据让 JSON 工具在接近真实应用的条件下接受检验。

JsonToolBox 数据集包含订单、用户、日志、工单、支付和商品，涵盖嵌套结构、数组、可选字段、元数据、图片 URL、时间戳、颜色和业务关联关系。

下载数据集，在 [JsonToolBox](/tools/format/json-editor) 中打开，直接在浏览器中测试格式化、验证、编辑、转换、搜索和大文件渲染。
