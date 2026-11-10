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

  it('renders a remote image thumbnail when imagePreview is on', () => {
    const wrapper = mount(ValueInsight, { props: { value: 'https://cdn.example.com/a.png' } })
    expect(wrapper.find('.je-insight').classes()).toContain('is-image')
    const img = wrapper.find('img.je-insight-img')
    expect(img.exists()).toBe(true)
    expect(img.attributes('src')).toBe('https://cdn.example.com/a.png')
  })

  it('renders a link (not an image) for remote images when imagePreview is off', () => {
    const wrapper = mount(ValueInsight, { props: { value: 'https://cdn.example.com/a.png', imagePreview: false } })
    expect(wrapper.find('img.je-insight-img').exists()).toBe(false)
    expect(wrapper.find('a.je-insight-link').exists()).toBe(true)
  })

  it('renders an email as a mailto link', () => {
    const wrapper = mount(ValueInsight, { props: { value: 'a@b.com' } })
    expect(wrapper.find('a.je-insight-link').attributes('href')).toBe('mailto:a@b.com')
  })

  it('renders a URL as a clickable link', () => {
    const wrapper = mount(ValueInsight, { props: { value: 'https://example.com/x' } })
    expect(wrapper.find('a.je-insight-link').attributes('href')).toBe('https://example.com/x')
  })
})
