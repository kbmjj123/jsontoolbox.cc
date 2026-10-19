import { Modal } from 'obsidian'
import { buildTree, parseJson } from './jsonTree'
import { renderTree, renderTable } from './treeView'
import { toTable } from './commands'

export const SITE_URL = 'https://jsontoolbox.cc'

export type ViewerMode = 'tree' | 'table'

export class JsonViewerModal extends Modal {
  private readonly input: string
  private readonly mode: ViewerMode

  constructor(app: unknown, input: string, mode: ViewerMode = 'tree') {
    super(app as never)
    this.input = input
    this.mode = mode
  }

  onOpen(): void {
    this.titleEl.setText?.('JSON Toolbox')
    this.titleEl.textContent = 'JSON Toolbox'
    this.contentEl.classList.add('json-toolbox-modal')

    const parsed = parseJson(this.input.trim())
    if (!parsed.ok) {
      const created = this.contentEl.createEl?.('div', { cls: 'json-toolbox-error' })
      const node = created ?? document.createElement('div')
      if (!created) {
        node.className = 'json-toolbox-error'
        this.contentEl.appendChild(node)
      }
      node.textContent = `Invalid JSON: ${parsed.error}`
      this.appendFooter()
      return
    }

    const body = document.createElement('div')
    body.className = 'json-toolbox-body'
    this.contentEl.appendChild(body)

    if (this.mode === 'table') {
      const table = toTable(this.input)
      if (table.ok) renderTable(body, table.headers, table.rows)
      else body.textContent = `Cannot build table: ${table.error}`
    } else {
      renderTree(body, buildTree(parsed.root))
    }

    this.appendFooter()
  }

  onClose(): void {
    this.contentEl.innerHTML = ''
  }

  private appendFooter(): void {
    const footer = document.createElement('div')
    footer.className = 'json-toolbox-footer'
    const link = document.createElement('a')
    link.href = SITE_URL
    link.textContent = 'JSON Toolbox'
    link.setAttribute('target', '_blank')
    link.setAttribute('rel', 'noopener noreferrer')
    footer.appendChild(document.createTextNode('Powered by '))
    footer.appendChild(link)
    footer.appendChild(document.createTextNode(' · jsontoolbox.cc'))
    this.contentEl.appendChild(footer)
  }
}
