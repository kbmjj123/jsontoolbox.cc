---
title: "JSON Parse Failed: 10 Common API Errors and How to Debug Them"
description: "A practical guide to debugging JSON parse errors in real APIs, covering typical error messages, root causes, and step-by-step troubleshooting."
category: "json_tools"
date: 2026-08-24
lastmod: 2026-08-24
author: "BulkPicTools Team"
image: "/blog/cover/en/json-parse-error-debug-cover.svg"
tags: ["JSON", "JSON Editor", "JSON Validator", "API Debugging", "Error Handling"]
locales: ["en", "zh-CN"]
promo:
  slug: "jsoneditor"
  text: "🚀 Validate your JSON first:"
  btn: "Open JSON Editor"
---

<!-- # JSON Parse Failed: 10 Common API Errors and How to Debug Them -->

In frontend and backend development, "JSON parse failed" is one of the most common errors: your code expects a JSON response, but `JSON.parse` throws an exception and the console fills with red errors.  
This article breaks down **10 typical JSON parsing errors** from real-world debugging scenarios, and provides actionable troubleshooting steps and prevention tips to help you quickly locate and fix the root cause.

> If you have a "parse failed" JSON sample on hand, you can paste it directly into the [JSON Editor](/) on the homepage to automatically check syntax and highlight the error location.

## Overview of Typical Error Messages

Across different environments and scenarios, you might see errors like:

- `SyntaxError: Unexpected token ':' in JSON at position 3`  
- `SyntaxError: Unexpected token '<' in JSON at position 0`  
- `SyntaxError: Unexpected token 'u' in JSON at position 20`  
- `SyntaxError: Unexpected token '/' in JSON at position 2`  
- `JSONParseError: Unexpected end of JSON input`  

These all mean: **the input is not valid JSON**, but the underlying reasons can be very different: format errors, HTML error pages, encoding issues, truncated responses, and more.

Below, we break them down by scenario.

---

## Scenario 1: Backend Returns an HTML Error Page (500/404)

### Symptoms

- Your frontend calls an API expecting JSON.  
- The actual status code is 500/404/503, and the body is an HTML error page.  
- The frontend still calls `JSON.parse(responseText)` and fails with:

> `SyntaxError: Unexpected token '<' in JSON at position 0`

### Cause

HTML usually starts with `<!DOCTYPE html>` or `<html>`, so the first character is `<`, which is not valid JSON.

### Debugging Steps

1. Open the browser's Network panel and find the request.  
2. Check the **Status** code: is it 2xx?  
3. Check `Content-Type` in **Response Headers**:  
   - Is it `application/json`?  
   - Or `text/html` / `text/plain`?  
4. Inspect the **Response Body**: is it an HTML error page?  

### Solutions

- Before calling `JSON.parse` on the frontend:  
  - Check that the status code is 2xx;  
  - Check that `Content-Type` includes `application/json`.  
- For non-2xx responses, prioritize showing error information (e.g., `error.message`) instead of trying to parse JSON.

---

## Scenario 2: Content-Type Is Not `application/json`

### Symptoms

- The response body "looks like JSON", but `Content-Type` is `text/html` or `text/plain`.  
- Some frameworks/middleware refuse to auto-parse, or your code hesitates to safely call `JSON.parse`.  

### Causes

- Backend framework configuration (e.g., defaulting to `text/html`).  
- Reverse proxy/gateway modifying response headers.  
- Error-handling middleware returning `text/html` for all errors.  

### Debugging Steps

1. Check `Content-Type` in the Network panel.  
2. Compare response headers between working and failing endpoints.  
3. Inspect backend code/configuration for explicit `Content-Type` settings.  

### Solutions

- On the backend, consistently set:  
  ```http
  Content-Type: application/json; charset=utf-8
  ```
- On the frontend, be cautious when parsing responses whose `Content-Type` is not `application/json`, or at least log them first.

---

## Scenario 3: Trailing Commas / Single Quotes / Comments ("Fake JSON")

### Symptoms

- You copy "JSON-like" content from logs, docs, or chat tools.  
- Parsing it in code or tools fails with:  
  - `Unexpected token ','`  
  - `Unexpected token ':'`  
  - `Unexpected token '/'`  

### Common Error Patterns

1. **Trailing commas**  
   ```json
   {
     "name": "Alice",
     "age": 30,
   }
   ```
2. **Single quotes**  
   ```json
   {
     'name': 'Alice'
   }
   ```
3. **Comments in JSON**  
   ```json
   {
     // user info
     "name": "Alice"
   }
   ```

