import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const conf = readFileSync(join(new URL('..', import.meta.url).pathname, 'docker/nginx.conf'), 'utf8')

describe('nginx.conf', () => {
  it('监听 8080（非特权端口，允许非 root 运行）', () => {
    expect(conf).toMatch(/listen\s+8080;/)
    expect(conf).not.toMatch(/listen\s+80;/)
  })

  it('不写 user 指令（容器以 USER nginx 启动，非 root 下该指令会被忽略并告警）', () => {
    expect(conf).not.toMatch(/^\s*user\s+/m)
  })

  it('HTML 路由按 $uri → $uri.html → $uri/index.html 解析，缺失返回 404', () => {
    expect(conf).toMatch(/try_files \$uri \$uri\.html \$uri\/index\.html =404;/)
  })

  it('缺失的静态资源返回 404 且不回落 HTML', () => {
    // Pick the extension-based asset block (the one covering js|mjs).
    const assetBlock = conf.match(/location ~\*[^\n]*\{[\s\S]*?\n\s*\}/g)?.find(b => b.includes('js|mjs'))
    expect(assetBlock).toBeTruthy()
    expect(assetBlock!).toMatch(/try_files \$uri =404;/)
    expect(assetBlock!).toMatch(/error_page 404 = @plain404;/)
    expect(conf).toMatch(/@plain404[\s\S]*?return 404/)
  })

  it('HTML 404 保留 404 状态码', () => {
    expect(conf).toMatch(/error_page 404 \/404\.html;/)
  })

  it('Worker/JS 以 application/javascript 提供', () => {
    expect(conf).toMatch(/include\s+\/etc\/nginx\/mime\.types;/)
  })

  it('/runtime-config.json 走 /tmp 且禁用缓存', () => {
    const block = conf.match(/location = \/runtime-config\.json[\s\S]*?\n\s*\}/)
    expect(block).toBeTruthy()
    expect(block![0]).toMatch(/alias \/tmp\/jt-runtime\/runtime-config\.json;/)
    expect(block![0]).toMatch(/Cache-Control "no-store"/)
  })

  it('临时目录全部落在 /tmp（兼容只读根文件系统）', () => {
    for (const d of ['client_body_temp_path', 'proxy_temp_path', 'fastcgi_temp_path', 'uwsgi_temp_path', 'scgi_temp_path']) {
      expect(conf).toMatch(new RegExp(`${d}\\s+/tmp/`))
    }
    expect(conf).toMatch(/pid\s+\/tmp\//)
  })
})
