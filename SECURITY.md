# Security Policy

## Our Commitment

JSON Toolbox takes security and privacy seriously. As a **100% client-side** application, our security model is fundamentally different from traditional web applications — your data never leaves your browser.

## How We Protect Your Data

### No Server-Side Processing

- All JSON processing happens **entirely in your browser** using JavaScript
- We have no backend servers that receive, process, or store your JSON content
- There is no API endpoint that receives user data
- Once you close the page, your data is gone

### No Data Collection

- We do **not** collect the content you paste into our tools
- We do **not** track what JSON data you process
- We do **not** store any data that could reconstruct your input

### Third-Party Scripts

| Service | Purpose | Access to Your Data |
|---------|---------|-------------------|
| Google AdSense | Advertising | None — ads load independently of tool functionality |

No other third-party scripts are loaded. Your JSON content is never shared with advertisers or any external service.

## Verifying Our Claims

We encourage security researchers and technical users to verify our privacy claims:

1. **Network Inspection**: Open DevTools → Network tab → use any tool → confirm zero requests containing your JSON data
2. **Source Code Audit**: Our entire codebase is open source at [github.com/kbmjj123/jsontoolbox.cc](https://github.com/kbmjj123/jsontoolbox.cc)
3. **Static Analysis**: Search the codebase for `fetch`, `XMLHttpRequest`, `sendBeacon`, or `WebSocket` — you'll find none that transmit user data

## Supported Versions

| Version | Supported |
|---------|-----------|
| Latest (main branch) | ✅ |
| Older versions | ❌ — always use the latest |

## Reporting a Vulnerability

If you discover a security vulnerability, please report it responsibly:

1. **Do NOT** open a public GitHub issue for security vulnerabilities
2. **Email** us at [hello@jsontoolbox.cc](mailto:hello@jsontoolbox.cc) with:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
3. We will acknowledge your report within **48 hours**
4. We will provide a fix or mitigation plan within **7 days**
5. We will credit you in our security advisory (unless you prefer to remain anonymous)

## Scope

### In Scope

- Cross-site scripting (XSS) in our tools
- Content Security Policy bypasses
- Any vulnerability that could expose user data to third parties
- Supply chain attacks on our dependencies

### Out of Scope

- Social engineering attacks
- Attacks requiring physical access to the user's device
- Vulnerabilities in third-party services (e.g., Google AdSense)
- Denial of service attacks

## Bug Bounty

We currently do not offer a formal bug bounty program. However, we deeply appreciate responsible disclosure and will publicly acknowledge researchers who help us improve security.

## Contact

- **Security reports**: [hello@jsontoolbox.cc](mailto:hello@jsontoolbox.cc)
- **General inquiries**: [hello@jsontoolbox.cc](mailto:hello@jsontoolbox.cc)
- **GitHub**: [github.com/kbmjj123/jsontoolbox.cc](https://github.com/kbmjj123/jsontoolbox.cc)