### Debugging Steps

1. Paste the raw response/text into the [JSON Editor](/).  
2. Let the tool auto-format and highlight error positions.  
3. Fix according to the hints: remove trailing commas, switch to double quotes, delete comments.  

### Solutions

- Always run "JSON from docs/logs" through a validator first.  
- If you need "config with comments" in backend logs, use JSONC or YAML and clearly label it as "non-standard JSON".

---

## Scenario 4: Backend Returns "Double-Serialized" JSON Strings

### Symptoms

- The response body is a string that contains JSON as text, e.g.:  
  ```json
  "{\"key\":\"value\"}"
  ```
- The frontend calls `JSON.parse` once and gets a string, not an object; only a second `JSON.parse` yields the object.  
- If your code assumes "one parse gives an object", it breaks.

### Causes

- The backend calls `JSON.stringify` on data that is already a JSON string.  
- Or an extra layer of wrapping happens in logs/message queues.  

### Debugging Steps

1. Inspect the raw response in the Network panel:  
   - Does it start and end with `"`?  
   - Does it contain many `\"` inside?  
2. In the console:  
   ```js
   const once = JSON.parse(text);
   console.log(typeof once, once);
   ```
   - If `typeof once === 'string'`, it's double-serialized.  

### Solutions

- On the backend, avoid calling `JSON.stringify` on data that is already a JSON string.  
- If you must support such an interface on the frontend:  
  ```js
  const data = JSON.parse(JSON.parse(text));
  ```
  but it's better to fix the backend logic at the source.

---

## Scenario 5: Large JSON Causing Timeouts / Memory Issues

### Symptoms

- The API returns a very large JSON (several MB or more).  
- When the frontend calls `JSON.parse`:  
  - The page freezes or even crashes;  
  - Or you get `Out of memory` / `Invalid argument` errors in some environments.  

### Causes

- Parsing huge JSON in one go puts heavy pressure on the main thread and memory.  
- Some environments (old browsers, low-end devices) have limits on single `JSON.parse` calls.  

### Debugging Steps

1. Check the response size in the Network panel (`Size` / `Transferred`).  
2. Try opening the JSON file locally in an editor to see if it's similarly slow.  

### Solutions

- On the backend:  
  - Use pagination or cursor-based pagination for large lists;  
  - Return only necessary fields to reduce payload size.  
- On the frontend:  
  - Use lazy loading / virtual lists for large datasets;  
  - Where possible, use streaming parsing (e.g., JSON stream libraries in Node.js).

---

## Scenario 6: Encoding Issues (Non-UTF-8, BOM)

### Symptoms

- The response fails to parse in some environments with vague errors.  
- Opening the text in an editor reveals a BOM (`EF BB BF`) or non-UTF-8 encoding.  

### Causes

- Some backends/proxies output UTF-8 with BOM or other encodings.  
- JSON standard recommends UTF-8 without BOM.  

### Debugging Steps

1. Save the response as a file and open it in an editor that shows encoding (e.g., VS Code, Notepad++).  
2. Check for a BOM or non-UTF-8 encoding.  

### Solutions

- Ensure the backend outputs JSON as UTF-8 without BOM.  
- Configure gateways/proxies not to add BOM or change encoding.

---

## Scenario 7: Truncated JSON (Network Interruption / Timeout)

### Symptoms

- The response is cut off during transmission.  
- Errors like:  
  > `SyntaxError: Unexpected end of JSON input`  

### Causes

- Unstable network, timeouts, or proxy interruptions truncate the JSON.  

### Debugging Steps

1. Check the request status in the Network panel:  
   - Does it show `(failed)`, `timeout`, `aborted`, etc.?  
2. Inspect whether the response content is clearly truncated (e.g., last character is not `}` or `]`).  

### Solutions

- Add retry logic on the frontend, especially for mobile/unstable networks.  
- Optimize timeout and retry settings on the backend/ops side.

---

## Scenario 8: Extra Text Mixed In (Prefix/Suffix Garbage)

### Symptoms

- The response has extra text before or after the JSON, e.g.:  
  ```text
  Data: {"key":"value"}
  ```
  or  
  ```text
  {"key":"value"}---END---
  ```
- Calling `JSON.parse` on the entire string fails.  

### Causes

- Some legacy systems/debug logic append extra text to responses.  
- Logs/proxies add prefixes/suffixes.  

### Debugging Steps

1. Inspect the full response text in the Network panel.  
2. Confirm whether there are extra characters before/after the JSON.  

