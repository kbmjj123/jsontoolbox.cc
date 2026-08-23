---
title: "What Is JSON? Structure, Syntax, and Common Mistakes (2026 Developer Guide)"
description: "A developer-focused guide to what JSON is, its data types and syntax rules, plus real-world API debugging examples and common JSON error fixes."
category: "json_tools"
date: 2026-08-23
lastmod: 2026-08-23
author: "BulkPicTools Team"
image: "/images/blog/what-is-json-cover-en.svg"
tags: ["JSON", "JSON Editor", "JSON Validator", "API Debugging", "Web Development"]
locales: ["en", "zh-CN"]
promo:
  slug: "jsoneditor"
  text: "🚀 Skip straight to formatting/validating your JSON:"
  btn: "Open JSON Editor"
---

JSON (JavaScript Object Notation) is a lightweight data interchange format that appears in almost every modern web development and API design scenario: from browser–backend communication to configuration files like `package.json` and `tsconfig.json`, and even structured logs and message queues.  
Instead of a textbook-style introduction, this guide focuses on **real-world developer scenarios**, explaining JSON structure and syntax while diving deep into the mistakes you're most likely to encounter and how to debug them.

## Why Developers Must Understand JSON

In modern web development, JSON is everywhere:

- **Frontend–backend communication**: RESTful APIs and most GraphQL services use JSON for request/response bodies.  
- **Configuration files**: `package.json` in Node.js projects, `tsconfig.json` in TypeScript, and many other config files are JSON or JSON supersets.  
- **Logging and monitoring**: Many logging systems (e.g., ELK, Cloudflare Logs) store structured logs in JSON format.  
- **Third-party integrations**: Payment, SMS, email, analytics SDKs typically return or accept JSON.  

Not understanding JSON's strict syntax rules can waste a lot of time when debugging APIs, parsing responses, or handling configuration.

## JSON Data Types: More Than Just "Objects and Arrays"

JSON supports only a limited set of data types, which is why it's simple and easy to parse:

- **Object**: A collection of key–value pairs, wrapped in `{}`.  
- **Array**: An ordered list, wrapped in `[]`.  
- **String**: Must be wrapped in double quotes `"`.  
- **Number**: Integer or floating-point; hexadecimal and octal are not allowed.  
- **Boolean**: `true` or `false`.  
- **Null**: Represents "no value".  

JSON does **not** support functions, Date objects, regular expressions, `undefined`, comments, etc.  
In real projects, dates are usually represented as ISO 8601 strings, e.g. `"2026-08-23T08:00:00Z"`.

## What Does JSON Look Like in Real APIs?

### Typical REST API Response

```json
{
  "success": true,
  "data": {
    "id": 12345,
    "name": "Alice",
    "email": "alice@example.com",
    "roles": ["user", "editor"],
    "createdAt": "2026-08-23T08:00:00Z"
  },
  "meta": {
    "requestId": "req_abc123",
    "version": "v1"
  }
}
```

Characteristics:

- The top level is an object, making it easy to extend (`success`, `data`, `meta`, etc.).  
- Nested objects and arrays express complex structures.  
- Dates are represented as strings, not `new Date()`.

### List Endpoint (Paginated)

```json
{
  "success": true,
  "data": [
    { "id": 1, "title": "JSON Guide" },
    { "id": 2, "title": "API Design Tips" }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 58
  }
}
```

This pattern is very common in admin dashboards and content listings.

### Error Response (Often Overlooked)

```json
{
  "success": false,
  "error": {
    "code": "INVALID_JSON",
    "message": "Unexpected token ':' in JSON at position 3",
    "details": {
      "line": 2,
      "column": 5
    }
  }
}
```

When the backend fails to validate JSON, it often returns a structure like this. If the frontend blindly calls `JSON.parse` on the raw response without checking the `success` field, it can easily mishandle errors.

## JSON Syntax Rules: From "It Runs" to "Strictly Correct"

