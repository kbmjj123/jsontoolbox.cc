import { describe, it, expect, beforeEach } from 'vitest'
import { renderTree, renderTable } from '../treeView'
import { buildTree } from '../jsonTree'

let container: HTMLElement
beforeEach(() => {
  container = document.createElement('div')
  document.body.appendChild(container)
})

describe('renderTree', () => {
  it('renders keys and primitive values', () => {
    renderTree(container, buildTree({ name: 'ada', age: 36 }))
    expect(container.textContent).toContain('name')
    expect(container.textContent).toContain('ada')
    expect(container.textContent).toContain('36')
  })

  it('renders a color swatch for color values', () => {
    renderTree(container, buildTree({ color: '#ff0000' }))
    const swatch = container.querySelector('.json-toolbox-swatch') as HTMLElement
    expect(swatch).toBeTruthy()
    expect(swatch.style.backgroundColor).toBe('rgb(255, 0, 0)')
  })

  it('renders an img for possible image urls', () => {
    renderTree(container, buildTree({ avatar: 'https://cdn.example.com/a.png' }))
    const img = container.querySelector('img.json-toolbox-thumb') as HTMLImageElement
    expect(img).toBeTruthy()
    expect(img.getAttribute('src')).toBe('https://cdn.example.com/a.png')
  })

  it('renders an anchor for plain urls', () => {
    renderTree(container, buildTree({ site: 'https://example.com/page' }))
    const anchor = container.querySelector('a') as HTMLAnchorElement
    expect(anchor).toBeTruthy()
    expect(anchor.getAttribute('href')).toBe('https://example.com/page')
  })

  it('renders decoded timestamp for epoch values', () => {
    renderTree(container, buildTree({ ts: 1700000000 }))
    expect(container.textContent).toContain('2023-11-14T22:13:20.000Z')
  })

  it('renders kind chip for jwt', () => {
    // JWT segments are base64url (no `=` padding) — plain btoa is not a valid JWT.
    const b64url = (input: string) =>
      btoa(input).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
    const jwt = `${b64url('{"alg":"HS256"}')}.${b64url('{"sub":"1"}')}.sig`
    renderTree(container, buildTree({ token: jwt }))
    expect(container.textContent?.toLowerCase()).toContain('jwt')
  })

  it('renders children collapsed by default for nested objects', () => {
    renderTree(container, buildTree({ outer: { inner: 1 } }))
    expect(container.querySelector('.json-toolbox-toggle')).toBeTruthy()
  })
})

describe('renderTable', () => {
  it('renders headers and rows', () => {
    renderTable(container, ['a', 'b'], [['1', '2'], ['3', '4']])
    expect(container.querySelectorAll('th').length).toBe(2)
    expect(container.querySelectorAll('td').length).toBe(4)
  })
})
