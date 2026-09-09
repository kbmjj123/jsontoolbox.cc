---
title: "Free Realistic JSON Test Data for Development and Performance Testing"
description: "Download free, realistic JSON test datasets — orders, users, logs, issues, payments, and products — for testing JSON viewers, editors, parsers, and performance benchmarks."
category: "json_tools"
date: 2026-09-08
lastmod: 2026-09-08
author: "JSON Toolbox Team"
tags: ["JSON", "Test Data", "JSON Editor", "Performance Testing", "JSON Viewer", "Developer Tools"]
locales: ["en"]
promo:
  slug: "json-editor"
  text: "🚀 Want to open these files right now? Try the JSON Editor:"
  btn: "Open JSON Editor"
---

Small JSON examples are useful for learning the syntax, but they are not enough for testing real-world applications.

A production JSON document may contain nested objects, arrays, optional fields, timestamps, image URLs, colors, metadata, user profiles, payment details, inventory records, and error information. Large JSON files can also expose performance problems in parsers, editors, viewers, search features, and virtualized rendering components.

To make testing easier, JsonToolBox provides a collection of free, realistic JSON test datasets for developers, testers, students, and technical writers.

These datasets are synthetically generated and can be downloaded directly for local development, UI testing, JSON parsing, and performance benchmarking.

## Download JSON Test Data

The collection includes several common business scenarios:

| Dataset | Description | Useful for testing |
|---|---|---|
| Orders | E-commerce orders, customers, products, taxes, and discounts | Nested objects, arrays, totals, and relationships |
| Users | User profiles, addresses, preferences, companies, and social links | Optional fields, metadata, avatars, and user interfaces |
| Logs | Application and API logs with errors, requests, and timestamps | Wide objects, log levels, error fields, and search |
| Issues | Jira-like project issues with worklogs and custom fields | Deep nesting, dynamic fields, users, and status values |
| Payments | Stripe-like charges, payment intents, customers, and payouts | Payment states, IDs, amounts, and nested resources |
| Products | E-commerce products with variants, inventory, options, and images | Arrays, product variants, images, and inventory data |

### Orders

E-commerce order data includes customers, addresses, line items, product images, taxes, discounts, payment states, fulfillment states, and order metadata.