### Solutions

- Fix at the source if possible: ensure responses are pure JSON.  
- If you can't change the backend immediately, add a cleaning layer on the frontend:  
  ```js
  const jsonText = text.match(/\{[\s\S]*\}/); // simple example[0]
  const data = JSON.parse(jsonText);
  ```
  Note: this regex is not universal and only works for simple structures.

---

## Scenario 9: Backend Returns "Half JSON, Half Text" Mixed Content

### Symptoms

- The first part of the response is JSON, the rest is plain text or HTML, e.g.:  
  ```text
  {"success":true}
  <script>...</script>
  ```
- `JSON.parse` fails when it encounters the non-JSON part.  

### Causes

- Error-handling logic outputs HTML/scripts after writing JSON.  
- Some frameworks append debug info on exceptions.  

### Debugging Steps

1. Inspect the full response text to see if there's content after the JSON.  
2. Check backend logs for exception stacks being written to the response.  

### Solutions

- Ensure each response is either pure JSON or pure HTML, not mixed.  
- For error responses, use a consistent JSON structure (e.g., `error` field) and avoid appending HTML.

---

## Scenario 10: Unvalidated User Input or Third-Party Data Passed to `JSON.parse`

### Symptoms

- Frontend/backend directly calls `JSON.parse` on user input, third-party webhooks, or queue messages.  
- When the data is invalid, it throws exceptions and can break the entire request flow.  

### Causes

- Missing pre-validation: length, character set, structure, etc.  
- Assuming "the other party will always send valid JSON".  

### Debugging Steps

1. Review all `JSON.parse` call sites in your code:  
   - Is the data source trusted?  
   - Is it wrapped in `try...catch`?  
2. For failing samples, paste them into the [JSON Editor](/) to see specific errors.  

### Solutions

- For all external input:  
  - Apply length limits (e.g., max 1MB);  
  - Perform basic character validation (e.g., printable ASCII / UTF-8);  
  - Wrap `JSON.parse` in `try...catch`.  
- For critical data, validate structure using JSON Schema / Zod / Joi, etc.

---

## Troubleshooting Checklist (Worth Bookmarking)

When you hit a "JSON parse failed" error, you can quickly排查 in this order:

1. **Check status code**: is it 2xx?  
2. **Check Content-Type**: is it `application/json`?  
3. **Inspect response content**:  
   - Is it pure JSON, or HTML/text?  
   - Are there extra characters before/after?  
4. **Check size**: is it unusually large (several MB+)?  
5. **Validate with a tool**:  
   - Paste the response into the [JSON Editor](/) to automatically check syntax errors.  
6. **Check encoding**: is there a BOM or non-UTF-8 encoding?  
7. **Check logs**: does the backend log show exception stacks written to the response?  
8. **Check code**:  
   - Is `JSON.parse` wrapped in `try...catch`?  
   - Are you trying to parse non-2xx responses?  

---

## How to Prevent JSON Parse Failures?

1. **Standardize API Contracts**  
   - Success response: `{ "success": true, "data": {...} }`  
   - Error response: `{ "success": false, "error": { "code": "...", "message": "..." } }`  
   - All responses are pure JSON, with no extra text.  

2. **Unified Parsing Logic on the Frontend**  
   - Encapsulate a `fetchJson` utility:  
     - Check status code  
     - Check `Content-Type`  
     - Then call `JSON.parse`  
   - Route all API calls through this function to reduce repeated mistakes.  

3. **Logging and Monitoring**  
   - For failed parses, log:  
     - Status code  
     - Content-Type  
     - First 1KB of the response (sanitized)  
   - This makes it easier to tell whether it's a backend or network issue.  

4. **Use Tools Effectively**  
   - During development:  
     - Use the [JSON Editor](/) to quickly validate API responses.  
     - Format complex structures before reading them.  
   - For production issues:  
     - Paste problematic samples into the editor to quickly locate syntax errors.  

---

## Summary

- "JSON parse failed" can have many causes: HTML error pages, format errors, encoding issues, truncated responses, double serialization, and more.  
- A systematic troubleshooting flow (status code → Content-Type → response content → tool validation) can significantly reduce debugging time.  
- In the long run, standardizing API contracts, encapsulating parsing logic, and using validation tools are key to minimizing these issues.  

> Next time you hit a JSON parse error, try pasting the response into the [JSON Editor](/) first to quickly confirm whether it's a syntax issue, then decide whether to fix it on the frontend or escalate to backend debugging.