/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/renderer/index.html",
    "./src/renderer/src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: '#1e1e1e', // Apple macOS deep canvas charcoal
        surface: '#262626', // Apple macOS sidebar & topbar surface
        'surface-subtle': '#333333', // Apple subtle card / pill background
        'surface-active': '#383838', // Selected card (matching New Note in screenshot)
        border: '#2e2e2e', // 1px hairline subtle Apple divider
        'text-primary': '#f5f5f7', // SF Pro crisp white
        'text-secondary': '#a1a1a6', // SF Pro neutral gray
        'text-muted': '#6e6e73', // SF Pro tertiary muted gray
        brand: {
          50: '#fff9ed',
          100: '#fef1d6',
          400: '#fbbd42',
          500: '#f5a623', // Apple warm gold / amber
          600: '#e09612',
          700: '#c5800a',
        },
        accent: {
          blue: '#007aff', // Apple macOS system blue
          purple: '#af52de',
          amber: '#f5a623', // Apple gold
          red: '#ff453a', // Apple system red
          green: '#30d158', // Apple system green
        }
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"SF Pro Text"',
          '"SF Pro Display"',
          'system-ui',
          'sans-serif',
        ],
        mono: [
          'SFMono-Regular',
          'Menlo',
          'Monaco',
          'Consolas',
          'monospace',
        ],
      },
    },
  },
  plugins: [],
};