- [Download Orders — 1 MB](https://github.com/kbmjj123/jsontoolbox.cc/raw/develop/libs/json-generator/output/orders-1mb.json)
- [Download Orders — 5 MB](https://github.com/kbmjj123/jsontoolbox.cc/raw/develop/libs/json-generator/output/orders-5mb.json)
- [Download Orders — 10 MB](https://github.com/kbmjj123/jsontoolbox.cc/raw/develop/libs/json-generator/output/orders-10mb.json)
- [Download Orders — 20 MB](https://github.com/kbmjj123/jsontoolbox.cc/raw/develop/libs/json-generator/output/orders-20mb.json)

Example structure:

```json
{
  "id": 1001,
  "order_number": "#1001",
  "created_at": "2026-08-12T14:23:45.000Z",
  "customer": {
    "id": 5021,
    "first_name": "Alice",
    "last_name": "Johnson",
    "email": "customer5021@example.com",
    "phone": "+1-415-555-3842"
  },
  "line_items": [
    {
      "product_id": 2001,
      "title": "Premium Wireless Headphones",
      "quantity": 2,
      "price": "129.99",
      "image_url": "https://picsum.photos/seed/product-2001/400/400",
      "variant": {
        "color": "#1E293B",
        "size": "One Size"
      },
      "tax_lines": [
        { "title": "Tax 8.25%", "rate": 0.0825, "price": "21.45" }
      ],
      "discount_allocations": []
    }
  ],
  "total_price": "281.43",
  "subtotal_price": "259.98",
  "total_tax": "21.45",
  "currency": "USD",
  "financial_status": "paid",
  "fulfillment_status": "fulfilled",
  "tags": ["vip", "repeat_customer"],
  "metadata": {
    "source": "web",
    "campaign": "summer_sale_2025",
    "device": "desktop"
  }
}
```

This dataset is useful for testing expandable trees, nested arrays, totals, filtering, and order detail interfaces.

### Users

The users dataset contains realistic-looking user profiles with names, emails, avatars, addresses, companies, job titles, preferences, roles, and optional social links.

- [Download Users — 1 MB](https://github.com/kbmjj123/jsontoolbox.cc/raw/develop/libs/json-generator/output/users-1mb.json)
- [Download Users — 15 MB](https://github.com/kbmjj123/jsontoolbox.cc/raw/develop/libs/json-generator/output/users-15mb.json)
- [Download Users — 40 MB](https://github.com/kbmjj123/jsontoolbox.cc/raw/develop/libs/json-generator/output/users-40mb.json)

It can be used to test:

- User management interfaces.
- Profile cards and tables.
- Avatar and image URL rendering.
- Optional and missing fields.
- Preferences and nested settings.
- Search and filtering by role, language, or status.

### Application Logs

The logs dataset simulates records produced by web applications and backend services.

- [Download Logs — 1 MB](https://github.com/kbmjj123/jsontoolbox.cc/raw/develop/libs/json-generator/output/logs-1mb.json)
- [Download Logs — 10 MB](https://github.com/kbmjj123/jsontoolbox.cc/raw/develop/libs/json-generator/output/logs-10mb.json)
- [Download Logs — 30 MB](https://github.com/kbmjj123/jsontoolbox.cc/raw/develop/libs/json-generator/output/logs-30mb.json)
- [Download Logs — 50 MB](https://github.com/kbmjj123/jsontoolbox.cc/raw/develop/libs/json-generator/output/logs-50mb.json)

Log records may contain:

- Log levels such as `DEBUG`, `INFO`, `WARN`, `ERROR`, and `FATAL`.
- Request IDs and user IDs.
- HTTP methods and status codes.
- API paths and query parameters.
- Processing durations.
- Error messages and stack traces.
- Service, host, region, and environment metadata.

This makes the dataset suitable for testing log viewers, JSON search, syntax highlighting, error filtering, and wide-record rendering.

### Jira-like Issues

The issues dataset simulates project management and issue-tracking records.

- [Download Issues — 1 MB](https://github.com/kbmjj123/jsontoolbox.cc/raw/develop/libs/json-generator/output/issues-1mb.json)
- [Download Issues — 10 MB](https://github.com/kbmjj123/jsontoolbox.cc/raw/develop/libs/json-generator/output/issues-10mb.json)
- [Download Issues — 20 MB](https://github.com/kbmjj123/jsontoolbox.cc/raw/develop/libs/json-generator/output/issues-20mb.json)
- [Download Issues — 40 MB](https://github.com/kbmjj123/jsontoolbox.cc/raw/develop/libs/json-generator/output/issues-40mb.json)

Each issue may include:

- Project keys and issue identifiers.
- Summaries and descriptions.
- Issue types, priorities, and statuses.
- Reporters and assignees.
- Labels and components.
- Fix versions.
- Worklogs and comments.
- Story points and custom fields.
- Epic relationships.

This scenario is particularly useful for testing inconsistent object shapes and dynamic fields. Not every issue contains the same optional properties, which better reflects data from real business systems.

### Stripe-like Payments

The payments dataset represents common payment-related objects such as charges, payment intents, customers, payment methods, and payouts.

- [Download Payments — 1 MB](https://github.com/kbmjj123/jsontoolbox.cc/raw/develop/libs/json-generator/output/payments-1mb.json)
- [Download Payments — 10 MB](https://github.com/kbmjj123/jsontoolbox.cc/raw/develop/libs/json-generator/output/payments-10mb.json)
- [Download Payments — 20 MB](https://github.com/kbmjj123/jsontoolbox.cc/raw/develop/libs/json-generator/output/payments-20mb.json)
- [Download Payments — 40 MB](https://github.com/kbmjj123/jsontoolbox.cc/raw/develop/libs/json-generator/output/payments-40mb.json)

The generated records may include:

- Payment IDs and customer IDs.
- Amounts represented in cents.
- Currency codes.
- Card brands and masked card numbers.
- Payment status transitions.
- Refund amounts.
- Failure codes and messages.
- Payment metadata.
- Payout arrival dates.

All payment records are synthetic. They are not connected to real payment accounts or transactions and must not be used as financial records.

### E-commerce Products

The products dataset contains catalog data with product images, options, variants, prices, inventory, tags, SEO metadata, and publication status.

- [Download Products — 1 MB](https://github.com/kbmjj123/jsontoolbox.cc/raw/develop/libs/json-generator/output/products-1mb.json)
- [Download Products — 10 MB](https://github.com/kbmjj123/jsontoolbox.cc/raw/develop/libs/json-generator/output/products-10mb.json)
- [Download Products — 20 MB](https://github.com/kbmjj123/jsontoolbox.cc/raw/develop/libs/json-generator/output/products-20mb.json)
- [Download Products — 40 MB](https://github.com/kbmjj123/jsontoolbox.cc/raw/develop/libs/json-generator/output/products-40mb.json)

A product may contain:

- Multiple images with URLs, dimensions, and positions.
- Color and size options.
- Several product variants with SKUs.
- Inventory quantities and availability flags.
- Sale prices and comparison prices.
- Product tags and categories.
- SEO titles and descriptions.
- External image URLs from placeholder services.

This dataset is useful for testing product grids, variant selectors, inventory dashboards, catalog imports, and nested JSON structures.

## Test JSON Tools Online

After downloading a dataset, you can open it with the free JSON tools on JsonToolBox.

The [JsonToolBox tools page](/tools) provides browser-based tools for working with JSON data. The tools run directly in the browser, so you can format, validate, edit, compare, and convert JSON without uploading it to a server.

Useful tools include:

- [JSON Editor](/tools/format/json-editor) for editing, formatting, validating, and exporting JSON.
- [JSON to CSV Converter](/tools/convert/json-to-csv) for converting arrays of objects into CSV files for Excel or Google Sheets.
- [JSON to Excel](/tools/convert/json-to-excel) for converting JSON arrays directly to Excel spreadsheets.
- [JSON Escape and Unescape](/tools/format/json-escape) for handling quotes, backslashes, newlines, and other special characters.
- [JSON Minifier](/tools/format/json-minifier) for compressing JSON by removing whitespace.
- [JSON Compare](/tools/format/json-compare) for highlighting differences between two JSON documents.
- [JSON to TypeScript](/tools/convert/json-to-typescript) for generating TypeScript interfaces from JSON data.

JsonToolBox is designed for browser-based JSON workflows. Data can be processed locally in the browser without creating an account or uploading files to a remote service.

## Use Cases

These datasets can be used in many development and testing workflows.

### Testing JSON viewers

Use the larger files to test:

- Initial loading time.
- Tree expansion and collapse.
- Virtualized rendering.
- Deeply nested structures.
- Large arrays.
- Search and filtering.
- Memory usage.
- Scrolling performance.

### Testing JSON editors

The datasets can help test whether an editor can:

- Open large documents.
- Format and minify JSON.
- Highlight syntax errors.
- Edit nested values.
- Search through large files.
- Preserve arrays and object structures.
- Export the modified document.

### Testing APIs and parsers

Developers can use the files as fixtures for:

- Unit tests.
- Integration tests.
- Import and export workflows.
- Schema validation.
- Data transformation.
- JSON-to-CSV conversion.
- Database seed scripts.

### Building demos and tutorials

The smaller datasets are suitable for:

- Documentation examples.
- Frontend demos.
- Table and tree components.
- API response examples.
- Data visualization prototypes.
- Programming exercises.

## File Sizes

Different file sizes are useful for different types of testing.

| Size | Recommended use |
|---|---|
| 1 MB | Quick demos, unit tests, and local development |
| 5–10 MB | Editor, viewer, and parser testing |
| 20–30 MB | Large-file rendering and memory testing |
| 40–50 MB | Stress testing and performance benchmarking |

The exact number of records depends on the dataset type. Orders, issues, and products usually contain more nested data per record than simple users or logs.

## Synthetic Data and Privacy

All records in this collection are generated data. They are not copied from real customers, payment systems, project trackers, or production databases.

The generated data may contain:

- Fake names.
- Example email addresses.
- Test phone numbers.
- Synthetic addresses.
- Random IDs.
- Public placeholder image URLs.
- Generated colors and metadata.

You should still avoid using these files as real customer data or production fixtures without reviewing them for your specific use case.

The payment datasets are for interface and parser testing only. They do not contain real payment information and cannot be used to process transactions.

## External Image URLs

Some records include public image URLs, such as avatar and product image fields. These URLs are useful when testing applications that render remote images.

For example:

```json
{
  "avatar_url": "https://i.pravatar.cc/300?u=5021",
  "image_url": "https://picsum.photos/seed/product-2001/400/400"
}
```

External image services may apply rate limits or change their availability. If you need stable long-term testing, replace these URLs with images hosted on your own domain or use a local asset version of the dataset.

## Generate Your Own Data

The downloadable files are useful when you need ready-to-use fixtures. If you need a different size or structure, you can generate your own files with the accompanying Node.js scripts.

The generator supports scenarios such as:

```bash
# Clone the repository
git clone https://github.com/kbmjj123/jsontoolbox.cc.git
cd jsontoolbox.cc/libs/json-generator

# Install tsx if needed
pnpm add -D tsx

# Generate a dataset (default output: ./output/)
tsx scripts/generate.ts orders 10
tsx scripts/generate.ts users 10
tsx scripts/generate.ts logs 10
tsx scripts/generate.ts issues 10
tsx scripts/generate.ts payments 10
tsx scripts/generate.ts products 10
```

The first argument selects the dataset type. The second argument is the approximate target size in megabytes.

Each dataset type produces records with different structures and nesting depths:

| Type | Avg record size | Key characteristics |
|---|---|---|
| `orders` | ~1.8 KB | Customer, line items, tax, discounts, shipping |
| `users` | ~0.7 KB | Profile, address, preferences, social links |
| `logs` | ~0.5 KB | Timestamps, request info, errors, metadata |
| `issues` | ~1.5 KB | Worklogs, custom fields, components, labels |
| `payments` | ~0.5 KB | Charges, intents, cards, payouts |
| `products` | ~2.3 KB | Variants, images, options, inventory, SEO |

Source code and generation instructions are available in the JsonToolBox repository:

[View the JSON test data generator on GitHub](https://github.com/kbmjj123/jsontoolbox.cc/tree/develop/libs/json-generator)

## Dataset Manifest

Each release can include a manifest describing the available files:

```json
{
  "name": "JsonToolBox Realistic JSON Test Data",
  "version": "1.0.0",
  "datasets": [
    {
      "type": "orders",
      "file": "orders-10mb.json",
      "records": 6307,
      "size_bytes": 11118080,
      "format": "pretty"
    },
    {
      "type": "products",
      "file": "products-10mb.json",
      "records": 3756,
      "size_bytes": 9007104,
      "format": "pretty"
    }
  ]
}
```

A manifest makes it easier for documentation, automated tests, download pages, and CI workflows to discover the available datasets.

## Frequently Asked Questions

### Are these JSON files free?

Yes. The datasets are intended for free use in development, testing, education, and demonstrations.

### Are the records real?

No. The records are synthetically generated and do not represent real users, payments, orders, or projects.

### Can I use these files to test a JSON viewer?

Yes. The datasets are designed for JSON viewers, editors, formatters, validators, parsers, importers, and large-file rendering systems.

### Do the datasets contain images?

Some datasets contain image URL fields, including avatars and product images. The URLs point to public placeholder image services like `pravatar.cc` and `picsum.photos`.

### Can I generate larger files?

Yes. Use the Node.js generator to create files with a custom target size or record count. There is no hard limit — the generator samples a few records to estimate average size, then produces enough records to reach the target.

### Can I use the data commercially?

The generator source code is open source. You can use the generated files in your projects, demos, and documentation. Review the license in the repository for full details.

## Conclusion

Realistic test data makes it easier to test JSON tools under conditions that are closer to real applications.

The JsonToolBox dataset collection includes orders, users, logs, issues, payments, and products with nested structures, arrays, optional fields, metadata, image URLs, timestamps, colors, and business-style relationships.

Download a dataset, open it in [JsonToolBox](/tools/format/json-editor), and use it to test formatting, validation, editing, conversion, searching, and large-file rendering directly in your browser.
