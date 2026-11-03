#!/bin/sh
# Whitelisted runtime configuration for self-hosted containers.
#
# Static files cannot read container environment variables, so the entrypoint
# materialises a tiny JSON file from an explicit allowlist. Anything not listed
# here is ignored, and every value is validated before it is written — an
# invalid value falls back to the default instead of breaking the JSON.
#
# Sourced by docker/entrypoint.sh; also sourced directly by tests.

JT_RUNTIME_DIR="${JT_RUNTIME_DIR:-/tmp/jt-runtime}"

# --- validation helpers -------------------------------------------------------

_jt_bool() {
  # $1 raw value, $2 default (true|false)
  case "$(printf '%s' "$1" | tr '[:upper:]' '[:lower:]')" in
    1|true|yes|on) echo 'true' ;;
    0|false|no|off) echo 'false' ;;
    *) echo "$2" ;;
  esac
}

_jt_site_name() {
  # $1 raw value, $2 default. Reject anything outside a conservative charset so
  # the generated JSON can never be broken or carry markup.
  case "$1" in
    ''|*[!A-Za-z0-9._\ -]*) echo "$2" ;;
    *) echo "$1" ;;
  esac
}

_jt_base_url() {
  # $1 raw value. Only http(s) host[:port], optional trailing slash.
  case "$1" in
    http://[A-Za-z0-9.-]*|https://[A-Za-z0-9.-]*)
      case "$1" in
        *[!A-Za-z0-9.:/-]*) echo '' ;;
        *) echo "$1" ;;
      esac
      ;;
    *) echo '' ;;
  esac
}

# --- writer ------------------------------------------------------------------

jt_write_runtime_config() {
  mkdir -p "$JT_RUNTIME_DIR"
  _out="$JT_RUNTIME_DIR/runtime-config.json"

  _site_name="$(_jt_site_name "${JT_SITE_NAME:-}" 'JSON Toolbox')"
  _branding="$(_jt_bool "${JT_SHOW_BRANDING:-}" true)"
  _badges="$(_jt_bool "${JT_SHOW_EXTERNAL_BADGES:-}" false)"
  _remote="$(_jt_bool "${JT_ENABLE_REMOTE_LOAD:-}" false)"
  _contact="$(_jt_bool "${JT_ENABLE_CONTACT_FORM:-}" false)"
  _base_url="$(_jt_base_url "${JT_BASE_URL:-}")"

  # Length guard: a very long name is a mistake, not a configuration.
  if [ "${#_site_name}" -gt 60 ]; then
    _site_name='JSON Toolbox'
    echo "JT_SITE_NAME too long, using default" >&2
  fi

  printf '%s' "{
  \"siteName\": \"$_site_name\",
  \"branding\": $_branding,
  \"externalBadges\": $_badges,
  \"remoteLoad\": $_remote,
  \"contactForm\": $_contact,
  \"baseUrl\": \"$_base_url\"
}
" > "$_out"

  # nginx worker runs as an unprivileged user; keep the file world-readable.
  chmod 0644 "$_out"
}
