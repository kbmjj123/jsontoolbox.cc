/**
 * English dictionary — the fallback for every other locale.
 * Keys are snake_case; `{name}` is a placeholder filled by `t()`.
 */
export const en = {
  valid: 'Valid JSON',
  invalid: 'Invalid JSON',
  empty: 'Nothing to show yet — paste JSON on the left.',
  format: 'Format',
  minify: 'Minify',
  copy: 'Copy',
  copied: 'Copied',
  clear: 'Clear',
  expand_all: 'Expand all',
  collapse_all: 'Collapse all',
  search: 'Search keys and values',
  search_placeholder: 'Search keys and values',
  copy_path: 'Copy path',
  copy_value: 'Copy value',
  copy_jsonpath: 'Copy JSONPath',
  root: 'root',
  keys: '{n} keys',
  items: '{n} items',
  matches: '{n} matches',
  no_matches: 'No matches',
  line_column: 'Line {line}, column {column}',
  chars: '{n} chars',
  paste_blocked: 'Paste blocked: {size} exceeds the {limit} limit.',
  paste_blocked_plain: 'Paste blocked: the pasted content is too large.',
  editor: 'Editor',
  tree: 'Tree',
  both: 'Split',
  attribution: 'Powered by {name}',
} as const

export type MessageKey = keyof typeof en
export type Messages = Record<MessageKey, string>
