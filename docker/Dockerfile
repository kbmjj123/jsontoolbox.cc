# syntax=docker/dockerfile:1.7
#
# The prerendered output is plain HTML/JS/CSS: it is CPU-architecture
# independent. So the expensive stage (pnpm install + prerender) always runs on
# the build machine's native platform, and only the nginx runtime is built per
# target platform. That keeps arm64 builds out of QEMU.

ARG NODE_IMAGE=node:22.16-alpine
ARG NGINX_IMAGE=nginx:1.27-alpine

# ── Stage 1: build the static site ──────────────────────────────────────────
FROM --platform=$BUILDPLATFORM ${NODE_IMAGE} AS builder
WORKDIR /app

ENV PNPM_HOME=/pnpm
ENV PATH=/pnpm:$PATH
RUN corepack enable && corepack prepare pnpm@10.25.0 --activate

# Manifests first so the dependency layer is cacheable.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.json ./
COPY packages ./packages
RUN --mount=type=cache,id=pnpm-selfhost,target=/pnpm/store \
    pnpm install --frozen-lockfile --ignore-scripts

COPY . .

# `@kbmjj123/json-editor` must be built before the site build (normally done by
# postinstall, which --ignore-scripts skips). `nuxt prepare` is part of the same
# postinstall; `nuxt build` prepares on its own.
RUN pnpm run build:pkg

# Self-hosted build flags. Override SITE_URL / SITE_NAME if the instance has a
# stable public address — otherwise canonical URLs fall back to the runtime
# origin (JT_BASE_URL / window.location.origin).
ARG SITE_URL=http://localhost:8080
ARG SITE_NAME=JSON Toolbox
ENV NUXT_PUBLIC_SELF_HOSTED=1 \
    NUXT_PUBLIC_SITE_URL=$SITE_URL \
    NUXT_PUBLIC_SITE_NAME=$SITE_NAME

RUN pnpm build

# ── Stage 2: serve ──────────────────────────────────────────────────────────
FROM ${NGINX_IMAGE} AS runtime

LABEL org.opencontainers.image.title="JsonToolBox" \
      org.opencontainers.image.description="Free, client-side JSON tools. Self-hosted build." \
      org.opencontainers.image.source="https://github.com/kbmjj123/jsontoolbox.cc" \
      org.opencontainers.image.url="https://jsontoolbox.cc" \
      org.opencontainers.image.licenses="MIT"

COPY docker/nginx.conf /etc/nginx/nginx.conf
COPY docker/entrypoint.sh docker/runtime-config.sh /usr/local/bin/
COPY --from=builder /app/.output/public /usr/share/nginx/html

RUN chmod 0755 /usr/local/bin/entrypoint.sh /usr/local/bin/runtime-config.sh \
    && mkdir -p /tmp/jt-runtime /tmp/nginx \
    && chown -R nginx:nginx /tmp/jt-runtime /tmp/nginx

# Runs unprivileged: nginx only calls setuid() when euid == 0, so with no
# `user` directive in nginx.conf master+workers stay as `nginx`.
USER nginx

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -q --spider http://127.0.0.1:8080/index.html || exit 1

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
