下面是根据原始 Semrush 报告和本次真实 SERP 结果升级后的 JSON 配置。

这页需要先做一个关键定位修正：**当前配置实际上生成的是 CSV，而不是 Excel/XLSX 文件**。因此原来的页面名、主标题和 `Excel Export` 等内容容易造成误导。真实 SERP 中，用户搜索 `JSON to Excel` 时，很多结果明确提供真正的 `.xlsx` 工作簿，而不是“Excel-compatible CSV”。例如 TableConvert、JSONBase、JSONToolkit 和 JSONViewerTool 都将 `.xlsx` 作为主要输出格式。 [tableconvert](https://tableconvert.com/json-to-excel)

Semrush 报告中：

- `convert json to excel`：880，KD 31。
- `json to excel converter`：720，KD 29。
- `json to excel converter online`：170，KD 22。
- `json to xlsx converter`：320，KD 16。
- `json to xls`：260，KD 26。
- `convert json to xls`：260，KD 26。 [ppl-ai-file-upload.s3.amazonaws](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/47793863/ec2e382e-117d-4dfa-9dd8-1b29a33f6f6a/kd-json-convert-3.md?AWSAccessKeyId=ASIA2F3EMEYE5MLKQI45&Signature=tpfeC9dw40f38MRKVnwKXk79ZYU%3D&x-amz-security-token=IQoJb3JpZ2luX2VjEHMaCXVzLWVhc3QtMSJHMEUCID3lRjYhDkJhymNpLZ2VdN9e4IoPiljczLVJwJyO1M%2F2AiEA5Xz%2F52mqC0U7UUL7L6TfbQYejIObs6jMA630gw2FdRIq8wQIPBABGgw2OTk3NTMzMDk3MDUiDK4NKQOKtvSE6HlgPirQBFm1lPeV%2BWEvvOsW9JwZv6ei65Qg%2BRMNONBCYHCbkkdr5cDq4pbmzBDd7k33Q2N8jzPnC2IOuQfT%2BeE6wC5FyPuTeMb5ayEftVUClDuNi2xSx8BYziHgCsY%2BziFs38cWxLcx%2B7bPQ%2BFdfIpiJ7XIqX%2FpvDCoUWcu2fkQdBfPWYMuZ79Hg4WJr6NRP%2B8OoIIkF0kz9m34SvmoEtBMGGjYBEUUGpESKvVuYxgmV%2F7BzAIvZ2UWGAnqaeM5riRT%2F2fd0xs00Xmej%2FDyEKMOkp5RPpSrhoGmuzvhop47yHYHGchHw5%2F7wh%2BwILZ%2BknrYKI%2Fra4B%2FWmC3CuuEinX%2B6ruc2znzSBab%2FcKqbjLT%2F034qDkEOfK1%2BZPC5UNfxvDDavy30qx37WN0mjAYQ9OrTNJeVb53NQpDF6HK7eWIApfKZB%2FqFoinnHFAVQXie4kJGLe4A8uCj96uCygNUZaJNRW%2BBDY7Ib7gDbFXNhOMtQL19EGR7XGB%2FZ0raFsJdnvx92P0XHOw7eh6RywU2DEdye4W0SNJaSi3ExmPu1GHsBgMXROlV9JnClVkV%2FxSCiD53CV4Cf4ns%2B%2FWN%2FScSrYxNods5ebKGo5G7C30Je%2BhQFlcQLhL%2FBwLQhChFadvRfg%2BYKjo%2BmOswfv9VRNucWVjNk2oBnOWCfbBGkTU2DTc2OJtU9hDhoNPLdxtyb9LGLJiJOxvWLIZbF10uy1Xn%2Fqe5Uo3iLstsmFCDM1mdMfkCTuvd2dWvph%2BL69njMX4uaKKxhOrxXF7uLn7lf%2Bz61ECOtxt3tgw4Mmy1QY6mAE2cePznBOb7rFeqGXmbtKOyg6%2Ft79tU7bzoO4K9L29dgF519%2FRwfQRHR9GOVLcGT7fSmiI77YH74%2FjhMo81yYI57iyeRGT47D2lpB4XXhbg7KRUo5jIt3YjRWVJ%2Ba%2ByhYnxHpIDvkJWPwQkgj2%2F5GVnNbuxKuX73OiZb8TQUcS7rW0Sfw5oRHI2amTqTExi9auRAEE9tMzJw%3D%3D&Expires=1789702835)

因此，如果当前页面继续只输出 CSV，建议将 SEO 定位调整为“JSON to CSV for Excel”，而不是直接承诺“JSON to Excel”。以下版本按照你现有功能真实输出 CSV 的前提进行升级。

```json
{
  "name": "JSON to CSV for Excel",
  "description": "Convert JSON arrays to spreadsheet-ready CSV for Excel, Google Sheets, and other spreadsheet applications. Choose a delimiter, include or omit headers, flatten nested objects, preview the result, and download the CSV directly from your browser.",
  "ui": {
    "label_input": "Input JSON",
    "label_preview": "CSV Preview",
    "option_delimiter": "Delimiter:",
    "option_delimiter_comma": "Comma (,)",
    "option_delimiter_semicolon": "Semicolon (;)",
    "option_delimiter_tab": "Tab",
    "option_include_header": "Include header row",
    "option_flatten": "Flatten nested objects",
    "btn_convert": "Convert to CSV",
    "btn_example": "Load Example",
    "btn_download": "Download CSV",
    "status_rows": "{count} rows",
    "placeholder_preview": "CSV preview will appear here...",
    "error_not_array": "Input must be a JSON array of objects",
    "error_empty": "The JSON array is empty",
    "error_invalid_row": "Each array item must be a JSON object",
    "error_no_columns": "No exportable fields were found"
  },
  "hero": {
    "trustHtml": "Runs in your browser. Your JSON is not uploaded by this tool."
  },
  "meta": {
    "title": "JSON to CSV for Excel – Free Online Converter",
    "description": "Convert JSON arrays to CSV for Excel and Google Sheets. Choose a delimiter, flatten nested objects, preview the rows, and download a spreadsheet-ready CSV file. Free and browser-based.",
    "keywords": [
      "json to excel",
      "json to excel converter",
      "convert json to excel",
      "json to csv for excel",
      "json array to excel",
      "json to spreadsheet",
      "json to xlsx converter",
      "json to csv converter"
    ]
  },
  "features": [
    {
      "icon": "lucide:file-spreadsheet",
      "title": "Spreadsheet-Ready CSV",
      "description": "Convert a JSON array of records into CSV that can be opened or imported in Excel, Google Sheets, LibreOffice Calc, and other spreadsheet applications."
    },
    {
      "icon": "lucide:table-2",
      "title": "Preview Rows and Columns",
      "description": "Review the generated rows and detected columns before downloading. This helps you identify missing fields, unexpected values, or incorrect nested-data handling."
    },
    {
      "icon": "lucide:separator-horizontal",
      "title": "Choose a Delimiter",
      "description": "Select comma, semicolon, or tab output according to your spreadsheet application and regional settings. The selected delimiter is used when generating the downloaded text file."
    },
    {
      "icon": "lucide:layers-2",
      "title": "Flatten Nested Objects",
      "description": "Convert nested object paths into flat columns such as address.city or user.name. Nested arrays may require additional handling because CSV represents data in rows and columns."
    },
    {
      "icon": "lucide:heading-1",
      "title": "Optional Header Row",
      "description": "Include column names in the first row or omit the header when preparing data for an existing spreadsheet or downstream import workflow."
    },
    {
      "icon": "lucide:copy",
      "title": "Copy CSV Text",
      "description": "Copy the generated CSV text to your clipboard for quick pasting into Excel, Google Sheets, a spreadsheet editor, or another compatible application."
    },
    {
      "icon": "lucide:download",
      "title": "Download CSV",
      "description": "Save the result as a .csv file. The output is CSV rather than a native .xlsx workbook, so use Excel's import options if you need to choose encoding or delimiter settings."
    },
    {
      "icon": "lucide:shield-check",
      "title": "Browser-Based Processing",
      "description": "JSON parsing and CSV generation happen in your browser. The page does not require an account or upload the source JSON to a conversion server."
    }
  ],
  "guide": [
    {
      "title": "Enter your JSON",
      "description": "Paste a JSON array of objects into the input field or open a .json file. For spreadsheet conversion, each object should represent one record."
    },
    {
      "title": "Configure the output",
      "description": "Choose the delimiter, decide whether to include a header row, and enable Flatten nested objects if your records contain nested object properties."
    },
    {
      "title": "Convert and preview",
      "description": "Click Convert to CSV and inspect the preview. Check the detected columns, row count, missing values, and representation of nested fields before downloading."
    },
    {
      "title": "Copy or download",
      "description": "Copy the CSV text or download the .csv file. Open it in Excel or import it into Google Sheets using the delimiter and encoding settings that match your data."
    }
  ],
  "example": {
    "input": "[\n  { \"product\": \"Laptop\", \"price\": 999, \"quantity\": 5 },\n  { \"product\": \"Mouse\", \"price\": 25, \"quantity\": 50 }\n]",
    "output": "product,price,quantity\nLaptop,999,5\nMouse,25,50",
    "useCase": "Export product records to a CSV file that can be opened in Excel for analysis and reporting."
  },
  "faq": [
    {
      "question": "Does this create a real Excel XLSX file?",
      "answer": "This page generates CSV, not a native .xlsx workbook. CSV files can be opened or imported in Excel and other spreadsheet applications, but they do not contain Excel workbook features such as multiple worksheets, cell formatting, formulas, or workbook metadata."
    },
    {
      "question": "How can I convert JSON to Excel using this tool?",
      "answer": "Paste a JSON array of objects, configure the delimiter and header option, convert the data to CSV, and open or import the downloaded CSV in Excel. If you need a native .xlsx file, use a JSON to XLSX tool that explicitly generates an Excel workbook."
    },
    {
      "question": "Can I open the output in Google Sheets?",
      "answer": "Yes. Upload the CSV to Google Sheets or use File → Import. If the columns are not separated correctly, select the delimiter used during conversion or choose the separator manually during import."
    },
    {
      "question": "What JSON structure works best?",
      "answer": "The recommended input is a top-level JSON array of objects, such as [{\"product\":\"Laptop\",\"price\":999},{\"product\":\"Mouse\",\"price\":25}]. Each object becomes a row and its fields become columns."
    },
    {
      "question": "Can I convert a JSON object instead of an array?",
      "answer": "This page is designed mainly for arrays of records. If the useful records are inside a wrapper object such as {\"items\":[...]}, extract the items array before converting unless the current implementation provides a row-path selector."
    },
    {
      "question": "Does it support nested JSON objects?",
      "answer": "Yes. Enable Flatten nested objects to represent nested paths as flat columns, such as customer.name or address.city. Nested arrays do not always map cleanly to a single spreadsheet row and may be serialized or require a separate transformation."
    },
    {
      "question": "Can I choose comma, semicolon, or tab output?",
      "answer": "Yes. Select the delimiter that matches your spreadsheet application's import settings and regional conventions. Comma is common internationally, while semicolon is used by some spreadsheet locales."
    },
    {
      "question": "Can I remove the header row?",
      "answer": "Yes. Disable Include header row when the destination already defines the column names or when you are appending records to an existing spreadsheet structure."
    },
    {
      "question": "Does the CSV include UTF-8 BOM?",
      "answer": "The answer depends on the current download implementation. If the page adds a UTF-8 BOM, it can improve direct opening of multilingual CSV files in some Excel environments. Otherwise, use Excel's import workflow and explicitly select UTF-8 when characters are displayed incorrectly."
    },
    {
      "question": "Can I convert large JSON files?",
      "answer": "The practical limit depends on browser memory, device performance, the number of records and columns, and the complexity of nested values. Very large files may take longer to parse, preview, and download."
    },
    {
      "question": "Is my JSON uploaded to a server?",
      "answer": "This page is designed to parse the JSON and generate CSV in your browser without requiring a server upload. You should still avoid entering passwords, API keys, access tokens, or confidential production data into any browser-based tool."
    },
    {
      "question": "Is this a free JSON to Excel converter?",
      "answer": "It is a free JSON-to-CSV converter designed for Excel-compatible workflows. It does not create a native Excel workbook unless a separate XLSX export function is implemented."
    }
  ],
  "article": {
    "title": "How to Convert JSON to Excel with a CSV Export",
    "content": "<h2>JSON to Excel vs JSON to CSV</h2><p>Many people search for a JSON to Excel converter when they want to inspect JSON records in a spreadsheet. There are two different technical outputs: CSV is a plain-text, delimited file that Excel can open, while XLSX is a native Excel workbook with worksheets, formatting, formulas, and workbook metadata.</p><p>This page converts JSON to CSV for Excel and other spreadsheet applications. It is useful when you need a simple tabular export without creating a full XLSX workbook. If you specifically require a native .xlsx file, choose a converter that explicitly generates XLSX rather than only renaming or downloading a CSV file with an Excel-related label.</p><h2>How to Convert JSON to Excel-Compatible CSV</h2><ol><li><strong>Enter JSON:</strong> Paste a JSON array of objects or open a .json file.</li><li><strong>Check the records:</strong> Confirm that each array item represents one row. If the data is wrapped in an object, identify the array that contains the records.</li><li><strong>Choose formatting:</strong> Select comma, semicolon, or tab as the delimiter, then decide whether to include a header row.</li><li><strong>Flatten nested objects:</strong> Enable flattening when nested fields should become columns such as <code>user.name</code> or <code>address.city</code>.</li><li><strong>Preview the result:</strong> Review the columns, values, missing fields, and row count before exporting.</li><li><strong>Download or copy:</strong> Save the CSV file or copy the CSV text, then open or import it in Excel or another spreadsheet application.</li></ol><h2>Example JSON Structure</h2><p>A simple array of objects is the most suitable input:</p><pre><code>[{\"product\":\"Laptop\",\"price\":999,\"quantity\":5},{\"product\":\"Mouse\",\"price\":25,\"quantity\":50}]</code></pre><p>The resulting spreadsheet-style CSV has one header row followed by one row for each object:</p><pre><code>product,price,quantity\nLaptop,999,5\nMouse,25,50</code></pre><h2>Flattening Nested JSON</h2><p>Spreadsheet tables are flat, but JSON can contain nested objects and arrays. When flattening is enabled, nested object paths can become dot-notation columns:</p><pre><code>{\"product\":\"Laptop\",\"manufacturer\":{\"name\":\"Example Corp\"},\"warehouse\":{\"city\":\"Austin\"}}</code></pre><p>Possible flat columns include <code>product</code>, <code>manufacturer.name</code>, and <code>warehouse.city</code>. Nested arrays require a separate mapping decision because one JSON record may contain multiple child values. Depending on the implementation, an array can be serialized into one cell, joined as text, expanded into multiple columns, or transformed into multiple rows.</p><h2>Choosing a Delimiter</h2><p>Comma-separated output is the most common CSV format, but spreadsheet applications and regional settings may expect a semicolon or tab. If all values appear in one Excel column, import the file through Excel's data import workflow and choose the delimiter used by the converter.</p><ul><li><strong>Comma:</strong> Common for standard CSV files and many international workflows.</li><li><strong>Semicolon:</strong> Used by some regional spreadsheet configurations where comma is a decimal separator.</li><li><strong>Tab:</strong> Useful when pasting tabular data into spreadsheets or text-based systems.</li></ul><h2>Header Rows and Missing Fields</h2><p>A header row makes the CSV easier to interpret because it contains the column names. Disable the header option only when the receiving workflow already defines the columns or expects data rows without headers.</p><p>JSON records may not contain identical keys. A converter can collect fields across the records and leave an empty cell when a particular record does not contain a field. This preserves row alignment but may create a wide spreadsheet when the source has many optional properties.</p><h2>CSV Is Not the Same as XLSX</h2><p>CSV stores text values separated by a delimiter. It does not preserve the full JSON structure and does not contain native workbook features. CSV normally cannot represent multiple worksheets, cell styling, formulas, merged cells, or rich data types in the same way as XLSX.</p><p>Use CSV when you need a lightweight interchange file, simple spreadsheet analysis, or a format accepted by a data-import workflow. Use a real XLSX converter when you need an Excel workbook, multiple sheets, formatting, type preservation, or direct workbook features.</p><h2>Opening Multilingual CSV Files in Excel</h2><p>UTF-8 is generally the safest encoding for multilingual data. Microsoft explains that a UTF-8 CSV saved with a byte order mark can be opened correctly in Excel, while a file without a BOM may need to be imported through Excel's text or data-import workflow with UTF-8 selected manually.[164][166]</p><p>A UTF-8 BOM can help in some Excel environments, but it is not a guarantee for every application or operating system. Test a representative file containing Chinese, accented, or other non-ASCII characters before using the export in a production workflow.</p><h2>Common Conversion Problems</h2><ul><li><strong>Input is not an array:</strong> The page expects a collection of records rather than a single wrapper object.</li><li><strong>Columns are in one field:</strong> The spreadsheet imported the file with the wrong delimiter.</li><li><strong>Characters are garbled:</strong> Choose UTF-8 during import or use a UTF-8 CSV with BOM when available.</li><li><strong>Nested values look incorrect:</strong> Enable flattening for objects and check how nested arrays are represented.</li><li><strong>Too many columns:</strong> Select only the fields you need or avoid flattening unnecessary branches.</li><li><strong>Large file is slow:</strong> Reduce the dataset, limit the preview, or process the file in smaller parts.</li></ul><h2>Browser-Based Privacy</h2><p>This page is designed to parse JSON and create CSV in the browser rather than sending the source data to a remote conversion service. That can be useful for development and internal data review. It should not be treated as a secret-management system, so avoid entering credentials, API keys, customer data, or production secrets into any online tool.</p>"
  }
}
```

## 为什么必须改名或补充真正 XLSX

原配置中的这些表述存在明显不一致：

```text
"name": "JSON to Excel Converter"
"btn_convert": "Convert to CSV"
"btn_download": "Download CSV"
"description": "Excel-compatible format"
```

这实际上描述的是：

> JSON → CSV for Excel

而不是：

> JSON → Excel Workbook / XLSX

真实 SERP 中，`JSON to Excel` 的竞争页面越来越多地强调：

- 生成真实 `.xlsx` 文件。
- 多 worksheet。
- XLSX 下载。
- 数据类型保留。
- 表格预览。
- 数组展开。
- Excel 和 Google Sheets 兼容。

JSONToolkit 甚至明确区分 CSV 和真正的 XLSX，并提供 worksheet、数据类型、列宽和多 Sheet 等 Excel 工作簿能力。 JSONToolKit、JSONWebViewer 和 JSONViewerTool 也把 `.xlsx` 作为核心输出，而不是仅提供 CSV。 [jsonviewertool](https://jsonviewertool.com/json-to-excel)

因此，当前版本更诚实的页面名是：

```text
JSON to CSV for Excel
```

或者：

```text
JSON to Spreadsheet CSV
```

如果你一定要保留页面名 `JSON to Excel Converter`，至少需要满足下面其中之一：

1. 增加真实 `.xlsx` 生成。
2. 页面标题明确写 `JSON to Excel-compatible CSV`。
3. 在 description 和 FAQ 中明确说明实际输出为 CSV。

## Semrush 数据下的关键词策略

虽然报告中 `json to excel` 搜索量不错，但用户搜索这个词时，越来越可能期待真实 XLSX。原页面仅生成 CSV，会出现关键词与产品输出不完全匹配的问题。

当前版本建议优先覆盖：

```text
json to csv for excel
json array to excel
json to spreadsheet
convert json to excel csv
json to csv excel compatible
```

如果后续实现真正 XLSX，再单独增加：

```text
json to xlsx converter
json to excel converter
convert json to excel
json array to xlsx
json to excel online
```

其中报告里的 `json to xlsx converter` 搜索量为 320、KD 16，是一个很值得关注的低竞争词，但前提是产品真的输出 `.xlsx`，否则不应主动竞争这个词。 [ppl-ai-file-upload.s3.amazonaws](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/47793863/ec2e382e-117d-4dfa-9dd8-1b29a33f6f6a/kd-json-convert-3.md?AWSAccessKeyId=ASIA2F3EMEYE5MLKQI45&Signature=tpfeC9dw40f38MRKVnwKXk79ZYU%3D&x-amz-security-token=IQoJb3JpZ2luX2VjEHMaCXVzLWVhc3QtMSJHMEUCID3lRjYhDkJhymNpLZ2VdN9e4IoPiljczLVJwJyO1M%2F2AiEA5Xz%2F52mqC0U7UUL7L6TfbQYejIObs6jMA630gw2FdRIq8wQIPBABGgw2OTk3NTMzMDk3MDUiDK4NKQOKtvSE6HlgPirQBFm1lPeV%2BWEvvOsW9JwZv6ei65Qg%2BRMNONBCYHCbkkdr5cDq4pbmzBDd7k33Q2N8jzPnC2IOuQfT%2BeE6wC5FyPuTeMb5ayEftVUClDuNi2xSx8BYziHgCsY%2BziFs38cWxLcx%2B7bPQ%2BFdfIpiJ7XIqX%2FpvDCoUWcu2fkQdBfPWYMuZ79Hg4WJr6NRP%2B8OoIIkF0kz9m34SvmoEtBMGGjYBEUUGpESKvVuYxgmV%2F7BzAIvZ2UWGAnqaeM5riRT%2F2fd0xs00Xmej%2FDyEKMOkp5RPpSrhoGmuzvhop47yHYHGchHw5%2F7wh%2BwILZ%2BknrYKI%2Fra4B%2FWmC3CuuEinX%2B6ruc2znzSBab%2FcKqbjLT%2F034qDkEOfK1%2BZPC5UNfxvDDavy30qx37WN0mjAYQ9OrTNJeVb53NQpDF6HK7eWIApfKZB%2FqFoinnHFAVQXie4kJGLe4A8uCj96uCygNUZaJNRW%2BBDY7Ib7gDbFXNhOMtQL19EGR7XGB%2FZ0raFsJdnvx92P0XHOw7eh6RywU2DEdye4W0SNJaSi3ExmPu1GHsBgMXROlV9JnClVkV%2FxSCiD53CV4Cf4ns%2B%2FWN%2FScSrYxNods5ebKGo5G7C30Je%2BhQFlcQLhL%2FBwLQhChFadvRfg%2BYKjo%2BmOswfv9VRNucWVjNk2oBnOWCfbBGkTU2DTc2OJtU9hDhoNPLdxtyb9LGLJiJOxvWLIZbF10uy1Xn%2Fqe5Uo3iLstsmFCDM1mdMfkCTuvd2dWvph%2BL69njMX4uaKKxhOrxXF7uLn7lf%2Bz61ECOtxt3tgw4Mmy1QY6mAE2cePznBOb7rFeqGXmbtKOyg6%2Ft79tU7bzoO4K9L29dgF519%2FRwfQRHR9GOVLcGT7fSmiI77YH74%2FjhMo81yYI57iyeRGT47D2lpB4XXhbg7KRUo5jIt3YjRWVJ%2Ba%2ByhYnxHpIDvkJWPwQkgj2%2F5GVnNbuxKuX73OiZb8TQUcS7rW0Sfw5oRHI2amTqTExi9auRAEE9tMzJw%3D%3D&Expires=1789702835)

## 建议的产品路线

### 当前版本：CSV 方案

如果暂时不加入 XLSX 库，建议：

```text
/tools/convert/json-to-excel
```

页面显示：

> Convert JSON to Excel-compatible CSV

并保留：

- delimiter。
- header row。
- nested object flatten。
- preview。
- copy CSV。
- download CSV。
- UTF-8 BOM。

### 后续版本：真正 XLSX 方案

如果加入浏览器端 XLSX 生成，建议升级为：

- Download `.xlsx`。
- Worksheet name。
- Multiple sheets。
- Column width。
- Preserve numbers and dates。
- Auto-filter。
- Freeze header row。
- Nested array handling。
- Export current preview or all rows。
- Optional CSV/TSV fallback。

届时页面可以恢复：

```json
{
  "name": "JSON to Excel Converter",
  "btn_convert": "Convert to Excel",
  "btn_download": "Download .xlsx"
}
```

并把 `json to xlsx converter` 作为主 SEO 词之一。

## 最终判断

当前这页的客观结论是：

- **作为 JSON → CSV for Excel：可做，且可以与现有 JSON to CSV 页面复用。**
- **作为真正 JSON → Excel：当前配置还不够，不能直接这样宣传。**
- **SEO 主词 `json to excel`：有搜索量，但存在较强意图错配风险。**
- **更适合当前产品的切入词：`json to csv for excel`、`json to spreadsheet`、`json array to excel`。**
- **如果实现真正 XLSX，`json to xlsx converter` 是比泛 `json to excel` 更值得优先测试的关键词。**

最重要的调整是：**不要把 CSV 输出页面伪装成 Excel 文件转换器。** 这会影响用户信任、SERP 意图匹配和后续转化。