### Object

- Wrapped in `{}`.  
- Contains zero or more `"key": value` pairs, separated by commas.  
- Keys **must** be double-quoted strings.  

```json
{
  "id": 123,
  "name": "JSON Guide",
  "active": true,
  "meta": null
}
```

### Array

- Wrapped in `[]`.  
- Contains zero or more values, separated by commas.  
- Values can be any valid JSON value, and types can be mixed.  

```json
[
  "apple",
  42,
  true,
  { "key": "value" },
[1][2][3]
]
```

### Strings and Escaping

- Must use double quotes `"`.  
- Common escapes: `\"`, `\\`, `\n`, `\t`, `\uXXXX`.  

```json
{
  "message": "He said \"hello\"",
  "path": "C:\\Users\\Alice",
  "multiline": "Line1\nLine2"
}
```

### Numbers, Booleans, and Null

```json
{
  "int": 10,
  "float": 3.14,
  "negative": -0.5,
  "exp": 1.23e10,
  "enabled": true,
  "deleted": false,
  "optional": null
}
```

## Common JSON Mistakes: From Error Messages to Fixes

Below are the most common JSON mistakes in real development, along with typical error messages and debugging strategies.

### Using Single Quotes or Unquoted Keys

Invalid:

```json
{
  'name': 'Alice',
  name: "Alice"
}
```

Typical error (browser / Node.js):

> `SyntaxError: Unexpected token ':' in JSON at position 1`

Fix:

```json
{
  "name": "Alice"
}
```

**Key point**: All strings in JSON, including keys, must be double-quoted.

### Trailing Commas

Invalid:

```json
{
  "name": "Alice",
  "age": 30,
}
```

or:

```json
[1, 2, 3,]
```

Typical error:

> `SyntaxError: Unexpected token '}' in JSON at position 27`

Fix:

```json
{
  "name": "Alice",
  "age": 30
}
```

```json
[1][2][3]
```

**Key point**: JSON does not allow trailing commas after the last element.

### Writing Comments in JSON

Invalid:

```json
{
  // User info
  "name": "Alice",
  "age": 30
}
```

or:

```json
{
  "name": "Alice", /* age */ "age": 30
}
```

Typical error:

> `SyntaxError: Unexpected token '/' in JSON at position 2`

Fix: Remove all comments.

```json
{
  "name": "Alice",
  "age": 30
}
```

**Key point**: Standard JSON does not support any form of comments.  
If you really need "config with comments", consider JSONC or YAML, but they are not standard JSON.

### Using Invalid Values: `undefined`, Functions, Date Objects, etc.

Invalid:

```json
{
  "name": "Alice",
  "created": undefined,
  "handler": function() {},
  "date": new Date()
}
```

Typical error:

> `SyntaxError: Unexpected token 'u' in JSON at position 20`

Fix:

```json
{
  "name": "Alice",
  "created": null,
  "handler": null,
  "date": "2026-08-23T08:00:00Z"
}
```

**Key point**: JSON only supports objects, arrays, strings, numbers, booleans, and `null`.

### Unescaped Quotes or Newlines in Strings

Invalid:

```json
{
  "message": "He said "hello""
}
```

or:

```json
{
  "text": "Line1
Line2"
}
```

Typical error:

> `SyntaxError: Unexpected token 'h' in JSON at position 15`

Fix:

```json
{
  "message": "He said \"hello\""
}
```

```json
{
  "text": "Line1\nLine2"
}
```

**Key point**: Double quotes inside strings must be escaped as `\"`, and control characters like newlines must use escape sequences.

### Parsing an HTML Error Page as JSON

Real-world scenario:

- The server returns 500/404 with an HTML error page as the body, not JSON.  
- The frontend still calls `JSON.parse(responseText)` and fails.

Typical error:

> `SyntaxError: Unexpected token '<' in JSON at position 0`

