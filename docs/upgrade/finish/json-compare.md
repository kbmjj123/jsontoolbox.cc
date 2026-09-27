下面是根据原始 Semrush 报告和本次真实 SERP 结果升级后的 JSON 配置。

这个页面的核心方向是正确的，但原配置存在几个容易导致产品和搜索意图错配的问题：

- `JSON Compare` 和 `JSON Diff` 实际上包含两种不同比较模式：文本 diff 与语义 diff。
- 原配置声称“find every difference”，但数组比较规则、对象键顺序、数字/字符串类型差异都需要明确。
- `URL Input` 不建议默认提供，涉及 CORS、远程数据读取和隐私风险。
- `Copy & Export` 中的“report file”如果没有真正实现，不应提前宣传。
- `Ignore array order` 不是简单开关，数组忽略顺序需要定义匹配规则；对于重复元素和对象数组尤其重要。
- 如果结果是结构化 diff，就不应只用“side-by-side text diff”来描述。

Semrush 报告中：

- `json comparer`：590，KD 26。
- `online json compare`：590，KD 29。
- `json diff online`：590，KD 33。
- `json diff checker`：480，KD 33。
- `compare jsons`：390，KD 39。
- `compare json`：480，KD 39 左右。 [ppl-ai-file-upload.s3.amazonaws](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/47793863/ec2e382e-117d-4dfa-9dd8-1b29a33f6f6a/kd-json-convert-3.md?AWSAccessKeyId=ASIA2F3EMEYESVJFPCET&Signature=KsHnxtfOyl0S5d5%2FD73uhCaPdcM%3D&x-amz-security-token=IQoJb3JpZ2luX2VjEHMaCXVzLWVhc3QtMSJHMEUCIDrApe8FsnbAJidDqFN7aTHZk8bG3q4QZ1SWl5OaRw6GAiEAyecThfVSiCq7G0GyVbXTtymPL91qNiOfuEl2M8D1kY8q8wQIPBABGgw2OTk3NTMzMDk3MDUiDPDKwoGUN0zNavTUWCrQBANPyK7Idms%2BfCN9Ll6piVjnfnRMvE6t8TArMav5%2FPSZjDYtckjv8bh%2B05HbrbEZg4RMiUl8ueGN5I%2By9y053XXWvF7SzOmUgriPptIkE3CoWGYZA1j2aaGCRVf8LtgD6%2BYpw0zWikjZM2svkpW8c8qxfKFecWxoNyMlZvXckNTRQRJH0Bel792HkR9V5cxCLFcpC7igj3d3nmHZaYcepxwwic0lYfZXxEkf6HjXUNu5syqK6oIcgiUj8kFmaSPmmp0kRr3JyAkQSokbdeRVrbda2%2Ff%2Bpap3GlLkW%2Bxh3xYFColWOZgLfXbRX9k1I7IAts2XZjHormfEQEadHw11rCNMmrGfAZXCs%2BE%2FLn%2F6FyWiRt0fefu67Kz2v0f9kW68hP9ZNxplznjieh6m7OIuU4VJl8KlS1OEuoCCnsOpibEM6lYoxwCpC7jTGk%2BQO6TCNHA%2BGwYHRPQaMiDEn8hYHp73ymTaTQtZW%2BgN5%2FsuSTXuwrGbDe7TxblTuEew0I5P3OGceuSxsVLl2sNtogZbJ3qq%2FxwS35xxwoq947oC8ZZetQN%2Frap%2F7saiNumocGe9VBRYqoZkou714NcuQ0kuqGqPjJ1kZHEaILQ3hTama%2BTT3ZatQk0z3mhgoDp%2FxDRcQU970tUs2jnqT7UkuOXQRPC7Zv%2BWK71%2Bj%2FP%2F%2FHe8a9IOOIzTn0WnMOLqwOTf7pafOqvJajQ0jKlTgOTYZ1GclpQAIGnPs94eLfabOVsKftNncrukLT5A2Byxfb1CXiOXU%2F8eRjf0gGBNRND4ckx%2Bp5Qwjcyy1QY6mAHn%2FEzNrSsMm%2FAeT%2FUFtsOMuVbAF%2B%2Fd7QZV4uzmVzSn4V%2BaMsR3UUNaX3OHvD%2FQaeH1NxgZhzEcwS9wQ9HEA9auoXnWT5PoQOybvZwWiFIkdST78V4gMg0QoRlv6f0eLoL%2BPtjyxFKlTvXdHz3iU%2BY%2B7G2083DQnf1W1KvrgAihJLbsRWVsHfY9bPFzXZyMhZ5IXjZSKhAa9A%3D%3D&Expires=1789703136)

