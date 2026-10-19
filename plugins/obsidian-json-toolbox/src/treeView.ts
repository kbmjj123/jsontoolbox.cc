import type { JsonNode } from './jsonTree'
import {
  detectValueKind,
  decodeJwt,
  decodeBase64,
  formatTimestamps,
  isColorValue,
  getColorStyle,
  truncate,
} from './mediaPreview'

function el(tag: string, className?: string, text?: string): HTMLElement {
  const node = document.createElement(tag)
  if (className) node.className = className
  if (text !== undefined) node.textContent = text
  return node
}

function valueClass(value: unknown): string {
  if (value === null) return 'json-toolbox-val-null'
  if (value === undefined) return 'json-toolbox-val-null'
  switch (typeof value) {
    case 'string': return 'json-toolbox-val-string'
    case 'number': return 'json-toolbox-val-number'
    case 'boolean': return 'json-toolbox-val-boolean'
    default: return ''
  }
}

function formatPrimitive(value: unknown): string {
  if (value === null) return 'null'
  if (typeof value === 'string') return `"${value}"`
  return String(value)
}

/** Append a small chip such as `jwt`, `uuid`, `ip`, or a decoded timestamp. */
function appendKindChip(parent: HTMLElement, label: string): void {
  parent.appendChild(el('span', 'json-toolbox-kind', label))
}

/**
 * Append an image thumbnail inside the value row. Rendered only for values
 * detected as `image` — never for arbitrary URLs, so the plugin does not fire
 * third-party requests for links that merely look like they might be images.
 */
function appendThumbnail(parent: HTMLElement, src: string): void {
  const img = document.createElement('img')
  img.className = 'json-toolbox-thumb'
  img.src = src
  img.alt = ''
  img.addEventListener('error', () => img.remove())
  parent.appendChild(img)
}

function renderValue(parent: HTMLElement, value: unknown): void {
  const kind = detectValueKind(value)

  if (isColorValue(value)) {
    const swatch = el('span', 'json-toolbox-swatch')
    swatch.style.backgroundColor = getColorStyle(String(value)) ?? ''
    parent.appendChild(swatch)
  }

  parent.appendChild(el('span', valueClass(value), formatPrimitive(value)))

  if (!kind) return

  if (kind === 'image') {
    appendThumbnail(parent, String(value))
    appendKindChip(parent, 'image')
    return
  }

  if (kind === 'url' || kind === 'audio' || kind === 'video' || kind === 'pdf') {
    const anchor = document.createElement('a')
    anchor.href = String(value)
    anchor.textContent = 'open'
    anchor.setAttribute('target', '_blank')
    anchor.setAttribute('rel', 'noopener noreferrer')
    anchor.className = 'json-toolbox-kind'
    parent.appendChild(anchor)
    if (kind !== 'url') appendKindChip(parent, kind)
    return
  }

  if (kind === 'email') {
    const anchor = document.createElement('a')
    anchor.href = `mailto:${String(value)}`
    anchor.textContent = 'mailto'
    anchor.className = 'json-toolbox-kind'
    parent.appendChild(anchor)
    return
  }

  if (kind === 'timestamp') {
    const views = formatTimestamps(value as string | number)
    if (views) appendKindChip(parent, views.iso)
    return
  }

  if (kind === 'jwt') {
    const parts = decodeJwt(String(value))
    appendKindChip(parent, 'jwt')
    if (parts) {
      appendKindChip(parent, truncate(JSON.stringify(parts.payload), 80))
    }
    return
  }

  if (kind === 'base64') {
    const decoded = decodeBase64(String(value))
    appendKindChip(parent, 'base64')
    if (decoded?.kind === 'image' && decoded.dataUrl) {
      appendThumbnail(parent, decoded.dataUrl)
    } else if (decoded?.kind === 'text') {
      appendKindChip(parent, truncate(decoded.text ?? '', 80))
    }
    return
  }

  appendKindChip(parent, kind)
}

function renderNode(parent: HTMLElement, node: JsonNode, depth: number): void {
  const row = el('div', 'json-toolbox-node')
  row.style.paddingLeft = `${depth * 14}px`

  const expandable = node.children.length > 0

  if (expandable) {
    const toggle = el('span', 'json-toolbox-toggle', '▸')
    const childBox = el('div')
    let expanded = false

    toggle.addEventListener('click', (event) => {
      event.stopPropagation()
      expanded = !expanded
      toggle.textContent = expanded ? '▾' : '▸'
      childBox.style.display = expanded ? '' : 'none'
    })

    row.appendChild(toggle)
    if (node.key !== null) {
      row.appendChild(el('span', 'json-toolbox-key', String(node.key)))
      row.appendChild(el('span', 'json-toolbox-punct', ': '))
    }
    row.appendChild(
      el(
        'span',
        'json-toolbox-punct',
        node.kind === 'array' ? `[${node.children.length}]` : `{${node.children.length}}`,
      ),
    )
    parent.appendChild(row)

    childBox.style.display = 'none'
    node.children.forEach((child) => renderNode(childBox, child, depth + 1))
    parent.appendChild(childBox)
    return
  }

  row.appendChild(el('span'))
  if (node.key !== null) {
    row.appendChild(el('span', 'json-toolbox-key', String(node.key)))
    row.appendChild(el('span', 'json-toolbox-punct', ': '))
  }
  renderValue(row, node.value)
  parent.appendChild(row)
}

export function renderTree(container: HTMLElement, root: JsonNode): void {
  container.innerHTML = ''
  container.classList.add('json-toolbox-tree')
  root.children.forEach((child) => renderNode(container, child, 0))
  if (root.children.length === 0 && root.kind === 'primitive') {
    renderNode(container, root, 0)
  }
}

export function renderTable(container: HTMLElement, headers: string[], rows: string[][]): void {
  container.innerHTML = ''
  const table = document.createElement('table')
  table.className = 'json-toolbox-table'

  const thead = document.createElement('thead')
  const headRow = document.createElement('tr')
  headers.forEach((header) => headRow.appendChild(el('th', undefined, header)))
  thead.appendChild(headRow)
  table.appendChild(thead)

  const tbody = document.createElement('tbody')
  rows.forEach((row) => {
    const tr = document.createElement('tr')
    row.forEach((cell) => tr.appendChild(el('td', undefined, cell)))
    tbody.appendChild(tr)
  })
  table.appendChild(tbody)

  container.appendChild(table)
}
