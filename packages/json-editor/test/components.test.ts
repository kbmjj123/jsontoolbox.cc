/**
 * Component smoke tests.
 *
 * These deliberately avoid `view="editor"` / `view="both"`: that would mount
 * CodeMirror 6, which needs layout APIs (`ResizeObserver`, real
 * `Range.getClientRects`) jsdom does not implement. `JsonEditor` is therefore
 * mounted in tree-only mode, which renders the toolbar, status bar and
 * `TreeView` without the editor.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import TreeView from '../src/vue/TreeView.vue'
import JsonEditor from '../src/vue/JsonEditor.vue'
import { registerJsonEditor, type JsonEditorElement } from '../src/wc'

const SAMPLE = '{"title":"Demo","users":[{"name":"Ada","age":36}]}'

/** Last element of an array (ES2020-safe; avoids `Array.prototype.at`). */
function last<T>(arr: T[] | undefined): T | undefined {
  return arr && arr.length > 0 ? arr[arr.length - 1] : undefined
}

/** `copyText` falls back to `execCommand` when the async API is missing. */
function stubClipboard() {
  const writeText = vi.fn().mockResolvedValue(undefined)
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText },
    configurable: true,
    writable: true,
  })
  return writeText
}

describe('TreeView', () => {
  beforeEach(stubClipboard)

  it('renders the visible rows for the default expand depth', () => {
    const wrapper = mount(TreeView, { props: { text: SAMPLE } })
    // root, title, users, users[0]
    expect(wrapper.findAll('.je-row')).toHaveLength(4)
    expect(wrapper.text()).toContain('title')
    expect(wrapper.text()).toContain('users')
  })

  it('offers path, JSONPath and value copy for non-root nodes', async () => {
    const writeText = stubClipboard()
    const wrapper = mount(TreeView, { props: { text: SAMPLE } })
    const row = wrapper.findAll('.je-row')[1] // `title`

    // The root node has an empty path, so its path + actions buttons are hidden.
    expect(wrapper.findAll('.je-row')[0].findAll('.je-row-actions button')).toHaveLength(2)
    // A non-root leaf shows copy path / jsonpath / value plus the actions menu.
    expect(row.findAll('.je-row-actions button')).toHaveLength(4)

    await row.findAll('button')[0].trigger('click')
    expect(writeText).toHaveBeenLastCalledWith('title')

    await row.findAll('button')[1].trigger('click')
    expect(writeText).toHaveBeenLastCalledWith('$.title')

    await row.findAll('button')[2].trigger('click')
    expect(writeText).toHaveBeenLastCalledWith('Demo')

    expect(wrapper.emitted('copied')?.map((e) => (e[0] as { kind: string }).kind)).toEqual([
      'path',
      'jsonPath',
      'value',
    ])
  })

  it('redacts leaf values at sensitive paths when masked', () => {
    const wrapper = mount(TreeView, {
      props: { text: SAMPLE, masked: true, sensitivePaths: ['title'] },
    })
    const row = wrapper.findAll('.je-row')[1] // `title` leaf, path === 'title'
    expect(row.find('.je-value').text()).toBe('••••')
    // The value-insight chip is suppressed for masked leaves.
    expect(row.find('.je-value-insight').exists()).toBe(false)
  })

  it('filters by key search and reports the match count', async () => {
    const wrapper = mount(TreeView, { props: { text: SAMPLE } })
    const input = wrapper.get('input[type="search"]')
    await input.setValue('users')
    await nextTick()
    expect(wrapper.text()).toContain('1 matches')

    await input.setValue('nothing-here')
    await nextTick()
    expect(wrapper.text()).toContain('No matches')
  })

  it('switches search mode and reflects it in the count', async () => {
    const wrapper = mount(TreeView, { props: { text: SAMPLE } })
    const input = wrapper.get('input[type="search"]')
    const select = wrapper.get('select.je-mode')

    // Default mode is "key": only the `users` key matches.
    await input.setValue('users')
    await nextTick()
    expect(wrapper.text()).toContain('1 matches')

    // Path mode also matches every descendant path containing "users".
    await select.setValue('path')
    await nextTick()
    expect(wrapper.text()).toContain('matches')
    expect(wrapper.text()).not.toContain('No matches')
  })

  it('shows the invalid-expression hint for unsupported JSONPath', async () => {
    const wrapper = mount(TreeView, { props: { text: SAMPLE } })
    const input = wrapper.get('input[type="search"]')
    const select = wrapper.get('select.je-mode')

    await select.setValue('jsonpath')
    await nextTick()
    await input.setValue('$.users[0:2]')
    await nextTick()
    expect(wrapper.text()).toContain('Invalid or unsupported JSONPath expression')

    // A supported expression clears the hint and reports matches.
    await input.setValue("$.users[?(@.age==36)]")
    await nextTick()
    expect(wrapper.text()).not.toContain('Invalid or unsupported JSONPath expression')
    expect(wrapper.text()).toContain('1 matches')
  })

  it('shows a value-insight chip for a recognized leaf (e.g. a color)', () => {
    const wrapper = mount(TreeView, {
      props: { text: '{"color":"#ff0000","epoch":1690000000000}' },
    })
    expect(wrapper.find('.je-insight').exists()).toBe(true)
    expect(wrapper.find('.je-swatch').exists()).toBe(true)
  })

  it('emits select with the path pair when a row is clicked', async () => {
    const wrapper = mount(TreeView, { props: { text: SAMPLE } })
    await wrapper.findAll('.je-row')[1].trigger('click')
    expect(wrapper.emitted('select')?.[0][0]).toMatchObject({
      path: 'title',
      jsonPath: '$.title',
      value: 'Demo',
    })
  })

  it('renames a field through the actions menu and writes back text', async () => {
    const wrapper = mount(TreeView, { props: { text: SAMPLE } })
    const row = wrapper.findAll('.je-row')[1] // `title`
    await last(row.findAll('.je-row-actions button'))!.trigger('click') // actions menu
    await nextTick()
    await wrapper.find('.je-menu button').trigger('click') // first item: Rename
    await nextTick()
    const input = wrapper.find('.je-inline-input')
    await input.setValue('heading')
    await input.trigger('keyup.enter')
    await nextTick()
    expect(last(wrapper.emitted('update:text'))?.[0]).toContain('"heading"')
    expect(last(wrapper.emitted('update:text'))?.[0]).not.toContain('"title"')
  })

  it('adds a field through the actions menu', async () => {
    const wrapper = mount(TreeView, { props: { text: SAMPLE } })
    // `users[0]` is an object container — Add field is available there.
    const row = wrapper.findAll('.je-row')[3]
    await last(row.findAll('.je-row-actions button'))!.trigger('click')
    await nextTick()
    const addFieldBtn = wrapper.findAll('.je-menu button').find((b) => b.text() === 'Add field')!
    await addFieldBtn.trigger('click')
    await nextTick()
    const inputs = wrapper.findAll('.je-inline-input')
    await inputs[0].setValue('count')
    await inputs[1].setValue('3')
    await inputs[1].trigger('keyup.enter')
    await nextTick()
    const out = last(wrapper.emitted('update:text'))?.[0] as string
    expect(out).toContain('"count"')
    expect(out).toContain('3')
  })

  it('supports undo after an edit', async () => {
    const wrapper = mount(TreeView, { props: { text: SAMPLE } })
    const before = (last(wrapper.emitted('update:text'))?.[0] as string) ?? SAMPLE
    const row = wrapper.findAll('.je-row')[1]
    await last(row.findAll('.je-row-actions button'))!.trigger('click')
    await nextTick()
    await wrapper.find('.je-menu button').trigger('click') // Rename
    await nextTick()
    await wrapper.find('.je-inline-input').setValue('heading')
    await wrapper.find('.je-inline-input').trigger('keyup.enter')
    await nextTick()
    // Click undo
    const undoBtn = wrapper.findAll('.je-btn-icon').find((b) => b.attributes('aria-label') === 'Undo')!
    await undoBtn.trigger('click')
    await nextTick()
    expect(last(wrapper.emitted('update:text'))?.[0]).toBe(before)
  })

  it('applies a batch value to selected nodes', async () => {
    const wrapper = mount(TreeView, { props: { text: SAMPLE } })
    // Turn on batch mode
    const batchBtn = wrapper.findAll('.je-btn').find((b) => b.text() === 'Batch select')!
    await batchBtn.trigger('click')
    await nextTick()
    // Select the `title` and `users` rows (both have paths)
    const rows = wrapper.findAll('.je-row')
    await rows[1].find('.je-batch-check').trigger('click')
    await rows[2].find('.je-batch-check').trigger('click')
    await nextTick()
    await wrapper.find('.je-batch-input').setValue('42')
    await wrapper.find('.je-batch-bar .je-btn').trigger('click')
    await nextTick()
    const out = last(wrapper.emitted('update:text'))?.[0] as string
    // Batch value 42 is coerced to a number where the target was a leaf; here
    // it replaces both selected nodes' values.
    expect(out).toContain('42')
  })
})

