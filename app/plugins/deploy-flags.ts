import {
  buildDefaults,
  mergeFlags,
  normalizeRuntimeConfig,
  type DeployFlags,
} from '~/composables/useDeployFlags'

/**
 * Loads the container-provided /runtime-config.json on self-hosted instances.
 *
 * The hosted site never issues this request (guarded by `selfHosted`), so it
 * is byte-for-byte unchanged. Failures are silent: build-time defaults stay.
 */
export default defineNuxtPlugin(async () => {
  const config = useRuntimeConfig().public as {
    selfHosted?: boolean
    siteName?: string
    baseUrl?: string
  }

  const flags = useState<DeployFlags>(
    'deploy-flags',
    () => buildDefaults({
      selfHosted: config.selfHosted,
      siteName: config.siteName,
      baseUrl: config.baseUrl,
    }),
  )

  if (!import.meta.client || !config.selfHosted) return

  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 2000)
    const res = await fetch('/runtime-config.json', {
      cache: 'no-store',
      signal: controller.signal,
    })
    clearTimeout(timer)
    // A non-JSON response (or 404) simply means "use defaults".
    if (!res.ok) return
    const raw: unknown = await res.json()
    flags.value = mergeFlags(flags.value, normalizeRuntimeConfig(raw))
  } catch {
    // Offline / blocked / malformed — build-time defaults remain in effect.
  }
})
