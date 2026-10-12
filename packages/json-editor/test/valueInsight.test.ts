import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import ValueInsight from '../src/vue/ValueInsight.vue'

describe('ValueInsight', () => {
  it('renders a color swatch for a hex color', () => {
    const wrapper = mount(ValueInsight, { props: { value: '#ff0000' } })
    expect(wrapper.find('.je-swatch').exists()).toBe(true)
    expect(wrapper.find('.je-insight-val').text()).toBe('#ff0000')
  })

  it('renders formatted timestamps', () => {
    const wrapper = mount(ValueInsight, { props: { value: '2026-10-12T08:30:00Z' } })
    expect(wrapper.find('.je-insight').classes()).toContain('is-timestamp')
    expect(wrapper.text()).toContain('2026')
  })

  it('renders a toggleable JWT payload', async () => {
    const jwt =
      'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIiwibmFtZSI6IkFkYSJ9.4jt1iRdzOTo'
    const wrapper = mount(ValueInsight, { props: { value: jwt } })
    expect(wrapper.find('.je-insight').classes()).toContain('is-jwt')
    expect(wrapper.find('.je-insight-pre').exists()).toBe(false)
    await wrapper.find('button').trigger('click')
    expect(wrapper.find('.je-insight-pre').exists()).toBe(true)
    expect(wrapper.find('.je-insight-pre').text()).toContain('"name": "Ada"')
  })

  it('renders a base64 text preview', () => {
    const wrapper = mount(ValueInsight, { props: { value: btoa('hello world') } })
    expect(wrapper.find('.je-insight').classes()).toContain('is-base64')
    expect(wrapper.text()).toContain('hello world')
  })

  it('renders nothing for an unrecognized value', () => {
    const wrapper = mount(ValueInsight, { props: { value: 'plain text' } })
    expect(wrapper.find('.je-insight').exists()).toBe(false)
  })
})
