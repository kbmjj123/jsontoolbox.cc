# 用 Docker 自托管 JsonToolBox

> 本文命令均在仓库自带配置上验证；未经真机验证的能力已明确标注"未验证"。

## 1. 它能做什么，不能做什么

能做的：

- 拉取预构建镜像直接启动一个实例，**不需要 Node 环境和本地编译**。
- 核心能力（格式化、校验、树形查看、编辑、转换、导入导出）全部在**浏览器**里完成。容器只提供静态文件。
- 默认不向第三方发起请求：第三方徽章图片、从 URL 加载、联系表单、统计脚本全部默认关闭。
- 图标在构建期打包进产物，断网也能正常显示图标。

不能做的：

- 没有账号系统、数据库、管理后台、多租户、自动升级服务、许可证服务器。
- 不提供远程 JSON 存储。浏览器 localStorage 不等于容器持久化，**重建容器即丢**。
- 不自带 HTTPS 和公网安全防护。
- `noindex` 只是告诉搜索引擎不要收录，**它不是认证，也不是保密措施**。别靠它保护敏感数据。

## 2. 快速开始

一条命令：

```bash
docker run -d --name jsontoolbox -p 127.0.0.1:8080:8080 ghcr.io/kbmjj123/jsontoolbox:latest
```

然后打开 <http://127.0.0.1:8080>。

用 Compose（仓库 `compose.yml` 已配好，默认只绑回环地址）：

```bash
docker compose up -d
docker compose logs -f        # 看到 nginx 启动即可
```

冒烟测试（需要容器在运行）：

```bash
pnpm smoke:selfhost          # 或 node scripts/smoke-selfhost.mjs --base http://127.0.0.1:8080
```

本地自己构建镜像：

```bash
docker build -f docker/Dockerfile -t jsontoolbox:selfhost \
  --build-arg SITE_URL=http://localhost:8080 .
```

## 3. 端口与数据

| 项 | 值 |
|---|---|
| 容器内部端口 | `8080`（非特权端口，容器以 `nginx` 用户运行） |
| Compose 默认映射 | `127.0.0.1:8080:8080`（只监听本机） |
| 健康检查 | `HEALTHCHECK` 每 30 秒请求 `/index.html` |
| 需要挂载的卷 | **无** |
| 会丢的数据 | 浏览器 localStorage 里的编辑器偏好；容器内不保存任何 JSON |

镜像内可写目录只有 `/tmp`（`/tmp/jt-runtime` 放运行期配置，`/tmp/nginx` 放 nginx 临时文件），所以 `--read-only --tmpfs /tmp` 这类加固选项才有可能生效。

## 4. 配置（运行期可改的只有这 6 个）

静态文件读不到容器环境变量。启动时 `entrypoint.sh` 按白名单把下面这些变量写成 `/runtime-config.json`，前端再拉取合并。**不在表里的变量一律忽略，不会进入产物。**

| 变量 | 用途 | 默认 | 取值 | 何时生效 |
|---|---|---|---|---|
| `JT_SITE_NAME` | 页脚显示的站名 | `JSON Toolbox` | 字母数字、点、下划线、连字符、空格；≤60 字符；非法值回退默认 | 容器启动后刷新页面 |
| `JT_SHOW_BRANDING` | 是否显示来源入口（GitHub / X 链接） | `1` | `1/true/yes/on`、`0/false/no/off` | 同上 |
| `JT_SHOW_EXTERNAL_BADGES` | 页脚第三方徽章图片（会产生外部请求） | `0` | 同上 | 同上 |
| `JT_ENABLE_REMOTE_LOAD` | "从 URL 加载 JSON"（用户触发的外部请求） | `0` | 同上 | 同上 |
| `JT_ENABLE_CONTACT_FORM` | 联系表单（会向第三方端点提交） | `0` | 同上 | 同上 |
| `JT_BASE_URL` | canonical 基址 | 空（用当前访问地址） | 仅 `http(s)://主机[:端口]`，非法值忽略 | 同上 |

示例：

```bash
docker run -d --name jsontoolbox -p 127.0.0.1:8080:8080 \
  -e JT_SITE_NAME="Team JSON Tools" \
  -e JT_SHOW_BRANDING=0 \
  -e JT_BASE_URL="https://json.internal:8443" \
  ghcr.io/kbmjj123/jsontoolbox:latest
```

**只能在构建期改的**（改了要重新构建镜像，用 `--build-arg`）：

- `SITE_URL`：构建期写入 `site.url`，影响 canonical / hreflang / sitemap 绝对地址。
- `SITE_NAME`：构建期写入页面标题后缀。
- 索引策略（是否 noindex）、是否生成 sitemap、是否生成 OG 图：由 `NUXT_PUBLIC_SELF_HOSTED=1` 决定，自托管构建固定为「不索引、无 sitemap、不生成 OG 图」。
- base path（部署在 `/json/` 这类子路径下）：**当前不支持**。

