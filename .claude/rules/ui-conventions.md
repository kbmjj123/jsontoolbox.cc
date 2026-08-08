# UI Conventions

## Design System

- **Primary Color**: Deep Tech Blue (#0052D4)
- **Font**: Inter (via @fontsource)
- **Border Radius**: 16px (card), 12px (button), 8px (input)
- **Shadows**: Use `shadow-card`, `shadow-card-hover`, `shadow-brand`

## Dark Mode

- Use `dark:` Tailwind prefix for dark mode styles
- Color mode is managed by `@nuxtjs/color-mode`
- Toggle via `useColorMode()` composable

## Responsive

- Mobile-first approach
- Use `sm:`, `md:`, `lg:` breakpoints
- Max content width: 1200px

## Transitions

- Use Vue `<Transition>` component
- Named transitions: `modal-fade`, `drawer-slide`, `lang-drop`
- Duration: 150ms (fast), 250ms (normal), 350ms (slow)
