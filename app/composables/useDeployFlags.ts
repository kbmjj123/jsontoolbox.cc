/**
 * Deployment flags — hosted site vs. self-hosted (Docker) instance.
 *
 * Build-time values come from `runtimeConfig.public` (baked into the static
 * output). On a self-hosted instance the container can additionally expose a
 * whitelisted `/runtime-config.json`; when present it overrides the UI-only
 * flags. Nothing here may affect tool behaviour.
 */

export interface DeployFlags {
  /** true = built with NUXT_PUBLIC_SELF_HOSTED=1 */
  selfHosted: boolean
  siteName: string
  /** Show "source / powered by" links. Turning it off must not affect tools. */
  branding: boolean
  /** Third-party badge images in the footer (external requests). */
  externalBadges: boolean
  /** "Load JSON from URL" (external request, user-triggered). */
  remoteLoad: boolean
  /** Contact form (posts to a third-party endpoint). */
  contactForm: boolean
  /** Canonical base; empty = use window.location.origin on the client. */
  baseUrl: string
  /** true once /runtime-config.json has been applied (self-hosted only). */
  runtimeLoaded: boolean
}

export type RuntimeConfig = Partial<Omit<DeployFlags, 'selfHosted' | 'runtimeLoaded'>>

/** Self-hosted defaults: no third-party requests, attribution kept. */
export const SELF_HOSTED_DEFAULTS = {
  siteName: 'JSON Toolbox',
  branding: true,
  externalBadges: false,
  remoteLoad: false,
  contactForm: false,
  baseUrl: '',
} as const

/** Hosted site: unchanged behaviour. */
export const HOSTED_DEFAULTS = {
  siteName: 'JSON Toolbox',
  branding: true,
  externalBadges: true,
  remoteLoad: true,
  contactForm: true,
  baseUrl: '',
} as const

export interface BuildInput {
  selfHosted?: boolean
  siteName?: string
  baseUrl?: string
}

export function buildDefaults(input: BuildInput = {}): DeployFlags {
  const preset = input.selfHosted ? SELF_HOSTED_DEFAULTS : HOSTED_DEFAULTS
  return {
    selfHosted: input.selfHosted === true,
    siteName: input.siteName || 'JSON Toolbox',
    branding: preset.branding,
    externalBadges: preset.externalBadges,
    remoteLoad: preset.remoteLoad,
    contactForm: preset.contactForm,
    baseUrl: input.selfHosted ? '' : input.baseUrl || '',
    runtimeLoaded: false,
  }
}

const BOOLEAN_TRUE = new Set(['1', 'true', 'yes', 'on'])
const BOOLEAN_FALSE = new Set(['0', 'false', 'no', 'off'])
const BASE_URL_RE = /^https?:\/\/[A-Za-z0-9.-]+(:[0-9]{1,5})?\/?$/

function asBool(value: unknown): boolean | undefined {
  if (typeof value === 'boolean') return value
  // The container entrypoint only ever writes booleans; 0/1 are accepted here
  // so a hand-written runtime-config.json behaves the way an author expects.
  if (value === 0 || value === 1) return value === 1
  if (typeof value !== 'string') return undefined
  const v = value.trim().toLowerCase()
  if (BOOLEAN_TRUE.has(v)) return true
  if (BOOLEAN_FALSE.has(v)) return false
  return undefined
}

function asSiteName(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const v = value.trim()
  // Keep generated HTML/JSON safe: no markup, no control characters.
  if (!v || v.length > 60 || !/^[A-Za-z0-9._\- ]+$/.test(v)) return undefined
  return v
}

function asBaseUrl(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const v = value.trim()
  return BASE_URL_RE.test(v) ? v.replace(/\/$/, '') : undefined
}

/** Whitelist filter: unknown keys are dropped, invalid values are dropped. */
export function normalizeRuntimeConfig(raw: unknown): RuntimeConfig {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {}
  const src = raw as Record<string, unknown>
  const out: RuntimeConfig = {}

  const siteName = asSiteName(src.siteName)
  if (siteName !== undefined) out.siteName = siteName

  for (const key of ['branding', 'externalBadges', 'remoteLoad', 'contactForm'] as const) {
    const v = asBool(src[key])
    if (v !== undefined) out[key] = v
  }

  const baseUrl = asBaseUrl(src.baseUrl)
  if (baseUrl !== undefined) out.baseUrl = baseUrl

  return out
}

export function mergeFlags(base: DeployFlags, runtime: RuntimeConfig): DeployFlags {
  const hasRuntime = Object.keys(runtime).length > 0
  return {
    ...base,
    ...runtime,
    selfHosted: base.selfHosted,
    runtimeLoaded: base.runtimeLoaded || hasRuntime,
  }
}

/**
 * Canonical base. On a self-hosted instance with no configured base URL the
 * caller should fall back to `window.location.origin` (see `useDeployFlags`).
 * Returns '' when the caller must decide on the client.
 */
export function resolveCanonicalBase(baseUrl: string): string {
  return baseUrl || ''
}

export function useDeployFlags() {
  return useState<DeployFlags>('deploy-flags', () => buildDefaults())
}
