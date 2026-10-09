/**
 * Inline SVG icons. Kept as strings so the package needs no icon runtime,
 * no webfont, and no network request.
 */

const wrap = (path: string) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${path}</svg>`

export const icons = {
  chevronRight: wrap('<path d="m9 18 6-6-6-6"/>'),
  alignLeft: wrap('<path d="M21 6H3"/><path d="M15 12H3"/><path d="M17 18H3"/>'),
  minimize: wrap('<path d="M4 14h6v6"/><path d="M20 10h-6V4"/><path d="M14 10l7-7"/><path d="M3 21l7-7"/>'),
  copy: wrap(
    '<rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>'
  ),
  check: wrap('<path d="M20 6 9 17l-5-5"/>'),
  search: wrap('<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>'),
  expand: wrap('<path d="m7 15 5 5 5-5"/><path d="m7 9 5-5 5 5"/>'),
  collapse: wrap('<path d="m7 9 5 5 5-5"/><path d="m7 15 5-5 5 5"/>'),
  braces: wrap(
    '<path d="M8 3H7a2 2 0 0 0-2 2v5a2 2 0 0 1-2 2 2 2 0 0 1 2 2v5a2 2 0 0 0 2 2h1"/><path d="M16 21h1a2 2 0 0 0 2-2v-5a2 2 0 0 1 2-2 2 2 0 0 1-2-2V5a2 2 0 0 0-2-2h-1"/>'
  ),
  alert: wrap(
    '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/>'
  ),
  x: wrap('<path d="M18 6 6 18"/><path d="m6 6 12 12"/>'),
} as const

export type IconName = keyof typeof icons
