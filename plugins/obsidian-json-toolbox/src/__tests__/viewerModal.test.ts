import { describe, it, expect } from 'vitest'
import { JsonViewerModal } from '../viewerModal'

describe('JsonViewerModal', () => {
  it('renders tree for valid JSON', () => {
    const modal = new JsonViewerModal({} as never, '{"a":1,"b":"#ff0000"}')
    modal.open()
    expect(modal.contentEl.textContent).toContain('a')
    expect(modal.contentEl.querySelector('.json-toolbox-swatch')).toBeTruthy()
  })

  it('renders error message for invalid JSON', () => {
    const modal = new JsonViewerModal({} as never, 'not json')
    modal.open()
    expect(modal.contentEl.querySelector('.json-toolbox-error')).toBeTruthy()
  })

  it('renders footer link to jsontoolbox.cc', () => {
    const modal = new JsonViewerModal({} as never, '{"a":1}')
    modal.open()
    expect(modal.contentEl.innerHTML).toContain('jsontoolbox.cc')
  })

  it('renders a table in table mode', () => {
    const modal = new JsonViewerModal({} as never, '[{"a":1},{"a":2}]', 'table')
    modal.open()
    expect(modal.contentEl.querySelectorAll('th').length).toBe(1)
    expect(modal.contentEl.querySelectorAll('td').length).toBe(2)
  })

  it('clears content on close', () => {
    const modal = new JsonViewerModal({} as never, '{"a":1}')
    modal.open()
    modal.close()
    expect(modal.contentEl.innerHTML).toBe('')
  })
})
