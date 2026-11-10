export const SITE_URL = 'https://jsontoolbox.cc'

/** Never auto-beautify our own site (or its subdomains). */
export const OWN_HOSTS: readonly string[] = ['jsontoolbox.cc']

/** Auto-beautify cap. Above this we stay completely silent — no parse, no DOM work. */
export const MAX_AUTO_JSON_BYTES = 2 * 1024 * 1024
