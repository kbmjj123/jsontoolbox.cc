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

    // The root node has an empty path, so its path button is hidden.
    expect(wrapper.findAll('.je-row')[0].findAll('.je-row-actions button')).toHaveLength(2)
    expect(row.findAll('.je-row-actions button')).toHaveLength(3)

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

  it('emits select with the path pair when a row is clicked', async () => {
    const wrapper = mount(TreeView, { props: { text: SAMPLE } })
    await wrapper.findAll('.je-row')[1].trigger('click')
    expect(wrapper.emitted('select')?.[0][0]).toMatchObject({
      path: 'title',
      jsonPath: '$.title',
      value: 'Demo',
    })
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
