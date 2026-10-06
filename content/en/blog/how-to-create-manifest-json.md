---
title: "How to Create a manifest.json File: PWA & Chrome Examples"
description: "Create a manifest.json for a PWA or Chrome extension: required fields, minimal examples, install rules, and how to debug an invalid manifest."
h1: "How to Create a manifest.json File: PWA and Chrome Extension Examples"
category: "json_tools"
date: 2026-10-01
lastmod: 2026-10-01
image: "/blog/cover/en/how-to-create-manifest-json-cover.svg"
tags:
  - "JSON"
  - "manifest.json"
  - "PWA"
  - "Chrome Extension"
  - "Web App Manifest"
author: "JSON Toolbox Team"
promo:
  slug: "json-editor"
  text: "Writing a manifest? Format and validate it before you ship:"
  btn: "Open JSON Editor"
locales: ["en"]
---

# How to Create a manifest.json File: PWA and Chrome Extension Examples

Two developers can search "how to create a manifest.json file" and need completely different files. One is adding install support to a website. The other is publishing a Chrome extension. Both files are named `manifest.json`. Almost nothing else about them is the same.

That is the key idea: **`manifest.json` is a filename convention, not a format.** The file is ordinary JSON; what matters is the specification the consumer expects. This guide covers the two specs you are most likely to need — the W3C Web App Manifest (PWA) and the Chrome Extension Manifest V3 — with minimal working examples, the fields each one requires, and how to debug them when a browser refuses to load them.

If you are new to JSON files themselves, start with [How to Create a JSON File](/blog/how-to-create-json-file) for the syntax rules and saving steps, then come back here.

## What is a manifest.json file?

A `manifest.json` is a JSON file that describes an application to the software that runs it: its name, icons, entry point, permissions, and display behavior.

The same filename is used by several unrelated ecosystems:

| Kind of manifest | Who reads it | Purpose |
|---|---|---|
| Web App Manifest | Browsers | Makes a site installable as a PWA |
| Extension manifest | Chrome, Edge, Firefox | Declares an extension's metadata, scripts, and permissions |
| Framework manifest | Next.js and similar tools | Generated or consumed by the framework |
| Platform manifest | Game mods, plugins, cloud services | Platform-specific packaging metadata |

Two rules hold across all of them:

1. **The file is JSON.** No comments, no trailing commas, double-quoted keys, UTF-8. A file that is valid JSON can still be rejected, but a file that is not valid JSON is always rejected.
2. **The spec decides the fields.** Copying a Chrome extension's manifest into a PWA does nothing useful — the structures are not interchangeable.

Because these files are edited by hand and read by strict parsers, the same three problems come up constantly: a trailing comma, a comment someone added for documentation, and an icon path that 404s.

## Web App Manifest (PWA): what it is and when you need it