describe('JsonEditor', () => {
  beforeEach(stubClipboard)

  it('reports a valid document', () => {
    const wrapper = mount(JsonEditor, {
      props: { modelValue: '{"a":1}', view: 'tree' },
    })
    expect(wrapper.text()).toContain('Valid JSON')
    expect(wrapper.text()).toContain('7 chars')
    expect(wrapper.find('.je-status-loc').exists()).toBe(false)
  })

  it('reports the error location and exposes a jump button', async () => {
    const wrapper = mount(JsonEditor, {
      props: { modelValue: '{"a":1,}', view: 'tree' },
    })
    expect(wrapper.text()).toContain('Invalid JSON')

    const jump = wrapper.get('.je-status-loc')
    expect(jump.attributes('aria-label')).toBe('Jump to the error line')
    expect(jump.text()).toMatch(/^Line \d+, column \d+$/)

    const emitted = wrapper.emitted('error') ?? []
    const last = emitted[emitted.length - 1]?.[0] as
      | { message: string; location: { line: number } }
      | undefined
    expect(last?.message).toEqual(expect.any(String))
    expect(last?.location.line).toBeGreaterThan(0)
  })

  it('honours bordered and showStatus', () => {
    const framed = mount(JsonEditor, { props: { modelValue: '{}', view: 'tree' } })
    expect(framed.classes()).toContain('je-root')
    expect(framed.classes()).not.toContain('je-flat')
    expect(framed.find('.je-status').exists()).toBe(true)

    const bare = mount(JsonEditor, {
      props: { modelValue: '{}', view: 'tree', bordered: false, showStatus: false },
    })
    expect(bare.classes()).toContain('je-flat')
    expect(bare.find('.je-status').exists()).toBe(false)
  })

  it('renders the attribution link only when asked to', () => {
    expect(mount(JsonEditor, { props: { modelValue: '{}', view: 'tree' } }).find('.je-attribution').exists()).toBe(
      false
    )

    const withBadge = mount(JsonEditor, {
      props: { modelValue: '{}', view: 'tree', attribution: true },
    })
    expect(withBadge.get('.je-attribution a').attributes('href')).toBe('https://jsontoolbox.cc')
  })

  it('renders the table view for an array of records (no CodeMirror mount)', () => {
    const wrapper = mount(JsonEditor, {
      props: { modelValue: '[{"title":"Demo","users":1},{"title":"X","users":2}]', view: 'table' },
    })
    expect(wrapper.find('.je-table').exists()).toBe(true)
    const headers = wrapper.findAll('.je-th').map((h) => h.text().replace(/[▲▼]/g, '').trim())
    expect(headers).toContain('title')
    expect(headers).toContain('users')
    // Editor / tree panes are not rendered in table-only view.
    expect(wrapper.find('.cm-editor').exists()).toBe(false)
  })

  it('shows the table notice for non-array JSON', () => {
    const wrapper = mount(JsonEditor, {
      props: { modelValue: '{"a":1}', view: 'table' },
    })
    expect(wrapper.find('.je-table-empty').exists()).toBe(true)
  })
})

describe('JsonEditorElement', () => {
  it('registers <json-editor> and renders into a shadow root', async () => {
    expect(registerJsonEditor()).toBe(true)

    const el = document.createElement('json-editor') as JsonEditorElement
    el.setAttribute('value', SAMPLE)
    el.setAttribute('view', 'tree')
    document.body.appendChild(el)
    await nextTick()

    expect(el.shadowRoot).not.toBeNull()
    expect(el.shadowRoot?.textContent).toContain('users')
    expect(el.getValue()).toBe(SAMPLE)

    el.remove()
  })
})
