/** @type {import('tailwindcss').Config} */
// Design tokens copied verbatim from the site's tailwind.config.js so the
// extension keeps the same Deep Tech Blue palette, radii, shadows and font.
// Removed: ESM-incompatible require(), Nuxt srcDir/ globs, Iconify/typography
// plugins and the Shiki safelist (all irrelevant to a WXT app).
import plugin from 'tailwindcss/plugin'

export default {
  darkMode: ['selector', '.dark'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#3B82F6',
          600: '#0052D4',
          700: '#003DB0',
          800: '#002A8A',
          900: '#001A66',
          950: '#000E3D',
        },
        surface: {
          0: '#ffffff',
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },
        accent: {
          DEFAULT: '#00A86B',
          50: '#ECFDF5',
          400: '#34D399',
          500: '#00A86B',
          600: '#059669',
        },
      },
      borderRadius: {
        card: '16px',
        'card-sm': '12px',
        button: '12px',
        pill: '9999px',
        input: '8px',
        modal: '24px',
      },
      transitionDuration: {
        fast: '150ms',
        normal: '250ms',
        slow: '350ms',
      },
      boxShadow: {
        card: '0 1px 3px 0 rgb(0 0 0 / 0.06)',
        'card-hover': '0 10px 25px -5px rgb(0 0 0 / 0.08), 0 0 0 1px rgb(0 82 212 / 0.12)',
        dropdown: '0 10px 25px -5px rgb(0 0 0 / 0.1)',
        modal: '0 25px 50px -12px rgb(0 0 0 / 0.15)',
        brand: '0 4px 14px 0 rgb(0 82 212 / 0.3)',
        'brand-lg': '0 8px 24px 0 rgb(0 82 212 / 0.35)',
      },
      fontFamily: {
        sans: [
          'Inter Variable', 'Inter', 'ui-sans-serif', 'system-ui', '-apple-system',
          'PingFang SC', 'Microsoft YaHei', 'Noto Sans SC',
          'Noto Sans JP', 'sans-serif',
        ],
      },
    },
  },

  content: {
    files: [
      './entrypoints/**/*.{vue,ts,html}',
      './components/**/*.{vue,ts}',
      './composables/**/*.ts',
      './utils/**/*.ts',
    ],
  },

  plugins: [
    // CSS custom-property injector (same as the site). NOTE: these :root/.dark
    // variables do NOT cross a shadow boundary — the on-page viewer uses the
    // package's own --je-* tokens instead and never loads this stylesheet.
    plugin(({ addBase, theme }) => {
      addBase({
        ':root': {
          '--color-primary': theme('colors.primary.600'),
          '--color-primary-hover': theme('colors.primary.700'),
          '--color-primary-soft': theme('colors.primary.50'),
          '--color-accent': theme('colors.accent.500'),
          '--color-accent-soft': theme('colors.accent.50'),
          '--color-surface': theme('colors.surface.0'),
          '--color-surface-raised': theme('colors.surface.50'),
          '--color-background': theme('colors.surface.0'),
          '--color-foreground': theme('colors.surface.900'),
          '--color-muted': theme('colors.surface.500'),
          '--color-border': theme('colors.surface.200'),
          '--color-border-hover': theme('colors.surface.400'),
          '--color-destructive': '#DC2626',
          '--shadow-card': '0 1px 3px 0 rgb(0 0 0 / 0.06)',
          '--shadow-card-hover': '0 10px 25px -5px rgb(0 0 0 / 0.08), 0 0 0 1px rgb(0 82 212 / 0.12)',
          '--shadow-brand': '0 4px 14px 0 rgb(0 82 212 / 0.3)',
          '--duration-fast': '150ms',
          '--duration-normal': '250ms',
          '--duration-slow': '350ms',
          '--ease-standard': 'cubic-bezier(0.4, 0, 0.2, 1)',
        },
        '.dark': {
          '--color-primary': theme('colors.primary.500'),
          '--color-primary-hover': theme('colors.primary.400'),
          '--color-primary-soft': 'rgba(59,130,246,0.15)',
          '--color-accent': theme('colors.accent.400'),
          '--color-accent-soft': 'rgba(52,211,153,0.15)',
          '--color-surface': theme('colors.surface.800'),
          '--color-surface-raised': theme('colors.surface.700'),
          '--color-background': theme('colors.surface.950'),
          '--color-foreground': theme('colors.surface.100'),
          '--color-muted': theme('colors.surface.400'),
          '--color-border': 'rgba(148,163,184,0.2)',
          '--color-border-hover': theme('colors.surface.500'),
          '--color-destructive': '#EF4444',
          '--shadow-card': 'none',
          '--shadow-card-hover': '0 0 0 1px rgb(59 130 246 / 0.3)',
          '--shadow-brand': '0 4px 14px 0 rgb(59 130 246 / 0.2)',
        },
      })
    }),
  ],
}
