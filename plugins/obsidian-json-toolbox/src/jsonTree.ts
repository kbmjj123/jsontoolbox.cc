export type JsonNode = {
  key: string | number | null
  value: unknown
  path: string
  kind: 'object' | 'array' | 'primitive'
  children: JsonNode[]
}

export function buildTree(
  value: unknown,
  key: string | number | null = null,
  path = '',
): JsonNode {
  const isObject = value !== null && typeof value === 'object' && !Array.isArray(value)
  const isArray = Array.isArray(value)

  if (isObject || isArray) {
    const entries = isArray
      ? (value as unknown[]).map((item, index) => [index, item] as const)
      : Object.entries(value as Record<string, unknown>)

    const children = entries.map(([childKey, childValue]) => {
      const childPath =
        typeof childKey === 'number'
          ? `${path}[${childKey}]`
          : path
            ? `${path}.${childKey}`
            : String(childKey)
      return buildTree(childValue, childKey, childPath)
    })

    return { key, value, path, kind: isArray ? 'array' : 'object', children }
  }

  return { key, value, path, kind: 'primitive', children: [] }
}

export type ParseResult =
  | { ok: true; root: unknown }
  | { ok: false; error: string }

export function parseJson(input: string): ParseResult {
  try {
    return { ok: true, root: JSON.parse(input) }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) }
  }
}