## 5. 与在线版（jsontoolbox.cc）的差异

| 项 | 在线版 | 自托管默认 |
|---|---|---|
| 第三方徽章图片 | 显示 | 关闭 |
| 从 URL 加载 JSON | 可用 | 关闭 |
| 联系表单 | 可用 | 关闭 |
| 统计脚本 | 按构建期配置 | 无 |
| `robots.txt` | `Allow: *` | `Disallow: /` |
| sitemap | 生成 | 不生成 |
| 页面 meta robots | 无 | `noindex, nofollow` |
| OG 图 | 构建期生成 | 不生成 |
| 图标 | 运行时回源 Iconify API | 构建期打包，离线可用 |
| 站名 / 来源入口 | JSON Toolbox | 可用 `JT_SITE_NAME` / `JT_SHOW_BRANDING` 改 |

功能层面两边一致：改的是外部请求、索引与展示，不是工具本身。

## 6. 离线可用性与例外

断网后核心功能可用（图标已本地化、字体本地、无统计）。

会有外部请求的例外只有两类：

1. 你在 JSON 里放了一个图片 / 音视频 / PDF 的 URL，值预览功能会去请求它（界面会提示这是远程资源）。
2. 你自己点击了指向官网或 GitHub 的链接。

## 7. 内网与公网边界

- `127.0.0.1:8080:8080`：只有本机能访问。**个人使用就用这个。**
- 受控内网：把映射改成内网地址（如 `192.168.1.10:8080:8080`），并确认这台机器本身不直接暴露在公网。
- **不要把 `0.0.0.0:8080:8080` 用在公网机器上。** 需要对外服务时，前面放反向代理（Nginx / Caddy / Traefik）负责 HTTPS、鉴权和限流，容器只监听内网。
- 群晖 / 威联通的 Container Station 用的是同一份镜像；注意它的端口映射默认是全网卡，手动改回内网地址。

## 8. 加固选项（先在你的环境跑通冒烟再开）

`compose.yml` 里注释掉了三项，默认不开启：

```yaml
read_only: true      # 配合 tmpfs /tmp
tmpfs:
  - /tmp
cap_drop:
  - ALL
```

外加资源限额（`mem_limit` / `cpus`）按你的机器来定。**未经冒烟验证的安全配置不要直接上生产**——本站不提供「默认安全」的承诺。

## 9. 升级与回滚

升级：

```bash
docker compose pull
docker compose up -d
```

回滚：把 `compose.yml` 里的 tag 改回上一个版本，再 `docker compose up -d`。

**一定要固定版本 tag**（如 `:1.2.0`）才可复现。`:latest` 只是图方便，升级后想回退到你原来那个版本是做不到的——除非你记着当时的 `sha-xxxx` 摘要。

## 10. 版本与来源

- 镜像 tag 对应仓库的 Release；同时提供 `sha-<短 commit>` 标签。
- 源码：<https://github.com/kbmjj123/jsontoolbox.cc>
- 在线版：<https://jsontoolbox.cc>
- 许可证：MIT（见仓库 `LICENSE.md`）

### 镜像可见性（必须手动做一次）

GHCR 上第一次推送出来的包默认是**私有**的，别人 `docker pull` 会报 denied。推送完成后做一次：

- 网页：<https://github.com/users/kbmjj123/packages/container/jsontoolbox/settings> → *Change visibility* → **Public**
- 或 API（需要带 `write:packages` 的 PAT）：

```bash
curl -X PATCH \
  -H "Authorization: Bearer $GH_PAT" \
  -H "Accept: application/vnd.github+json" \
  https://api.github.com/user/packages/container/jsontoolbox \
  -d '{"visibility":"public"}'
```

只有设为公开后，文档里的 `docker run ghcr.io/kbmjj123/jsontoolbox:latest` 对别人才有意义。

**待确认项**（发布前需要维护者确认，当前按建议值写的）：

1. 镜像名 `ghcr.io/kbmjj123/jsontoolbox` 是否可用；是否同时推 Docker Hub。
2. arm64 支持：镜像已构建多架构，但**未在 arm64 真机上跑过冒烟**，在此之前不对外声明 arm64 支持。
3. `README.md` 的 "Self-hosting & Attribution" 条款（约 186–232 行）与 MIT 的关系：MIT 不要求保留网页反链，该条款属于请求而非许可条件。条款如需调整，由维护者决定。

自托管实例页脚与嵌入片段里的来源链接**指向实例自己的地址**，不会自动回链官网。是否在你的站点上注明来源，由你自己决定。