实际 SERP 中，竞争工具普遍强调：

- semantic comparison。
- 忽略空格和 key order。
- added / removed / changed。
- type mismatch。
- JSON path。
- side-by-side view。
- filter categories。
- ignore array order。
- file upload。
- browser-only processing。
- JSON Patch 或 merge。

 [testmuai](https://www.testmuai.com/free-online-tools/json-compare/)

以下版本按你当前 UI 中已经出现的功能进行升级，没有把 URL 加载、JSON Patch、merge、filter tree 或报告导出强行写成已经存在的能力。

```json
{
  "name": "JSON Compare",
  "description": "Compare two JSON documents online and identify added, removed, and changed data. This browser-based JSON compare tool performs a structural comparison of objects and arrays, highlights differences by category, and helps you inspect changes by JSON path.",
  "hero": {
    "trustHtml": "Runs in your browser. Your JSON is not uploaded by this tool."
  },
  "meta": {
    "title": "JSON Compare – Free Online JSON Diff Tool",
    "description": "Compare two JSON documents online with a structural JSON diff. Find added, removed, and changed keys and values, sort keys, optionally ignore array order, and review differences in your browser.",
    "keywords": [
      "json compare",
      "json diff",
      "compare json",
      "json diff online",
      "json comparer",
      "json compare online",
      "compare json online",
      "json difference checker"
    ]
  },
  "features": [
    {
      "icon": "lucide:git-compare-arrows",
      "title": "Structural JSON Comparison",
      "description": "Compare parsed JSON objects and arrays by structure and value instead of treating formatting or whitespace as meaningful differences."
    },
    {
      "icon": "lucide:columns-2",
      "title": "Side-by-Side Diff View",
      "description": "Review the original and modified JSON next to each other while the result identifies differences between the two documents."
    },
    {
      "icon": "lucide:highlighter",
      "title": "Added, Removed, and Changed",
      "description": "Separate differences into added, removed, and changed data so you can quickly identify what was introduced, deleted, or modified."
    },
    {
      "icon": "lucide:route",
      "title": "Nested Path Context",
      "description": "Show where a difference occurs within the JSON structure, such as user.profile.name or items [ppl-ai-file-upload.s3.amazonaws](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/47793863/edc8fc68-b83f-44ba-9d4a-11e1b6fef6a9/kd-json-2-2.md?AWSAccessKeyId=ASIA2F3EMEYESVJFPCET&Signature=Ejy8IC5KGI1ojbKwRytmAUEy%2FiA%3D&x-amz-security-token=IQoJb3JpZ2luX2VjEHMaCXVzLWVhc3QtMSJHMEUCIDrApe8FsnbAJidDqFN7aTHZk8bG3q4QZ1SWl5OaRw6GAiEAyecThfVSiCq7G0GyVbXTtymPL91qNiOfuEl2M8D1kY8q8wQIPBABGgw2OTk3NTMzMDk3MDUiDPDKwoGUN0zNavTUWCrQBANPyK7Idms%2BfCN9Ll6piVjnfnRMvE6t8TArMav5%2FPSZjDYtckjv8bh%2B05HbrbEZg4RMiUl8ueGN5I%2By9y053XXWvF7SzOmUgriPptIkE3CoWGYZA1j2aaGCRVf8LtgD6%2BYpw0zWikjZM2svkpW8c8qxfKFecWxoNyMlZvXckNTRQRJH0Bel792HkR9V5cxCLFcpC7igj3d3nmHZaYcepxwwic0lYfZXxEkf6HjXUNu5syqK6oIcgiUj8kFmaSPmmp0kRr3JyAkQSokbdeRVrbda2%2Ff%2Bpap3GlLkW%2Bxh3xYFColWOZgLfXbRX9k1I7IAts2XZjHormfEQEadHw11rCNMmrGfAZXCs%2BE%2FLn%2F6FyWiRt0fefu67Kz2v0f9kW68hP9ZNxplznjieh6m7OIuU4VJl8KlS1OEuoCCnsOpibEM6lYoxwCpC7jTGk%2BQO6TCNHA%2BGwYHRPQaMiDEn8hYHp73ymTaTQtZW%2BgN5%2FsuSTXuwrGbDe7TxblTuEew0I5P3OGceuSxsVLl2sNtogZbJ3qq%2FxwS35xxwoq947oC8ZZetQN%2Frap%2F7saiNumocGe9VBRYqoZkou714NcuQ0kuqGqPjJ1kZHEaILQ3hTama%2BTT3ZatQk0z3mhgoDp%2FxDRcQU970tUs2jnqT7UkuOXQRPC7Zv%2BWK71%2Bj%2FP%2F%2FHe8a9IOOIzTn0WnMOLqwOTf7pafOqvJajQ0jKlTgOTYZ1GclpQAIGnPs94eLfabOVsKftNncrukLT5A2Byxfb1CXiOXU%2F8eRjf0gGBNRND4ckx%2Bp5Qwjcyy1QY6mAHn%2FEzNrSsMm%2FAeT%2FUFtsOMuVbAF%2B%2Fd7QZV4uzmVzSn4V%2BaMsR3UUNaX3OHvD%2FQaeH1NxgZhzEcwS9wQ9HEA9auoXnWT5PoQOybvZwWiFIkdST78V4gMg0QoRlv6f0eLoL%2BPtjyxFKlTvXdHz3iU%2BY%2B7G2083DQnf1W1KvrgAihJLbsRWVsHfY9bPFzXZyMhZ5IXjZSKhAa9A%3D%3D&Expires=1789703136).price, when path information is available in the comparison result."
    },
    {
      "icon": "lucide:list-filter",
      "title": "Comparison Options",
      "description": "Sort object keys before comparison and optionally ignore array order when the position of array items is not meaningful for your data."
    },
    {
      "icon": "lucide:arrow-left-right",
      "title": "Swap Inputs",
      "description": "Swap the original and modified documents to reverse the comparison direction and review additions and removals from the other perspective."
    },
    {
      "icon": "lucide:upload",
      "title": "Paste or Open JSON",
      "description": "Paste two JSON documents or open local JSON files when file input is available. Both documents are parsed in the browser before comparison."
    },
    {
      "icon": "lucide:shield-check",
      "title": "Browser-Based Comparison",
      "description": "JSON parsing and comparison happen in your browser. The page does not require an account or upload the source documents to a comparison server."
    }
  ],
  "guide": [
    {
      "title": "Enter the original JSON",
      "description": "Paste the baseline or original document into JSON A. This is the version used as the starting point for classifying added, removed, and changed values."
    },
    {
      "title": "Enter the modified JSON",
      "description": "Paste the newer or comparison document into JSON B. The tool compares this document against JSON A."
    },
    {
      "title": "Configure comparison rules",
      "description": "Sort object keys when key order should not matter, and enable Ignore array order only when the array represents an unordered collection."
    },
    {
      "title": "Compare and inspect",
      "description": "Click Compare to parse both documents and inspect the difference categories, paths, values, and structure shown by the result."
    },
    {
      "title": "Swap or copy the result",
      "description": "Swap the inputs to reverse the comparison direction, then copy the relevant output or use the displayed differences in debugging, testing, documentation, or code review."
    }
  ],
  "faq": [
    {
      "question": "Does this compare JSON semantically or as plain text?",
      "answer": "The intended comparison is structural: both inputs are parsed as JSON, so whitespace and formatting should not count as data changes. Object key order can also be normalized when Sort Keys is enabled or when the comparison engine treats object order as insignificant."
    },
    {
      "question": "What types of differences can it detect?",
      "answer": "It can classify properties or array values as added, removed, or changed. A type change, such as a number becoming a string or an object becoming an array, should be treated as a changed value or structure according to the comparison result."
    },
    {
      "question": "Does it compare nested objects and arrays?",
      "answer": "Yes. The comparison is recursive for nested JSON objects and arrays. The exact array result depends on whether items are compared by position or by an order-independent rule."
    },
    {
      "question": "What does Sort Keys do?",
      "answer": "Sort Keys normalizes the order of object properties before comparison. This prevents a different property order from being reported as a meaningful data change. It does not sort array items."
    },
    {
      "question": "What does Ignore array order do?",
      "answer": "It treats array position as less important when the array represents an unordered collection. The matching algorithm must still determine how duplicate or similar items are paired, so use this option carefully for arrays containing repeated or partially changed objects."
    },
    {
      "question": "Are arrays compared by index?",
      "answer": "By default, arrays are commonly compared by position, so inserting an item near the beginning can cause later indexes to appear changed. If the data is an unordered collection, enable Ignore array order only when that behavior matches your data model."
    },
    {
      "question": "Can I compare JSON files with different sizes?",
      "answer": "Yes. The documents do not need to contain the same number of properties, rows, or nested levels. Missing properties are reported as removed or added according to the selected comparison direction."
    },
    {
      "question": "Can I compare minified and formatted JSON?",
      "answer": "Yes, provided both inputs are valid JSON. Formatting, indentation, and whitespace should not affect a structural comparison."
    },
    {
      "question": "Can I compare numbers and strings with similar values?",
      "answer": "A structural comparator should distinguish JSON types. For example, the number 1 and the string \"1\" are different values even though they look similar when displayed."
    },
    {
      "question": "Can I reverse the comparison?",
      "answer": "Yes. Use Swap to exchange JSON A and JSON B. This reverses which document is treated as the original and which is treated as the modified version, so additions and removals are viewed from the opposite direction."
    },
    {
      "question": "Can I load JSON from a URL?",
      "answer": "This page is designed primarily for pasted JSON and local file input. Loading arbitrary URLs may fail because of CORS restrictions and may expose remote or private data to the browser. Add URL loading only with appropriate validation and security controls."
    },
    {
      "question": "Can I compare large JSON documents?",
      "answer": "The practical limit depends on browser memory, device performance, document depth, array size, and the complexity of the diff result. Large comparisons may take longer and may require a more compact result view."
    },
    {
      "question": "Is my JSON uploaded to a server?",
      "answer": "This page is designed to parse and compare both documents in your browser without requiring a server upload. You should still avoid entering passwords, API keys, access tokens, private customer data, or confidential production payloads into any browser-based tool."
    },
    {
      "question": "Is this a free JSON compare tool?",
      "answer": "Yes. You can enter two JSON documents, compare their structure and values, and inspect the differences without creating an account."
    }
  ],
  "ui": {
    "label_json_a": "JSON A (Original)",
    "label_json_b": "JSON B (Modified)",
    "btn_compare": "Compare JSON",
    "btn_sort_keys": "Sort object keys",
    "btn_swap": "Swap inputs",
    "btn_ignore_order": "Ignore array order",
    "status_removed": "removed",
    "status_added": "added",
    "status_changed": "changed",
    "status_total": "total differences",
    "label_differences": "Differences",
    "status_identical": "The JSON documents are structurally identical",
    "error_invalid_a": "JSON A is not valid JSON",
    "error_invalid_b": "JSON B is not valid JSON",
    "error_empty_a": "Enter JSON A first",
    "error_empty_b": "Enter JSON B first",
    "status_path": "Path",
    "status_old_value": "Original value",
    "status_new_value": "Modified value"
  },
  "article": {
    "title": "How to Compare JSON Files Online",
    "content": "<h2>What Is a JSON Compare Tool?</h2><p>A JSON compare tool examines two JSON documents and reports how their structure and values differ. It is useful when you need to compare API responses, configuration files, test fixtures, exported data, or two versions of a payload.</p><p>A structural JSON comparison parses the documents before comparing them. This means formatting, indentation, and whitespace do not normally count as changes. The result can focus on meaningful data differences such as added properties, removed properties, changed values, and type changes.</p><h2>Common Use Cases</h2><ul><li><strong>API debugging:</strong> Compare expected and actual responses to locate missing fields, changed values, or unexpected types.</li><li><strong>Configuration review:</strong> Compare environment-specific files or old and new configuration versions.</li><li><strong>Data migration:</strong> Check whether records changed during an export, import, or transformation.</li><li><strong>Regression testing:</strong> Compare snapshot outputs, test fixtures, or serialized results.</li><li><strong>Code review:</strong> Review JSON payload changes without manually scanning two large documents.</li><li><strong>Webhook and event debugging:</strong> Compare two event payloads to identify changes in nested properties or metadata.</li></ul><h2>How to Compare Two JSON Documents</h2><ol><li><strong>Enter JSON A:</strong> Paste the original or baseline document into the first editor.</li><li><strong>Enter JSON B:</strong> Paste the modified or newer document into the second editor.</li><li><strong>Choose normalization options:</strong> Sort object keys when property order should not matter. Use Ignore array order only when array position is semantically irrelevant.</li><li><strong>Run the comparison:</strong> Click Compare JSON to parse and compare both inputs.</li><li><strong>Review the result:</strong> Inspect added, removed, and changed values together with their paths and old or new values when available.</li><li><strong>Reverse the view if needed:</strong> Use Swap inputs to treat JSON B as the original and JSON A as the modified version.</li></ol><h2>Added, Removed, and Changed Values</h2><ul><li><strong>Added:</strong> A property or array value appears in JSON B but not in JSON A.</li><li><strong>Removed:</strong> A property or array value appears in JSON A but not in JSON B.</li><li><strong>Changed:</strong> A property exists in both documents but its value, type, or nested structure differs.</li><li><strong>Identical:</strong> Both documents represent the same data under the selected normalization rules.</li></ul><h2>Structural Diff vs Text Diff</h2><p>A text diff compares lines and characters. It may show many changes when a JSON document is only reformatted or when object properties are reordered. A structural diff parses JSON first and compares objects, arrays, values, and types. This is usually more useful when the question is whether the data changed rather than whether the text changed.</p><p>Text diffs are still useful when whitespace, formatting, comments in JSON-like formats, or exact source representation matters. Choose the comparison method that matches the question you are trying to answer.</p><h2>Object Key Order and Array Order</h2><p>Object properties are generally treated as named fields, so their order should not determine whether two JSON objects contain the same data. Sorting keys can make this behavior explicit. Arrays are different: their order may be meaningful, such as a ranked list, timeline, or ordered set of steps.</p><p>Do not enable Ignore array order simply to reduce the number of differences. Use it only when the array represents an unordered collection. Matching arrays without order can also be ambiguous when several items are identical or have similar fields.</p><h2>Type Changes Matter</h2><p>JSON values have different types. The number <code>1</code>, the string <code>\"1\"</code>, the boolean <code>true</code>, the null value <code>null</code>, an object, and an array are not interchangeable. A useful comparator should report type changes because they can break API clients, validation rules, calculations, and application logic.</p><h2>Reading JSON Paths</h2><p>A difference path identifies where a change occurs. Examples include <code>user.name</code>, <code>settings.timeout</code>, or <code>items [ppl-ai-file-upload.s3.amazonaws](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/47793863/edc8fc68-b83f-44ba-9d4a-11e1b6fef6a9/kd-json-2-2.md?AWSAccessKeyId=ASIA2F3EMEYESVJFPCET&Signature=Ejy8IC5KGI1ojbKwRytmAUEy%2FiA%3D&x-amz-security-token=IQoJb3JpZ2luX2VjEHMaCXVzLWVhc3QtMSJHMEUCIDrApe8FsnbAJidDqFN7aTHZk8bG3q4QZ1SWl5OaRw6GAiEAyecThfVSiCq7G0GyVbXTtymPL91qNiOfuEl2M8D1kY8q8wQIPBABGgw2OTk3NTMzMDk3MDUiDPDKwoGUN0zNavTUWCrQBANPyK7Idms%2BfCN9Ll6piVjnfnRMvE6t8TArMav5%2FPSZjDYtckjv8bh%2B05HbrbEZg4RMiUl8ueGN5I%2By9y053XXWvF7SzOmUgriPptIkE3CoWGYZA1j2aaGCRVf8LtgD6%2BYpw0zWikjZM2svkpW8c8qxfKFecWxoNyMlZvXckNTRQRJH0Bel792HkR9V5cxCLFcpC7igj3d3nmHZaYcepxwwic0lYfZXxEkf6HjXUNu5syqK6oIcgiUj8kFmaSPmmp0kRr3JyAkQSokbdeRVrbda2%2Ff%2Bpap3GlLkW%2Bxh3xYFColWOZgLfXbRX9k1I7IAts2XZjHormfEQEadHw11rCNMmrGfAZXCs%2BE%2FLn%2F6FyWiRt0fefu67Kz2v0f9kW68hP9ZNxplznjieh6m7OIuU4VJl8KlS1OEuoCCnsOpibEM6lYoxwCpC7jTGk%2BQO6TCNHA%2BGwYHRPQaMiDEn8hYHp73ymTaTQtZW%2BgN5%2FsuSTXuwrGbDe7TxblTuEew0I5P3OGceuSxsVLl2sNtogZbJ3qq%2FxwS35xxwoq947oC8ZZetQN%2Frap%2F7saiNumocGe9VBRYqoZkou714NcuQ0kuqGqPjJ1kZHEaILQ3hTama%2BTT3ZatQk0z3mhgoDp%2FxDRcQU970tUs2jnqT7UkuOXQRPC7Zv%2BWK71%2Bj%2FP%2F%2FHe8a9IOOIzTn0WnMOLqwOTf7pafOqvJajQ0jKlTgOTYZ1GclpQAIGnPs94eLfabOVsKftNncrukLT5A2Byxfb1CXiOXU%2F8eRjf0gGBNRND4ckx%2Bp5Qwjcyy1QY6mAHn%2FEzNrSsMm%2FAeT%2FUFtsOMuVbAF%2B%2Fd7QZV4uzmVzSn4V%2BaMsR3UUNaX3OHvD%2FQaeH1NxgZhzEcwS9wQ9HEA9auoXnWT5PoQOybvZwWiFIkdST78V4gMg0QoRlv6f0eLoL%2BPtjyxFKlTvXdHz3iU%2BY%2B7G2083DQnf1W1KvrgAihJLbsRWVsHfY9bPFzXZyMhZ5IXjZSKhAa9A%3D%3D&Expires=1789703136).price</code>. Paths help you move from a high-level statement such as “the payload changed” to the exact property that needs review.</p><h2>Comparing API Responses</h2><p>When comparing API responses, normalize values that are intentionally dynamic, such as timestamps, request IDs, pagination tokens, or generated trace IDs. If the tool does not support ignored paths, remove or preprocess those fields before comparison. Otherwise, expected runtime differences may obscure meaningful changes.</p><h2>Limitations of JSON Comparison</h2><ul><li><strong>Array matching:</strong> Order-independent comparison requires a matching strategy and can be ambiguous for duplicate objects.</li><li><strong>Large documents:</strong> Recursive parsing and a detailed diff can require substantial browser memory.</li><li><strong>Dynamic fields:</strong> Timestamps, IDs, and randomized values may create differences that are not defects.</li><li><strong>JSON only:</strong> Comments, trailing commas, and JSON5 syntax are not valid standard JSON unless a separate parser is provided.</li><li><strong>Semantic meaning:</strong> A diff identifies structural and value changes but cannot determine whether a change is correct for your business logic.</li></ul><h2>Browser-Based Privacy</h2><p>This comparison tool is designed to parse both JSON documents in the browser rather than sending them to a remote comparison service. That can be useful for development payloads and private configuration samples. It is not a substitute for secure secret handling, so avoid entering credentials, tokens, private customer information, or production secrets into any online tool.</p><h2>Local Alternatives</h2><p>For automated testing, CI pipelines, very large files, or confidential data, consider a local command-line or programming-library workflow. Tools such as <code>jq</code> can normalize JSON before a standard diff, while application-specific test libraries can compare selected fields or ignore known dynamic paths.</p>"
  }
}
```

## 主要调整说明

### 1. 将核心定位从“文本对比”改为“结构化对比”

原配置中同时写了：

> side-by-side  
> highlight differences  
> added, removed, changed

但没有说明比较是：

- 字符串级别。
- 行级别。
- 解析后的结构级别。

真实 SERP 中，TestMu AI、SemanticDiff、PlayCode、JSONToolkit、CompareJSON 和 JSONCompare 都把 semantic comparison 作为重要卖点。 [testmuai](https://www.testmuai.com/free-online-tools/json-compare/)

因此新版明确：

> structural comparison

并说明：

- 空格和格式不应造成差异。
- 对象 key 顺序可以忽略。
- 数组顺序需要单独处理。
- 类型变化需要报告。

如果你的实现目前只是把 JSON 格式化后做文本 diff，就不应使用：

```text
semantic comparison
structural diff
ignore array order
```

这时应将页面描述改为：

```text
Compare formatted JSON text and highlight line-level differences.
```

### 2. 对 `Ignore array order` 增加边界说明

原配置只提供：

```text
Ignore array order
```

但没有说明它的匹配规则。对于：

```json
[
  { "id": 1, "name": "A" },
  { "id": 2, "name": "B" }
]
```

和：

```json
[
  { "id": 2, "name": "B" },
  { "id": 1, "name": "A" }
]
```

可以认为只是顺序变化。

但对于：

```json
[
  { "name": "A" },
  { "name": "A" }
]
```

或者对象部分字段变化的数组，忽略顺序需要定义：

- 按完整深度相等匹配。
- 按某个 key 匹配。
- 多重集合匹配。
- 是否允许重复项。
- 是否按最小差异匹配。

因此新版没有承诺“忽略数组顺序后一定得到唯一正确结果”，而是明确提示：

> The matching algorithm must still determine how duplicate or similar items are paired.

如果想提升功能，建议未来增加：

```text
Array matching:
- By index
- Unordered deep match
- Match by key
```

例如：

```text
Match array items by:
[id]
```

这会比单一 `Ignore array order` 更专业。

### 3. 删除 URL Input feature

原配置中：

```text
Load JSON from a URL using the ?url= parameter
```

和前面的 JSON/YAML 工具一样，这会带来：

- CORS 限制。
- 远程私有数据暴露。
- 可能读取带 token 的 URL。
- URL 重定向和响应大小风险。
- 页面被误用为远程内容读取工具。

真实 SERP 中确实有工具支持 URL 加载，例如 TestMu AI、CompareJSON 和 ExtendsClass，但这不代表它适合默认实现。 [testmuai](https://www.testmuai.com/free-online-tools/json-compare/)

当前升级版改成了 FAQ 中的谨慎说明。如果后续实现 URL 比较，建议：

- 只允许 HTTPS。
- 不自动携带 credentials。
- 限制响应体大小。
- 处理 CORS。
- 禁止 localhost 和私有网段。
- 明确告知用户远程数据会被加载到当前页面。
- 不将 URL 参数中的 token 记录到分析系统。

### 4. `Copy & Export` 改为更保守的表述

原配置：

> download them as a report file

但 UI 中没有：

```text
btn_export
btn_download_report
```

因此新版只保留：

> copy the relevant output or use the displayed differences

如果你确实实现了报告下载，应明确报告格式：

```text
Download JSON diff report
Download Markdown report
Download HTML report
Download JSON Patch
```

不同格式的使用场景不同，不建议笼统写 `report file`。

### 5. 增加 JSON type change 说明

JSON 比较不能只关注：

- key added。
- key removed。
- value changed。

以下变化同样非常重要：

```json
{ "value": 1 }
```

变为：

```json
{ "value": "1" }
```

或者：

```json
{ "value": null }
```

变为：

```json
{ "value": [] }
```

这些变化可能导致：

- API 客户端崩溃。
- schema validation 失败。
- 前端渲染错误。
- 数字计算异常。
- 数据库导入失败。

新版在 FAQ 和 article 中明确将 type change 作为变化类型之一。

### 6. 用“path”增强结果解释

真实竞品已经开始强调：

- exact paths。
- field-level changes。
- JSONPath-like location。
- old/new values。

 [forgejson](https://forgejson.com/tools/json-diff)

因此新版加入：

```text
Nested Path Context
```

并在 UI 中加入：

```text
status_path
status_old_value
status_new_value
```

例如：

```text
Path: users [ppl-ai-file-upload.s3.amazonaws](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/47793863/edc8fc68-b83f-44ba-9d4a-11e1b6fef6a9/kd-json-2-2.md?AWSAccessKeyId=ASIA2F3EMEYESVJFPCET&Signature=Ejy8IC5KGI1ojbKwRytmAUEy%2FiA%3D&x-amz-security-token=IQoJb3JpZ2luX2VjEHMaCXVzLWVhc3QtMSJHMEUCIDrApe8FsnbAJidDqFN7aTHZk8bG3q4QZ1SWl5OaRw6GAiEAyecThfVSiCq7G0GyVbXTtymPL91qNiOfuEl2M8D1kY8q8wQIPBABGgw2OTk3NTMzMDk3MDUiDPDKwoGUN0zNavTUWCrQBANPyK7Idms%2BfCN9Ll6piVjnfnRMvE6t8TArMav5%2FPSZjDYtckjv8bh%2B05HbrbEZg4RMiUl8ueGN5I%2By9y053XXWvF7SzOmUgriPptIkE3CoWGYZA1j2aaGCRVf8LtgD6%2BYpw0zWikjZM2svkpW8c8qxfKFecWxoNyMlZvXckNTRQRJH0Bel792HkR9V5cxCLFcpC7igj3d3nmHZaYcepxwwic0lYfZXxEkf6HjXUNu5syqK6oIcgiUj8kFmaSPmmp0kRr3JyAkQSokbdeRVrbda2%2Ff%2Bpap3GlLkW%2Bxh3xYFColWOZgLfXbRX9k1I7IAts2XZjHormfEQEadHw11rCNMmrGfAZXCs%2BE%2FLn%2F6FyWiRt0fefu67Kz2v0f9kW68hP9ZNxplznjieh6m7OIuU4VJl8KlS1OEuoCCnsOpibEM6lYoxwCpC7jTGk%2BQO6TCNHA%2BGwYHRPQaMiDEn8hYHp73ymTaTQtZW%2BgN5%2FsuSTXuwrGbDe7TxblTuEew0I5P3OGceuSxsVLl2sNtogZbJ3qq%2FxwS35xxwoq947oC8ZZetQN%2Frap%2F7saiNumocGe9VBRYqoZkou714NcuQ0kuqGqPjJ1kZHEaILQ3hTama%2BTT3ZatQk0z3mhgoDp%2FxDRcQU970tUs2jnqT7UkuOXQRPC7Zv%2BWK71%2Bj%2FP%2F%2FHe8a9IOOIzTn0WnMOLqwOTf7pafOqvJajQ0jKlTgOTYZ1GclpQAIGnPs94eLfabOVsKftNncrukLT5A2Byxfb1CXiOXU%2F8eRjf0gGBNRND4ckx%2Bp5Qwjcyy1QY6mAHn%2FEzNrSsMm%2FAeT%2FUFtsOMuVbAF%2B%2Fd7QZV4uzmVzSn4V%2BaMsR3UUNaX3OHvD%2FQaeH1NxgZhzEcwS9wQ9HEA9auoXnWT5PoQOybvZwWiFIkdST78V4gMg0QoRlv6f0eLoL%2BPtjyxFKlTvXdHz3iU%2BY%2B7G2083DQnf1W1KvrgAihJLbsRWVsHfY9bPFzXZyMhZ5IXjZSKhAa9A%3D%3D&Expires=1789703136).profile.email
Original: alice@example.com
Modified: alice@new-example.com
```

这比只用颜色展示更适合开发者调试和 bug report。

### 7. “every difference”不应无条件承诺

原配置多次写：

> find every difference

这个说法太绝对，尤其是在：

- 大文件。
- 深度嵌套。
- 数组忽略顺序。
- 重复对象。
- 动态字段。
- 类型变更。
- 循环数据不可能存在于标准 JSON，但 JSON5/扩展语法可能出现。

新版改为：

> identify added, removed, and changed data

并把具体能力限制在当前实现可以合理保证的范围内。

## 实际 SERP 下的竞争差异

目前 JSON Compare SERP 已经不只是两个文本框：

| 竞品方向 | 常见功能 |
|---|---|
| TestMu AI | 语义比较、type changes、URL、文件、分类统计 |
| SemanticDiff | 忽略 whitespace、side-by-side、prettify |
| PlayCode | merge、three-way diff、array key matching、JSON Patch |
| JSONLint | added/deleted/changed、颜色标记 |
| Forge Json | 按 path 输出 changed-field report |
| JSONToolkit | text diff + structural diff |
| Braxik | filter tree、expand/collapse、ignore array order |
| ExtendsClass | URL、文件、参数化 URL、semantic compare |

 [testmuai](https://www.testmuai.com/free-online-tools/json-compare/)

因此，第一版至少需要做到：

1. 解析后比较，而不是纯文本比较。
2. 忽略无意义 whitespace。
3. 对象 key order 不造成误报。
4. 明确区分 added、removed、changed。
5. 显示 JSON path。
6. 显示旧值和新值。
7. 支持嵌套对象。
8. 明确数组比较规则。
9. 错误提示包含 JSON A/B。
10. 本地处理说明真实可信。

## 页面优先级判断

| 维度 | 评价 |
|---|---|
| 搜索需求 | 高 |
| 工具意图 | 很强 |
| KD | 中等 |
| 竞争页面成熟度 | 偏高 |
| 技术复杂度 | 中高 |
| 当前产品适配度 | 很高 |
| 初期流量难度 | 中等偏高 |
| 长期用户价值 | 很高 |

这个页面不一定比 YAML to JSON 更容易获得早期流量，但用户意图更强，使用频率和开发者价值通常更高。它也非常适合做 JsonToolBox 的核心功能之一。

推荐页面标题从：

```text
JSON Compare — Free Online JSON Diff Tool
```

调整为：

```text
JSON Compare – Free Online Structural Diff Tool
```

前提是实现确实是结构化 diff。如果目前只是文本 diff，则应使用：

```text
JSON Text Diff – Compare JSON Files Online
```

最终判断是：**JSON Compare 值得做，但页面成败取决于比较语义是否清晰。** 真正有竞争力的不是单纯左右两个输入框，而是让用户知道“哪个字段变了、原值是什么、新值是什么、数组为什么被判定为不同，以及 key 顺序是否影响结果”。