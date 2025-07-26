import type { Config } from 'tailwindcss'

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      animation: {
        'fade-in': 'fade-in 1s ease-out',
        'fade-in-delay': 'fade-in 1s ease-out 0.3s',
        'fade-in-delay-2': 'fade-in 1s ease-out 0.6s',
      },
      container: {
        center: true,
        padding: {
          DEFAULT: '1rem',
          sm: '2rem',
          lg: '4rem',
          xl: '5rem',
        },
      },
      colors: {
        'temple-orange': {
          50: '#fff7ed',
          500: '#f97316',
          600: '#ea580c',
        },
      },
    },
  },
  plugins: [],
} satisfies Config