The [Web Application Manifest](https://www.w3.org/TR/appmanifest/) is a W3C specification: a JSON file that tells the browser how your app should look and behave when installed.

It declares:

- **Identity:** `name` and `short_name`.
- **Icons:** sizes the browser uses for the home screen, taskbar, and splash screen.
- **Entry point:** `start_url` — what opens when the app is launched.
- **Display:** `display` — `standalone`, `fullscreen`, `minimal-ui`, or `browser`.
- **Colors:** `theme_color` and `background_color`.

You need one if you want your site to be installable — added to a phone's home screen or a desktop dock and opened in its own window instead of a browser tab. MDN's [Web app manifests](https://developer.mozilla.org/en-US/docs/Web/Manifest) guide and web.dev's [web app manifest](https://web.dev/learn/pwa/web-app-manifest) tutorial are the reference material.

You do **not** need one for a site that should stay a website.

## How to create a manifest.json for a PWA

### Step 1: Create the file

Create `manifest.json` in your site's public root (or `manifest.webmanifest` — see the FAQ). For a project that serves `public/` statically, that is `public/manifest.json`, which becomes `/manifest.json`.

### Step 2: Add the required fields

| Field | Why it is needed |
|---|---|
| `name` or `short_name` | The label shown under the icon and in the install dialog |
| `icons` | At minimum a 192px and a 512px PNG |
| `start_url` | The page that opens when the app launches |
| `display` | Whether the app gets its own window; `standalone` is the common choice |

### Step 3: Add the recommended fields

`description`, `theme_color`, `background_color`, `orientation`, and `screenshots` improve the install experience and are quick to add.

### Step 4: Write the manifest

```json
{
  "name": "JSON Toolbox",
  "short_name": "JSON Toolbox",
  "description": "Free, browser-based JSON tools for developers.",
  "start_url": "/",
  "scope": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#0284c7",
  "orientation": "portrait-primary",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/maskable-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ]
}
```

`purpose: "maskable"` is optional but worth having: it tells Android the icon has safe padding, so the OS can crop it into a shape without cutting off your logo.

### Step 5: Link it from your HTML

The manifest does nothing until a page points at it:

```html
<link rel="manifest" href="/manifest.json">
```

Put it in the `<head>` of every page you want installable — or at least your entry page.

### Step 6: Serve it over HTTPS and test

Browsers only offer installation in a secure context, so the manifest and the site must be served over HTTPS in production (`localhost` counts as secure for development).

To verify, open DevTools → **Application → Manifest**. Chrome shows the parsed fields, flags missing icons, and reports whether the page meets its installability criteria. That panel is far faster than guessing: it names the exact field that is missing.

Chrome's criteria include an HTTPS origin, a manifest with `name` or `short_name`, 192px and 512px icons, `start_url`, `display`, and a registered service worker with a fetch handler. The set has changed across Chrome versions, so treat the DevTools panel as the source of truth rather than any single article — including this one.

## Common mistakes when creating a PWA manifest

| Symptom | Likely cause | Fix |
|---|---|---|
| "Manifest: Line: 1, column: 1, Syntax error" | Invalid JSON — usually a trailing comma or a comment | Remove it, or paste the file into [JSON Repair](/tools/format/json-repair) to clean it up |
| DevTools shows no manifest at all | Missing or wrong `<link rel="manifest">` path | Use an absolute path: `href="/manifest.json"` |
| Manifest fetched but not parsed | Server returned `text/html` — usually a 404 page or a SPA fallback | Make sure `/manifest.json` is served as JSON, not your index.html |
| Install prompt never appears | Missing 192px or 512px icon, missing `start_url`/`display`, not HTTPS, or no service worker with a fetch handler | Check the Installability section in DevTools |
| Icon looks broken or cropped | Wrong icon path, or no `maskable` icon | Use absolute paths; add a maskable icon with padding |
| App opens the wrong page | `start_url` relative to the manifest, not the HTML | Start it with `/` and confirm it resolves |
| Field ignored by the browser | Typo or wrong type (`"display": "Standalone"` is not valid; use lowercase `standalone`) | Compare against the [W3C spec](https://www.w3.org/TR/appmanifest/) |

One trap worth calling out: your editor may accept comments in this file because VS Code reads many config files as JSONC. The browser does not. Comments make the manifest fail to parse — see [Comments in JSON](/blog/json-comments).

## Chrome extension manifest.json: what it is and when you need it

Every Chrome extension has a `manifest.json` in its root directory. It declares the extension's name, version, icons, scripts, and permissions — without it, Chrome will not load the folder at all.

The current standard is **Manifest V3**. V2 extensions have been phased out, so any example showing `"manifest_version": 2` or a `background.scripts` array is out of date. See Chrome's [Manifest V3](https://developer.chrome.com/docs/extensions/develop/migrate/what-is-mv3) overview and MDN's [`manifest.json` reference](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json).

Three V3 changes cause most migration errors:

1. Background pages are **service workers**: `"background": { "service_worker": "background.js" }`, not `"background": { "scripts": [...] }`.
2. Host access moved to **`host_permissions`**; `permissions` now holds API permissions only.
3. Remotely hosted code is not allowed — scripts must ship inside the extension.

## How to create a manifest.json for a Chrome extension (Manifest V3)

### Step 1: Create the file in the extension root

```text
my-extension/
├── manifest.json
├── background.js
├── popup.html
└── icons/
    ├── icon-16.png
    ├── icon-48.png
    └── icon-128.png
```

### Step 2: Add the required keys

| Key | Requirement |
|---|---|
| `manifest_version` | Must be `3` |
| `name` | Display name |
| `version` | One to four dot-separated integers, e.g. `"1.0.0"` |

### Step 3: Add the keys most extensions need

`description`, `icons`, `action` (toolbar button and popup), `background.service_worker`, `permissions`, `host_permissions`, and `content_scripts`.

### Step 4: Write the manifest

```json
{
  "manifest_version": 3,
  "name": "My Extension",
  "version": "1.0.0",
  "description": "A minimal Manifest V3 Chrome extension.",
  "icons": {
    "16": "icons/icon-16.png",
    "48": "icons/icon-48.png",
    "128": "icons/icon-128.png"
  },
  "action": {
    "default_popup": "popup.html",
    "default_title": "My Extension",
    "default_icon": {
      "16": "icons/icon-16.png",
      "48": "icons/icon-48.png",
      "128": "icons/icon-128.png"
    }
  },
  "background": {
    "service_worker": "background.js"
  },
  "permissions": ["storage"],
  "host_permissions": ["https://example.com/*"]
}
```

Note the icon keys: they are **strings** (`"16"`, not `16`), and the paths are relative to the extension root, not the manifest.

### Step 5: Load and test it

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Click **Load unpacked** and select your extension folder.
4. Read the error list on the extension's card — Chrome reports manifest problems with the key involved, and the service worker's console is reachable via the "service worker" link.

A manifest that is valid JSON can still be rejected here. Chrome validates the schema too: an unknown key produces a warning, and an invalid value produces an error.

## Common mistakes when creating a Chrome extension manifest

| Mistake | Symptom | Fix |
|---|---|---|
| `"manifest_version": 2` or missing | "Unrecognized manifest key" / refuses to load | Set `"manifest_version": 3` |
| Missing `name` or `version` | "Required value 'version' is missing" | Add both; `version` must be dot-separated integers |
| `"background": { "scripts": [...] }` | Background never runs in V3 | Use `"service_worker": "background.js"` |
| Match patterns in `permissions` | "Permission ... is unknown or URL pattern is malformed" | Move URLs to `host_permissions` |
| Icon key is a number | Icon missing | Use string keys: `"16": "icons/icon-16.png"` |
| Icon file missing | "Could not load icon" | Verify the path relative to the extension root |
| Comments in the manifest | "Manifest is not valid JSON" | Remove them — or strip them with [JSONC to JSON](/tools/convert/jsonc-to-json) |
| Trailing comma | "Manifest is not valid JSON" | Remove the final comma |

## Write, validate, and format your manifest

Manifest files are small, hand-edited, and unforgiving. Three checks catch nearly every failure:

**1. Validate the JSON first.** Paste the file into the [JSON Editor](/tools/format/json-editor): it highlights syntax errors as you type and can format or minify the document before you copy or download it. Because it runs in your browser, you can paste an unreleased extension manifest or an internal PWA config without sending it anywhere.

**2. Repair instead of rewriting.** If the file already has trailing commas, single quotes, unquoted keys, or comments, [JSON Repair](/tools/format/json-repair) fixes all of them at once and returns valid JSON.

**3. Check it from the command line.** On any machine with `jq` or Python installed:

```bash
jq . manifest.json
python -m json.tool manifest.json
```

Both parse the file and print it, so an error means the JSON is invalid. Commands like these are also easy to add to CI so a broken manifest never reaches production.

For an extra layer, generate a JSON Schema from a known-good manifest with the [JSON Schema Generator](/tools/convert/json-schema-generator) and validate future versions against it with the [JSON Schema Validator](/tools/format/json-schema-validator). This catches a renamed or missing key that is still perfectly valid JSON — the class of bug syntax checking cannot see.

## Other types of manifest.json

The same filename appears in other ecosystems, each with its own required fields:

- **Next.js** — the App Router supports `app/manifest.json` or `app/manifest.ts` and generates the Web App Manifest for you; see the [Next.js manifest documentation](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/manifest).
- **Adobe UXP plugins** — a `manifest.json` declaring the plugin id, host application, and entry point.
- **Minecraft behavior and resource packs** — a `manifest.json` with a header, module list, and UUIDs.
- **Cloud and container tooling** — various deployment descriptors also named `manifest.json`.

The pattern is always the same: the platform's documentation defines the fields, and JSON syntax is only the container. When in doubt, follow the platform's official docs over any generic tutorial — including this one.

## FAQ

### What is the difference between manifest.json and manifest.webmanifest?

They hold the same content. `.webmanifest` is the extension recommended by the W3C spec, and the spec's media type is `application/manifest+json`. `manifest.json` is the de facto name most projects use, and browsers accept it. Pick one; make sure your server sends a JSON content type for it.

### Do I need a manifest.json for every website?

No. Add one if you want the site to be installable or to control how it looks when installed. A blog, a docs site, or a marketing page that should stay in a browser tab needs nothing.

### Can I use comments in a manifest.json?

Not in the file you ship. Standard JSON has no comment syntax, so `//` and `/* */` make the manifest invalid and both browsers and Chrome will reject it. Your editor may accept them because it reads the file as JSONC — that is the editor being lenient, not the browser. See [Comments in JSON](/blog/json-comments), and use [JSONC to JSON](/tools/convert/jsonc-to-json) to strip them before publishing.

### Why doesn't my PWA show the install prompt?

Usually one of: the manifest is missing a 192px or 512px icon, `start_url` or `display` is missing, the page is not served over HTTPS, or there is no registered service worker with a fetch handler. Open DevTools → Application → Manifest and read the installability list — it names what is missing.

### Why does Chrome say "Invalid manifest" for my extension?

Either the JSON is invalid (trailing comma, comment, single quotes) or a value fails schema validation (missing `version`, wrong `manifest_version`, malformed permission). Load the extension unpacked and read the error on its card — Chrome names the offending key.

### Can I use the same manifest.json for a PWA and a Chrome extension?

No. They are different specifications with different required keys. `manifest_version`, `permissions`, and `background` mean nothing to a browser reading a web app manifest, and `start_url` and `display` mean nothing to Chrome loading an extension. Keep them in separate files in separate projects.

### Where should the file go?

For a PWA, somewhere served at a stable public URL — commonly `/manifest.json` at the site root, referenced by an absolute `href`. For a Chrome extension, the root of the extension folder, next to the scripts it references.

## What's Next?

- **Writing a manifest now?** Format and validate it in the [JSON Editor](/tools/format/json-editor).
- **Already broken?** Fix commas, quotes, and comments with [JSON Repair](/tools/format/json-repair).
- **New to JSON files?** Read [How to Create a JSON File](/blog/how-to-create-json-file).
- **Fighting comments or trailing commas?** See [Comments in JSON](/blog/json-comments).
- **Debugging a parse error?** See [JSON Parse Failed: 10 Common API Errors and How to Debug Them](/blog/json-parse-error-debug).

---

*All tools on JSON Toolbox run entirely in your browser. Your data never leaves your device.*
