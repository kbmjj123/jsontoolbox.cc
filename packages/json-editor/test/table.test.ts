import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import TableView from '../src/vue/TableView.vue'

const { downloadFile } = vi.hoisted(() => ({ downloadFile: vi.fn((..._args: any[]) => true) }))
vi.mock('../src/vue/clipboard', () => ({
  downloadFile: (...args: any[]) => downloadFile(...args),
  copyText: vi.fn(() => Promise.resolve(true)),
}))

const ROWS = [
  { name: 'Ada', age: 36 },
  { name: 'Bob', age: 24 },
]

describe('TableView', () => {
  it('renders a column per object key and a row per record', async () => {
    const wrapper = mount(TableView, { props: { value: ROWS } })
    const headers = wrapper.findAll('.je-th').map((h) => h.text().replace(/[▲▼]/g, '').trim())
    expect(headers).toEqual(['name', 'age'])
    // Two data rows.
    expect(wrapper.findAll('.je-table tbody tr')).toHaveLength(2)
    expect(wrapper.find('.je-td').text()).toBe('Ada')
  })

  it('shows a notice for non-array JSON', () => {
    const wrapper = mount(TableView, { props: { value: { a: 1 } } })
    expect(wrapper.find('.je-table-empty').exists()).toBe(true)
    expect(wrapper.find('.je-table').exists()).toBe(false)
  })

  it('sorts rows descending when a header is clicked twice', async () => {
    const wrapper = mount(TableView, { props: { value: ROWS } })
    const nameHeader = wrapper.findAll('.je-th')[0]
    await nameHeader.trigger('click') // asc → Ada, Bob
    await nextTick()
    await nameHeader.trigger('click') // desc → Bob, Ada
    await nextTick()
    const firstRowCells = wrapper.findAll('.je-table tbody tr')[0].findAll('.je-td')
    expect(firstRowCells[0].text()).toBe('Bob')
  })

  it('hides a column via the column toggle menu', async () => {
    const wrapper = mount(TableView, { props: { value: ROWS } })
    await wrapper.find('.je-col-toggle .je-btn').trigger('click') // open menu
    await nextTick()
    expect(wrapper.find('.je-col-menu').exists()).toBe(true)
    await wrapper.find('.je-col-item input').trigger('change') // uncheck "name"
    await nextTick()
    const headers = wrapper.findAll('.je-th').map((h) => h.text().replace(/[▲▼]/g, '').trim())
    expect(headers).toEqual(['age'])
  })

  it('exports visible columns to CSV through downloadFile', async () => {
    downloadFile.mockClear()
    const wrapper = mount(TableView, { props: { value: ROWS } })
    const exportBtn = wrapper.findAll('.je-btn').find((b) => b.text() === 'Export CSV')!
    await exportBtn.trigger('click')
    await nextTick()
    expect(downloadFile).toHaveBeenCalledTimes(1)
    const [filename, csv] = downloadFile.mock.calls[0]
    expect(filename).toBe('json-table.csv')
    expect(csv).toContain('name,age')
    expect(csv).toContain('Ada,36')
    expect(csv).toContain('Bob,24')
  })

  it('renders index-based columns for an array of arrays', () => {
    const wrapper = mount(TableView, { props: { value: [['x', 1], ['y', 2]] } })
    const headers = wrapper.findAll('.je-th').map((h) => h.text().replace(/[▲▼]/g, '').trim())
    expect(headers).toEqual(['Column 1', 'Column 2'])
    expect(wrapper.find('.je-td').text()).toBe('x')
  })
})
