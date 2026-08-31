/** @type {import('tailwindcss').Config} */
import { iconsPlugin, getIconCollections, dynamicIconsPlugin } from '@egoist/tailwindcss-icons'
import plugin from 'tailwindcss/plugin'

export default {
  darkMode: ['selector', '.dark'],
  theme: {
    extend: {
      // ── 色彩系统 ──────────────────────────────────────
      colors: {
        // 主色系：Deep Tech Blue (#0052D4)
        primary: {
          50: '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#3B82F6',
          600: '#0052D4', // 核心主色
          700: '#003DB0',
          800: '#002A8A',
          900: '#001A66',
          950: '#000E3D',
        },

        // 中性色系：冷色调灰
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

        // 点缀色：Emerald
        accent: {
          DEFAULT: '#00A86B',
          50: '#ECFDF5',
          400: '#34D399',
          500: '#00A86B',
          600: '#059669',
        },
      },

      // ── 圆角 Token ────────────────────────────────────
      borderRadius: {
        'card': '16px',
        'card-sm': '12px',
        'button': '12px',
        'pill': '9999px',
        'input': '8px',
        'modal': '24px',
      },

      // ── 过渡时长 Token ─────────────────────────────────
      transitionDuration: {
        'fast': '150ms',
        'normal': '250ms',
        'slow': '350ms',
      },

      // ── 阴影 Token ────────────────────────────────────
      boxShadow: {
        'card': '0 1px 3px 0 rgb(0 0 0 / 0.06)',
        'card-hover': '0 10px 25px -5px rgb(0 0 0 / 0.08), 0 0 0 1px rgb(0 82 212 / 0.12)',
        'dropdown': '0 10px 25px -5px rgb(0 0 0 / 0.1)',
        'modal': '0 25px 50px -12px rgb(0 0 0 / 0.15)',
        'brand': '0 4px 14px 0 rgb(0 82 212 / 0.3)',
        'brand-lg': '0 8px 24px 0 rgb(0 82 212 / 0.35)',
      },

      // ── 字体族 ────────────────────────────────────────
      fontFamily: {
        sans: [
          'Inter Variable', 'Inter', 'ui-sans-serif', 'system-ui', '-apple-system',
          'PingFang SC', 'Microsoft YaHei', 'Noto Sans SC',
          'Noto Sans JP', 'sans-serif',
        ],
      },

      // ── 排版层级 ──────────────────────────────────────
      fontSize: {
        'display': ['clamp(2.5rem, 5vw, 4rem)', { lineHeight: '1.1', fontWeight: '800', letterSpacing: '-0.03em' }],
        'h2': ['clamp(1.75rem, 3vw, 2.5rem)', { lineHeight: '1.2', fontWeight: '700', letterSpacing: '-0.02em' }],
      },

      // ── 动画 ──────────────────────────────────────────
      animation: {
        float: 'float 6s ease-in-out infinite',
        'fade-in': 'fadeIn 0.3s ease-out',
        'fade-in-fast': 'fadeIn 0.15s ease-out',
        'slide-up': 'slideUp 0.35s ease-out',
        'scale-in': 'scaleIn 0.25s cubic-bezier(0.4,0,0.2,1)',
        'slide-down': 'slideDown 0.25s cubic-bezier(0.4,0,0.2,1)',
        'link-scroll': 'link-scroll 30s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          from: { opacity: '0', transform: 'scale(0.95)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        slideDown: {
          from: { opacity: '0', transform: 'translateY(-8px)', maxHeight: '0' },
          to: { opacity: '1', transform: 'translateY(0)', maxHeight: '400px' },
        },
      },
    },
  },

  content: {
    files: [
      'srcDir/app/components/**/*.{vue,js,jsx,mjs,ts,tsx}',
      'srcDir/app/layouts/**/*.{vue,js,jsx,mjs,ts,tsx}',
      'srcDir/app/pages/**/*.{vue,js,jsx,mjs,ts,tsx}',
      'srcDir/app/plugins/**/*.{js,ts,mjs}',
      'srcDir/app/composables/**/*.{js,ts,mjs}',
      'srcDir/app/utils/**/*.{js,ts,mjs}',
      'srcDir/app/{A,a}pp.{vue,js,jsx,mjs,ts,tsx}',
      'srcDir/app/{E,e}rror.{vue,js,jsx,mjs,ts,tsx}',
      'srcDir/app/app.config.{js,ts,mjs}',
      'srcDir/app/app/spa-loading-template.html',
      'srcDir/app/assets/**/*.json',
    ],
  },

  plugins: [
    require('@tailwindcss/typography'),
    iconsPlugin({
      collections: getIconCollections(['lucide']),
    }),
    dynamicIconsPlugin(),

    // CSS 自定义属性注入
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

          '--container-page': '1200px',
          '--container-content': '900px',
          '--container-form': '600px',

          '--space-section': '64px',
          '--space-block': '32px',
          '--space-component': '16px',

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

  safelist: [
    'line',
    'shiki',
    {
      pattern: /^(line|token|highlight).*$/,
    },
  ],
}