Reason: HTML starts with `<` (e.g. `<!DOCTYPE html>`), which is not valid JSON.

Debugging steps:

1. Open the browser's Network panel and inspect the **Response** of the request.  
2. Check whether the `Content-Type` is `application/json`.  
3. Verify that the status code is 2xx and that the body is actual JSON.  

Solutions:

- Before parsing, check `Content-Type` and the status code.  
- For non-2xx responses, prioritize reading error information instead of directly calling `JSON.parse`.

## How to Quickly Check if JSON Is Valid?

### Using Online JSON Validation and Formatting Tools

Paste your JSON into an online tool to:

- Automatically check syntax errors and highlight the error location (line/column).  
- One-click formatting (indentation, newlines) for easier reading and debugging.  
- Support minification to reduce payload size.

If you're using our tool site, you can paste any JSON directly into the JSON Editor on the homepage to instantly validate and format it.

> 🚀 Skip straight to formatting/validating your JSON: [Open JSON Editor](/)

### Quick Validation in the Browser Console

```js
const text = `your JSON string`;
JSON.parse(text);
```

If there's a syntax error, an exception will be thrown, and the console will show the error message and approximate location.

### Safe Parsing in Code

In Node.js / frontend:

```js
try {
  const data = JSON.parse(text);
  // Valid JSON, continue processing
} catch (e) {
  // Invalid JSON
  console.error('JSON parse failed:', e.message);
}
```

In production, it's recommended to:

- Avoid directly calling `JSON.parse` on user input or untrusted sources.  
- Apply length limits and character whitelists before parsing.  
- Validate the resulting data structure against a schema (e.g., JSON Schema, Zod, Joi).

## Differences Between JSON and JavaScript Object Literals

Many people confuse JSON with JavaScript object literals, but they are not the same:

- **Key quotes**  
  - JS: `{ name: "Alice" }` is valid  
  - JSON: Must be written as `{ "name": "Alice" }`  

- **Value types**  
  - JS: Can include functions, dates, regular expressions, `undefined`, etc.  
  - JSON: Only objects, arrays, strings, numbers, booleans, and `null`  

- **Comments**  
  - JS: Supports `//` and `/* */`  
  - JSON: Does not support any comments  

- **Quote style**  
  - JS: Strings can use single or double quotes  
  - JSON: Only double quotes are allowed  

Therefore, you cannot simply treat a JS object as JSON and send it to the backend; you need to serialize it using `JSON.stringify()`.

## Practical Tips: How to Use JSON Effectively in Your Projects?

1. **API Design Phase**  
   - Standardize response structures (e.g., `success` + `data` + `error`).  
   - Specify that dates and times use ISO 8601 strings.  
   - Avoid returning sensitive information in JSON (keys, internal IDs, debug info).

2. **Frontend Handling**  
   - Check `Content-Type` and status codes before parsing.  
   - Paginate or lazy-load large JSON to avoid parsing huge payloads at once.  
   - Use TypeScript or JSON Schema to enforce type constraints on API data structures.

3. **Debugging and Troubleshooting**  
   - When encountering a `SyntaxError`, first format the JSON with a tool, then locate the error line based on the hint.  
   - Be cautious with "strings that look like JSON", especially those copied from logs or third-party documentation.  

> If you frequently need to check and format JSON, bookmark our [JSON Editor](/) to quickly validate any JSON snippet.

## Summary

- JSON is one of the most fundamental and important data formats in modern web development; understanding its strict syntax can significantly reduce API debugging time.  
- Common mistakes often come from "writing like JavaScript objects" instead of "following the JSON spec strictly": single quotes, trailing commas, comments, invalid values, etc.  
- In real projects, you need to consider API design, frontend parsing, and error handling together, not just the "syntax level".  
- Combining online JSON tools (formatting, validation, minification) can greatly improve development efficiency and also bring continuous search traffic and usage scenarios to your site.