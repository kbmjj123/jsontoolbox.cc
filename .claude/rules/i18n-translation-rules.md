# i18n 翻译规则

> 适用范围：所有工具落地页的 `en` → `zh` 翻译

---

## 核心原则

1. **不是直译，是文化适配** — 同样的功能，用目标语言习惯的方式表达
2. **场景必须真实** — 提到的平台、工具、用法必须在目标市场真实存在且常用
3. **技术术语保持一致** — JSON、API、CSV、YAML 等技术词各语种通用
4. **HTML 结构不变** — 保持与英文相同的标签结构

---

## 语气规范

| 语种 | 语气要求 | 示例 |
|------|---------|------|
| en | Clear, concise, developer-friendly | ✅ "Paste your JSON and click Format" |
| zh | 直接、简洁、不啰嗦。用"你"不用"您"。短句为主。 | ✅ "粘贴 JSON，点击格式化" ❌ "只需轻轻点击即可实现格式化功能" |

---

## JSON 术语对照

| 英文 | zh |
|------|-----|
| JSON | JSON（保留） |
| format / beautify | 格式化 / 美化 |
| validate | 验证 / 校验 |
| minify / compress | 压缩 |
| convert | 转换 |
| compare / diff | 比较 / 差分 |
| tree view | 树形视图 |
| CSV | CSV（保留） |
| YAML | YAML（保留） |
| XML | XML（保留） |
| array | 数组 |
| object | 对象 |
| nested | 嵌套 |
| flatten | 展平 |
| key / value | 键 / 值 |
| indentation | 缩进 |
| parser | 解析器 |
| client-side | 客户端 / 本地 |
| browser | 浏览器 |
| upload | 上传 |

---

## 隐私卖点表达

| 语种 | 标准表达 |
|------|---------|
| en | "All processing happens locally in your browser — your data never leaves your device." |
| zh | "所有处理在浏览器本地完成，数据不会离开你的设备。" |

---

## 内链规则

- `<a href='/tools/xxx'>` 链接保持不变（URL 是语种无关的）
- 链接文字需要翻译为目标语言
- 示例：`<a href='/tools/format/json-formatter'>JSON Formatter</a>` → zh: `<a href='/tools/format/json-formatter'>JSON 格式化</a>`

---

## 翻译检查清单

每个语种翻译完成后，检查：

- [ ] 语气是否符合语种规范？
- [ ] 技术术语是否使用了对照表中的标准表达？
- [ ] HTML 结构是否与英文一致？
- [ ] 内链 URL 是否保持不变？
