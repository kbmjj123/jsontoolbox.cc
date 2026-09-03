# Content Policy

## Tone & Voice

### English (en)
- Clear, concise, developer-friendly
- Direct statements, not marketing fluff
- Second person ("you") when addressing the reader
- Active voice preferred
- Short paragraphs (3-5 sentences max)

### Chinese (zh)
- 直接、简洁、不啰嗦
- 用"你"不用"您"
- 短句为主
- 避免翻译腔（如"只需轻轻点击即可实现"）
- 技术场景真实，不用虚构例子

## Technical Terminology

| English | Chinese | Notes |
|---------|---------|-------|
| JSON | JSON | Keep as-is in all languages |
| format / beautify | 格式化 / 美化 | |
| validate | 验证 / 校验 | |
| minify / compress | 压缩 | |
| convert | 转换 | |
| compare / diff | 比较 / 差分 | |
| tree view | 树形视图 | |
| CSV | CSV | Keep as-is |
| YAML | YAML | Keep as-is |
| XML | XML | Keep as-is |
| array | 数组 | |
| object | 对象 | |
| nested | 嵌套 | |
| flatten | 展平 | |
| key / value | 键 / 值 | |
| indentation | 缩进 | |
| parser | 解析器 | |
| client-side | 客户端 / 本地 | |
| browser | 浏览器 | |
| upload | 上传 | |

## Privacy Claims

Standard expressions:
- EN: "All processing happens locally in your browser — your data never leaves your device."
- ZH: "所有处理在浏览器本地完成，数据不会离开你的设备。"

**Rule**: Only use privacy claims when:
- The tool actually processes data client-side (verify in code)
- It's contextually relevant (not shoehorned into every paragraph)

## What to Avoid

### Content Anti-Patterns
- ❌ Promotional copy disguised as a tutorial
- ❌ "Top 10 JSON Tools" listicles
- ❌ Generic introductions that could apply to any topic
- ❌ Repeating the same point in different words
- ❌ Filler phrases: "In today's digital age...", "It is worth noting that..."
- ❌ Unverified claims about performance, security, or capabilities

### Product Misrepresentation
- ❌ Claiming the tool supports formats it doesn't
- ❌ Claiming features not implemented in the codebase
- ❌ Making absolute security guarantees
- ❌ Comparing unfavorably to competitors without evidence
- ❌ Suggesting the tool can handle "unlimited" file sizes

### Link Anti-Patterns
- ❌ "Click here" or "Learn more" as link text
- ❌ Links to non-existent pages
- ❌ Forced links that don't fit the context
- ❌ Linking the same destination 5+ times in one article

## JSON Code Examples

- All JSON examples must be **valid and parseable**
- Distinguish JSON from JavaScript:
  - JSON: `{"key": "value"}` (double quotes, no trailing commas)
  - JavaScript: `{key: 'value'}` (single quotes, trailing commas OK)
- Use realistic data (not "foo", "bar", "baz")
- Show both valid and invalid examples when explaining errors
- Format JSON with 2-space indentation in code blocks

## Article Structure

Every article should follow this general structure:

1. **Opening paragraph**: Direct answer to the title question
2. **Problem context**: Why this matters, who needs it
3. **Main content**: Organized by H2 sections
4. **Practical examples**: Real JSON, real scenarios
5. **Common errors / edge cases**: When applicable
6. **Tool integration**: Natural mention of JSON Toolbox tools with links
7. **FAQ section**: 3-5 questions matching real search queries
8. **Conclusion**: Brief summary, next steps

## Internal Link Rules

- Every article should link to 2-4 relevant tool pages
- Every article should link to 1-2 related blog articles (when they exist)
- Links must be contextual — placed where the reader would naturally want to explore
- Use the tool's localized name as link text
- URLs must match actual project routes

## FAQ Section

FAQ questions should:
- Come from real search queries (GSC/Bing data)
- Match the article's topic closely
- Have concise, direct answers
- Be formatted as H3 with the question, followed by the answer
- Use the pattern expected by Schema.org FAQPage markup
