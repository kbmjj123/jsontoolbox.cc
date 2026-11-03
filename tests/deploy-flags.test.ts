import { describe, it, expect } from 'vitest'
import {
  SELF_HOSTED_DEFAULTS,
  HOSTED_DEFAULTS,
  buildDefaults,
  mergeFlags,
  normalizeRuntimeConfig,
  resolveCanonicalBase,
} from '../app/composables/useDeployFlags'

describe('buildDefaults', () => {
  it('官方构建：全部来源展示开启，不发运行期请求', () => {
    const f = buildDefaults({ selfHosted: false, siteName: 'JSON Toolbox', baseUrl: 'https://jsontoolbox.cc' })
    expect(f).toEqual({
      selfHosted: false,
      siteName: 'JSON Toolbox',
      branding: true,
      externalBadges: true,
      remoteLoad: true,
      contactForm: true,
      baseUrl: 'https://jsontoolbox.cc',
      runtimeLoaded: false,
    })
  })

  it('自托管构建：第三方请求相关能力默认关闭', () => {
    const f = buildDefaults({ selfHosted: true, siteName: 'JSON Toolbox', baseUrl: 'http://localhost:8080' })
    expect(f.selfHosted).toBe(true)
    expect(f.branding).toBe(true) // 来源展示默认保留
    expect(f.externalBadges).toBe(false)
    expect(f.remoteLoad).toBe(false)
    expect(f.contactForm).toBe(false)
  })

  it('预设常量与构建默认值一致', () => {
    expect(SELF_HOSTED_DEFAULTS.externalBadges).toBe(false)
    expect(HOSTED_DEFAULTS.externalBadges).toBe(true)
  })
})

describe('normalizeRuntimeConfig', () => {
  it('未知字段与非布尔值被丢弃', () => {
    const out = normalizeRuntimeConfig({
      siteName: 'Acme JSON',
      branding: 'yes',
      externalBadges: 'nope',
      remoteLoad: true,
      contactForm: 0,
      analyticsId: 'x', // 不在白名单
      __proto__: { polluted: 1 } as never,
    })
    expect(out.siteName).toBe('Acme JSON')
    expect(out.branding).toBe(true)
    expect(out.remoteLoad).toBe(true)
    expect(out.contactForm).toBe(false)
    expect(out.externalBadges).toBeUndefined()
    expect((out as Record<string, unknown>).analyticsId).toBeUndefined()
  })

  it('baseUrl 只接受 http(s) 主机[:端口]，非法值忽略', () => {
    expect(normalizeRuntimeConfig({ baseUrl: 'https://json.example.com:8443' }).baseUrl)
      .toBe('https://json.example.com:8443')
    expect(normalizeRuntimeConfig({ baseUrl: 'javascript:alert(1)' }).baseUrl).toBeUndefined()
    expect(normalizeRuntimeConfig({ baseUrl: 'http://x/evil?a=1' }).baseUrl).toBeUndefined()
  })

  it('非对象输入返回空对象', () => {
    expect(normalizeRuntimeConfig(null)).toEqual({})
    expect(normalizeRuntimeConfig('nope')).toEqual({})
  })
})

describe('mergeFlags', () => {
  it('运行期值覆盖构建期默认值，未被覆盖项保留', () => {
    const base = buildDefaults({ selfHosted: true, siteName: 'JSON Toolbox', baseUrl: '' })
    const merged = mergeFlags(base, { branding: false, externalBadges: true })
    expect(merged.branding).toBe(false)
    expect(merged.externalBadges).toBe(true)
    expect(merged.remoteLoad).toBe(false)
    expect(merged.runtimeLoaded).toBe(true)
  })

  it('未提供运行期配置时 runtimeLoaded 为 false', () => {
    const base = buildDefaults({ selfHosted: true, siteName: 'JSON Toolbox', baseUrl: '' })
    expect(mergeFlags(base, {}).runtimeLoaded).toBe(false)
  })
})

describe('resolveCanonicalBase', () => {
  it('优先运行期 baseUrl，其次当前 origin，最后构建期地址', () => {
    expect(resolveCanonicalBase('https://intra.example.com')).toBe('https://intra.example.com')
    expect(resolveCanonicalBase('')).toBe('')
  })
})
