/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        emerald: {
          dark: '#0B422A',
          light: '#116A43',
        },
        black: {
          DEFAULT: '#121212',
          soft: '#1E1E1E',
        },
        cream: {
          DEFAULT: '#F4F1E1',
          dark: '#E6E2CE',
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
