import { PluginSettingTab, Setting } from 'obsidian'
import type JsonToolboxPlugin from './main'
import { SITE_URL } from './viewerModal'

export class JsonToolboxSettingTab extends PluginSettingTab {
  constructor(app: never, plugin: JsonToolboxPlugin) {
    super(app, plugin as never)
  }

  display(): void {
    const { containerEl } = this
    containerEl.innerHTML = ''

    new Setting(containerEl).setName('JSON Toolbox').setHeading()

    const about = document.createElement('div')
    about.className = 'json-toolbox-footer'

    about.appendChild(
      document.createTextNode('Rich JSON viewing and formatting inside Obsidian. '),
    )

    const link = document.createElement('a')
    link.href = SITE_URL
    link.textContent = SITE_URL
    link.setAttribute('target', '_blank')
    link.setAttribute('rel', 'noopener noreferrer')
    about.appendChild(link)

    about.appendChild(
      document.createTextNode(
        ' — the full online version with 30+ JSON tools. All processing happens locally; no telemetry.',
      ),
    )

    containerEl.appendChild(about)
  }
}
