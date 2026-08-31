---
title: "JSON Best Practices in Real Projects: API Design, Performance, and Security"
description: "A practical guide to using JSON in real projects, covering API design patterns, performance tips, security considerations, and common anti-patterns."
category: "json_tools"
date: 2026-08-25
lastmod: 2026-08-25
author: "BulkPicTools Team"
image: "/blog/cover/en/json-best-practices-cover.svg"
tags: ["JSON", "JSON Editor", "API Design", "Performance", "Security"]
locales: ["en", "zh-CN"]
promo:
  slug: "jsoneditor"
  text: "🚀 Need to batch format or check JSON?"
  btn: "Open JSON Editor"
---

<!-- # JSON Best Practices in Real Projects: API Design, Performance, and Security -->

In most web projects, JSON has become the de facto standard for data exchange. But "using JSON" and "using JSON well" are two different things:  
- Inconsistent response structures make frontend code hard to maintain;  
- Large JSON payloads cause page freezes and API timeouts;  
- Sensitive information accidentally ends up in responses, creating security risks.  

This article covers **API design, performance optimization, and security practices** for using JSON in real-world projects, summarizing standards, anti-patterns, and checklists to help you build more robust frontend–backend systems.

> If you're designing or refactoring APIs, you can paste example JSON into the [JSON Editor](/) on the homepage to adjust the structure while instantly checking format and validity.

---

## 1. Standardizing API Response Structures

### 1.1 Recommended Base Structure

For most business endpoints, use a consistent top-level structure, for example:

**Success response:**

```json
{
  "success": true,
  "data": {
    "id": 12345,
    "name": "Alice",
    "email": "alice@example.com"
  },
  "meta": {
    "requestId": "req_abc123",
    "version": "v1"
  }
}
```

**Error response:**

```json
{
  "success": false,
  "error": {
    "code": "USER_NOT_FOUND",
    "message": "User with ID 12345 not found",
    "details": {
      "userId": 12345
    }
  },
  "meta": {
    "requestId": "req_xyz789",
    "version": "v1"
  }
}
```

Benefits:

- The frontend only needs to check the `success` field to distinguish success vs. error.  
- Separating `data` and `error` avoids accessing non-existent `data` on errors.  
- `meta` can hold trace IDs, versions, etc., for logging and monitoring.

### 1.2 List Endpoints and Pagination Structure

For list endpoints, use an array in `data` with a consistent pagination structure:

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
    "total": 58,
    "totalPages": 3
  }
}
```

Or cursor-based pagination (better for large datasets):

```json
{
  "success": true,
  "data": [
    { "id": 101, "title": "..." },
    { "id": 102, "title": "..." }
  ],
  "cursor": {
    "next": "eyJpZCI6MTAyfQ==",
    "prev": "eyJpZCI6MTAxfQ=="
  }
}
```

The frontend can then encapsulate unified list components and pagination logic.

### 1.3 Error Code Design Recommendations

In the `error` object, include at least:

- `code`: Machine-readable error code, e.g., `USER_NOT_FOUND`, `INVALID_JSON`.  
- `message`: Human-readable description, suitable for UI display.  
- `details` (optional): Structured details for finer-grained handling or logging.  

Avoid:

- Returning only a string: `"User not found"`, making it hard for the frontend to distinguish error types.  
- Exposing full stack traces to the client (security risk).  

---

## 2. Field Naming and Type Conventions

### 2.1 Naming Style: camelCase vs snake_case

Two common naming styles in JSON:

- camelCase: `userId`, `createdAt`  
- snake_case: `user_id`, `created_at`  

Recommendations:

- **Standardize on one style** within a project and team.  
- If your frontend is primarily JavaScript/TypeScript, camelCase is usually more natural.  
- If your backend heavily uses frameworks that default to snake_case (e.g., Django), normalize at the serialization layer.  

The key is: **keep public APIs consistent**, avoid mixing styles within the same endpoint.

### 2.2 Dates and Times: Use ISO 8601 Consistently

Recommend using ISO 8601 strings for all date/time fields:

```json
{
  "createdAt": "2026-08-25T08:00:00Z",
  "updatedAt": "2026-08-25T08:30:00+08:00"
}
```

Benefits:

- Language-agnostic, with mature parsing libraries in almost every language.  
- Explicit timezone information avoids "local time vs UTC" ambiguity.  

Avoid:

- Using numeric timestamps (`1724572800`) without specifying units (seconds/milliseconds).  
- Using custom formats (`"2026/08/25 08:00"`), increasing frontend parsing overhead.  

### 2.3 Using null, Empty Objects, and Empty Arrays

Recommendations:

- For "missing" scalar fields, use `null`:  
  ```json
  {
    "phone": null
  }
  ```
- For "empty lists", use empty arrays:  
  ```json
  {
    "orders": []
  }
  ```
- For "missing objects", two common strategies:  
  - Return `null`:  
    ```json
    {
      "profile": null
    }
    ```
  - Return an empty object:  
    ```json
    {
      "profile": {}
    }
    ```
  The key is: **standardize on one strategy** within the project and document it.  

Avoid:

- Sometimes returning `null`, sometimes omitting the field entirely, forcing the frontend to handle multiple cases.  

---

## 3. Performance-Related Practices

### 3.1 Return Only Necessary Fields

Return only the fields the frontend actually needs, instead of dumping entire tables:

```json
// Avoid
{
  "id": 1,
  "name": "Alice",
  "email": "alice@example.com",
  "passwordHash": "...",
  "internalFlags": { ... },
  "createdAt": "...",
  "updatedAt": "...",
  "extraMeta": { ... }
}

