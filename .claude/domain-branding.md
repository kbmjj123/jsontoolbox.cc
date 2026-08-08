# jsontoolbox.cc 域名与品牌设计

## 域名选择

`jsontoolbox.cc` 这个选择是可行的，而且和要做的东西是匹配的：

- 含有 `json` + `toolbox`，一眼就能看出是做 JSON 工具集合的。
- 不是太窄（未来可以扩展到更多 JSON 场景、甚至少量数据相关工具）。
- `.cc` 在开发者圈和小工具站里也不算少见，记忆性还可以。

## 品牌与文案建议

### 1) 品牌名称

- 站点名称：**JSON Toolbox**
- Tagline（英文）：
    - `JSON Toolbox – Free, Client-Side Tools for Developers`
    - 或 `Work faster with JSON. Format, validate, convert – all in your browser.`

### 2) 首页首屏文案草稿

- H1：`JSON Toolbox – Free Online JSON Tools`
- Subheading：
    - `Format, validate, compare, and convert JSON data directly in your browser. 100% client-side – your data never leaves your device.`

## 站点结构与域名匹配

在 `jsontoolbox.cc` 下的 URL 大致可以这样：

- 核心工具：
    - `https://jsontoolbox.cc/tools/json-formatter`
    - `https://jsontoolbox.cc/tools/json-validator`
    - `https://jsontoolbox.cc/tools/json-compare`
    - `https://jsontoolbox.cc/tools/json-to-csv`
    - `https://jsontoolbox.cc/tools/json-to-yaml`
    - `https://jsontoolbox.cc/tools/json-to-xml`
    - `https://jsontoolbox.cc/tools/json-to-typescript`
    - `https://jsontoolbox.cc/tools/jsonpath-tester`
    - `https://jsontoolbox.cc/tools/json-tree-viewer`
    - `https://jsontoolbox.cc/tools/json-minifier`
- 场景化页：
    - `https://jsontoolbox.cc/tools/json-array-to-csv-for-excel`
    - `https://jsontoolbox.cc/tools/flatten-nested-json-to-csv`
    - `https://jsontoolbox.cc/tools/generate-mock-json-from-schema`
    - `https://jsontoolbox.cc/tools/json-to-typescript-api-response`
- 文章/文档：
    - `https://jsontoolbox.cc/blog/what-is-json`
    - `https://jsontoolbox.cc/blog/json-to-csv-for-excel`
    - `https://jsontoolbox.cc/blog/generate-typescript-from-json`

域名本身是"工具箱"概念，所以首页网格展示「工具集合」非常契合。

## 与开源项目的绑定方式

后续开源时可以这样写 README 和站点 footer：

- README 开头：

```md
# JSON Toolbox

JSON Toolbox (`jsontoolbox.cc`) is a free, client-side collection of JSON tools for developers.
Format, validate, compare, and convert JSON data directly in your browser – no uploads, no tracking.
```

- 站点底部：

> JSON Toolbox – Free, client-side JSON tools.
> Open source on GitHub: `[GitHub 链接]`

这样域名、品牌名、开源项目名统一起来，后续做其他 JSON 相关东西时也都能挂在 "JSON Toolbox" 下面。

## 域名使用注意事项

- 先确认：
    - 域名历史（用 whois / Wayback / SEMrush 看一下是否曾被用作垃圾站）。
    - SSL 证书做好（Cloudflare/Let's Encrypt 都行）。
- `.cc` 在部分用户眼里不像 `.com` 那么"正规"，所以：
    - 首页和 About 里要多一点"专业感"：
        - 清晰的隐私声明
        - 开源链接
        - 简洁但专业的 UI
