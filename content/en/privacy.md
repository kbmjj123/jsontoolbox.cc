---
title: Privacy Policy
description: JsonToolBox privacy policy — your JSON never leaves your browser. Covers the website and the JSON Toolbox browser extension.
updatedAt: 2026-11-12
---

# Privacy Policy

**Last updated:** November 12, 2026

This Privacy Policy explains how JsonToolBox ("we", "us", "our") collects, uses, and protects your information when you use our website and tools at [jsontoolbox.cc](https://jsontoolbox.cc) and the JSON Toolbox browser extension (Chrome / Edge).

**Scope.** Sections 1–8 describe the website at jsontoolbox.cc. Section 9 describes the browser extension, a separate product installed locally in your browser: it has no advertising, no analytics and no telemetry, even though the website may use them. Sections 10–12 apply to both products.

Throughout this policy, "we do not collect" means we do not receive your data on our servers. Both products process your JSON locally on your device.

By using JsonToolBox, you agree to the terms of this Privacy Policy.

## 1. Data Processing — 100% Client-Side

All JSON and file processing in JsonToolBox happens **entirely in your browser** using JavaScript. Your data is:

- **Not uploaded** to any server
- **Not stored** remotely
- **Not transmitted** over the network for processing

We have no access to the JSON, files, or any other content you process using our tools. Once you close the page, the website retains no copy of that data. (The browser extension deliberately keeps your most recent preview on your device — see Section 9.3.)

### How to Verify This Yourself

We encourage technical users to verify our privacy claims:

1. **Open DevTools** → Go to the **Network** tab
2. **Paste your JSON** into any tool and click Format / Convert / Validate
3. **Check the Network tab** — you will see zero requests related to your JSON content

The only network requests this site makes are for loading the page itself (HTML, CSS, JS) and Google AdSense ads. Your JSON content is never included in any request.

You can also inspect our [source code on GitHub](https://github.com/kbmjj123/jsontoolbox.cc) to verify that no data is sent to external servers.

## 2. Information We Do Not Collect

We explicitly do **not** collect:

- The content of your JSON, files, or any data you paste into our tools
- Personal information through tool usage (e.g., names, emails, IDs in your JSON)
- Any data that could be used to reconstruct your input

## 3. Advertising — Google AdSense

We use **Google AdSense** to display ads on our site. Google AdSense may use cookies or similar technologies to serve ads based on your visits to this and other websites.

- Google's use of advertising cookies enables it and its partners to serve ads based on your visit to our site and/or other sites on the Internet.
- You may opt out of personalized advertising by visiting [Google Ads Settings](https://adssettings.google.com/).

**Important:** Google AdSense operates independently of our JSON tools. Your JSON data is never shared with Google or any advertiser. Ads are loaded as separate page resources and have no access to the content you process in our tools.

## 4. Analytics

We may use privacy-focused web analytics to understand how our site is used. This may include:

- Page views and navigation paths
- Referrer information (e.g., search engine, social media)
- Device type, browser type, and approximate location (e.g., country/region)

This data is anonymized and aggregated. It does **not** include your JSON content or any personal information that could identify you.

## 5. Cookies

We use minimal cookies for essential functionality only, such as:

- Remembering your theme preference (light/dark mode)
- Remembering your language settings

We do **not** use cookies for:

- Cross-site tracking
- Selling data to third parties

You can control or disable cookies through your browser settings. Disabling cookies may affect some site features (e.g., theme persistence).

## 6. Third-Party Services

| Service | Purpose | Data Shared |
|---------|---------|-------------|
| Google AdSense | Advertising | Page URL, browser info (no JSON content) |

We do **not** share your JSON data with any third-party service. Period.

Third-party requests triggered by the browser extension when previewing media URLs are a different case and are described in Section 9.4: they go to the hosts of URLs found in your own JSON, not to a service we share data with.

## 7. Open Source Transparency

JsonToolBox is an **open-source project**. You can inspect every line of code to verify our privacy claims:

- [GitHub Repository](https://github.com/kbmjj123/jsontoolbox.cc)
- No server-side JSON processing code exists — because there is no server-side processing
- All JSON operations use browser-native `JSON.parse` / `JSON.stringify` and client-side libraries

## 8. Your Choices

You can:

- Use JsonToolBox without enabling cookies (via your browser settings)
- Clear your browser data at any time
- Stop using the site at any point; no data is retained on our side
- Block Google AdSense ads using browser extensions or [Google Ads Settings](https://adssettings.google.com/)

## 9. Browser Extension (Chrome / Edge)

The [JSON Toolbox browser extension](https://github.com/kbmjj123/json-browser-plugins) is a separate open-source project maintained alongside this site. It runs entirely inside your browser. Sections 3–5 above — website advertising, analytics and cookies — do not apply to it; the terms below apply instead.

### 9.1 What the extension does

The extension automatically displays — and lets you edit — JSON documents that the browser would otherwise show as plain text. All parsing, formatting, searching and editing happen locally in your browser.

### 9.2 Data the extension does not collect

We do not collect, receive, or store any of your data on our servers. The extension has no account, no sign-in, no telemetry, no analytics, no crash reporting, no advertising and no third-party SDK. We do not sell or share personal information, and your data is never used for advertising or model training.

### 9.3 Data stored on your device

The extension uses `browser.storage.local` to keep:

- your preferences (theme, indentation, default view, language, auto-beautify, media preview);
- the text of the most recently previewed JSON document, the URL of the page it came from, and a timestamp, so the toolbar button can reopen it in a dedicated tab.

This data never leaves your device, is never synced to other devices, is overwritten by the next preview, and is removed when you uninstall the extension or clear the extension's storage in Chrome. The website at jsontoolbox.cc cannot read this storage.

### 9.4 Requests to third-party servers

When "Image previews" is enabled in the ⚙ settings (the default), URLs that appear as values inside your JSON may be loaded by the browser as images, audio, video or PDF frames. These requests go to the servers hosting those URLs — not to us — and may include the browser's normal referrer information for that site. If a URL contains tokens or query parameters, that URL is visible to its host. Inline `data:` / base64 images are rendered without any request.

"Download all" is a separate action you trigger manually from the image lightbox. It fetches the selected URLs directly, so it still contacts their hosts.

Turning "Image previews" off disables these automatic media requests.

### 9.5 Links

The viewer contains links to https://jsontoolbox.cc and an optional support link to https://ko-fi.com/kbmjj123. They open in a new tab only when you click them and are governed by those sites' own privacy policies. In the Chinese UI the support link instead shows locally bundled QR code images; no network request is made.

### 9.6 Permissions

`storage` (local preferences and the last preview), and a content script registered for all sites plus `file://` URLs (needed to detect JSON pages; local-file access additionally requires you to enable "Allow access to file URLs" in Chrome). No `host_permissions`, `tabs`, `clipboardWrite` or `unlimitedStorage` permissions are requested.

### 9.7 Source code

The extension's source is published on [GitHub](https://github.com/kbmjj123/json-browser-plugins). You can inspect it to verify the practices described above, in the same way Section 1 suggests for the website.

## 10. Children's Privacy

JsonToolBox and the browser extension are not directed at children under 13. We do not knowingly collect personal information from children. If you believe a child has provided us with personal information, please contact us and we will take appropriate steps.

## 11. Changes to This Policy

We may update this Privacy Policy from time to time to reflect changes in our practices or legal requirements. The "Last updated" date at the top will be revised accordingly. Material changes to these practices will be published on this page and disclosed to users, including extension users. We encourage you to review this policy periodically.

## 12. Contact

If you have questions about this Privacy Policy or our privacy practices, please contact us at:

[hello@jsontoolbox.cc](mailto:hello@jsontoolbox.cc)

For questions specifically about the browser extension, you can also open an issue at [github.com/kbmjj123/json-browser-plugins/issues](https://github.com/kbmjj123/json-browser-plugins/issues).

We will respond to privacy-related inquiries as promptly as possible.
