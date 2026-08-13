# 工具落地页深度优化任务清单

> 创建日期：2026-08-13
> 目标：逐个工具进行深度 SEO + 功能 + UI 优化，确保每个页面在搜索结果中有竞争力

---

## 全局问题（所有 21 个工具共有）

| 问题 | 现状 | 目标 |
|------|------|------|
| Keywords 缺失 | 全部 21 个工具无 keywords | 每个工具补充 10-20 个精准关键词，但不是在head节点中使用，而是自然融入到内容中 |
| Article 内容缺失 | 全部 21 个工具无 article 段落 | 每个工具补充 500-1500 字教程/说明内容 |
| Meta Description 偏短 | json-to-csv 仅 93 字符 | 全部 ≥ 120 字符 |

---

## 单工具优化任务

### ⭐⭐⭐ 高优先级

#### Task 1: json-formatter
- **分类**: format
- **优先级**: ⭐⭐⭐（主力工具，SEO 竞争最激烈）
- **现状**: 264 行，已有 Options/Download/Copy/Error
- **优化方向**:
  - [ ] 竞品对标（jsonformatter.org, jsonlint.com, codebeautify.org）
  - [ ] Title 优化：核心词前置，融入兄弟词
  - [ ] Description 优化：覆盖搜索意图
  - [ ] Keywords 补充
  - [ ] Article 段落：500-1500 字教程
  - [ ] FAQ 检查：问题是否匹配 GSC 高频查询
  - [ ] 功能差距：与竞品对比补全

#### Task 2: json-to-csv
- **分类**: convert
- **优先级**: ⭐⭐⭐（高搜索量，for Excel 场景）
- **现状**: 115 行，Meta Desc 仅 93 字符
- **优化方向**:
  - [ ] 竞品对标
  - [ ] Meta Description 加长至 ≥ 120 字符
  - [ ] Title 优化
  - [ ] Keywords 补充
  - [ ] Article 段落：Excel/Sheets 场景教程
  - [ ] FAQ 检查
  - [ ] 功能：嵌套 JSON 展平支持

#### Task 3: json-validator
- **分类**: validate
- **优先级**: ⭐⭐（高频工具，功能过于简单）
- **现状**: 仅 90 行，无 Options/Download/Copy
- **优化方向**:
  - [ ] 竞品对标
  - [ ] 功能增强：错误定位、自动修复建议
  - [ ] Title/Description 优化
  - [ ] Keywords 补充
  - [ ] Article 段落
  - [ ] FAQ 检查

---

### ⭐⭐ 中优先级

#### Task 4: json-compare
- **分类**: compare
- **优先级**: ⭐⭐
- **现状**: 290 行，无 Copy/Download
- **优化方向**:
  - [ ] 竞品对标
  - [ ] 补全：差异结果复制/下载
  - [ ] Title/Description 优化
  - [ ] Keywords 补充
  - [ ] Article 段落
  - [ ] FAQ 检查

#### Task 5: json-to-yaml
- **分类**: convert
- **优先级**: ⭐⭐（K8s/Docker 场景高频）
- **现状**: 101 行
- **优化方向**:
  - [ ] 竞品对标
  - [ ] Title/Description 优化
  - [ ] Keywords 补充
  - [ ] Article 段落：K8s/Docker 配置场景
  - [ ] FAQ 检查

#### Task 6: json-to-typescript
- **分类**: convert
- **优先级**: ⭐⭐（前端刚需）
- **现状**: 182 行
- **优化方向**:
  - [ ] 竞品对标
  - [ ] Title/Description 优化
  - [ ] Keywords 补充
  - [ ] Article 段落：TypeScript 接口生成教程
  - [ ] 功能：更多语言选项（Go/Python/Swift/Kotlin）
  - [ ] FAQ 检查

#### Task 7: json-tree-viewer
- **分类**: view
- **优先级**: ⭐⭐
- **现状**: 126 行，无 Download
- **优化方向**:
  - [ ] 竞品对标
  - [ ] 补全：树形结构导出
  - [ ] Title/Description 优化
  - [ ] Keywords 补充
  - [ ] Article 段落
  - [ ] FAQ 检查

#### Task 8: json-path-tester
- **分类**: view
- **优先级**: ⭐⭐
- **现状**: 178 行，无 Download
- **优化方向**:
  - [ ] 竞品对标
  - [ ] 补全：匹配结果导出
  - [ ] Title/Description 优化
  - [ ] Keywords 补充
  - [ ] Article 段落
  - [ ] FAQ 检查

---

### ⭐ 低优先级

#### Task 9: json-minifier
- **分类**: format
- **优先级**: ⭐
- **现状**: 132 行
- **优化方向**:
  - [ ] 竞品对标
  - [ ] Title/Description 优化
  - [ ] Keywords 补充
  - [ ] Article 段落
  - [ ] FAQ 检查

#### Task 10: json-escape
- **分类**: format
- **优先级**: ⭐
- **现状**: 118 行
- **优化方向**:
  - [ ] 竞品对标
  - [ ] Title/Description 优化
  - [ ] Keywords 补充
  - [ ] Article 段落
  - [ ] FAQ 检查

#### Task 11: json-editor
- **分类**: format
- **优先级**: ⭐
- **现状**: 178 行，与 formatter 重叠度高
- **优化方向**:
  - [ ] 差异化定位（编辑器 vs 格式化器）
  - [ ] Title/Description 优化
  - [ ] Keywords 补充
  - [ ] Article 段落
  - [ ] FAQ 检查

