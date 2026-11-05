/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        background: '#0e0e10',
        surface: '#161618',
        border: '#27272a',
        text: '#ededed',
        muted: {
          DEFAULT: '#a1a1aa',
          foreground: '#a1a1aa',
        },
        // shadcn/ui semantic tokens mapped onto the strict palette
        foreground: '#ededed',
        card: { DEFAULT: '#161618', foreground: '#ededed' },
        popover: { DEFAULT: '#161618', foreground: '#ededed' },
        primary: { DEFAULT: '#ededed', foreground: '#0e0e10' },
        secondary: { DEFAULT: '#161618', foreground: '#ededed' },
        accent: { DEFAULT: '#27272a', foreground: '#ededed' },
        destructive: '#ef4444',
        input: '#27272a',
        ring: '#a1a1aa',
      },
    },
  },
  plugins: [],
}
