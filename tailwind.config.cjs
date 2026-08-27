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
        background: '#1c1c1e', // Apple macOS system dark background
        surface: '#242426', // Apple macOS sidebar & topbar surface
        'surface-subtle': '#2c2c2e', // Apple subtle card / pill background
        'surface-active': '#3a3a3c', // Exact New Note card gray from reference
        border: '#333336', // 1px subtle hairline Apple divider
        'text-primary': '#f5f5f7', // SF Pro crisp white
        'text-secondary': '#8e8e93', // SF Pro neutral gray
        'text-muted': '#636366', // SF Pro tertiary muted gray
        brand: {
          50: '#f6f6f7',
          100: '#e5e5ea',
          400: '#8e8e93',
          500: '#3a3a3c', // Apple Sleek Slate Gray
          600: '#2c2c2e',
          700: '#1c1c1e',
        },
        accent: {
          blue: '#007aff', // Apple macOS system blue
          purple: '#af52de',
          amber: '#f5a623', // Apple gold (stars)
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
