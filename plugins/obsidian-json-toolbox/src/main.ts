import { Notice, Plugin } from 'obsidian'
import { JsonViewerModal } from './viewerModal'
import { JsonToolboxSettingTab } from './settings'
import { formatJson, validateJson, toggleJsonYaml } from './commands'

export default class JsonToolboxPlugin extends Plugin {
  onload(): void {
    this.addCommand({
      id: 'open-json-viewer',
      name: 'Open JSON Viewer',
      callback: () => {
        new JsonViewerModal(this.app, this.getSelectionText(), 'tree').open()
      },
    })

    this.addCommand({
      id: 'format-json',
      name: 'Format JSON',
      callback: () => {
        this.replaceSelection((text) => formatJson(text))
      },
    })

    this.addCommand({
      id: 'validate-json',
      name: 'Validate JSON',
      callback: () => {
        const result = validateJson(this.getSelectionText())
        new Notice(result.ok ? '✓ Valid JSON' : `✗ ${result.error}`)
      },
    })

    this.addCommand({
      id: 'json-yaml-toggle',
      name: 'JSON ↔ YAML',
      callback: () => {
        this.replaceSelection((text) => {
          const result = toggleJsonYaml(text)
          return result.ok
            ? { ok: true as const, output: result.output, notice: `Converted ${result.direction}` }
            : { ok: false as const, error: result.error }
        })
      },
    })

    this.addCommand({
      id: 'json-to-table',
      name: 'JSON → Table/CSV',
      callback: () => {
        new JsonViewerModal(this.app, this.getSelectionText(), 'table').open()
      },
    })

    this.addSettingTab(new JsonToolboxSettingTab(this.app as never, this))
  }

  onunload(): void {
    // nothing to dispose
  }

  private getSelectionText(): string {
    const editor = this.app.workspace.activeEditor?.editor
    if (!editor) return ''
    const selected = editor.getSelection()
    return selected && selected.trim() ? selected : editor.getValue()
  }

  private replaceSelection(
    transform: (
      text: string,
    ) =>
      | { ok: true; output: string; notice?: string }
      | { ok: false; error: string },
  ): void {
    const editor = this.app.workspace.activeEditor?.editor
    if (!editor) {
      new Notice('No active editor')
      return
    }

    const selected = editor.getSelection()
    const input = selected && selected.trim() ? selected : editor.getValue()
    const result = transform(input)

    if (!result.ok) {
      new Notice(`✗ ${result.error}`)
      return
    }

    if (selected) editor.replaceSelection(result.output)
    else editor.setValue(result.output)

    new Notice(result.notice ?? '✓ Done')
  }
}
