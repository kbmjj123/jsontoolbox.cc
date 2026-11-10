export const SITE_URL = 'https://jsontoolbox.cc'

/**
 * Never auto-beautify the tool site's own UI pages. Exact hosts only — NOT a
 * suffix match: `resources.jsontoolbox.cc` hosts the raw JSON sample files
 * linked from our blog posts and must be beautified like any other JSON page.
 */
export const OWN_HOSTS: readonly string[] = ['jsontoolbox.cc', 'www.jsontoolbox.cc']

/** Auto-beautify cap. Above this we stay completely silent — no parse, no DOM work. */
export const MAX_AUTO_JSON_BYTES = 2 * 1024 * 1024