// Recommended
{
  "id": 1,
  "name": "Alice",
  "email": "alice@example.com"
}
```

Benefits:

- Reduces payload size and improves response time.  
- Lowers the risk of leaking sensitive information.  

Implementation:

- Use DTO/VO (Data Transfer Object / View Object) layers on the backend to expose only necessary fields.  
- For complex objects, support a `fields` query parameter to let the frontend select fields (suitable for open APIs).  

### 3.2 Large Lists: Pagination and Streaming

For potentially large lists:

- Always use pagination (page-based or cursor-based).  
- Avoid returning tens of thousands of records in one response.  

Backend:

- Use database pagination (`LIMIT/OFFSET` or cursors).  
- For very large export endpoints, consider async jobs + file download instead of synchronous large JSON responses.  

Frontend:

- Use virtual lists / lazy loading to avoid rendering huge DOM trees at once.  
- For very large JSON, avoid heavy computation on the main thread; consider Web Workers.  

### 3.3 Reduce Nesting Depth and Redundancy

Excessive nesting and redundant fields increase parsing cost:

```json
// Avoid: deep nesting + redundancy
{
  "data": {
    "user": {
      "profile": {
        "info": {
          "name": "Alice",
          "extra": {
            "unusedField": "..."
          }
        }
      }
    }
  }
}

// Recommended: flatter, only necessary structure
{
  "data": {
    "userId": 1,
    "name": "Alice"
  }
}
```

Recommendations:

- Keep nesting depth around 3–5 levels.  
- Periodically review endpoint responses and remove unused fields.  

---

## 4. Security-Related Practices

### 4.1 Avoid Exposing Sensitive Information in JSON

Common but dangerous practices:

- Returning in responses:  
  - Passwords or password hashes  
  - Internal keys, tokens  
  - Full stack traces  
  - Internal IDs, internal service URLs  

Example (wrong):

```json
{
  "user": {
    "id": 1,
    "name": "Alice",
    "passwordHash": "$2b$10$...",
    "internalToken": "sk_live_..."
  }
}
```

Recommendations:

- Use dedicated "public view" objects that include only exposable fields.  
- For error responses, use generic messages; do not expose stack traces or internal details in `message`.  

### 4.2 Validate User Input Before Parsing

For JSON data from users or third parties:

- Apply length limits (e.g., max 1MB).  
- Perform basic character validation (e.g., printable UTF-8 only).  
- Wrap `JSON.parse` in `try...catch`.  

Node.js example:

```js
function safeParseJson(text, maxSize = 1024 * 1024) {
  if (typeof text !== 'string') {
    throw new Error('Input must be a string');
  }
  if (text.length > maxSize) {
    throw new Error('JSON too large');
  }
  try {
    return JSON.parse(text);
  } catch (e) {
    throw new Error('Invalid JSON: ' + e.message);
  }
}
```

For critical business data, further validate structure using JSON Schema / Zod / Joi.

### 4.3 Sanitize Sensitive Fields in Logs

When logging request/response JSON on the server:

- Sanitize sensitive fields:  
  - `email`: `ali***@example.com`  
  - `phone`: `138****1234`  
  - `token` / `password`: either omit or log as `***`.  

Avoid:

- Writing complete requests/responses to logs as-is, especially when they contain authentication or payment information.  

---

## 5. Integrating with TypeScript / JSON Schema

### 5.1 Define API Types with TypeScript

In TypeScript projects, define explicit types for each endpoint:

```ts
interface GetUserResponse {
  success: true;
  data: {
    id: number;
    name: string;
    email: string;
  };
  meta: {
    requestId: string;
    version: string;
  };
}

interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
  meta: {
    requestId: string;
    version: string;
  };
}

type GetUserResult = GetUserResponse | ApiError;
```

Benefits:

- The compiler catches field name errors and type mismatches early.  
- Autocomplete improves developer productivity.  

### 5.2 Use JSON Schema for Runtime Validation

For third-party data or critical endpoints, define structure with JSON Schema and validate at runtime:

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["success", "data", "meta"],
  "properties": {
    "success": { "type": "boolean" },
    "data": { "type": "object" },
    "meta": {
      "type": "object",
      "required": ["requestId", "version"],
      "properties": {
        "requestId": { "type": "string" },
        "version": { "type": "string" }
      }
    }
  }
}
```

With a validation library, you can intercept non-conforming responses at runtime and surface issues early.

---

## 6. JSON in Configuration and Logs

### 6.1 Configuration Files: Strict JSON or JSONC

For configuration files (e.g., `config.json`):

- Prefer strict JSON, avoiding comments and trailing commas.  
- If comments are truly needed, use JSONC (JSON with comments), but ensure your parser supports it.  

Avoid:

- Mixing single quotes, comments, and trailing commas in configs, leading to inconsistent parsing across environments.  

### 6.2 Field Conventions for Structured Logs

For structured JSON logs, standardize field conventions, e.g.:

```json
{
  "timestamp": "2026-08-25T08:00:00Z",
  "level": "info",
  "service": "user-api",
  "traceId": "req_abc123",
  "userId": 12345,
  "action": "get_user",
  "status": "success",
  "durationMs": 42
}
```

Benefits:

- Easier to query and aggregate in ELK / Cloudflare Logs and similar systems.  
- Unified fields simplify alerts and dashboards.  

---

## 7. Common Anti-Patterns

### 7.1 Embedding HTML / Rich Text in JSON Without Clarification

For example:

```json
{
  "content": "<p>Hello <strong>world</strong></p>"
}
```

Issues:

- If the frontend doesn't know this is HTML, it may render it as plain text.  
- XSS risk if inserted into the DOM without proper escaping/filtering.  

Recommendations:

- Use explicit field names like `contentHtml`, `contentMarkdown`.  
- Frontend should decide whether to render as HTML based on the field name and apply proper escaping/filtering.  

### 7.2 Using JSON to Transfer Large Binaries

For example:

- Base64-encoding images or files and putting them in JSON fields.  

Issues:

- Size bloat (base64 increases size by ~33%).  
- High parsing and transmission cost.  

Recommendations:

- Use dedicated file upload endpoints and return file URLs or IDs.  
- Keep only metadata (URL, size, type) in JSON.  

### 7.3 Returning "Half JSON, Half Text" Mixed Content

For example:

```text
{"success":true}
<!-- debug info -->
```

Issues:

- Cannot be parsed with standard JSON parsers.  
- May "look fine" during debugging but fail in production.  

Recommendations:

- Use either pure JSON or pure HTML/text, not mixed.  
- Output debug info via dedicated headers or logging systems, not appended to the response body.  

---

## 8. Checklist

### During API Design

- [ ] Are success/error response structures standardized?  
- [ ] Is there a unified error code convention?  
- [ ] Are dates/times consistently using ISO 8601?  
- [ ] Is field naming style (camelCase / snake_case) consistent?  
- [ ] Are sensitive fields avoided in responses?  

### During Frontend Parsing

- [ ] Do you check status code and `Content-Type` before parsing?  
- [ ] Are all `JSON.parse` calls wrapped in `try...catch`?  
- [ ] Is pagination/lazy loading used for large JSON?  
- [ ] Are third-party/user inputs validated for length and structure?  

### Logging and Security

- [ ] Are sensitive fields sanitized in logs?  
- [ ] Are stack traces avoided in error responses?  
- [ ] Are config files using strict JSON or controlled JSONC?  

---

## Summary

- In frontend–backend projects, "using JSON well" is not just about correct syntax; it's about API design, performance, and security.  
- Standardizing response structures, field conventions, and error codes significantly reduces frontend–backend collaboration costs.  
- Through field minimization, pagination, and streaming, you can effectively optimize performance issues caused by large JSON.  
- On the security side, avoiding sensitive data exposure, validating input, and sanitizing logs are basic but often overlooked practices.  

> When designing and debugging APIs, you can paste example JSON into the [JSON Editor](/) to adjust structures while instantly checking format and validity, helping your team reach consensus faster.