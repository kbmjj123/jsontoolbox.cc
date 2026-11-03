import { describe, it, expect } from 'vitest'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname

/** Runs the generator in a subshell and returns the parsed JSON. */
function generate(env: Record<string, string>): Record<string, unknown> {
  const dir = mkdtempSync(join(tmpdir(), 'jt-rc-'))
  const out = join(dir, 'runtime-config.json')
  execFileSync('sh', ['-c', `. ${join(ROOT, 'docker/runtime-config.sh')} && jt_write_runtime_config`], {
    env: { ...process.env, ...env, JT_RUNTIME_DIR: dir },
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  if (!existsSync(out)) throw new Error('runtime-config.json was not written')
  return JSON.parse(readFileSync(out, 'utf8'))
}

describe('runtime-config.sh', () => {
  it('未设置任何变量时输出自托管默认值', () => {
    const cfg = generate({ JT_SITE_NAME: '', JT_SHOW_BRANDING: '', JT_SHOW_EXTERNAL_BADGES: '', JT_ENABLE_REMOTE_LOAD: '', JT_ENABLE_CONTACT_FORM: '', JT_BASE_URL: '' })
    expect(cfg).toEqual({
      siteName: 'JSON Toolbox',
      branding: true,
      externalBadges: false,
      remoteLoad: false,
      contactForm: false,
      baseUrl: '',
    })
  })

  it('接受合法布尔写法并归一化', () => {
    const cfg = generate({ JT_SHOW_BRANDING: '0', JT_SHOW_EXTERNAL_BADGES: 'true', JT_ENABLE_REMOTE_LOAD: 'YES', JT_ENABLE_CONTACT_FORM: 'off' })
    expect(cfg.branding).toBe(false)
    expect(cfg.externalBadges).toBe(true)
    expect(cfg.remoteLoad).toBe(true)
    expect(cfg.contactForm).toBe(false)
  })

  it('非法布尔值回退默认', () => {
    const cfg = generate({ JT_SHOW_BRANDING: 'maybe' })
    expect(cfg.branding).toBe(true)
  })

  it('站名拒绝引号与尖括号等危险字符', () => {
    expect(generate({ JT_SITE_NAME: 'Acme "JSON"' }).siteName).toBe('JSON Toolbox')
    expect(generate({ JT_SITE_NAME: '<script>' }).siteName).toBe('JSON Toolbox')
    expect(generate({ JT_SITE_NAME: 'Team JSON Tools' }).siteName).toBe('Team JSON Tools')
  })

  it('baseUrl 只接受 http(s) 主机[:端口]', () => {
    expect(generate({ JT_BASE_URL: 'https://json.internal:8080' }).baseUrl).toBe('https://json.internal:8080')
    expect(generate({ JT_BASE_URL: 'ftp://x' }).baseUrl).toBe('')
    expect(generate({ JT_BASE_URL: 'http://a/evil?b=1' }).baseUrl).toBe('')
  })

  it('白名单外的环境变量绝不进入产物', () => {
    const cfg = generate({
      SECRET_TOKEN: 'super-secret',
      NUXT_PUBLIC_UMAMI_ANALYTICS_ID: 'leak-me',
      JT_UNKNOWN: 'x',
    })
    const serialized = JSON.stringify(cfg)
    expect(serialized).not.toContain('super-secret')
    expect(serialized).not.toContain('leak-me')
    expect(Object.keys(cfg).sort()).toEqual(['baseUrl', 'branding', 'contactForm', 'externalBadges', 'remoteLoad', 'siteName'])
  })

  it('输出是合法 JSON（含边界字符也不破坏结构）', () => {
    expect(() => generate({ JT_SITE_NAME: 'A "B" \\ C' })).not.toThrow()
  })
})
