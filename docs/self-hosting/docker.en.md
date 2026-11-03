# Self-hosting JsonToolBox with Docker

> Commands below target the configuration shipped in this repository. Anything not verified on real hardware is labelled "not verified".

## 1. What it does and does not do

Does:

- Start an instance from a prebuilt image — **no Node toolchain, no local build**.
- Run the core tools (format, validate, tree view, edit, convert, import/export) **in the browser**. The container only serves static files.
- Make no third-party requests by default: badge images, "load from URL", the contact form and analytics are all off.
- Bundle icons at build time, so they still render with no internet connection.

Does not:

- Provide accounts, a database, an admin panel, multi-tenancy, auto-updates or a licence server.
- Store JSON remotely. Browser localStorage is not container persistence — **recreating the container loses it**.
- Provide HTTPS or public-internet hardening.
- Treat `noindex` as protection. It asks search engines not to index; it is **not authentication and not a confidentiality measure**.

## 2. Quick start

One command:

```bash
docker run -d --name jsontoolbox -p 127.0.0.1:8080:8080 ghcr.io/kbmjj123/jsontoolbox:latest
```

Then open <http://127.0.0.1:8080>.

With Compose (the repository `compose.yml` binds loopback only):

```bash
docker compose up -d
docker compose logs -f        # nginx started = ready
```

Smoke test (needs a running container):

```bash
pnpm smoke:selfhost          # or: node scripts/smoke-selfhost.mjs --base http://127.0.0.1:8080
```

Build the image yourself:

```bash
docker build -f docker/Dockerfile -t jsontoolbox:selfhost \
  --build-arg SITE_URL=http://localhost:8080 .
```

## 3. Ports and data

| Item | Value |
|---|---|
| Container port | `8080` (unprivileged; the container runs as `nginx`) |
| Compose default mapping | `127.0.0.1:8080:8080` (loopback only) |
| Health check | `HEALTHCHECK` requests `/index.html` every 30s |
| Volumes required | **none** |
| Data you can lose | Editor preferences in browser localStorage. No JSON is stored in the container. |

The only writable paths inside the image are under `/tmp` (`/tmp/jt-runtime` for the generated runtime config, `/tmp/nginx` for nginx temp files), which is what makes `--read-only --tmpfs /tmp` possible at all.

## 4. Configuration (six runtime variables, no more)

Static files cannot read container environment variables. On start, `entrypoint.sh` writes the allowlisted variables below into `/runtime-config.json`, and the front end fetches and merges it. **Anything not in this table is ignored and never reaches the output.**

| Variable | Purpose | Default | Accepted values | Takes effect |
|---|---|---|---|---|
| `JT_SITE_NAME` | Site name in the footer | `JSON Toolbox` | letters, digits, `.` `_` `-` and spaces; ≤ 60 chars; invalid values fall back to the default | after a page reload |
| `JT_SHOW_BRANDING` | Show source links (GitHub / X) | `1` | `1/true/yes/on`, `0/false/no/off` | same |
| `JT_SHOW_EXTERNAL_BADGES` | Third-party badge images in the footer (external requests) | `0` | same | same |
| `JT_ENABLE_REMOTE_LOAD` | "Load JSON from URL" (user-triggered external request) | `0` | same | same |
| `JT_ENABLE_CONTACT_FORM` | Contact form (posts to a third-party endpoint) | `0` | same | same |
| `JT_BASE_URL` | Canonical base URL | empty (use the current origin) | `http(s)://host[:port]` only; invalid values are dropped | same |

Example:

```bash
docker run -d --name jsontoolbox -p 127.0.0.1:8080:8080 \
  -e JT_SITE_NAME="Team JSON Tools" \
  -e JT_SHOW_BRANDING=0 \
  -e JT_BASE_URL="https://json.internal:8443" \
  ghcr.io/kbmjj123/jsontoolbox:latest
```

**Build-time only** (pass with `--build-arg`, requires rebuilding the image):

- `SITE_URL` — baked into `site.url`; affects canonical, hreflang and absolute sitemap URLs.
- `SITE_NAME` — baked into the page title suffix.
- Indexing policy (noindex), sitemap generation and OG images — fixed by `NUXT_PUBLIC_SELF_HOSTED=1`: no indexing, no sitemap, no OG images.
- Base path (serving under `/json/`): **not supported**.

