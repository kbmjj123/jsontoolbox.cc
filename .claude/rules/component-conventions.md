# Component Conventions

## Naming

- **PascalCase** for component files and names: `JsonFormatter.vue`, `TreeNode.vue`
- **kebab-case** in templates: `<json-formatter>`, `<tree-node>`

## File Organization

- `app/components/app/` — App shell (Header, Footer, Breadcrumb)
- `app/components/universal/` — Per-tool implementations
- `app/components/home/` — Homepage sections
- `app/components/Nav/` — Navigation components

## Props

- Use `defineProps<{}>()` with TypeScript interfaces
- Destructure with defaults: `const { size = 'md' } = defineProps<{}>()`

## Composables

- Use `useXxx()` pattern for shared logic
- Keep composables focused on a single concern
- Return reactive refs and computed properties

## Styling

- Use Tailwind CSS utility classes
- Use design tokens from `tailwind.config.js` (colors, shadows, etc.)
- Support dark mode with `dark:` prefix
