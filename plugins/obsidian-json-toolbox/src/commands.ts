import yaml from 'js-yaml'

export type Ok<T> = { ok: true } & T
export type Err = { ok: false; error: string }

export function formatJson(input: string, indent = 2): Ok<{ output: string }> | Err {
  try {
    return { ok: true, output: JSON.stringify(JSON.parse(input), null, indent) }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) }
  }
}

export function validateJson(input: string): Ok<Record<string, never>> | Err {
  try {
    JSON.parse(input)
    return { ok: true } as Ok<Record<string, never>>
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return { ok: false, error: `Invalid JSON: ${message}` }
  }
}

export function toggleJsonYaml(
  input: string,
): Ok<{ output: string; direction: 'json→yaml' | 'yaml→json' }> | Err {
  try {
    const parsed = JSON.parse(input)
    return { ok: true, output: yaml.dump(parsed), direction: 'json→yaml' }
  } catch {
    // not JSON — fall through and try YAML
  }

  try {
    const loaded = yaml.load(input)
    if (loaded === null || typeof loaded !== 'object') {
      return { ok: false, error: 'Input is neither JSON nor a YAML mapping' }
    }
    return { ok: true, output: JSON.stringify(loaded, null, 2), direction: 'yaml→json' }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) }
  }
}

function cell(value: unknown): string {
  if (value === null) return 'null'
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

export function toTable(input: string): Ok<{ headers: string[]; rows: string[][] }> | Err {
  let parsed: unknown
  try {
    parsed = JSON.parse(input)
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) }
  }

  if (Array.isArray(parsed)) {
    const objects = parsed.filter(
      (item): item is Record<string, unknown> =>
        item !== null && typeof item === 'object' && !Array.isArray(item),
    )
    if (objects.length === 0) return { ok: false, error: 'Array has no objects to tabulate' }

    const headers: string[] = []
    objects.forEach((obj) => {
      Object.keys(obj).forEach((key) => {
        if (!headers.includes(key)) headers.push(key)
      })
    })
    const rows = objects.map((obj) => headers.map((key) => cell(obj[key])))
    return { ok: true, headers, rows }
  }

  if (parsed !== null && typeof parsed === 'object') {
    const entries = Object.entries(parsed as Record<string, unknown>)
    return {
      ok: true,
      headers: ['key', 'value'],
      rows: entries.map(([key, value]) => [key, cell(value)]),
    }
  }

  return { ok: false, error: 'Only JSON objects and arrays of objects can be tabulated' }
}