#### Task 12: json-schema-generator
- **分类**: convert
- **优先级**: ⭐
- **现状**: 156 行
- **优化方向**:
  - [ ] 竞品对标
  - [ ] Title/Description 优化
  - [ ] Keywords 补充
  - [ ] Article 段落
  - [ ] FAQ 检查

#### Task 13: json-schema-validator
- **分类**: validate
- **优先级**: ⭐
- **现状**: 212 行，无 Copy/Download
- **优化方向**:
  - [ ] 竞品对标
  - [ ] 补全：验证结果复制/下载
  - [ ] Title/Description 优化
  - [ ] Keywords 补充
  - [ ] Article 段落
  - [ ] FAQ 检查

#### Task 14: json-to-xml
- **分类**: convert
- **优先级**: ⭐
- **现状**: 152 行
- **优化方向**:
  - [ ] 竞品对标
  - [ ] Title/Description 优化
  - [ ] Keywords 补充
  - [ ] Article 段落
  - [ ] FAQ 检查

#### Task 15: json-to-table
- **分类**: convert
- **优先级**: ⭐
- **现状**: 128 行，无 Copy/Download
- **优化方向**:
  - [ ] 竞品对标
  - [ ] 补全：表格复制/导出
  - [ ] Title/Description 优化
  - [ ] Keywords 补充
  - [ ] Article 段落
  - [ ] FAQ 检查

#### Task 16: csv-to-json
- **分类**: convert
- **优先级**: ⭐
- **现状**: 178 行
- **优化方向**:
  - [ ] 竞品对标
  - [ ] Title/Description 优化
  - [ ] Keywords 补充
  - [ ] Article 段落
  - [ ] FAQ 检查

#### Task 17: xml-to-json
- **分类**: convert
- **优先级**: ⭐
- **现状**: 143 行
- **优化方向**:
  - [ ] 竞品对标
  - [ ] Title/Description 优化
  - [ ] Keywords 补充
  - [ ] Article 段落
  - [ ] FAQ 检查

#### Task 18: yaml-to-json
- **分类**: convert
- **优先级**: ⭐
- **现状**: 109 行
- **优化方向**:
  - [ ] 竞品对标
  - [ ] Title/Description 优化
  - [ ] Keywords 补充
  - [ ] Article 段落
  - [ ] FAQ 检查

#### Task 19: json-to-excel
- **分类**: convert
- **优先级**: ⭐
- **现状**: 139 行，无 Copy
- **优化方向**:
  - [ ] 竞品对标
  - [ ] 补全：复制按钮
  - [ ] Title/Description 优化
  - [ ] Keywords 补充
  - [ ] Article 段落
  - [ ] FAQ 检查

#### Task 20: json-to-pdf
- **分类**: convert
- **优先级**: ⭐
- **现状**: 89 行（最短），无 Copy
- **优化方向**:
  - [ ] 竞品对标
  - [ ] 补全：复制按钮
  - [ ] Title/Description 优化
  - [ ] Keywords 补充
  - [ ] Article 段落
  - [ ] FAQ 检查

#### Task 21: json-to-code
- **分类**: convert
- **优先级**: ⭐
- **现状**: 239 行
- **优化方向**:
  - [ ] 竞品对标
  - [ ] Title/Description 优化
  - [ ] Keywords 补充
  - [ ] Article 段落
  - [ ] FAQ 检查

---

## 每个工具的分析框架

讨论每个工具时，按以下维度逐项分析：

1. **竞品对标** — 搜 Google 前 3 名竞品，对比功能差距
2. **SEO 元数据** — Title / Description / Keywords 优化
3. **内容深度** — FAQ 数量与质量、Article 段落、Features 描述
4. **功能完整性** — 与竞品对比缺什么功能
5. **UI/UX** — 交互体验、错误提示、响应式

---

## 进度跟踪

| # | 工具 | 状态 | 完成日期 |
|---|------|------|---------|
| 1 | json-formatter | ✅ 已完成 | 2026-08-13 |
| 2 | json-to-csv | ✅ 已完成 | 2026-08-13 |
| 3 | json-validator | ✅ 已完成 | 2026-08-13 |
| 4 | json-compare | ✅ 已完成 | 2026-08-13 |
| 5 | json-to-yaml | ✅ 已完成 | 2026-08-13 |
| 6 | json-to-typescript | ✅ 已完成 | 2026-08-13 |
| 7 | json-tree-viewer | ✅ 已完成 | 2026-08-13 |
| 8 | json-path-tester | ✅ 已完成 | 2026-08-13 |
| 9 | json-minifier | ✅ 已完成 | 2026-08-13 |
| 10 | json-escape | ✅ 已完成 | 2026-08-13 |
| 11 | json-editor | ✅ 已完成 | 2026-08-13 |
| 12 | json-schema-generator | ✅ 已完成 | 2026-08-13 |
| 13 | json-schema-validator | ✅ 已完成 | 2026-08-13 |
| 14 | json-to-xml | ⬜ 待开始 | - |
| 15 | json-to-table | ⬜ 待开始 | - |
| 16 | csv-to-json | ⬜ 待开始 | - |
| 17 | xml-to-json | ⬜ 待开始 | - |
| 18 | yaml-to-json | ⬜ 待开始 | - |
| 19 | json-to-excel | ⬜ 待开始 | - |
| 20 | json-to-pdf | ⬜ 待开始 | - |
| 21 | json-to-code | ⬜ 待开始 | - |
