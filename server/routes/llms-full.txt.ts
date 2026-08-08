// LLMs Full.txt - provides detailed information about the site for LLMs
export default defineEventHandler(() => {
  return `# JSON Toolbox — Full Documentation

## Overview

JSON Toolbox (jsontoolbox.cc) is a free, open-source collection of JSON tools for developers.
All processing happens 100% client-side in the browser — no data is ever uploaded to any server.

## Tools

### Format & Beautify
- **JSON Formatter**: Format and beautify JSON with 2-space, 4-space, or tab indentation
- **JSON Minifier**: Compress JSON to a single line

### Validation
- **JSON Validator**: Validate JSON syntax with detailed error messages and line numbers

### Conversion
- **JSON to CSV**: Convert JSON arrays to CSV for Excel/Google Sheets
- **JSON to YAML**: Convert JSON to YAML format
- **JSON to XML**: Convert JSON to XML format

### View & Explore
- **JSON Tree Viewer**: Interactive tree view with expand/collapse and search
- **JSONPath Tester**: Test JSONPath expressions against JSON data

## Privacy

- 100% client-side processing
- No data upload
- No tracking
- Open source

## Technology

- Nuxt 4 + Vue 3
- TypeScript
- Tailwind CSS
- All JSON processing via browser APIs (JSON.parse/stringify)

## Contact

- Website: https://jsontoolbox.cc
- GitHub: https://github.com/jsontoolbox
`
})
