/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Montserrat', 'sans-serif'],
      },
      colors: {
        // Brand colors
        'emov-purple': 'var(--emov-purple)',
        'emov-green': 'var(--emov-green)',
        // Background colors
        'bg-primary': 'var(--bg-primary)',
        'bg-secondary': 'var(--bg-secondary)',
        'bg-tertiary': 'var(--bg-tertiary)',
        'bg-card': 'var(--bg-card)',
        // Text colors
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-tertiary': 'var(--text-tertiary)',
        // Border colors
        'border-primary': 'var(--border-primary)',
        'border-secondary': 'var(--border-secondary)',
      },
      backgroundColor: {
        primary: 'var(--bg-primary)',
        secondary: 'var(--bg-secondary)',
        tertiary: 'var(--bg-tertiary)',
        card: 'var(--bg-card)',
      },
      textColor: {
        primary: 'var(--text-primary)',
        secondary: 'var(--text-secondary)',
        tertiary: 'var(--text-tertiary)',
      },
      borderColor: {
        primary: 'var(--border-primary)',
        secondary: 'var(--border-secondary)',
        DEFAULT: 'var(--border-primary)',
      },
      backgroundImage: {
        'emov-gradient': 'var(--emov-gradient)',
      },
      boxShadow: {
        'emov': '0 4px 6px -1px var(--shadow-color), 0 2px 4px -1px var(--shadow-color)',
      },
      transitionProperty: {
        'colors': 'background-color, border-color, color, fill, stroke',
      },
    },
  },
  plugins: [],
  darkMode: 'class',
  safelist: [
    'dark',
    'light',
    'bg-primary',
    'bg-secondary',
    'bg-tertiary',
    'text-primary',
    'text-secondary',
    'text-tertiary',
    'border-primary',
    'border-secondary',
  ],
}