## 5. Differences from the hosted site

| Item | Hosted site | Self-hosted default |
|---|---|---|
| Third-party badge images | shown | off |
| Load JSON from URL | available | off |
| Contact form | available | off |
| Analytics script | per build config | none |
| `robots.txt` | `Allow: *` | `Disallow: /` |
| Sitemap | generated | not generated |
| Page meta robots | none | `noindex, nofollow` |
| OG images | generated at build time | not generated |
| Icons | fetched from the Iconify API at runtime | bundled at build time, work offline |
| Site name / source links | JSON Toolbox | configurable via `JT_SITE_NAME` / `JT_SHOW_BRANDING` |

Tool behaviour is identical on both. What changes is external requests, indexing and branding.

## 6. Offline behaviour and exceptions

Core features work with no internet connection (icons bundled, fonts local, no analytics).

Two exceptions make external requests:

1. Your JSON contains an image / audio / video / PDF URL and the value preview fetches it (the UI flags it as a remote resource).
2. You click a link to the hosted site or the GitHub repository yourself.

## 7. LAN and public exposure

- `127.0.0.1:8080:8080` — this machine only. **Use this for personal use.**
- Controlled LAN — map to the LAN address (for example `192.168.1.10:8080:8080`) and make sure that host is not directly reachable from the internet.
- **Do not use `0.0.0.0:8080:8080` on a public host.** If you need to serve others, put a reverse proxy (Nginx / Caddy / Traefik) in front for HTTPS, auth and rate limiting, and let the container listen on the internal network only.
- Synology / QNAP Container Station runs the same image; note that its default port mapping binds all interfaces — change it back to a LAN address.

## 8. Hardening options (run the smoke test first)

Three options are commented out in `compose.yml` and off by default:

```yaml
read_only: true      # with tmpfs /tmp
tmpfs:
  - /tmp
cap_drop:
  - ALL
```

Add resource limits (`mem_limit` / `cpus`) to match your hardware. **Do not put an unverified hardening setup in front of production** — this project makes no "secure by default" promise.

## 9. Upgrade and rollback

Upgrade:

```bash
docker compose pull
docker compose up -d
```

Rollback: set the previous version tag in `compose.yml` and run `docker compose up -d` again.

**Pin a version tag** (for example `:1.2.0`) if you want reproducible deploys. `:latest` is only convenient — once you upgrade, you cannot get "the version you had" back unless you noted its `sha-xxxx` digest.

## 10. Versions and sources

- Image tags follow repository releases; a `sha-<short commit>` tag is published alongside.
- Source: <https://github.com/kbmjj123/jsontoolbox.cc>
- Hosted site: <https://jsontoolbox.cc>
- Licence: MIT (see `LICENSE.md`)

### Image visibility (one manual step required)

A GHCR package is **private** after its first push, so `docker pull` fails for everyone else with "denied". Do this once after the first publish:

- Web: <https://github.com/users/kbmjj123/packages/container/jsontoolbox/settings> → *Change visibility* → **Public**
- Or via API (PAT with `write:packages`):

```bash
curl -X PATCH \
  -H "Authorization: Bearer $GH_PAT" \
  -H "Accept: application/vnd.github+json" \
  https://api.github.com/user/packages/container/jsontoolbox \
  -d '{"visibility":"public"}'
```

Until the package is public, `docker run ghcr.io/kbmjj123/jsontoolbox:latest` only works on your own account.

**Pending confirmation** (maintainer decisions before publishing; current values are proposals):

1. Whether the image name `ghcr.io/kbmjj123/jsontoolbox` is available, and whether Docker Hub should be a second target.
2. arm64: multi-arch images are built, but **arm64 has not been smoke-tested on real hardware**, so arm64 support is not claimed yet.
3. The "Self-hosting & Attribution" clause in `README.md` (around lines 186–232) versus MIT: MIT does not require keeping a web backlink, so that clause is a request, not a licence condition. Changing it is the maintainer's call.

Source links in a self-hosted footer and in generated embed snippets **point at the instance itself**, not at the hosted site. Whether you credit the project on your own site is up to you.
