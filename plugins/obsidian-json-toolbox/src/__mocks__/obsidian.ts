/**
 * Minimal stub of the Obsidian API for unit tests.
 *
 * The `obsidian` npm package ships types only (no JS entry), so vitest cannot
 * resolve it. `vitest.config.ts` aliases `obsidian` to this file.
 */
export class Modal {
  contentEl = document.createElement('div')
  titleEl = document.createElement('div')
  constructor(public app: unknown) {}
  open(): void {
    this.onOpen()
  }
  onOpen(): void {}
  onClose(): void {}
  close(): void {
    this.onClose()
  }
}

export class Plugin {
  constructor(public app: unknown, public manifest: unknown) {}
  addCommand(): unknown {
    return {}
  }
  addSettingTab(): void {}
  registerEvent(): void {}
}

export class PluginSettingTab {
  containerEl = document.createElement('div')
  constructor(public app: unknown, public plugin: unknown) {}
  display(): void {}
}

export class Setting {
  constructor(public containerEl: HTMLElement) {}
  setName(name: string): this {
    const heading = document.createElement('div')
    heading.textContent = name
    this.containerEl.appendChild(heading)
    return this
  }
  setHeading(): this {
    return this
  }
}

export class Notice {
  constructor(public message: string) {}
}
